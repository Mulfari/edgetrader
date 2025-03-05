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
                transform transition-all duration-300 ease-in-out backdrop-blur-xl
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${isSidebarCollapsed ? 'w-20' : 'w-64'}
                shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50
              `}>
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-zinc-200 dark:border-zinc-700/50 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="bg-gradient-to-r from-violet-500 to-indigo-500 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-violet-500/25 transition-all duration-300">
                        <BarChart3 className="h-5 w-5 text-white animate-in fade-in-50 duration-500" />
                      </div>
                      {!isSidebarCollapsed && (
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-500 animate-in slide-in-from-left-5 duration-300">
                          TradingDash
                        </h1>
                      )}
                    </div>
                    <button
                      onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                      className="hidden lg:flex items-center justify-center w-6 h-6 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-all duration-200 hover:shadow-lg"
                    >
                      {isSidebarCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronLeft className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto py-4">
                    <nav className="px-2 space-y-1">
                      {menuItems.map((item) => (
                        <Link 
                          key={item.href}
                          href={item.href} 
                          className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl ${
                            pathname === item.href
                              ? 'bg-gradient-to-r from-violet-500/10 to-indigo-500/10 dark:from-violet-500/20 dark:to-indigo-500/20 text-violet-700 dark:text-violet-300'
                              : 'text-gray-700 dark:text-blue-300/70 hover:bg-gradient-to-r hover:from-violet-500/5 hover:to-indigo-500/5 dark:hover:from-violet-500/10 dark:hover:to-indigo-500/10'
                          } group transition-all duration-200`}
                        >
                          <item.icon className={`${isSidebarCollapsed ? 'mx-auto' : 'mr-3'} h-5 w-5 ${
                            pathname === item.href
                              ? 'text-violet-500 dark:text-violet-400'
                              : 'text-gray-400 dark:text-blue-400/50 group-hover:text-violet-500 dark:group-hover:text-violet-400'
                          } transition-colors duration-200`} />
                          {!isSidebarCollapsed && (
                            <span className="transition-colors duration-200">{item.name}</span>
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
                            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700/50 transition-all duration-200">
                              <div className="flex items-center gap-1.5">
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
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64">
                            <div className="p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Estado del sistema</span>
                                <Badge variant="outline" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                  Operativo
                                </Badge>
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                Última actualización hace 2 minutos
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                Próxima actualización en 3 minutos
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
                              className="group p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 focus:outline-none transition-all duration-200"
                            >
                              <span className="sr-only">Ver notificaciones</span>
                              <div className="relative">
                                <Bell className="h-5 w-5" />
                                <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-900"></div>
                              </div>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-80">
                            <div className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium">Notificaciones</h3>
                                <Badge variant="outline" className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                                  3 nuevas
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                  <div className="text-sm font-medium">Nuevo balance detectado</div>
                                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Hace 5 minutos</div>
                                </div>
                                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                  <div className="text-sm font-medium">Operación cerrada</div>
                                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Hace 15 minutos</div>
                                </div>
                              </div>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none transition-all duration-200"
                            >
                              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 p-0.5 transition-transform duration-200 hover:scale-105">
                                <div className="h-full w-full rounded-[10px] bg-white dark:bg-zinc-900 flex items-center justify-center">
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
                            <div className="p-4 space-y-3">
                              <div className="space-y-1">
                                <h3 className="font-medium">Detalles de membresía</h3>
                                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                  Miembro premium
                                </div>
                              </div>
                              <div className="p-3 rounded-lg bg-gradient-to-br from-violet-500/10 to-indigo-500/10 dark:from-violet-500/20 dark:to-indigo-500/20 space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-zinc-600 dark:text-zinc-400">Inicio:</span>
                                  <span className="font-medium">01 Marzo 2024</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-zinc-600 dark:text-zinc-400">Vence:</span>
                                  <span className="font-medium">01 Abril 2024</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-zinc-600 dark:text-zinc-400">Plan:</span>
                                  <Badge variant="outline" className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                                    Premium
                                  </Badge>
                                </div>
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
