"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SubAccounts from "@/components/SubAccounts";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const router = useRouter();

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Función para actualizar el balance total
  const updateTotalBalance = (balance: number) => {
    setTotalBalance(balance);
    setLastUpdate(new Date());
  };

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold">Dashboard Financiero</h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Cargando datos...</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium">Balance Total</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => updateTotalBalance(totalBalance)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Actualizar
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalBalance.toFixed(2)} USDT</div>
                  <p className="text-sm text-muted-foreground">Última actualización: {lastUpdate.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            <SubAccounts onBalanceUpdate={updateTotalBalance} />
          </>
        )}
      </main>
    </div>
  );
}