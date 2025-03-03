"use client";

import { useState } from "react";
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  BarChart3,
  TrendingUp,
  Bell,
  Menu,
  User
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastUpdate] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("subAccounts");
    localStorage.removeItem("accountBalances");
    localStorage.removeItem("userName");
    router.push("/login");
  };

  return (
    <html lang="es">
      <body className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <ThemeProvider>
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
                  <Link 
                    href="/dashboard" 
                    className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
                      pathname === '/dashboard' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                        : 'text-gray-700 dark:text-blue-300/70 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                    } group transition-all duration-200`}
                  >
                    <LayoutDashboard className={`mr-3 h-5 w-5 ${
                      pathname === '/dashboard'
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-gray-400 dark:text-blue-400/50 group-hover:text-gray-500 dark:group-hover:text-blue-400'
                    }`} />
                    Dashboard
                  </Link>
                  <Link 
                    href="/operations" 
                    className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
                      pathname === '/operations'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                        : 'text-gray-700 dark:text-blue-300/70 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                    } group transition-all duration-200`}
                  >
                    <TrendingUp className={`mr-3 h-5 w-5 ${
                      pathname === '/operations'
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-gray-400 dark:text-blue-400/50 group-hover:text-gray-500 dark:group-hover:text-blue-400'
                    }`} />
                    Operaciones
                  </Link>
                  <Link 
                    href="#" 
                    className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-700 dark:text-blue-300/70 hover:bg-blue-100 dark:hover:bg-blue-900/20 group transition-all duration-200"
                  >
                    <Settings className="mr-3 h-5 w-5 text-gray-400 dark:text-blue-400/50 group-hover:text-gray-500 dark:group-hover:text-blue-400" />
                    Configuración
                  </Link>
                </nav>
              </div>
              
              <div className="p-4 border-t border-gray-200 dark:border-slate-800">
                <button 
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-blue-300/70 hover:bg-blue-100 dark:hover:bg-blue-900/20 group transition-all duration-200"
                >
                  <LogOut className="mr-3 h-5 w-5 text-gray-400 dark:text-blue-400/50 group-hover:text-gray-500 dark:group-hover:text-blue-400" />
                  Cerrar Sesión
                </button>
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

            <main className="py-6">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
