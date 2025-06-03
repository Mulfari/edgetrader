import { useState, useEffect, useCallback } from 'react';
import { LongShortRatioData, LongShortAnalysis } from '@/types/market';

interface UseLongShortRatioProps {
  symbol: string;
  period?: '5min' | '15min' | '30min' | '1h' | '4h' | '1d';
  limit?: number;
  refreshInterval?: number;
}

export function useLongShortRatio({
  symbol,
  period = '1h',
  limit = 24,
  refreshInterval = 30000 // 30 segundos
}: UseLongShortRatioProps) {
  const [data, setData] = useState<LongShortRatioData[]>([]);
  const [analysis, setAnalysis] = useState<LongShortAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch(
        `/api/market/long-short-ratio/${symbol}?period=${period}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const ratioData: LongShortRatioData[] = await response.json();
      setData(ratioData);
      
      // Analizar los datos
      if (ratioData.length > 0) {
        const latest = ratioData[0];
        const longRatio = parseFloat(latest.buyRatio);
        const shortRatio = parseFloat(latest.sellRatio);
        
        // Calcular tendencia basada en los últimos datos
        let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        let strength: 'weak' | 'moderate' | 'strong' = 'weak';
        
        if (ratioData.length >= 3) {
          const recent = ratioData.slice(0, 3);
          const avgLongRecent = recent.reduce((sum, item) => sum + parseFloat(item.buyRatio), 0) / recent.length;
          const older = ratioData.slice(3, 6);
          
          if (older.length > 0) {
            const avgLongOlder = older.reduce((sum, item) => sum + parseFloat(item.buyRatio), 0) / older.length;
            const change = avgLongRecent - avgLongOlder;
            
            if (change > 0.05) {
              trend = 'bullish';
              strength = change > 0.15 ? 'strong' : change > 0.1 ? 'moderate' : 'weak';
            } else if (change < -0.05) {
              trend = 'bearish';
              strength = change < -0.15 ? 'strong' : change < -0.1 ? 'moderate' : 'weak';
            }
          }
        }
        
        // Generar recomendación
        let recommendation = '';
        if (longRatio > 0.65) {
          recommendation = 'Dominio de posiciones largas - Posible corrección';
        } else if (longRatio < 0.35) {
          recommendation = 'Dominio de posiciones cortas - Posible rebote';
        } else if (trend === 'bullish' && strength !== 'weak') {
          recommendation = 'Incremento en posiciones largas - Sentimiento alcista';
        } else if (trend === 'bearish' && strength !== 'weak') {
          recommendation = 'Incremento en posiciones cortas - Sentimiento bajista';
        } else {
          recommendation = 'Ratio equilibrado - Mercado neutral';
        }
        
        setAnalysis({
          currentRatio: {
            long: longRatio,
            short: shortRatio
          },
          trend,
          strength,
          recommendation
        });
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching long/short ratio:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [symbol, period, limit]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  return {
    data,
    analysis,
    loading,
    error,
    lastUpdate,
    refresh
  };
} 