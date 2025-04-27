import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import crypto from 'crypto'; // Usar crypto de Node.js

// Helper para crear la firma HMAC-SHA256 en Node.js
function createNodeSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

export async function POST(request: Request) {
  let subaccountId: string | undefined;
  let exchangeName: string | undefined; // Para guardar el nombre del exchange

  try {
    const body = await request.json();
    subaccountId = body.subaccountId;

    if (!subaccountId) {
      return NextResponse.json({ success: false, error: 'Missing subaccountId' }, { status: 400 });
    }
    console.log(`API Route received request for subaccountId: ${subaccountId}`);

    // Crear cliente Supabase con Service Role Key desde variables de entorno
    // Asegúrate de que estas variables estén disponibles en tu entorno de ejecución Next.js
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // ¡NO debe ser pública!

    if (!supabaseUrl || !serviceRoleKey) {
        console.error("Supabase URL or Service Role Key is missing in environment variables.");
        throw new Error("Server configuration error.");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            // Evitar guardar sesión o usar almacenamiento del navegador en el backend
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        }
    });

    // 1. Llamar a la función SQL segura para obtener las claves
    console.log('Calling RPC get_decrypted_keys_for_subaccount...');
    const { data: keysData, error: keysError } = await supabaseAdmin.rpc(
      'get_decrypted_keys_for_subaccount',
      { p_subaccount_id: subaccountId }
    );

    if (keysError) {
      console.error('Error fetching keys from RPC:', keysError);
      throw new Error(`Failed to retrieve keys: ${keysError.message}`);
    }

    if (!keysData || !keysData.success) {
      console.error('RPC call did not succeed or returned no data:', keysData);
      throw new Error(keysData?.error || 'Could not get API keys for subaccount');
    }

    const { apiKey, secretKey, subaccountName } = keysData;
    if (!apiKey || !secretKey || !subaccountName) {
      console.error('Retrieved empty API key or secret key for subaccount:', subaccountId);
      throw new Error('Invalid API credentials retrieved');
    }
    console.log(`Successfully retrieved keys for subaccount: ${subaccountName}`);

    // Determinar el exchange (simple check, ajustar si el formato del nombre es diferente)
    let isBinance = false;
    let isBybit = false;
    if (subaccountName.toLowerCase().includes('binance')) {
        isBinance = true;
        exchangeName = 'Binance';
    } else if (subaccountName.toLowerCase().includes('bybit')) {
        isBybit = true;
        exchangeName = 'Bybit';
    } else {
        // Asumir Bybit por defecto o manejar como error si no se reconoce
        // isBybit = true; // Opcion: Asumir Bybit
        // exchangeName = 'Bybit';
        throw new Error(`Exchange type not recognized from subaccount name: ${subaccountName}`);
    }
    console.log(`Detected exchange: ${exchangeName}`);

    let balanceData: { balance: number; assets: Array<{ coin: string; walletBalance: number; usdValue: number; }> };
    let apiResponse: any; // Para guardar la respuesta de la API

    // --- Lógica Condicional ---
    if (isBybit) {
        // --- BYBIT API LOGIC (como la teníamos) ---
        const timestamp = Date.now();
        const recvWindow = 5000;
        const params = 'accountType=UNIFIED';
        const signPayload = `${timestamp}${apiKey}${recvWindow}${params}`;
        const signature = createNodeSignature(signPayload, secretKey);
        const bybitUrl = `https://api.bybit.com/v5/account/wallet-balance?${params}`;

        console.log(`Calling Bybit API for ${subaccountName}...`);
        const response = await fetch(bybitUrl, {
          method: 'GET',
          headers: {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-TIMESTAMP': String(timestamp),
            'X-BAPI-RECV-WINDOW': String(recvWindow),
            'X-BAPI-SIGN': signature,
            'Content-Type': 'application/json',
          },
        });
        apiResponse = await response.json();
        console.log('Bybit API status:', response.status);

        if (!response.ok) throw new Error(`Bybit API Error ${response.status}: ${apiResponse?.retMsg || 'Unknown'}`);
        if (apiResponse.retCode !== 0) throw new Error(`Bybit API Error (${apiResponse.retCode}): ${apiResponse.retMsg}`);
        console.log('Bybit API call successful.');

        balanceData = {
            balance: parseFloat(apiResponse.result?.list?.[0]?.totalWalletBalance || '0'),
            assets: apiResponse.result?.list?.[0]?.coin?.map((asset: any) => ({
                coin: asset.coin,
                walletBalance: parseFloat(asset.walletBalance || '0'),
                usdValue: parseFloat(asset.usdValue || '0') // Bybit lo proporciona
            })) || []
        };
        // --- FIN BYBIT API LOGIC ---

    } else if (isBinance) {
        // --- BINANCE API LOGIC ---
        const timestamp = Date.now();
        const recvWindow = 5000; // Opcional para Binance, pero recomendado
        const binanceBaseUrl = 'https://api.binance.com'; // Usar api.binance.com, NO testnet
        const endpoint = '/api/v3/account';
        const queryString = `recvWindow=${recvWindow}&timestamp=${timestamp}`;

        console.log(`Generating Binance signature with querystring: ${queryString}`);
        const signature = createNodeSignature(queryString, secretKey);
        const requestUrl = `${binanceBaseUrl}${endpoint}?${queryString}&signature=${signature}`;

        console.log(`Calling Binance API for ${subaccountName}...`);
        const response = await fetch(requestUrl, {
            method: 'GET',
            headers: {
                'X-MBX-APIKEY': apiKey,
                'Content-Type': 'application/json'
            }
        });
        apiResponse = await response.json();
        console.log('Binance API status:', response.status);

        // Binance puede devolver errores directamente en el cuerpo con código 200, o error HTTP
        if (!response.ok) {
             throw new Error(`Binance API HTTP Error ${response.status}: ${apiResponse?.msg || 'Unknown'}`);
        }
        // Binance usa 'code' para errores lógicos (si existe)
        if (apiResponse.code) {
            throw new Error(`Binance API Logic Error (${apiResponse.code}): ${apiResponse.msg}`);
        }
        console.log('Binance API call successful.');

        // Procesar la respuesta de Binance (/api/v3/account)
        let totalUsdValue = 0; // Binance no da un total directo, lo calcularemos (aproximado)
        const assets = apiResponse.balances?.map((asset: any) => {
             const free = parseFloat(asset.free || '0');
             const locked = parseFloat(asset.locked || '0');
             const walletBalance = free + locked;
             // Intentar estimar valor USD (MUY BÁSICO: Asume que USDT/BUSD valen 1 USD)
             // Una solución real requeriría obtener tickers de precios
             let usdValue = 0;
             if (['USDT', 'BUSD', 'USDC', 'TUSD', 'FDUSD'].includes(asset.asset)) {
                 usdValue = walletBalance;
             }
             // TODO: Para otros activos, necesitaríamos llamar a /api/v3/ticker/price?symbol=BTCUSDT etc.
             // Por ahora, lo dejamos en 0 para otros, pero sumamos los estables al total.
             totalUsdValue += usdValue;

             return {
                coin: asset.asset,
                walletBalance: walletBalance,
                usdValue: usdValue // Valor USD (aproximado o 0)
             };
        }).filter((asset: any) => asset.walletBalance > 0) || []; // Filtrar balances 0

        balanceData = {
            balance: totalUsdValue, // Total USD aproximado de stablecoins
            assets: assets
        };
        // --- FIN BINANCE API LOGIC ---
    } else {
         // Ya manejado arriba, pero por si acaso
         throw new Error("Could not determine exchange type.");
    }

    // Devolver respuesta exitosa unificada
    return NextResponse.json({ success: true, data: balanceData });

  } catch (error) {
    console.error(`Error processing balance for subaccount ${subaccountId} (${exchangeName || 'Unknown'}):`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    // Evitar exponer detalles internos en producción si no es necesario
    const clientErrorMessage = errorMessage.includes('subaccount') || errorMessage.includes('API key') ? errorMessage : `Failed to fetch balance for ${exchangeName || 'exchange'}`;
    return NextResponse.json({ success: false, error: clientErrorMessage }, { status: 500 });
  }
}

// Definir handler para OPTIONS (aunque Next.js a menudo lo maneja, es buena práctica)
export async function OPTIONS(request: Request) {
  // Puedes añadir cabeceras CORS aquí si es necesario,
  // pero a menudo Vercel/Next.js maneja esto bien para rutas API del mismo origen.
  // Devolver una respuesta simple para OPTIONS
  return new Response(null, { status: 200 });
} 