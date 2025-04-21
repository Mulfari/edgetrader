-- Funciones de autenticación y autorización
CREATE OR REPLACE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  	coalesce(
		nullif(current_setting('request.jwt.claim.email', true), ''),
		(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
	)::text
$$;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  	coalesce(
		nullif(current_setting('request.jwt.claim.role', true), ''),
		(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
	)::text
$$;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  	coalesce(
		nullif(current_setting('request.jwt.claim.sub', true), ''),
		(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
	)::uuid
$$;

-- Funciones de 2FA
CREATE OR REPLACE FUNCTION public.generate_totp_secret(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _secret text;
    _qr text;
    _user_email text;
BEGIN
    -- Obtener el email del usuario
    SELECT email INTO _user_email FROM auth.users WHERE id = user_id;
    IF _user_email IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Usuario no encontrado');
    END IF;

    -- Generar secreto TOTP
    _secret := encode(gen_random_bytes(20), 'base32');
    
    -- Generar URL para QR
    _qr := 'otpauth://totp/BTrade:' || _user_email || '?secret=' || _secret || '&issuer=BTrade&algorithm=SHA1&digits=6&period=30';

    -- Guardar el secreto en la tabla user_2fa
    INSERT INTO auth.user_2fa (user_id, secret, verified)
    VALUES (user_id, _secret, false)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        secret = EXCLUDED.secret,
        verified = false,
        updated_at = now();

    -- Registrar el intento en los logs
    INSERT INTO public.totp_verification_logs (
        user_id,
        verification_type,
        success,
        ip_address,
        user_agent
    ) VALUES (
        user_id,
        'setup',
        true,
        current_setting('request.headers')::jsonb->>'x-real-ip',
        current_setting('request.headers')::jsonb->>'user-agent'
    );

    RETURN jsonb_build_object(
        'success', true,
        'secret', _secret,
        'qr', _qr
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_totp(user_id uuid, token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _secret text;
    _verified boolean;
    _success boolean;
BEGIN
    -- Obtener el secreto TOTP del usuario
    SELECT secret, verified INTO _secret, _verified
    FROM auth.user_2fa
    WHERE user_id = user_id;

    IF _secret IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No se ha configurado 2FA para este usuario');
    END IF;

    -- Verificar el token
    _success := public.verify_totp_token(token, _secret);

    -- Registrar el intento en los logs
    INSERT INTO public.totp_verification_logs (
        user_id,
        verification_type,
        success,
        ip_address,
        user_agent
    ) VALUES (
        user_id,
        'verify',
        _success,
        current_setting('request.headers')::jsonb->>'x-real-ip',
        current_setting('request.headers')::jsonb->>'user-agent'
    );

    IF _success THEN
        -- Si es la primera verificación exitosa, actualizar el estado
        IF NOT _verified THEN
            UPDATE auth.user_2fa
            SET verified = true,
                updated_at = now()
            WHERE user_id = user_id;

            -- Actualizar el perfil del usuario
            UPDATE public.profiles
            SET is_2fa_enabled = true
            WHERE id = user_id;
        END IF;

        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Código inválido');
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_totp_token(token text, secret text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _current_timestamp bigint;
    _time_step integer := 30;
    _window integer := 1;
    _counter bigint;
    _expected_token text;
BEGIN
    -- Validar el formato del token
    IF token !~ '^\d{6}$' THEN
        RETURN false;
    END IF;

    -- Obtener timestamp actual en segundos
    _current_timestamp := extract(epoch from now())::bigint;

    -- Verificar tokens en la ventana de tiempo
    FOR i IN -_window.._window LOOP
        _counter := floor(_current_timestamp / _time_step)::bigint + i;
        _expected_token := public.generate_totp_token(secret, _counter::text);
        
        IF token = _expected_token THEN
            RETURN true;
        END IF;
    END LOOP;

    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_totp_token(secret text, counter text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _hmac bytea;
    _offset integer;
    _code integer;
BEGIN
    -- Generar HMAC-SHA1
    _hmac := hmac(decode(counter, 'hex'), decode(secret, 'base32'), 'sha1');
    
    -- Obtener offset
    _offset := get_byte(_hmac, length(_hmac) - 1) & 15;
    
    -- Generar código
    _code := (
        ((get_byte(_hmac, _offset) & 127) << 24) |
        (get_byte(_hmac, _offset + 1) << 16) |
        (get_byte(_hmac, _offset + 2) << 8) |
        get_byte(_hmac, _offset + 3)
    ) % 1000000;
    
    -- Formatear como string de 6 dígitos
    RETURN lpad(_code::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.disable_2fa(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _success boolean;
BEGIN
    -- Verificar si el usuario tiene 2FA habilitado
    IF NOT EXISTS (
        SELECT 1 
        FROM auth.user_2fa 
        WHERE user_id = user_id 
        AND verified = true
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', '2FA no está habilitado para este usuario');
    END IF;

    -- Eliminar la configuración 2FA
    DELETE FROM auth.user_2fa WHERE user_id = user_id;
    
    -- Actualizar el perfil del usuario
    UPDATE public.profiles
    SET is_2fa_enabled = false
    WHERE id = user_id;

    -- Registrar en los logs
    INSERT INTO public.totp_verification_logs (
        user_id,
        verification_type,
        success,
        ip_address,
        user_agent
    ) VALUES (
        user_id,
        'disable',
        true,
        current_setting('request.headers')::jsonb->>'x-real-ip',
        current_setting('request.headers')::jsonb->>'user-agent'
    );

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Funciones de Storage
CREATE OR REPLACE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO storage.objects (bucket_id, name, owner, metadata)
  VALUES (bucketid, name, owner, metadata);
  -- Ownership is handled by RLS policies
  DELETE FROM storage.objects
  WHERE bucket_id = bucketid
    AND name = name
    AND owner = owner;
END
$$;

CREATE OR REPLACE FUNCTION storage.extension(name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  _parts text[];
  _filename text;
BEGIN
  SELECT string_to_array(name, '/') INTO _parts;
  SELECT _parts[array_length(_parts,1)] INTO _filename;
  -- @todo return the last part instead of 2
  return split_part(_filename, '.', 2);
END
$$;

CREATE OR REPLACE FUNCTION storage.filename(name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  _parts text[];
BEGIN
  SELECT string_to_array(name, '/') INTO _parts;
  return _parts[array_length(_parts,1)];
END
$$;

CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[]
LANGUAGE plpgsql
AS $$
DECLARE
  _parts text[];
BEGIN
  SELECT string_to_array(name, '/') INTO _parts;
  return _parts[1:array_length(_parts,1)-1];
END
$$;

CREATE OR REPLACE FUNCTION storage.get_size_by_bucket()
RETURNS TABLE (
    size bigint,
    bucket_id text
)
LANGUAGE plpgsql
AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, objects.bucket_id
        from storage.objects
        group by objects.bucket_id;
END
$$;

CREATE OR REPLACE FUNCTION storage.search(prefix text, bucketname text, limits int DEFAULT 100, levels int DEFAULT 1, offsets int DEFAULT 0)
RETURNS TABLE (
    name text,
    id uuid,
    updated_at timestamptz,
    created_at timestamptz,
    last_accessed_at timestamptz,
    metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    return query
        with files_folders as (
            select path_tokens[1:levels] as folder
            from storage.objects
            where objects.name ilike prefix || '%'
            and bucket_id = bucketname
            GROUP by path_tokens[1:levels]
        )
        select objects.name, objects.id, objects.updated_at, objects.created_at, objects.last_accessed_at, objects.metadata
        from files_folders
        join storage.objects on objects.name = prefix || array_to_string(files_folders.folder, '/') 
        where objects.bucket_id = bucketname
        order by objects.name
        limit limits
        offset offsets;
END
$$; 