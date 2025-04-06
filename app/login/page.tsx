"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, AlertCircle, Loader2, Github, Twitter } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/FirebaseAuthContext";

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

// Función para validar contraseña
const validatePassword = (password: string): boolean => {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
};

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
  }
};

type Language = 'es' | 'en' | 'de';

const translations = {
  es: {
    welcomeBack: "Bienvenido de nuevo",
    loginToContinue: "Inicia sesión para continuar con tu experiencia",
    email: "Correo electrónico",
    password: "Contraseña",
    invalidEmail: "Introduce un formato de email válido",
    invalidPassword: "Introduce una contraseña válida",
    rememberMe: "Recordarme",
    forgotPassword: "¿Olvidaste tu contraseña?",
    login: "Iniciar sesión",
    loggingIn: "Iniciando sesión...",
    continueWith: "O continúa con",
    noAccount: "¿No tienes una cuenta?",
    signUp: "Regístrate",
    backToHome: "Volver al inicio",
    connectionError: "Error de conexión con el servidor.",
    invalidCredentials: "Credenciales incorrectas.",
    sessionDetected: "¡Sesión activa detectada!",
    redirecting: "Te estamos redirigiendo al dashboard...",
    verifyingSession: "Verificando sesión...",
    pleaseWait: "Por favor, espera un momento"
  },
  en: {
    welcomeBack: "Welcome back",
    loginToContinue: "Log in to continue your experience",
    email: "Email",
    password: "Password",
    invalidEmail: "Please enter a valid email format",
    invalidPassword: "Please enter a valid password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot your password?",
    login: "Log in",
    loggingIn: "Logging in...",
    continueWith: "Or continue with",
    noAccount: "Don't have an account?",
    signUp: "Sign up",
    backToHome: "Back to home",
    connectionError: "Server connection error.",
    invalidCredentials: "Invalid credentials.",
    sessionDetected: "Active session detected!",
    redirecting: "Redirecting you to dashboard...",
    verifyingSession: "Verifying session...",
    pleaseWait: "Please wait a moment"
  },
  de: {
    welcomeBack: "Willkommen zurück",
    loginToContinue: "Melden Sie sich an, um Ihr Erlebnis fortzusetzen",
    email: "E-Mail",
    password: "Passwort",
    invalidEmail: "Bitte geben Sie ein gültiges E-Mail-Format ein",
    invalidPassword: "Bitte geben Sie ein gültiges Passwort ein",
    rememberMe: "Angemeldet bleiben",
    forgotPassword: "Passwort vergessen?",
    login: "Anmelden",
    loggingIn: "Anmeldung läuft...",
    continueWith: "Oder fortfahren mit",
    noAccount: "Noch kein Konto?",
    signUp: "Registrieren",
    backToHome: "Zurück zur Startseite",
    connectionError: "Verbindungsfehler zum Server.",
    invalidCredentials: "Ungültige Anmeldedaten.",
    sessionDetected: "Aktive Sitzung erkannt!",
    redirecting: "Sie werden zum Dashboard weitergeleitet...",
    verifyingSession: "Sitzung wird überprüft...",
    pleaseWait: "Bitte warten Sie einen Moment"
  }
};

export default function LoginPage() {
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
  const { loginWithEmail, loginWithGoogle, error: authError } = useAuth();

  useEffect(() => {
    // Cargar el idioma guardado o usar inglés por defecto
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
    if (savedLanguage && ['es', 'en', 'de'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }

    // Verificar si ya hay una sesión activa
    const token = safeLocalStorage.getItem("token");
    if (token) {
      setIsExistingSession(true);
    }
    setIsCheckingSession(false);

    // Rellena los campos de correo electrónico y contraseña si hay datos almacenados
    const storedEmail = safeLocalStorage.getItem("email");
    const storedPassword = safeLocalStorage.getItem("password");
    if (storedEmail && storedPassword) {
      setEmail(storedEmail);
      setPassword(storedPassword);
      setRememberMe(true);
    }
  }, []);

  // Obtener las traducciones para el idioma actual
  const t = translations[language];

  // Efecto para la redirección cuando se detecta una sesión activa
  useEffect(() => {
    if (!isCheckingSession && isExistingSession) {
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  }, [isCheckingSession, isExistingSession, router]);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!isValidEmail(email)) {
      setErrors(prev => ({ ...prev, email: "Introduce un formato de email válido" }));
      return;
    }

    if (!validatePassword(password)) {
      setErrors(prev => ({ ...prev, password: "Introduce una contraseña válida" }));
      return;
    }

    if (errors.email || errors.password) {
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const data = await loginWithEmail(email, password);
      
      if (rememberMe) {
        safeLocalStorage.setItem("email", email);
        safeLocalStorage.setItem("password", password);
      } else {
        safeLocalStorage.removeItem("email");
        safeLocalStorage.removeItem("password");
      }
      
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (error: any) {
      setError(error.message || "Error de autenticación");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await loginWithGoogle();
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (error: any) {
      setError(error.message || "Error al iniciar sesión con Google");
    } finally {
      setIsLoading(false);
    }
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

      {/* Contenedor flex para las dos secciones principales */}
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
                Trading Dashboard Pro
              </h3>
              <p className="text-lg mb-6 text-blue-50">
                La plataforma más avanzada para el trading profesional
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

      {/* Sección derecha - Login */}
        <div className="w-full lg:w-1/2 bg-white dark:bg-gray-900 flex flex-col justify-center px-6 lg:px-12 h-screen relative rounded-tl-[40px] rounded-bl-[40px]">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/25 bg-[size:20px_20px] opacity-[0.05]"></div>

        <div className="flex flex-col justify-between h-full py-8 relative">
          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="sm:mx-auto sm:w-full sm:max-w-md mb-6"
            >
              <h2 className="text-center text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600">
                  {t.welcomeBack}
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                  {t.loginToContinue}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="sm:mx-auto sm:w-full sm:max-w-md"
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
                        className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mb-4"
                      >
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </motion.div>
                      <motion.h3 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
                      >
                          {t.verifyingSession}
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-600 dark:text-gray-300"
                      >
                          {t.pleaseWait}
                      </motion.p>
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
                        className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-4"
                      >
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                      <motion.h3 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
                      >
                          {t.sessionDetected}
                      </motion.h3>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-center space-y-4"
                      >
                        <p className="text-gray-600 dark:text-gray-300">
                            {t.redirecting}
                        </p>
                        <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                          />
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
                        className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-4"
                      >
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                      <motion.h3 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
                      >
                          {t.sessionDetected}
                      </motion.h3>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-center space-y-4"
                      >
                        <p className="text-gray-600 dark:text-gray-300">
                            {t.redirecting}
                        </p>
                        <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                          />
                        </div>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.form 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
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
                          <Link
                            href="#"
                            className="font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
                          >
                              {t.forgotPassword}
                          </Link>
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
                </AnimatePresence>

                {!success && (
                  <>
                    <div className="mt-8">
                      <div className="flex items-center justify-center gap-4 my-6">
                        <div className="w-16 h-px bg-gray-300 dark:bg-gray-600"></div>
                        <span className="uppercase text-xs tracking-wider font-medium text-gray-500 dark:text-gray-400">
                          {t.continueWith}
                        </span>
                        <div className="w-16 h-px bg-gray-300 dark:bg-gray-600"></div>
                      </div>

                      <div className="flex justify-center space-x-6">
                        <button
                          type="button"
                          onClick={handleGoogleLogin}
                          aria-label="Iniciar sesión con Google"
                          className="flex items-center justify-center w-14 h-14 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl dark:shadow-gray-900/30 transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:transform hover:scale-105"
                        >
                          <svg className="w-7 h-7" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          aria-label="Iniciar sesión con Apple"
                          className="flex items-center justify-center w-14 h-14 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl dark:shadow-gray-900/30 transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:transform hover:scale-105"
                        >
                          <svg className="w-7 h-7" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.05 20.28c-.98.95-2.05.86-3.08.38-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.39C2.79 15.15 3.51 6.15 8.66 5.86c1.55-.08 2.5.86 3.56.92 1.08-.13 2.1-1.1 3.56-.9 1.63.25 2.92 1.17 3.69 2.9-3.45 2.08-2.72 6.75.57 8.16-.65 1.55-1.43 3.09-2.99 4.34M12.03 5.17C11.88 3.83 12.88 2.7 13.88 2c1.18.96 1.95 2.06 1.81 3.46-1.18.06-2.44-.95-3.66-.29" fill="#000000" className="dark:fill-white" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          aria-label="Iniciar sesión con Telegram"
                          className="flex items-center justify-center w-14 h-14 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl dark:shadow-gray-900/30 transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:transform hover:scale-105"
                        >
                          <svg className="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M9.78,18.65L10.06,14.42L17.74,7.5C18.08,7.19 17.67,7.04 17.22,7.31L7.74,13.3L3.64,12C2.76,11.75 2.75,11.14 3.84,10.7L19.81,4.54C20.54,4.21 21.24,4.72 20.96,5.84L18.24,18.65C18.05,19.56 17.5,19.78 16.74,19.36L12.6,16.3L10.61,18.23C10.38,18.46 10.19,18.65 9.78,18.65Z" fill="#229ED9" />
                          </svg>
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
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="sm:mx-auto sm:w-full sm:max-w-md mt-4"
          >
              <a
              href="/"
              className="group flex items-center justify-center px-4 py-2 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              <ArrowLeft className="mr-2 h-5 w-5 text-cyan-500 dark:text-cyan-400 transition-transform duration-300 group-hover:-translate-x-1" />
              <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500">
                  {t.backToHome}
              </span>
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}