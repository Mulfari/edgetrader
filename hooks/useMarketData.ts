import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface MarketTicker {
  symbol: string;
  price: string;
  change: string;
  volume: string;
  high24h: string;
  low24h: string;
  volumeUSDT: string;
  leverage?: string;
  favorite?: boolean;
  interestRate?: {
    long: string;
    short: string;
  };
}

export const useMarketData = () => {
  const [tickers, setTickers] = useState<MarketTicker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const fetchTickers = useCallback(async () => {
    try {
      const response = await axios.get<MarketTicker[]>('/api/market/tickers');
      const tickersWithFavorites = response.data.map(ticker => ({
        ...ticker,
        favorite: favorites.has(ticker.symbol)
      }));
      setTickers(tickersWithFavorites);
      setError(null);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || 
          'Error al cargar los datos del mercado. Por favor, intente nuevamente.'
        );
      } else {
        setError('Error inesperado al cargar los datos del mercado');
      }
      console.error('Error fetching market data:', err);
    } finally {
      setLoading(false);
    }
  }, [favorites]);

  useEffect(() => {
    // Cargar favoritos guardados
    const savedFavorites = localStorage.getItem('marketFavorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }

    // Fetch inicial
    fetchTickers();

    // Polling cada 5 segundos
    const interval = setInterval(fetchTickers, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchTickers]);

  const toggleFavorite = useCallback((symbol: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol);
      } else {
        newFavorites.add(symbol);
      }
      
      // Guardar en localStorage
      localStorage.setItem('marketFavorites', JSON.stringify([...newFavorites]));
      
      return newFavorites;
    });
  }, []);

  const getTicker = useCallback((symbol: string): MarketTicker | undefined => {
    return tickers.find(ticker => ticker.symbol === symbol);
  }, [tickers]);

  return {
    tickers,
    loading,
    error,
    getTicker,
    toggleFavorite,
    favorites
  };
}; 