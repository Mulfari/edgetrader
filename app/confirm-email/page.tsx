"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Link } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { verifyTokenUsage, checkTokenExpiration } from '@/lib/tokenVerification';
import { toast } from 'react-hot-toast';

type Language = 'es' | 'en' | 'de';

const translations = {
  es: {
    emailConfirmed: "¡Email Confirmado!",
    emailVerified: "Tu email ha sido verificado exitosamente.",
    redirectingIn: "Redirigiendo a la página de inicio de sesión en",
    seconds: "segundos...",
    clickHere: "Click aquí si no eres redirigido automáticamente",
    tradingPlatform: "Plataforma de Trading",
    intelligentSecure: "Inteligente y Segura",
    manageTrades: "Gestiona tus operaciones de trading con tecnología avanzada y seguridad de primer nivel.",
    advancedTech: "Tecnología Avanzada",
    activeUsers: "Usuarios Activos",
    operations: "Operaciones",
    availability: "Disponibilidad",
    invalidLink: "Enlace inválido",
    linkAlreadyUsed: "Este enlace ya ha sido utilizado o ha expirado.",
    backToLogin: "Volver a Iniciar Sesión",
    linkExpired: "Este enlace ha expirado (válido por 24 horas)."
  },
  en: {
    emailConfirmed: "Email Confirmed!",
    emailVerified: "Your email has been successfully verified.",
    redirectingIn: "Redirecting to login page in",
    seconds: "seconds...",
    clickHere: "Click here if you are not automatically redirected",
    tradingPlatform: "Trading Platform",
    intelligentSecure: "Intelligent and Secure",
    manageTrades: "Manage your trading operations with advanced technology and top-level security.",
    advancedTech: "Advanced Technology",
    activeUsers: "Active Users",
    operations: "Operations",
    availability: "Availability",
    invalidLink: "Invalid Link",
    linkAlreadyUsed: "This link has already been used or has expired.",
    backToLogin: "Back to Login",
    linkExpired: "This link has expired (valid for 24 hours)."
  },
  de: {
    emailConfirmed: "E-Mail bestätigt!",
    emailVerified: "Ihre E-Mail wurde erfolgreich verifiziert.",
    redirectingIn: "Weiterleitung zur Anmeldeseite in",
    seconds: "Sekunden...",
    clickHere: "Klicken Sie hier, wenn Sie nicht automatisch weitergeleitet werden",
    tradingPlatform: "Trading-Plattform",
    intelligentSecure: "Intelligent und Sicher",
    manageTrades: "Verwalten Sie Ihre Trading-Operationen mit fortschrittlicher Technologie und höchster Sicherheit.",
    advancedTech: "Fortschrittliche Technologie",
    activeUsers: "Aktive Nutzer",
    operations: "Operationen",
    availability: "Verfügbarkeit",
    invalidLink: "Ungültige Verknüpfung",
    linkAlreadyUsed: "Dieser Link wurde bereits verwendet oder abgelaufen.",
    backToLogin: "Zurück zur Anmeldung",
    linkExpired: "Dieser Link ist abgelaufen (gültig für 24 Stunden)."
  }
};

function ConfirmEmailContent() {
  const [countdown, setCountdown] = useState(5);
  const [language, setLanguage] = useState<Language>('es');
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Intentar obtener el idioma guardado
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
    if (savedLanguage && ['es', 'en', 'de'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }

    // Verificar si el token ya ha sido utilizado o ha expirado
    const verifyToken = async () => {
      try {
        setIsLoading(true);
        
        // Obtener el token de la URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (!accessToken) {
          setIsTokenValid(false);
          toast.error(translations[language].invalidLink);
          return;
        }
        
        // Verificar si el token ya ha sido utilizado
        const { used, error } = await verifyTokenUsage(accessToken, 'confirm-email');
        
        if (error) {
          console.error('Error al verificar el token:', error);
          setIsTokenValid(false);
          toast.error(translations[language].invalidLink);
          return;
        }
        
        if (used) {
          setIsTokenValid(false);
          toast.error(translations[language].linkAlreadyUsed);
          return;
        }
        
        // Verificar si el token ha expirado
        const { expired, error: expirationError } = await checkTokenExpiration(accessToken, 'confirm-email');
        
        if (expirationError) {
          console.error('Error al verificar la expiración del token:', expirationError);
          setIsTokenValid(false);
          toast.error(translations[language].invalidLink);
          return;
        }
        
        if (expired) {
          setIsTokenValid(false);
          toast.error(translations[language].linkExpired);
          return;
        }
        
        // Si el token es válido, establecer la sesión
        const { data: { session }, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: '',
        });
        
        if (sessionError) {
          console.error('Error al establecer la sesión:', sessionError);
          setIsTokenValid(false);
          toast.error(translations[language].invalidLink);
          return;
        }
        
        // Si todo está bien, marcar como válido y comenzar la cuenta regresiva
        setIsTokenValid(true);
        setShouldRedirect(true);
        
        // Limpiar tokens de la URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Error al verificar el token:', error);
        setIsTokenValid(false);
        toast.error(translations[language].invalidLink);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [language]);

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/login?fromConfirmation=true');
    }
  }, [shouldRedirect, router]);

  useEffect(() => {
    if (!isLoading && isTokenValid) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShouldRedirect(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isLoading, isTokenValid]);

  const handleManualRedirect = () => {
    setShouldRedirect(true);
  };

  const t = translations[language];

  // Si está cargando, mostrar un spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50/50 via-white/50 to-zinc-100/50 dark:from-[#0A0A0F] dark:via-[#12121A] dark:to-[#0A0A0F]">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  // Si el token no es válido, mostrar un mensaje de error
  if (!isTokenValid) {
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
                    <span className="font-bold text-xl">MT</span>
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

          {/* Sección derecha - Contenido de error */}
          <div className="w-full lg:w-1/2 bg-white dark:bg-gray-900 flex items-center justify-center p-8 relative rounded-tl-[40px] rounded-bl-[40px]">
            {/* Elementos decorativos de fondo */}
            <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/25 bg-[size:20px_20px] opacity-[0.05] rounded-tl-[40px] rounded-bl-[40px]"></div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md space-y-8 relative"
            >
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="mx-auto"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full blur-xl opacity-50"></div>
                    <div className="relative bg-gradient-to-br from-rose-500 to-pink-600 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
                      <AlertCircle className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </motion.div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-600">
                    {t.invalidLink}
                  </h2>
                  
                  <p className="text-base text-gray-600 dark:text-gray-400">
                    {t.linkAlreadyUsed || 'Este enlace ya ha sido utilizado o ha expirado.'}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <Link
                    href="/login"
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-cyan-500/25"
                  >
                    {t.backToLogin}
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

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
                  <span className="font-bold text-xl">MT</span>
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

        {/* Sección derecha - Contenido de confirmación */}
        <div className="w-full lg:w-1/2 bg-white dark:bg-gray-900 flex items-center justify-center p-8 relative rounded-tl-[40px] rounded-bl-[40px]">
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/25 bg-[size:20px_20px] opacity-[0.05] rounded-tl-[40px] rounded-bl-[40px]"></div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md space-y-8 relative"
          >
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="mx-auto"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full blur-xl opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                </div>
              </motion.div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
                  {t.emailConfirmed}
                </h2>
                
                <p className="text-base text-gray-600 dark:text-gray-400">
                  {t.emailVerified}
                </p>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {t.redirectingIn} {countdown} {t.seconds}
                </p>

                <button
                  onClick={handleManualRedirect}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-cyan-500/25"
                >
                  {t.clickHere}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50/50 via-white/50 to-zinc-100/50 dark:from-[#0A0A0F] dark:via-[#12121A] dark:to-[#0A0A0F]">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
} 