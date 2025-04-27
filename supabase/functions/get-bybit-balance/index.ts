// supabase/functions/get-bybit-balance/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts'; // Necesitarás crear este archivo auxiliar

// Polyfill para crypto.subtle si es necesario en el entorno Deno/Edge
// (Puede que no sea estrictamente necesario con versiones recientes de Deno)
import 'https://deno.land/x/god_crypto@v1.4.11/mod.ts';

// Helper para crear la firma HMAC-SHA256
async function createSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const payloadData = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, payloadData);

  // Convert ArrayBuffer to hex string
  return Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}


serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Asegurarse de que la solicitud es POST
    if (req.method !== 'POST') {
      throw new Error('Method Not Allowed');
    }

    const { subaccountId } = await req.json();

    if (!subaccountId) {
      throw new Error('Missing subaccountId in request body');
    }

    console.log('Edge function received request for subaccountId:', subaccountId);

    // Crear cliente Supabase con Service Role Key (inyectada por Supabase)
    // Asegúrate de que las variables de entorno estén configuradas en tu proyecto Supabase
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      // No es necesario propagar Auth headers cuando se usa service_role para llamar a RPCs seguros
      { global: { headers: { 'Authorization': 'Bearer ' + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') } } } 
    );

    // 1. Llamar a la función SQL segura para obtener las claves
    console.log('Calling RPC get_decrypted_keys_for_subaccount...');
    const { data: keysData, error: keysError } = await supabaseAdminClient.rpc(
      'get_decrypted_keys_for_subaccount',
      { p_subaccount_id: subaccountId } // Asegúrate que el nombre del parámetro coincida
    );

    if (keysError) {
      console.error('Error fetching keys from RPC:', keysError);
      throw new Error(`Failed to retrieve keys: ${keysError.message}`);
    }

    if (!keysData || !keysData.success) {
      console.error('RPC call did not succeed or returned no data:', keysData);
      throw new Error(keysData?.error || 'Could not get API keys for subaccount');
    }

    const { apiKey, secretKey } = keysData;

    // Validar que las claves no estén vacías (por si acaso)
    if (!apiKey || !secretKey) {
      console.error('Retrieved empty API key or secret key');
      throw new Error('Invalid API credentials retrieved');
    }
    console.log('Successfully retrieved API keys.');

    // 2. Preparar llamada a la API de Bybit
    const timestamp = Date.now();
    const recvWindow = 5000;
    const params = ''; // GET Wallet Balance no necesita parámetros en V5
    const signPayload = `${timestamp}${apiKey}${recvWindow}${params}`;

    console.log('Generating signature...');
    const signature = await createSignature(signPayload, secretKey);
    console.log('Signature generated.');

    const bybitUrl = 'https://api.bybit.com/v5/account/wallet-balance?accountType=UNIFIED';

    // 3. Llamar a la API de Bybit
    console.log('Calling Bybit API...');
    const bybitResponse = await fetch(bybitUrl, {
      method: 'GET',
      headers: {
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-TIMESTAMP': String(timestamp),
        'X-BAPI-RECV-WINDOW': String(recvWindow),
        'X-BAPI-SIGN': signature,
        'Content-Type': 'application/json',
      },
    });

    console.log('Bybit API response status:', bybitResponse.status);
    const bybitResult = await bybitResponse.json();

    if (!bybitResponse.ok) {
      console.error('Bybit API Error:', bybitResult);
      throw new Error(`Bybit API request failed with status ${bybitResponse.status}: ${bybitResult?.retMsg || 'Unknown error'}`);
    }

    if (bybitResult.retCode !== 0) {
       console.error('Bybit API Error (retCode != 0):', bybitResult);
       throw new Error(`Bybit API Error (${bybitResult.retCode}): ${bybitResult.retMsg}`);
    }

    console.log('Bybit API call successful.');

    // 4. Procesar y devolver la respuesta
    const balanceData = {
        balance: parseFloat(bybitResult.result?.list?.[0]?.totalWalletBalance || '0'),
        assets: bybitResult.result?.list?.[0]?.coin?.map((asset: any) => ({
            coin: asset.coin,
            walletBalance: parseFloat(asset.walletBalance || '0'),
            usdValue: parseFloat(asset.usdValue || '0')
        })) || []
    };

    return new Response(
      JSON.stringify({ success: true, data: balanceData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in Edge Function:', error);
    // Devolver un código de estado adecuado basado en el tipo de error
    const status = error.message === 'Method Not Allowed' ? 405 : (error.message.includes('subaccountId') ? 400 : 500);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: status, 
      }
    );
  }
}); 