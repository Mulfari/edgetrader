import { NextRequest, NextResponse } from 'next/server';

// Tipos para la respuesta
interface Instrument {
    symbol: string;
    maxLeverage: string;
    contractType?: string;
    baseCoin?: string;
    quoteCoin?: string;
    tickSize?: string;
    minOrderQty?: string;
    lotSizeFilter?: {
        basePrecision: string;
        quotePrecision: string;
        minOrderQty: string;
        maxOrderQty: string;
    };
    priceFilter?: {
        minPrice: string;
        maxPrice: string;
        tickSize: string;
    };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const exchangeType = searchParams.get('exchangeType')?.toLowerCase();
  const isDemo = searchParams.get('isDemo') === 'true';

  if (!exchangeType || (exchangeType !== 'bybit' && exchangeType !== 'binance')) {
    return NextResponse.json({ success: false, error: 'Missing or invalid exchangeType parameter (use bybit or binance)' }, { status: 400 });
  }

  let requestUrl = '';
  let instruments: Instrument[] = [];

  try {
    if (exchangeType === 'bybit') {
      const category = 'linear'; // Futuros lineales (USDT)
      const baseUrl = isDemo ? 'https://api-demo.bybit.com' : 'https://api.bybit.com';
      requestUrl = `${baseUrl}/v5/market/instruments-info?category=${category}`;
      console.log(`Fetching Bybit instruments with leverage info: ${requestUrl}`);

      const response = await fetch(requestUrl, { next: { revalidate: 3600 } }); // Cache por 1 hora
      if (!response.ok) {
        throw new Error(`Bybit Instruments API Error ${response.status}`);
      }
      const data = await response.json();
      if (data.retCode !== 0) {
        throw new Error(`Bybit Instruments Logic Error (${data.retCode}): ${data.retMsg}`);
      }
      
      // Mapear respuesta de Bybit V5 con información completa
      instruments = data.result?.list?.map((item: any) => ({
          symbol: item.symbol,
          maxLeverage: item.leverageFilter?.maxLeverage || '1',
          contractType: item.contractType,
          baseCoin: item.baseCoin,
          quoteCoin: item.quoteCoin,
          tickSize: item.priceFilter?.tickSize,
          minOrderQty: item.lotSizeFilter?.minOrderQty,
          lotSizeFilter: {
            basePrecision: item.lotSizeFilter?.basePrecision || '0',
            quotePrecision: item.lotSizeFilter?.quotePrecision || '0',
            minOrderQty: item.lotSizeFilter?.minOrderQty || '0',
            maxOrderQty: item.lotSizeFilter?.maxOrderQty || '0'
          },
          priceFilter: {
            minPrice: item.priceFilter?.minPrice || '0',
            maxPrice: item.priceFilter?.maxPrice || '0',
            tickSize: item.priceFilter?.tickSize || '0'
          }
      })) || [];
      
      // Filtrar solo contratos activos y con apalancamiento > 1
      instruments = instruments.filter(inst => 
        inst.contractType === 'LinearPerpetual' && 
        parseFloat(inst.maxLeverage) > 1
      );

    } else if (exchangeType === 'binance') {
      const baseUrl = isDemo ? 'https://testnet.binancefuture.com' : 'https://fapi.binance.com';
      requestUrl = `${baseUrl}/fapi/v1/exchangeInfo`;
      console.log(`Fetching Binance instruments: ${requestUrl}`);

      const response = await fetch(requestUrl, { next: { revalidate: 3600 } }); // Cache por 1 hora
       if (!response.ok) {
        throw new Error(`Binance Instruments API Error ${response.status}`);
      }
      const data = await response.json();

      // Mapear respuesta de Binance Futures
      instruments = data.symbols?.filter((item: any) => 
          item.contractType === 'PERPETUAL' && // Solo perpetuos
          item.status === 'TRADING' && // Solo los que se tradean
          item.quoteAsset === 'USDT' // Solo pares USDT (lineales)
      ).map((item: any) => ({
          symbol: item.symbol,
          maxLeverage: '125', // Binance generalmente permite hasta 125x
          contractType: item.contractType,
          baseCoin: item.baseAsset,
          quoteCoin: item.quoteAsset,
          tickSize: item.filters?.find((f: any) => f.filterType === 'PRICE_FILTER')?.tickSize,
          minOrderQty: item.filters?.find((f: any) => f.filterType === 'LOT_SIZE')?.minQty,
      })) || [];
    }

    // Ordenar alfabéticamente
    instruments.sort((a, b) => a.symbol.localeCompare(b.symbol));

    console.log(`Found ${instruments.length} instruments for ${exchangeType} (${isDemo ? 'Demo' : 'Real'}) with leverage info`);
    return NextResponse.json({ success: true, data: instruments });

  } catch (error) {
    console.error(`Error fetching instruments from ${requestUrl}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: `Failed to fetch instruments: ${errorMessage}` }, { status: 500 });
  }
}

// Opcional: Handler para OPTIONS si se llama desde un origen diferente en algún momento
// export async function OPTIONS(request: Request) {
//   return new Response(null, { status: 200, headers: { /* CORS Headers */ } });
// } 