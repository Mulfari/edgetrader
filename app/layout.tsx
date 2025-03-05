"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  LogOut, 
  BarChart3,
  Bell,
  Menu,
  User,
  ChevronLeft,
  ChevronRight,
  Home,
  LineChart,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./globals.css";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  {
    name: "Inicio",
    icon: Home,
    href: "/dashboard",
    description: "Dashboard de Subcuentas"
  },
  {
    name: "Operaciones",
    icon: LineChart,
    href: "/operations",
    description: "Dashboard de Operaciones"
  },
  {
    name: "Billetera",
    icon: Wallet,
    href: "/wallet",
    description: "Gestión de Fondos"
  },
  {
    name: "Configuración",
    icon: Settings,
    href: "/settings",
    description: "Ajustes del Sistema"
  }
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [lastUpdate] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Efecto para detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    // Limpiar datos de autenticación
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    
    // Limpiar datos de subcuentas
    localStorage.removeItem("subAccounts");
    
    // Limpiar datos de balances y caché
    localStorage.removeItem("accountBalances");
    
    // Limpiar todo el caché de balances de subcuentas
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('subaccount_balance_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Limpiar cualquier otro dato relacionado con balances
    localStorage.removeItem("balanceDisplayPreference");
    
    // Limpiar datos de estado de la aplicación
    localStorage.removeItem("selectedSubAccountId");
    localStorage.removeItem("lastUpdate");
    
    router.push("/login");
  };

  // Verificar si estamos en páginas públicas
  const publicRoutes = ['/', '/login', '/register', '/signup'];
  const isPublicPage = publicRoutes.includes(pathname);

  return (
    <html lang="es">
      <body className="min-h-screen bg-zinc-50/50 dark:bg-zinc-900">
        <ThemeProvider>
          {!isPublicPage && (
            <>
              {/* Mobile menu overlay */}
              {isMobileMenuOpen && (
                <div 
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in-50 duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              )}

              {/* Sidebar */}
              <div className={`
                fixed top-0 left-0 z-50 h-full bg-white/80 dark:bg-zinc-800/80
                border-r border-zinc-200 dark:border-zinc-700/50
                transform transition-all duration-500 ease-out backdrop-blur-xl
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${isSidebarCollapsed ? 'w-20' : 'w-64'}
                shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50
                group
              `}>
                <div className="flex flex-col h-full">
                  <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="p-4 border-b border-zinc-200 dark:border-zinc-700/50 flex items-center justify-between w-full group/header hover:bg-gradient-to-r hover:from-violet-500/5 hover:to-indigo-500/5 dark:hover:from-violet-500/10 dark:hover:to-indigo-500/10 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-violet-500 to-indigo-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover/header:scale-105 transition-all duration-300">
                        <BarChart3 className="h-6 w-6 text-white animate-in fade-in-50 duration-500" />
                      </div>
                      {!isSidebarCollapsed && (
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-500 animate-in slide-in-from-left-5 duration-300">
                          TradingDash
                        </h1>
                      )}
                    </div>
                    <div className={`transform transition-all duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}>
                      <ChevronLeft className="h-5 w-5 text-zinc-400 group-hover/header:text-violet-500 transition-colors duration-200" />
                    </div>
                  </button>
                  
                  <div className="flex-1 overflow-y-auto py-4">
                    <nav className="px-2 space-y-1">
                      {menuItems.map((item) => (
                        <Link 
                          key={item.href}
                          href={item.href} 
                          className={`flex items-center px-3 py-3 text-sm font-medium rounded-xl ${
                            pathname === item.href
                              ? 'bg-gradient-to-r from-violet-500/15 to-indigo-500/15 dark:from-violet-500/25 dark:to-indigo-500/25 text-violet-700 dark:text-violet-300 shadow-lg shadow-violet-500/10'
                              : 'text-gray-700 dark:text-blue-300/70 hover:bg-gradient-to-r hover:from-violet-500/5 hover:to-indigo-500/5 dark:hover:from-violet-500/10 dark:hover:to-indigo-500/10'
                          } group transition-all duration-300`}
                        >
                          <item.icon className={`${
                            isSidebarCollapsed ? 'mx-auto scale-125' : 'mr-3'
                          } h-5 w-5 ${
                            pathname === item.href
                              ? 'text-violet-500 dark:text-violet-400'
                              : 'text-gray-400 dark:text-blue-400/50 group-hover:text-violet-500 dark:group-hover:text-violet-400'
                          } transition-all duration-300 group-hover:scale-110`} />
                          {!isSidebarCollapsed && (
                            <span className="transition-colors duration-200">{item.name}</span>
                          )}
                          {isSidebarCollapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                              {item.name}
                            </div>
                          )}
                        </Link>
                      ))}
                    </nav>
                  </div>
                  
                  <div className="p-4 border-t border-zinc-200 dark:border-zinc-700/50">
                    <button 
                      onClick={handleLogout}
                      className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl text-gray-700 dark:text-blue-300/70 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 group transition-all duration-200"
                    >
                      <LogOut className={`${isSidebarCollapsed ? 'mx-auto' : 'mr-3'} h-5 w-5 text-gray-400 dark:text-blue-400/50 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors duration-200`} />
                      {!isSidebarCollapsed && (
                        <span className="group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors duration-200">
                          Cerrar Sesión
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Main content with navigation */}
              <div className={`
                transition-all duration-300
                ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}
              `}>
                {/* Top navigation */}
                <header className={`
                  sticky top-0 z-30 
                  bg-white/80 dark:bg-zinc-900/80 
                  border-b border-zinc-200 dark:border-zinc-800 
                  backdrop-blur-xl transition-all duration-200
                  ${isScrolled ? 'shadow-md' : ''}
                `}>
                  <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center flex-1 gap-4">
                      <button
                        type="button"
                        className="lg:hidden -ml-0.5 -mt-0.5 h-10 w-10 inline-flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 focus:outline-none transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(true)}
                      >
                        <span className="sr-only">Abrir menú</span>
                        <Menu className="h-5 w-5" />
                      </button>
                      <div>
                        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-500">
                          {menuItems.find(item => item.href === pathname)?.name || ''}
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {menuItems.find(item => item.href === pathname)?.description || ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="hidden sm:block">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 dark:from-emerald-500/20 dark:to-emerald-600/20 px-3 py-1.5 rounded-xl cursor-pointer hover:from-emerald-500/20 hover:to-emerald-600/20 dark:hover:from-emerald-500/30 dark:hover:to-emerald-600/30 transition-all duration-300 border border-emerald-500/20 dark:border-emerald-400/20">
                              <div className="flex items-center gap-1.5">
                                <div className="relative">
                                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                  <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                                </div>
                                <span className="font-medium text-emerald-700 dark:text-emerald-400">En línea</span>
                              </div>
                              {lastUpdate && (
                                <>
                                  <span className="text-emerald-400/30 dark:text-emerald-600">•</span>
                                  <span className="text-emerald-600/70 dark:text-emerald-400/70">Actualizado {lastUpdate}</span>
                                </>
                              )}
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-72">
                            <div className="p-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <h3 className="font-medium">Estado del sistema</h3>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Todos los servicios operativos</p>
                                </div>
                                <div className="flex flex-col items-end">
                                  <Badge variant="outline" className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 mb-1">
                                    100% Uptime
                                  </Badge>
                                  <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">24h monitoreo</span>
                                </div>
                              </div>
                              <div className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">API Latencia</span>
                                  <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                                      <div className="h-full w-1/4 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"></div>
                                    </div>
                                    <Badge variant="outline" className="bg-gradient-to-r from-blue-500/20 to-violet-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30">
                                      45ms
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Última actualización</span>
                                  <span className="text-sm font-medium">Hace 2 min</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Próxima actualización</span>
                                  <span className="text-sm font-medium">En 3 min</span>
                                </div>
                              </div>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="group relative p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 focus:outline-none transition-all duration-200"
                            >
                              <span className="sr-only">Ver notificaciones</span>
                              <div className="relative">
                                <Bell className="h-5 w-5 transition-transform group-hover:scale-110 duration-300" />
                                <div className="absolute -top-1 -right-1 h-3 w-3">
                                  <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75"></div>
                                  <div className="relative rounded-full h-3 w-3 bg-rose-500 ring-2 ring-white dark:ring-zinc-900"></div>
                                </div>
                              </div>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-96">
                            <div className="p-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <h3 className="font-medium text-lg">Notificaciones</h3>
                                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Últimas actualizaciones del sistema</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-zinc-500">Últimas 24h</span>
                                  <Badge variant="outline" className="bg-gradient-to-r from-rose-500/20 to-pink-500/20 text-rose-700 dark:text-rose-400 border-rose-500/30">
                                    3 nuevas
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 dark:from-blue-500/20 dark:to-violet-500/20 border border-blue-500/20 dark:border-blue-400/20">
                                  <div className="flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-blue-500/20 dark:bg-blue-400/20 flex items-center justify-center">
                                      <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">Nuevo balance detectado</p>
                                        <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                          Nuevo
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                        Se ha detectado un cambio en el balance de tu cuenta principal
                                      </p>
                                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">Hace 5 minutos</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 border border-green-500/20 dark:border-green-400/20">
                                  <div className="flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-green-500/20 dark:bg-green-400/20 flex items-center justify-center">
                                      <LineChart className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">Operación cerrada</p>
                                        <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                          +2.5%
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                        Operación cerrada exitosamente en BTC/USDT
                                      </p>
                                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">Hace 15 minutos</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <button className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors">
                                Ver todas las notificaciones
                              </button>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none transition-all duration-200"
                            >
                              <div className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 p-0.5 transition-transform duration-200 hover:scale-105">
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 opacity-50 blur-lg transition-opacity duration-200 group-hover:opacity-75"></div>
                                <div className="relative h-full w-full rounded-[10px] bg-white dark:bg-zinc-900 flex items-center justify-center">
                                  <User className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                                </div>
                              </div>
                              <div className="hidden sm:block text-left">
                                <div className="text-sm font-medium text-zinc-900 dark:text-white">Usuario</div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">Administrador</div>
                              </div>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-80">
                            <div className="p-4">
                              <div className="flex items-center gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 p-0.5">
                                  <div className="h-full w-full rounded-[10px] bg-white dark:bg-zinc-900 flex items-center justify-center">
                                    <User className="h-8 w-8 text-violet-500 dark:text-violet-400" />
                                  </div>
                                </div>
                                <div>
                                  <h3 className="font-medium text-lg">John Doe</h3>
                                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Administrador</p>
                                </div>
                              </div>

                              <div className="py-4 space-y-4">
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Detalles de membresía</h4>
                                  <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 dark:from-violet-500/20 dark:to-indigo-500/20 space-y-4 border border-violet-500/20 dark:border-violet-400/20">
                                    <div className="flex justify-between items-center">
                                      <Badge variant="outline" className="bg-gradient-to-r from-violet-500/20 to-indigo-500/20 text-violet-700 dark:text-violet-400 border-violet-500/30">
                                        Premium
                                      </Badge>
                                      <Badge variant="outline" className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                                        Activo
                                      </Badge>
                                    </div>
                                    <div className="space-y-3">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-zinc-600 dark:text-zinc-400">Inicio</span>
                                        <span className="font-medium">01 Marzo 2024</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-zinc-600 dark:text-zinc-400">Vence</span>
                                        <span className="font-medium">01 Abril 2024</span>
                                      </div>
                                      <div className="relative">
                                        <div className="h-2 w-full bg-violet-100 dark:bg-violet-900/30 rounded-full overflow-hidden">
                                          <div className="h-full w-3/4 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"></div>
                                        </div>
                                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white dark:bg-zinc-900 ring-2 ring-violet-500"></div>
                                      </div>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                                        21 días restantes de 30 días
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={handleLogout}
                                  className="w-full flex items-center justify-center gap-2 p-2 text-sm text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                >
                                  <LogOut className="h-4 w-4" />
                                  Cerrar Sesión
                                </button>
                              </div>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </header>

                <main className="py-6 px-4 sm:px-6 lg:px-8">
                  {children}
                </main>
              </div>
            </>
          )}

          {/* Render children directly without layout on login page */}
          {isPublicPage && (
            <main>
              {children}
            </main>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
