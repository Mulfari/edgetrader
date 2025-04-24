"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentService } from "@/lib/services/payment.service";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Check, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const plans = [
  {
    id: "price_monthly",
    name: "Premium Mensual",
    price: "29.99",
    period: "mes",
    billedText: "Facturado mensualmente",
    description: "Acceso completo a todas las funcionalidades premium para potenciar tus operaciones.",
    features: [
      "Señales en tiempo real",
      "Análisis técnico avanzado",
      "Soporte prioritario 24/7",
      "API personalizada",
      "Herramientas exclusivas",
      "Sin compromiso anual"
    ],
    saveText: null
  },
  {
    id: "price_annual",
    name: "Premium Anual",
    price: "299.90",
    period: "año",
    billedText: "Facturado anualmente ($24.99/mes)",
    description: "Obtén 2 meses gratis y asegura tu precio por todo el año.",
    features: [
      "Todas las características del plan mensual",
      "2 meses gratis (ahorro de $59.98)",
      "Precio bloqueado por 1 año",
      "Acceso prioritario a nuevas funciones",
      "Consultoría personalizada mensual",
      "Descuentos exclusivos en eventos"
    ],
    saveText: "Ahorra 16%"
  }
];

export default function SubscriptionPlans() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('checking');
  const [annualBilling, setAnnualBilling] = useState(false);

  const checkSubscriptionStatus = async () => {
    try {
      const status = await PaymentService.getSubscriptionStatus();
      setSubscriptionStatus(status.status || 'none');
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setSubscriptionStatus('none');
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const handleSubscribe = async () => {
    const planId = annualBilling ? plans[1].id : plans[0].id;
    try {
      if (subscriptionStatus === 'SUBSCRIBED') {
        toast.error('Ya tienes una suscripción activa.');
        return;
      }

      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('No se encontró el email del usuario');
      }

      const { url } = await PaymentService.createCheckoutSession(planId, user.email);

      if (!url) {
        throw new Error('No se pudo crear la sesión de checkout');
      }

      window.location.href = url;
      
    } catch (err) {
      console.error('Error creating checkout session:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar la suscripción';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (subscriptionStatus === 'checking') {
    return (
      <div className="text-center p-10">
        <p className="text-gray-500 dark:text-gray-400">Verificando estado de suscripción...</p>
      </div>
    );
  }

  if (subscriptionStatus === 'SUBSCRIBED') {
    return (
      <Card className="max-w-2xl mx-auto border-green-500/30 bg-green-500/[0.02]">
        <CardHeader className="text-center">
          <div className="mx-auto bg-green-100 dark:bg-green-900/50 rounded-full p-2 w-fit mb-3">
            <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-semibold text-green-700 dark:text-green-300">Suscripción Activa</CardTitle>
          <CardDescription className="text-green-600 dark:text-green-400">
            ¡Gracias por ser miembro Premium!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Disfruta de todas las ventajas y herramientas exclusivas para llevar tu trading al siguiente nivel.
          </p>
          <Button
            variant="outline"
            className="border-green-500/50 text-green-600 hover:bg-green-500/10 dark:border-green-600/50 dark:text-green-400 dark:hover:bg-green-500/10"
            onClick={() => { /* TODO: Añadir enlace al portal de Stripe o gestión */ }}
          >
            Gestionar Suscripción
          </Button>
        </CardContent>
      </Card>
    );
  }

  const selectedPlan = annualBilling ? plans[1] : plans[0];

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700"
      >
        <div className="p-8 text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-2xl opacity-50"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-2xl opacity-50"></div>
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-white text-xs font-semibold mb-3 backdrop-blur-sm">
              BTRADER PREMIUM
            </span>
            <h3 className="text-3xl font-bold mb-3">Plan Profesional</h3>
            <p className="text-pink-50 max-w-md mx-auto">
              {selectedPlan.description}
            </p>
          </div>
        </div>
        
        <div className="pt-8 pb-6 px-8 flex flex-col items-center bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-center space-x-3 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8 relative">
            <button
              className={`py-2.5 px-6 rounded-lg transition-all duration-300 text-sm sm:text-base ${ 
                annualBilling
                  ? 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-sm'
              }`}
              onClick={() => setAnnualBilling(false)}
            >
              Mensual
            </button>
            <button
              className={`py-2.5 px-6 rounded-lg transition-all duration-300 text-sm sm:text-base ${ 
                annualBilling
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setAnnualBilling(true)}
            >
              Anual
            </button>
            {plans[1].saveText && (
              <div className="absolute -top-3 right-0 transform translate-x-1/4">
                <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full shadow-sm">
                  {plans[1].saveText}
                </span>
              </div>
            )}
          </div>
          
          <div className="text-center mb-8">
            <div className="flex items-center justify-center">
              <span className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mr-1.5">
                ${selectedPlan.price}
              </span>
              <div className="text-left">
                <span className="text-gray-500 dark:text-gray-400 text-lg sm:text-xl">
                  /{selectedPlan.period}
                </span>
                {selectedPlan.billedText && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {selectedPlan.billedText}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <Button
            className="w-full max-w-md py-3.5 px-6 rounded-xl font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-[1.03] text-center shadow-lg hover:shadow-xl mb-2 text-lg"
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : 'Suscribirse ahora'}
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Cancela cuando quieras. Pago seguro con Stripe.
          </p>
        </div>
        
        <div className="p-8 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">
            Todo lo que incluye:
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {selectedPlan.features.map((feature, index) => (
              <li key={index} className="flex items-start text-gray-600 dark:text-gray-300 pb-3">
                <div className="mr-3 mt-0.5 bg-purple-500/10 dark:bg-pink-500/10 rounded-full p-1 flex-shrink-0">
                  <Check className="h-4 w-4 text-purple-500 dark:text-pink-400" />
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {error && (
        <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-center border border-red-500/30 flex items-center justify-center space-x-2">
          <Info className="h-5 w-5 flex-shrink-0"/>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
} 