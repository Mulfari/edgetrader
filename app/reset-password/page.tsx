"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { updatePassword, getSession } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";

type Language = 'es' | 'en' | 'de';

const translations = {
  es: {
    resetPassword: "Restablecer Contraseña",
    resetPasswordDesc: "Crea una nueva contraseña segura para tu cuenta Mulfex Trader.",
    newPassword: "Nueva Contraseña",
    confirmPassword: "Confirmar Contraseña",
    resetBtn: "Restablecer Contraseña",
    resetting: "Restableciendo...",
    invalidPassword: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (!@#$%^&*).",
    passwordsNotMatch: "Las contraseñas no coinciden",
    resetSuccess: "¡Tu contraseña ha sido restablecida exitosamente!",
    loginNow: "Iniciar sesión ahora",
    tradingPlatform: "Plataforma de Trading",
    intelligentSecure: "Inteligente y Segura",
    manageTrades: "Gestiona tus operaciones de trading con tecnología avanzada y seguridad de primer nivel.",
    advancedTech: "Tecnología Avanzada",
    activeUsers: "Usuarios Activos",
    operations: "Operaciones",
    availability: "Disponibilidad",
    backToLogin: "Volver al inicio de sesión",
    invalidLink: "El enlace es inválido o ha expirado",
    redirectingIn: "Redirigiendo en {seconds} segundos",
    passwordRequirements: {
      chars: "8+ caracteres",
      uppercase: "Mayúscula",
      lowercase: "Minúscula",
      number: "Número",
      special: "Especial (!@#$%^&*)"
    }
  },
  en: {
    resetPassword: "Reset Password",
    resetPasswordDesc: "Create a new secure password for your Mulfex Trader account.",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    resetBtn: "Reset Password",
    resetting: "Resetting...",
    invalidPassword: "Password must have at least 8 characters, one uppercase, one lowercase, one number, and one special character (!@#$%^&*).",
    passwordsNotMatch: "Passwords do not match",
    resetSuccess: "Your password has been successfully reset!",
    loginNow: "Login now",
    tradingPlatform: "Trading Platform",
    intelligentSecure: "Intelligent and Secure",
    manageTrades: "Manage your trading operations with advanced technology and top-level security.",
    advancedTech: "Advanced Technology",
    activeUsers: "Active Users",
    operations: "Operations",
    availability: "Availability",
    backToLogin: "Back to login",
    invalidLink: "Invalid or expired link",
    redirectingIn: "Redirecting in {seconds} seconds",
    passwordRequirements: {
      chars: "8+ characters",
      uppercase: "Uppercase",
      lowercase: "Lowercase",
      number: "Number",
      special: "Special (!@#$%^&*)"
    }
  },
  de: {
    resetPassword: "Passwort zurücksetzen",
    resetPasswordDesc: "Erstellen Sie ein neues sicheres Passwort für Ihr Mulfex Trader-Konto.",
    newPassword: "Neues Passwort",
    confirmPassword: "Passwort bestätigen",
    resetBtn: "Passwort zurücksetzen",
    resetting: "Wird zurückgesetzt...",
    invalidPassword: "Das Passwort muss mindestens 8 Zeichen, einen Großbuchstaben, einen Kleinbuchstaben, eine Zahl und ein Sonderzeichen (!@#$%^&*) enthalten.",
    passwordsNotMatch: "Passwörter stimmen nicht überein",
    resetSuccess: "Ihr Passwort wurde erfolgreich zurückgesetzt!",
    loginNow: "Jetzt anmelden",
    tradingPlatform: "Trading-Plattform",
    intelligentSecure: "Intelligent und Sicher",
    manageTrades: "Verwalten Sie Ihre Trading-Operationen mit fortschrittlicher Technologie und höchster Sicherheit.",
    advancedTech: "Fortschrittliche Technologie",
    activeUsers: "Aktive Nutzer",
    operations: "Operationen",
    availability: "Verfügbarkeit",
    backToLogin: "Zurück zur Anmeldung",
    invalidLink: "Ungültiger oder abgelaufener Link",
    redirectingIn: "Umleitung in {seconds} Sekunden",
    passwordRequirements: {
      chars: "8+ Zeichen",
      uppercase: "Großbuchstabe",
      lowercase: "Kleinbuchstabe",
      number: "Nummer",
      special: "Sonderzeichen (!@#$%^&*)"
    }
  }
};

// Validación de contraseña
const isValidPassword = (password: string): boolean => {
  return password.length >= 8 &&
         /[A-Z]/.test(password) &&
         /[a-z]/.test(password) &&
         /[0-9]/.test(password) &&
         /[!@#$%^&*]/.test(password);
};

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({ password: "", confirmPassword: "" });
  const [language, setLanguage] = useState<Language>('es');
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  useEffect(() => {
    // Cargar el idioma guardado
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
    if (savedLanguage && ['es', 'en', 'de'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else {
      // Si no hay idioma guardado, intentar detectar el idioma del navegador
      const browserLanguage = navigator.language.split('-')[0];
      const supportedLanguage = ['es', 'en', 'de'].includes(browserLanguage) ? browserLanguage as Language : 'en';
      setLanguage(supportedLanguage);
      localStorage.setItem('preferredLanguage', supportedLanguage);
    }

    // Verificar el hash de la URL para el token
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (!accessToken || type !== 'recovery') {
      toast.error(translations[language].invalidLink);
      router.push("/login");
    }
  }, [router]);

  // Efecto para el contador de redirección
  useEffect(() => {
    if (isSuccess) {
      const timer = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown <= 1) {
            clearInterval(timer);
            // Asegurarse de que no haya sesión activa al redirigir
            supabase.auth.signOut().then(() => {
              localStorage.removeItem('token');
              router.push('/login');
            }).catch(error => {
              console.error("Error al cerrar sesión:", error);
              router.push('/login');
            });
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isSuccess, router]);

  // Obtener las traducciones para el idioma actual
  const t = translations[language];

  const validateForm = () => {
    let valid = true;
    const newErrors = { password: "", confirmPassword: "" };

    if (!isValidPassword(password)) {
      newErrors.password = t.invalidPassword;
      valid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t.passwordsNotMatch;
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const { success, error } = await updatePassword(password);
      
      if (success) {
        setIsSuccess(true);
        toast.success(t.resetSuccess);
      } else if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Error resetting password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fondo con gradiente y efectos */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-600/30 backdrop-blur-sm"></div>
        
        {/* Elementos decorativos flotantes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-4 top-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute -left-4 top-3/4 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute right-1/4 bottom-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Contenedor principal */}
      <div className="relative z-10 min-h-screen flex">
        {/* Sección izquierda - Hero/Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          <div className="relative w-full flex flex-col justify-between p-12">
            <div>
              <div className="flex items-center gap-2 text-white">
                <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="font-bold text-xl">MF</span>
                </div>
                <span className="text-lg font-medium">Mulfex Trader</span>
              </div>
            </div>
            
            <div className="space-y-6">
              <h1 className="text-4xl font-bold text-white">
                {t.tradingPlatform} <br />
                {t.intelligentSecure}
              </h1>
              <p className="text-lg text-white/80">
                {t.manageTrades}
              </p>
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/20" />
                <div className="text-white/60 text-sm">{t.advancedTech}</div>
                <div className="h-px flex-1 bg-white/20" />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="text-white/60 text-sm">{t.activeUsers}</h3>
                <p className="text-2xl font-bold text-white">10k+</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-white/60 text-sm">{t.operations}</h3>
                <p className="text-2xl font-bold text-white">1M+</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-white/60 text-sm">{t.availability}</h3>
                <p className="text-2xl font-bold text-white">99.9%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección derecha - Contenido de restablecimiento */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-white dark:bg-gray-900 p-8 relative rounded-tl-[40px] rounded-bl-[40px]">
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/25 bg-[size:20px_20px] opacity-[0.05] rounded-tl-[40px] rounded-bl-[40px]"></div>

          <div className="w-full max-w-md flex flex-col">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center p-6"
                >
                  <div className="w-20 h-20 mb-6 relative">
                    <div className="absolute inset-0 bg-cyan-200 dark:bg-cyan-900/50 rounded-full animate-ping opacity-25"></div>
                    <div className="relative w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-10 h-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="max-w-md bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-800/60 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 text-center mb-3">
                      {t.resetSuccess}
                    </h3>
                    
                    <div className="flex flex-col items-center">
                      <div className="relative w-16 h-16 mb-2">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                          <circle 
                            cx="50" cy="50" r="45" 
                            fill="none" 
                            stroke="#e5e7eb" 
                            strokeWidth="8" 
                            className="dark:stroke-gray-700"
                          />
                          <circle 
                            cx="50" cy="50" r="45" 
                            fill="none" 
                            stroke="url(#countdown-gradient)" 
                            strokeWidth="8" 
                            strokeDasharray="283" 
                            strokeDashoffset={283 - (283 * countdown / 5)}
                            className="transition-all duration-1000"
                          />
                          <defs>
                            <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#0ea5e9" />
                              <stop offset="100%" stopColor="#2563eb" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-cyan-500 dark:text-cyan-400">
                            {countdown}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t.redirectingIn.replace('{seconds}', '')}
                      </p>
                    </div>
                    
                    <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
                      <Link 
                        href="/login" 
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transform transition-all duration-200 hover:scale-[1.02]"
                      >
                        {t.loginNow}
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {t.resetPassword}
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {t.resetPasswordDesc}
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t.newPassword} <span className="text-rose-500">*</span>
                        </label>
                        <div className="mt-1 relative">
                          <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`appearance-none block w-full px-3 py-2 border ${
                              errors.password 
                                ? 'border-red-300 dark:border-red-700' 
                                : password && isValidPassword(password)
                                  ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 text-gray-800 dark:text-cyan-50 font-medium'
                                  : 'border-gray-300 dark:border-gray-700'
                            } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ${
                              password && isValidPassword(password)
                                ? 'hover:border-cyan-400 dark:hover:border-cyan-600 hover:shadow-md dark:hover:shadow-cyan-900/10' 
                                : 'hover:border-gray-400 dark:hover:border-gray-500'
                            } pr-10`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" />
                            )}
                          </button>
                          {password && isValidPassword(password) && !errors.password && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-y-0 right-10 flex items-center pointer-events-none"
                            >
                              <svg className="h-5 w-5 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </motion.div>
                          )}
                        </div>
                        {errors.password && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                            <AlertCircle size={14} className="mr-1" /> {errors.password}
                          </p>
                        )}

                        {/* Validador de robustez de contraseña */}
                        {password && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 space-y-2"
                          >
                            <div className="flex gap-2 flex-wrap">
                              {[
                                { met: password.length >= 8, text: t.passwordRequirements.chars },
                                { met: /[A-Z]/.test(password), text: t.passwordRequirements.uppercase },
                                { met: /[a-z]/.test(password), text: t.passwordRequirements.lowercase },
                                { met: /[0-9]/.test(password), text: t.passwordRequirements.number },
                                { met: /[!@#$%^&*]/.test(password), text: t.passwordRequirements.special }
                              ].map((requirement, index) => (
                                <div
                                  key={index}
                                  className={`text-[10px] px-2 py-1 rounded-full ${
                                    requirement.met
                                      ? "bg-green-500/20 text-green-500 dark:bg-green-500/10 dark:text-green-400"
                                      : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                                  }`}
                                >
                                  {requirement.text}
                                </div>
                              ))}
                            </div>
                            <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                                initial={{ width: "0%" }}
                                animate={{
                                  width: `${
                                    ((password.length >= 8 ? 1 : 0) +
                                    (/[A-Z]/.test(password) ? 1 : 0) +
                                    (/[a-z]/.test(password) ? 1 : 0) +
                                    (/[0-9]/.test(password) ? 1 : 0) +
                                    (/[!@#$%^&*]/.test(password) ? 1 : 0)) *
                                    20
                                  }%`
                                }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                          </motion.div>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t.confirmPassword} <span className="text-rose-500">*</span>
                        </label>
                        <div className="mt-1 relative">
                          <input
                            id="confirm-password"
                            name="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`appearance-none block w-full px-3 py-2 border ${
                              errors.confirmPassword 
                                ? 'border-red-300 dark:border-red-700' 
                                : confirmPassword && confirmPassword === password && isValidPassword(password)
                                  ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 text-gray-800 dark:text-cyan-50 font-medium'
                                  : 'border-gray-300 dark:border-gray-700'
                            } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ${
                              confirmPassword && confirmPassword === password && isValidPassword(password)
                                ? 'hover:border-cyan-400 dark:hover:border-cyan-600 hover:shadow-md dark:hover:shadow-cyan-900/10' 
                                : 'hover:border-gray-400 dark:hover:border-gray-500'
                            } pr-10`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" />
                            )}
                          </button>
                          {confirmPassword && confirmPassword === password && isValidPassword(password) && !errors.confirmPassword && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-y-0 right-10 flex items-center pointer-events-none"
                            >
                              <svg className="h-5 w-5 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </motion.div>
                          )}
                        </div>
                        {errors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                            <AlertCircle size={14} className="mr-1" /> {errors.confirmPassword}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 size={16} className="mr-2 animate-spin" />
                              {t.resetting}
                            </>
                          ) : (
                            t.resetBtn
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-4 flex justify-start"
                  >
                    <Link
                      href="/login"
                      className="group w-2/5 flex items-center justify-center px-4 py-2 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 hover:shadow-xl"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5 text-cyan-500 dark:text-cyan-400 transition-transform duration-300 group-hover:-translate-x-1" />
                      <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500">
                        {t.backToLogin}
                      </span>
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50/50 via-white/50 to-zinc-100/50 dark:from-[#0A0A0F] dark:via-[#12121A] dark:to-[#0A0A0F]">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
} 