"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  LogOut, 
  BarChart3,
  Bell,
  Menu,
  User,
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
      <body className="min-h-screen bg-gradient-to-br from-zinc-50/50 via-white/50 to-zinc-100/50 dark:from-[#0A0A0F] dark:via-[#12121A] dark:to-[#0A0A0F]">
        <ThemeProvider>
          {!isPublicPage && (
            <>
              {/* Mobile menu overlay */}
              {isMobileMenuOpen && (
                <div 
                  className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden animate-in fade-in-50 duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              )}

              {/* Sidebar */}
              <div className={`
                fixed top-0 left-0 z-50 h-full
                bg-white/95 dark:bg-[#12121A]/95
                border-r border-zinc-200/50 dark:border-zinc-800/40
                transform transition-all duration-300 ease-in-out backdrop-blur-xl
                ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0 lg:w-[5.5rem] lg:hover:w-72'}
                lg:group
                shadow-[0_0_40px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_0_40px_-15px_rgba(0,0,0,0.5)]
                overflow-hidden
              `}>
                <div className="flex flex-col h-full w-full">
                  <div className="h-20 flex items-center border-b border-zinc-200/50 dark:border-zinc-800/40 px-6 lg:px-4 lg:group-hover:px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl blur-2xl opacity-30"></div>
                        <div className="relative bg-gradient-to-br from-violet-500 to-indigo-500 w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transform transition-transform duration-300 hover:scale-105">
                          <BarChart3 className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="transition-all duration-300 transform lg:opacity-0 lg:group-hover:opacity-100 opacity-100 whitespace-nowrap">
                        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-500">
                          TradingDash
                        </h1>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Panel de Control
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
                    <nav className="space-y-1 px-4 lg:px-3 lg:group-hover:px-4">
                      {menuItems.map((item) => (
                      <Link 
                          key={item.href}
                          href={item.href} 
                          className={`
                            relative group/item flex items-center px-3 py-2.5 text-sm font-medium rounded-xl
                            transition-all duration-300 ease-in-out
                            ${pathname === item.href
                              ? 'bg-gradient-to-br from-violet-500/10 to-indigo-500/10 dark:from-violet-500/20 dark:to-indigo-500/20 text-violet-700 dark:text-violet-300 shadow-[0_2px_8px_-3px_rgba(139,92,246,0.3)] dark:shadow-[0_2px_8px_-3px_rgba(139,92,246,0.2)]'
                              : 'text-gray-700 dark:text-blue-300/70 hover:bg-gradient-to-br hover:from-violet-500/5 hover:to-indigo-500/5 dark:hover:from-violet-500/10 dark:hover:to-indigo-500/10'
                            }
                            w-full
                          `}
                        >
                          {pathname === item.href && (
                            <div className="absolute left-0 w-1 h-8 bg-violet-500 rounded-r-full transform -translate-y-1/2 top-1/2 lg:opacity-0 lg:group-hover:opacity-100 opacity-100" />
                          )}
                          <div className={`
                            relative flex items-center w-full
                            ${pathname === item.href ? 'text-violet-500 dark:text-violet-400' : ''}
                          `}>
                            <div className="flex items-center justify-center min-w-[2.5rem] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] lg:group-hover:scale-95">
                              <item.icon className={`
                                h-5 w-5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                                ${pathname === item.href
                                  ? 'text-violet-500 dark:text-violet-400'
                                  : 'text-gray-400 dark:text-blue-400/50 group-hover:text-violet-500 dark:group-hover:text-violet-400'
                                }
                                lg:group-hover:-translate-x-0.5 transform-gpu
                              `} />
                            </div>
                            <span className="transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] lg:opacity-0 lg:group-hover:opacity-100 opacity-100 lg:-translate-x-6 lg:group-hover:translate-x-0 whitespace-nowrap">{item.name}</span>
                          </div>
                      </Link>
                      ))}
                    </nav>
                  </div>
                  
                  <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/60 px-4 lg:px-3 lg:group-hover:px-4">
                    <button 
                      onClick={handleLogout}
                      className={`
                        relative group/item flex items-center px-3 py-2.5 text-sm font-medium rounded-xl
                        text-gray-700 dark:text-blue-300/70 hover:bg-rose-500/5 dark:hover:bg-rose-500/10
                        transition-all duration-300 ease-in-out w-full
                      `}
                    >
                      <div className="flex items-center justify-center min-w-[2.5rem] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] lg:group-hover:scale-95">
                        <LogOut className={`
                          h-5 w-5 text-gray-400 dark:text-blue-400/50 
                          group-hover:text-rose-500 dark:group-hover:text-rose-400 
                          transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                          lg:group-hover:-translate-x-0.5 transform-gpu
                        `} />
                      </div>
                      <span className="transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] lg:opacity-0 lg:group-hover:opacity-100 opacity-100 lg:-translate-x-6 lg:group-hover:translate-x-0 whitespace-nowrap group-hover:text-rose-600 dark:group-hover:text-rose-400">
                        Cerrar Sesión
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Main content with navigation */}
              <div className={`
                transition-all duration-500 ease-in-out
                lg:pl-[5.5rem] lg:group-hover:pl-72
              `}>
                {/* Top navigation */}
                <header className={`
                  sticky top-0 z-30 
                  bg-white/95 dark:bg-[#12121A]/95
                  border-b border-zinc-200/50 dark:border-zinc-800/40
                  backdrop-blur-xl transition-all duration-300
                  ${isScrolled ? 'shadow-[0_8px_30px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_8px_30px_-15px_rgba(0,0,0,0.5)]' : ''}
                `}>
                  <div className="flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center flex-1 gap-4">
                      <button
                        type="button"
                        className="lg:hidden -ml-0.5 -mt-0.5 h-10 w-10 inline-flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 focus:outline-none transition-all duration-200 transform hover:scale-105"
                        onClick={() => setIsMobileMenuOpen(true)}
                      >
                        <span className="sr-only">Abrir menú</span>
                        <Menu className="h-5 w-5" />
                      </button>
                      <div className="animate-in slide-in-from-left-5 duration-500">
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
                                  <h3 className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-emerald-600">Estado del sistema</h3>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Todos los servicios operativos</p>
                                </div>
                                <div className="flex flex-col items-end">
                                  <Badge variant="outline" className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                                    100% Uptime
                                  </Badge>
                                  <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">24h monitoreo</span>
                                </div>
                              </div>
                              <div className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">API Latencia</span>
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <Badge variant="outline" className="bg-gradient-to-r from-blue-500/10 to-violet-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
                                      45ms
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Última actualización</span>
                                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Hace 2 min</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Próxima actualización</span>
                                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">En 3 min</span>
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
                                <Bell className="h-5 w-5 transition-all duration-300 transform group-hover:scale-110" />
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
                                  <h3 className="font-medium text-lg bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-500">Notificaciones</h3>
                                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Últimas actualizaciones del sistema</p>
                                </div>
                                <Badge variant="outline" className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20">
                                  3 nuevas
                                </Badge>
                        </div>

                              <div className="space-y-3">
                                <div className="group p-3 rounded-xl bg-gradient-to-r from-blue-500/5 to-violet-500/5 hover:from-blue-500/10 hover:to-violet-500/10 dark:from-blue-500/10 dark:to-violet-500/10 dark:hover:from-blue-500/20 dark:hover:to-violet-500/20 border border-blue-500/20 dark:border-blue-400/20 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer">
                                  <div className="flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110">
                                      <Wallet className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium truncate">Nuevo balance detectado</p>
                                        <Badge variant="outline" className="bg-gradient-to-r from-blue-500/10 to-violet-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 ml-2 shrink-0">
                                          Nuevo
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                                        Se ha detectado un cambio en el balance de tu cuenta principal
                                      </p>
                                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">Hace 5 minutos</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="group p-3 rounded-xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 hover:from-green-500/10 hover:to-emerald-500/10 dark:from-green-500/10 dark:to-emerald-500/10 dark:hover:from-green-500/20 dark:hover:to-emerald-500/20 border border-green-500/20 dark:border-green-400/20 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer">
                                  <div className="flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110">
                                      <LineChart className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium truncate">Operación cerrada</p>
                                        <Badge variant="outline" className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 dark:text-green-400 border-green-500/20 ml-2 shrink-0">
                                          +2.5%
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                                        Operación cerrada exitosamente en BTC/USDT
                                      </p>
                                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">Hace 15 minutos</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <button className="w-full py-2 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors">
                                Ver todas las notificaciones
                              </button>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                              className="group flex items-center gap-3 p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none transition-all duration-300"
                            >
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
                                <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 p-0.5 transition-transform duration-300 group-hover:scale-105">
                                  <div className="h-full w-full rounded-[10px] bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                                    <User className="h-5 w-5 text-violet-500 dark:text-violet-400 transform transition-transform duration-300 group-hover:scale-110" />
                                  </div>
                              </div>
                            </div>
                            <div className="hidden sm:block text-left">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-zinc-900 dark:text-white">John Doe</span>
                                  <Badge variant="outline" className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20">
                                    Admin
                                  </Badge>
                                </div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">john@example.com</div>
                              </div>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-80">
                            <div className="p-4">
                              <div className="flex items-center gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl blur-lg opacity-50"></div>
                                  <div className="relative h-16 w-16 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 p-0.5">
                                    <div className="h-full w-full rounded-[10px] bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                                      <User className="h-8 w-8 text-violet-500 dark:text-violet-400" />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-lg truncate">John Doe</h3>
                                    <Badge variant="outline" className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20 shrink-0">
                                      Admin
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">john@example.com</p>
                                </div>
                              </div>

                              <div className="py-4 space-y-4">
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Detalles de membresía</h4>
                                  <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/5 to-indigo-500/5 hover:from-violet-500/10 hover:to-indigo-500/10 dark:from-violet-500/10 dark:to-indigo-500/10 dark:hover:from-violet-500/20 dark:hover:to-indigo-500/20 border border-violet-500/20 dark:border-violet-400/20 space-y-3 transition-all duration-300">
                                    <div className="flex justify-between items-center">
                                      <Badge variant="outline" className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20">
                                        Premium
                                      </Badge>
                                      <Badge variant="outline" className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                                        Activo
                                      </Badge>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-zinc-600 dark:text-zinc-400">Inicio</span>
                                        <span className="font-medium text-zinc-900 dark:text-zinc-100">01 Marzo 2024</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-zinc-600 dark:text-zinc-400">Vence</span>
                                        <span className="font-medium text-zinc-900 dark:text-zinc-100">01 Abril 2024</span>
                                      </div>
                                      <div className="relative h-1.5 w-full bg-violet-100 dark:bg-violet-900/30 rounded-full overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 w-3/4 rounded-full"></div>
                                      </div>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                                        21 días restantes
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={handleLogout}
                                  className="w-full flex items-center justify-center gap-2 p-2 text-sm font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all duration-300 transform hover:scale-[1.02]"
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
