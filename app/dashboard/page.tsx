"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  LineChart, 
  DollarSign,
  ChevronDown,
  Eye,
  EyeOff,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  Activity,
  RefreshCw,
  AlertCircle,
  Globe
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { getUserSubaccounts, Subaccount } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WidgetsContainer from "@/components/widgets/WidgetsContainer";

// Tipo para las opciones de balance
type BalanceDisplayType = 'total' | 'real' | 'demo';

// Tipo para las opciones de operaciones
type OperationsDisplayType = 'open' | 'closed' | 'total';

// Definir el tipo AccountStats
type AccountStats = {
  totalAccounts: number;
  realAccounts: number;
  demoAccounts: number;
  totalBalance: number;
  realBalance: number;
  demoBalance: number;
  uniqueExchanges: number;
  avgPerformance: number;
  openOperations: number;
  closedOperations: number;
  totalOperations: number;
};

// Tipo para los resultados de fetchBalance
interface BalanceFetchResult {
    id: string;
    name: string;
    status: 'fulfilled' | 'rejected';
    value?: { 
        success: boolean; 
        data?: { 
            balanceUsd: number; 
            assets: any[] 
        }; 
        error?: string 
    };
    reason?: any;
    is_demo: boolean;
}

// Función de utilidad para acceder a localStorage de forma segura
const safeLocalStorage = {
  getItem: (key: string, defaultValue: any = null): any => {
    if (typeof window !== 'undefined') {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue; // Intentar parsear JSON
      } catch (e) {
        console.warn(`Error reading localStorage key “${key}”:`, e);
        return defaultValue;
      }
    }
    return defaultValue;
  },
  setItem: (key: string, value: any): void => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(value)); // Guardar como JSON
      } catch (e) {
        console.warn(`Error setting localStorage key “${key}”:`, e);
      }
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
};

export default function DashboardPage() {
  const [totalUsdBalance, setTotalUsdBalance] = useState<number | null>(null);
  const [realUsdBalance, setRealUsdBalance] = useState<number | null>(null);
  const [demoUsdBalance, setDemoUsdBalance] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeSubAccounts, setActiveSubAccounts] = useState(0);
  const [realAccountCount, setRealAccountCount] = useState(0);
  const [demoAccountCount, setDemoAccountCount] = useState(0);
  const [exchanges, setExchanges] = useState(0);
  const [openOperations, setOpenOperations] = useState(0);
  const [closedOperations, setClosedOperations] = useState(0);
  const [balanceDisplay, setBalanceDisplay] = useState<BalanceDisplayType>('total');
  const [operationsDisplay, setOperationsDisplay] = useState<OperationsDisplayType>('open');
  const [isLoading, setIsLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [fetchError, setFetchError] = useState<string | null>(null);
  const router = useRouter();
  const { requireAuth, user } = useSupabaseAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Proteger esta ruta con Supabase Auth
    const tokenInStorage = localStorage.getItem('token');
    
    // Comentar temporalmente para probar sin redirección
    // requireAuth();
    
    // En su lugar, solo verificar la autenticación sin redireccionar
    const isAuth = requireAuth(() => {
      // No hacemos nada para evitar la redirección
      return false; // Evita que se ejecute la redirección
    });
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    // Resetear TODOS los balances
    setTotalUsdBalance(null); setRealUsdBalance(null); setDemoUsdBalance(null);
    // Resetear contadores
    setActiveSubAccounts(0); setRealAccountCount(0); setDemoAccountCount(0);
    setExchanges(0);
    // Variables de agregación
    let aggTotalUsd = 0, aggRealUsd = 0, aggDemoUsd = 0;
    let totalAccountCount = 0, realAccounts = 0, demoAccounts = 0;
    let exchangeSet = new Set<string>();

    try {
      console.log("Fetching subaccounts...");
      const { data: subaccounts, error: subaccountsError } = await getUserSubaccounts();

      if (subaccountsError) {
        throw new Error(`Error fetching subaccounts: ${subaccountsError.message}`);
      }

      if (!subaccounts || subaccounts.length === 0) {
        console.log("No subaccounts found.");
        setTotalUsdBalance(0);
        setRealUsdBalance(0);
        setDemoUsdBalance(0);
        setActiveSubAccounts(0);
        setRealAccountCount(0);
        setDemoAccountCount(0);
        setExchanges(0);
        setIsLoading(false);
        return;
      }

      totalAccountCount = subaccounts.length;
      realAccounts = subaccounts.filter(s => !s.is_demo).length;
      demoAccounts = subaccounts.filter(s => s.is_demo).length;
      setActiveSubAccounts(totalAccountCount);
      setRealAccountCount(realAccounts);
      setDemoAccountCount(demoAccounts);
      console.log(`Found ${totalAccountCount} subaccounts. Fetching balances...`);

      // Preparar llamadas a la API Route para cada subcuenta
      const balancePromises = subaccounts.map(async (sub): Promise<BalanceFetchResult> => {
        try {
            const response = await fetch('/api/subaccount/balance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subaccountId: sub.id })
            });
            const result = await response.json();
            if (!response.ok) {
                 // Lanzar error para que lo capture el catch de abajo
                throw new Error(result?.error || `HTTP Error ${response.status}`);
            }
            // Si todo ok, devolver estado fulfilled
            return {
                id: sub.id,
                name: sub.name,
                status: 'fulfilled',
                value: result,
                is_demo: sub.is_demo
            };
        } catch (error) {
            // Si hay cualquier error (fetch, json parse, o el throw anterior), devolver rejected
            return {
                id: sub.id,
                name: sub.name,
                status: 'rejected',
                reason: error instanceof Error ? error.message : String(error),
                is_demo: sub.is_demo
            };
        }
      });

      // Ejecutar todas las llamadas en paralelo y esperar resultados
      const results: BalanceFetchResult[] = await Promise.all(balancePromises);
      console.log("Balance fetch results:", results);

      let failedFetches = 0;
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value?.success) {
          // Extraer solo balance USD
          const data = result.value.data as { balanceUsd: number; assets: any[] } | undefined;
          const balanceUsd = data?.balanceUsd || 0;

          aggTotalUsd += balanceUsd;
          aggRealUsd += balanceUsd;
          aggDemoUsd += balanceUsd;
          const parts = result.name.split(" - ");
          const exchangeName = parts.length > 1 ? parts.slice(1).join(" - ") : result.name;
          if (exchangeName) {
              exchangeSet.add(exchangeName.trim().toLowerCase());
          }
        } else {
          failedFetches++;
          const errorMessage = result.status === 'rejected' ? result.reason : result.value?.error;
          console.error(`Failed to fetch balance for subaccount ${result.id} (${result.name}):`, errorMessage);
           toast({ title: "Error parcial", description: `No se pudo obtener balance para ${result.name}: ${errorMessage}`, variant: "destructive", duration: 2000 });
        }
      });

       if(failedFetches > 0 && failedFetches === results.length) {
           setFetchError(`No se pudo obtener el balance de ninguna subcuenta (${failedFetches} errores).`);
       } else if (failedFetches > 0) {
           setFetchError(`No se pudo obtener el balance de ${failedFetches} subcuenta(s). El total puede ser impreciso.`);
           setTotalUsdBalance(aggTotalUsd);
           setRealUsdBalance(aggRealUsd);
           setDemoUsdBalance(aggDemoUsd);
           setExchanges(exchangeSet.size); 
       } else {
           setTotalUsdBalance(aggTotalUsd);
           setRealUsdBalance(aggRealUsd);
           setDemoUsdBalance(aggDemoUsd);
           setExchanges(exchangeSet.size);
       }

    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      const message = error.message || "Ocurrió un error al cargar los datos.";
      setFetchError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
      setTotalUsdBalance(null);
      setRealUsdBalance(null);
      setDemoUsdBalance(null);
      setActiveSubAccounts(0);
      setRealAccountCount(0);
      setDemoAccountCount(0);
      setExchanges(0);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const savedShowBalance = safeLocalStorage.getItem('showBalancePreference');
    if (savedShowBalance !== null) {
      setShowBalance(savedShowBalance === true);
    }
  }, []);

  const toggleShowBalance = useCallback(() => {
    setShowBalance(prev => {
      const newState = !prev;
      safeLocalStorage.setItem('showBalancePreference', newState);
      return newState;
    });
  }, []);

  const formatValue = (value: number | null) => {
    if (value === null || isNaN(value)) return "--";
    const options: Intl.NumberFormatOptions = { 
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    };
    try { 
      return new Intl.NumberFormat('es-ES', options).format(value);
    } catch (e) { 
      console.error("Error formatting number:", e); 
      return `$${value.toFixed(2)}`; 
    }
  };

  const getSkeletonOrValue = (value: number | string, size: 'sm' | 'lg' = 'lg') => {
    if (isLoading) {
      return (
        <div className="flex flex-col space-y-2">
          <div className={`${size === 'lg' ? 'h-9 w-24' : 'h-5 w-16'} bg-white/20 animate-pulse rounded`}></div>
          <div className={`${size === 'lg' ? 'h-4 w-16' : 'h-3 w-12'} bg-white/10 animate-pulse rounded`}></div>
        </div>
      );
    }
    return value;
  };

  const getBalanceTitle = () => {
    switch (balanceDisplay) {
      case 'real':
        return 'Balance Real';
      case 'demo':
        return 'Balance Demo';
      default:
        return 'Balance Total';
    }
  };

  const getOperationsTitle = () => {
    switch (operationsDisplay) {
      case 'open':
        return 'Operaciones Abiertas';
      case 'closed':
        return 'Operaciones Cerradas';
      default:
        return 'Total Operaciones';
    }
  };

  const getOperationsIcon = () => {
    switch (operationsDisplay) {
      case 'open':
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />;
      case 'closed':
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />;
      default:
        return <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />;
    }
  };

  const getOperationsValue = () => {
    switch (operationsDisplay) {
      case 'open':
        return openOperations;
      case 'closed':
        return closedOperations;
      default:
        return exchanges;
    }
  };

  const getOperationsDescription = () => {
    switch (operationsDisplay) {
      case 'open':
        return 'Operaciones en curso';
      case 'closed':
        return 'Operaciones finalizadas';
      default:
        return 'Total de operaciones realizadas';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const getTrendColor = (value: number | null, previousValue: number) => {
    if (value === null) return 'text-yellow-400';
    if (value > previousValue) return 'text-green-400';
    if (value < previousValue) return 'text-red-400';
    return 'text-yellow-400';
  };

  const subAccountsComponent = useMemo(() => {
    return (
      <div className="p-8 rounded-lg border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Componente de Subcuentas deshabilitado temporalmente</h2>
        <p>El componente SubAccounts ha sido deshabilitado para pruebas.</p>
      </div>
    );
  }, []);

  const handleBalanceDisplayChange = (type: BalanceDisplayType) => {
    setBalanceDisplay(type);
  };

  const getDisplayBalance = () => {
    switch(balanceDisplay) {
        case 'real': return realUsdBalance;
        case 'demo': return demoUsdBalance;
        default: return totalUsdBalance;
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8" onMouseMove={handleMouseMove}>
      {tooltipContent && (
        <div 
          className="fixed z-50 px-2 py-1 text-xs bg-black/90 text-white rounded shadow-lg pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y + 10,
          }}
        >
          {tooltipContent}
        </div>
      )}

      {fetchError && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive border border-destructive/30 rounded-lg text-center">
          <p className="font-medium">{fetchError.includes("ninguna") || fetchError.includes("cargar") ? "Error al Cargar Datos" : "Aviso"}</p>
          <p className="text-sm">{fetchError}</p>
      </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="col-span-1 sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl p-4 sm:p-6 text-white relative overflow-hidden shadow-lg">
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center rounded-lg bg-white/10 text-xs font-medium">
                      <button
                        onClick={() => handleBalanceDisplayChange('total')}
                  className={`px-2.5 py-1 rounded-l-md transition-colors ${balanceDisplay === 'total' ? 'bg-white/20' : 'hover:bg-white/15'}`}
                >Todos</button>
                      <button
                        onClick={() => handleBalanceDisplayChange('real')}
                  className={`px-2.5 py-1 transition-colors ${balanceDisplay === 'real' ? 'bg-white/20' : 'hover:bg-white/15'}`}
                >Real</button>
                      <button
                        onClick={() => handleBalanceDisplayChange('demo')}
                  className={`px-2.5 py-1 rounded-r-md transition-colors ${balanceDisplay === 'demo' ? 'bg-white/20' : 'hover:bg-white/15'}`}
                >Demo</button>
              </div>
              <button
                onClick={toggleShowBalance}
                className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
                aria-label={showBalance ? "Ocultar balance" : "Mostrar balance"}
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="text-3xl sm:text-4xl font-bold min-h-[40px] sm:min-h-[48px]">
              {isLoading ? <Skeleton className="h-10 w-40 bg-white/20 rounded-md animate-pulse" /> : (
                showBalance ? formatValue(getDisplayBalance()) : "••••••"
              )}
            </div>
          </div>
          <DollarSign className="absolute right-0 bottom-0 h-20 w-20 text-white/10 transform translate-x-4 translate-y-4" />
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-sky-600 rounded-xl p-4 sm:p-6 text-white relative overflow-hidden shadow-lg">
          <div className="relative z-10">
            <h3 className="text-sm sm:text-base font-medium text-white/90 mb-3">Subcuentas Conectadas</h3>
            <div className="text-3xl sm:text-4xl font-bold min-h-[40px] sm:min-h-[48px]">
              {isLoading ? <Skeleton className="h-10 w-20 bg-white/20 rounded-md animate-pulse" /> : activeSubAccounts}
            </div>
            <div className="mt-2 text-xs text-white/80">
              {isLoading ?
                <Skeleton className="h-4 w-24 bg-white/10 rounded-md animate-pulse" />
                :
                (activeSubAccounts === 1 ? 'Cuenta activa.' : 'Cuentas activas.')
              }
            </div>
          </div>
          <Users className="absolute right-0 bottom-0 h-20 w-20 text-white/10 transform translate-x-4 translate-y-4" />
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl p-4 sm:p-6 text-white relative overflow-hidden shadow-lg">
          <div className="relative z-10">
            <h3 className="text-sm sm:text-base font-medium text-white/90 mb-3">Exchanges Conectados</h3>
            <div className="text-3xl sm:text-4xl font-bold">
               {isLoading ? <Skeleton className="h-10 w-20 bg-white/20 rounded-md animate-pulse" /> : exchanges}
            </div>
             <div className="mt-2 text-xs text-white/80">
                {isLoading ? 
                    <Skeleton className="h-4 w-32 bg-white/10 rounded-md animate-pulse" /> 
                    : 
                    (exchanges === 1 ? 'Plataforma única vinculada.' : 'Plataformas únicas vinculadas.')
                }
            </div>
          </div>
          <Globe className="absolute right-0 bottom-0 h-20 w-20 text-white/10 transform translate-x-4 translate-y-4" />
        </div>
      </div>

      <WidgetsContainer />

      <div className="space-y-4">
        <div id="subaccounts-component" className="px-0 sm:px-2">
          {subAccountsComponent}
        </div>
      </div>

      {/* Eliminar Modales si no se usan */}
      {/* 
      {showCreateModal && (
        <SubAccountManager
          mode="create"
          onCancel={() => setShowCreateModal(false)}
          onSuccess={handleSubAccountSuccess}
        />
      )}

      {showDeleteModal && (
        <SubAccountManager
          mode="delete"
          onCancel={() => setShowDeleteModal(false)}
          onSuccess={handleSubAccountSuccess}
        />
      )}
      */}
    </div>
  );
}