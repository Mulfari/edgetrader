import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

export interface SpotMarketTicker {
  symbol: string;
  price: string;
  indexPrice: string;
  change: string;
  volume: string;
  high24h: string;
  low24h: string;
  volumeUSDT: string;
  marketType: 'spot';
  bidPrice: string;
  askPrice: string;
  favorite: boolean;
}

export interface PerpetualMarketTicker {
  symbol: string;
  price: string;
  indexPrice: string;
  change: string;
  volume: string;
  high24h: string;
  low24h: string;
  volumeUSDT: string;
  marketType: 'perpetual';
  openInterest: string;
  fundingRate: string;
  nextFundingTime: number;
  leverage: string;
  markPrice: string;
  lastPrice: string;
  bidPrice: string;
  askPrice: string;
  favorite: boolean;
}

export type MarketTicker = SpotMarketTicker | PerpetualMarketTicker;

const defaultSpotTickers: SpotMarketTicker[] = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'LINK', 'UNI', 'SHIB', 'LTC', 'BCH', 'ATOM', 'NEAR', 'AVAX', 'MATIC', 'DOT'].map(symbol => ({
  symbol,
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
}));

const defaultPerpetualTickers: PerpetualMarketTicker[] = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'LINK', 'UNI', 'AVAX', 'MATIC', 'DOT'].map(symbol => ({
  symbol,
  price: '0.00',
  indexPrice: '0.00',
  change: '0.00%',
  volume: '0',
  high24h: '0.00',
  low24h: '0.00',
  volumeUSDT: '0',
  marketType: 'perpetual',
  openInterest: '0',
  fundingRate: '0.00%',
  nextFundingTime: Date.now() + 8 * 60 * 60 * 1000,
  leverage: '10x',
  markPrice: '0.00',
  lastPrice: '0.00',
  bidPrice: '0.00',
  askPrice: '0.00',
  favorite: false
}));

export const useMarketData = (marketType: 'spot' | 'perpetual' = 'spot') => {
  const [tickers, setTickers] = useState<MarketTicker[]>(
    marketType === 'spot' ? defaultSpotTickers : defaultPerpetualTickers
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  // Cargar favoritos desde localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem(`${marketType}MarketFavorites`);
    if (savedFavorites) {
      try {
        const parsedFavorites = JSON.parse(savedFavorites);
        setFavorites(new Set(parsedFavorites));
      } catch (error) {
        // Error silencioso
      }
    }
  }, [marketType]);

  // Función para obtener datos del backend
  const fetchTickers = useCallback(async (showLoading = false) => {
    try {
      // Solo mostrar indicador de carga en la carga inicial o cuando se solicita explícitamente
      if (!initialLoadDone.current || showLoading) {
        setLoading(true);
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const endpoint = marketType === 'spot' ? 'spot' : 'perpetual';
      
      const response = await axios.get<MarketTicker[]>(`${apiUrl}/api/market/${endpoint}/tickers`);
      
      if (response.data && Array.isArray(response.data)) {
        const validatedTickers = response.data.map(ticker => {
          if (marketType === 'spot') {
            return {
              symbol: ticker.symbol || '',
              price: ticker.price || '0.00',
              indexPrice: ticker.indexPrice || '0.00',
              change: ticker.change || '0.00%',
              volume: ticker.volume || '0',
              high24h: ticker.high24h || '0.00',
              low24h: ticker.low24h || '0.00',
              volumeUSDT: ticker.volumeUSDT || '0',
              marketType: 'spot' as const,
              bidPrice: (ticker as SpotMarketTicker).bidPrice || '0.00',
              askPrice: (ticker as SpotMarketTicker).askPrice || '0.00',
              favorite: favorites.has(ticker.symbol)
            } as SpotMarketTicker;
          } else {
            // Para mercados perpetuales, asegurarse de que todos los campos requeridos estén presentes
            const perpetualTicker = ticker as PerpetualMarketTicker;
            
            // Verificar si el ticker tiene las propiedades necesarias
            const hasPerpetualProps = 
              'openInterest' in perpetualTicker && 
              'fundingRate' in perpetualTicker && 
              'nextFundingTime' in perpetualTicker;
            
            return {
              symbol: ticker.symbol || '',
              price: ticker.price || '0.00',
              indexPrice: ticker.indexPrice || '0.00',
              change: ticker.change || '0.00%',
              volume: ticker.volume || '0',
              high24h: ticker.high24h || '0.00',
              low24h: ticker.low24h || '0.00',
              volumeUSDT: ticker.volumeUSDT || '0',
              marketType: 'perpetual' as const,
              openInterest: perpetualTicker.openInterest || '0 BTC',
              fundingRate: perpetualTicker.fundingRate || '0.00%',
              nextFundingTime: perpetualTicker.nextFundingTime || (Date.now() + 8 * 60 * 60 * 1000),
              leverage: perpetualTicker.leverage || '10x',
              markPrice: perpetualTicker.markPrice || '0.00',
              lastPrice: perpetualTicker.lastPrice || '0.00',
              bidPrice: perpetualTicker.bidPrice || '0.00',
              askPrice: perpetualTicker.askPrice || '0.00',
              favorite: favorites.has(ticker.symbol)
            } as PerpetualMarketTicker;
          }
        });
        
        setTickers(validatedTickers);
        setError(null);
        initialLoadDone.current = true;
      } else {
        console.error(`Invalid ${marketType} data format received`);
        setError(`Formato de datos inválido recibido del servidor para ${marketType}`);
      }
    } catch (err) {
      console.error(`Error fetching ${marketType} market data:`, err);
      
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || 
          `Error al cargar los datos del mercado ${marketType}. Por favor, intente nuevamente.`;
        setError(errorMessage);
      } else {
        setError(`Error inesperado al cargar los datos del mercado ${marketType}`);
      }
    } finally {
      setLoading(false);
    }
  }, [favorites, marketType]);

  // Efecto para cargar datos iniciales y configurar polling
  useEffect(() => {
    // Resetear el estado cuando cambia el tipo de mercado
    initialLoadDone.current = false;
    setTickers(marketType === 'spot' ? defaultSpotTickers : defaultPerpetualTickers);
    setLoading(true);
    
    let isSubscribed = true;

    // Fetch inicial (mostrar carga)
    const loadInitialData = async () => {
      try {
        await fetchTickers(true);
      } catch (err) {
        console.error(`Error in initial ${marketType} data load:`, err);
      }
    };

    loadInitialData();

    // Polling cada 2 segundos para mantener los datos actualizados (sin mostrar carga)
    const interval = setInterval(async () => {
      if (isSubscribed) {
        try {
          await fetchTickers(false);
        } catch (err) {
          console.error(`Error in polling ${marketType} data:`, err);
        }
      }
    }, 2000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [fetchTickers, marketType]);

  // Función para marcar/desmarcar favoritos
  const toggleFavorite = useCallback((symbol: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol);
      } else {
        newFavorites.add(symbol);
      }
      
      // Guardar en localStorage
      localStorage.setItem(`${marketType}MarketFavorites`, JSON.stringify([...newFavorites]));
      
      // Actualizar el estado de favoritos en los tickers
      setTickers(currentTickers => 
        currentTickers.map(ticker => ({
          ...ticker,
          favorite: newFavorites.has(ticker.symbol)
        }))
      );
      
      return newFavorites;
    });
  }, [marketType]);

  // Función para obtener un ticker específico
  const getTicker = useCallback((symbol: string): MarketTicker | undefined => {
    return tickers.find(ticker => ticker.symbol === symbol);
  }, [tickers]);

  // Función para actualización manual (siempre muestra indicador de carga)
  const refreshData = useCallback(() => {
    return fetchTickers(true);
  }, [fetchTickers]);

  return {
    tickers,
    loading,
    error,
    toggleFavorite,
    getTicker,
    refreshData
  };
}; 