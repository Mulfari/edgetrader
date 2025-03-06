"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export default function WalletPage() {
  return (
    <div className="container mx-auto p-6">
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-blue-200 dark:border-blue-800">
        <CardContent className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 rounded-full blur-2xl"></div>
            <Wallet className="w-24 h-24 text-blue-600 dark:text-blue-400 relative z-10 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-blue-900 dark:text-blue-100 mb-4">
            Billetera
          </h1>
          <p className="text-xl text-blue-700 dark:text-blue-300 mb-6">
            ¡Próximamente!
          </p>
          <p className="text-blue-600 dark:text-blue-400 max-w-md">
            Estamos trabajando en nuevas características para tu billetera. 
            Pronto podrás gestionar tus activos de manera más eficiente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 