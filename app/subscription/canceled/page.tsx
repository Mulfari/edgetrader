'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import Link from 'next/link';

export default function SubscriptionCanceled() {
  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card className="p-8 text-center">
        <div className="flex justify-center mb-6">
          <XCircle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Suscripción Cancelada</h1>
        <p className="text-gray-600 mb-8">
          Has cancelado el proceso de suscripción. Si tuviste algún problema o necesitas ayuda, no dudes en contactarnos.
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