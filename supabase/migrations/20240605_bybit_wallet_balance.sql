-- Función para generar la firma HMAC para la API de Bybit
CREATE OR REPLACE FUNCTION generate_bybit_signature(
  api_key TEXT,
  api_secret TEXT,
  timestamp BIGINT,
  recv_window BIGINT DEFAULT 5000,
  params TEXT DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pre_hash TEXT;
  signature TEXT;
BEGIN
  -- Crear el string pre-hash
  pre_hash := timestamp || api_key || recv_window;
  
  -- Añadir parámetros si existen
  IF params IS NOT NULL AND params != '' THEN
    pre_hash := pre_hash || params;
  END IF;
  
  -- Generar firma HMAC usando SHA256
  signature := ENCODE(HMAC(pre_hash::BYTEA, api_secret::BYTEA, 'sha256'), 'hex');
  
  RETURN signature;
END;
$$;

-- Función para obtener el balance de la wallet de Bybit
CREATE OR REPLACE FUNCTION get_bybit_wallet_balance(
  p_api_key TEXT,
  p_api_secret TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  timestamp BIGINT;
  signature TEXT;
  url TEXT;
  headers JSONB;
  response JSONB;
  result JSONB;
BEGIN
  -- Generar timestamp en milisegundos
  timestamp := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
  
  -- Generar la firma para la autenticación
  signature := generate_bybit_signature(p_api_key, p_api_secret, timestamp);
  
  -- Configurar la URL y headers para la petición
  url := 'https://api.bybit.com/v5/account/wallet-balance?accountType=SPOT';
  headers := jsonb_build_object(
    'X-BAPI-API-KEY', p_api_key,
    'X-BAPI-TIMESTAMP', timestamp::TEXT,
    'X-BAPI-RECV-WINDOW', '5000',
    'X-BAPI-SIGN', signature
  );
  
  -- Realizar la solicitud HTTP
  SELECT content::JSONB INTO response
  FROM http((
    'GET',
    url,
    headers,
    NULL,
    NULL
  )::http_request);
  
  -- Procesar y devolver el resultado
  RETURN response;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Función para procesar y formatear los activos de Bybit
CREATE OR REPLACE FUNCTION process_bybit_assets(
  wallet_balance JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  assets JSONB;
  total_balance NUMERIC := 0;
  asset_records JSONB := '[]'::JSONB;
  coin RECORD;
BEGIN
  -- Verificar si la respuesta es exitosa
  IF wallet_balance->>'retCode' = '0' THEN
    -- Obtener los datos de los activos
    assets := wallet_balance->'result'->'list'->0->'coin';
    
    -- Iterar sobre cada moneda y crear registros formateados
    FOR i IN 0..jsonb_array_length(assets) - 1
    LOOP
      SELECT * INTO coin FROM jsonb_to_record(assets->i) AS x(
        coin TEXT,
        walletBalance TEXT,
        free TEXT,
        locked TEXT,
        usdValue TEXT
      );
      
      -- Omitir activos con balance cero
      IF coin.walletBalance::NUMERIC > 0 THEN
        -- Añadir al array de activos
        asset_records := asset_records || jsonb_build_object(
          'coin', coin.coin,
          'walletBalance', coin.walletBalance::NUMERIC,
          'usdValue', coin.usdValue::NUMERIC
        );
        
        -- Sumar al balance total
        total_balance := total_balance + coin.usdValue::NUMERIC;
      END IF;
    END LOOP;
    
    -- Devolver el resultado formateado
    RETURN jsonb_build_object(
      'success', true,
      'balance', total_balance,
      'assets', asset_records
    );
  ELSE
    -- Devolver error si la respuesta no es exitosa
    RETURN jsonb_build_object(
      'success', false,
      'error', wallet_balance->>'retMsg',
      'code', wallet_balance->>'retCode'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Función principal para obtener balance y activos de Bybit
CREATE OR REPLACE FUNCTION fetch_bybit_assets(
  p_subaccount_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_api_key TEXT;
  v_api_secret TEXT;
  v_wallet_balance JSONB;
  v_user_id UUID;
BEGIN
  -- Verificar que la subcuenta existe y obtener credenciales
  SELECT 
    api_key, 
    secret_key,
    user_id
  INTO 
    v_api_key, 
    v_api_secret,
    v_user_id
  FROM vault.decrypted_secrets ds
  JOIN subaccounts s ON s.id = ds.subaccount_id
  WHERE s.id = p_subaccount_id;
  
  -- Verificar que se encontraron credenciales
  IF v_api_key IS NULL OR v_api_secret IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credenciales no encontradas para esta subcuenta'
    );
  END IF;
  
  -- Verificar que el usuario tiene acceso a esta subcuenta
  IF NOT EXISTS (
    SELECT 1 FROM subaccounts 
    WHERE id = p_subaccount_id 
    AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No tienes acceso a esta subcuenta'
    );
  END IF;
  
  -- Obtener el balance de la wallet
  v_wallet_balance := get_bybit_wallet_balance(v_api_key, v_api_secret);
  
  -- Procesar y devolver los activos formateados
  RETURN process_bybit_assets(v_wallet_balance);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Función accesible desde la API para obtener el balance de una subcuenta
CREATE OR REPLACE FUNCTION get_subaccount_balance(
  p_subaccount_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exchange TEXT;
  v_result JSONB;
BEGIN
  -- Obtener el tipo de exchange de la subcuenta
  SELECT exchange INTO v_exchange 
  FROM subaccounts 
  WHERE id = p_subaccount_id 
  AND user_id = auth.uid();
  
  -- Verificar que la subcuenta existe y pertenece al usuario
  IF v_exchange IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Subcuenta no encontrada o no tienes acceso'
    );
  END IF;
  
  -- Dirigir a la función correcta según el exchange
  CASE
    WHEN v_exchange = 'bybit' THEN
      v_result := fetch_bybit_assets(p_subaccount_id);
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Exchange no soportado: ' || v_exchange
      );
  END CASE;
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Concede permisos para que los usuarios autenticados puedan acceder a la función
GRANT EXECUTE ON FUNCTION get_subaccount_balance TO authenticated; 