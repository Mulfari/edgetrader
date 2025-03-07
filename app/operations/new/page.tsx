"use client";

import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Users,
  Check,
  AlertCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import TradingViewChart from '@/components/TradingViewChart';
import Image from 'next/image';
import { useMarketData, SpotMarketTicker, PerpetualMarketTicker, MarketTicker } from '@/hooks/useMarketData';

interface SubAccount {
  id: string;
  name: string;
  balance: {
    btc: number;
    usdt: number;
  };
}

interface OrderSummary {
  marketType: 'spot' | 'perpetual';
  orderType: 'limit' | 'market';
  side: 'buy' | 'sell';
  price: string;
  amount: string;
  total: string;
  leverage: string | null;
  subAccounts: SubAccount[];
}

// Mapa de imágenes de activos (usando URLs de CoinGecko)
const tokenImages: { [key: string]: string } = {
  BTC: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1696501400',
  ETH: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1696501628',
  SOL: 'https://assets.coingecko.com/coins/images/4128/large/solana.png?1696504756',
  XRP: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png?1696501442',
  ADA: 'https://assets.coingecko.com/coins/images/975/large/cardano.png?1696502090',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png?1696512369',
  MATIC: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png?1696505280',
  DOT: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png?1696512153',
  default: 'https://assets.coingecko.com/coins/images/12148/large/token-default.png?1696512130'
};

export default function NewOperation() {
  const [marketType, setMarketType] = useState<'spot' | 'perpetual'>('spot');
  const { tickers, loading: marketLoading, error: marketError, toggleFavorite } = useMarketData(marketType);
  
  // Referencia para el intervalo de actualización manual
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Configurar actualización automática en segundo plano
  useEffect(() => {
    // Limpiar intervalo existente si hay uno
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // No necesitamos un intervalo manual adicional ya que el hook se actualiza automáticamente
    
    // Limpiar al desmontar
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);
  
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [total, setTotal] = useState<string>('');
  const [leverage, setLeverage] = useState<string>('1');
  const [selectedSubAccounts, setSelectedSubAccounts] = useState<string[]>([]);
  const [showSubAccountSelector, setShowSubAccountSelector] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuote, setSelectedQuote] = useState('USDT');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPair, setSelectedPair] = useState<MarketTicker>(
    tickers.find(ticker => ticker.symbol === 'BTC') || {
      symbol: 'BTC',
      price: '0.00',
      indexPrice: '0.00',
      change: '0.00%',
      volume: '0',
      high24h: '0.00',
      low24h: '0.00',
      volumeUSDT: '0',
      marketType: 'spot',
      bidPrice: '0.00',
      askPrice: '0.00',
      favorite: false
    } as SpotMarketTicker
  );

  // Actualizar selectedPair cuando los tickers cambien
  useEffect(() => {
    if (tickers.length > 0) {
      const currentPair = tickers.find(ticker => ticker.symbol === selectedPair.symbol);
      if (currentPair) {
        setSelectedPair(currentPair);
      } else {
        // Si no se encuentra el par actual, seleccionar el primero
        setSelectedPair(tickers[0]);
      }
    }
  }, [tickers, selectedPair.symbol]);

  // Actualizar selectedPair cuando cambia el tipo de mercado
  useEffect(() => {
    // Buscar el mismo símbolo en el nuevo tipo de mercado
    const symbol = selectedPair.symbol;
    console.log(`Market type changed to ${marketType}, looking for ${symbol} in tickers:`, tickers);
    
    const newPair = tickers.find(ticker => ticker.symbol === symbol);
    if (newPair) {
      console.log(`Found matching ticker for ${symbol} in ${marketType}:`, newPair);
      setSelectedPair(newPair);
    } else if (tickers.length > 0) {
      // Si no se encuentra, seleccionar el primero
      console.log(`No matching ticker found for ${symbol} in ${marketType}, using first available:`, tickers[0]);
      setSelectedPair(tickers[0]);
    }
  }, [marketType, tickers]);

  // Datos de ejemplo de subcuentas
  const subAccounts: SubAccount[] = [
    { id: '1', name: 'Principal', balance: { btc: 1.2451, usdt: 50000 } },
    { id: '2', name: 'Trading Diario', balance: { btc: 0.5123, usdt: 25000 } },
    { id: '3', name: 'Largo Plazo', balance: { btc: 2.1234, usdt: 75000 } },
    { id: '4', name: 'DCA', balance: { btc: 0.3456, usdt: 15000 } },
  ];

  // Filtrar pares según la búsqueda y pestaña activa
  const filteredPairs = tickers.filter(pair => {
    const matchesSearch = pair.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || (activeTab === 'favorites' && pair.favorite);
    return matchesSearch && matchesTab;
  });

  // Detectar el tema cuando el componente se monta (client-side)
  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  // Calcular el total cuando cambia el precio o la cantidad
  useEffect(() => {
    if (price && amount) {
      const totalValue = parseFloat(price) * parseFloat(amount);
      const leveragedValue = totalValue * parseFloat(leverage);
      setTotal(leveragedValue.toFixed(2));
    } else {
      setTotal('');
    }
  }, [price, amount, leverage]);

  // Función para ajustar el precio
  const adjustPrice = (increment: boolean) => {
    const step = 0.5;
    const currentPrice = parseFloat(price) || 28450.00;
    setPrice((increment ? currentPrice + step : currentPrice - step).toFixed(2));
  };

  // Función para ajustar la cantidad
  const adjustAmount = (increment: boolean) => {
    const step = 0.0001;
    const currentAmount = parseFloat(amount) || 0;
    setAmount((increment ? currentAmount + step : currentAmount - step).toFixed(4));
  };

  // Función para establecer el porcentaje de la cantidad disponible
  const setAmountPercentage = (percentage: number) => {
    const availableAmount = 1.2451;
    setAmount((availableAmount * (percentage / 100)).toFixed(4));
  };

  // Función para formatear números con validación
  const formatNumber = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Función para validar y formatear precios
  const safeFormatNumber = (value: string | undefined) => {
    if (!value || value === '0.00' || isNaN(parseFloat(value))) {
      return '0.00';
    }
    return formatNumber(parseFloat(value));
  };

  // Función para calcular el riesgo de la operación
  const calculateRisk = () => {
    if (!price || !amount || !leverage) return 0;
    const totalValue = parseFloat(price) * parseFloat(amount);
    const leveragedValue = totalValue * parseFloat(leverage);
    return leveragedValue;
  };

  // Función para validar el balance disponible
  const validateBalance = () => {
    const totalRisk = calculateRisk();
    const availableBalance = subAccounts
      .filter(acc => selectedSubAccounts.includes(acc.id))
      .reduce((sum, acc) => sum + acc.balance.usdt, 0);
    
    return totalRisk <= availableBalance;
  };

  // Función para calcular el total
  const calculateTotal = () => {
    if (!price || !amount) return '0';
    return (parseFloat(price) * parseFloat(amount)).toFixed(2);
  };

  // Función para validar los parámetros de la orden
  const validateOrderParams = (): boolean => {
    if (!price && orderType === 'limit') {
      setError('Por favor, ingrese un precio para la orden límite.');
      return false;
    }
    
    if (!amount) {
      setError('Por favor, ingrese una cantidad.');
      return false;
    }
    
    if (selectedSubAccounts.length === 0) {
      setError('Por favor, seleccione al menos una subcuenta.');
      return false;
    }
    
    // Validar balance
    if (!validateBalance()) {
      return false;
    }
    
    return true;
  };

  // Función para preparar el resumen de la orden
  const prepareOrderSummary = () => {
    if (!validateOrderParams()) {
      return;
    }
    
    const selectedAccounts = subAccounts.filter(account => 
      selectedSubAccounts.includes(account.id)
    );
    
    const summary: OrderSummary = {
      marketType: marketType,
      orderType,
      side,
      price: orderType === 'limit' ? price : 'Mercado',
      amount,
      total: calculateTotal(),
      leverage: marketType === 'perpetual' ? leverage : null,
      subAccounts: selectedAccounts
    };
    
    setOrderSummary(summary);
    setShowConfirmation(true);
  };

  // Función para ejecutar la orden
  const executeOrder = async () => {
    try {
      setIsLoading(true);
      // Aquí iría la lógica para enviar la orden a la API
      console.log('Ejecutando orden:', orderSummary);
      // Simular una llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowConfirmation(false);
      setSuccessMessage('Orden ejecutada exitosamente');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error al ejecutar la orden:', error);
      setError('Error al ejecutar la orden. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cerrar el panel de búsqueda al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchContainer = document.getElementById('search-container');
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Función para formatear el tiempo restante hasta el próximo funding
  const formatFundingCountdown = (nextFundingTime: number): string => {
    const now = Date.now();
    const timeLeft = nextFundingTime - now;
    
    if (timeLeft <= 0) return '00:00:00';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Estado para el countdown de funding
  const [fundingCountdown, setFundingCountdown] = useState<string>('00:00:00');

  // Actualizar el countdown cada segundo
  useEffect(() => {
    if (marketType === 'perpetual' && selectedPair && 'nextFundingTime' in selectedPair) {
      // Actualización inicial
      setFundingCountdown(formatFundingCountdown(selectedPair.nextFundingTime));
      
      // Actualizar cada segundo
      const interval = setInterval(() => {
        setFundingCountdown(formatFundingCountdown(selectedPair.nextFundingTime));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [selectedPair, marketType]);

  // Efecto para mostrar información en la consola sobre el par seleccionado
  useEffect(() => {
    if (marketType === 'perpetual' && selectedPair) {
      console.log('Selected perpetual pair:', selectedPair);
      
      // Verificar si el par tiene todas las propiedades necesarias
      if ('openInterest' in selectedPair) {
        console.log('Perpetual pair has all required properties');
      } else {
        console.warn('Perpetual pair is missing required properties:', selectedPair);
      }
    }
  }, [selectedPair, marketType]);

  // Función para formatear el countdown
  const formatCountdown = (nextFundingTime: number): string => {
    const now = Date.now();
    const diff = nextFundingTime - now;
    
    if (diff <= 0) {
      return 'Próximo funding';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Estado para forzar la actualización del countdown
  const [countdownKey, setCountdownKey] = useState(0);

  // Efecto para actualizar el countdown cada minuto
  useEffect(() => {
    if (marketType === 'perpetual') {
      const interval = setInterval(() => {
        setCountdownKey(prev => prev + 1);
      }, 60000); // Actualizar cada minuto
      
      return () => clearInterval(interval);
    }
  }, [marketType]);

  return (
    <div className="min-h-screen">
      {/* Barra superior de información del par */}
      <div className="bg-zinc-900 border-b border-zinc-800 rounded-2xl mx-4 mt-4">
        <div className="flex items-center h-16">
          {/* Selector de par con menú desplegable */}
          <div className="relative group">
            <div 
              className="flex items-center gap-3 px-8 h-16 border-r border-zinc-800 cursor-pointer hover:bg-zinc-800/50 transition-colors rounded-l-2xl"
            >
              <div className="flex items-center gap-5">
                <div className="relative w-12 h-12">
                  <Image
                    src={tokenImages[selectedPair.symbol] || tokenImages.default}
                    alt={selectedPair.symbol}
                    width={48}
                    height={48}
                    className="rounded-full ring-2 ring-violet-500/30"
                    priority
                    loading="eager"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = tokenImages.default;
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl font-bold text-white tracking-tight">{selectedPair.symbol}/USDT</span>
                    <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform duration-300 group-hover:rotate-180`} />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm text-zinc-400 font-medium">{marketType === 'perpetual' ? 'Perpetual' : 'Spot'}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                    <span className="text-sm text-zinc-400 font-medium">
                      {marketType === 'spot' ? 'Spot Trading' : 'Futuros'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menú desplegable */}
            <div className="absolute hidden group-hover:block top-full left-0 w-[420px] bg-zinc-900/95 backdrop-blur-sm border border-zinc-800 rounded-2xl shadow-2xl z-50 transform -translate-x-2 overflow-hidden">
              {/* Tabs de mercado */}
              <div className="flex items-center gap-1 p-3 border-b border-zinc-800">
                <button
                  onClick={() => setMarketType('spot')}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                    marketType === 'spot'
                      ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  Spot
                </button>
                <button
                  onClick={() => setMarketType('perpetual')}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                    marketType === 'perpetual'
                      ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  Futuros
                </button>
              </div>

              {/* Barra de búsqueda mejorada */}
              <div className="p-3 border-b border-zinc-800">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar activo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-300 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs de filtros mejorados */}
              <div className="flex items-center gap-1 p-3 border-b border-zinc-800">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                    activeTab === 'all'
                      ? 'bg-zinc-700 text-white shadow-lg'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  Todos los pares
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    activeTab === 'favorites'
                      ? 'bg-amber-500/20 text-amber-400 shadow-lg'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Favoritos
                </button>
              </div>

              {/* Lista de pares con scroll mejorado */}
              <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                <div className="sticky top-0 z-10 grid grid-cols-[2fr,1fr,1fr] gap-4 px-4 py-2.5 text-xs font-medium text-zinc-400 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
                  <div>Par de Trading</div>
                  <div className="text-right">Último Precio</div>
                  <div className="text-right">Cambio 24h</div>
                </div>
                {marketError ? (
                  <div className="flex flex-col items-center justify-center py-8 text-rose-500">
                    <AlertCircle className="w-6 h-6 mb-2" />
                    <p className="text-sm text-center px-4">{marketError}</p>
                  </div>
                ) : filteredPairs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <svg className="w-12 h-12 text-zinc-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-sm text-zinc-400">No se encontraron pares de trading que coincidan con tu búsqueda</p>
                  </div>
                ) : (
                  filteredPairs.map((pair) => (
                    <div
                      key={pair.symbol}
                      className="grid grid-cols-[2fr,1fr,1fr] gap-4 px-4 py-3 hover:bg-zinc-800/50 cursor-pointer transition-colors duration-150"
                      onClick={() => {
                        setSelectedPair(pair);
                        setShowSearchResults(false);
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(pair.symbol);
                          }}
                          className={`flex-shrink-0 text-amber-400 hover:text-amber-300 transition-colors duration-150 ${
                            pair.favorite ? 'opacity-100' : 'opacity-50'
                          }`}
                        >
                          {pair.favorite ? (
                            <svg className="w-5 h-5 drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          )}
                        </button>
                        <div className="relative w-8 h-8 flex-shrink-0">
                          <Image
                            src={tokenImages[pair.symbol] || tokenImages.default}
                            alt={pair.symbol}
                            fill
                            sizes="32px"
                            className="rounded-full ring-2 ring-violet-500/20 object-cover"
                            priority
                            loading="eager"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = tokenImages.default;
                            }}
                          />
                        </div>
                        <span className="text-base font-medium text-white whitespace-nowrap min-w-0">{pair.symbol}/USDT</span>
                      </div>
                      <div className="text-right text-base font-medium text-white whitespace-nowrap">
                        {safeFormatNumber(pair.price)}
                      </div>
                      <div className={`text-right text-base font-medium whitespace-nowrap ${
                        parseFloat(pair.change || '0') < 0 
                          ? 'text-rose-500' 
                          : 'text-emerald-500'
                      }`}>
                        {pair.change || '0.00%'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Información del par */}
          <div className="flex items-center gap-12 px-8">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-zinc-400 font-medium">Último precio</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{safeFormatNumber(selectedPair.price)}</span>
                <span className={`text-sm font-medium ${
                  parseFloat(selectedPair.change || '0') < 0 
                    ? 'text-rose-500' 
                    : 'text-emerald-500'
                }`}>
                  {selectedPair.change || '0.00%'}
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-xl font-bold text-white tracking-tight">{safeFormatNumber(selectedPair.high24h)}</div>
              <div className="text-sm text-zinc-400">Máximo 24h</div>
            </div>
            <div className="flex flex-col">
              <div className="text-xl font-bold text-white tracking-tight">{safeFormatNumber(selectedPair.low24h)}</div>
              <div className="text-sm text-zinc-400">Mínimo 24h</div>
            </div>
            <div className="flex flex-col">
              <div className="text-xl font-bold text-white tracking-tight">{selectedPair.volumeUSDT || '0'}</div>
              <div className="text-sm text-zinc-400">Volumen 24h</div>
            </div>
            
            {/* Información específica para futuros */}
            {marketType === 'perpetual' && selectedPair && (
              <>
                {/* Verificar si el par tiene las propiedades necesarias */}
                {'openInterest' in selectedPair ? (
                  <>
                    <div className="flex flex-col">
                      <div className="text-xl font-bold text-white tracking-tight">
                        {(selectedPair as PerpetualMarketTicker).openInterest || '0'}
                      </div>
                      <div className="text-sm text-zinc-400">Open Interest</div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-xl font-bold text-amber-400 tracking-tight">
                        {(selectedPair as PerpetualMarketTicker).fundingRate || '0.00%'}
                      </div>
                      <div className="text-sm text-zinc-400">Funding Rate</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-zinc-400" />
                      <span key={countdownKey} className="text-sm font-medium text-zinc-900 dark:text-white">
                        {formatCountdown((selectedPair as PerpetualMarketTicker).nextFundingTime)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col">
                    <div className="text-sm text-amber-500">Cargando datos de futuros...</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-4">
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panel del Gráfico */}
          <div className="lg:col-span-3 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-4">
            <TradingViewChart 
              symbol={`${selectedPair.symbol}USDT`}
              theme={theme}
            />
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Selector de Subcuentas */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-500" />
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-white">
                    Subcuentas Seleccionadas
                  </h3>
                </div>
                <button
                  onClick={() => setShowSubAccountSelector(!showSubAccountSelector)}
                  className="text-xs text-violet-500 hover:text-violet-600 dark:hover:text-violet-400"
                >
                  {showSubAccountSelector ? 'Cerrar' : 'Gestionar'}
                </button>
              </div>

              {showSubAccountSelector ? (
                <div className="space-y-2">
                  {subAccounts.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => {
                        if (selectedSubAccounts.includes(account.id)) {
                          setSelectedSubAccounts(selectedSubAccounts.filter(id => id !== account.id));
                        } else {
                          setSelectedSubAccounts([...selectedSubAccounts, account.id]);
                        }
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedSubAccounts.includes(account.id)
                          ? 'bg-violet-50 dark:bg-violet-900/20'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          selectedSubAccounts.includes(account.id)
                            ? 'bg-violet-500 border-violet-500'
                            : 'border-zinc-300 dark:border-zinc-600'
                        }`}>
                          {selectedSubAccounts.includes(account.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-zinc-900 dark:text-white">
                          {account.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-zinc-900 dark:text-white">
                            {account.balance.btc} BTC
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {account.balance.usdt} USDT
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedSubAccounts.length > 0 ? (
                    subAccounts
                      .filter(account => selectedSubAccounts.includes(account.id))
                      .map((account) => (
                        <div key={account.id} className="flex items-center justify-between p-2">
                          <span className="text-sm font-medium text-zinc-900 dark:text-white">
                            {account.name}
                          </span>
                          <div className="text-right">
                            <div className="text-sm font-medium text-zinc-900 dark:text-white">
                              {account.balance.btc} BTC
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              {account.balance.usdt} USDT
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-2">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        No hay subcuentas seleccionadas
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Panel de Operaciones */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-6">
              {/* Compra/Venta Tabs */}
              <div className="mb-8">
                <div className="flex items-stretch h-14 bg-zinc-100 dark:bg-zinc-700 rounded-lg p-1">
                  <button 
                    onClick={() => setSide('buy')}
                    className={`flex-1 text-base font-medium rounded-md transition-all duration-200 ${
                      side === 'buy'
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white/50 dark:hover:bg-zinc-600/50'
                    }`}
                  >
                    Comprar
                  </button>
                  <button 
                    onClick={() => setSide('sell')}
                    className={`flex-1 text-base font-medium rounded-md transition-all duration-200 ${
                      side === 'sell'
                        ? 'bg-rose-500 text-white shadow-lg'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white/50 dark:hover:bg-zinc-600/50'
                    }`}
                  >
                    Vender
                  </button>
                </div>
              </div>

              {/* Tipo de Orden */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Tipo de Orden
                </label>
                <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg p-1">
                  <button 
                    onClick={() => setOrderType('limit')}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      orderType === 'limit'
                        ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-600/50'
                    }`}
                  >
                    Límite
                  </button>
                  <button 
                    onClick={() => setOrderType('market')}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      orderType === 'market'
                        ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-600/50'
                    }`}
                  >
                    Mercado
                  </button>
                </div>
              </div>

              {/* Parámetros de la Orden */}
              <div className="space-y-6">
                {/* Precio */}
                {orderType === 'limit' && (
                  <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Precio
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          Mejor {side === 'buy' ? 'venta' : 'compra'}:
                        </span>
                        <span className={`text-xs font-medium ${
                          side === 'buy' ? 'text-rose-500' : 'text-emerald-500'
                        }`}>
                          28,450.00
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full pl-4 pr-24 py-3 text-base border-zinc-300 dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        placeholder="0.00"
                        step="0.01"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button 
                          onClick={() => adjustPrice(false)}
                          className="p-1.5 hover:text-violet-500 dark:hover:text-violet-400 bg-zinc-100 dark:bg-zinc-700 rounded-md mr-1"
                        >
                          <span className="text-sm font-medium">-</span>
                        </button>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400 mx-2">USDT</span>
                        <button 
                          onClick={() => adjustPrice(true)}
                          className="p-1.5 hover:text-violet-500 dark:hover:text-violet-400 bg-zinc-100 dark:bg-zinc-700 rounded-md ml-1"
                        >
                          <span className="text-sm font-medium">+</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cantidad con Porcentajes */}
                <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Cantidad
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        Disponible:
                      </span>
                      <span className="text-xs font-medium text-zinc-900 dark:text-white">
                        1.2451 BTC
                      </span>
                    </div>
                  </div>
                  <div className="relative mb-3">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-4 pr-24 py-3 text-base border-zinc-300 dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      placeholder="0.00"
                      step="0.0001"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button 
                        onClick={() => adjustAmount(false)}
                        className="p-1.5 hover:text-violet-500 dark:hover:text-violet-400 bg-zinc-100 dark:bg-zinc-700 rounded-md mr-1"
                      >
                        <span className="text-sm font-medium">-</span>
                      </button>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 mx-2">BTC</span>
                      <button 
                        onClick={() => adjustAmount(true)}
                        className="p-1.5 hover:text-violet-500 dark:hover:text-violet-400 bg-zinc-100 dark:bg-zinc-700 rounded-md ml-1"
                      >
                        <span className="text-sm font-medium">+</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[25, 50, 75, 100].map((percentage) => (
                      <button 
                        key={percentage}
                        onClick={() => setAmountPercentage(percentage)}
                        className="py-2 text-xs font-medium rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors relative overflow-hidden group"
                      >
                        <span className="relative z-10">{percentage}%</span>
                        <div 
                          className={`absolute inset-0 ${
                            side === 'buy' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                          } transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Apalancamiento (solo para futuros) */}
                {marketType === 'perpetual' && (
                  <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Apalancamiento
                      </label>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">{leverage}x</span>
                    </div>
                    <div className="relative mb-3">
                      <input
                        type="number"
                        value={leverage}
                        onChange={(e) => setLeverage(e.target.value)}
                        min="1"
                        max="100"
                        className="w-full pl-4 pr-8 py-3 text-base border-zinc-300 dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">x</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 5, 10, 20].map((value) => (
                        <button 
                          key={value}
                          onClick={() => setLeverage(value.toString())}
                          className="py-2 text-xs font-medium rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors relative overflow-hidden group"
                        >
                          <span className="relative z-10">{value}x</span>
                          <div 
                            className="absolute inset-0 bg-amber-500/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total y Resumen */}
                <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Total de la Orden
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        Disponible:
                      </span>
                      <span className="text-xs font-medium text-zinc-900 dark:text-white">
                        50,000 USDT
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={total}
                      readOnly
                      className="w-full pl-4 pr-16 py-3 text-base border-zinc-300 dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-lg bg-zinc-50 dark:bg-zinc-700/50 text-zinc-900 dark:text-white font-medium"
                      placeholder="0.00"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-4">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">USDT</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de Riesgo y Balance */}
              <div className="mt-6 p-4 rounded-lg space-y-3 border border-zinc-200 dark:border-zinc-700 bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-700/50 dark:to-zinc-700/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Riesgo Total</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {formatNumber(calculateRisk())} USDT
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Balance Disponible</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {formatNumber(
                      subAccounts
                        .filter(acc => selectedSubAccounts.includes(acc.id))
                          .reduce((sum, acc) => sum + acc.balance.usdt, 0)
                    )} USDT
                  </span>
                </div>
              </div>

              {/* Botón de Compra/Venta */}
              <button 
                onClick={() => {
                  if (!validateOrderParams()) {
                    return;
                  }
                  prepareOrderSummary();
                }}
                className={`w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors`}
              >
                Crear Orden
              </button>
            </div>

            {/* Book de Órdenes */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
                  Book de Órdenes
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Spread: 1.20 USDT</span>
                </div>
              </div>
              <div className="space-y-2">
                {/* Órdenes de venta */}
                <div className="relative">
                  <div className="absolute inset-0 bg-rose-500/5 dark:bg-rose-500/10 rounded-lg" style={{ width: '45%' }} />
                  <div className="relative flex items-center justify-between text-sm p-1">
                    <span className="text-rose-600 dark:text-rose-400 font-medium">28,450.00</span>
                    <span className="text-zinc-600 dark:text-zinc-400">0.5421 BTC</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-rose-500/5 dark:bg-rose-500/10 rounded-lg" style={{ width: '35%' }} />
                  <div className="relative flex items-center justify-between text-sm p-1">
                    <span className="text-rose-600 dark:text-rose-400 font-medium">28,449.50</span>
                    <span className="text-zinc-600 dark:text-zinc-400">0.3215 BTC</span>
                  </div>
                </div>

                {/* Precio actual */}
                <div className="py-2 border-y border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-900 dark:text-white">28,448.80</span>
                    <span className="text-emerald-500">↑ 2.45%</span>
                  </div>
                </div>

                {/* Órdenes de compra */}
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg" style={{ width: '65%' }} />
                  <div className="relative flex items-center justify-between text-sm p-1">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">28,448.20</span>
                    <span className="text-zinc-600 dark:text-zinc-400">0.8932 BTC</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg" style={{ width: '85%' }} />
                  <div className="relative flex items-center justify-between text-sm p-1">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">28,447.90</span>
                    <span className="text-zinc-600 dark:text-zinc-400">1.2451 BTC</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de Mercado */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">24h Vol:</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {selectedPair?.volumeUSDT || '0'}
                  </span>
                </div>
                {marketType === 'perpetual' && selectedPair && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">Open Interest:</span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        {(selectedPair as PerpetualMarketTicker).openInterest || '0'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">Funding Rate:</span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        {(selectedPair as PerpetualMarketTicker).fundingRate || '0.00%'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        {formatCountdown((selectedPair as PerpetualMarketTicker).nextFundingTime)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje de Éxito */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      {showConfirmation && orderSummary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">
              Confirmar Orden
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Tipo de Mercado</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {orderSummary.marketType === 'spot' ? 'Spot' : 'Futuros'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Tipo de Orden</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {orderSummary.orderType === 'market' ? 'Mercado' : 'Límite'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Lado</span>
                <span className={`text-sm font-medium ${
                  orderSummary.side === 'buy' ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {orderSummary.side === 'buy' ? 'Compra' : 'Venta'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Precio</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {orderSummary.price} USDT
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Cantidad</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {orderSummary.amount} BTC
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Total</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {orderSummary.total} USDT
                </span>
              </div>

              {orderSummary.leverage && (
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Apalancamiento</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {orderSummary.leverage}x
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Subcuentas</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {orderSummary.subAccounts.map((acc: SubAccount) => acc.name).join(', ')}
                </span>
              </div>

              {/* Riesgo de la Operación */}
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Riesgo Total</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {formatNumber(calculateRisk())} USDT
                </span>
              </div>

              {/* Balance Disponible */}
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Balance Disponible</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {formatNumber(
                    subAccounts
                      .filter(acc => selectedSubAccounts.includes(acc.id))
                        .reduce((sum, acc) => sum + acc.balance.usdt, 0)
                  )} USDT
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={isLoading}
                className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={executeOrder}
                disabled={isLoading}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                  side === 'buy'
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : 'bg-rose-500 hover:bg-rose-600'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Confirmando...</span>
                  </div>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 