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

// Helper para obtener precio de BTC (simple)
async function getBtcPrice(): Promise<number> {
  try {
    // Usar API pública de Binance (no requiere auth)
    const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    if (!response.ok) {
      console.warn(`Failed to fetch BTC price from Binance: ${response.status}`);
      return 0; // Devolver 0 o manejar error si no se obtiene precio
    }
    const data = await response.json();
    const price = parseFloat(data?.price);
    if (isNaN(price)) {
        console.warn("Failed to parse BTC price from Binance response:", data);
        return 0;
    }
    console.log("Current BTC Price (USDT):", price);
    return price;
  } catch (error) {
    console.error("Error fetching BTC price:", error);
    return 0; // Devolver 0 en caso de error
  }
}

// Helper para obtener precios (MUY ampliado)
async function getTickerPrices(symbols: string[]): Promise<Record<string, number>> {
  if (symbols.length === 0) return {};
  const endpoint = `https://api.binance.com/api/v3/ticker/price?symbols=${JSON.stringify(symbols)}`;
  const prices: Record<string, number> = {};
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      console.warn(`Price fetch failed (${response.status}) for symbols: ${JSON.stringify(symbols)}. Trying individually.`);
      // Intentar obtener uno por uno si falla el batch
      for (const symbol of symbols) {
          const singleResponse = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
          if(singleResponse.ok) {
              const data = await singleResponse.json();
              const price = parseFloat(data?.price);
              if (!isNaN(price)) prices[symbol] = price;
          } else {
               console.warn(`Failed to fetch individual price for ${symbol}: ${singleResponse.status}`);
          }
      }
      return prices; // Devolver lo que se pudo obtener
    }
    const data = await response.json();
    if (Array.isArray(data)) {
        data.forEach((ticker: any) => {
            const price = parseFloat(ticker?.price);
            if (!isNaN(price)) prices[ticker.symbol] = price;
        });
    } else {
         console.warn("Unexpected batch price format from Binance:", data);
    }
    return prices;
  } catch (error) {
    console.error("Error fetching ticker prices:", error);
    return prices; // Devolver lo que se tenga si hay error
  }
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
    // console.log(`API Route received request for subaccountId: ${subaccountId}`); // Eliminado

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
    // console.log('Calling RPC get_decrypted_keys_for_subaccount...'); // Eliminado
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

    const { apiKey, secretKey, subaccountName, isDemo } = keysData;
    if (!apiKey || !secretKey || !subaccountName) {
      console.error('Retrieved empty API key or secret key for subaccount:', subaccountId);
      throw new Error('Invalid API credentials retrieved');
    }
    // console.log(`Successfully retrieved keys for subaccount: ${subaccountName}, Is Demo: ${isDemo}`); // Eliminado

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
    // console.log(`Detected exchange: ${exchangeName}`); // Eliminado

    let balanceDataFromExchange: { balance: number; assets: Array<{ coin: string; walletBalance: number; usdValue: number; }> };
    let apiResponse: any;
    const timestamp = Date.now();
    let prices: Record<string, number> = {}; // Para guardar precios si es Binance

    // --- Lógica Condicional ---
    if (isBybit) {
        // --- BYBIT API LOGIC (SIN recvWindow en firma - Intento 2) ---
        const bybitBaseUrl = isDemo ? 'https://api-demo.bybit.com' : 'https://api.bybit.com';
        const accountTypeParam = 'UNIFIED';
        const params = `accountType=${accountTypeParam}`;
        // const recvWindow = 5000; // No incluir en la firma para este endpoint

        // Firma V5 GET: timestamp + apiKey + queryString (SIN recvWindow)
        const signPayload = `${timestamp}${apiKey}${params}`;
        // console.log(`Bybit Sign Payload (No RecvWindow - accountType=${accountTypeParam}):`, signPayload); // Eliminado

        const signature = createNodeSignature(signPayload, secretKey);
        const bybitUrl = `${bybitBaseUrl}/v5/account/wallet-balance?${params}`;

        // console.log(`Calling Bybit API (${isDemo ? 'Demo Trading' : 'Mainnet'}) for ${subaccountName}... URL: ${bybitUrl}`); // Eliminado
        const headersToSend = {
          'X-BAPI-API-KEY': apiKey,
          'X-BAPI-TIMESTAMP': String(timestamp),
          // No enviar X-BAPI-RECV-WINDOW si no está en la firma
          'X-BAPI-SIGN': signature,
          'Content-Type': 'application/json',
        };
        // console.log(`Calling Bybit API (${isDemo ? 'Demo Trading' : 'Mainnet'}) Headers:`, JSON.stringify(headersToSend)); // Eliminado

        const response = await fetch(bybitUrl, {
          method: 'GET',
          headers: headersToSend, 
        });
        // console.log('Bybit API status:', response.status); // Eliminado

        const responseText = await response.text();
        // console.log('Bybit API Raw Response Text:', responseText); // Eliminado (Quizás mantener para errores 401?) - Lo dejo comentado

        try {
            apiResponse = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse Bybit JSON response:', parseError, {responseText}); // Añadir contexto al error
            throw new Error(`Bybit API returned non-JSON response (status ${response.status}). Check raw text log.`);
        }

        if (!response.ok) throw new Error(`Bybit API Error ${response.status}: ${apiResponse?.retMsg || 'Unknown - Check raw text log.'}`);
        if (apiResponse.retCode !== 0) throw new Error(`Bybit API Error (${apiResponse.retCode}): ${apiResponse.retMsg}`);
        // console.log('Bybit API call successful.'); // Eliminado

        // Procesar respuesta Bybit (sumar usdValue)
        let calculatedUsdTotalBybit = 0;
        const processedAssetsBybit = apiResponse.result?.list?.[0]?.coin?.map((asset: any) => {
             const usdVal = parseFloat(asset.usdValue || '0');
             calculatedUsdTotalBybit += usdVal;
             return { coin: asset.coin, walletBalance: parseFloat(asset.walletBalance || '0'), usdValue: usdVal };
        }).filter((a: any) => a.walletBalance > 0) || []; // Filtrar 0 balance

        balanceDataFromExchange = {
             balance: calculatedUsdTotalBybit, 
             assets: processedAssetsBybit
        };
        // --- FIN BYBIT API LOGIC ---

    } else if (isBinance) {
        // --- BINANCE API LOGIC ---
        const binanceBaseUrl = isDemo ? 'https://testnet.binance.vision' : 'https://api.binance.com';
        const endpoint = '/api/v3/account';
        const recvWindowBinance = 5000; // Binance sí lo usa en la query string firmada
        const queryString = `recvWindow=${recvWindowBinance}&timestamp=${timestamp}`;

        // console.log(`Generating Binance signature with querystring: ${queryString}`); // Eliminado
        const signature = createNodeSignature(queryString, secretKey);
        const requestUrl = `${binanceBaseUrl}${endpoint}?${queryString}&signature=${signature}`;

        // console.log(`Calling Binance API (${isDemo ? 'Testnet' : 'Mainnet'}) for ${subaccountName}... URL: ${requestUrl}`); // Eliminado
        const headersToSendBinance = { // Loguear también para Binance por consistencia
            'X-MBX-APIKEY': apiKey,
            'Content-Type': 'application/json'
        };
        // console.log(`Calling Binance API (${isDemo ? 'Testnet' : 'Mainnet'}) Headers:`, JSON.stringify(headersToSendBinance)); // Eliminado

        const response = await fetch(requestUrl, {
            method: 'GET',
            headers: headersToSendBinance, // Usar el objeto
        });
        // console.log('Binance API status:', response.status); // Eliminado

        // Binance también puede devolver no-JSON en errores HTTP
        const responseTextBinance = await response.text();
        // console.log('Binance API Raw Response Text:', responseTextBinance); // Eliminado - Lo dejo comentado

        try {
            apiResponse = JSON.parse(responseTextBinance);
        } catch (parseError) {
             console.error('Failed to parse Binance JSON response:', parseError, {responseTextBinance}); // Añadir contexto al error
            throw new Error(`Binance API returned non-JSON response (status ${response.status}). Check raw text log.`);
        }

        if (!response.ok) {
             throw new Error(`Binance API HTTP Error ${response.status}: ${apiResponse?.msg || 'Unknown - Check raw text log.'}`);
        }
        if (apiResponse.code) {
            throw new Error(`Binance API Logic Error (${apiResponse.code}): ${apiResponse.msg}`);
        }
        // console.log('Binance API call successful.'); // Eliminado

        // Procesar respuesta Binance (calcular usdValue)
        const symbolsToFetch = ['BTCUSDT', 'ETHUSDT']; 
        prices = await getTickerPrices(symbolsToFetch);
        const btcPriceBinance = prices['BTCUSDT'] || 0;
        const ethPriceBinance = prices['ETHUSDT'] || 0;

        let calculatedUsdTotalBinance = 0;
        const processedAssetsBinance = apiResponse.balances?.map((asset: any) => {
             const walletBalance = parseFloat(asset.free || '0') + parseFloat(asset.locked || '0');
             let usdValue = 0;
             if (['USDT', 'BUSD', 'USDC'].includes(asset.asset)) { usdValue = walletBalance; }
             else if (asset.asset === 'BTC' && btcPriceBinance > 0) { usdValue = walletBalance * btcPriceBinance; }
             else if (asset.asset === 'ETH' && ethPriceBinance > 0) { usdValue = walletBalance * ethPriceBinance; }
             calculatedUsdTotalBinance += usdValue;
             return { coin: asset.asset, walletBalance: walletBalance, usdValue: usdValue };
        }).filter((asset: any) => asset.walletBalance > 0) || [];

        balanceDataFromExchange = {
            balance: calculatedUsdTotalBinance,
            assets: processedAssetsBinance
        };
        // --- FIN BINANCE API LOGIC ---
    } else {
         // Ya manejado arriba, pero por si acaso
         throw new Error("Could not determine exchange type.");
    }

    // --- Calcular valores en otras monedas ---
    let finalBalanceUsd = balanceDataFromExchange.balance;
    let finalBalanceBtc = 0;
    let finalBalanceEth = 0;
    let finalBalanceEur = 0;
    let finalBalanceGbp = 0;
    let finalBalanceUsdt = finalBalanceUsd;

    // Símbolos necesarios para conversión (sin JPY)
    const conversionSymbols = ['BTCUSDT', 'ETHUSDT', 'EURUSDT', 'GBPUSDT']; 

    // Reutilizar/Obtener precios
    const conversionPrices = (isBinance && Object.keys(prices).length > 0) ? 
        { ...prices, ...(await getTickerPrices(conversionSymbols.filter(s => !prices[s]))) } : 
        await getTickerPrices(conversionSymbols);
        
    const priceBtcUsdt = conversionPrices['BTCUSDT'];
    const priceEthUsdt = conversionPrices['ETHUSDT'];
    const priceEurUsdt = conversionPrices['EURUSDT'];
    const priceGbpUsdt = conversionPrices['GBPUSDT'];

    if (priceBtcUsdt && priceBtcUsdt > 0) finalBalanceBtc = finalBalanceUsd / priceBtcUsdt;
    else console.warn("Could not get BTCUSDT price for conversion."); 

    if (priceEthUsdt && priceEthUsdt > 0) finalBalanceEth = finalBalanceUsd / priceEthUsdt;
    else console.warn("Could not get ETHUSDT price for conversion.");

    if (priceEurUsdt && priceEurUsdt > 0) finalBalanceEur = finalBalanceUsd / priceEurUsdt;
    else console.warn("Could not get EURUSDT price for conversion."); 

    if (priceGbpUsdt && priceGbpUsdt > 0) finalBalanceGbp = finalBalanceUsd / priceGbpUsdt;
    else console.warn("Could not get GBPUSDT price for conversion."); 

    const responseData = {
        balanceUsd: finalBalanceUsd,
        balanceBtc: finalBalanceBtc,
        balanceEth: finalBalanceEth,
        balanceEur: finalBalanceEur,
        balanceGbp: finalBalanceGbp,
        balanceUsdt: finalBalanceUsdt,
        assets: balanceDataFromExchange.assets
    };

    // Devolver respuesta exitosa unificada con los nuevos balances
    return NextResponse.json({ success: true, data: responseData });

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