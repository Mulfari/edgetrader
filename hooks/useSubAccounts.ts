import { useState, useEffect } from 'react';
import { SubAccount } from '@/types/subaccount';

const CACHE_KEY = 'subaccounts_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

interface CacheData {
  data: SubAccount[];
  timestamp: number;
}

export function useSubAccounts() {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubAccounts = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Verificar caché si no se fuerza la actualización
      if (!forceRefresh) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { data, timestamp }: CacheData = JSON.parse(cachedData);
          const isValid = Date.now() - timestamp < CACHE_DURATION;
          
          if (isValid) {
            setSubAccounts(data);
            setIsLoading(false);
            return;
          }
        }
      }

      // Si no hay caché válido o se fuerza la actualización, hacer la petición
      const response = await fetch('/api/subaccounts');
      if (!response.ok) {
        throw new Error('Error al cargar las subcuentas');
      }

      const data = await response.json();
      
      // Guardar en caché
      const cacheData: CacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      
      setSubAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubAccounts();
  }, []);

  return {
    subAccounts,
    isLoading,
    error,
    refreshSubAccounts: () => loadSubAccounts(true)
  };
} 