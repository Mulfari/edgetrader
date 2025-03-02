"use client";

import { useState, useEffect } from "react";
import { 
  PlusCircle, 
  LayoutDashboard, 
  LineChart, 
  Settings, 
  LogOut, 
  BarChart3,
  TrendingUp,
  Bell,
  Menu,
  ChevronRight,
  User,
  DollarSign
} from "lucide-react";
import SubAccounts from "@/components/SubAccounts";
import SubAccountManager from "@/components/SubAccountManager";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [totalBalance, setTotalBalance] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSubAccounts, setActiveSubAccounts] = useState(0);
  const [realAccounts, setRealAccounts] = useState(0);
  const [demoAccounts, setDemoAccounts] = useState(0);
  const [exchanges, setExchanges] = useState(0);
  const [avgPerformance, setAvgPerformance] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
  }, [router]);

  const handleStatsUpdate = (stats: {
    totalAccounts: number
    realAccounts: number
    demoAccounts: number
    totalBalance: number
    uniqueExchanges: number
    avgPerformance: number
  }) => {
    setActiveSubAccounts(stats.totalAccounts);
    setRealAccounts(stats.realAccounts);
    setDemoAccounts(stats.demoAccounts);
    setTotalBalance(stats.totalBalance);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-violet-950 animate-in fade-in-50 duration-500">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-violet-950/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in-50 duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-violet-950 border-r border-gray-200 dark:border-violet-800/30
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 dark:border-violet-800/30">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-purple-600 to-violet-600 w-8 h-8 rounded-md flex items-center justify-center shadow-md">
                <BarChart3 className="h-5 w-5 text-white animate-in fade-in-50 duration-500" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-violet-600 dark:from-purple-400 dark:to-violet-400">TradingDash</h1>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-2 space-y-1">
              <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 group transition-all duration-200 hover:bg-purple-100 dark:hover:bg-purple-900/50 shadow-sm">
                <LayoutDashboard className="mr-3 h-5 w-5 text-purple-500 dark:text-purple-400" />
                Dashboard
              </a>
              <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 dark:text-purple-300/70 hover:bg-gray-100 dark:hover:bg-purple-900/20 group transition-all duration-200">
                <LineChart className="mr-3 h-5 w-5 text-gray-400 dark:text-purple-400/50 group-hover:text-gray-500 dark:group-hover:text-purple-400" />
                Análisis
              </a>
              <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 dark:text-purple-300/70 hover:bg-gray-100 dark:hover:bg-purple-900/20 group transition-all duration-200">
                <TrendingUp className="mr-3 h-5 w-5 text-gray-400 dark:text-purple-400/50 group-hover:text-gray-500 dark:group-hover:text-purple-400" />
                Operaciones
              </a>
              <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 dark:text-purple-300/70 hover:bg-gray-100 dark:hover:bg-purple-900/20 group transition-all duration-200">
                <Settings className="mr-3 h-5 w-5 text-gray-400 dark:text-purple-400/50 group-hover:text-gray-500 dark:group-hover:text-purple-400" />
                Configuración
              </a>
            </nav>
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-violet-800/30">
            <a href="#" onClick={handleLogout} className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-purple-300/70 hover:bg-gray-100 dark:hover:bg-purple-900/20 group transition-all duration-200">
              <LogOut className="mr-3 h-5 w-5 text-gray-400 dark:text-purple-400/50 group-hover:text-gray-500 dark:group-hover:text-purple-400" />
              Cerrar Sesión
            </a>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 transition-all duration-300">
        {/* Top navigation */}
        <header className="sticky top-0 z-30 bg-white dark:bg-violet-950 border-b border-gray-200 dark:border-violet-800/30 shadow-sm backdrop-blur-md bg-white/90 dark:bg-violet-950/90">
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
                <p className="text-sm text-gray-500 dark:text-purple-300/70">
                  Bienvenido a tu panel de control
                  {lastUpdate && (
                    <span className="ml-2 text-xs text-gray-400 dark:text-purple-400/50">
                      · Actualizado a las {lastUpdate}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-3">
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
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 flex items-center justify-center shadow-md">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {/* Stats cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white dark:bg-violet-950/20 overflow-hidden shadow-sm rounded-xl border border-gray-200 dark:border-violet-800/30 transition-all duration-200 hover:shadow-md animate-in slide-in-from-bottom-3 duration-500 delay-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg p-3 shadow-md">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-purple-300/70 truncate">Subcuentas Activas</dt>
                      <dd>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">{activeSubAccounts}</div>
                        <div className="mt-1 flex items-baseline text-sm text-gray-500 dark:text-purple-300/70">
                          <span>{realAccounts} reales</span>
                          <span className="mx-1.5">•</span>
                          <span>{demoAccounts} demo</span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-violet-900/20 px-5 py-3">
                <div className="text-sm">
                  <a href="#" className="font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 flex items-center justify-between transition-colors duration-200">
                    Ver todas
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-violet-950/20 overflow-hidden shadow-sm rounded-xl border border-gray-200 dark:border-violet-800/30 transition-all duration-200 hover:shadow-md animate-in slide-in-from-bottom-3 duration-500 delay-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-3 shadow-md">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-purple-300/70 truncate">Balance Total</dt>
                      <dd>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">${totalBalance?.toFixed(2) || "0.00"}</div>
                        <div className="mt-1 flex items-baseline text-sm text-gray-500 dark:text-purple-300/70">
                          <span>Todas las cuentas activas</span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-violet-900/20 px-5 py-3">
                <div className="text-sm">
                  <a href="#" className="font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 flex items-center justify-between transition-colors duration-200">
                    Ver detalles
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-violet-950/20 overflow-hidden shadow-sm rounded-xl border border-gray-200 dark:border-violet-800/30 transition-all duration-200 hover:shadow-md animate-in slide-in-from-bottom-3 duration-500 delay-300">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg p-3 shadow-md">
                    <PlusCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-purple-300/70 truncate">Exchanges</dt>
                      <dd>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">{exchanges}</div>
                        <div className="mt-1 flex items-baseline text-sm text-gray-500 dark:text-purple-300/70">
                          <span>Plataformas conectadas</span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-violet-900/20 px-5 py-3">
                <div className="text-sm">
                  <a href="#" className="font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 flex items-center justify-between transition-colors duration-200">
                    Conectar más
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-violet-950/20 overflow-hidden shadow-sm rounded-xl border border-gray-200 dark:border-violet-800/30 transition-all duration-200 hover:shadow-md animate-in slide-in-from-bottom-3 duration-500 delay-400">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg p-3 shadow-md">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-purple-300/70 truncate">Rendimiento Promedio</dt>
                      <dd>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">{avgPerformance.toFixed(2)}%</div>
                        <div className="mt-1 flex items-baseline text-sm text-gray-500 dark:text-purple-300/70">
                          <span>Basado en todas las cuentas</span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-violet-900/20 px-5 py-3">
                <div className="text-sm">
                  <a href="#" className="font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 flex items-center justify-between transition-colors duration-200">
                    Ver análisis
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Subaccounts section */}
          <div className="bg-white dark:bg-violet-950/20 shadow-sm rounded-xl border border-gray-200 dark:border-violet-800/30 overflow-hidden transition-all duration-200 hover:shadow-md animate-in slide-in-from-bottom-5 duration-500 delay-500">
            <div className="p-6">
              <SubAccounts onStatsUpdate={handleStatsUpdate} />
            </div>
          </div>
        </main>
      </div>

      {/* Modales */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-violet-950/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in-0 duration-200">
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
        <div className="fixed inset-0 bg-red-950/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in-0 duration-200">
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