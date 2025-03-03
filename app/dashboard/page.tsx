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
  const [balanceDisplay, setBalanceDisplay] = useState<BalanceDisplayType>('total');
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
    switch (balanceDisplay) {
      case 'real':
        return realBalance?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00";
      case 'demo':
        return demoBalance?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00";
      default:
        return totalBalance?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00";
    }
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
    <div className="min-h-screen bg-blue-50 dark:bg-slate-900 animate-in fade-in-50 duration-500">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in-50 duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-900 border-r border-blue-100 dark:border-slate-800/30
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-blue-100 dark:border-slate-800/30">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-200 to-purple-200 w-8 h-8 rounded-md flex items-center justify-center shadow-md">
                <BarChart3 className="h-5 w-5 text-slate-700 animate-in fade-in-50 duration-500" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-300 dark:from-blue-300 dark:to-purple-200">TradingDash</h1>
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
          
          <div className="p-4 border-t border-blue-100 dark:border-slate-800/30">
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
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-blue-100 dark:border-slate-800/30 shadow-sm backdrop-blur-md bg-white/90 dark:bg-slate-900/90">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center flex-1">
              <button
                type="button"
                className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 focus:outline-none transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <span className="sr-only">Abrir menú</span>
                <Menu className="h-6 w-6" />
              </button>
              <div className="ml-2 lg:ml-0 relative">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-blue-300/70">
                  Bienvenido a tu panel de control
                  {lastUpdate && (
                    <span className="ml-2 text-xs text-gray-400 dark:text-blue-400/50">
                      · Actualizado a las {lastUpdate}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-3">
              <button
                onClick={toggleTheme}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white focus:outline-none transition-colors duration-200"
              >
                <span className="sr-only">Cambiar tema</span>
                {theme === 'light' ? (
                  <Moon className="h-6 w-6" />
                ) : (
                  <Sun className="h-6 w-6" />
                )}
              </button>
              <button
                type="button"
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white focus:outline-none transition-colors duration-200"
              >
                <span className="sr-only">Ver notificaciones</span>
                <Bell className="h-6 w-6" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center max-w-xs rounded-full focus:outline-none"
                >
                  <span className="sr-only">Abrir menú de usuario</span>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-200 to-purple-200 flex items-center justify-center shadow-md">
                    <User className="h-5 w-5 text-slate-700" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-6 lg:p-8">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-white/90">{getBalanceTitle()}</h3>
                  <div className="relative">
                    <button
                      id="balance-menu-button"
                      onClick={() => {
                        const menu = document.getElementById('balance-menu');
                        menu?.classList.toggle('hidden');
                      }}
                      className="flex items-center text-white/70 hover:text-white transition-colors"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <div
                      id="balance-menu"
                      className="hidden absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 z-50"
                    >
                      <div className="py-1" role="menu" aria-orientation="vertical">
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
                      </div>
                    </div>
                  </div>
                </div>
                <DollarSign className="h-6 w-6 text-white/70" />
              </div>
              <div className="space-y-4">
                <div className="text-3xl font-bold tracking-tight">
                  ${getDisplayBalance()}
                </div>
                {balanceDisplay === 'detailed' && (
                  <div className="space-y-1 text-sm text-white/80">
                    <div className="flex justify-between">
                      <span>Balance Real:</span>
                      <span>${realBalance?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Balance Demo:</span>
                      <span>${demoBalance?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Subcuentas Activas Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-blue-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Subcuentas Activas</h3>
                <User className="h-6 w-6 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="space-y-4">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {activeSubAccounts}
                </div>
                <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Reales:</span>
                    <span>{realAccounts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Demo:</span>
                    <span>{demoAccounts}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Exchanges Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-blue-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Exchanges</h3>
                <BarChart3 className="h-6 w-6 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="space-y-4">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {exchanges}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Plataformas conectadas
                </div>
              </div>
            </div>

            {/* Rendimiento Promedio Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-blue-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Rendimiento Promedio</h3>
                <TrendingUp className="h-6 w-6 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="space-y-4">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {avgPerformance.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Basado en todas las cuentas
                </div>
              </div>
            </div>
          </div>

          {/* Subaccounts section */}
          <div className="bg-white dark:bg-slate-900/20 shadow-sm rounded-xl border border-blue-100 dark:border-slate-800/30 overflow-hidden transition-all duration-200 hover:shadow-md animate-in slide-in-from-bottom-5 duration-500 delay-500">
            <div className="p-6">
              <SubAccounts onStatsUpdate={handleStatsUpdate} />
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