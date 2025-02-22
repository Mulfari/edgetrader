"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, DollarSign, TrendingUp } from "lucide-react"; // 🔹 Eliminé TrendingDown
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setIsLoading(false); // Simulación de carga
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
        {isLoading ? ( // 🔹 Mostrar indicador de carga si es necesario
          <p className="text-center text-muted-foreground">Cargando datos...</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">- USDT</div>
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
              <TabsContent value="accounts">
                {/* Aquí puedes incluir la lista de subcuentas */}
              </TabsContent>
              <TabsContent value="trades">
                {/* Aquí puedes incluir la lista de operaciones */}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
