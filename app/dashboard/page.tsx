"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import SubAccounts from "@/components/SubAccounts";
import Operations from "@/components/Operations";

// Definir el tipo de operación
interface Trade {
  id: string;
  userId: string;
  pair: string;
  type: "buy" | "sell";
  entryPrice: number;
  exitPrice?: number;
  amount: number;
  status: "open" | "closed";
  openDate: string;
  closeDate?: string;
  pnl?: number;
  market: "spot" | "futures";
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [trades, setTrades] = useState<Trade[]>([]);
  const router = useRouter();

  // Función para obtener las operaciones de la API
  const fetchTrades = async (userId: string, subAccountId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/account-details/${userId}/${subAccountId}/trades`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener operaciones');
      }

      const data = await response.json();
      setTrades(data);
    } catch (error) {
      console.error('Error al obtener operaciones:', error);
    }
  };

  // Función para actualizar el balance total y obtener operaciones
  const updateTotalBalance = (balance: number, subAccountId: string) => {
    setTotalBalance(balance);
    // Obtener operaciones cuando se selecciona una subcuenta
    if (subAccountId) {
      fetchTrades("user1", subAccountId); // Reemplazar "user1" con el ID real del usuario
    }
  };

  useEffect(() => {
    setIsLoading(false);
  }, []);

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
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalBalance.toFixed(2)} USDT</div>
                  <p className="text-xs text-muted-foreground mt-1">Balance agregado de todas las cuentas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rendimiento Promedio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">- %</div>
                  <Progress value={0} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="accounts" className="space-y-4">
              <TabsList>
                <TabsTrigger value="accounts">Subcuentas</TabsTrigger>
                <TabsTrigger value="trades">Operaciones</TabsTrigger>
              </TabsList>

              <TabsContent value="accounts" className="space-y-4">
                <SubAccounts onBalanceUpdate={updateTotalBalance} />
              </TabsContent>

              <TabsContent value="trades" className="space-y-4">
                <div className="bg-card rounded-lg">
                  <Operations trades={trades} />
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}