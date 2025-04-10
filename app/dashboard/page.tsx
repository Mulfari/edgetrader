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
  AlertCircle
} from "lucide-react";
import SubAccounts from "@/components/SubAccounts";
import SubAccountManager from "@/components/SubAccountManager";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

// Tipo para las opciones de balance
type BalanceDisplayType = 'total' | 'real' | 'demo' | 'detailed';

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

// Función de utilidad para acceder a localStorage de forma segura
const safeLocalStorage = {
  getItem: (key: string, defaultValue: any = null): any => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key) || defaultValue;
    }
    return defaultValue;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
};

export default function DashboardPage() {
  const [totalBalance, setTotalBalance] = useState<number | null>(null);
  const [realBalance, setRealBalance] = useState<number | null>(null);
  const [demoBalance, setDemoBalance] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeSubAccounts, setActiveSubAccounts] = useState(0);
  const [realAccounts, setRealAccounts] = useState(0);
  const [demoAccounts, setDemoAccounts] = useState(0);
  const [exchanges, setExchanges] = useState(0);
  const [openOperations, setOpenOperations] = useState(0);
  const [closedOperations, setClosedOperations] = useState(0);
  const [balanceDisplay, setBalanceDisplay] = useState<BalanceDisplayType>('detailed');
  const [operationsDisplay, setOperationsDisplay] = useState<OperationsDisplayType>('open');
  const [isLoading, setIsLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const router = useRouter();
  const { requireAuth, user } = useSupabaseAuth();

  useEffect(() => {
    // Proteger esta ruta con Supabase Auth
    const tokenInStorage = localStorage.getItem('token');
    console.log('Dashboard: Token en localStorage:', !!tokenInStorage);
    console.log('Dashboard: Usuario autenticado:', !!user);
    
    // Comentar temporalmente para probar sin redirección
    // requireAuth();
    
    // En su lugar, solo loguear el resultado sin redireccionar
    const isAuth = requireAuth(() => {
      console.log('Se intentaría redirigir a login, pero está temporalmente deshabilitado');
      // No hacemos nada para evitar la redirección
      return false; // Evita que se ejecute la redirección
    });
    console.log('¿Usuario autenticado según requireAuth?:', isAuth);
  }, []);

  // Establecer valores predeterminados ya que SubAccounts está deshabilitado
  useEffect(() => {
    // Simular la carga de datos después de un breve retraso
    const timer = setTimeout(() => {
      // Establecer valores de ejemplo
      setTotalBalance(25000);
      setRealBalance(15000);
      setDemoBalance(10000);
      setActiveSubAccounts(5);
      setRealAccounts(3);
      setDemoAccounts(2);
      setExchanges(120);
      setOpenOperations(30);
      setClosedOperations(90);
      setIsLoading(false);
      setLastUpdate(new Date());
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Cargar datos iniciales al montar el componente
    const subaccountsComponent = document.getElementById('subaccounts-component');
    if (subaccountsComponent) {
      console.log("Enviando evento refresh inicial al componente de subcuentas");
      const refreshEvent = new CustomEvent('refresh', { bubbles: true });
      subaccountsComponent.dispatchEvent(refreshEvent);
    }

    // Establecer un tiempo máximo de carga
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000); // 5 segundos máximo de carga

    return () => clearTimeout(loadingTimeout);
  }, []);

  useEffect(() => {
    // Cargar preferencias guardadas
    const savedBalanceDisplay = safeLocalStorage.getItem('balanceDisplayPreference');
    const savedOperationsDisplay = safeLocalStorage.getItem('operationsDisplayPreference');
    
    if (savedBalanceDisplay) {
      setBalanceDisplay(savedBalanceDisplay as BalanceDisplayType);
    }
    
    if (savedOperationsDisplay) {
      setOperationsDisplay(savedOperationsDisplay as OperationsDisplayType);
    }

    // Cerrar menús al hacer clic fuera
    const handleClickOutside = (event: MouseEvent) => {
      const balanceMenu = document.getElementById('balance-menu');
      const operationsMenu = document.getElementById('operations-menu');
      const balanceButton = document.getElementById('balance-menu-button');
      const operationsButton = document.getElementById('operations-menu-button');
      
      if (balanceMenu && !balanceMenu.contains(event.target as Node) && !balanceButton?.contains(event.target as Node)) {
        balanceMenu.classList.add('hidden');
      }
      
      if (operationsMenu && !operationsMenu.contains(event.target as Node) && !operationsButton?.contains(event.target as Node)) {
        operationsMenu.classList.add('hidden');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleStatsUpdate = useCallback((stats: AccountStats) => {
    // Usamos una función de actualización de estado para evitar dependencias
    setActiveSubAccounts(stats.totalAccounts);
    setRealAccounts(stats.realAccounts);
    setDemoAccounts(stats.demoAccounts);
    setTotalBalance(stats.totalBalance);
    setRealBalance(stats.realBalance);
    setDemoBalance(stats.demoBalance);
    setExchanges(stats.totalOperations);
    setOpenOperations(stats.openOperations);
    setClosedOperations(stats.closedOperations);
    setIsLoading(false);
    
    // Actualizamos la última actualización
    setLastUpdate(new Date());
  }, []);

  const handleSubAccountSuccess = () => {
    console.log("Actualizando lista de subcuentas después de operación exitosa");
    setShowCreateModal(false);
    setShowDeleteModal(false);
    safeLocalStorage.removeItem("subAccounts");
    safeLocalStorage.removeItem("accountBalances");
    
    setTimeout(() => {
      try {
        const subaccountsComponent = document.getElementById('subaccounts-component');
        if (subaccountsComponent) {
          console.log("Enviando evento refresh al componente de subcuentas");
          const refreshEvent = new CustomEvent('refresh', { bubbles: true });
          subaccountsComponent.dispatchEvent(refreshEvent);
        } else {
          console.error("No se encontró el componente de subcuentas para actualizar");
        }
      } catch (error) {
        console.error("Error al intentar actualizar subcuentas:", error);
      }
    }, 500);
  };

  const handleBalanceDisplayChange = (type: BalanceDisplayType) => {
    setBalanceDisplay(type);
    safeLocalStorage.setItem('balanceDisplayPreference', type);
    // Cerrar el menú después de seleccionar
    const menu = document.getElementById('balance-menu');
    menu?.classList.add('hidden');
  };

  const handleOperationsDisplayChange = (type: OperationsDisplayType) => {
    setOperationsDisplay(type);
    safeLocalStorage.setItem('operationsDisplayPreference', type);
    // Cerrar el menú después de seleccionar
    const menu = document.getElementById('operations-menu');
    menu?.classList.add('hidden');
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const subaccountsComponent = document.getElementById('subaccounts-component');
      if (subaccountsComponent) {
        const refreshEvent = new CustomEvent('refresh', { bubbles: true });
        subaccountsComponent.dispatchEvent(refreshEvent);
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error al actualizar datos:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const formatNumber = (num: number | null) => {
    if (num === null) return "0.00";
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const getTrendColor = (value: number | null, previousValue: number) => {
    if (value === null) return 'text-yellow-400';
    if (value > previousValue) return 'text-green-400';
    if (value < previousValue) return 'text-red-400';
    return 'text-yellow-400';
  };

  const toggleShowBalance = useCallback(() => {
    setShowBalance(prev => !prev);
  }, []);

  // Memorizamos el componente SubAccounts para evitar renderizados innecesarios
  const subAccountsComponent = useMemo(() => {
    return (
      // <SubAccounts 
      //   onStatsUpdate={handleStatsUpdate} 
      //   showBalance={showBalance} 
      // />
      <div className="p-8 rounded-lg border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Componente de Subcuentas deshabilitado temporalmente</h2>
        <p>El componente SubAccounts ha sido deshabilitado para pruebas.</p>
      </div>
    );
  }, [handleStatsUpdate, showBalance]);

  return (
    <div className="px-4 sm:px-6 lg:px-8" onMouseMove={handleMouseMove}>
      {/* Tooltip global */}
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

      {/* Header con información de última actualización */}
      <div className="flex items-center justify-end mb-6">
        {lastUpdate && (
          <span 
            className="text-sm text-muted-foreground"
            onMouseEnter={() => setTooltipContent(`Última actualización: ${lastUpdate.toLocaleString()}`)}
            onMouseLeave={() => setTooltipContent(null)}
          >
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Balance Card */}
        <div 
          className="col-span-1 sm:col-span-2 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl p-4 sm:p-6 text-white relative overflow-hidden group hover:shadow-lg transition-all duration-300"
          role="region"
          aria-label="Balance"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center space-x-2 relative">
                <button
                  id="balance-menu-button"
                  className="flex items-center space-x-2 bg-white/10 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium hover:bg-white/20 transition-all duration-200 hover:scale-105"
                  onClick={() => {
                    const menu = document.getElementById('balance-menu');
                    menu?.classList.toggle('hidden');
                  }}
                >
                  <span>{getBalanceTitle()}</span>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200" />
                </button>
                <button
                  onClick={toggleShowBalance}
                  className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-105"
                >
                  {showBalance ? (
                    <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-white/80" />
                  ) : (
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-white/80" />
                  )}
                </button>
                
                {/* Balance Type Menu */}
                <div id="balance-menu" className="hidden fixed top-auto left-auto mt-4 w-56 rounded-xl bg-gray-900/95 backdrop-blur-lg shadow-2xl border border-gray-700/50 z-[100] animate-in fade-in-50 slide-in-from-top-2 duration-200">
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Tipo de Balance</div>
                    <div className="space-y-1">
                      <button
                        onClick={() => handleBalanceDisplayChange('total')}
                        className={`w-full px-4 py-2.5 text-sm text-left text-gray-100 hover:bg-gray-800/80 transition-colors duration-200 flex items-center gap-3 rounded-lg ${
                          balanceDisplay === 'total' ? 'bg-gray-800/80 text-white ring-2 ring-blue-500' : ''
                        }`}
                      >
                        <DollarSign className="h-4 w-4 text-blue-400" />
                        Balance Total
                      </button>
                      <button
                        onClick={() => handleBalanceDisplayChange('real')}
                        className={`w-full px-4 py-2.5 text-sm text-left text-gray-100 hover:bg-gray-800/80 transition-colors duration-200 flex items-center gap-3 rounded-lg ${
                          balanceDisplay === 'real' ? 'bg-gray-800/80 text-white ring-2 ring-green-500' : ''
                        }`}
                      >
                        <DollarSign className="h-4 w-4 text-green-400" />
                        Balance Real
                      </button>
                      <button
                        onClick={() => handleBalanceDisplayChange('demo')}
                        className={`w-full px-4 py-2.5 text-sm text-left text-gray-100 hover:bg-gray-800/80 transition-colors duration-200 flex items-center gap-3 rounded-lg ${
                          balanceDisplay === 'demo' ? 'bg-gray-800/80 text-white ring-2 ring-yellow-500' : ''
                        }`}
                      >
                        <DollarSign className="h-4 w-4 text-yellow-400" />
                        Balance Demo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-start sm:gap-12">
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-bold">
                  {isLoading ? (
                    <div className="flex flex-col space-y-2">
                      <div className="h-8 sm:h-10 w-32 sm:w-40 bg-white/20 animate-pulse rounded"></div>
                      <div className="h-4 w-20 sm:w-24 bg-white/10 animate-pulse rounded"></div>
                    </div>
                  ) : !showBalance ? (
                    "••••••"
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>
                        {formatNumber(balanceDisplay === 'real' ? realBalance : balanceDisplay === 'demo' ? demoBalance : totalBalance)}
                      </span>
                      <TrendingUp className={`h-5 w-5 ${getTrendColor(totalBalance, 0)}`} />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Balances secundarios */}
              <div className="space-y-2 text-sm sm:text-base text-white/90 mt-2 sm:mt-0">
                {isLoading ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-24 bg-white/20 animate-pulse rounded"></div>
                      <div className="h-4 w-16 bg-white/10 animate-pulse rounded"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-24 bg-white/20 animate-pulse rounded"></div>
                      <div className="h-4 w-16 bg-white/10 animate-pulse rounded"></div>
                    </div>
                  </>
                ) : !showBalance ? (
                  <>
                    <div>Balance Real: ••••••</div>
                    <div>Balance Demo: ••••••</div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span>Balance Real:</span>
                      <span className="font-medium">{formatNumber(realBalance)}</span>
                      <ArrowUpRight className={`h-3 w-3 ${getTrendColor(realBalance, 0)}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Balance Demo:</span>
                      <span className="font-medium">{formatNumber(demoBalance)}</span>
                      <ArrowDownRight className={`h-3 w-3 ${getTrendColor(demoBalance, 0)}`} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="absolute right-0 bottom-0 transform translate-x-1/6 translate-y-1/6 overflow-hidden group-hover:scale-110 transition-transform duration-300">
            <DollarSign className="h-20 w-20 sm:h-24 sm:w-24 text-white/10" />
          </div>
          <div className="absolute top-4 right-4">
            <div 
              className="flex items-center gap-2 bg-white/10 rounded-full px-2 py-1 text-xs"
              onMouseEnter={() => setTooltipContent("Los datos se actualizan automáticamente cada 30 segundos")}
              onMouseLeave={() => setTooltipContent(null)}
            >
              <AlertCircle className="h-3 w-3 text-yellow-400" />
              <span>Actualizado en tiempo real</span>
            </div>
          </div>
        </div>

        {/* Subcuentas Activas Card */}
        <div 
          className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl p-4 sm:p-6 text-white relative overflow-hidden group hover:shadow-lg transition-all duration-300"
          role="region"
          aria-label="Subcuentas Activas"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-base font-medium text-white/90">Subcuentas Activas</h3>
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-white">
              {getSkeletonOrValue(activeSubAccounts)}
            </div>
            <div className="mt-2 text-xs sm:text-sm text-white/80">
              {isLoading ? (
                <div className="flex flex-col space-y-2">
                  <div className="h-4 w-16 bg-white/10 animate-pulse rounded"></div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span>Reales: {realAccounts}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <span>Demo: {demoAccounts}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="absolute right-0 bottom-0 transform translate-x-1/6 translate-y-1/6 group-hover:scale-110 transition-transform duration-300">
            <Users className="h-20 w-20 sm:h-24 sm:w-24 text-white/10" />
          </div>
          <div className="absolute top-4 right-4">
            <div 
              className="flex items-center gap-2 bg-white/10 rounded-full px-2 py-1 text-xs"
              onMouseEnter={() => setTooltipContent(`Total de subcuentas: ${activeSubAccounts}`)}
              onMouseLeave={() => setTooltipContent(null)}
            >
              <Users className="h-3 w-3 text-blue-400" />
              <span>Total: {activeSubAccounts}</span>
            </div>
          </div>
        </div>

        {/* Operaciones Card */}
        <div 
          className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 sm:p-6 text-white relative overflow-hidden group hover:shadow-lg transition-all duration-300"
          role="region"
          aria-label="Operaciones"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center space-x-2 relative">
                <button
                  id="operations-menu-button"
                  className="flex items-center space-x-2 bg-white/10 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium hover:bg-white/20 transition-all duration-200 hover:scale-105"
                  onClick={() => {
                    const menu = document.getElementById('operations-menu');
                    menu?.classList.toggle('hidden');
                  }}
                >
                  <span>{getOperationsTitle()}</span>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200" />
                </button>
                
                {/* Operations Type Menu */}
                <div id="operations-menu" className="hidden fixed top-auto left-auto mt-4 w-56 rounded-xl bg-gray-900/95 backdrop-blur-lg shadow-2xl border border-gray-700/50 z-[100] animate-in fade-in-50 slide-in-from-top-2 duration-200">
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Tipo de Operaciones</div>
                    <div className="space-y-1">
                      <button
                        onClick={() => handleOperationsDisplayChange('open')}
                        className={`w-full px-4 py-2.5 text-sm text-left text-gray-100 hover:bg-gray-800/80 transition-colors duration-200 flex items-center gap-3 rounded-lg ${
                          operationsDisplay === 'open' ? 'bg-gray-800/80 text-white ring-2 ring-blue-500' : ''
                        }`}
                      >
                        <Clock className="h-4 w-4 text-blue-400" />
                        Operaciones Abiertas
                      </button>
                      <button
                        onClick={() => handleOperationsDisplayChange('closed')}
                        className={`w-full px-4 py-2.5 text-sm text-left text-gray-100 hover:bg-gray-800/80 transition-colors duration-200 flex items-center gap-3 rounded-lg ${
                          operationsDisplay === 'closed' ? 'bg-gray-800/80 text-white ring-2 ring-green-500' : ''
                        }`}
                      >
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        Operaciones Cerradas
                      </button>
                      <button
                        onClick={() => handleOperationsDisplayChange('total')}
                        className={`w-full px-4 py-2.5 text-sm text-left text-gray-100 hover:bg-gray-800/80 transition-colors duration-200 flex items-center gap-3 rounded-lg ${
                          operationsDisplay === 'total' ? 'bg-gray-800/80 text-white ring-2 ring-purple-500' : ''
                        }`}
                      >
                        <Activity className="h-4 w-4 text-purple-400" />
                        Total Operaciones
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-white">
              {getSkeletonOrValue(getOperationsValue())}
            </div>
            <div className="mt-2 text-xs sm:text-sm text-white/80">
              {isLoading ? (
                <div className="flex flex-col space-y-2">
                  <div className="h-4 w-16 bg-white/10 animate-pulse rounded"></div>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-white/10 rounded-full px-2 py-1 w-fit">
                  {getOperationsIcon()}
                  <span>{getOperationsDescription()}</span>
                </div>
              )}
            </div>
          </div>
          <div className="absolute right-0 bottom-0 transform translate-x-1/6 translate-y-1/6 group-hover:scale-110 transition-transform duration-300">
            <LineChart className="h-20 w-20 sm:h-24 sm:w-24 text-white/10" />
          </div>
          <div className="absolute top-4 right-4">
            <div 
              className="flex items-center gap-2 bg-white/10 rounded-full px-2 py-1 text-xs"
              onMouseEnter={() => setTooltipContent(`Total de operaciones: ${exchanges}`)}
              onMouseLeave={() => setTooltipContent(null)}
            >
              <Activity className="h-3 w-3 text-purple-400" />
              <span>Total: {exchanges}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subcuentas Section */}
      <div className="space-y-4">
        <div id="subaccounts-component" className="px-0 sm:px-2">
          {subAccountsComponent}
        </div>
      </div>

      {/* Modales */}
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
    </div>
  );
}