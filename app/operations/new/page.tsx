"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  TrendingUp, TrendingDown, Eye, EyeOff, AlertTriangle, Check, X, 
  DollarSign, Target, Users, Settings, ArrowRight, Info, Calculator,
  Clock, ArrowLeftRight, Home, BarChart2,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  List,
  LayoutGrid,
  ChevronUp,
  ChevronDown,
  Layers,
  Zap,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import OpenOperations from '@/components/OpenOperations';
import TradingPanel from '@/components/TradingPanel';
import SubAccountSelector from '@/components/SubAccountSelector';
import TradingViewChart from '@/components/TradingViewChart';
import { useMarketData, SpotMarketTicker, PerpetualMarketTicker, MarketTicker } from '@/hooks/useMarketData';
import { getUserSubaccounts, Subaccount } from '@/lib/supabase';

interface SubAccount {
  id: string;
  name: string;
  created_at: string;
  api_key: string;
  secret_key: string;
  is_demo: boolean;
  balance: {
    btc: number;
    usdt: number;
    eth?: number;
    [key: string]: number | undefined;
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
  subAccount: SubAccount;
  perpetualInfo?: {
    openInterest: number;
    symbol: string;
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
  DOGE: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png?1696501409',
  LINK: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png?1696502009',
  UNI: 'https://assets.coingecko.com/coins/images/12504/large/uni.jpg?1696512319',
  SHIB: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png?1696511800',
  LTC: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png?1696501400',
  BCH: 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png?1696501948',
  ATOM: 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png?1696502425',
  NEAR: 'https://assets.coingecko.com/coins/images/10365/large/near.jpg?1696510367',
  default: 'https://assets.coingecko.com/coins/images/12148/large/token-default.png?1696512130'
};

// Constantes para el caché (igual que en SubAccounts.tsx)
const CACHE_PREFIX = 'subaccount_balance_';
const SUBACCOUNTS_CACHE_KEY = 'subaccounts_cache'; // Clave para el caché de useSubAccounts

// Función de utilidad para acceder a localStorage de forma segura
const safeLocalStorage = {
  getItem: (key: string, defaultValue: any = null): any => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key) || defaultValue;
    }
    return defaultValue;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
};

// Estilos para las animaciones
const styles = `
  @keyframes pulseGreen {
    0% { background-color: rgba(16, 185, 129, 0.1); }
    50% { background-color: rgba(16, 185, 129, 0.3); }
    100% { background-color: rgba(16, 185, 129, 0.1); }
  }
  
  @keyframes pulseRed {
    0% { background-color: rgba(239, 68, 68, 0.1); }
    50% { background-color: rgba(239, 68, 68, 0.3); }
    100% { background-color: rgba(239, 68, 68, 0.1); }
  }
  
  @keyframes fadeIn {
    0% { opacity: 0; transform: translateY(-10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  
  .animate-pulse-green {
    animation: pulseGreen 2s ease-in-out;
  }
  
  .animate-pulse-red {
    animation: pulseRed 2s ease-in-out;
  }
  
  .animate-pulse-blue {
    animation: pulseBlue 2s ease-in-out;
  }
  
  @keyframes pulseBlue {
    0%, 100% { 
      background-color: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.3);
    }
    50% { 
      background-color: rgba(59, 130, 246, 0.3);
      border-color: rgba(59, 130, 246, 0.6);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
`;

interface Operation {
  id: string;
  subAccountId: string;
  symbol: string;
  side: 'buy' | 'sell';
  status: 'open' | 'closed' | 'canceled';
  price: number | null;
  quantity: number;
  filledQuantity?: number;
  remainingQuantity?: number;
  leverage?: number;
  openTime: Date;
  closeTime?: Date;
  profit?: number;
  profitPercentage?: number;
  fee?: number;
  exchange: string;
  // Campos adicionales para futuros
  markPrice?: number | null;
  liquidationPrice?: number | null;
  positionValue?: number | null;
}

export default function NewOperation() {
  const router = useRouter();
  const { user, loading, token } = useAuth();

  // Estados principales
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [selectedSubAccount, setSelectedSubAccount] = useState<string | null>(null);
  const [isLoadingSubAccounts, setIsLoadingSubAccounts] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Estados del trading
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [marketType, setMarketType] = useState<'spot' | 'perpetual'>('perpetual');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [leverage, setLeverage] = useState('1');
  const [total, setTotal] = useState('0');
  
  // Estados de la UI
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  
  // Estados de operaciones abiertas
  const [openOperations, setOpenOperations] = useState<Operation[]>([]);
  const [isLoadingOperations, setIsLoadingOperations] = useState(false);
  const [operationsError, setOperationsError] = useState<string | null>(null);
  const [lastOperationsPrices, setLastOperationsPrices] = useState<Record<string, number>>({});
  const [operationChangeEffects, setOperationChangeEffects] = useState<Record<string, string>>({});
  const [priceDirections, setPriceDirections] = useState<Record<string, 'up' | 'down' | 'neutral'>>({});
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const hasInitialLoadRef = useRef(false);

  const { tickers, loading: marketLoading, error: marketError, toggleFavorite, refreshData } = useMarketData(marketType);
  
  // Referencia para el intervalo de actualización manual
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Estados para los mejores precios
  const [bestBidPrice, setBestBidPrice] = useState<string>('0.00');
  const [bestAskPrice, setBestAskPrice] = useState<string>('0.00');

  // Estados adicionales para la UI
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuote, setSelectedQuote] = useState('USDT');
  const [error, setError] = useState<string>('');
  
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

  // Función para probar la API de Bybit directamente
  const testBybitAPI = async () => {
    try {
      // Obtener datos del ticker para BTC
      const tickerResponse = await fetch('https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT');
      const tickerData = await tickerResponse.json();
      
      // Obtener datos de funding para BTC
      const fundingResponse = await fetch('https://api.bybit.com/v5/market/funding/history?category=linear&symbol=BTCUSDT&limit=1');
      const fundingData = await fundingResponse.json();
      
      // Obtener datos del orderbook para BTC
      const orderbookResponse = await fetch('https://api.bybit.com/v5/market/orderbook?category=linear&symbol=BTCUSDT&limit=1');
      const orderbookData = await orderbookResponse.json();
      
      // Verificar si se obtuvieron datos válidos
      if (tickerData?.result?.list?.[0]) {
        const ticker = tickerData.result.list[0];
        const funding = fundingData?.result?.list?.[0] || {};
        
        // Formatear los datos
        const price = parseFloat(ticker.lastPrice || '0');
        const changePercent = parseFloat(ticker.price24hPcnt || '0') * 100;
        const fundingRate = parseFloat(funding.fundingRate || '0') * 100;
      } else {
        console.error('No se obtuvieron datos válidos de Bybit');
      }
    } catch (error) {
      console.error('Error al probar la API de Bybit:', error);
    }
  };
  
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
  
  // Función para cargar subcuentas desde Supabase
  const loadSubAccounts = async () => {
    try {
      setIsLoadingSubAccounts(true);
      console.log('🔄 Cargando subcuentas desde Supabase...');
      
      const { data, error } = await getUserSubaccounts();
      
      if (error) {
        console.error('Error al cargar subcuentas:', error);
        return false;
      }
      
      if (data && data.length > 0) {
        console.log('✅ Subcuentas cargadas desde Supabase:', data.length);
            
        // Transformar los datos al formato que necesitamos
        const formattedAccounts: SubAccount[] = data.map(account => ({
          id: account.id,
          name: account.name,
          created_at: account.created_at || new Date().toISOString(),
          api_key: account.api_key,
          secret_key: account.secret_key,
          is_demo: account.is_demo,
          balance: {
            btc: 0, // Se actualizará con llamadas a la API
            usdt: 1000, // Valor temporal hasta que el endpoint esté disponible
          }
        }));
            
        setSubAccounts(formattedAccounts);

        // Validar que la subcuenta seleccionada aún exista (solo después de hidratación)
        if (isHydrated && selectedSubAccount) {
          const existingAccount = formattedAccounts.find(acc => acc.id === selectedSubAccount);
          if (!existingAccount) {
            // Si la subcuenta seleccionada ya no existe, limpiar la selección
            setSelectedSubAccount(null);
            localStorage.removeItem('selectedSubAccount');
            console.log('⚠️ Subcuenta seleccionada ya no existe, limpiando selección');
          }
        }
            
        // TEMPORAL: Comentar la carga automática de balances hasta que el endpoint esté disponible
        // formattedAccounts.forEach(account => {
        //   loadBalanceForSubAccount(account.id);
        // });
            
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al cargar subcuentas desde Supabase:', error);
      return false;
    } finally {
      setIsLoadingSubAccounts(false);
    }
  };

  // Cargar subcuentas al inicializar el componente
  useEffect(() => {
    if (user && token) {
      loadSubAccounts();
    }
  }, [user, token]);

  // Efecto de hidratación segura desde localStorage
  useEffect(() => {
    const savedSubAccount = localStorage.getItem('selectedSubAccount');
    if (savedSubAccount) {
      setSelectedSubAccount(savedSubAccount);
    }
    setIsHydrated(true);
  }, []);

  // Persistir selectedSubAccount en localStorage cuando cambie (solo después de hidratación)
  useEffect(() => {
    if (!isHydrated) return; // No persistir hasta que esté hidratado
    
    if (selectedSubAccount) {
      localStorage.setItem('selectedSubAccount', selectedSubAccount);
    } else {
      localStorage.removeItem('selectedSubAccount');
    }
  }, [selectedSubAccount, isHydrated]);

  // Función para cambiar la subcuenta seleccionada
  const handleSubAccountChange = (subAccountId: string | null) => {
    setSelectedSubAccount(subAccountId);
  };

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
    if (tickers.length > 0) {
      const currentSymbol = selectedPair.symbol;
      const newPair = tickers.find(ticker => ticker.symbol === currentSymbol);
      
      if (newPair) {
        setSelectedPair(newPair);
      } else {
        setSelectedPair(tickers[0]);
      }
    }
  }, [marketType, tickers]);

  // Categorías de activos
  const topAssets = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'MATIC', 'DOT', 'LINK'];

  // Filtrar pares según la búsqueda y pestaña activa
  const filteredPairs = tickers.filter(pair => {
    const matchesSearch = pair.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') {
      return matchesSearch;
    } else if (activeTab === 'favorites') {
      return matchesSearch && pair.favorite;
    } else if (activeTab === 'top') {
      return matchesSearch && topAssets.includes(pair.symbol);
    }
    
    return matchesSearch;
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
      setTotal('0');
    }
  }, [price, amount, leverage]);

  // Función para ajustar el precio
  const adjustPrice = (increment: boolean) => {
    // Calcular un paso adecuado basado en el precio actual
    const currentPrice = parseFloat(price) || parseFloat(selectedPair.price);
    
    // Ajustar el paso según la magnitud del precio
    let step = 0.5;
    if (currentPrice < 1) step = 0.0001;
    else if (currentPrice < 10) step = 0.001;
    else if (currentPrice < 100) step = 0.01;
    else if (currentPrice < 1000) step = 0.1;
    else if (currentPrice < 10000) step = 1;
    else step = 5;
    
    // Aplicar el ajuste
    setPrice((increment ? currentPrice + step : Math.max(currentPrice - step, 0)).toFixed(
      currentPrice < 1 ? 4 : currentPrice < 100 ? 2 : 0
    ));
  };

  // Función para ajustar la cantidad
  const adjustAmount = (increment: boolean) => {
    // Ajustar el paso según el activo seleccionado y su precio
    let step = 0.0001;
    
    // Para activos de alto valor como BTC, usar pasos más pequeños
    if (selectedPair.symbol === 'BTC') {
      step = 0.0001;
    } 
    // Para activos de valor medio como ETH, usar pasos intermedios
    else if (selectedPair.symbol === 'ETH') {
      step = 0.001;
    } 
    // Para activos de bajo valor, usar pasos más grandes
    else if (parseFloat(selectedPair.price) < 1) {
      step = 1;
    } 
    else if (parseFloat(selectedPair.price) < 10) {
      step = 0.1;
    } 
    else {
      step = 0.01;
    }
    
    const currentAmount = parseFloat(amount) || 0;
    setAmount((increment ? currentAmount + step : Math.max(currentAmount - step, 0)).toFixed(
      selectedPair.symbol === 'BTC' ? 4 : selectedPair.symbol === 'ETH' ? 3 : 2
    ));
  };

  // Función para calcular el balance disponible del activo seleccionado
  const getAvailableBalance = (assetType: 'base' | 'quote') => {
    if (!selectedSubAccount) {
      return assetType === 'base' ? '0.0000' : '0.00';
    }
    
    const account = subAccounts.find(acc => acc.id === selectedSubAccount);
    if (!account) {
      return assetType === 'base' ? '0.0000' : '0.00';
    }
    
    if (assetType === 'base') {
      // Para el activo base (BTC, ETH, etc.)
      let baseBalance = 0;
      if (selectedPair.symbol === 'BTC') {
        baseBalance = account.balance.btc;
      } else if (selectedPair.symbol === 'ETH') {
        baseBalance = account.balance.eth || 0;
      } else {
        // Para otros activos, intentar encontrarlos en el balance o usar 0
        baseBalance = account.balance[selectedPair.symbol.toLowerCase()] || 0;
      }
      
      // Ajustar la precisión según el activo
      return baseBalance.toFixed(
        selectedPair.symbol === 'BTC' ? 8 : 
        selectedPair.symbol === 'ETH' ? 6 : 
        parseFloat(selectedPair.price) < 1 ? 2 : 4
      );
    } else {
      // Para el activo quote (USDT)
      return account.balance.usdt.toFixed(2);
    }
  };

  // Función para establecer el porcentaje de la cantidad disponible
  const setAmountPercentage = (percentage: number) => {
    if (!selectedSubAccount) return;
    
    const account = subAccounts.find(acc => acc.id === selectedSubAccount);
    if (!account) return;

    let availableAmount = 0;

    // Si es compra, usamos el balance de USDT dividido por el precio
    if (side === 'buy') {
      const usdtBalance = account.balance.usdt;
      const priceValue = parseFloat(price) || parseFloat(selectedPair.price);
      if (priceValue > 0) {
        availableAmount = usdtBalance / priceValue;
      }
    } 
    // Si es venta, usamos el balance del activo directamente
    else {
      if (selectedPair.symbol === 'BTC') {
        availableAmount = account.balance.btc;
      } else if (selectedPair.symbol === 'ETH') {
        availableAmount = account.balance.eth || 0;
      } else {
        availableAmount = account.balance[selectedPair.symbol.toLowerCase()] || 0;
      }
    }

    // Aplicar el porcentaje al monto disponible
    const calculatedAmount = availableAmount * (percentage / 100);
    
    // Formatear con precisión adecuada según el activo
    setAmount(calculatedAmount.toFixed(4));
  };

  // Función para formatear números con validación
  const formatNumber = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0.00';
    
    // Determinar la precisión decimal según el valor
    let fractionDigits = 2;
    if (num < 0.0001) {
      fractionDigits = 8; // Usar 8 decimales para valores extremadamente pequeños (como SHIB)
    } else if (num < 0.01) {
      fractionDigits = 6;
    } else if (num < 1) {
      fractionDigits = 4;
    } else if (num < 10) {
      fractionDigits = 3;
    }
    
    return num.toLocaleString('es-ES', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
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
    // Si no hay precio o cantidad, no hay riesgo
    if (!amount) return 0;
    
    // Para órdenes de mercado, usar el precio actual del par
    let priceToUse = orderType === 'market' ? parseFloat(selectedPair.price) : parseFloat(price);
    
    // Si el precio no es válido, usar el precio actual
    if (isNaN(priceToUse) || priceToUse <= 0) {
      priceToUse = parseFloat(selectedPair.price);
    }
    
    // Calcular el valor total
    const amountValue = parseFloat(amount);
    let totalValue = priceToUse * amountValue;
    
    // Para órdenes de futuros, calcular el riesgo según el apalancamiento
    if (marketType === 'perpetual' && leverage) {
      const leverageValue = parseFloat(leverage);
      if (leverageValue > 0) {
        // El riesgo es el valor nominal (no el margen)
        return totalValue;
      }
    }
    
    // Para spot, el riesgo es el valor total
    return totalValue;
  };

  // Función para calcular el porcentaje de riesgo respecto al balance total
  const calculateRiskPercentage = () => {
    const risk = calculateRisk();
    
    if (!selectedSubAccount) return 0;
    
    const account = subAccounts.find(acc => acc.id === selectedSubAccount);
    if (!account) return 0;
    
    // Obtener el balance total disponible
    let totalBalance = 0;
    if (side === 'buy') {
      totalBalance = account.balance.usdt;
    } else {
      if (selectedPair.symbol === 'BTC') {
        totalBalance = account.balance.btc * parseFloat(selectedPair.price);
      } else if (selectedPair.symbol === 'ETH') {
        totalBalance = (account.balance.eth || 0) * parseFloat(selectedPair.price);
      } else {
        totalBalance = (account.balance[selectedPair.symbol.toLowerCase()] || 0) * parseFloat(selectedPair.price);
      }
    }
    
    // Si no hay balance, devolver 0
    if (totalBalance <= 0) return 0;
    
    // Calcular el porcentaje de riesgo
    return (risk / totalBalance) * 100;
  };

  // Función para mostrar un mensaje de error con tiempo de expiración
  const showError = (message: string) => {
    setError(message);
    
    // Limpiar el error después de 5 segundos
    setTimeout(() => {
      setError('');
    }, 5000);
  };

  // Función para validar el balance disponible
  const validateBalance = () => {
    if (!amount) return true;
    
    if (!selectedSubAccount) return false;
    
    const account = subAccounts.find(acc => acc.id === selectedSubAccount);
    if (!account) return false;
    
    // Para compras, validamos el balance de USDT
    if (side === 'buy') {
      const totalCost = parseFloat(calculateTotal());
      const availableUSDT = account.balance.usdt;
      
      if (totalCost > availableUSDT) {
        showError(`Balance insuficiente. Necesitas ${totalCost.toFixed(2)} USDT pero solo tienes ${availableUSDT.toFixed(2)} USDT disponible.`);
        return false;
      }
    } 
    // Para ventas, validamos el balance del activo seleccionado
    else {
      const amountNeeded = parseFloat(amount);
      let availableAsset = 0;
      
      if (selectedPair.symbol === 'BTC') {
        availableAsset = account.balance.btc;
      } else if (selectedPair.symbol === 'ETH') {
        availableAsset = account.balance.eth || 0;
      } else {
        availableAsset = account.balance[selectedPair.symbol.toLowerCase()] || 0;
      }
      
      if (amountNeeded > availableAsset) {
        showError(`Balance insuficiente. Necesitas ${amountNeeded.toFixed(4)} ${selectedPair.symbol} pero solo tienes ${availableAsset.toFixed(4)} ${selectedPair.symbol} disponible.`);
        return false;
      }
    }
    
    return true;
  };

  // Función para calcular el total
  const calculateTotal = () => {
    // Si no hay precio o cantidad, devolver 0
    if (!amount) return '0';
    
    // Para órdenes de mercado, usar el precio actual del par
    let priceToUse = orderType === 'market' ? parseFloat(selectedPair.price) : parseFloat(price);
    
    // Si el precio no es válido, usar el precio actual
    if (isNaN(priceToUse) || priceToUse <= 0) {
      priceToUse = parseFloat(selectedPair.price);
    }
    
    // Calcular el valor total
    const amountValue = parseFloat(amount);
    let totalValue = priceToUse * amountValue;
    
    // Aplicar apalancamiento si es una orden de futuros
    if (marketType === 'perpetual' && leverage) {
      // Para futuros, el total es el valor nominal / apalancamiento (margen requerido)
      const leverageValue = parseFloat(leverage);
      if (leverageValue > 0) {
        totalValue = totalValue / leverageValue;
      }
    }
    
    // Formatear el resultado con 2 decimales
    return totalValue.toFixed(2);
  };

  // Función para validar los parámetros de la orden
  const validateOrderParams = (): boolean => {
    // Validaciones básicas
    if (!amount) {
      showError('Por favor, ingrese una cantidad.');
      return false;
    }
    
    if (!selectedSubAccount) {
      showError('Por favor, seleccione una subcuenta.');
      return false;
    }
    
    // Validaciones específicas según el tipo de orden
    if (orderType === 'limit' && !price) {
      showError('Por favor, ingrese un precio para la orden límite.');
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
    
    const selectedAccount = subAccounts.find(account => account.id === selectedSubAccount);
    if (!selectedAccount) {
      showError('Subcuenta no encontrada');
      return;
    }
    
    const summary: OrderSummary = {
      marketType: marketType,
      orderType,
      side,
      price: orderType === 'limit' ? price : 'Mercado',
      amount,
      total: calculateTotal(),
      leverage: marketType === 'perpetual' ? leverage : null,
      subAccount: selectedAccount
    };
    
    setOrderSummary(summary);
    setShowConfirmation(true);
  };

  // Función para ejecutar la orden
  const executeOrder = async () => {
    try {
      // Validar parámetros y preparar el resumen de la orden
      if (!validateOrderParams()) {
        return;
      }
      
      // Verificar que hay subcuenta seleccionada
      if (!selectedSubAccount) {
        showError('Debe seleccionar una subcuenta');
        return;
      }

      // Verificar que hay token de autorización
      if (!token) {
        showError('No hay token de autorización. Por favor, inicie sesión nuevamente.');
        return;
      }
      
      // Obtener la subcuenta seleccionada
      const selectedAccount = subAccounts.find(account => account.id === selectedSubAccount);
      if (!selectedAccount) {
        showError('Subcuenta no encontrada');
        return;
      }
      
      // Crear el objeto de resumen con todos los detalles
      const summary: OrderSummary = {
        marketType,
        orderType,
        side,
        price: orderType === 'market' ? 'Mercado' : price,
        amount,
        total: calculateTotal(),
        leverage: marketType === 'perpetual' ? leverage : null,
        subAccount: selectedAccount
      };
      
      // Actualizar el estado y mostrar confirmación
      setOrderSummary(summary);
      setIsLoading(true);
      
      // Preparar la solicitud de orden para el backend
      const orderRequest = {
        symbol: selectedPair.symbol, // BTC, ETH, etc. (sin USDT)
        side: side, // 'buy' o 'sell'
        orderType: orderType, // 'limit' o 'market'
        qty: amount, // cantidad
        price: orderType === 'limit' ? price : undefined, // precio solo para limit orders
        category: marketType === 'spot' ? 'spot' : 'linear', // tipo de mercado
        leverage: marketType === 'perpetual' ? leverage : undefined // apalancamiento solo para futuros
      };

      const requestBody = {
        subaccountIds: [selectedSubAccount], // Ahora es un array con un solo elemento
        orderRequest: orderRequest
      };

      console.log('🚀 Ejecutando orden:', requestBody);

      // Llamar al endpoint del backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('La URL del API no está configurada');
      }

      const response = await fetch(`${apiUrl}/api/subaccounts/execute-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Resultado de la ejecución:', result);

      // Procesar resultados
      if (result.successfulOrders > 0) {
        const successMessage = `Orden ejecutada exitosamente en la subcuenta`;
        
        setSuccessMessage(successMessage);
        setShowSuccess(true);
        
        // Limpiar campos después de ejecutar
        setAmount('');
        setPrice('');
        
        // Recargar balances
        if (selectedAccount) {
          loadBalanceForSubAccount(selectedAccount.id);
        }
        
        // Recargar operaciones abiertas si estamos en futuros
        if (marketType === 'perpetual') {
          setTimeout(() => {
            fetchOpenOperations(false);
          }, 2000);
        }
      } else {
        setSuccessMessage('No se pudo ejecutar la orden');
        setShowSuccess(true);
      }

      // Mostrar detalles de errores si los hay
      if (result.errors && result.errors.length > 0) {
        console.warn('⚠️ Errores:', result.errors);
      }

      // Ocultar confirmación
      setShowConfirmation(false);
      
    } catch (error: any) {
      console.error('❌ Error al ejecutar orden:', error);
      showError(error.message || 'Error al ejecutar la orden');
      setShowConfirmation(false);
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

  // Función para obtener el mejor precio de compra/venta
  const getBestPrice = (orderSide: 'buy' | 'sell') => {
    if (marketType === 'spot') {
      const spotPair = selectedPair as SpotMarketTicker;
      return orderSide === 'buy' ? spotPair.askPrice : spotPair.bidPrice;
    } else {
      const perpPair = selectedPair as PerpetualMarketTicker;
      return orderSide === 'buy' ? perpPair.askPrice : perpPair.bidPrice;
    }
  };

  // Efecto para establecer el precio automáticamente
  useEffect(() => {
    // Establecer precio automáticamente si:
    // 1. Es la primera carga del componente
    // 2. El campo de precio está vacío
    // 3. El tipo de orden es límite
    if ((!price || price === '0') && orderType === 'limit' && selectedPair) {
      setPrice(parseFloat(selectedPair.price).toFixed(
        parseFloat(selectedPair.price) < 1 ? 4 : 
        parseFloat(selectedPair.price) < 100 ? 2 : 0
      ));
    }
  }, [selectedPair, orderType, price]);

  // Actualizar los mejores precios cuando cambia el par seleccionado
  useEffect(() => {
    if (selectedPair) {
      const currentPrice = parseFloat(selectedPair.price);
      const adjustment = currentPrice * 0.001; // 0.1% de ajuste
      
      // Mejor precio de compra (bid)
      setBestBidPrice((currentPrice - adjustment).toFixed(
        currentPrice < 1 ? 4 : currentPrice < 100 ? 2 : 0
      ));
      
      // Mejor precio de venta (ask)
      setBestAskPrice((currentPrice + adjustment).toFixed(
        currentPrice < 1 ? 4 : currentPrice < 100 ? 2 : 0
      ));
    }
  }, [selectedPair]);

  // Actualizar la función que maneja la apertura del selector de subcuentas

  
  // Función para cargar el balance de una subcuenta específica
  const loadBalanceForSubAccount = async (accountId: string) => {
    try {
      console.log(`🔄 Cargando balance para subcuenta: ${accountId}`);
      
      if (!token) {
        console.warn(`⚠️ Token no disponible para cargar balance de subcuenta ${accountId}`);
        return;
      }
      
      // TEMPORAL: Comentar hasta que el endpoint esté disponible en el backend
      console.log(`ℹ️ Endpoint de balance no disponible aún para subcuenta ${accountId}`);
      return;
      
      // Implementar llamada al backend para obtener balance (cuando el endpoint esté disponible)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        console.error('❌ NEXT_PUBLIC_API_URL no está configurada');
        return;
      }
      
      const response = await fetch(`${apiUrl}/api/subaccounts/${accountId}/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        console.error(`❌ Error al obtener balance de subcuenta ${accountId}:`, response.status);
        return;
      }
      
      const balanceData = await response.json();
      console.log(`✅ Balance obtenido para subcuenta ${accountId}:`, balanceData);
      
      // Actualizar el balance en el estado
      setSubAccounts(prev => prev.map(acc => 
        acc.id === accountId 
          ? { ...acc, balance: balanceData.balance || acc.balance }
          : acc
      ));
    } catch (error) {
      console.error(`Error al cargar balance para subcuenta ${accountId}:`, error);
    }
  };

  // Estados adicionales para operaciones abiertas
  const [isLiveUpdating, setIsLiveUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [updateInterval, setUpdateInterval] = useState<number>(5000);
  const [changedOperations, setChangedOperations] = useState<Record<string, { 
    profit: number; 
    timestamp: number; 
    isNew?: boolean; 
    previousProfit?: number;
    priceDirection?: 'up' | 'down' | 'neutral';
    previousMarkPrice?: number;
  }>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Estados para controlar la visualización de operaciones
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [density, setDensity] = useState<'normal' | 'compact'>('normal');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isOperationsSectionExpanded, setIsOperationsSectionExpanded] = useState(true);

  // Cargar preferencias de visualización desde localStorage cuando el componente se monte
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Recuperar preferencias guardadas
      const savedViewMode = localStorage.getItem('operationsViewMode');
      const savedDensity = localStorage.getItem('operationsDensity');
      const savedPageSize = localStorage.getItem('operationsPageSize');
      const savedSectionExpanded = localStorage.getItem('operationsSectionExpanded');
      
      // Aplicar preferencias si existen
      if (savedViewMode === 'cards' || savedViewMode === 'table') {
        setViewMode(savedViewMode);
      }
      
      if (savedDensity === 'normal' || savedDensity === 'compact') {
        setDensity(savedDensity);
      }
      
      if (savedPageSize) {
        const parsedSize = parseInt(savedPageSize, 10);
        if (!isNaN(parsedSize) && [5, 10, 25, 50].includes(parsedSize)) {
          setPageSize(parsedSize);
        }
      }
      
      if (savedSectionExpanded !== null) {
        setIsOperationsSectionExpanded(savedSectionExpanded === 'true');
      }
    }
  }, []);

  // Función para obtener operaciones abiertas
  const fetchOpenOperations = async (showLoading = true) => {
    if (showLoading) {
      setIsLoadingOperations(true);
    }
    setOperationsError(null);
    
    try {
      if (!token) {
        console.error('❌ No hay token de autorización');
        throw new Error('No hay token de autorización');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        console.error('❌ NEXT_PUBLIC_API_URL no está configurada');
        throw new Error('La URL del API no está configurada');
      }

      const fullUrl = `${apiUrl}/api/subaccounts/user/all-open-perpetual-operations`;
      console.log('📡 Llamando a:', fullUrl);
      console.log('🔑 Token disponible:', !!token);

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // Agregar timeout para evitar que la petición se quede colgada
        signal: AbortSignal.timeout(15000) // 15 segundos de timeout
      });
      
      console.log('📊 Respuesta status:', response.status);
      
      const data = await response.json();
      console.log('📦 Datos recibidos:', data);
      
      if (!response.ok) {
        console.error('❌ Error en la respuesta:', data);
        throw new Error(data.message || data.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      // Verificar la estructura de la respuesta
      if (!data.operations) {
        console.error('❌ La respuesta no contiene operations:', data);
        throw new Error('Formato de respuesta inválido');
      }
      
      console.log(`✅ Operaciones recibidas: ${data.operations.length}`);
      
      // Log detallado de la primera operación para debugging
      if (data.operations.length > 0) {
        console.log('📊 Primera operación recibida:', {
          id: data.operations[0].id,
          symbol: data.operations[0].symbol,
          price: data.operations[0].price,
          quantity: data.operations[0].quantity,
          liquidationPrice: data.operations[0].liquidationPrice,
          markPrice: data.operations[0].markPrice,
          positionValue: data.operations[0].positionValue,
          profit: data.operations[0].profit,
          profitPercentage: data.operations[0].profitPercentage
        });
      }
      
      // Detectar cambios en las operaciones
      const newChangedOperations = { ...operationChangeEffects };
      
      // Detectar operaciones nuevas
      data.operations.forEach((newOp: Operation) => {
        const existingOp = openOperations.find(op => op.id === newOp.id);
        
        if (!existingOp) {
          // Operación nueva
          newChangedOperations[newOp.id] = 'new';
          console.log(`🆕 Nueva operación detectada: ${newOp.symbol} ${newOp.side}`);
        } else {
          // Verificar cambios en múltiples campos
          const profitChanged = existingOp.profit !== newOp.profit;
          const priceChanged = existingOp.price !== newOp.price;
          const liqPriceChanged = existingOp.liquidationPrice !== newOp.liquidationPrice;
          const markPriceChanged = existingOp.markPrice !== newOp.markPrice;
          
          if (profitChanged || priceChanged || liqPriceChanged || markPriceChanged) {
            // Determinar dirección del precio basada en markPrice
            let priceDirection: 'up' | 'down' | 'neutral' = 'neutral';
            if (markPriceChanged && existingOp.markPrice && newOp.markPrice) {
              if (newOp.markPrice > existingOp.markPrice) {
                priceDirection = 'up';
              } else if (newOp.markPrice < existingOp.markPrice) {
                priceDirection = 'down';
              }
            }
            
            setPriceDirections(prev => ({
              ...prev,
              [newOp.id]: priceDirection
            }));
            
            // Establecer el efecto de cambio
            if (profitChanged) {
              const currentProfit = newOp.profit || 0;
              const previousProfit = existingOp.profit || 0;
              
              if (currentProfit > previousProfit) {
                newChangedOperations[newOp.id] = 'profit-up';
              } else if (currentProfit < previousProfit) {
                newChangedOperations[newOp.id] = 'profit-down';
              }
            }
            
            // Log específico para cada tipo de cambio
            if (profitChanged) {
              console.log(`💰 Cambio de profit en ${newOp.symbol}: ${existingOp.profit} → ${newOp.profit}`);
            }
            if (priceChanged) {
              console.log(`📈 Cambio de precio entrada en ${newOp.symbol}: ${existingOp.price} → ${newOp.price}`);
            }
            if (liqPriceChanged) {
              console.log(`⚠️ Cambio de precio liquidación en ${newOp.symbol}: ${existingOp.liquidationPrice} → ${newOp.liquidationPrice}`);
            }
            if (markPriceChanged) {
              console.log(`📊 Cambio de precio mercado en ${newOp.symbol}: ${existingOp.markPrice} → ${newOp.markPrice} (${priceDirection})`);
            }
          }
        }
      });
      
      // Detectar operaciones cerradas/eliminadas
      openOperations.forEach((existingOp: Operation) => {
        const stillExists = data.operations.find((op: Operation) => op.id === existingOp.id);
        if (!stillExists) {
          console.log(`❌ Operación cerrada: ${existingOp.symbol} ${existingOp.side}`);
        }
      });
      
      setOperationChangeEffects(newChangedOperations);
      setOpenOperations(data.operations);
      
      // Resetear contador de errores consecutivos
      setConsecutiveErrors(0);
      
      // Re-habilitar actualizaciones automáticas si estaban deshabilitadas
      if (!autoRefreshEnabled) {
        setAutoRefreshEnabled(true);
      }
    } catch (error: any) {
      // Si es un error de timeout, mostrar mensaje específico
      if (error.name === 'AbortError') {
        console.error('⏱️ Timeout al obtener operaciones');
        setOperationsError('La solicitud tardó demasiado tiempo. Por favor, intenta más tarde.');
      } else {
      console.error('❌ Error completo:', error);
      const errorMessage = error.message || 'Error al obtener operaciones abiertas';
      setOperationsError(`${errorMessage}. Por favor, verifica tu conexión y configuración.`);
      }
      
      // Para errores 500, detener inmediatamente las actualizaciones
      const is500Error = error.message?.includes('500') || error.message?.includes('Internal server error');
      
      if (is500Error) {
        // Detener inmediatamente para errores 500
        setAutoRefreshEnabled(false);
        
        console.warn('⚠️ Error 500 detectado. Se deshabilitaron las actualizaciones automáticas inmediatamente.');
      } else {
        // Para otros errores, usar el contador
        const newErrorCount = consecutiveErrors + 1;
        setConsecutiveErrors(newErrorCount);
        
        // Deshabilitar actualizaciones automáticas después de 3 errores consecutivos
        if (newErrorCount >= 3) {
          setAutoRefreshEnabled(false);
          
          console.warn(`⚠️ Se deshabilitaron las actualizaciones automáticas después de ${newErrorCount} errores consecutivos`);
        }
      }
    } finally {
      if (showLoading) {
        setIsLoadingOperations(false);
      }
    }
  };

  // Variable para controlar si ya se hizo la carga inicial


  // Efecto para manejar las actualizaciones en vivo - Simplificado para tiempo real automático
  useEffect(() => {
    // Solo proceder si hay token y las actualizaciones están habilitadas
    if (!token || !autoRefreshEnabled) {
      return;
    }
    
    // Si ya se hizo la carga inicial y hay un error, no hacer nada
    if (hasInitialLoadRef.current && operationsError) {
      return;
    }
    
    // Pequeño delay antes de la carga inicial para evitar llamadas inmediatas
    const initialTimeout = setTimeout(() => {
      // Solo hacer la carga inicial si no se ha hecho antes
      if (!hasInitialLoadRef.current) {
        hasInitialLoadRef.current = true;
      fetchOpenOperations();
      }
      
      // Solo configurar el intervalo si no hay errores
      if (!operationsError) {
        // Configurar actualizaciones automáticas cada 3 segundos para tiempo real
        intervalRef.current = setInterval(() => {
          // Verificar nuevamente antes de cada actualización
          if (autoRefreshEnabled && !operationsError) {
        fetchOpenOperations(false); // No mostrar loading en actualizaciones automáticas
    }
        }, 3000); // 3 segundos para actualizaciones en tiempo real
      }
    }, 1000); // Esperar 1 segundo antes de la primera carga
    
    // Limpiar timeouts e intervalos
    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [token, autoRefreshEnabled, operationsError]);

  // Función para verificar si una operación ha cambiado recientemente
  const hasRecentlyChanged = (operationId: string): boolean => {
    if (!changedOperations[operationId]) return false;
    return Date.now() - changedOperations[operationId].timestamp < 5000; // Aumentar a 5 segundos para mejor visibilidad
  };

  // Función para obtener la clase CSS para el efecto de cambio
  const getChangeEffectClass = (operationId: string, profit: number | undefined): string => {
    if (!hasRecentlyChanged(operationId)) return '';
    
    const changeInfo = changedOperations[operationId];
    if (!changeInfo) return '';
    
    // Si es una operación nueva, mostrar efecto especial
    if (changeInfo.isNew) {
      return 'animate-pulse-blue';
    }
    
    const previousProfit = changeInfo.previousProfit || 0;
    const currentProfit = profit || 0;
    
    if (currentProfit > previousProfit) {
      return 'animate-pulse-green';
    } else if (currentProfit < previousProfit) {
      return 'animate-pulse-red';
    }
    
    return '';
  };

  // Función para obtener la dirección del precio basada en los cambios detectados
  const getPriceDirectionForOperation = (operationId: string): 'up' | 'down' | 'neutral' => {
    if (!hasRecentlyChanged(operationId)) return 'neutral';
    
    const changeInfo = changedOperations[operationId];
    if (!changeInfo) return 'neutral';
    
    return changeInfo.priceDirection || 'neutral';
  };

  // Estado para controlar qué operaciones están expandidas
  const [expandedOperations, setExpandedOperations] = useState<Record<string, boolean>>({});

  // Cargar estado de expansión de operaciones desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedExpandedOperations = localStorage.getItem('expandedOperations');
      if (savedExpandedOperations) {
        try {
          const parsed = JSON.parse(savedExpandedOperations);
          setExpandedOperations(parsed);
        } catch (error) {
          console.error('Error al cargar operaciones expandidas:', error);
        }
      }
    }
  }, []);

  // Función para alternar la expansión de una operación
  const toggleOperationExpansion = (operationId: string) => {
    setExpandedOperations(prev => {
      const newState = {
        ...prev,
        [operationId]: !prev[operationId]
      };
      
      // Guardar en localStorage
      localStorage.setItem('expandedOperations', JSON.stringify(newState));
      
      return newState;
    });
  };

  // Función para renderizar una operación abierta
  const renderOpenOperation = (operation: Operation) => {
    const isExpanded = expandedOperations[operation.id] || false;
    
    return (
      <div 
        key={operation.id}
        onClick={() => toggleOperationExpansion(operation.id)}
        className={`bg-white dark:bg-zinc-800 rounded-xl shadow-md border-2 border-transparent 
          ${operation.side === 'buy' 
            ? 'hover:border-emerald-200 dark:hover:border-emerald-800/30' 
            : 'hover:border-rose-200 dark:hover:border-rose-800/30'} 
          transition-all duration-300 cursor-pointer 
          ${hasRecentlyChanged(operation.id) ? 'border-l-4 border-l-violet-500' : ''} 
          ${isExpanded 
            ? 'transform scale-[1.02] shadow-lg' 
            : 'hover:shadow-lg hover:translate-y-[-2px]'}`}
      >
        <div className={`${density === 'compact' ? 'p-3' : 'p-6'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`${density === 'compact' ? 'px-2 py-1' : 'px-3 py-1.5'} rounded-full text-xs font-medium ${
                operation.side === 'buy'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
              }`}>
                {operation.side === 'buy' ? 'Compra' : 'Venta'}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">{operation.symbol}</span>
                {density !== 'compact' && (
                  <span className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded-md text-zinc-500 dark:text-zinc-400">{operation.exchange}</span>
                )}
              </div>
            </div>
            {operation.profit !== undefined && (
              <div className={`flex items-center gap-2 ${density === 'compact' ? 'px-2 py-1' : 'px-4 py-2'} rounded-xl ${
                operation.profit >= 0
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
              } ${getChangeEffectClass(operation.id, operation.profit)} shadow-sm`}>
                <span className={`${density === 'compact' ? 'text-xs' : 'text-sm'} font-medium`}>
                  {operation.profit >= 0 ? '+' : '-'}${Math.abs(operation.profit).toLocaleString()}
                </span>
                {density !== 'compact' && (
                  operation.profit >= 0 
                    ? <TrendingUp className="w-4 h-4" />
                    : <TrendingDown className="w-4 h-4" />
                )}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-zinc-50 dark:bg-zinc-700/30 p-3 rounded-lg">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Precio de entrada</span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-1">
                ${operation.price !== null && operation.price > 0 ? operation.price.toLocaleString() : 'N/A'}
              </p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-700/30 p-3 rounded-lg">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Cantidad</span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-1">
                {operation.quantity}
              </p>
            </div>
          </div>
          
          {/* Contenido expandible */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700 space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-700/30 p-3 rounded-lg">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Valor total</span>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-1">
                    ${operation.price !== null && operation.price > 0 ? (operation.price * operation.quantity).toLocaleString() : 'N/A'}
                  </p>
                </div>
                {operation.fee !== undefined && (
                  <div className="bg-zinc-50 dark:bg-zinc-700/30 p-3 rounded-lg">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Comisión</span>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-1">
                      ${operation.fee.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              
              {operation.profitPercentage !== undefined && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Rentabilidad</span>
                    <span className={`text-sm font-semibold ${
                      operation.profitPercentage >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {operation.profitPercentage.toFixed(2)}%
                    </span>
                  </div>
                  
                  {/* Barra de progreso para la rentabilidad */}
                  <div className="mt-2 h-2 bg-blue-100 dark:bg-blue-900/40 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${operation.profitPercentage >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ 
                        width: `${Math.min(Math.abs(operation.profitPercentage), 100)}%`,
                        transition: 'width 0.5s ease-in-out'
                      }}
                    ></div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 dark:text-zinc-400">ID:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded">
                    {operation.id.substring(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 dark:text-zinc-400">Subcuenta:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded">
                    {operation.subAccountId.substring(0, 8)}...
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    // Lógica para cerrar posición
                  }}
                  type="button"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-violet-500 hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700 rounded-lg transition-colors shadow-sm"
                >
                  Cerrar posición
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    // Lógica para editar
                  }}
                  type="button"
                  className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                >
                  Editar
                </button>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-4">
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-700/30 px-2.5 py-1.5 rounded-md">
              <Clock className="w-3.5 h-3.5" />
              {density === 'compact' 
                ? new Date(operation.openTime).toLocaleDateString() 
                : new Date(operation.openTime).toLocaleString()
              }
            </div>
            <div className="flex items-center gap-2">
              {operation.leverage && (
                <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 rounded-full font-medium">
                  {operation.leverage}x
                </span>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOperationExpansion(operation.id);
                }}
                type="button"
                className={`p-2 rounded-full bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-all shadow-sm ${
                  isExpanded ? 'rotate-180 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' : ''
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Funciones para cambiar y guardar preferencias de visualización
  const changeViewMode = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('operationsViewMode', mode);
  };
  
  const changeDensity = (newDensity: 'normal' | 'compact') => {
    setDensity(newDensity);
    localStorage.setItem('operationsDensity', newDensity);
  };
  
  const changePageSize = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Resetear a la primera página al cambiar el tamaño
    localStorage.setItem('operationsPageSize', size.toString());
  };

  // Cálculos para la paginación
  const totalPages = Math.max(1, Math.ceil(openOperations.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, openOperations.length);
  const paginatedOperations = openOperations.slice(startIndex, endIndex);
  
  // Generar números de página para la navegación
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para mostrar páginas alrededor de la actual
      if (currentPage <= 3) {
        // Cerca del inicio
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Cerca del final
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // En medio
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();

  // Efecto para cargar operaciones abiertas cuando el componente se monte
  // REMOVIDO - La carga inicial ahora se maneja en el useEffect principal para evitar duplicados

  // Función para alternar la expansión de la sección de operaciones
  const toggleOperationsSection = () => {
    const newState = !isOperationsSectionExpanded;
    setIsOperationsSectionExpanded(newState);
    localStorage.setItem('operationsSectionExpanded', newState.toString());
  };

  // Efecto para limpiar operaciones expandidas que ya no existen
  useEffect(() => {
    if (openOperations.length > 0) {
      // Obtener todos los IDs de operaciones actuales
      const currentOperationIds = new Set(openOperations.map(op => op.id));
      
      // Verificar si hay operaciones expandidas que ya no existen
      let needsUpdate = false;
      const updatedExpandedOperations = { ...expandedOperations };
      
      Object.keys(expandedOperations).forEach(opId => {
        if (!currentOperationIds.has(opId)) {
          delete updatedExpandedOperations[opId];
          needsUpdate = true;
        }
      });
      
      // Actualizar el estado y localStorage si es necesario
      if (needsUpdate) {
        setExpandedOperations(updatedExpandedOperations);
        localStorage.setItem('expandedOperations', JSON.stringify(updatedExpandedOperations));
      }
    }
  }, [openOperations, expandedOperations]);

  // Efecto para cargar subcuentas desde Supabase cuando el componente se monte
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      console.log('🔄 Cargando subcuentas desde Supabase...');
      loadSubAccounts();
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* Estilos para las animaciones */}
      <style jsx>{styles}</style>

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
                  <img
                    src={tokenImages[selectedPair.symbol] || tokenImages.default}
                    alt={selectedPair.symbol}
                    className="rounded-full ring-2 ring-violet-500/30 w-12 h-12"
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
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-400">
                        {marketType === 'spot' ? 'Spot Trading' : 'Futuros'}
                      </span>
                    </div>
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
              <div className="p-4 border-b border-zinc-800">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="asset-search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar activo por nombre o símbolo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="asset-search-input"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Selector de categoría simplificado */}
              <div className="flex items-center p-3 border-b border-zinc-800 bg-zinc-900/80">
                <div className="flex items-center space-x-2 w-full">
                <button
                  onClick={() => setActiveTab('all')}
                    className={`flex-1 py-2 px-3 text-sm rounded-lg transition-all duration-200 ${
                    activeTab === 'all'
                        ? 'bg-violet-500/20 text-violet-300 font-medium'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                    Todos
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                    className={`flex-1 py-2 px-3 text-sm rounded-lg transition-all duration-200 ${
                    activeTab === 'favorites'
                        ? 'bg-amber-500/20 text-amber-300 font-medium'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  Favoritos
                </button>
                {marketType === 'spot' && (
                    <button
                      onClick={() => setActiveTab('top')}
                      className={`flex-1 py-2 px-3 text-sm rounded-lg transition-all duration-200 ${
                        activeTab === 'top'
                          ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      Top 10
                    </button>
                  )}
                </div>
              </div>

              {/* Lista de pares con scroll mejorado */}
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                <div className="sticky top-0 z-10 grid grid-cols-[2fr,1fr,1fr] gap-4 px-4 py-2.5 text-xs font-medium text-zinc-400 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
                  <div>Par de Trading</div>
                  <div className="text-right">Último Precio</div>
                  <div className="text-right">Cambio 24h</div>
                </div>
                {marketError ? (
                  <div className="flex flex-col items-center justify-center py-8 text-rose-500">
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
                          <img
                            src={tokenImages[pair.symbol] || tokenImages.default}
                            alt={pair.symbol}
                            className="rounded-full ring-2 ring-violet-500/20 object-cover w-8 h-8"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = tokenImages.default;
                            }}
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-base font-medium text-white whitespace-nowrap min-w-0">{pair.symbol}/USDT</span>
                          <div className="flex items-center gap-1.5">
                            {topAssets.includes(pair.symbol) && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-400 font-medium">Top</span>
                            )}
                            {pair.favorite && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-400 font-medium">Fav</span>
                            )}
                            {marketType === 'perpetual' && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-violet-500/20 text-violet-400 font-medium">Perp</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-base font-medium text-white whitespace-nowrap">
                        {safeFormatNumber(pair.price)}
                      </div>
                      <div className={`text-right text-base font-medium whitespace-nowrap ${
                        parseFloat(pair.change.replace('%', '').replace('+', '')) < 0 
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
                  parseFloat(selectedPair.change?.replace('%', '').replace('+', '') || '0') < 0 
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
            {marketType === 'perpetual' && selectedPair && 'openInterest' in selectedPair && (
              <>
                <div className="flex flex-col">
                  <div className="text-xl font-bold text-white tracking-tight">
                    {(selectedPair as PerpetualMarketTicker).openInterest || '0.00 BTC'}
                  </div>
                  <div className="text-sm text-zinc-400">Open Interest</div>
                </div>
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
          {/* Panel del Gráfico y Operaciones Abiertas */}
          <div className="lg:col-span-3 space-y-6">
            {/* Gráfico - Aumentado el tamaño y forzado modo oscuro */}
            <div className="bg-zinc-900 rounded-xl shadow-lg border border-zinc-700 overflow-hidden">
              <div className="h-[600px] w-full">
                <TradingViewChart 
                  symbol={`${selectedPair.symbol}USDT`}
                  theme="dark"
                />
              </div>
            </div>
            
            {/* Sección de Operaciones Abiertas - Simplificada */}
            <OpenOperations
              openOperations={openOperations}
              isLoadingOperations={isLoadingOperations}
              operationsError={operationsError}
              subAccounts={subAccounts}
              hasRecentlyChanged={hasRecentlyChanged}
              getChangeEffectClass={getChangeEffectClass}
              getPriceDirection={getPriceDirectionForOperation}
              autoRefreshEnabled={autoRefreshEnabled}
              onClosePosition={(operationId) => {
                // Aquí puedes agregar la lógica para cerrar la posición
                console.log('Cerrar posición:', operationId);
              }}
              onRetry={() => {
                // Limpiar el error y reintentar
                setOperationsError(null);
                setConsecutiveErrors(0);
                hasInitialLoadRef.current = false; // Resetear la bandera de carga inicial
                setAutoRefreshEnabled(true);
                // No llamar directamente a fetchOpenOperations, dejar que el useEffect lo maneje
              }}
            />
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Selector de Subcuentas */}
            <SubAccountSelector
              subAccounts={subAccounts}
              selectedSubAccount={selectedSubAccount}
              onSubAccountChange={handleSubAccountChange}
              isLoading={isLoadingSubAccounts}
            />

            {/* Panel de Operaciones */}
            <TradingPanel
              // Estados del trading
              side={side}
              setSide={setSide}
              orderType={orderType}
              setOrderType={setOrderType}
              price={price}
              setPrice={setPrice}
              amount={amount}
              setAmount={setAmount}
              leverage={leverage}
              setLeverage={setLeverage}
              total={total}
              marketType={marketType}
              selectedPair={selectedPair}
              isLoading={isLoading}
              selectedSubAccount={isHydrated ? selectedSubAccount : null}
              subAccounts={subAccounts}
              
              // Funciones
              adjustPrice={adjustPrice}
              adjustAmount={adjustAmount}
              setAmountPercentage={setAmountPercentage}
              getAvailableBalance={getAvailableBalance}
              getBestPrice={getBestPrice}
              formatNumber={formatNumber}
              calculateRisk={calculateRisk}
              calculateRiskPercentage={calculateRiskPercentage}
              calculateTotal={calculateTotal}
              executeOrder={executeOrder}
              
              // Precios
              bestBidPrice={bestBidPrice}
              bestAskPrice={bestAskPrice}
            />

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
                  {orderSummary?.marketType === 'spot' ? 'Spot' : 'Futuros'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Tipo de Orden</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {orderSummary?.orderType === 'market' ? 'Mercado' : 'Límite'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Lado</span>
                <span className={`text-sm font-medium ${
                  orderSummary?.side === 'buy' ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {orderSummary?.side === 'buy' ? 'Compra' : 'Venta'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Precio</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {orderSummary?.price} USDT
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Cantidad</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {orderSummary?.amount} BTC
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Total</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {orderSummary?.total} USDT
                </span>
              </div>

              {orderSummary?.leverage && (
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Apalancamiento</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {orderSummary?.leverage}x
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Subcuentas</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {orderSummary?.subAccount.name}
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
                    selectedSubAccount ? 
                      subAccounts.find(acc => acc.id === selectedSubAccount)?.balance.usdt || 0
                      : 0
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