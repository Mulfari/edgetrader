"use client";

import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Users,
  Check,
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
  subAccounts: SubAccount[];
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

export default function NewOperation() {
  const [marketType, setMarketType] = useState<'spot' | 'perpetual'>('spot');
  const { tickers, loading: marketLoading, error: marketError, toggleFavorite, refreshData } = useMarketData(marketType);
  
  // Referencia para el intervalo de actualización manual
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [total, setTotal] = useState<string>('');
  const [leverage, setLeverage] = useState<string>('1');
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
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

  // Estado para las subcuentas
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [selectedSubAccounts, setSelectedSubAccounts] = useState<string[]>([]);
  const [showSubAccountSelector, setShowSubAccountSelector] = useState(false);

  // Referencia para saber si es la primera carga
  const isFirstLoad = useRef(true);

  // Estados para los mejores precios
  const [bestBidPrice, setBestBidPrice] = useState<string>('0.00');
  const [bestAskPrice, setBestAskPrice] = useState<string>('0.00');

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

  // Efecto para mostrar información en la consola sobre el par seleccionado
  useEffect(() => {
    if (marketType === 'perpetual' && selectedPair) {
      // Verificar si el par tiene todas las propiedades necesarias
      if (!('openInterest' in selectedPair) || !('fundingRate' in selectedPair) || !('nextFundingTime' in selectedPair)) {
      } else {
      }
    }
  }, [selectedPair, marketType]);

  // Cargar subcuentas desde localStorage
  useEffect(() => {
    const loadSubAccountsFromCache = () => {
      try {
        // Primero intentamos cargar las subcuentas desde el caché de useSubAccounts
        const subAccountsCache = localStorage.getItem(SUBACCOUNTS_CACHE_KEY);
        if (subAccountsCache) {
          try {
            const { data } = JSON.parse(subAccountsCache);
            if (Array.isArray(data) && data.length > 0) {
              // Convertir al formato requerido por la interfaz SubAccount
              const formattedSubAccounts: SubAccount[] = data.map(acc => ({
                id: acc.id,
                name: acc.name,
                balance: {
                  btc: 0, // Valor por defecto
                  usdt: 0  // Valor por defecto
                }
              }));
              
              // Ahora buscamos los balances en el caché
              formattedSubAccounts.forEach(account => {
                const cacheKey = `${CACHE_PREFIX}${account.id}`;
                const cachedData = localStorage.getItem(cacheKey);
                
                if (cachedData) {
                  try {
                    const { data, accountName } = JSON.parse(cachedData);
                    if (data && data.assets) {
                      // Actualizar el balance con los datos del caché
                      account.balance = {
                        btc: data.assets.find((asset: any) => asset.coin === 'BTC')?.walletBalance || 0,
                        usdt: data.assets.find((asset: any) => asset.coin === 'USDT')?.walletBalance || 0
                      };
                      
                      // Actualizar el nombre si está disponible en el caché
                      if (accountName) {
                        account.name = accountName;
                      }
                    }
                  } catch (error) {
                    console.error(`Error al procesar el caché para la cuenta ${account.id}:`, error);
                  }
                }
              });
              
              setSubAccounts(formattedSubAccounts);
              return;
            }
          } catch (error) {
            console.error('Error al parsear subaccounts_cache desde localStorage:', error);
          }
        }
        
        // Si no encontramos datos en el caché de useSubAccounts, intentamos con 'subAccounts'
        const subAccountsData = localStorage.getItem('subAccounts');
        if (subAccountsData) {
          try {
            // Si existe la clave 'subAccounts', la usamos directamente
            const parsedSubAccounts = JSON.parse(subAccountsData);
            if (Array.isArray(parsedSubAccounts) && parsedSubAccounts.length > 0) {
              // Convertir al formato requerido por la interfaz SubAccount
              const formattedSubAccounts: SubAccount[] = parsedSubAccounts.map(acc => ({
                id: acc.id,
                name: acc.name,
                balance: {
                  btc: 0, // Valor por defecto
                  usdt: 0  // Valor por defecto
                }
              }));
              
              // Ahora buscamos los balances en el caché
              formattedSubAccounts.forEach(account => {
                const cacheKey = `${CACHE_PREFIX}${account.id}`;
                const cachedData = localStorage.getItem(cacheKey);
                
                if (cachedData) {
                  try {
                    const { data, accountName } = JSON.parse(cachedData);
                    if (data && data.assets) {
                      // Actualizar el balance con los datos del caché
                      account.balance = {
                        btc: data.assets.find((asset: any) => asset.coin === 'BTC')?.walletBalance || 0,
                        usdt: data.assets.find((asset: any) => asset.coin === 'USDT')?.walletBalance || 0
                      };
                      
                      // Actualizar el nombre si está disponible en el caché
                      if (accountName) {
                        account.name = accountName;
                      }
                    }
                  } catch (error) {
                    console.error(`Error al procesar el caché para la cuenta ${account.id}:`, error);
                  }
                }
              });
              
              setSubAccounts(formattedSubAccounts);
              return;
            }
          } catch (error) {
            console.error('Error al parsear subAccounts desde localStorage:', error);
          }
        }
        
        // Si no hay datos en ninguno de los cachés anteriores, intentamos reconstruir desde el caché de balances
        const subAccountKeys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_PREFIX));
        
        if (subAccountKeys.length === 0) {
          return;
        }
        
        const cachedSubAccounts: SubAccount[] = [];
        
        // Procesar cada subcuenta en caché
        subAccountKeys.forEach(key => {
          try {
            const accountId = key.replace(CACHE_PREFIX, '');
            const cachedData = localStorage.getItem(key);
            
            if (!cachedData) return;
            
            const { data, accountName } = JSON.parse(cachedData);
            
            if (!data) return;
            
            // Convertir los datos en caché al formato de SubAccount
            const subAccount: SubAccount = {
              id: accountId,
              name: accountName || `Cuenta ${accountId.substring(0, 4)}`, // Nombre genérico ya que no tenemos el nombre real
              balance: {
                btc: data.assets?.find((asset: any) => asset.coin === 'BTC')?.walletBalance || 0,
                usdt: data.assets?.find((asset: any) => asset.coin === 'USDT')?.walletBalance || 0
              }
            };
            
            cachedSubAccounts.push(subAccount);
          } catch (error) {
            console.error('Error al procesar subcuenta en caché:', error);
          }
        });
        
        if (cachedSubAccounts.length > 0) {
          setSubAccounts(cachedSubAccounts);
        }
      } catch (error) {
        console.error('Error al cargar subcuentas desde caché:', error);
      }
    };
    
    loadSubAccountsFromCache();
  }, []);

  // Categorías de activos
  const assetCategories = {
    defi: ['UNI', 'LINK', 'AAVE', 'CAKE', 'COMP', 'MKR', 'SNX', 'YFI', 'SUSHI'],
    layer1: ['BTC', 'ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'NEAR', 'ATOM', 'MATIC', 'FTM']
  };

  // Filtrar pares según la búsqueda y pestaña activa
  const filteredPairs = tickers.filter(pair => {
    const matchesSearch = pair.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') {
      return matchesSearch;
    } else if (activeTab === 'favorites') {
      return matchesSearch && pair.favorite;
    } else if (activeTab === 'defi') {
      return matchesSearch && assetCategories.defi.includes(pair.symbol);
    } else if (activeTab === 'layer1') {
      return matchesSearch && assetCategories.layer1.includes(pair.symbol);
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
      setTotal('');
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
    const selectedAccounts = subAccounts.filter(acc => selectedSubAccounts.includes(acc.id));
    
    if (selectedAccounts.length === 0) {
      return assetType === 'base' ? '0.0000' : '0.00';
    }
    
    if (assetType === 'base') {
      // Para el activo base (BTC, ETH, etc.)
      const baseBalance = selectedAccounts.reduce((sum, acc) => {
        // Buscar el activo correspondiente al símbolo seleccionado
        if (selectedPair.symbol === 'BTC') {
          return sum + acc.balance.btc;
        } else if (selectedPair.symbol === 'ETH') {
          // Si hay balance de ETH, usarlo, de lo contrario usar 0
          return sum + (acc.balance.eth || 0);
        } else {
          // Para otros activos, intentar encontrarlos en el balance o usar 0
          const otherBalance = acc.balance[selectedPair.symbol.toLowerCase()] || 0;
          return sum + otherBalance;
        }
      }, 0);
      
      // Ajustar la precisión según el activo
      return baseBalance.toFixed(
        selectedPair.symbol === 'BTC' ? 8 : 
        selectedPair.symbol === 'ETH' ? 6 : 
        parseFloat(selectedPair.price) < 1 ? 2 : 4
      );
    } else {
      // Para el activo quote (USDT)
      const quoteBalance = selectedAccounts.reduce((sum, acc) => sum + acc.balance.usdt, 0);
      return quoteBalance.toFixed(2);
    }
  };

  // Función para establecer el porcentaje de la cantidad disponible
  const setAmountPercentage = (percentage: number) => {
    // Calcular el balance disponible del activo seleccionado en las subcuentas seleccionadas
    const availableAmount = subAccounts
      .filter(acc => selectedSubAccounts.includes(acc.id))
      .reduce((sum, acc) => {
        // Si es compra, usamos el balance de USDT dividido por el precio
        if (side === 'buy') {
          const usdtBalance = acc.balance.usdt;
          const priceValue = parseFloat(price) || parseFloat(selectedPair.price);
          if (priceValue > 0) {
            return sum + (usdtBalance / priceValue);
          }
          return sum;
        } 
        // Si es venta, usamos el balance del activo directamente
        else {
          // Usar BTC como ejemplo, pero idealmente debería ser dinámico según el activo seleccionado
          return sum + acc.balance.btc;
        }
      }, 0);

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
    
    // Obtener el balance total disponible
    const totalBalance = subAccounts
      .filter(acc => selectedSubAccounts.includes(acc.id))
      .reduce((sum, acc) => {
        return side === 'buy' ? sum + acc.balance.usdt : sum + (
          selectedPair.symbol === 'BTC' ? acc.balance.btc * parseFloat(selectedPair.price) :
          selectedPair.symbol === 'ETH' ? (acc.balance.eth || 0) * parseFloat(selectedPair.price) :
          (acc.balance[selectedPair.symbol.toLowerCase()] || 0) * parseFloat(selectedPair.price)
        );
      }, 0);
    
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
    
    // Obtener las subcuentas seleccionadas
    const selectedAccounts = subAccounts.filter(acc => selectedSubAccounts.includes(acc.id));
    
    // Si no hay subcuentas seleccionadas, no podemos validar
    if (selectedAccounts.length === 0) return false;
    
    // Para compras, validamos el balance de USDT
    if (side === 'buy') {
      // Calcular el costo total de la operación
      let totalCost = parseFloat(calculateTotal());
      
      // Para futuros, aplicar el apalancamiento
      if (marketType === 'perpetual' && leverage) {
        // El costo es el valor nominal / apalancamiento (margen requerido)
        const leverageValue = parseFloat(leverage);
        if (leverageValue > 0) {
          // El costo ya está calculado con apalancamiento en calculateTotal
        }
      }
      
      // Obtener el balance disponible de USDT
      const availableUSDT = selectedAccounts.reduce((sum, acc) => sum + acc.balance.usdt, 0);
      
      // Validar si hay suficiente balance
      if (totalCost > availableUSDT) {
        showError(`Balance insuficiente. Necesitas ${totalCost.toFixed(2)} USDT pero solo tienes ${availableUSDT.toFixed(2)} USDT disponible.`);
        return false;
      }
    } 
    // Para ventas, validamos el balance del activo seleccionado
    else {
      const amountNeeded = parseFloat(amount);
      
      // Obtener el balance del activo seleccionado de forma dinámica
      const availableAsset = selectedAccounts.reduce((sum, acc) => {
        if (selectedPair.symbol === 'BTC') {
          return sum + acc.balance.btc;
        } else if (selectedPair.symbol === 'ETH') {
          return sum + (acc.balance.eth || 0);
        } else {
          // Para otros activos, intentar encontrarlos en el balance o usar 0
          const otherBalance = acc.balance[selectedPair.symbol.toLowerCase()] || 0;
          return sum + otherBalance;
        }
      }, 0);
      
      // Validar si hay suficiente balance
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
    
    if (selectedSubAccounts.length === 0) {
      showError('Por favor, seleccione al menos una subcuenta.');
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
      // Validar parámetros y preparar el resumen de la orden
      if (!validateOrderParams()) {
        return;
      }
      
      // Preparar el resumen de la orden
      const selectedAccounts = subAccounts.filter(account => 
        selectedSubAccounts.includes(account.id)
      );
      
      // Crear el objeto de resumen con todos los detalles
      const summary: OrderSummary = {
        marketType,
        orderType,
        side,
        price: orderType === 'market' ? 'Mercado' : price,
        amount,
        total: calculateTotal(),
        leverage: marketType === 'perpetual' ? leverage : null,
        subAccounts: selectedAccounts
      };
      
      // Actualizar el estado y mostrar confirmación
      setOrderSummary(summary);
      setIsLoading(true);
      
      // Simular una llamada a la API
      // Eliminar log innecesario
      // console.log('Ejecutando orden:', summary);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mostrar mensaje de éxito
      setSuccessMessage('Orden ejecutada exitosamente');
      setShowSuccess(true);
      
      // Limpiar campos después de ejecutar la orden
      if (orderType !== 'market') {
        setPrice('');
      }
      setAmount('');
      
      // Ocultar mensaje de éxito después de un tiempo
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error al ejecutar la orden:', error);
      showError('Error al ejecutar la orden. Por favor, intente nuevamente.');
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
    return orderSide === 'buy' ? bestBidPrice : bestAskPrice;
  };

  // Actualizar el precio cuando cambia el par seleccionado, pero solo si está vacío o es la primera carga
  useEffect(() => {
    // Solo actualizar el precio si:
    // 1. Es la primera carga del componente
    // 2. El campo de precio está vacío
    // 3. El tipo de orden es límite
    if ((isFirstLoad.current || !price) && orderType === 'limit' && selectedPair) {
      setPrice(parseFloat(selectedPair.price).toFixed(
        parseFloat(selectedPair.price) < 1 ? 4 : 
        parseFloat(selectedPair.price) < 100 ? 2 : 0
      ));
      
      // Ya no es la primera carga
      isFirstLoad.current = false;
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
              <div className="p-3 border-b border-zinc-800">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar activo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    autoFocus
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
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE'].map(symbol => (
                    <button
                      key={symbol}
                      onClick={() => {
                        setSearchQuery(symbol);
                        const pair = tickers.find(t => t.symbol === symbol);
                        if (pair) {
                          setSelectedPair(pair);
                          setShowSearchResults(false);
                        }
                      }}
                      className="px-2 py-1 text-xs rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                    >
                      {symbol}
                    </button>
                  ))}
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
                {marketType === 'spot' && (
                  <>
                    <button
                      onClick={() => setActiveTab('defi')}
                      className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                        activeTab === 'defi'
                          ? 'bg-blue-500/20 text-blue-400 shadow-lg'
                          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      DeFi
                    </button>
                    <button
                      onClick={() => setActiveTab('layer1')}
                      className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                        activeTab === 'layer1'
                          ? 'bg-green-500/20 text-green-400 shadow-lg'
                          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      Layer 1
                    </button>
                  </>
                )}
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
                            {assetCategories.defi.includes(pair.symbol) && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-500/20 text-blue-400 font-medium">DeFi</span>
                            )}
                            {assetCategories.layer1.includes(pair.symbol) && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-green-500/20 text-green-400 font-medium">L1</span>
                            )}
                            {marketType === 'perpetual' && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-400 font-medium">Perp</span>
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
                  parseFloat(selectedPair.change.replace('%', '').replace('+', '')) < 0 
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Tipo de Orden
                  </label>
                </div>
                
                {/* Tipos de órdenes básicas */}
                <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg p-1 mb-2">
                  <button 
                    onClick={() => {
                      setOrderType('limit');
                    }}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      orderType === 'limit'
                        ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-600/50'
                    }`}
                  >
                    Límite
                  </button>
                  <button 
                    onClick={() => {
                      setOrderType('market');
                    }}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      orderType === 'market'
                        ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-600/50'
                    }`}
                  >
                    Mercado
                  </button>
                </div>
                
                {/* Descripción del tipo de orden */}
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-2">
                  {orderType === 'market' && (
                    <span>Orden a mercado: se ejecuta inmediatamente al mejor precio disponible.</span>
                  )}
                  {orderType === 'limit' && (
                    <span>Orden límite: se ejecuta solo cuando el precio alcanza o mejora el valor especificado.</span>
                  )}
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
                        <button 
                          onClick={() => setPrice(getBestPrice(side === 'buy' ? 'sell' : 'buy'))}
                          className={`text-xs font-medium ${
                            side === 'buy' ? 'text-rose-500 hover:text-rose-600' : 'text-emerald-500 hover:text-emerald-600'
                          }`}
                        >
                          {getBestPrice(side === 'buy' ? 'sell' : 'buy')}
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full pl-4 pr-24 py-3 text-base border-zinc-300 dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        placeholder="0.00"
                        step={selectedPair.symbol === 'BTC' ? "0.1" : selectedPair.symbol === 'ETH' ? "0.01" : "0.001"}
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
                    {/* Botones de precios rápidos */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button 
                        onClick={() => setPrice(bestBidPrice)}
                        className="py-1.5 text-xs font-medium rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        Mejor compra: {bestBidPrice}
                      </button>
                      <button 
                        onClick={() => setPrice(bestAskPrice)}
                        className="py-1.5 text-xs font-medium rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      >
                        Mejor venta: {bestAskPrice}
                      </button>
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
                        {getAvailableBalance('base')} {selectedPair.symbol}
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
                      step={selectedPair.symbol === 'BTC' ? "0.0001" : selectedPair.symbol === 'ETH' ? "0.001" : "0.01"}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button 
                        onClick={() => adjustAmount(false)}
                        className="p-1.5 hover:text-violet-500 dark:hover:text-violet-400 bg-zinc-100 dark:bg-zinc-700 rounded-md mr-1"
                      >
                        <span className="text-sm font-medium">-</span>
                      </button>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 mx-2">{selectedPair.symbol}</span>
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
                        {getAvailableBalance('quote')} USDT
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

              {/* Sección de Riesgo */}
              <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Análisis de Riesgo
                  </label>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Valor de la operación:</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                      {formatNumber(calculateRisk())} USDT
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Porcentaje del balance:</span>
                    <span className={`text-sm font-medium ${
                      calculateRiskPercentage() > 20 ? 'text-rose-500' : 
                      calculateRiskPercentage() > 10 ? 'text-amber-500' : 
                      'text-emerald-500'
                    }`}>
                      {calculateRiskPercentage().toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 mt-1">
                    <div 
                      className={`h-1.5 rounded-full ${
                        calculateRiskPercentage() > 20 ? 'bg-rose-500' : 
                        calculateRiskPercentage() > 10 ? 'bg-amber-500' : 
                        'bg-emerald-500'
                      }`} 
                      style={{ width: `${Math.min(calculateRiskPercentage(), 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {calculateRiskPercentage() > 20 ? (
                      <span className="text-rose-500">Riesgo alto. Considere reducir el tamaño de la operación.</span>
                    ) : calculateRiskPercentage() > 10 ? (
                      <span className="text-amber-500">Riesgo moderado. Dentro de los límites recomendados.</span>
                    ) : (
                      <span className="text-emerald-500">Riesgo bajo. Operación conservadora.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón de Ejecutar Orden */}
              <button
                onClick={executeOrder}
                disabled={isLoading}
                className={`w-full py-4 px-6 rounded-xl text-white font-medium text-base transition-all ${
                  side === 'buy'
                    ? 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700'
                    : 'bg-rose-500 hover:bg-rose-600 active:bg-rose-700'
                } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </span>
                ) : (
                  <span>
                    {side === 'buy' ? 'Comprar' : 'Vender'} {selectedPair.symbol}
                    {orderType !== 'market' && ` a ${price} USDT`}
                  </span>
                )}
              </button>

              {/* Resumen de la orden */}
              <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <h4 className="text-sm font-medium text-zinc-900 dark:text-white mb-2">Resumen de la Orden</h4>
                <div className="space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="flex justify-between">
                    <span>Tipo:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {orderType === 'market' && 'Mercado'}
                      {orderType === 'limit' && 'Límite'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Par:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{selectedPair.symbol}/USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lado:</span>
                    <span className={`font-medium ${side === 'buy' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {side === 'buy' ? 'Compra' : 'Venta'}
                    </span>
                  </div>
                  {orderType !== 'market' && (
                    <div className="flex justify-between">
                      <span>Precio:</span>
                      <span className="font-medium text-zinc-900 dark:text-white">{price} USDT</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Cantidad:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{amount} {selectedPair.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{calculateTotal()} USDT</span>
                  </div>
                  {marketType === 'perpetual' && (
                    <div className="flex justify-between">
                      <span>Apalancamiento:</span>
                      <span className="font-medium text-zinc-900 dark:text-white">{leverage}x</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Subcuentas:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {selectedSubAccounts.length} seleccionada{selectedSubAccounts.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
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
                  {orderSummary?.subAccounts.map((acc: SubAccount) => acc.name).join(', ')}
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