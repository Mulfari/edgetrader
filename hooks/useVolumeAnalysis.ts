import { useState, useEffect, useCallback } from 'react';
import { VolumeData, VolumeAnalysis } from '@/types/market';

interface UseVolumeAnalysisProps {
  symbol: string;
  interval?: '1' | '3' | '5' | '15' | '30' | '60' | '120' | '240' | '360' | '720' | 'D' | 'W' | 'M';
  limit?: number;
  refreshInterval?: number;
}

export function useVolumeAnalysis({
  symbol,
  interval = '60',
  limit = 24,
  refreshInterval = 30000
}: UseVolumeAnalysisProps) {
  const [data, setData] = useState<VolumeData[]>([]);
  const [analysis, setAnalysis] = useState<VolumeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch(
        `/api/market/volume/${symbol}?interval=${interval}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const volumeData: VolumeData[] = await response.json();
      setData(volumeData);
      
      // Analizar los datos de volumen
      if (volumeData.length > 0) {
        const latest = volumeData[0];
        const currentVolume = parseFloat(latest.volume);
        
        // Calcular volumen promedio
        const averageVolume = volumeData.reduce((sum, item) => sum + parseFloat(item.volume), 0) / volumeData.length;
        const volumeRatio = currentVolume / averageVolume;
        
        // Determinar tendencia
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (volumeData.length >= 6) {
          const recent = volumeData.slice(0, 3);
          const older = volumeData.slice(3, 6);
          
          const avgRecentVolume = recent.reduce((sum, item) => sum + parseFloat(item.volume), 0) / recent.length;
          const avgOlderVolume = older.reduce((sum, item) => sum + parseFloat(item.volume), 0) / older.length;
          
          const change = (avgRecentVolume - avgOlderVolume) / avgOlderVolume;
          
          if (change > 0.2) {
            trend = 'increasing';
          } else if (change < -0.2) {
            trend = 'decreasing';
          }
        }
        
        // Determinar fuerza del volumen
        let strength: 'low' | 'normal' | 'high' | 'extreme' = 'normal';
        if (volumeRatio > 3) {
          strength = 'extreme';
        } else if (volumeRatio > 2) {
          strength = 'high';
        } else if (volumeRatio < 0.5) {
          strength = 'low';
        }
        
        setAnalysis({
          currentVolume,
          averageVolume,
          volumeRatio,
          trend,
          strength
        });
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching volume data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [symbol, interval, limit]);

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