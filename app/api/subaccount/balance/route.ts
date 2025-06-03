import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import crypto from 'crypto'; // Usar crypto de Node.js
import { HttpsProxyAgent } from 'https-proxy-agent'; // Importar el agente proxy
import axios from 'axios'; // Importar axios

// Helper para crear la firma HMAC-SHA256 en Node.js
function createNodeSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Configurar el agente proxy desde variables de entorno
const proxyUrl = process.env.DECODO_PROXY_URL;
let proxyAgent: HttpsProxyAgent<string> | undefined;
if (proxyUrl) {
  try {
    proxyAgent = new HttpsProxyAgent(proxyUrl);
    console.log("Proxy agent configured using DECODO_PROXY_URL.");
  } catch (e) {
    console.error("Failed to create proxy agent from DECODO_PROXY_URL:", e);
  }
} else {
  console.warn("DECODO_PROXY_URL environment variable not set. Proceeding without proxy.");
}

// Helper para obtener precio de BTC - REMOVED
// async function getBtcPrice(): Promise<number> { ... }

// Helper para obtener precios - REMOVED
// async function getTickerPrices(symbols: string[]): Promise<Record<string, number>> { ... }

export async function POST(request: Request) {
  let subaccountId: string | undefined;
  let exchangeName: string | undefined; // Mantener para logging

  try {
    const body = await request.json();
    subaccountId = body.subaccountId;

    if (!subaccountId) {
      return NextResponse.json({ success: false, error: 'Missing subaccountId' }, { status: 400 });
    }

    // Crear cliente Supabase...
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        console.error("Supabase URL or Service Role Key is missing in environment variables.");
        throw new Error("Server configuration error.");
    }
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        }
    });

    // Obtener claves...
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

    // *** Determinar si es Bybit (única opción ahora) ***
    if (!subaccountName.toLowerCase().includes('bybit')) {
        exchangeName = 'Unknown'; // Para el log de error
        console.error(`Subaccount name "${subaccountName}" does not seem to be a Bybit account.`);
        throw new Error(`Exchange type not recognized or not supported: ${subaccountName}`);
    }
    exchangeName = 'Bybit'; // Solo Bybit

    let balanceDataFromExchange: { balance: number; assets: Array<{ coin: string; walletBalance: number; usdValue: number; }> };
    let apiResponse: any;
    const timestamp = Date.now();
    console.log(`Using server timestamp for Bybit API call: ${timestamp}`, new Date(timestamp).toISOString());

    // --- Lógica de Bybit (única rama ahora) ---
    const bybitBaseUrl = isDemo ? 'https://api-demo.bybit.com' : 'https://api.bybit.com';
    const accountTypeParam = 'UNIFIED';
    const params = `accountType=${accountTypeParam}`;
    const signPayload = `${timestamp}${apiKey}${params}`;
    const signature = createNodeSignature(signPayload, secretKey);
    const bybitUrl = `${bybitBaseUrl}/v5/account/wallet-balance`;

    const headersToSend = {
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-TIMESTAMP': String(timestamp),
      'X-BAPI-SIGN': signature,
      'Content-Type': 'application/json',
    };

    const response = await axios.get(bybitUrl, {
      params: { accountType: accountTypeParam },
      headers: headersToSend,
      httpsAgent: proxyAgent
    });

    apiResponse = response.data;
    if (response.status !== 200) throw new Error(`Bybit API Error ${response.status}: ${apiResponse?.retMsg || 'Unknown error'}`);
    if (apiResponse.retCode !== 0) throw new Error(`Bybit API Error (${apiResponse.retCode}): ${apiResponse.retMsg}`);

    // Procesar respuesta Bybit...
    let calculatedUsdTotalBybit = 0;
    const processedAssetsBybit = apiResponse.result?.list?.[0]?.coin?.map((asset: any) => {
         const usdVal = parseFloat(asset.usdValue || '0');
         calculatedUsdTotalBybit += usdVal;
         // Procesamiento mejorado de assets con más campos
         const walletBalance = parseFloat(asset.walletBalance || '0');
         const equity = parseFloat(asset.equity || '0');
         const unrealisedPnl = parseFloat(asset.unrealisedPnl || '0');
         const availableToWithdraw = parseFloat(asset.availableToWithdraw || '0');
         
         return { 
           coin: asset.coin, 
           walletBalance: walletBalance, 
           usdValue: usdVal,
           equity: equity,
           unrealisedPnl: unrealisedPnl,
           availableToWithdraw: availableToWithdraw
         };
    }).filter((a: any) => a.walletBalance > 0) || [];
    
    // Extraer información de balance a nivel de cuenta
    const accountInfo = apiResponse.result?.list?.[0];
    const totalMarginBalance = parseFloat(accountInfo?.totalMarginBalance || '0');
    const totalAvailableBalance = parseFloat(accountInfo?.totalAvailableBalance || '0');
    const totalWalletBalance = parseFloat(accountInfo?.totalWalletBalance || '0');
    const totalEquity = parseFloat(accountInfo?.totalEquity || '0');
    const totalPerpUPL = parseFloat(accountInfo?.totalPerpUPL || '0');
    const totalInitialMargin = parseFloat(accountInfo?.totalInitialMargin || '0');
    
    // *** Estructura de respuesta mejorada ***
    const responseData = {
        balanceUsd: calculatedUsdTotalBybit, // Para compatibilidad
        assets: processedAssetsBybit,
        // Nuevos campos específicos de Bybit
        accountInfo: {
          totalMarginBalance,
          totalAvailableBalance, 
          totalWalletBalance,
          totalEquity,
          totalPerpUPL,
          totalInitialMargin
        }
    };

    return NextResponse.json({ success: true, data: responseData });

  } catch (error) {
    // Mantener bloque catch mejorado
    console.error(`Error processing balance for subaccount ${subaccountId} (${exchangeName || 'Unknown'}):`, error);
    if (axios.isAxiosError(error)) {
         console.error("Original Axios error details:", {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            data: error.response?.data,
            config: { url: error.config?.url, method: error.config?.method, headers: error.config?.headers, params: error.config?.params }
        });
        const status = error.response?.status;
        const errorMsgFromServer = error.response?.data?.retMsg || error.message;
        // Simplificar mensaje de error cliente ya que solo es Bybit
        const clientErrorMessage = `Failed to fetch balance from Bybit (${status || error.code}): ${errorMsgFromServer}`;
         return NextResponse.json({ success: false, error: clientErrorMessage }, { status: status || 500 });
    } else {
        console.error("Original non-Axios error details:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        const clientErrorMessage = errorMessage.includes('subaccount') || errorMessage.includes('API key') ? errorMessage : `Failed to fetch balance from Bybit: ${errorMessage}`;
        return NextResponse.json({ success: false, error: clientErrorMessage }, { status: 500 });
    }
  }
}

// Definir handler para OPTIONS...
export async function OPTIONS(request: Request) {
  return new Response(null, { status: 200 });
} 