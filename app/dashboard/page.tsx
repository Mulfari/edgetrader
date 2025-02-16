"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { LogOut, DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import SubAccounts from "@/components/SubAccounts"
import Operations from "@/components/Operations"

interface SubAccount {
  id: string
  userId: string
  name: string
  exchange: string
  balance: number
  lastUpdated: string
  performance: number
}

interface Trade {
  id: string
  userId: string
  pair: string
  type: "buy" | "sell"
  entryPrice: number
  exitPrice?: number
  amount: number
  status: "open" | "closed"
  openDate: string
  closeDate?: string
  pnl?: number
  market: "spot" | "futures"
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [subAccounts, setSubAccounts] = useState<SubAccount[] | null>(null)
  const [trades, setTrades] = useState<Trade[] | null>(null)
  const router = useRouter()

  const fetchData = useCallback(() => {
    setIsLoading(true)
    // Implement your data fetching logic here
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogout = () => {
    router.push("/login")
  }

  const totalBalance = subAccounts ? subAccounts.reduce((sum, account) => sum + account.balance, 0) : 0
  const totalPerformance =
    subAccounts && subAccounts.length > 0
      ? subAccounts.reduce((sum, account) => sum + account.performance, 0) / subAccounts.length
      : 0

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
            <SubAccounts subAccounts={subAccounts || []} isLoading={isLoading} fetchData={fetchData} />
          </TabsContent>
          <TabsContent value="trades">
            <Operations trades={trades || []} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

