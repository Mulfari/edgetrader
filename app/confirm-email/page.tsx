"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import Link from "next/link";

function ConfirmEmailContent() {
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/login?fromConfirmation=true');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleManualRedirect = () => {
    router.push('/login?fromConfirmation=true');
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Section - Hero/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-violet-500 to-indigo-500">
        <div className="absolute inset-0 bg-grid-white/[0.2] bg-grid-16" />
        <div className="relative w-full flex flex-col justify-between p-12">
          <div>
            <div className="flex items-center gap-2 text-white">
              <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="font-bold text-xl">TD</span>
              </div>
              <span className="text-lg font-medium">TradingDash</span>
            </div>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white">
              Plataforma de Trading <br />
              Inteligente y Segura
            </h1>
            <p className="text-lg text-white/80">
              Gestiona tus operaciones de trading con tecnología avanzada y seguridad de primer nivel.
            </p>
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/20" />
              <div className="text-white/60 text-sm">Tecnología Avanzada</div>
              <div className="h-px flex-1 bg-white/20" />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="text-white/60 text-sm">Usuarios Activos</h3>
              <p className="text-2xl font-bold text-white">10k+</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-white/60 text-sm">Operaciones</h3>
              <p className="text-2xl font-bold text-white">1M+</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-white/60 text-sm">Disponibilidad</h3>
              <p className="text-2xl font-bold text-white">99.9%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Confirmation Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-zinc-50/50 via-white/50 to-zinc-100/50 dark:from-[#0A0A0F] dark:via-[#12121A] dark:to-[#0A0A0F]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="mx-auto"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full blur-xl opacity-50"></div>
                <div className="relative bg-gradient-to-br from-green-500 to-emerald-500 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
              </div>
            </motion.div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500">
                ¡Email Confirmado!
              </h2>
              
              <p className="text-base text-gray-600 dark:text-gray-400">
                Tu email ha sido verificado exitosamente.
              </p>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Redirigiendo a la página de inicio de sesión en {countdown} segundos...
              </p>

              <button
                onClick={handleManualRedirect}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-violet-500/25"
              >
                Click aquí si no eres redirigido automáticamente
              </button>
            </div>
          </div>
        </motion.div>
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