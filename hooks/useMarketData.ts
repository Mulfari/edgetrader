import { useState, useEffect, useCallback } from 'react';
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

const defaultSpotTickers: SpotMarketTicker[] = ['BTC', 'ETH', 'SOL', 'XRP'].map(symbol => ({
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

export const useMarketData = () => {
  const [tickers, setTickers] = useState<SpotMarketTicker[]>(defaultSpotTickers);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const fetchTickers = useCallback(async () => {
    try {
      const response = await axios.get<SpotMarketTicker[]>('/api/market/spot/tickers');
      if (response.data) {
        const updatedTickers = response.data.map(ticker => ({
          ...ticker,
          favorite: favorites.has(ticker.symbol)
        }));
        setTickers(updatedTickers);
        setError(null);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || 
          'Error al cargar los datos del mercado. Por favor, intente nuevamente.';
        console.error('API Error:', errorMessage);
        setError(errorMessage);
      } else {
        console.error('Unexpected error:', err);
        setError('Error inesperado al cargar los datos del mercado');
      }
    } finally {
      setLoading(false);
    }
  }, [favorites]);

  useEffect(() => {
    // Cargar favoritos guardados
    const savedFavorites = localStorage.getItem('spotMarketFavorites');
    if (savedFavorites) {
      try {
        const parsedFavorites = JSON.parse(savedFavorites);
        setFavorites(new Set(parsedFavorites));
      } catch (error) {
        console.error('Error parsing saved favorites:', error);
      }
    }

    // Fetch inicial
    fetchTickers();

    // Polling cada segundo para mantener los datos actualizados
    const interval = setInterval(fetchTickers, 1000);

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
      localStorage.setItem('spotMarketFavorites', JSON.stringify([...newFavorites]));
      
      // Actualizar el estado de favoritos en los tickers
      setTickers(currentTickers => 
        currentTickers.map(ticker => ({
          ...ticker,
          favorite: newFavorites.has(ticker.symbol)
        }))
      );
      
      return newFavorites;
    });
  }, []);

  const getTicker = useCallback((symbol: string): SpotMarketTicker | undefined => {
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