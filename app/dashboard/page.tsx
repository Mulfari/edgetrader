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
  const [isLoading, setIsLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
  }, [router]);

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
    setIsLoading(false); // Desactivar la carga cuando recibimos los datos
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
  };

  const getDisplayBalance = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col space-y-2">
          <div className="h-10 w-40 bg-white/20 animate-pulse rounded"></div>
          <div className="h-4 w-24 bg-white/10 animate-pulse rounded"></div>
        </div>
      );
    }
    
    switch (balanceDisplay) {
      case 'real':
        return `$${realBalance?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}`;
      case 'demo':
        return `$${demoBalance?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}`;
      default:
        return `$${totalBalance?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}`;
    }
  };

  const getSkeletonOrValue = (value: number | string, size: 'sm' | 'lg' = 'lg') => {
    if (isLoading) {
      return (
        <div className="flex flex-col space-y-2">
          <div className={`${size === 'lg' ? 'h-9 w-24' : 'h-5 w-16'} bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded`}></div>
          <div className={`${size === 'lg' ? 'h-4 w-16' : 'h-3 w-12'} bg-zinc-100 dark:bg-zinc-600 animate-pulse rounded`}></div>
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

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Balance Card */}
        <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
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
              </div>
              
              {/* Balance Type Menu */}
              <div id="balance-menu" className="hidden absolute top-full left-0 mt-2 w-48 rounded-lg bg-white dark:bg-zinc-800 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <button
                    onClick={() => handleBalanceDisplayChange('total')}
                    className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700"
                  >
                    Balance Total
                  </button>
                  <button
                    onClick={() => handleBalanceDisplayChange('real')}
                    className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700"
                  >
                    Balance Real
                  </button>
                  <button
                    onClick={() => handleBalanceDisplayChange('demo')}
                    className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700"
                  >
                    Balance Demo
                  </button>
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-4xl font-bold">
                {isLoading ? (
                  <div className="flex flex-col space-y-2">
                    <div className="h-10 w-40 bg-white/20 animate-pulse rounded"></div>
                    <div className="h-4 w-24 bg-white/10 animate-pulse rounded"></div>
                  </div>
                ) : !showBalance ? (
                  "••••••"
                ) : (
                  getDisplayBalance()
                )}
              </div>
              {balanceDisplay === 'detailed' && !isLoading && (
                <div className="space-y-1 text-sm text-white/80">
                  {!showBalance ? (
                    <>
                      <div>Balance Real: ••••••</div>
                      <div>Balance Demo: ••••••</div>
                    </>
                  ) : (
                    <>
                      <div>Balance Real: ${realBalance?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</div>
                      <div>Balance Demo: ${demoBalance?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="absolute right-0 bottom-0 transform translate-x-1/4 translate-y-1/4">
            <DollarSign className="h-32 w-32 text-white/10" />
          </div>
        </div>

        {/* Subcuentas Activas Card */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">Subcuentas Activas</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {getSkeletonOrValue(activeSubAccounts)}
            </div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {!isLoading && (
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
              {getSkeletonOrValue(exchanges)}
            </div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {!isLoading && 'Total de operaciones realizadas'}
            </div>
          </div>
          <div className="absolute right-0 bottom-0 transform translate-x-1/4 translate-y-1/4">
            <LineChart className="h-32 w-32 text-gray-200 dark:text-zinc-700" />
          </div>
        </div>
      </div>

      {/* Subcuentas Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Subcuentas</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Agregar Subcuenta
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              Eliminar Subcuentas
            </button>
          </div>
        </div>

        {/* Información sobre cuentas demo */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Información sobre cuentas demo
              </h3>
              <div className="mt-2 text-sm text-amber-700 dark:text-amber-200/80">
                Las cuentas demo de Bybit ahora muestran datos reales desde el endpoint <code className="bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 rounded text-amber-800 dark:text-amber-200 text-xs">api-demo.bybit.com</code>. Para ver balances y activos, asegúrate de tener fondos virtuales en tu cuenta demo de Bybit. Si no ves datos es posible que necesites depositar fondos virtuales en tu cuenta demo.
              </div>
            </div>
          </div>
        </div>

        <div id="subaccounts-component">
          <SubAccounts onStatsUpdate={handleStatsUpdate} />
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