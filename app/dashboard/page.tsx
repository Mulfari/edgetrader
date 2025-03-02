"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PlusCircle, 
  Trash2, 
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [totalBalance, setTotalBalance] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userName, setUserName] = useState<string>("Usuario");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [subAccountsCount, setSubAccountsCount] = useState(0);
  const [realAccountsCount, setRealAccountsCount] = useState(0);
  const [demoAccountsCount, setDemoAccountsCount] = useState(0);
  const [exchangesCount, setExchangesCount] = useState(0);
  const [averagePerformance, setAveragePerformance] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    // Intentar obtener el nombre de usuario del localStorage si existe
    const storedUserName = localStorage.getItem("userName");
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, [router]);

  const handleBalanceUpdate = (balance: number) => {
    setTotalBalance(balance);
  };

  // Función para recibir datos de estadísticas desde SubAccounts
  const handleStatsUpdate = (stats: { 
    total: number; 
    real: number; 
    demo: number; 
    exchanges: number; 
    performance: number 
  }) => {
    setSubAccountsCount(stats.total);
    setRealAccountsCount(stats.real);
    setDemoAccountsCount(stats.demo);
    setExchangesCount(stats.exchanges);
    setAveragePerformance(stats.performance);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-blue-100 dark:border-blue-900/30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
              </Button>
            
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-1.5 rounded-md">
                <BarChart3 className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                TradingPro
              </span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-1">
            <Button variant="ghost" className="font-medium text-blue-600 dark:text-blue-400">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="ghost" className="text-slate-600 dark:text-slate-300">
              <TrendingUp className="mr-2 h-4 w-4" />
              Operaciones
            </Button>
            <Button variant="ghost" className="text-slate-600 dark:text-slate-300">
              <LineChart className="mr-2 h-4 w-4" />
              Análisis
            </Button>
            <Button variant="ghost" className="text-slate-600 dark:text-slate-300">
              <Bell className="mr-2 h-4 w-4" />
              Alertas
            </Button>
          </nav>
          
          <div className="flex items-center gap-4">
            {totalBalance !== null && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  {totalBalance.toFixed(2)}
                </span>
              </div>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border-2 border-blue-100 dark:border-blue-900">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {userName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2">
                <div className="flex items-center gap-3 p-2">
                  <Avatar className="h-10 w-10 border-2 border-blue-100 dark:border-blue-900">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {userName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Trader Profesional
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {totalBalance !== null && (
                  <>
                    <div className="p-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Balance Total</p>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">${totalBalance.toFixed(2)}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  <User className="mr-2 h-4 w-4" />
                  Mi Perfil
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </Button>
                <DropdownMenuSeparator />
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Sidebar móvil */}
      <div className={cn(
        "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden transition-opacity",
        isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className={cn(
          "fixed inset-y-0 left-0 w-3/4 max-w-xs bg-white dark:bg-slate-900 p-4 shadow-xl transition-transform",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-1.5 rounded-md">
                <BarChart3 className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                TradingPro
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-slate-500"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="mb-6 p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-blue-100 dark:border-blue-900">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  {userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{userName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Trader Profesional
                </p>
              </div>
            </div>
            {totalBalance !== null && (
              <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-md bg-white/80 dark:bg-slate-800/80 border border-blue-100 dark:border-blue-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">Balance Total</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">${totalBalance.toFixed(2)}</span>
              </div>
            )}
          </div>
          
          <nav className="space-y-1 mb-6">
            <Button variant="ghost" className="w-full justify-start font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-600 dark:text-slate-300">
              <TrendingUp className="mr-2 h-4 w-4" />
              Operaciones
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-600 dark:text-slate-300">
              <LineChart className="mr-2 h-4 w-4" />
              Análisis
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-600 dark:text-slate-300">
              <Bell className="mr-2 h-4 w-4" />
              Alertas
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-600 dark:text-slate-300">
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </Button>
          </nav>
          
          <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 dark:text-red-400"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
      
      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-6">
        {/* Encabezado de página */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300">
            Bienvenido, {userName}
          </h1>
          <p className="text-blue-600/70 dark:text-blue-400/70 mt-1">
            Gestiona tus operaciones y monitorea el rendimiento de tus cuentas
          </p>
        </div>
        
        {/* Tarjetas de resumen */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800/30 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">Subcuentas Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{subAccountsCount}</div>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1 flex items-center">
                <span>{realAccountsCount} reales, {demoAccountsCount} demo</span>
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800/30 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300">Balance Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {totalBalance !== null ? `${totalBalance.toFixed(2)} USDT` : "0.00 USDT"}
              </div>
              <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1 flex items-center">
                <span>En todas las cuentas activas</span>
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800/30 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-300">Exchanges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{exchangesCount}</div>
              <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1 flex items-center">
                <span>Plataformas conectadas</span>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800/30 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-300">Rendimiento Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{averagePerformance.toFixed(2)}%</div>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1 flex items-center">
                <span>Basado en todas las cuentas</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gestión de subcuentas */}
        <div className="bg-white dark:bg-blue-950/20 rounded-xl border border-slate-200 dark:border-blue-800/30 shadow-sm overflow-hidden mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 md:p-6 border-b border-slate-200 dark:border-blue-800/30 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <div>
              {/* Eliminado el título "Subcuentas" */}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Nueva Subcuenta
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(true)}
                className="w-10 h-10 p-0 rounded-full border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200"
                title="Eliminar Subcuenta"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Eliminar Subcuenta</span>
              </Button>
            </div>
          </div>
          
          <div>
            <SubAccounts onBalanceUpdate={handleBalanceUpdate} onStatsUpdate={handleStatsUpdate} />
          </div>
        </div>
      </main>
      
      {/* Modales */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-blue-950/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in-0 duration-200">
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