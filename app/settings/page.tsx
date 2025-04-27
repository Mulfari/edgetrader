"use client";

import { useState } from "react";
import { 
  User, 
  Shield, 
  Bell, 
  Wallet,
  Mail,
  Key,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Check,
  Calendar,
  Camera,
  Pencil,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Star,
  KeyRound
} from "lucide-react"; // Solo los íconos realmente usados en tabs y secciones
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { updatePassword } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import SettingsPerfil from "./SettingsPerfil";
import SettingsSeguridad from "./SettingsSeguridad";
import SettingsSuscription from "./SettingsSuscription";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import SettingsSubaccounts from "./SettingsSubaccounts";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  subscription_info: string;
  last_sign_in_formatted: string;
  avatar_url: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UpdatePasswordResponse {
  data?: any;
  error?: string | null;
  success: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("perfil");
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Partial<PasswordForm>>({});
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const tabs = [
    {
      id: "perfil",
      name: "Perfil",
      icon: User,
      badge: null
    },
    {
      id: "seguridad",
      name: "Seguridad",
      icon: Shield,
      badge: {
        text: "Importante",
        variant: "warning"
      }
    },
    {
      id: "suscripcion",
      name: "Suscripción",
      icon: Star,
      badge: null
    },
    {
      id: "subcuentas",
      name: "Subcuentas/API Keys",
      icon: Key,
      badge: null
    },
    {
      id: "notificaciones",
      name: "Notificaciones",
      icon: Bell,
      badge: {
        text: "3 nuevas",
        variant: "info"
      }
    },
    {
      id: "billetera",
      name: "Billetera",
      icon: Wallet,
      badge: null
    }
  ];

  const validatePasswordForm = () => {
    const errors: Partial<PasswordForm> = {};
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'La contraseña actual es requerida';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'La nueva contraseña es requerida';
    } else {
      // Validaciones de contraseña del signup
      const hasMinLength = passwordForm.newPassword.length >= 8;
      const hasUpperCase = /[A-Z]/.test(passwordForm.newPassword);
      const hasLowerCase = /[a-z]/.test(passwordForm.newPassword);
      const hasNumber = /\d/.test(passwordForm.newPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword);

      if (!hasMinLength) {
        errors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
      } else if (!hasUpperCase) {
        errors.newPassword = 'La contraseña debe incluir al menos una mayúscula';
      } else if (!hasLowerCase) {
        errors.newPassword = 'La contraseña debe incluir al menos una minúscula';
      } else if (!hasNumber) {
        errors.newPassword = 'La contraseña debe incluir al menos un número';
      } else if (!hasSpecialChar) {
        errors.newPassword = 'La contraseña debe incluir al menos un carácter especial';
      }
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Confirma tu nueva contraseña';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    return errors;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validatePasswordForm();
    setPasswordErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      // Primero verificar la contraseña actual usando signInWithEmail
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordForm.currentPassword
      });

      if (signInError) {
        throw new Error('La contraseña actual es incorrecta');
      }

      // Si la verificación fue exitosa, actualizar la contraseña
      const response = await updatePassword(passwordForm.newPassword);

      if (!response.success || response.error) {
        throw new Error(response.error || 'Error al actualizar la contraseña');
      }
      
      toast.success('¡Contraseña actualizada correctamente!');

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setShowPasswordForm(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar la contraseña';
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-6">
        {/* Sidebar de navegación */}
        <nav className="space-y-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg
                transition-all duration-200 ease-in-out
                ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-violet-500/10 via-violet-500/10 to-indigo-500/10 dark:from-violet-400/10 dark:via-violet-400/10 dark:to-indigo-400/10 text-violet-700 dark:text-violet-300 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                }
              `}
            >
              <tab.icon className={`h-4.5 w-4.5 transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'text-violet-500 dark:text-violet-400'
                  : 'text-zinc-400 dark:text-zinc-500'
              }`} />
              <span className="truncate">{tab.name}</span>
              {tab.badge && (
                <Badge 
                  variant="outline" 
                  className={`ml-auto text-xs px-2 py-0.5 ${
                    tab.badge.variant === 'warning'
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                      : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                  }`}
                >
                  {tab.badge.text}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        {/* Contenido principal */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/75 dark:border-zinc-800/75 shadow-sm">
          {/* Perfil */}
          {activeTab === "perfil" && (
            <SettingsPerfil />
          )}

          {/* Seguridad */}
          {activeTab === "seguridad" && (
            <SettingsSeguridad />
          )}

          {/* Suscripción */}
          {activeTab === "suscripcion" && (
            <SettingsSuscription />
          )}

          {/* Subcuentas/API Keys */}
          {activeTab === "subcuentas" && (
            <SettingsSubaccounts />
          )}
          {/* Notificaciones */}
          {activeTab === "notificaciones" && (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              <div className="px-6 py-5 flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg blur opacity-25"></div>
                  <div className="relative h-14 w-14 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 p-[2px]">
                    <div className="h-full w-full rounded-[7px] bg-white dark:bg-zinc-900 flex items-center justify-center">
                      <Bell className="h-7 w-7 text-blue-500 dark:text-blue-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                    Notificaciones
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Configura tus alertas
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-white">
                    Correo electrónico
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="form-checkbox rounded text-violet-500 border-zinc-300 dark:border-zinc-600 
                        focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-400/20
                        transition-all duration-200" />
                      <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Actualizaciones de cuenta
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="form-checkbox rounded text-violet-500 border-zinc-300 dark:border-zinc-600 
                        focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-400/20
                        transition-all duration-200" />
                      <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Nuevas operaciones
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="form-checkbox rounded text-violet-500 border-zinc-300 dark:border-zinc-600 
                        focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-400/20
                        transition-all duration-200" />
                      <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Alertas de seguridad
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-white">
                    Notificaciones push
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="form-checkbox rounded text-violet-500 border-zinc-300 dark:border-zinc-600 
                        focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-400/20
                        transition-all duration-200" />
                      <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Cambios en el balance
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="form-checkbox rounded text-violet-500 border-zinc-300 dark:border-zinc-600 
                        focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-400/20
                        transition-all duration-200" />
                      <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Estado de operaciones
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billetera */}
          {activeTab === "billetera" && (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              <div className="px-6 py-5 flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg blur opacity-25"></div>
                  <div className="relative h-14 w-14 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 p-[2px]">
                    <div className="h-full w-full rounded-[7px] bg-white dark:bg-zinc-900 flex items-center justify-center">
                      <Wallet className="h-7 w-7 text-emerald-500 dark:text-emerald-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                    Billetera
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Ajusta tus preferencias
                  </p>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-500/[0.03] to-green-500/[0.03] border border-emerald-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="h-4.5 w-4.5 text-emerald-500" />
                        <span className="text-sm font-medium text-zinc-900 dark:text-white">
                          Moneda
                        </span>
                      </div>
                      <select className="text-sm bg-transparent border-0 text-emerald-600 dark:text-emerald-400 focus:ring-0 cursor-pointer">
                        <option>USD</option>
                        <option>EUR</option>
                        <option>GBP</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-500/[0.03] to-green-500/[0.03] border border-emerald-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {theme === 'dark' ? (
                          <Moon className="h-4.5 w-4.5 text-emerald-500" />
                        ) : (
                          <Sun className="h-4.5 w-4.5 text-emerald-500" />
                        )}
                        <span className="text-sm font-medium text-zinc-900 dark:text-white">
                          Tema
                        </span>
                      </div>
                      <select 
                        className="text-sm bg-transparent border-0 text-emerald-600 dark:text-emerald-400 focus:ring-0 cursor-pointer"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                      >
                        <option value="light">Claro</option>
                        <option value="dark">Oscuro</option>
                        <option value="system">Sistema</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}