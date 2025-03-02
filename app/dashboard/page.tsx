"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, TrendingUp, Wallet, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import SubAccounts from "@/components/SubAccounts";
import Operations from "@/components/Operations";
import SubAccountManager from "@/components/SubAccountManager";

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const router = useRouter();

  // Ejemplo de operaciones
  const [trades] = useState<Trade[]>([
    {
      id: "1",
      userId: "user1",
      pair: "BTC/USDT",
      type: "buy",
      entryPrice: 45000,
      amount: 0.1,
      status: "open",
      openDate: new Date().toISOString(),
      market: "spot",
    },
    {
      id: "2",
      userId: "user1",
      pair: "ETH/USDT",
      type: "sell",
      entryPrice: 3000,
      exitPrice: 3200,
      amount: 1,
      status: "closed",
      openDate: "2024-02-20T10:00:00Z",
      closeDate: "2024-02-21T15:30:00Z",
      pnl: 200,
      market: "futures",
      leverage: 10,
      stopLoss: 2900,
      takeProfit: 3300,
    },
    {
      id: "3",
      userId: "user1",
      pair: "SOL/USDT",
      type: "buy",
      entryPrice: 120,
      amount: 10,
      status: "open",
      openDate: "2024-02-22T08:15:00Z",
      market: "spot",
    },
    {
      id: "4",
      userId: "user1",
      pair: "BNB/USDT",
      type: "sell",
      entryPrice: 350,
      exitPrice: 340,
      amount: 2,
      status: "closed",
      openDate: "2024-02-19T14:20:00Z",
      closeDate: "2024-02-20T09:45:00Z",
      pnl: -20,
      market: "futures",
      leverage: 5,
      stopLoss: 360,
      takeProfit: 330,
    }
  ]);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Función para actualizar el balance total
  const updateTotalBalance = (balance: number) => {
    setTotalBalance(balance);
  };

  const handleLogout = () => {
    router.push("/login");
  };

  const handleSubAccountSuccess = () => {
    // Actualizar la lista de subcuentas
    const subAccountsComponent = document.getElementById('subaccounts-component');
    if (subAccountsComponent) {
      // Forzar actualización del componente SubAccounts
      subAccountsComponent.dispatchEvent(new Event('refresh'));
    }
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
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Gestión de Subcuentas</h2>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsDeleteModalOpen(true)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Eliminar Subcuentas
                    </Button>
                    <Button 
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Subcuenta
                    </Button>
                  </div>
                </div>
                <div id="subaccounts-component">
                  <SubAccounts onBalanceUpdate={updateTotalBalance} />
                </div>
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

      {/* Modales para gestión de subcuentas */}
      <SubAccountManager 
        mode="create" 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleSubAccountSuccess}
      />
      
      <SubAccountManager 
        mode="delete" 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleSubAccountSuccess}
      />
    </div>
  );
}