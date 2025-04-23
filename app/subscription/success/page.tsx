'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from 'next/link';

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Asegurarnos de que searchParams existe
    if (!searchParams) {
      setIsLoading(false);
      return;
    }

    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Aquí podrías verificar el estado de la sesión si lo necesitas
      setIsLoading(false);
    } else {
      // Si no hay sessionId, también deberíamos dejar de cargar
      setIsLoading(false);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si no hay sessionId, mostramos un mensaje diferente
  const sessionId = searchParams?.get('session_id');
  if (!sessionId) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="h-16 w-16 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Estado de Suscripción</h1>
          <p className="text-gray-600 mb-8">
            No se pudo verificar el estado de tu suscripción. Por favor, contacta con soporte si crees que esto es un error.
          </p>
          <div className="space-y-4">
            <Link href="/subscription">
              <Button className="w-full">
                Volver a Planes
              </Button>
            </Link>
            <Link href="/support" className="block text-sm text-gray-500 hover:text-gray-700">
              ¿Necesitas ayuda? Contacta a soporte
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card className="p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-4">¡Pago Exitoso!</h1>
        <p className="text-gray-600 mb-8">
          Tu suscripción ha sido activada correctamente. Ahora tienes acceso a todas las funcionalidades premium.
        </p>
        <div className="space-y-4">
          <Link href="/dashboard">
            <Button className="w-full">
              Ir al Dashboard
            </Button>
          </Link>
          <Link href="/support" className="block text-sm text-gray-500 hover:text-gray-700">
            ¿Necesitas ayuda? Contacta a soporte
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function SubscriptionSuccess() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  );
} 