"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentService } from "@/lib/services/payment.service";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

const plans = [
  {
    id: "price_monthly",
    name: "Premium Mensual",
    price: "29.99",
    period: "mes",
    description: "Acceso completo a todas las funcionalidades",
    features: [
      "Señales en tiempo real",
      "Análisis técnico avanzado",
      "Soporte prioritario 24/7",
      "API personalizada",
      "Herramientas exclusivas",
      "Sin compromiso anual"
    ]
  },
  {
    id: "price_annual",
    name: "Premium Anual",
    price: "299.90",
    period: "año",
    description: "2 meses gratis pagando anualmente",
    features: [
      "Todas las características del plan mensual",
      "2 meses gratis ($59.98 de ahorro)",
      "Precio bloqueado por 1 año",
      "Acceso prioritario a nuevas funciones",
      "Consultoría personalizada mensual",
      "Descuentos exclusivos en eventos"
    ]
  }
];

export default function SubscriptionPlans() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('none');

  const checkSubscriptionStatus = async () => {
    try {
      const status = await PaymentService.getSubscriptionStatus();
      setSubscriptionStatus(status.status);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const handleSubscribe = async (planId: string) => {
    try {
      // Si ya tiene una suscripción activa, mostrar mensaje
      if (subscriptionStatus === 'SUBSCRIBED') {
        toast.error('Ya tienes una suscripción activa. Por favor, cancela la suscripción actual antes de crear una nueva.');
        return;
      }

      setIsLoading(true);
      setError(null);

      // Obtener el email del usuario desde el contexto de autenticación
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('No se encontró el email del usuario');
      }

      // Crear la sesión de checkout
      const { url } = await PaymentService.createCheckoutSession(
        planId,
        user.email
      );

      if (!url) {
        throw new Error('No se pudo crear la sesión de checkout');
      }

      // Redirigir a la página de checkout de Stripe
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

  // Renderizar mensaje si ya tiene suscripción activa
  if (subscriptionStatus === 'SUBSCRIBED') {
    return (
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Suscripción Activa</h2>
        <p className="text-gray-600 mb-4">Ya tienes una suscripción premium activa.</p>
        <Button
          variant="outline"
          onClick={() => window.location.href = '/dashboard'}
        >
          Ir al Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4">Plan Premium</h2>
        <p className="text-gray-600">Elige la periodicidad que mejor se adapte a ti</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-baseline justify-center">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-gray-600 ml-2">/{plan.period}</span>
              </CardTitle>
              <CardDescription className="text-center">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full py-6 text-lg"
                onClick={() => handleSubscribe(plan.id)}
                disabled={isLoading}
              >
                {isLoading ? 'Procesando...' : 'Suscribirse'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md text-center">
          {error}
        </div>
      )}
    </div>
  );
} 