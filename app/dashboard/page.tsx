"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import SubAccounts from "@/components/SubAccounts";

interface SubAccount {
  balance: number;
  performance: number;
}

export default function Dashboard() {
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [totalPerformance, setTotalPerformance] = useState<number>(0);
  const router = useRouter();

  const fetchGlobalData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token no encontrado, inicia sesión nuevamente");
      }

      const response = await fetch("/api/subaccounts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data: SubAccount[] = (await response.json()) || [];

      const balance = data.reduce((sum: number, account: SubAccount) => sum + (account.balance || 0), 0);
      const performance =
        data.length > 0 ? data.reduce((sum: number, account: SubAccount) => sum + (account.performance || 0), 0) / data.length : 0;

      setTotalBalance(balance);
      setTotalPerformance(performance);
    } catch (error) {
      console.error("Error al obtener datos:", error);
    }
  };

  useEffect(() => {
    fetchGlobalData();
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBalance.toFixed(2)} USDT</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rendimiento Promedio</CardTitle>
              {totalPerformance >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalPerformance >= 0 ? "text-green-500" : "text-red-500"}`}>
                {totalPerformance.toFixed(2)}%
              </div>
              <Progress value={Math.abs(totalPerformance) * 10} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="accounts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="accounts">Subcuentas</TabsTrigger>
            <TabsTrigger value="trades">Operaciones</TabsTrigger>
          </TabsList>
          <TabsContent value="accounts">
            <SubAccounts />
          </TabsContent>
          <TabsContent value="trades"></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
