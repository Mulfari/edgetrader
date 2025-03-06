import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchTickers = async () => {
      try {
        const response = await axios.get<MarketTicker[]>('/api/market/tickers');
        const tickersWithFavorites = response.data.map(ticker => ({
          ...ticker,
          favorite: false
        }));
        setTickers(tickersWithFavorites);
        setError(null);
      } catch (err) {
        setError('Error al cargar los datos del mercado');
        console.error('Error fetching market data:', err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch inicial
    fetchTickers();

    // Polling cada 5 segundos como fallback si WebSocket falla
    const interval = setInterval(fetchTickers, 5000);

    return () => clearInterval(interval);
  }, []);

  const getTicker = (symbol: string): MarketTicker | undefined => {
    return tickers.find(ticker => ticker.symbol === symbol);
  };

  return {
    tickers,
    loading,
    error,
    getTicker
  };
}; 