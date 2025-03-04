"use client";

import { useState, useEffect } from "react";
import { 
  LineChart, 
  DollarSign,
  ChevronDown,
  Eye,
  EyeOff
} from "lucide-react";
import SubAccounts from "@/components/SubAccounts";
import SubAccountManager from "@/components/SubAccountManager";
import { useRouter } from "next/navigation";

// Tipo para las opciones de balance
type BalanceDisplayType = 'total' | 'real' | 'demo' | 'detailed';

interface BalanceData {
  balance: number | null;
  isDemo: boolean;
}

interface SubAccountData {
  isDemo: boolean;
  exchange: string;
}

interface BalancesCache {
  balances: Record<string, BalanceData>;
  timestamp: number;
}

interface SubAccountsCache {
  accounts: SubAccountData[];
  timestamp: number;
}

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
  const [balanceDisplay, setBalanceDisplay] = useState<BalanceDisplayType>('detailed');
  const [showBalance, setShowBalance] = useState(true);
  const [isLoadingLocalData, setIsLoadingLocalData] = useState(true);
  const router = useRouter();

  // Función para obtener datos del localStorage
  const loadLocalData = () => {
    try {
      setIsLoadingLocalData(true);
      let hasData = false;

      // Obtener datos de balances
      const balancesCache = localStorage.getItem('subaccount_balances_cache');
      if (balancesCache) {
        const cache: BalancesCache = JSON.parse(balancesCache);
        const isExpired = Date.now() - cache.timestamp > 5 * 60 * 1000; // 5 minutos

        if (!isExpired) {
          // Calcular totales
          const total = Object.values(cache.balances).reduce((sum: number, acc: BalanceData) => sum + (acc.balance || 0), 0);
          const real = Object.entries(cache.balances).reduce((sum: number, [, acc]: [string, BalanceData]) => {
            return sum + (!acc.isDemo ? (acc.balance || 0) : 0);
          }, 0);
          const demo = Object.entries(cache.balances).reduce((sum: number, [, acc]: [string, BalanceData]) => {
            return sum + (acc.isDemo ? (acc.balance || 0) : 0);
          }, 0);

          setTotalBalance(total);
          setRealBalance(real);
          setDemoBalance(demo);
          hasData = true;
        }
      }

      // Obtener datos de subcuentas
      const subaccountsCache = localStorage.getItem('subaccounts_cache');
      if (subaccountsCache) {
        const cache: SubAccountsCache = JSON.parse(subaccountsCache);
        const isExpired = Date.now() - cache.timestamp > 5 * 60 * 1000; // 5 minutos

        if (!isExpired) {
          setActiveSubAccounts(cache.accounts.length);
          setRealAccounts(cache.accounts.filter((acc: SubAccountData) => !acc.isDemo).length);
          setDemoAccounts(cache.accounts.filter((acc: SubAccountData) => acc.isDemo).length);
          setExchanges(new Set(cache.accounts.map((acc: SubAccountData) => acc.exchange)).size);
          hasData = true;
        }
      }

      // Si no hay datos válidos en caché, mantener el estado de carga
      if (!hasData) {
        // Establecer valores por defecto
        setTotalBalance(0);
        setRealBalance(0);
        setDemoBalance(0);
        setActiveSubAccounts(0);
        setRealAccounts(0);
        setDemoAccounts(0);
        setExchanges(0);
      }

      // Asegurar que el efecto de carga se muestre por al menos 1 segundo
      setTimeout(() => {
        setIsLoadingLocalData(false);
      }, 1000);

    } catch (error) {
      console.error('Error al cargar datos locales:', error);
      // En caso de error, establecer valores por defecto
      setTotalBalance(0);
      setRealBalance(0);
      setDemoBalance(0);
      setActiveSubAccounts(0);
      setRealAccounts(0);
      setDemoAccounts(0);
      setExchanges(0);
      
      // Asegurar que el efecto de carga se muestre por al menos 1 segundo
      setTimeout(() => {
        setIsLoadingLocalData(false);
      }, 1000);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Cargar datos locales
    loadLocalData();

    // No necesitamos el timeout aquí ya que lo manejamos en loadLocalData
    return () => {};
  }, [router]);

  useEffect(() => {
    // Cargar preferencia de visualización de balance
    const savedBalanceDisplay = localStorage.getItem('balanceDisplayPreference');
    if (savedBalanceDisplay) {
      setBalanceDisplay(savedBalanceDisplay as BalanceDisplayType);
    }

    // Cerrar menú al hacer clic fuera
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById('balance-menu');
      const button = document.getElementById('balance-menu-button');
      if (menu && !menu.contains(event.target as Node) && !button?.contains(event.target as Node)) {
        menu.classList.add('hidden');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleStatsUpdate = (stats: {
    totalAccounts: number
    realAccounts: number
    demoAccounts: number
    totalBalance: number
    realBalance: number
    demoBalance: number
    uniqueExchanges: number
    avgPerformance: number
  }) => {
    setActiveSubAccounts(stats.totalAccounts);
    setRealAccounts(stats.realAccounts);
    setDemoAccounts(stats.demoAccounts);
    setTotalBalance(stats.totalBalance);
    setRealBalance(stats.realBalance);
    setDemoBalance(stats.demoBalance);
    setExchanges(stats.uniqueExchanges);
  };

  const handleSubAccountSuccess = () => {
    console.log("Actualizando lista de subcuentas después de operación exitosa");
    setShowCreateModal(false);
    setShowDeleteModal(false);
    localStorage.removeItem("subAccounts");
    localStorage.removeItem("accountBalances");
    
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
    localStorage.setItem('balanceDisplayPreference', type);
    // Cerrar el menú después de seleccionar
    const menu = document.getElementById('balance-menu');
    menu?.classList.add('hidden');
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

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Balance Card */}
        <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl p-6 text-white relative">
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 relative">
                <button
                  id="balance-menu-button"
                  className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-white/20 transition-colors duration-200"
                  onClick={() => {
                    const menu = document.getElementById('balance-menu');
                    menu?.classList.toggle('hidden');
                  }}
                >
                  <span>{getBalanceTitle()}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
                >
                  {showBalance ? (
                    <EyeOff className="h-4 w-4 text-white/80" />
                  ) : (
                    <Eye className="h-4 w-4 text-white/80" />
                  )}
                </button>
                
                {/* Balance Type Menu */}
                <div id="balance-menu" className="hidden absolute top-full left-0 mt-2 w-48 rounded-xl bg-white/10 backdrop-blur-lg shadow-lg border border-white/20 z-[100]">
                  <div className="py-1">
                    <button
                      onClick={() => handleBalanceDisplayChange('total')}
                      className="block w-full px-4 py-2 text-sm text-left text-white hover:bg-white/10 transition-colors duration-200"
                    >
                      Balance Total
                    </button>
                    <button
                      onClick={() => handleBalanceDisplayChange('real')}
                      className="block w-full px-4 py-2 text-sm text-left text-white hover:bg-white/10 transition-colors duration-200"
                    >
                      Balance Real
                    </button>
                    <button
                      onClick={() => handleBalanceDisplayChange('demo')}
                      className="block w-full px-4 py-2 text-sm text-left text-white hover:bg-white/10 transition-colors duration-200"
                    >
                      Balance Demo
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-12">
              <div className="space-y-1">
                <div className="text-4xl font-bold">
                  {isLoadingLocalData ? (
                    <div className="flex flex-col space-y-2">
                      <div className="h-10 w-40 bg-white/20 animate-pulse rounded"></div>
                      <div className="h-4 w-24 bg-white/10 animate-pulse rounded"></div>
                    </div>
                  ) : !showBalance ? (
                    "••••••"
                  ) : (
                    <div>
                      ${(balanceDisplay === 'real' ? realBalance : balanceDisplay === 'demo' ? demoBalance : totalBalance)?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Balances secundarios */}
              <div className="space-y-2 text-base text-white/90">
                {!showBalance ? (
                  <>
                    <div>Balance Real: ••••••</div>
                    <div>Balance Demo: ••••••</div>
                  </>
                ) : isLoadingLocalData ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-24 bg-white/20 animate-pulse rounded"></div>
                      <span className="text-white/50">Balance Real</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-24 bg-white/20 animate-pulse rounded"></div>
                      <span className="text-white/50">Balance Demo</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>Balance Real: ${realBalance?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</div>
                    <div>Balance Demo: ${demoBalance?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="absolute right-0 bottom-0 transform translate-x-1/6 translate-y-1/6 overflow-hidden">
            <DollarSign className="h-24 w-24 text-white/10" />
          </div>
        </div>

        {/* Subcuentas Activas Card */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">Subcuentas Activas</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoadingLocalData ? (
                <div className="flex flex-col space-y-2">
                  <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded"></div>
                  <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-600 animate-pulse rounded"></div>
                </div>
              ) : (
                activeSubAccounts
              )}
            </div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {!isLoadingLocalData && (
                <>
                  Reales: {realAccounts} • Demo: {demoAccounts}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Operaciones Card */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">Operaciones</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoadingLocalData ? (
                <div className="flex flex-col space-y-2">
                  <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded"></div>
                  <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-600 animate-pulse rounded"></div>
                </div>
              ) : (
                exchanges
              )}
            </div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {!isLoadingLocalData && 'Total de operaciones realizadas'}
            </div>
          </div>
          <div className="absolute right-0 bottom-0 transform translate-x-1/4 translate-y-1/4">
            <LineChart className="h-32 w-32 text-gray-200 dark:text-zinc-700" />
          </div>
        </div>
      </div>

      {/* Subcuentas Section */}
      <div className="space-y-4">
        <div id="subaccounts-component">
          <SubAccounts onStatsUpdate={handleStatsUpdate} showBalance={showBalance} />
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