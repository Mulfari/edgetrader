"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, AlertCircle, Loader2, X } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { signInWithEmail, getSession, signInWithGoogle, supabase, resetPassword } from "@/lib/supabase";
import { toast } from 'react-hot-toast';

// Tipos para los errores de validación
interface ValidationErrors {
  email: string;
  password: string;
}

// Función para validar email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función para validar contraseña - simplificada
const validatePassword = (password: string): boolean => {
  return password.length >= 6; // Solo verificamos longitud mínima
};

type Language = 'es' | 'en' | 'de';

const translations = {
  es: {
    welcomeBack: "Bienvenido de nuevo",
    loginToContinue: "Inicia sesión para continuar con tu experiencia",
    email: "Correo electrónico",
    password: "Contraseña",
    login: "Iniciar sesión",
    loggingIn: "Iniciando sesión...",
    rememberMe: "Recordarme",
    forgotPassword: "¿Olvidaste tu contraseña?",
    invalidEmail: "Introduce un formato de email válido",
    invalidPassword: "Introduce una contraseña válida",
    continueWith: "O continúa con",
    verifyingSession: "Verificando sesión",
    pleaseWait: "Por favor espera...",
    sessionDetected: "Sesión detectada",
    redirecting: "Redirigiendo...",
    noAccount: "¿No tienes una cuenta?",
    signUp: "Regístrate",
    backToHome: "Volver al inicio",
    continueWithGoogle: "Continuar con Google",
    emailConfirmed: "¡Tu email ha sido confirmado! Por favor, inicia sesión.",
    popupBlocked: "La ventana popup no se pudo abrir. Por favor, inténtalo más tarde.",
    googleLoginError: "Error al iniciar sesión con Google. Por favor, inténtalo más tarde.",
    forgotPasswordTitle: "Recuperar contraseña",
    forgotPasswordDesc: "Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.",
    send: "Enviar enlace",
    sending: "Enviando...",
    forgotPasswordSuccess: "Se ha enviado un enlace a tu correo electrónico para restablecer tu contraseña.",
    cancel: "Cancelar",
    emailRequired: "El correo electrónico es requerido",
    close: "Cerrar",
    backToLogin: "Volver al inicio de sesión",
    resetEmailSent: "Enlace enviado",
    checkEmail: "Revisa tu correo electrónico para continuar con el proceso de restablecimiento de contraseña.",
    redirectingIn: "Redirigiendo en {seconds} segundos",
    resetEmailError: "Error al enviar el correo de restablecimiento. Por favor, inténtalo de nuevo.",
    goDashboard: "Ir al dashboard",
    loginSuccess: "¡Inicio de sesión exitoso!",
    preparingDashboard: "Preparando tu dashboard...",
    welcomeUser: "¡Bienvenido(a) a Mulfex Trader!"
  },
  en: {
    welcomeBack: "Welcome back",
    loginToContinue: "Log in to continue your experience",
    email: "Email",
    password: "Password",
    login: "Log in",
    loggingIn: "Logging in...",
    rememberMe: "Remember me",
    forgotPassword: "Forgot your password?",
    invalidEmail: "Please enter a valid email format",
    invalidPassword: "Please enter a valid password",
    continueWith: "Or continue with",
    verifyingSession: "Verifying session",
    pleaseWait: "Please wait...",
    sessionDetected: "Session detected",
    redirecting: "Redirecting...",
    noAccount: "Don't have an account?",
    signUp: "Sign up",
    backToHome: "Back to home",
    continueWithGoogle: "Continue with Google",
    emailConfirmed: "Your email has been confirmed! Please log in.",
    popupBlocked: "The popup window could not be opened. Please try again later.",
    googleLoginError: "Error logging in with Google. Please try again later.",
    forgotPasswordTitle: "Reset Password",
    forgotPasswordDesc: "Enter your email and we'll send you a link to reset your password.",
    send: "Send link",
    sending: "Sending...",
    forgotPasswordSuccess: "Password reset link has been sent to your email.",
    cancel: "Cancel",
    emailRequired: "Email is required",
    close: "Close",
    backToLogin: "Back to login",
    resetEmailSent: "Link sent",
    checkEmail: "Check your email for further instructions to reset your password.",
    redirectingIn: "Redirecting in {seconds} seconds",
    resetEmailError: "Error sending reset email. Please try again.",
    goDashboard: "Go to dashboard",
    loginSuccess: "Login successful!",
    preparingDashboard: "Preparing your dashboard...",
    welcomeUser: "Welcome to Mulfex Trader!"
  },
  de: {
    welcomeBack: "Willkommen zurück",
    loginToContinue: "Melden Sie sich an, um fortzufahren",
    email: "E-Mail",
    password: "Passwort",
    login: "Anmelden",
    loggingIn: "Anmeldung...",
    rememberMe: "Angemeldet bleiben",
    forgotPassword: "Passwort vergessen?",
    invalidEmail: "Bitte geben Sie ein gültiges E-Mail-Format ein",
    invalidPassword: "Bitte geben Sie ein gültiges Passwort ein",
    continueWith: "Oder weiter mit",
    verifyingSession: "Sitzung wird überprüft",
    pleaseWait: "Bitte warten...",
    sessionDetected: "Sitzung erkannt",
    redirecting: "Weiterleitung...",
    noAccount: "Noch kein Konto?",
    signUp: "Registrieren",
    backToHome: "Zurück zur Startseite",
    continueWithGoogle: "Weiter mit Google",
    emailConfirmed: "Ihre E-Mail wurde bestätigt! Bitte melden Sie sich an.",
    popupBlocked: "Die Popup-Fenster konnte nicht geöffnet werden. Bitte versuchen Sie es später erneut.",
    googleLoginError: "Fehler beim Anmelden mit Google. Bitte versuchen Sie es später erneut.",
    forgotPasswordTitle: "Passwort zurücksetzen",
    forgotPasswordDesc: "Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.",
    send: "Link senden",
    sending: "Senden...",
    forgotPasswordSuccess: "Ein Link zum Zurücksetzen des Passworts wurde an Ihre E-Mail gesendet.",
    cancel: "Abbrechen",
    emailRequired: "E-Mail ist erforderlich",
    close: "Schließen",
    backToLogin: "Zurück zur Anmeldung",
    resetEmailSent: "Link gesendet",
    checkEmail: "Überprüfen Sie Ihre E-Mail für weitere Anweisungen zum Zurücksetzen Ihres Passworts.",
    redirectingIn: "Weiterleitung in {seconds} Sekunden",
    resetEmailError: "Fehler beim Senden der Reset-E-Mail. Bitte versuchen Sie es erneut.",
    goDashboard: "Zum Dashboard",
    loginSuccess: "Anmeldung erfolgreich!",
    preparingDashboard: "Dashboard wird vorbereitet...",
    welcomeUser: "Willkommen bei Mulfex Trader!"
  }
};

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isExistingSession, setIsExistingSession] = useState(false);
  const router = useRouter();
  const [errors, setErrors] = useState<ValidationErrors>({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [language, setLanguage] = useState<Language>('en');
  const searchParams = useSearchParams();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showCountdown, setShowCountdown] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  useEffect(() => {
    // Cargar el idioma guardado o usar español por defecto
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
    if (savedLanguage && ['es', 'en', 'de'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }

    // Rellena los campos de correo electrónico y contraseña si hay datos almacenados
    const storedEmail = localStorage.getItem("email");
    const storedPassword = localStorage.getItem("password");
    if (storedEmail && storedPassword) {
      setEmail(storedEmail);
      setPassword(storedPassword);
      setRememberMe(true);
    }

    setIsCheckingSession(false);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession();
        if (session) {
          setIsExistingSession(true);
          setRedirectCountdown(5);
          
          const timer = setInterval(() => {
            setRedirectCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  // Efecto separado para la redirección cuando el contador llega a cero
  useEffect(() => {
    if (redirectCountdown === 0 && (isExistingSession || success)) {
      // Usamos un timeout para asegurar que la redirección ocurra después del renderizado
      const redirectTimeout = setTimeout(() => {
        router.push("/dashboard");
      }, 100);
      
      return () => clearTimeout(redirectTimeout);
    }
  }, [redirectCountdown, isExistingSession, success, router]);

  useEffect(() => {
    // Mostrar mensaje si el usuario viene de confirmar su email
    const fromConfirmation = searchParams.get('fromConfirmation');
    if (fromConfirmation === 'true') {
      toast.success(translations[language].emailConfirmed);
    }
  }, [searchParams, language]);

  // Obtener las traducciones para el idioma actual
  const t = translations[language];

  // Validación en tiempo real del email
  useEffect(() => {
    if (touched.email) {
      if (!email || !isValidEmail(email)) {
        setErrors(prev => ({ ...prev, email: "Introduce un formato de email válido" }));
      } else {
        setErrors(prev => ({ ...prev, email: "" }));
      }
    }
  }, [email, touched.email]);

  // Validación en tiempo real de la contraseña
  useEffect(() => {
    if (touched.password) {
      if (!password || !validatePassword(password)) {
        setErrors(prev => ({ ...prev, password: "Introduce una contraseña válida" }));
      } else {
        setErrors(prev => ({ ...prev, password: "" }));
      }
    }
  }, [password, touched.password]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showCountdown && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (showCountdown && countdown === 0) {
      setShowForgotPassword(false);
      setShowCountdown(false);
      setCountdown(5);
    }
    return () => clearTimeout(timer);
  }, [countdown, showCountdown]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!isValidEmail(email)) {
      setErrors(prev => ({ ...prev, email: t.invalidEmail }));
      return;
    }

    if (!password) {
      setErrors(prev => ({ ...prev, password: t.invalidPassword }));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await signInWithEmail(email, password);
      
      if (response?.session) {
        if (rememberMe) {
          localStorage.setItem("email", email);
          localStorage.setItem("password", password);
        } else {
          localStorage.removeItem("email");
          localStorage.removeItem("password");
        }

        setSuccess(true);
        toast.success('¡Inicio de sesión exitoso!');
        
        setRedirectCountdown(5);
        
        const timer = setInterval(() => {
          setRedirectCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        throw new Error("No se pudo iniciar sesión");
      }
    } catch (error: any) {
      setError(error.message || "Error al iniciar sesión. Por favor, verifica tus credenciales.");
      toast.error(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error, url } = await signInWithGoogle();
      
      if (error || !url) {
        console.error('Error al obtener URL de autenticación:', error);
        toast.error(t.googleLoginError);
        return;
      }

      // Calcular dimensiones y posición del popup
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2.5;

      // Abrir el popup con la URL de autenticación
      const popup = window.open(
        url,
        'Google Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        toast.error(t.popupBlocked);
        return;
      }

      // Escuchar cambios en la sesión
      const checkSession = setInterval(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            clearInterval(checkSession);
            if (!popup.closed) {
              popup.close();
            }
            window.location.href = '/dashboard';
          }
        } catch (err) {
          console.error('Error al verificar sesión:', err);
        }
      }, 1000);

      // Limpiar el intervalo después de 2 minutos
      setTimeout(() => {
        clearInterval(checkSession);
        if (!popup.closed) {
          popup.close();
        }
        toast.error(t.googleLoginError);
      }, 120000);

    } catch (error) {
      console.error('Error en handleGoogleLogin:', error);
      toast.error(t.googleLoginError);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success(t.resetEmailSent);
      setShowCountdown(true);
    } catch (error) {
      console.error('Error:', error);
      toast.error(t.resetEmailError);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cambiar al formulario de login
  const showLoginForm = () => {
    setShowForgotPassword(false);
    setShowCountdown(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fondo azul que ocupará toda la pantalla */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-600/30 backdrop-blur-sm"></div>
        
        {/* Elementos decorativos flotantes con efecto de cristal */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-4 top-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute -left-4 top-3/4 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute right-1/4 bottom-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Sección izquierda - Decorativa (visible solo en pantallas grandes) */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          <div className="relative w-full flex flex-col items-center justify-center p-8 text-white">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center relative z-10"
            >
              <h3 className="text-3xl font-bold mb-4 [text-shadow:0_2px_10px_rgba(0,0,0,0.1)]">
                Mulfex Trader
              </h3>
              <p className="text-lg mb-6 text-blue-50">
                La plataforma más avanzada para trading profesional
              </p>
              
              <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl p-4 hover:from-white/15 hover:to-white/10 transition-all duration-300 border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(0,0,0,0.15)]"
                >
                  <div className="text-3xl mb-2">📊</div>
                  <h4 className="text-lg font-semibold mb-1">Análisis Avanzado</h4>
                  <p className="text-sm text-gray-200">Herramientas potentes para tomar mejores decisiones</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl p-4 hover:from-white/15 hover:to-white/10 transition-all duration-300 border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(0,0,0,0.15)]"
                >
                  <div className="text-3xl mb-2">⚡</div>
                  <h4 className="text-lg font-semibold mb-1">Tiempo Real</h4>
                  <p className="text-sm text-gray-200">Datos y alertas instantáneas del mercado</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl p-4 hover:from-white/15 hover:to-white/10 transition-all duration-300 border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(0,0,0,0.15)]"
                >
                  <div className="text-3xl mb-2">🛡️</div>
                  <h4 className="text-lg font-semibold mb-1">Seguridad Total</h4>
                  <p className="text-sm text-gray-200">Tu inversión protegida en todo momento</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl p-4 hover:from-white/15 hover:to-white/10 transition-all duration-300 border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(0,0,0,0.15)]"
                >
                  <div className="text-3xl mb-2">🎯</div>
                  <h4 className="text-lg font-semibold mb-1">Soporte 24/7</h4>
                  <p className="text-sm text-gray-200">Estamos aquí para ayudarte siempre</p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mt-6 bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.1)]"
              >
                <div className="flex items-center justify-center space-x-3">
                  <div className="flex -space-x-2">
                    <img className="w-8 h-8 rounded-full border-2 border-cyan-200 shadow-lg" src="https://randomuser.me/api/portraits/men/1.jpg" alt="Usuario" />
                    <img className="w-8 h-8 rounded-full border-2 border-cyan-200 shadow-lg" src="https://randomuser.me/api/portraits/women/2.jpg" alt="Usuario" />
                    <img className="w-8 h-8 rounded-full border-2 border-cyan-200 shadow-lg" src="https://randomuser.me/api/portraits/men/3.jpg" alt="Usuario" />
                  </div>
                  <p className="text-sm text-blue-50 [text-shadow:0_1px_2px_rgba(0,0,0,0.1)]">
                    Más de 10,000 traders confían en nosotros
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Sección derecha - Login o Forgot Password */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-white dark:bg-gray-900 p-8 relative rounded-tl-[40px] rounded-bl-[40px]">
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/25 bg-[size:20px_20px] opacity-[0.05] rounded-tl-[40px] rounded-bl-[40px]"></div>

          <AnimatePresence mode="wait">
            <motion.div
              key={showForgotPassword ? "forgot-container" : "login-container"}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md flex flex-col relative z-10"
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <h2 className="text-center text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600">
                  {showForgotPassword ? t.forgotPasswordTitle : t.welcomeBack}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                  {showForgotPassword ? t.forgotPasswordDesc : t.loginToContinue}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-8 px-4 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 sm:px-10">
                  <AnimatePresence mode="wait">
                    {isCheckingSession ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 200,
                            damping: 20,
                            delay: 0.1 
                          }}
                          className="mx-auto mb-4"
                        >
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full blur-xl opacity-50"></div>
                            <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
                              <Loader2 className="w-10 h-10 text-white animate-spin" />
                            </div>
                          </div>
                        </motion.div>
                        <motion.h3 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 mb-2"
                        >
                            {t.verifyingSession}
                        </motion.h3>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-center space-y-4"
                        >
                          <p className="text-base text-gray-600 dark:text-gray-400">
                              {t.pleaseWait}
                          </p>
                          <div className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                              {t.redirectingIn.replace('{seconds}', redirectCountdown.toString())} 
                            </p>
                            <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 5, ease: "linear" }}
                                className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                              />
                            </div>
                            <button
                              onClick={() => router.push("/dashboard")}
                              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-cyan-500/25"
                            >
                              {t.goDashboard}
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    ) : isExistingSession ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 200,
                            damping: 20,
                            delay: 0.1 
                          }}
                          className="mx-auto mb-4"
                        >
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full blur-xl opacity-50"></div>
                            <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
                              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        </motion.div>
                        <motion.h3 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 mb-2"
                        >
                            {t.loginSuccess}
                        </motion.h3>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-center space-y-4"
                        >
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mb-2"
                          >
                            <h4 className="text-xl font-medium text-gray-700 dark:text-gray-300">
                              {t.welcomeUser}
                            </h4>
                            <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
                              {t.preparingDashboard}
                            </p>
                          </motion.div>
                          <div className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                              {t.redirectingIn.replace('{seconds}', redirectCountdown.toString())} 
                            </p>
                            <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 5, ease: "linear" }}
                                className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                              />
                            </div>
                            <button
                              onClick={() => router.push("/dashboard")}
                              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-cyan-500/25"
                            >
                              {t.goDashboard}
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    ) : success ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 200,
                            damping: 20,
                            delay: 0.1 
                          }}
                          className="mx-auto mb-4"
                        >
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full blur-xl opacity-50"></div>
                            <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
                              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        </motion.div>
                        <motion.h3 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 mb-2"
                        >
                            {t.loginSuccess}
                        </motion.h3>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-center space-y-4"
                        >
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mb-2"
                          >
                            <h4 className="text-xl font-medium text-gray-700 dark:text-gray-300">
                              {t.welcomeUser}
                            </h4>
                            <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
                              {t.preparingDashboard}
                            </p>
                          </motion.div>
                          <div className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                              {t.redirectingIn.replace('{seconds}', redirectCountdown.toString())} 
                            </p>
                            <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 5, ease: "linear" }}
                                className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                              />
                            </div>
                            <button
                              onClick={() => router.push("/dashboard")}
                              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-cyan-500/25"
                            >
                              {t.goDashboard}
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={showForgotPassword ? "forgot" : "login"}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {showForgotPassword ? (
                          showCountdown ? (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3 }}
                              className="flex flex-col items-center"
                            >
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ 
                                  type: "spring",
                                  stiffness: 200,
                                  damping: 20,
                                  delay: 0.1 
                                }}
                                className="mx-auto mb-4"
                              >
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full blur-xl opacity-50"></div>
                                  <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
                                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                </div>
                              </motion.div>
                              <motion.h3 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 mb-2"
                              >
                                {t.resetEmailSent}
                              </motion.h3>
                              <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-base text-gray-600 dark:text-gray-400 text-center mb-4"
                              >
                                {t.checkEmail}
                              </motion.p>
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="w-full space-y-4"
                              >
                                <p className="text-sm text-gray-500 dark:text-gray-500">
                                  {t.redirectingIn.replace('{seconds}', redirectCountdown.toString())}
                                </p>
                                <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 5, ease: "linear" }}
                                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                                  />
                                </div>
                                <button
                                  onClick={showLoginForm}
                                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-cyan-500/25"
                                >
                                  {t.backToLogin}
                                </button>
                              </motion.div>
                            </motion.div>
                          ) : (
                            <motion.form 
                              className="space-y-6" 
                              onSubmit={handleForgotPassword}
                              noValidate
                            >
                              <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t.email} <span className="text-rose-500">*</span>
                                </label>
                                <div className="mt-1 relative">
                                  <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`appearance-none block w-full px-3 py-2 border ${
                                      errors.email && touched.email ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                                    } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm dark:bg-gray-700 dark:text-white`}
                                    placeholder="usuario@example.com"
                                  />
                                  {errors.email && touched.email && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
                                    >
                                      <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                                    </motion.div>
                                  )}
                                </div>
                                {errors.email && touched.email && (
                                  <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-xs text-red-600 dark:text-red-500 mt-1"
                                  >
                                    {t.invalidEmail}
                                  </motion.p>
                                )}
                              </div>

                              <div className="flex flex-col space-y-3">
                                <button
                                  type="submit"
                                  disabled={isLoading}
                                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02]"
                                >
                                  {isLoading ? (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    t.send
                                  )}
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={showLoginForm}
                                  className="w-full flex justify-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transform transition-all duration-200 hover:scale-[1.02]"
                                >
                                  {t.backToLogin}
                                </button>
                              </div>
                            </motion.form>
                          )
                        ) : (
                          <motion.form 
                            className="space-y-6" 
                            onSubmit={handleSubmit}
                            noValidate
                          >
                            <div>
                              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t.email}
                              </label>
                              <div className="mt-1 relative">
                                <input
                                  id="email"
                                  name="email"
                                  type="email"
                                  autoComplete="email"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                                  className={`appearance-none block w-full px-3 py-2 border ${
                                    errors.email && touched.email ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm dark:bg-gray-700 dark:text-white`}
                                />
                                <AnimatePresence>
                                  {errors.email && touched.email && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
                                    >
                                      <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                              <AnimatePresence>
                                {errors.email && touched.email && (
                                  <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-xs text-red-600 dark:text-red-500 mt-1"
                                  >
                                      {t.invalidEmail}
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            </div>

                            <div>
                              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t.password}
                              </label>
                              <div className="mt-1 relative">
                                <input
                                  id="password"
                                  name="password"
                                  type={showPassword ? "text" : "password"}
                                  autoComplete="current-password"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                                  className={`appearance-none block w-full px-3 py-2 border ${
                                    errors.password && touched.password ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm dark:bg-gray-700 dark:text-white`}
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
                              </div>
                              <AnimatePresence>
                                {touched.password && errors.password && (
                                  <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-xs text-red-600 dark:text-red-500 mt-1"
                                  >
                                      {t.invalidPassword}
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="relative flex items-center">
                                  <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 transition-colors duration-200 ease-in-out cursor-pointer"
                                  />
                                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 select-none cursor-pointer">
                                      {t.rememberMe}
                                  </label>
                                </div>
                              </div>

                              <div className="text-sm">
                                <button
                                  type="button"
                                  onClick={() => setShowForgotPassword(true)}
                                  className="font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
                                >
                                    {t.forgotPassword}
                                </button>
                              </div>
                            </div>

                            {error && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-lg bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800"
                              >
                                <div className="flex">
                                  <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300" />
                                  <div className="ml-3">
                                    <p className="text-sm text-red-500 dark:text-red-200">{error}</p>
                                  </div>
                                </div>
                              </motion.div>
                            )}

                            <div>
                              <button
                                type="submit"
                                disabled={isLoading || (touched.email && touched.password && (!!errors.email || !!errors.password))}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02]"
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                      {t.loggingIn}
                                  </>
                                ) : (
                                    t.login
                                )}
                              </button>
                            </div>
                          </motion.form>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {(!success && !showForgotPassword) && (
                    <>
                      <div className="mt-8">
                        <div className="flex items-center justify-center gap-4 my-6">
                          <div className="w-16 h-px bg-gray-300 dark:bg-gray-600"></div>
                          <span className="uppercase text-xs tracking-wider font-medium text-gray-500 dark:text-gray-400">
                            {t.continueWith}
                          </span>
                          <div className="w-16 h-px bg-gray-300 dark:bg-gray-600"></div>
                        </div>

                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="flex items-center justify-center w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl dark:shadow-gray-900/30 transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed gap-3"
                          >
                            <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                              {t.continueWithGoogle}
                            </span>
                          </button>
                        </div>

                        <div className="mt-6">
                          <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t.noAccount}{" "}
                                <Link
                                  href="/signup"
                                  className="font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
                                >
                                    {t.signUp}
                                </Link>
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

              {/* Botón para volver al inicio */}
              {!success && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mt-4 flex justify-start"
                >
                  <a
                    href="/"
                    className="group w-2/5 flex items-center justify-center px-4 py-2 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 hover:shadow-xl"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5 text-cyan-500 dark:text-cyan-400 transition-transform duration-300 group-hover:-translate-x-1" />
                    <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500">
                      {t.backToHome}
                    </span>
                  </a>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}