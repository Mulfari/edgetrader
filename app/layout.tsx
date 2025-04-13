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
  Wallet,
  UserCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./globals.css";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { signOut, getUserProfile } from '@/lib/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  subscription_started_at?: string | null;
  subscription_expires_at?: string | null;
  subscription_info?: string | null;
  last_sign_in_formatted?: string | null;
  avatar_url?: string | null;
}

// Función para formatear el rol del usuario
const formatUserRole = (role: string | null | undefined): string => {
  if (!role) return 'Limited';
  
  const roleMap: { [key: string]: string } = {
    'admin': 'Admin',
    'pro': 'Pro',
    'limited': 'Limited'
  };

  return roleMap[role.toLowerCase()] || 'Limited';
};

// Función para formatear el nombre del usuario
const formatUserName = (fullName: string | null): string => {
  if (!fullName) return 'Usuario';
  
  const names = fullName.trim().split(' ');
  if (names.length >= 2) {
    // Si hay apellido, tomar la inicial del apellido y el primer nombre
    return `${names[names.length - 1][0]}. ${names[0]}`;
  }
  // Si solo hay un nombre, devolverlo tal cual
  return names[0];
};

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

// Función de utilidad para acceder a localStorage de forma segura
const safeLocalStorage = {
  getItem: (key: string, defaultValue: any = null): any => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key) || defaultValue;
    }
    return defaultValue;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
  forEach: (callback: (key: string) => void): void => {
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(callback);
    }
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("Usuario");
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastUpdate] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, loading } = useSupabaseAuth();

  // Efecto para detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      // Solo intentar obtener perfil si tenemos un usuario autenticado
      if (!user || !isAuthenticated) {
        setUserName('Usuario');
        setUserEmail('');
        setProfile(null);
        return;
      }

      try {
        const profileData = await getUserProfile() as Profile | null;
        if (profileData) {
          setProfile(profileData);
          setUserName(formatUserName(profileData.full_name) || formatUserName(user.user_metadata?.full_name) || user.email?.split('@')[0] || 'Usuario');
          setUserEmail(profileData.email || user.email || '');
        } else {
          setProfile(null);
          setUserName(formatUserName(user.user_metadata?.full_name) || user.email?.split('@')[0] || 'Usuario');
          setUserEmail(user.email || '');
        }
      } catch (error) {
        setProfile(null);
        setUserName(formatUserName(user.user_metadata?.full_name) || user.email?.split('@')[0] || 'Usuario');
        setUserEmail(user.email || '');
      }
    };

    // Verificar si estamos en una página pública
    const isPublicPage = checkIsPublicPage(pathname);
    
    if (!isPublicPage && isAuthenticated && !loading) {
      fetchUserProfile();
    }
  }, [pathname, user, isAuthenticated, loading]);

  // Función para verificar si una ruta es pública
  const checkIsPublicPage = (path: string | null): boolean => {
    if (!path) return false;
    
    const publicRoutes = ['/', '/login', '/signup'];
    // Verificar rutas exactas
    if (publicRoutes.includes(path)) return true;
    // Verificar rutas que comienzan con ciertos prefijos
    return path.startsWith('/reset-password') || path.startsWith('/confirm-email');
  };

  const handleLogout = async () => {
    try {
      // Usar la función de cierre de sesión de Supabase
      await signOut();
      
      // Limpiar cualquier dato restante en localStorage
      // Datos de subcuentas y caché
      safeLocalStorage.removeItem("subAccounts");
      safeLocalStorage.removeItem("subaccounts_cache");
      
      // Datos de balances y caché
      safeLocalStorage.removeItem("accountBalances");
      safeLocalStorage.forEach(key => {
        if (key.startsWith('subaccount_balance_')) {
          safeLocalStorage.removeItem(key);
        }
      });
      
      // Preferencias de usuario
      safeLocalStorage.removeItem("balanceDisplayPreference");
      safeLocalStorage.removeItem("selectedSubAccountId");
      safeLocalStorage.removeItem("lastUpdate");
      
      console.log("✅ Sesión cerrada correctamente. Todos los datos en caché han sido eliminados.");
      
      // Redirigir al usuario a la página de login
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Verificar si estamos en páginas públicas
  const isPublicPage = checkIsPublicPage(pathname);

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
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${isMobileMenuOpen ? 'w-72 lg:w-[5.5rem] lg:hover:w-72' : 'w-[5.5rem] hover:w-72'} group
                shadow-[0_0_40px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_0_40px_-15px_rgba(0,0,0,0.5)]
                overflow-hidden
              `}>
                <div className="flex flex-col h-full w-full">
                  <div className="h-20 flex items-center border-b border-zinc-200/50 dark:border-zinc-800/40 px-6 group-hover:px-8">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl blur-2xl opacity-30"></div>
                        <div className="relative bg-gradient-to-br from-violet-500 to-indigo-500 w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transform transition-transform duration-300 hover:scale-105">
                          <BarChart3 className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className={`transition-all duration-300 transform whitespace-nowrap ${isMobileMenuOpen ? 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
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
                    <nav className="space-y-1 px-3 group-hover:px-4">
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
                          {!isMobileMenuOpen && pathname === item.href && (
                            <div className="absolute left-0 w-1 h-8 bg-violet-500 rounded-r-full transform -translate-y-1/2 top-1/2" />
                          )}
                          {isMobileMenuOpen && pathname === item.href && (
                            <div className="absolute left-0 w-1 h-8 bg-violet-500 rounded-r-full transform -translate-y-1/2 top-1/2 lg:hidden" />
                          )}
                          <div className={`
                            relative flex items-center w-full
                            ${pathname === item.href ? 'text-violet-500 dark:text-violet-400' : ''}
                          `}>
                            <div className="flex items-center justify-center min-w-[2.5rem] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-95">
                              <item.icon className={`
                                h-5 w-5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                                ${pathname === item.href
                                  ? 'text-violet-500 dark:text-violet-400'
                                  : 'text-gray-400 dark:text-blue-400/50 group-hover:text-violet-500 dark:group-hover:text-violet-400'
                                }
                                group-hover:-translate-x-0.5 transform-gpu
                              `} />
                            </div>
                            <span className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] whitespace-nowrap
                              ${isMobileMenuOpen 
                                ? 'opacity-100 translate-x-0 lg:opacity-0 lg:-translate-x-6 lg:group-hover:translate-x-0 lg:group-hover:opacity-100' 
                                : 'opacity-0 -translate-x-6 group-hover:translate-x-0 group-hover:opacity-100'
                              }`}>
                              {item.name}
                            </span>
                          </div>
                      </Link>
                      ))}
                    </nav>
                  </div>
                  
                  <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/60 px-3 group-hover:px-4">
                    <button 
                      onClick={handleLogout}
                      className={`
                        relative group/item flex items-center px-3 py-2.5 text-sm font-medium rounded-xl
                        bg-gradient-to-r from-rose-500/[0.03] to-pink-500/[0.03] 
                        hover:from-rose-500/[0.08] hover:to-pink-500/[0.08]
                        dark:from-rose-500/[0.05] dark:to-pink-500/[0.05]
                        dark:hover:from-rose-500/[0.1] dark:hover:to-pink-500/[0.1]
                        border border-rose-500/10 dark:border-rose-400/10
                        text-gray-700 dark:text-rose-300/70
                        transition-all duration-300 ease-in-out w-full
                        hover:border-rose-500/20 dark:hover:border-rose-400/20
                      `}
                    >
                      <div className="flex items-center justify-center min-w-[2.5rem]">
                        <div className="transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/item:scale-95">
                          <LogOut className="h-5 w-5 text-rose-500 dark:text-rose-400 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/item:-translate-x-0.5" />
                        </div>
                      </div>
                      <span className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] whitespace-nowrap text-rose-600 dark:text-rose-400
                        ${isMobileMenuOpen 
                          ? 'opacity-100 translate-x-0 lg:opacity-0 lg:-translate-x-6 lg:group-hover/item:translate-x-0 lg:group-hover/item:opacity-100' 
                          : 'opacity-0 -translate-x-6 group-hover/item:translate-x-0 group-hover/item:opacity-100'
                        }`}>
                        Cerrar Sesión
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Main content with navigation */}
              <div className={`
                transition-all duration-500 ease-in-out
                lg:pl-[5.5rem] group-hover:lg:pl-72
                min-h-screen
              `}>
                {/* Top navigation */}
                <header className={`
                  sticky top-0 z-30 
                  bg-white/95 dark:bg-[#12121A]/95
                  border-b border-zinc-200/50 dark:border-zinc-800/40
                  backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                  ${isScrolled ? 'h-12 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.3)]' : 'h-20'}
                  overflow-hidden
                `}>
                  <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8 w-full lg:max-w-[calc(100%-5.5rem)] lg:group-hover:max-w-[calc(100%-18rem)] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
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
                        <div className="flex flex-col">
                          <h1 className={`font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-500 tracking-tight transition-all duration-300 ${isScrolled ? 'text-lg' : 'text-2xl'}`}>
                            {pathname === '/operations/new' ? 'Nueva Operación' : menuItems.find(item => item.href === pathname)?.name || ''}
                          </h1>
                          <div className={`flex items-center gap-2 transition-all duration-300 ${isScrolled ? 'opacity-0 h-0' : 'opacity-100 mt-1'}`}>
                            <div className="h-1 w-1 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"></div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                              {pathname === '/operations/new' ? 'Crear una nueva operación de trading' : menuItems.find(item => item.href === pathname)?.description || ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`hidden sm:block transition-all duration-300 ${isScrolled ? 'opacity-0 w-0' : 'opacity-100'}`}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mr-4">
                              {lastUpdate && (
                                <span className="text-emerald-600/70 dark:text-emerald-400/70">Actualizado {lastUpdate}</span>
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
                              className="group relative p-2.5 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-gradient-to-br hover:from-violet-500/5 hover:to-indigo-500/5 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-gradient-to-br dark:hover:from-violet-500/10 dark:hover:to-indigo-500/10 focus:outline-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-lg hover:shadow-violet-200/50 dark:hover:shadow-violet-900/50"
                            >
                              <span className="sr-only">Ver notificaciones</span>
                              <div className="relative">
                                <div className={`transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ${isScrolled ? 'scale-95' : 'scale-100'}`}>
                                  <Bell className={`transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform group-hover:scale-110 h-5 w-5`} />
                                </div>
                                <div className={`absolute -top-1 -right-1 h-3 w-3 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ${isScrolled ? 'scale-95' : 'scale-100'}`}>
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
                              className="group relative flex items-center gap-3 px-1.5 py-1.5 rounded-xl
                                hover:bg-gradient-to-br hover:from-violet-500/5 hover:to-indigo-500/5 
                                dark:hover:from-violet-500/10 dark:hover:to-indigo-500/10 
                                transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                            >
                              <div className="relative p-1.5">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-all duration-700"></div>
                                <div className={`relative rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 p-0.5 transition-all duration-700 ${isScrolled ? 'h-9 w-9' : 'h-10 w-10'}`}>
                                  <div className="relative h-full w-full rounded-[10px] bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                                    {profile?.avatar_url ? (
                                      <img
                                        src={profile.avatar_url}
                                        alt="Avatar"
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <User className="h-5 w-5 text-violet-500 dark:text-violet-400 transform transition-all duration-700 group-hover:scale-110" />
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className={`hidden sm:block text-left transition-all duration-700 ${isScrolled ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col">
                                    <span className="text-base font-semibold text-zinc-900 dark:text-white whitespace-nowrap group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-300">
                                      {userName || 'Cargando...'}
                                    </span>
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium group-hover:text-violet-500/70 dark:group-hover:text-violet-400/70 transition-colors duration-300">
                                      {formatUserRole(profile?.role)}
                                    </span>
                                  </div>
                                  <div className="h-8 w-[1px] bg-gradient-to-b from-violet-500/20 to-indigo-500/20 dark:from-violet-400/10 dark:to-indigo-400/10 group-hover:from-violet-500/30 group-hover:to-indigo-500/30 transition-colors duration-300"></div>
                                </div>
                              </div>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-80">
                            <div className="p-4">
                              <div className="flex items-center gap-4 pb-4 mb-4 border-b border-zinc-200/50 dark:border-zinc-800/40">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl blur-lg opacity-30"></div>
                                  <div className="relative h-16 w-16 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 p-0.5 transform transition-transform duration-300 hover:scale-105">
                                    <div className="h-full w-full rounded-[10px] bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                                      {profile?.avatar_url ? (
                                        <img
                                          src={profile.avatar_url}
                                          alt="Avatar"
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <User className="h-8 w-8 text-violet-500 dark:text-violet-400" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-500 truncate">
                                    {userName || 'Cargando...'}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                      {formatUserRole(profile?.role)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="space-y-3">
                                  <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/[0.03] to-indigo-500/[0.03] hover:from-violet-500/[0.05] hover:to-indigo-500/[0.05] dark:from-violet-500/[0.05] dark:to-indigo-500/[0.05] border border-violet-500/10 dark:border-violet-400/10 space-y-3 transition-all duration-300">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-zinc-900 dark:text-white">Tipo de cuenta</span>
                                      <Badge variant="outline" className={`
                                        ${profile?.role === 'admin' ? 'bg-gradient-to-r from-violet-500/5 to-indigo-500/5 text-violet-700 dark:text-violet-400 border-violet-500/20' : 
                                          profile?.role === 'pro' ? 'bg-gradient-to-r from-emerald-500/5 to-emerald-600/5 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' :
                                          'bg-gradient-to-r from-blue-500/5 to-blue-600/5 text-blue-700 dark:text-blue-400 border-blue-500/20'}
                                      `}>
                                        {formatUserRole(profile?.role)}
                                      </Badge>
                                    </div>
                                    {profile?.role !== 'limited' && (
                                      <>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-zinc-600 dark:text-zinc-400">Inicio membresía</span>
                                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                            {profile?.subscription_started_at ? new Date(profile.subscription_started_at).toLocaleDateString('es-ES', {
                                              day: '2-digit',
                                              month: 'short',
                                              year: 'numeric'
                                            }) : 'N/A'}
                                          </span>
                                        </div>
                                        {profile?.subscription_expires_at && (
                                          <div className="flex justify-between text-sm">
                                            <span className="text-zinc-600 dark:text-zinc-400">Vence</span>
                                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                              {new Date(profile.subscription_expires_at).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                              })}
                                            </span>
                                          </div>
                                        )}
                                        {profile?.subscription_info && profile.subscription_info !== 'Cuenta gratuita' && (
                                          <div className="relative h-6 w-full bg-violet-100 dark:bg-violet-900/30 rounded-lg overflow-hidden">
                                            <div className={`absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-lg ${
                                              profile.subscription_info === 'Expirada' ? 'w-full bg-rose-500' : 'w-3/4'
                                            }`}></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                              <p className="text-xs font-medium text-white drop-shadow-md">
                                                {profile.subscription_info}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    )}
                                    <div className="pt-2 mt-2 border-t border-zinc-200/50 dark:border-zinc-700/50">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-zinc-600 dark:text-zinc-400">Último acceso</span>
                                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                          {profile?.last_sign_in_formatted || 'Nunca'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <Link
                                      href="/settings"
                                      className="group p-3 rounded-xl 
                                        bg-gradient-to-r from-violet-500/[0.03] to-indigo-500/[0.03] 
                                        hover:from-violet-500/[0.08] hover:to-indigo-500/[0.08]
                                        dark:from-violet-500/[0.05] dark:to-indigo-500/[0.05]
                                        dark:hover:from-violet-500/[0.1] dark:hover:to-indigo-500/[0.1]
                                        border border-violet-500/10 dark:border-violet-400/10
                                        hover:border-violet-500/20 dark:hover:border-violet-400/20
                                        transition-all duration-300"
                                    >
                                      <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-lg blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                                        <div className="transform-gpu transition-transform duration-300 group-hover:scale-95">
                                          <Settings className="h-5 w-5 text-violet-500 dark:text-violet-400 mb-2" />
                                        </div>
                                      </div>
                                      <p className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-300">Ajustes</p>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Configuración</p>
                                    </Link>
                                    
                                    <button
                                      onClick={handleLogout}
                                      className="group p-3 rounded-xl text-left
                                        bg-gradient-to-r from-rose-500/[0.03] to-pink-500/[0.03] 
                                        hover:from-rose-500/[0.08] hover:to-pink-500/[0.08]
                                        dark:from-rose-500/[0.05] dark:to-pink-500/[0.05]
                                        dark:hover:from-rose-500/[0.1] dark:hover:to-pink-500/[0.1]
                                        border border-rose-500/10 dark:border-rose-400/10
                                        hover:border-rose-500/20 dark:hover:border-rose-400/20
                                        transition-all duration-300"
                                    >
                                      <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-lg blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                                        <div className="transform-gpu transition-transform duration-300 group-hover:scale-95">
                                          <LogOut className="h-5 w-5 text-rose-500 dark:text-rose-400 mb-2" />
                                        </div>
                                      </div>
                                      <p className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors duration-300">Cerrar sesión</p>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Salir del sistema</p>
                                    </button>
                                  </div>
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
