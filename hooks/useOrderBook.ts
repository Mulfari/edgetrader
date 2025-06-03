import { useState, useEffect, useCallback, useRef } from 'react';
import { OrderBookLevel3, OrderBookSpread } from '@/types/market';

interface UseOrderBookOptions {
  symbol: string;
  category?: 'spot' | 'linear';
  limit?: number;
  refreshInterval?: number;
}

interface UseOrderBookReturn {
  orderBook: OrderBookLevel3 | null;
  spread: OrderBookSpread | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => void;
}

export function useOrderBook({
  symbol,
  category = 'spot',
  limit = 50,
  refreshInterval = 1000
}: UseOrderBookOptions): UseOrderBookReturn {
  const [orderBook, setOrderBook] = useState<OrderBookLevel3 | null>(null);
  const [spread, setSpread] = useState<OrderBookSpread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchOrderBook = useCallback(async () => {
    if (!symbol) return;

    try {
      // Cancelar la petición anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/market/orderbook-l3/${symbol}?category=${category}&limit=${limit}`,
        {
          signal: abortControllerRef.current.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: OrderBookLevel3 = await response.json();
      
      if (data) {
        setOrderBook(data);
        setLastUpdate(new Date());
        
        // Calcular spread
        if (data.bids.length > 0 && data.asks.length > 0) {
          const bestBid = parseFloat(data.bids[0].price);
          const bestAsk = parseFloat(data.asks[0].price);
          const spreadValue = bestAsk - bestBid;
          const midPrice = (bestBid + bestAsk) / 2;
          const spreadPercent = (spreadValue / midPrice) * 100;
          
          setSpread({
            spread: spreadValue,
            spreadPercent,
            midPrice
          });
        }
        
        setError(null);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching order book:', err);
        setError(err.message || 'Error al obtener datos del order book');
      }
    } finally {
      setLoading(false);
    }
  }, [symbol, category, limit]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchOrderBook();
  }, [fetchOrderBook]);

  useEffect(() => {
    if (!symbol) return;

    // Fetch inicial
    fetchOrderBook();

    // Configurar intervalo de actualización
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchOrderBook, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [symbol, category, limit, refreshInterval, fetchOrderBook]);

  return {
    orderBook,
    spread,
    loading,
    error,
    lastUpdate,
    refresh
  };
} 