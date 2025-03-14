"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, AlertCircle, Loader2, Github, Twitter } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

  useEffect(() => {
    // Verificar si ya hay una sesión activa
    const token = safeLocalStorage.getItem("token");
    if (token) {
      setIsExistingSession(true);
    }
    setIsCheckingSession(false);

    // Rellena los campos de correo electrónico y contraseña si hay datos almacenados en localStorage
    const storedEmail = safeLocalStorage.getItem("email");
    const storedPassword = safeLocalStorage.getItem("password");
    if (storedEmail && storedPassword) {
      setEmail(storedEmail);
      setPassword(storedPassword);
      setRememberMe(true);
    }
  }, []);

  // Efecto para la redirección cuando se detecta una sesión activa
  useEffect(() => {
    if (!isCheckingSession && isExistingSession) {
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  }, [isCheckingSession, isExistingSession, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        safeLocalStorage.setItem("token", data.access_token);
        
        // Mostrar información completa de la respuesta en la consola
        console.log("✅ Respuesta completa del login:", data);
        
        // Mostrar específicamente la información de posiciones perpetual
        if (data.perpetualPositions) {
          console.log("📊 Posiciones perpetual:", data.perpetualPositions);
          console.log(`📈 Total de posiciones abiertas: ${data.perpetualPositions.totalPositions}`);
          console.log(`📈 - En cuentas demo: ${data.perpetualPositions.totalDemoPositions}`);
          console.log(`📈 - En cuentas reales: ${data.perpetualPositions.totalRealPositions}`);
          
          // Separar subcuentas demo y reales para mejor visualización
          const demoSubaccounts = data.perpetualPositions.subaccountsWithPositions.filter((s: any) => s.isDemo);
          const realSubaccounts = data.perpetualPositions.subaccountsWithPositions.filter((s: any) => !s.isDemo);
          
          // Mostrar desglose por subcuenta demo
          if (demoSubaccounts.length > 0) {
            console.log("📋 Subcuentas DEMO con posiciones abiertas:");
            demoSubaccounts.forEach((subaccount: any) => {
              console.log(`   - ${subaccount.name}: ${subaccount.openPositionsCount} posiciones abiertas`);
            });
          } else {
            console.log("📋 No hay subcuentas DEMO con posiciones abiertas");
          }
          
          // Mostrar desglose por subcuenta real
          if (realSubaccounts.length > 0) {
            console.log("📋 Subcuentas REALES con posiciones abiertas:");
            realSubaccounts.forEach((subaccount: any) => {
              console.log(`   - ${subaccount.name}: ${subaccount.openPositionsCount} posiciones abiertas`);
            });
          } else {
            console.log("📋 No hay subcuentas REALES con posiciones abiertas");
          }
          
          // Guardar información de posiciones perpetual en localStorage
          const perpetualPositionsCache = {
            data: data.perpetualPositions,
            timestamp: Date.now(),
            demoSubaccounts: demoSubaccounts,
            realSubaccounts: realSubaccounts
          };
          safeLocalStorage.setItem("perpetual_positions_cache", JSON.stringify(perpetualPositionsCache));
          console.log("✅ Información de posiciones perpetual guardada en caché");
          
          // Guardar información de posiciones por subcuenta individualmente
          data.perpetualPositions.subaccountsWithPositions.forEach((subaccount: any) => {
            const subaccountPositionsData = {
              data: {
                id: subaccount.id,
                name: subaccount.name,
                isDemo: subaccount.isDemo,
                openPositionsCount: subaccount.openPositionsCount
              },
              timestamp: Date.now()
            };
            
            // Guardar en localStorage con un prefijo para identificar fácilmente
            const CACHE_PREFIX = subaccount.isDemo ? 'subaccount_positions_demo_' : 'subaccount_positions_real_';
            safeLocalStorage.setItem(`${CACHE_PREFIX}${subaccount.id}`, JSON.stringify(subaccountPositionsData));
            console.log(`✅ Posiciones guardadas en caché para subcuenta ${subaccount.name} (${subaccount.isDemo ? 'DEMO' : 'REAL'})`);
          });
          
          // Guardar resúmenes separados para cuentas demo y reales
          safeLocalStorage.setItem("perpetual_positions_demo", JSON.stringify({
            data: {
              totalPositions: data.perpetualPositions.totalDemoPositions,
              subaccounts: demoSubaccounts
            },
            timestamp: Date.now()
          }));
          
          safeLocalStorage.setItem("perpetual_positions_real", JSON.stringify({
            data: {
              totalPositions: data.perpetualPositions.totalRealPositions,
              subaccounts: realSubaccounts
            },
            timestamp: Date.now()
          }));
          
          console.log("✅ Información separada de posiciones demo y reales guardada en caché");
        } else {
          console.log("❌ No se recibió información de posiciones perpetual en la respuesta");
        }
        
        // Guardar información del usuario si está disponible
        if (data.user) {
          safeLocalStorage.setItem("user", JSON.stringify(data.user));
        }
        
        // Guardar subcuentas en caché si están disponibles
        if (data.subAccounts) {
          // Guardar todas las subcuentas en el caché principal
          const cacheData = {
            data: data.subAccounts,
            timestamp: Date.now()
          };
          safeLocalStorage.setItem("subaccounts_cache", JSON.stringify(cacheData));
          console.log("✅ Subcuentas guardadas en caché durante el login:", data.subAccounts.length);
          
          // Guardar los balances de cada subcuenta individualmente
          data.subAccounts.forEach((subAccount: any) => {
            if (subAccount.balance !== undefined || subAccount.assets) {
              const balanceData = {
                data: {
                  balance: subAccount.balance || 0,
                  assets: subAccount.assets || [],
                  performance: subAccount.performance || 0,
                  lastUpdate: subAccount.lastUpdate || Date.now(),
                  accountName: subAccount.name
                },
                timestamp: Date.now(),
                accountName: subAccount.name
              };
              
              // Guardar en el formato que espera el componente SubAccounts
              const CACHE_PREFIX = 'subaccount_balance_';
              safeLocalStorage.setItem(`${CACHE_PREFIX}${subAccount.id}`, JSON.stringify(balanceData));
              console.log(`✅ Balance guardado en caché para subcuenta ${subAccount.name}`);
            }
          });
        }
        
        if (rememberMe) {
          safeLocalStorage.setItem("email", email);
          safeLocalStorage.setItem("password", password);
        } else {
          safeLocalStorage.removeItem("email");
          safeLocalStorage.removeItem("password");
        }
        setSuccess(true);
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setError(data.message || "Credenciales incorrectas.");
      }
    } catch (error) {
      console.error("Error en login:", error);
      setError("Error de conexión con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-center">
          <div className="bg-gradient-to-r from-violet-500 to-indigo-500 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-500">
          Bienvenido de nuevo
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Inicia sesión para continuar con tu experiencia
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-gray-200 dark:border-gray-700">
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
                  className="w-16 h-16 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full flex items-center justify-center mb-4"
                >
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </motion.div>
                <motion.h3 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
                >
                  Verificando sesión...
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600 dark:text-gray-300"
                >
                  Por favor, espera un momento
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
                  ¡Sesión activa detectada!
                </motion.h3>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center space-y-4"
                >
                  <p className="text-gray-600 dark:text-gray-300">
                    Te estamos redirigiendo al dashboard...
                  </p>
                  <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-violet-500 to-indigo-500"
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
                  ¡Inicio de sesión exitoso!
                </motion.h3>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center space-y-4"
                >
                  <p className="text-gray-600 dark:text-gray-300">
                    Te estamos redirigiendo al dashboard...
                  </p>
                  <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-violet-500 to-indigo-500"
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
              >
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contraseña
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-600"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                      Recordarme
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link
                      href="#"
                      className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      ¿Olvidaste tu contraseña?
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
                    disabled={isLoading}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                        Iniciando sesión...
                      </>
                    ) : (
                      "Iniciar sesión"
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {!success && (
            <>
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      O continúa con
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-all duration-200 hover:scale-[1.02]"
                  >
                    <Github className="w-5 h-5" />
                    <span className="ml-2">GitHub</span>
                  </button>

                  <button
                    type="button"
                    className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-all duration-200 hover:scale-[1.02]"
                  >
                    <Twitter className="w-5 h-5" />
                    <span className="ml-2">Twitter</span>
                  </button>
                </div>

                <div className="mt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ¿No tienes una cuenta?{" "}
                      <Link
                        href="/signup"
                        className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Regístrate
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <Link
          href="/"
          className="flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio
        </Link>
      </motion.div>
    </div>
  );
}