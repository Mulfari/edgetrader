import { useState, useEffect, useCallback } from "react";
import { getUserSubaccounts, Subaccount } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Componente para obtener y gestionar subcuentas con sus claves desencriptadas.
 * Este componente se puede utilizar como base para otros componentes que necesiten
 * acceder a las subcuentas y sus claves API.
 */
export default function SettingsSubaccounts2() {
  const [subaccounts, setSubaccounts] = useState<Subaccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  /**
   * Obtiene las subcuentas del usuario desde la API
   */
  const fetchSubaccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await getUserSubaccounts();
      
      if (error) {
        console.error("Error específico al obtener subcuentas:", error);
        toast({
          title: "Error",
          description: `No se pudieron cargar las subcuentas: ${error}`,
          variant: "destructive",
        });
        return;
      }
      
      // Verificar si hay subcuentas
      if (!data || data.length === 0) {
        console.log("No se encontraron subcuentas para este usuario");
      } else {
        console.log(`Se encontraron ${data.length} subcuentas`);
        
        // Mostrar información sobre las claves desencriptadas (solo para fines de desarrollo)
        data.forEach(account => {
          console.log(`Subcuenta: ${account.name}`);
          console.log(`API Key: ${account.api_key.substring(0, 3)}...${account.api_key.substring(account.api_key.length - 3)}`);
          console.log(`Secret Key: ${account.secret_key.substring(0, 3)}...${account.secret_key.substring(account.secret_key.length - 3)}`);
        });
      }
      
      setSubaccounts(data || []);
    } catch (error: any) {
      console.error("Error no controlado al cargar subcuentas:", error);
      toast({
        title: "Error inesperado",
        description: `Error al cargar subcuentas: ${error?.message || error}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  // Cargar subcuentas al montar el componente
  useEffect(() => {
    fetchSubaccounts();
  }, [fetchSubaccounts]);

  // Manejar actualización manual
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSubaccounts();
  };

  /**
   * Obtener una subcuenta por su ID
   */
  const getSubaccountById = (id: string): Subaccount | undefined => {
    return subaccounts.find(account => account.id === id);
  };

  /**
   * Obtener una subcuenta por su nombre
   */
  const getSubaccountByName = (name: string): Subaccount | undefined => {
    return subaccounts.find(account => account.name === name);
  };

  /**
   * Ejemplo de cómo consumir las claves API de una subcuenta
   */
  const useSubaccountKeys = async (subaccountId: string) => {
    const account = getSubaccountById(subaccountId);
    
    if (!account) {
      console.error("No se encontró la subcuenta con ID:", subaccountId);
      return null;
    }
    
    // Aquí podrías hacer algo con las claves, como conectarte a una API externa
    const apiKeys = {
      apiKey: account.api_key,
      secretKey: account.secret_key
    };
    
    return apiKeys;
  };

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 rounded-md shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Gestor de Subcuentas (versión 2)
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Este componente obtiene subcuentas con claves desencriptadas para uso programático
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={isRefreshing || isLoading}
          className="h-8"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Estado de carga */}
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Resumen de subcuentas */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Resumen</h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              {subaccounts.length === 0 
                ? "No hay subcuentas configuradas" 
                : `Hay ${subaccounts.length} subcuenta(s) configurada(s)`}
            </p>
          </div>

          {/* Tabla de subcuentas */}
          {subaccounts.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-700 dark:text-zinc-300 uppercase bg-zinc-100 dark:bg-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">API Key (primeros/últimos 3 caracteres)</th>
                    <th className="px-4 py-3">Secret Key (primeros/últimos 3 caracteres)</th>
                  </tr>
                </thead>
                <tbody>
                  {subaccounts.map((account) => (
                    <tr key={account.id} className="border-b dark:border-zinc-700">
                      <td className="px-4 py-3">{account.name}</td>
                      <td className="px-4 py-3">
                        {account.api_key.substring(0, 3)}...{account.api_key.substring(account.api_key.length - 3)}
                      </td>
                      <td className="px-4 py-3">
                        {account.secret_key.substring(0, 3)}...{account.secret_key.substring(account.secret_key.length - 3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Instrucciones de uso */}
          <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-md text-sm">
            <h3 className="font-medium mb-2">Cómo usar este componente</h3>
            <p className="mb-3">Este componente proporciona métodos para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Obtener todas las subcuentas con claves desencriptadas</li>
              <li>Buscar subcuentas por ID o nombre</li>
              <li>Utilizar las claves API en otras partes de la aplicación</li>
            </ul>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Puedes importar los hooks y funciones de este componente para acceder a las subcuentas
              desde cualquier otra parte de la aplicación.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook personalizado para usar las subcuentas en otros componentes
 */
export const useSubaccounts = () => {
  const [subaccounts, setSubaccounts] = useState<Subaccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSubaccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await getUserSubaccounts();
      
      if (error) {
        setError(error);
        toast({
          title: "Error",
          description: `No se pudieron cargar las subcuentas: ${error}`,
          variant: "destructive",
        });
        return;
      }
      
      setSubaccounts(data || []);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
      toast({
        title: "Error",
        description: `Error al cargar subcuentas: ${err.message || err}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSubaccounts();
  }, [fetchSubaccounts]);

  return {
    subaccounts,
    isLoading,
    error,
    refresh: fetchSubaccounts,
    getSubaccountById: (id: string) => subaccounts.find(acc => acc.id === id),
    getSubaccountByName: (name: string) => subaccounts.find(acc => acc.name === name)
  };
}; 