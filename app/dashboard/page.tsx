"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut, TrendingUp, RefreshCw, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import SubAccounts from "@/components/SubAccounts"

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [totalBalance, setTotalBalance] = useState<number>(0)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const router = useRouter()

  useEffect(() => {
    setIsLoading(false)
  }, [])

  // Función para actualizar el balance total
  const updateTotalBalance = (balance: number) => {
    setTotalBalance(balance)
    setLastUpdate(new Date())
  }

  const handleLogout = () => {
    router.push("/login")
  }

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

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Última Actualización</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lastUpdate.toLocaleTimeString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Auto-refresh cada 5 minutos</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="accounts" className="space-y-4">
              <TabsList>
                <TabsTrigger value="accounts">Subcuentas</TabsTrigger>
                <TabsTrigger value="trades">Operaciones</TabsTrigger>
              </TabsList>

              <TabsContent value="accounts">
                <SubAccounts/>
              </TabsContent>

              <TabsContent value="trades">
                <Card>
                  <CardHeader>
                    <CardTitle>Operaciones</CardTitle>
                    <CardDescription>Historial de operaciones y estadísticas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center py-8">Próximamente: Historial de operaciones</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  )
}

