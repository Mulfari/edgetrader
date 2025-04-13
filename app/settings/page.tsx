"use client";

import { useState, useEffect } from "react";
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
  UserCircle,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { getUserProfile, updateUserAvatar, updatePassword } from "../lib/supabase";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

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

// Lista de avatares predefinidos
const predefinedAvatars = [
  {
    name: 'Sin avatar',
    url: null
  },
  {
    name: 'Ejecutivo',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=John&backgroundColor=b6e3f4,c0aede,d1d4f9&style=circle'
  },
  {
    name: 'Directora',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=Sarah&backgroundColor=ffd5dc,ffdfbf&style=circle'
  },
  {
    name: 'Profesional',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=Michael&backgroundColor=d1d4f9&style=circle'
  },
  {
    name: 'Creativa',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=Emma&backgroundColor=c0aede&style=circle'
  },
  {
    name: 'Innovador',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=David&backgroundColor=b6e3f4&style=circle'
  },
  {
    name: 'Dinámica',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=Lisa&backgroundColor=ffd5dc&style=circle'
  },
  {
    name: 'Técnico',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=tech&backgroundColor=b6e3f4'
  },
  {
    name: 'Robot',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=robot&backgroundColor=c0aede'
  },
  {
    name: 'Pixel',
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=pixel&backgroundColor=ffd5dc'
  },
  {
    name: 'Retro',
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=retro&backgroundColor=d1d4f9'
  },
  {
    name: 'Aventurero',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=adventure&backgroundColor=ffdfbf'
  }
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("perfil");
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const avatarsPerPage = 8;
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        setProfile(data);
        setSelectedAvatar(data?.avatar_url || predefinedAvatars[0].url);
      } catch (error) {
        console.error('Error al obtener el perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

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

  const openModal = () => {
    const modal = document.getElementById('avatar-modal') as HTMLDialogElement;
    if (modal) {
      modal.showModal();
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    const modal = document.getElementById('avatar-modal') as HTMLDialogElement;
    if (modal) {
      modal.close();
      setIsModalOpen(false);
    }
  };

  const selectAvatarAndClose = async (url: string | null) => {
    try {
      setError(null);
      setSelectedAvatar(url);
      if (url !== null) {
        const data = await updateUserAvatar(url);
        if (data) {
          closeModal();
        }
      } else {
        const data = await updateUserAvatar('');
        if (data) {
          closeModal();
        }
      }
    } catch (error) {
      console.error('Error al actualizar el avatar:', error);
      setError(error instanceof Error ? error.message : 'Error al actualizar el avatar');
      setSelectedAvatar(profile?.avatar_url || null);
    }
  };

  const totalPages = Math.ceil(predefinedAvatars.length / avatarsPerPage);
  const startIndex = (currentPage - 1) * avatarsPerPage;
  const endIndex = startIndex + avatarsPerPage;
  const currentAvatars = predefinedAvatars.slice(startIndex, endIndex);

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
      const { error } = await updatePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      if (error) {
        toast.error(error);
        return;
      }
      
      // Mensaje de éxito mejorado con toast personalizado
      toast.custom((t) => (
        <div className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white dark:bg-zinc-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  ¡Contraseña actualizada!
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Tu contraseña ha sido actualizada exitosamente.
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200 dark:border-zinc-700">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-500 focus:outline-none"
            >
              Cerrar
            </button>
          </div>
        </div>
      ), {
        duration: 4000,
        position: 'top-center',
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Cerrar el formulario después de actualizar exitosamente
      setShowPasswordForm(false);
    } catch (error) {
      toast.error('Error al actualizar la contraseña');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const renderSecurityTab = () => (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
      <div className="px-6 py-5 flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg blur opacity-25"></div>
          <div className="relative h-14 w-14 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 p-[2px]">
            <div className="h-full w-full rounded-[7px] bg-white dark:bg-zinc-900 flex items-center justify-center">
              <Shield className="h-7 w-7 text-amber-500 dark:text-amber-400" />
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
            Seguridad
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Protege tu cuenta
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {/* Contraseña */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/[0.03] to-orange-500/[0.03] border border-amber-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="h-4.5 w-4.5 text-amber-500" />
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  Contraseña
                </span>
              </div>
              <button 
                onClick={() => setShowPasswordForm(prev => !prev)}
                className="px-3 py-1.5 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 
                  focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-400/20 rounded-md
                  transition-all duration-200"
              >
                {showPasswordForm ? 'Cancelar' : 'Cambiar'}
              </button>
            </div>
            
            {/* Formulario de cambio de contraseña */}
            <AnimatePresence mode="wait">
              {showPasswordForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    type: "spring",
                    duration: 0.5,
                    bounce: 0.2
                  }}
                  className="overflow-hidden"
                >
                  <motion.form 
                    onSubmit={handlePasswordChange}
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mt-4 space-y-4"
                  >
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {/* Contraseña actual */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="relative">
                          <input
                            type={showPasswords.current ? "text" : "password"}
                            placeholder="Contraseña actual"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className={`block w-full px-3 py-2 border ${
                              passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                            } rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-zinc-800 dark:text-white text-sm`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords.current ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-1 text-xs text-red-600"
                          >
                            {passwordErrors.currentPassword}
                          </motion.p>
                        )}
                      </motion.div>

                      {/* Nueva contraseña */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        <div className="relative">
                          <input
                            type={showPasswords.new ? "text" : "password"}
                            placeholder="Nueva contraseña"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className={`block w-full px-3 py-2 border ${
                              passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                            } rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-zinc-800 dark:text-white text-sm`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords.new ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.newPassword && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-1 text-xs text-red-600"
                          >
                            {passwordErrors.newPassword}
                          </motion.p>
                        )}
                      </motion.div>

                      {/* Confirmar nueva contraseña */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? "text" : "password"}
                            placeholder="Confirmar nueva contraseña"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className={`block w-full px-3 py-2 border ${
                              passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                            } rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-zinc-800 dark:text-white text-sm`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords.confirm ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.confirmPassword && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-1 text-xs text-red-600"
                          >
                            {passwordErrors.confirmPassword}
                          </motion.p>
                        )}
                      </motion.div>
                    </motion.div>

                    <motion.div 
                      className="flex justify-end"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 
                          hover:from-amber-600 hover:to-orange-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 
                          disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            Actualizando...
                          </>
                        ) : (
                          'Actualizar contraseña'
                        )}
                      </button>
                    </motion.div>
                  </motion.form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Autenticación 2FA */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/[0.03] to-orange-500/[0.03] border border-amber-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4.5 w-4.5 text-amber-500" />
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  Autenticación 2FA
                </span>
              </div>
              <button className="px-3 py-1.5 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 
                focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-400/20 rounded-md
                transition-all duration-200">
                Activar
              </button>
            </div>
          </div>

          {/* Correo verificado */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/[0.03] to-orange-500/[0.03] border border-amber-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4.5 w-4.5 text-amber-500" />
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  Correo verificado
                </span>
              </div>
              <Badge variant="outline" className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                Verificado
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              <div className="px-6 py-5 flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-lg blur opacity-25"></div>
                  <div className="relative h-14 w-14 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 p-[2px]">
                    <div className="h-full w-full rounded-[7px] bg-white dark:bg-zinc-900 flex items-center justify-center">
                      <User className="h-7 w-7 text-violet-500 dark:text-violet-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                    Perfil
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Información de tu cuenta
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Información principal */}
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/75">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-violet-500 dark:text-violet-400" />
                      <div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-white">
                          Nombre completo
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          {profile?.full_name || 'Cargando...'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Avatar selection */}
                  <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/75">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16">
                        <div className="h-full w-full rounded-xl border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-800">
                          {selectedAvatar ? (
                            <img
                              src={selectedAvatar}
                              alt="Avatar actual"
                              className="w-full h-full object-contain p-1.5"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <UserCircle className="w-16 h-16 text-primary/30" />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={openModal}
                          className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full bg-violet-500 dark:bg-violet-400 text-white shadow-lg shadow-violet-500/25 dark:shadow-violet-400/25 
                            hover:bg-violet-600 dark:hover:bg-violet-500 transition-all duration-200"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-zinc-900 dark:text-white">
                          Avatar
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          Personaliza tu imagen de perfil
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/75">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-violet-500 dark:text-violet-400" />
                      <div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-white">
                          Correo electrónico
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          {profile?.email || 'Cargando...'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/75">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-violet-500 dark:text-violet-400" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-zinc-900 dark:text-white">
                          Tipo de cuenta
                        </div>
                        <div className="mt-1.5 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`
                                ${profile?.role === 'admin' 
                                  ? 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20' 
                                  : profile?.role === 'pro' 
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                                    : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                                }
                              `}
                            >
                              {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'pro' ? 'Pro' : 'Limitado'}
                            </Badge>
                            {profile?.role === 'limited' && (
                              <Badge 
                                variant="outline" 
                                className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                              >
                                Cuenta gratuita
                              </Badge>
                            )}
                          </div>
                          {profile?.role !== 'limited' && profile?.subscription_info && (
                            <div className="relative h-1.5 w-full bg-violet-100 dark:bg-violet-900/30 rounded-full overflow-hidden">
                              <div 
                                className={`absolute inset-0 rounded-full transition-all duration-500 ${
                                  profile.subscription_info === 'Expirada' 
                                    ? 'bg-rose-500 w-full' 
                                    : 'bg-gradient-to-r from-violet-500 to-indigo-500 w-3/4'
                                }`}
                              />
                            </div>
                          )}
                          {profile?.role !== 'limited' && profile?.subscription_info && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {profile.subscription_info}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Seguridad */}
          {activeTab === "seguridad" && renderSecurityTab()}

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

      <dialog
        id="avatar-modal"
        className="modal bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-0 backdrop:bg-zinc-950/50"
      >
        <div className="w-[90vw] max-w-2xl">
          <div className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
              Seleccionar avatar
            </h3>
            <button
              onClick={closeModal}
              className="text-zinc-400 hover:text-zinc-500 dark:text-zinc-500 dark:hover:text-zinc-400"
            >
              ✕
            </button>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="h-[320px]">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {currentAvatars.map((avatar, index) => (
                  <button
                    key={index}
                    onClick={() => selectAvatarAndClose(avatar.url)}
                    className={`relative aspect-square rounded-xl border-2 transition-all duration-200 ${
                      selectedAvatar === avatar.url
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border hover:border-primary/30 hover:bg-primary/5'
                    }`}
                  >
                    {avatar.url ? (
                      <img
                        src={avatar.url}
                        alt={avatar.name}
                        className="w-full h-full p-2"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserCircle className="w-16 h-16 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 right-1 text-xs text-center bg-background/80 rounded py-0.5">
                      {avatar.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-all duration-200
                    ${currentPage === 1
                      ? 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                      : 'text-violet-500 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10'
                    }
                  `}
                >
                  ←
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200
                      ${currentPage === page
                        ? 'bg-violet-500 dark:bg-violet-400 text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-violet-50 dark:hover:bg-violet-500/10'
                      }
                    `}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-all duration-200
                    ${currentPage === totalPages
                      ? 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                      : 'text-violet-500 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10'
                    }
                  `}
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
} 