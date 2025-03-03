"use client";

import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  LineChart, 
  Settings, 
  LogOut, 
  BarChart3,
  TrendingUp,
  Bell,
  Menu,
  User,
  DollarSign,
  Sun,
  Moon,
  ChevronDown
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSubAccounts, setActiveSubAccounts] = useState(0);
  const [realAccounts, setRealAccounts] = useState(0);
  const [demoAccounts, setDemoAccounts] = useState(0);
  const [exchanges, setExchanges] = useState(0);
  const [avgPerformance, setAvgPerformance] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [balanceDisplay, setBalanceDisplay] = useState<BalanceDisplayType>('detailed');
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const router = useRouter();

  // Efecto para inicializar el tema desde localStorage o preferencias del sistema
  useEffect(() => {
    // Verificar si hay un tema guardado en localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      // Si no hay tema guardado, usar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  // Función para cambiar el tema
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

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

  useEffect(() => {
    // Solo desactivar la carga cuando tengamos datos reales y haya pasado el tiempo mínimo
    if (hasLoadedData) {
      const minLoadingTime = setTimeout(() => {
        setIsLoading(false);
      }, 1000);

      return () => clearTimeout(minLoadingTime);
    }
  }, [hasLoadedData]);

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
    setAvgPerformance(stats.avgPerformance);
    setLastUpdate(new Date().toLocaleTimeString());
    setHasLoadedData(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("subAccounts");
    localStorage.removeItem("accountBalances");
    localStorage.removeItem("userName");
    router.push("/login");
  };

  const handleSubAccountSuccess = () => {
    console.log("Actualizando lista de subcuentas después de operación exitosa");
    
    // Cerrar modales
    setShowCreateModal(false);
    setShowDeleteModal(false);
    
    // Limpiar localStorage para forzar recarga de datos
    localStorage.removeItem("subAccounts");
    localStorage.removeItem("accountBalances");
    
    // Dar tiempo para que se cierren los modales antes de actualizar
    setTimeout(() => {
      try {
        // Intentar encontrar el componente de subcuentas y enviar evento de actualización
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 animate-in fade-in-50 duration-500">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in-50 duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-zinc-800
        border-r border-zinc-200 dark:border-zinc-700/50
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-700/50">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-violet-500 to-indigo-500 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg">
                <BarChart3 className="h-5 w-5 text-white animate-in fade-in-50 duration-500" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-500">TradingDash</h1>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-2 space-y-1">
              <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 group transition-all duration-200 hover:bg-blue-200 dark:hover:bg-blue-900/50 shadow-sm">
                <LayoutDashboard className="mr-3 h-5 w-5 text-blue-500 dark:text-blue-400" />
                Dashboard
              </a>
              <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 dark:text-blue-300/70 hover:bg-blue-100 dark:hover:bg-blue-900/20 group transition-all duration-200">
                <LineChart className="mr-3 h-5 w-5 text-gray-400 dark:text-blue-400/50 group-hover:text-gray-500 dark:group-hover:text-blue-400" />
                Análisis
              </a>
              <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 dark:text-blue-300/70 hover:bg-blue-100 dark:hover:bg-blue-900/20 group transition-all duration-200">
                <TrendingUp className="mr-3 h-5 w-5 text-gray-400 dark:text-blue-400/50 group-hover:text-gray-500 dark:group-hover:text-blue-400" />
                Operaciones
              </a>
              <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 dark:text-blue-300/70 hover:bg-blue-100 dark:hover:bg-blue-900/20 group transition-all duration-200">
                <Settings className="mr-3 h-5 w-5 text-gray-400 dark:text-blue-400/50 group-hover:text-gray-500 dark:group-hover:text-blue-400" />
                Configuración
              </a>
            </nav>
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-slate-800">
            <button 
              onClick={toggleTheme}
              className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-blue-300/70 hover:bg-blue-100 dark:hover:bg-blue-900/20 group transition-all duration-200 mb-2"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="mr-3 h-5 w-5 text-gray-400 dark:text-blue-400/50 group-hover:text-gray-500 dark:group-hover:text-blue-400" />
                  Modo Oscuro
                </>
              ) : (
                <>
                  <Sun className="mr-3 h-5 w-5 text-gray-400 dark:text-blue-400/50 group-hover:text-gray-500 dark:group-hover:text-blue-400" />
                  Modo Claro
                </>
              )}
            </button>
            <a href="#" onClick={handleLogout} className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-blue-300/70 hover:bg-blue-100 dark:hover:bg-blue-900/20 group transition-all duration-200">
              <LogOut className="mr-3 h-5 w-5 text-gray-400 dark:text-blue-400/50 group-hover:text-gray-500 dark:group-hover:text-blue-400" />
              Cerrar Sesión
            </a>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 transition-all duration-300">
        {/* Top navigation */}
        <header className="sticky top-0 z-30 bg-gradient-to-b from-white via-white to-white/80 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center flex-1 gap-4">
              <button
                type="button"
                className="lg:hidden -ml-0.5 -mt-0.5 h-10 w-10 inline-flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 focus:outline-none transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <span className="sr-only">Abrir menú</span>
                <Menu className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-2">
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    <li>
                      <div className="flex items-center text-sm">
                        <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
                          Inicio
                        </a>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-center text-sm">
                        <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="ml-2 text-zinc-900 dark:text-white font-medium">Dashboard</span>
                      </div>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span>En línea</span>
                  </div>
                  {lastUpdate && (
                    <>
                      <span className="text-zinc-300 dark:text-zinc-600">•</span>
                      <span>Actualizado {lastUpdate}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="group p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 focus:outline-none transition-all duration-200"
                >
                  <span className="sr-only">Cambiar tema</span>
                  {theme === 'light' ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                </button>

                <div className="relative">
                  <button
                    type="button"
                    className="group p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 focus:outline-none transition-all duration-200"
                  >
                    <span className="sr-only">Ver notificaciones</span>
                    <div className="relative">
                      <Bell className="h-5 w-5" />
                      <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500"></div>
                    </div>
                  </button>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none transition-all duration-200"
                  >
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 p-0.5">
                      <div className="h-full w-full rounded-[7px] bg-white dark:bg-zinc-900 flex items-center justify-center">
                        <User className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                      </div>
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">Usuario</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">Administrador</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 sm:p-6 lg:p-8">
            {/* Balance Card */}
            <div className="relative group min-h-[240px]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-200"></div>
              <div className="relative h-full bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-600 rounded-xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-200 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-white">{getBalanceTitle()}</h3>
                    <div className="relative">
                      <button
                        id="balance-menu-button"
                        onClick={() => {
                          const menu = document.getElementById('balance-menu');
                          menu?.classList.toggle('hidden');
                        }}
                        className="flex items-center text-white/90 hover:text-white transition-colors"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <div
                        id="balance-menu"
                        className="hidden absolute right-0 mt-2 w-48 rounded-xl shadow-xl bg-white dark:bg-zinc-800 ring-1 ring-black/5 z-50"
                      >
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          <button
                            className={`block px-4 py-2 text-sm w-full text-left ${
                              balanceDisplay === 'detailed'
                                ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
                            }`}
                            onClick={() => handleBalanceDisplayChange('detailed')}
                          >
                            Mostrar Desglose
                          </button>
                          <button
                            className={`block px-4 py-2 text-sm w-full text-left ${
                              balanceDisplay === 'total'
                                ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
                            }`}
                            onClick={() => handleBalanceDisplayChange('total')}
                          >
                            Balance Total
                          </button>
                          <button
                            className={`block px-4 py-2 text-sm w-full text-left ${
                              balanceDisplay === 'real'
                                ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
                            }`}
                            onClick={() => handleBalanceDisplayChange('real')}
                          >
                            Solo Balance Real
                          </button>
                          <button
                            className={`block px-4 py-2 text-sm w-full text-left ${
                              balanceDisplay === 'demo'
                                ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
                            }`}
                            onClick={() => handleBalanceDisplayChange('demo')}
                          >
                            Solo Balance Demo
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-4">
                  <div className="text-4xl font-bold tracking-tight">
                    {getDisplayBalance()}
                  </div>
                  {balanceDisplay === 'detailed' && (
                    <div className="space-y-2 text-sm bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                      <div className="flex justify-between font-medium">
                        <span>Balance Real:</span>
                        {isLoading ? (
                          <div className="h-5 w-20 bg-white/20 animate-pulse rounded"></div>
                        ) : (
                          <span>${realBalance?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span>
                        )}
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Balance Demo:</span>
                        {isLoading ? (
                          <div className="h-5 w-20 bg-white/20 animate-pulse rounded"></div>
                        ) : (
                          <span>${demoBalance?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subcuentas Activas Card */}
            <div className="relative group min-h-[240px]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-200"></div>
              <div className="relative h-full bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-100">Subcuentas Activas</h3>
                  <div className="p-2 bg-violet-500/10 dark:bg-violet-400/10 rounded-lg">
                    <User className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="text-3xl font-bold text-zinc-900 dark:text-white">
                    {getSkeletonOrValue(activeSubAccounts)}
                  </div>
                  <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg p-3">
                    <div className="flex justify-between">
                      <span>Reales:</span>
                      <span className="font-medium">{getSkeletonOrValue(realAccounts, 'sm')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Demo:</span>
                      <span className="font-medium">{getSkeletonOrValue(demoAccounts, 'sm')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Exchanges Card */}
            <div className="relative group min-h-[240px]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-200"></div>
              <div className="relative h-full bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-100">Exchanges</h3>
                  <div className="p-2 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="text-3xl font-bold text-zinc-900 dark:text-white">
                    {getSkeletonOrValue(exchanges)}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg p-3">
                    Plataformas conectadas
                  </div>
                </div>
              </div>
            </div>

            {/* Rendimiento Promedio Card */}
            <div className="relative group min-h-[240px]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-200"></div>
              <div className="relative h-full bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-100">Rendimiento Promedio</h3>
                  <div className="p-2 bg-teal-500/10 dark:bg-teal-400/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="text-3xl font-bold text-zinc-900 dark:text-white">
                    {getSkeletonOrValue(`${avgPerformance.toFixed(2)}%`)}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg p-3">
                    Basado en todas las cuentas
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subaccounts section */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-200"></div>
            <div className="relative bg-white dark:bg-zinc-800 rounded-xl shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl animate-in slide-in-from-bottom-5 duration-500 delay-500">
              <div className="p-6">
                <SubAccounts onStatsUpdate={handleStatsUpdate} />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modales */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in-0 duration-200">
          <div className="w-full max-w-md p-4 animate-in slide-in-from-bottom-10 duration-300">
            <SubAccountManager 
              mode="create" 
              onSuccess={handleSubAccountSuccess} 
              onCancel={() => setShowCreateModal(false)} 
            />
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-red-200/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in-0 duration-200">
          <div className="w-full max-w-md p-4 animate-in slide-in-from-bottom-10 duration-300">
            <SubAccountManager 
              mode="delete" 
              onSuccess={handleSubAccountSuccess} 
              onCancel={() => setShowDeleteModal(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}