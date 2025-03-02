"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PlusCircle, 
  Trash2, 
  LayoutDashboard, 
  LineChart, 
  Settings, 
  CreditCard, 
  LogOut, 
  Wallet,
  BarChart3,
  TrendingUp,
  Bell,
  Menu,
  ChevronRight
} from "lucide-react";
import SubAccounts from "@/components/SubAccounts";
import SubAccountManager from "@/components/SubAccountManager";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar - Escritorio */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded">
              <BarChart3 className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white">TradingPro</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Button variant="ghost" className="w-full justify-start font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            <TrendingUp className="mr-2 h-4 w-4" />
            Operaciones
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            <LineChart className="mr-2 h-4 w-4" />
            Análisis
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            <Bell className="mr-2 h-4 w-4" />
            Alertas
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </Button>
        </nav>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-600">
                <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                  {userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-900 dark:text-white">{userName}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Trader</span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
      
      {/* Sidebar - Móvil */}
      <div className={cn(
        "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden transition-opacity",
        isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className={cn(
          "fixed inset-y-0 left-0 w-3/4 max-w-xs bg-white dark:bg-slate-800 p-4 transition-transform",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-1.5 rounded">
                <BarChart3 className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl text-slate-900 dark:text-white">TradingPro</span>
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
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-16 flex items-center px-4 md:px-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden mr-2"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white md:hidden">
            Dashboard
          </h1>
          
          <div className="ml-auto flex items-center gap-4">
            {totalBalance !== null && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  ${totalBalance.toFixed(2)}
                </span>
              </div>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full md:hidden">
                  <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-600">
                    <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                      {userName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-xs text-muted-foreground">
                      Trader
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {totalBalance !== null && (
                  <>
                    <div className="p-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Balance Total</p>
                        <p className="text-sm font-medium text-green-600">${totalBalance.toFixed(2)}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem 
                  className="cursor-pointer flex items-center gap-2 text-red-600 focus:text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        {/* Contenido */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Encabezado de página */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  Bienvenido a tu panel de control de trading
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nueva Subcuenta
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteModal(true)}
                  className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                >
                  <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                  Eliminar Subcuenta
                </Button>
              </div>
            </div>
            
            {/* Tarjetas de resumen */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 bg-blue-50/50 dark:bg-blue-900/10 border-b border-slate-200 dark:border-slate-700">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Subcuentas Activas</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">5</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">+2 desde el mes pasado</p>
                </CardContent>
              </Card>
              
              <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 bg-green-50/50 dark:bg-green-900/10 border-b border-slate-200 dark:border-slate-700">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Rendimiento Total</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">+12.5%</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">+2.3% desde la semana pasada</p>
                </CardContent>
              </Card>
              
              <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 bg-purple-50/50 dark:bg-purple-900/10 border-b border-slate-200 dark:border-slate-700">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Operaciones Abiertas</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">12</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">3 operaciones nuevas hoy</p>
                </CardContent>
              </Card>
              
              <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 bg-amber-50/50 dark:bg-amber-900/10 border-b border-slate-200 dark:border-slate-700">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Alertas Activas</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">7</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">2 alertas próximas a activarse</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Lista de subcuentas */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Gestión de Subcuentas</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Monitorea y administra tus subcuentas de trading
                </p>
              </div>
              <div className="p-0">
                <SubAccounts onBalanceUpdate={handleBalanceUpdate} />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Modales */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in-0 duration-200">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in-0 duration-200">
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