import React, { useState, useEffect } from "react";
import Image from "next/image";

type TickerItem = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  positive: boolean;
  color: string;
  lastUpdated?: number;
};

const cryptoConfig = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', color: 'from-orange-500 to-amber-600' },
  { symbol: 'ETHUSDT', name: 'Ethereum', color: 'from-indigo-500 to-blue-600' },
  { symbol: 'SOLUSDT', name: 'Solana', color: 'from-fuchsia-500 to-purple-600' },
  { symbol: 'XRPUSDT', name: 'Ripple', color: 'from-blue-500 to-cyan-600' },
  { symbol: 'SUIUSDT', name: 'Sui', color: 'from-cyan-500 to-blue-600' },
  { symbol: 'ADAUSDT', name: 'Cardano', color: 'from-blue-500 to-indigo-600' },
  { symbol: 'LINKUSDT', name: 'Chainlink', color: 'from-blue-600 to-indigo-700' },
  { symbol: 'HBARUSDT', name: 'Hedera', color: 'from-purple-600 to-pink-600' },
  { symbol: 'TRXUSDT', name: 'Tron', color: 'from-red-500 to-rose-600' },
  { symbol: 'RNDRUSDT', name: 'Render', color: 'from-green-600 to-teal-600' },
  { symbol: 'AVAXUSDT', name: 'Avalanche', color: 'from-red-600 to-orange-600' },
  { symbol: 'BNBUSDT', name: 'Binance', color: 'from-yellow-400 to-yellow-600' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', color: 'from-yellow-500 to-amber-500' },
  { symbol: 'DOTUSDT', name: 'Polkadot', color: 'from-pink-500 to-rose-600' },
];

const CryptoTickerBar = () => {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>(
    cryptoConfig.map(config => ({
      ...config,
      price: '0.00',
      change: '0.00%',
      positive: true,
      symbol: config.symbol.replace('USDT', ''),
      lastUpdated: 0
    }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formateamos el precio según su valor
  const formatPrice = (price: number): string => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 100) return price.toFixed(2);
    return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  useEffect(() => {
    // Función para cargar los datos de precios una sola vez
    const fetchPriceData = async () => {
      try {
        setIsLoading(true);
        
        // Usamos un único endpoint para obtener todos los precios a la vez
        const response = await fetch('https://api.binance.com/api/v3/ticker/price');
        const allPrices = await response.json();
        
        // Para los datos de 24h, hacemos una solicitud separada
        const response24h = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const allData24h = await response24h.json();
        
        // Combinamos los datos
        setTickerItems(prevItems => {
          return prevItems.map(item => {
            const priceData = allPrices.find((p: any) => p.symbol === item.symbol + 'USDT');
            const data24h = allData24h.find((d: any) => d.symbol === item.symbol + 'USDT');
            
            if (priceData && data24h) {
              const price = parseFloat(priceData.price);
              const priceChange = parseFloat(data24h.priceChangePercent);
              
              return {
                ...item,
                price: formatPrice(price),
                change: `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`,
                positive: priceChange >= 0,
                lastUpdated: Date.now()
              };
            }
            return item;
          });
        });
        
        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los precios');
        setIsLoading(false);
      }
    };

    // Cargamos los datos una sola vez al montar el componente
    fetchPriceData();
    
    // No hay intervalos ni actualizaciones automáticas
  }, []);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-gray-900 via-gray-950 to-gray-900 backdrop-blur-xl border-b border-gray-800/50 py-3">
        <div className="container mx-auto text-center text-gray-400">
          <div className="animate-pulse flex justify-center items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
            <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
            <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-950 to-gray-900 backdrop-blur-xl border-b border-gray-800/50 overflow-hidden">
      <div className="container mx-auto relative">
        {error && (
          <div className="absolute top-0 left-0 right-0 bg-red-500/10 text-red-300 text-xs text-center py-0.5 z-20">
            {error}
          </div>
        )}
        
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-gray-900 to-transparent z-10"></div>
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-gray-900 to-transparent z-10"></div>
        
        <div className="h-px w-full absolute top-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
        <div className="h-px w-full absolute bottom-0 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
        
        <div className="py-3 overflow-hidden">
          <div className="flex space-x-12 animate-marquee whitespace-nowrap">
            {tickerItems.concat(tickerItems).map((item, index) => (
              <div 
                key={index} 
                className="group relative flex items-center space-x-3 px-2 py-1.5 rounded-lg transition-all duration-300 hover:bg-white/5"
              >
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                  {item.name}
                </div>
                
                {['BTC', 'ETH', 'SOL', 'XRP', 'SUI', 'ADA', 'LINK', 'HBAR', 'TRX', 'RENDER', 'AVAX', 'BNB', 'DOGE', 'DOT'].includes(item.symbol) ? (
                  <div className="w-6 h-6 flex items-center justify-center">
                    <Image
                      src={`/images/${item.symbol}.svg`}
                      alt={item.symbol}
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {item.symbol.charAt(0)}
                    </span>
                  </div>
                )}
                
                <div className="flex flex-col">
                  <span className="text-gray-300 font-semibold text-sm">{item.symbol}</span>
                  <span className="text-gray-500 text-xs">USDT</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-white font-medium">${item.price}</span>
                  <span className={`text-xs font-medium ${item.positive ? 'text-green-400' : 'text-red-400'}`}>
                    {item.change}
                    <span className={`text-xs ml-1 ${item.positive ? 'text-green-500' : 'text-red-500'}`}>
                      {item.positive ? '↑' : '↓'}
                    </span>
                  </span>
                </div>
                
                {index < tickerItems.length * 2 - 1 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-px bg-gray-700/30"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoTickerBar; 