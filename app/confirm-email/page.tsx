"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import Link from "next/link";
import { supabase } from '@/lib/supabase';

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
    availability: "Disponibilidad"
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
    availability: "Availability"
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
    availability: "Verfügbarkeit"
  }
};

function ConfirmEmailContent() {
  const [countdown, setCountdown] = useState(5);
  const [language, setLanguage] = useState<Language>('es');
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const router = useRouter();

  // Función para limpiar sesión completamente
  const clearSession = async () => {
    try {
      // Cerrar sesión en todos los dispositivos
      await supabase.auth.signOut({ scope: 'global' });
      
      // Limpiar todo el almacenamiento relacionado con la autenticación
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('supabase.auth.token');
        
        // Buscar y eliminar todas las claves relacionadas con auth de Supabase
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase.auth') || key.includes('token')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  // Ejecutar limpieza de sesión inmediatamente
  if (typeof window !== 'undefined') {
    // Esta línea ejecuta la limpieza de la sesión antes de que se monte el componente
    // Cerramos la sesión en todos los dispositivos
    supabase.auth.signOut({ scope: 'global' }).catch(error => 
      console.error('Error al limpiar sesión inicial:', error)
    );
    
    // Limpiar todo el almacenamiento relacionado con la autenticación
    localStorage.removeItem('token');
    localStorage.removeItem('supabase.auth.token');
    
    // Buscar y eliminar todas las claves relacionadas con auth
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase.auth') || key.includes('token')) {
        localStorage.removeItem(key);
      }
    });
  }

  useEffect(() => {
    // Intentar obtener el idioma guardado
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
    if (savedLanguage && ['es', 'en', 'de'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }

    // Asegurarnos de que no hay sesión activa 
    clearSession();
  }, []);

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/login?fromConfirmation=true');
    }
  }, [shouldRedirect, router]);

  useEffect(() => {
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
  }, []);

  const handleManualRedirect = () => {
    setShouldRedirect(true);
  };

  const t = translations[language];

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