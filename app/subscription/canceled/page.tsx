'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Home } from "lucide-react";
import Link from 'next/link';

export default function SubscriptionCanceled() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <Card className="max-w-md mx-auto w-full border-red-500/30 bg-red-500/[0.02]">
        <CardHeader className="text-center">
          <div className="mx-auto bg-red-100 dark:bg-red-900/50 rounded-full p-2.5 w-fit mb-4">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-semibold text-red-700 dark:text-red-300">Pago Cancelado</CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400">
            Parece que has cancelado el proceso de pago.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-700 dark:text-gray-300 mb-8">
            No te preocupes, tu suscripción no ha sido activada. Puedes volver a intentarlo cuando quieras o regresar al panel principal.
          </p>
          <div className="space-y-3">
            <Button 
              asChild
              className="w-full bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600"
            >
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Volver al Dashboard
              </Link>
            </Button>
            <Link href="/support" className="block text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              ¿Necesitas ayuda? Contacta a soporte
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 