"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import SubAccounts from "@/components/SubAccounts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function Dashboard() {
  const [subAccounts, setSubAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalPerformance, setTotalPerformance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ✅ Obtener subcuentas y balances
  const fetchSubAccounts = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error al obtener subcuentas");

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("Respuesta inesperada del servidor");
      }

      // 🔹 Obtener balances de cada subcuenta
      const subAccountsWithBalance = await Promise.all(
        data.map(async (sub) => {
          try {
            const balanceRes = await fetch(`${API_URL}/account-details/${sub.userId}`, {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            });

            if (!balanceRes.ok) throw new Error("Error al obtener balance");

            const balanceData = await balanceRes.json();
            return { ...sub, balance: balanceData.balance ?? 0 };
          } catch (error) {
            console.error(`❌ Error obteniendo balance de ${sub.name}:`, error);
            return { ...sub, balance: 0 };
          }
        })
      );

      // 🔹 Calcular total balance y performance
      const totalBalance = subAccountsWithBalance.reduce((sum, acc) => sum + acc.balance, 0);
      const totalPerformance =
        subAccountsWithBalance.length > 0
          ? subAccountsWithBalance.reduce((sum, acc) => sum + (acc.performance || 0), 0) / subAccountsWithBalance.length
          : 0;

      setTotalBalance(totalBalance);
      setTotalPerformance(totalPerformance);
    } catch (error) {
      console.error("❌ Error obteniendo subcuentas:", error);
      setError("No se pudieron cargar las subcuentas");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSubAccounts();
  }, [fetchSubAccounts]);

  // ✅ Manejo de Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
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
          <p className="text-center">Cargando datos...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <>
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
          </>
        )}
      </main>
    </div>
  );
}
