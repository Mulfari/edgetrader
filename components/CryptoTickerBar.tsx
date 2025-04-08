import React, { useState, useEffect } from "react";

// Componente para mostrar precios de cryptos en movimiento
const CryptoTickerBar = () => {
  const [tickerItems, setTickerItems] = useState([
    { symbol: 'BTC', name: 'Bitcoin', price: '61,247.50', change: '+2.4%', positive: true, icon: '₿', color: 'from-orange-500 to-amber-600' },
    { symbol: 'ETH', name: 'Ethereum', price: '3,234.80', change: '+1.8%', positive: true, icon: 'Ξ', color: 'from-indigo-500 to-blue-600' },
    { symbol: 'SOL', name: 'Solana', price: '136.42', change: '-1.2%', positive: false, icon: 'S', color: 'from-fuchsia-500 to-purple-600' },
    { symbol: 'BNB', name: 'Binance', price: '584.31', change: '+0.7%', positive: true, icon: 'B', color: 'from-yellow-400 to-yellow-600' },
    { symbol: 'ADA', name: 'Cardano', price: '0.62', change: '+3.4%', positive: true, icon: 'A', color: 'from-blue-500 to-indigo-600' },
    { symbol: 'DOGE', name: 'Dogecoin', price: '0.17', change: '-0.5%', positive: false, icon: 'D', color: 'from-yellow-500 to-amber-500' },
    { symbol: 'XRP', name: 'Ripple', price: '0.52', change: '+1.1%', positive: true, icon: 'X', color: 'from-blue-500 to-cyan-600' },
    { symbol: 'DOT', name: 'Polkadot', price: '7.85', change: '+0.8%', positive: true, icon: '•', color: 'from-pink-500 to-rose-600' },
  ]);

  // Simular cambios en los precios cada 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerItems(items => 
        items.map(item => {
          // Generar una fluctuación aleatoria entre -1.5% y +1.5%
          const fluctuation = (Math.random() * 3 - 1.5) / 100;
          const currentPrice = parseFloat(item.price.replace(',', ''));
          const newPrice = currentPrice * (1 + fluctuation);
          
          // Calcular el nuevo cambio porcentual
          const changeValue = parseFloat(item.change.replace('%', '').replace('+', '').replace('-', ''));
          const newChangeValue = changeValue + (fluctuation * 100);
          const newPositive = newChangeValue >= 0;
          
          return {
            ...item,
            price: newPrice < 1 ? newPrice.toFixed(2) : newPrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
            change: `${newPositive ? '+' : '-'}${Math.abs(newChangeValue).toFixed(1)}%`,
            positive: newPositive
          };
        })
      );
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-950 to-gray-900 backdrop-blur-xl border-b border-gray-800/50 overflow-hidden">
      <div className="container mx-auto relative">
        {/* Eliminando la etiqueta "MERCADO" */}
        
        {/* Efecto de degradado en el lado derecho */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-gray-900 to-transparent z-10"></div>
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-gray-900 to-transparent z-10"></div>
        
        {/* Línea de separación */}
        <div className="h-px w-full absolute top-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
        <div className="h-px w-full absolute bottom-0 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
        
        {/* Contenedor del ticker con animación - ajustando el padding izquierdo */}
        <div className="py-3 overflow-hidden">
          <div className="flex space-x-12 animate-marquee whitespace-nowrap">
            {tickerItems.concat(tickerItems).map((item, index) => (
              <div 
                key={index} 
                className="group relative flex items-center space-x-3 px-2 py-1.5 rounded-lg transition-all duration-300 hover:bg-white/5"
              >
                {/* Tooltip con nombre completo */}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                  {item.name}
                </div>
                
                {/* Icono */}
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg shadow-${item.color.split(' ')[0]}/20`}>
                  <span className="text-white text-sm font-bold">{item.icon}</span>
                </div>
                
                {/* Símbolo */}
                <div className="flex flex-col">
                  <span className="text-gray-300 font-semibold text-sm">{item.symbol}</span>
                  <span className="text-gray-500 text-xs">USDT</span>
                </div>
                
                {/* Precio */}
                <div className="flex flex-col">
                  <span className="text-white font-medium">${item.price}</span>
                  <span className={`text-xs font-medium ${item.positive ? 'text-green-400' : 'text-red-400'}`}>
                    {item.change}
                    <span className={`text-xs ml-1 ${item.positive ? 'text-green-500' : 'text-red-500'}`}>
                      {item.positive ? '↑' : '↓'}
                    </span>
                  </span>
                </div>
                
                {/* Línea de separación */}
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