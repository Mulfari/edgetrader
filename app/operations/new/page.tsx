"use client";

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  Users,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import TradingViewChart from '@/components/TradingViewChart';
import Image from 'next/image';
import { useMarketData, MarketTicker } from '@/hooks/useMarketData';

interface SubAccount {
  id: string;
  name: string;
  balance: {
    btc: number;
    usdt: number;
  };
}

interface OrderSummary {
  marketType: 'spot' | 'futures';
  orderType: 'limit' | 'market';
  side: 'buy' | 'sell';
  price: string;
  amount: string;
  total: string;
  leverage: string | null;
  subAccounts: SubAccount[];
}

interface TradingPair {
  symbol: string;
  price: string;
  change: string;
  volume: string;
  leverage: string;
  favorite: boolean;
  high24h: string;
  low24h: string;
  volumeUSDT: string;
  interestRate: {
    long: string;
    short: string;
  };
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
  const { tickers, loading: marketLoading, error: marketError } = useMarketData();
  const [marketType, setMarketType] = useState<'spot' | 'futures'>('spot');
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
  const [selectedPair, setSelectedPair] = useState<MarketTicker>({
    symbol: 'BTC',
    price: '89033.97',
    change: '-1.62%',
    volume: '968.93M',
    high24h: '28,950.00',
    low24h: '28,150.00',
    volumeUSDT: '968.93M',
    leverage: '10x',
    favorite: false,
    interestRate: {
      long: '0.00%',
      short: '0.00%'
    }
  });

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

  // Función para formatear números con separadores de miles
  const formatNumber = (value: number | string) => {
    return Number(value).toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
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

  // Función para validar los parámetros de la orden
  const validateOrderParams = () => {
    if (!selectedSubAccounts.length) {
      return { valid: false, message: 'Debe seleccionar al menos una subcuenta' };
    }
    if (!price && orderType === 'limit') {
      return { valid: false, message: 'El precio es requerido para órdenes límite' };
    }
    if (!amount) {
      return { valid: false, message: 'La cantidad es requerida' };
    }
    if (!validateBalance()) {
      return { valid: false, message: 'Balance insuficiente para esta operación' };
    }
    return { valid: true, message: '' };
  };

  // Función para preparar el resumen de la orden
  const prepareOrderSummary = () => {
    const summary: OrderSummary = {
      marketType,
      orderType,
      side,
      price: orderType === 'market' ? 'Mercado' : price,
      amount,
      total,
      leverage: marketType === 'futures' ? leverage : null,
      subAccounts: selectedSubAccounts
        .map(id => subAccounts.find(acc => acc.id === id))
        .filter((acc): acc is SubAccount => acc !== undefined)
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
                      console.error(`Error loading image for ${selectedPair.symbol}`);
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl font-bold text-white tracking-tight">{selectedPair.symbol}/USDT</span>
                    <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform duration-300 group-hover:rotate-180`} />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm text-zinc-400 font-medium">{marketType === 'futures' ? 'Perpetual' : 'Spot'}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                    <span className="text-sm text-zinc-400 font-medium">{selectedPair.leverage} Leverage</span>
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
                  onClick={() => setMarketType('futures')}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                    marketType === 'futures'
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSearchResults(true)}
                    className="w-full bg-zinc-800 text-white placeholder-zinc-400 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow duration-200"
                    placeholder="Buscar por símbolo o nombre..."
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
                {marketLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : marketError ? (
                  <div className="flex items-center justify-center py-8 text-rose-500">
                    {marketError}
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
                            const newPairs = tickers.map(p => 
                              p.symbol === pair.symbol ? { ...p, favorite: !p.favorite } : p
                            );
                            console.log('Actualizando favoritos:', newPairs);
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
                              console.error(`Error loading image for ${pair.symbol}`);
                            }}
                          />
                        </div>
                        <span className="text-base font-medium text-white whitespace-nowrap min-w-0">{pair.symbol}/USDT</span>
                      </div>
                      <div className="text-right text-base font-medium text-white whitespace-nowrap">
                        {pair.price}
                      </div>
                      <div className={`text-right text-base font-medium whitespace-nowrap ${
                        pair.change.startsWith('-') 
                          ? 'text-rose-500' 
                          : 'text-emerald-500'
                      }`}>
                        {pair.change}
                      </div>
                    </div>
                  ))
                )}
                
                {filteredPairs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <svg className="w-12 h-12 text-zinc-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-sm text-zinc-400">No se encontraron pares de trading que coincidan con tu búsqueda</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Información del par */}
          <div className="flex items-center gap-12 px-8">
            <div className="flex flex-col">
              <div className="text-xl font-bold text-white tracking-tight">{selectedPair.price}</div>
              <div className="text-sm text-zinc-400">Index Price</div>
            </div>
            <div className="flex flex-col">
              <div className={`text-base font-medium ${selectedPair.change.startsWith('-') ? 'text-rose-500' : 'text-emerald-500'}`}>
                {selectedPair.change}
              </div>
              <div className="text-sm text-zinc-400">24H Change %</div>
            </div>
            <div className="flex flex-col">
              <div className="text-base font-medium text-white">{selectedPair.high24h}</div>
              <div className="text-sm text-zinc-400">24H High</div>
            </div>
            <div className="flex flex-col">
              <div className="text-base font-medium text-white">{selectedPair.low24h}</div>
              <div className="text-sm text-zinc-400">24H Low</div>
            </div>
            <div className="flex flex-col">
              <div className="text-base font-medium text-white">{selectedPair.volumeUSDT}</div>
              <div className="text-sm text-zinc-400">24H Turnover(USDT)</div>
            </div>
            <div className="flex flex-col">
              <div className="text-base font-medium text-white">
                {selectedPair.interestRate?.long || '0.00%'} | {selectedPair.interestRate?.short || '0.00%'}
              </div>
              <div className="text-sm text-zinc-400">Daily Interest Rate({selectedPair.symbol})</div>
            </div>
          </div>

          {/* Botones de la derecha */}
          <div className="ml-auto flex items-center gap-2">
            <button className="p-2 hover:bg-zinc-800 rounded-lg">
              <TrendingUp className="w-5 h-5 text-zinc-400" />
            </button>
            <button className="p-2 hover:bg-zinc-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-zinc-400" />
            </button>
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">BTC/USDT</h2>
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">28,450.00</span>
                <span className="text-sm font-medium text-emerald-500">+2.45%</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700">
                  <TrendingUp className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                </button>
                <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700">
                  <Clock className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                </button>
                <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700">
                  <AlertCircle className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                </button>
              </div>
            </div>
            <TradingViewChart 
              symbol="BTCUSDT"
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
                {marketType === 'futures' && (
                  <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Apalancamiento
                      </label>
                      <span className="text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        Riesgo: {parseFloat(leverage)}x
                      </span>
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
                  const validation = validateOrderParams();
                  if (!validation.valid) {
                    setError(validation.message);
                    return;
                  }
                  prepareOrderSummary();
                }}
                disabled={isLoading}
                className={`w-full mt-6 py-4 px-4 rounded-lg text-base font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-800 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                  side === 'buy'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/25 dark:shadow-emerald-900/40 focus:ring-emerald-500'
                    : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-rose-500/25 dark:shadow-rose-900/40 focus:ring-rose-500'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Procesando...</span>
                  </div>
                ) : (
                  `${side === 'buy' ? 'Comprar' : 'Vender'}`
                )}
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