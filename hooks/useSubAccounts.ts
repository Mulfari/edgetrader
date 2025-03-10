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
          try {
            const { data, timestamp }: CacheData = JSON.parse(cachedData);
            const isValid = Date.now() - timestamp < CACHE_DURATION;
            
            if (isValid && Array.isArray(data) && data.length > 0) {
              console.log("✅ Usando subcuentas desde caché:", data.length);
              setSubAccounts(data);
              setIsLoading(false);
              return;
            } else {
              console.log("⚠️ Caché de subcuentas expirado o vacío, solicitando datos frescos");
            }
          } catch (err) {
            console.error("❌ Error al parsear caché de subcuentas:", err);
          }
        } else {
          console.log("ℹ️ No se encontró caché de subcuentas");
        }
      } else {
        console.log("🔄 Forzando actualización de subcuentas");
      }

      // Si no hay caché válido o se fuerza la actualización, hacer la petición
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch('/api/subaccounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al cargar las subcuentas: ${response.status}`);
      }

      const data = await response.json();
      
      // Validar que los datos son un array
      if (!Array.isArray(data)) {
        throw new Error('Formato de datos incorrecto');
      }
      
      // Guardar en caché
      const cacheData: CacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log("✅ Subcuentas actualizadas y guardadas en caché:", data.length);
      
      setSubAccounts(data);
    } catch (err) {
      console.error("❌ Error en useSubAccounts:", err);
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