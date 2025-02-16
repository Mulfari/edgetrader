"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { LogOut, DollarSign, TrendingUp, TrendingDown, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { SubAccounts } from "@/app/SubAccounts/page"
import { Operations } from "@/app/operations/page"

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

// Sample data (you might want to move this to a separate file or fetch from an API)
const sampleSubAccounts: SubAccount[] = [
  // ... (keep the sample data as is)
]

const sampleTrades: Trade[] = [
  // ... (keep the sample data as is)
]

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const router = useRouter()

  const fetchData = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => {
      setSubAccounts(sampleSubAccounts)
      setTrades(sampleTrades)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogout = () => {
    router.push("/login")
  }

  const totalBalance = subAccounts.reduce((sum, account) => sum + account.balance, 0)
  const totalPerformance =
    subAccounts.length > 0 ? subAccounts.reduce((sum, account) => sum + account.performance, 0) / subAccounts.length : 0

  const openTrades = trades.filter((trade) => trade.status === "open")
  const closedTrades = trades.filter((trade) => trade.status === "closed")

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:justify-start md:space-x-10">
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Financiero</h1>
            </div>
            <div className="flex items-center justify-end md:flex-1 lg:w-0">
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="ml-8">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBalance.toFixed(2)} USDT</div>
                <p className="text-xs text-muted-foreground">{subAccounts.length} subcuentas activas</p>
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Operaciones Abiertas</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openTrades.length}</div>
                <p className="text-xs text-muted-foreground">Operaciones activas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Operaciones Cerradas</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{closedTrades.length}</div>
                <p className="text-xs text-muted-foreground">Operaciones finalizadas</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="accounts" className="space-y-4">
            <TabsList>
              <TabsTrigger value="accounts">Subcuentas</TabsTrigger>
              <TabsTrigger value="trades">Operaciones</TabsTrigger>
            </TabsList>
            <TabsContent value="accounts">
              <SubAccounts subAccounts={subAccounts} isLoading={isLoading} fetchData={fetchData} />
            </TabsContent>
            <TabsContent value="trades">
              <Operations trades={trades} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

