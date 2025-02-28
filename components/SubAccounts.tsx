"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Search,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Wallet,
  ArrowUpDown,
  Filter,
  TrendingUp,
  BarChart3,
  Coins,
  ExternalLink,
  DollarSign,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface Asset {
  coin: string
  walletBalance: number
  usdValue: number
}

interface SubAccount {
  id: string
  userId: string
  name: string
  exchange: string
  balance?: number
  lastUpdated?: string
  assets?: Asset[]
  performance?: number
}

interface AccountDetailsResponse {
  list: {
    totalEquity: string
    coin: {
      coin: string
      walletBalance: string
      usdValue: string
    }[]
  }[]
}

type SortConfig = {
  key: keyof SubAccount
  direction: "asc" | "desc"
} | null

interface SubAccountsProps {
  onBalanceUpdate?: (totalBalance: number) => void
}

export default function SubAccounts({ onBalanceUpdate }: SubAccountsProps) {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
  const [selectedSubAccountId, setSelectedSubAccountId] = useState<string | null>(null)
  const [accountBalances, setAccountBalances] = useState<Record<string, number | null>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)
  const [selectedExchange, setSelectedExchange] = useState<string>("all")
  const [totalBalance, setTotalBalance] = useState<number>(0)
  const router = useRouter()

  const exchanges = ["all", ...new Set(subAccounts.map((account) => account.exchange))]

  const fetchAccountDetails = useCallback(async (userId: string, subAccountId: string, token: string) => {
    if (!API_URL || !userId || !token) return { balance: null, assets: [] }

    try {
      const res = await fetch(`${API_URL}/account-details/${userId}/${subAccountId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error("Error al obtener detalles de la cuenta")

      const data: AccountDetailsResponse = await res.json()
      console.log("Detalles de la cuenta:", data)
      if (!data || !data.list || data.list.length === 0) {
        console.error("❌ La respuesta de Bybit no contiene 'list' o está vacía:", data)
        return { balance: 0, assets: [], rawData: data }
      }

      return {
        balance: Number.parseFloat(data.list[0]?.totalEquity ?? "0"),
        assets:
          data.list[0]?.coin?.map((coin) => ({
            coin: coin.coin,
            walletBalance: Number.parseFloat(coin.walletBalance) || 0,
            usdValue: Number.parseFloat(coin.usdValue) || 0,
          })) || [],
        rawData: data,
      }
    } catch (error) {
      console.error("❌ Error obteniendo detalles de la cuenta:", error)
      return { balance: null, assets: [] }
    }
  }, [])

  const fetchSubAccounts = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      console.error("❌ No hay token, redirigiendo a login.")
      router.push("/login")
      return
    }

    try {
      setIsLoading(true)
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        if (res.status === 401) {
          console.error("❌ Token inválido, redirigiendo a login.")
          localStorage.removeItem("token")
          router.push("/login")
        }
        throw new Error(`Error al obtener subcuentas - Código ${res.status}`)
      }

      const data = await res.json()
      console.log("Respuesta del backend:", data)
      setSubAccounts(data)

      // Fetch account details for each subaccount
      const balances: Record<string, number | null> = {}
      let totalBalanceSum = 0
      const updatedSubAccounts = await Promise.all(
        data.map(async (sub: SubAccount) => {
          const details = await fetchAccountDetails(sub.userId, sub.id, token)
          balances[sub.id] = details.balance
          sub.assets = details.assets
          sub.performance = Math.random() * 100 // Ejemplo de rendimiento aleatorio
          if (details.balance !== null) {
            totalBalanceSum += details.balance
          }
          return sub
        }),
      )
      setSubAccounts(updatedSubAccounts)
      setAccountBalances(balances)
      setTotalBalance(totalBalanceSum)
      if (onBalanceUpdate) {
        onBalanceUpdate(totalBalanceSum)
      }
    } catch (error) {
      console.error("❌ Error obteniendo subcuentas:", error)
      setError("No se pudieron cargar las subcuentas")
    } finally {
      setIsLoading(false)
    }
  }, [fetchAccountDetails, router, onBalanceUpdate])

  useEffect(() => {
    fetchSubAccounts()
  }, [fetchSubAccounts])

  const handleRowClick = (sub: SubAccount) => {
    if (selectedSubAccountId === sub.id) {
      setSelectedSubAccountId(null)
    } else {
      setSelectedSubAccountId(sub.id)
    }
  }

  const handleSort = (key: keyof SubAccount) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === "asc") {
          return { key, direction: "desc" }
        }
        return null
      }
      return { key, direction: "asc" }
    })
  }

  const sortedAccounts = [...subAccounts].sort((a, b) => {
    if (!sortConfig) return 0

    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (aValue === undefined || bValue === undefined) return 0

    if (sortConfig.direction === "asc") {
      return aValue < bValue ? -1 : 1
    } else {
      return aValue > bValue ? -1 : 1
    }
  })

  const filteredAccounts = sortedAccounts.filter(
    (account) =>
      (selectedExchange === "all" || account.exchange === selectedExchange) &&
      (account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.exchange.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Get top assets across all accounts
  const getTopAssets = () => {
    const allAssets: Record<string, number> = {}
    subAccounts.forEach((account) => {
      account.assets?.forEach((asset) => {
        if (allAssets[asset.coin]) {
          allAssets[asset.coin] += asset.usdValue
        } else {
          allAssets[asset.coin] = asset.usdValue
        }
      })
    })

    return Object.entries(allAssets)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([coin, value]) => ({ coin, value }))
  }

  const topAssets = getTopAssets()

  // Get exchange distribution
  const getExchangeDistribution = () => {
    const distribution: Record<string, number> = {}
    subAccounts.forEach((account) => {
      const balance = accountBalances[account.id] || 0
      if (distribution[account.exchange]) {
        distribution[account.exchange] += balance
      } else {
        distribution[account.exchange] = balance
      }
    })

    return Object.entries(distribution).map(([exchange, balance]) => ({
      exchange,
      balance,
      percentage: totalBalance > 0 ? (balance / totalBalance) * 100 : 0,
    }))
  }

  const exchangeDistribution = getExchangeDistribution()

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Get performance color
  const getPerformanceColor = (performance?: number) => {
    if (performance === undefined) return "text-muted-foreground"
    if (performance > 0) return "text-green-500"
    if (performance < 0) return "text-red-500"
    return "text-muted-foreground"
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Balance Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-primary" />
              <div className="text-2xl font-bold">{totalBalance.toFixed(2)} USDT</div>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">Actualizado {formatDate(new Date().toISOString())}</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subcuentas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-primary" />
              <div className="text-2xl font-bold">{subAccounts.length}</div>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">En {exchanges.length - 1} exchanges diferentes</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rendimiento Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                <div
                  className={`text-2xl font-bold ${getPerformanceColor(
                    subAccounts.reduce((acc, sub) => acc + (sub.performance || 0), 0) / (subAccounts.length || 1),
                  )}`}
                >
                  {(
                    subAccounts.reduce((acc, sub) => acc + (sub.performance || 0), 0) / (subAccounts.length || 1)
                  ).toFixed(2)}
                  %
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">Calculado sobre todas las subcuentas</p>
          </CardFooter>
        </Card>
      </div>

      {/* Main Accounts Card */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Subcuentas</CardTitle>
              <CardDescription>Gestiona y monitorea todas tus cuentas de trading</CardDescription>
            </div>
            <Button
              onClick={fetchSubAccounts}
              variant="outline"
              size="sm"
              className="w-full md:w-auto transition-all hover:bg-primary hover:text-primary-foreground"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 mt-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar subcuentas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-primary/20 focus-visible:ring-primary/30"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto border-primary/20">
                  <Filter className="mr-2 h-4 w-4" />
                  {selectedExchange === "all" ? "Todos los Exchanges" : selectedExchange}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {exchanges.map((exchange) => (
                  <DropdownMenuItem key={exchange} onClick={() => setSelectedExchange(exchange)}>
                    {exchange === "all" ? "Todos los Exchanges" : exchange}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 text-red-600 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead
                    onClick={() => handleSort("name")}
                    className="cursor-pointer hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center">
                      Nombre
                      <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("exchange")}
                    className="cursor-pointer hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center">
                      Exchange
                      <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("balance")}
                    className="cursor-pointer hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center">
                      Balance
                      <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("performance")}
                    className="cursor-pointer hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center">
                      Rendimiento
                      <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-5 w-[150px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-[100px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-[120px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-[200px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-[20px]" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mb-3 text-muted-foreground/50" />
                        <p className="text-sm font-medium mb-2">No se encontraron subcuentas</p>
                        <p className="text-xs text-muted-foreground">
                          Intenta ajustar los filtros o el término de búsqueda
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((sub) => (
                    <>
                      <TableRow
                        key={sub.id}
                        onClick={() => handleRowClick(sub)}
                        className={`cursor-pointer transition-colors hover:bg-muted/30 ${
                          selectedSubAccountId === sub.id ? "bg-muted/20" : ""
                        }`}
                      >
                        <TableCell className="font-medium">{sub.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="uppercase font-semibold bg-primary/5 text-primary border-primary/20"
                          >
                            {sub.exchange}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {accountBalances[sub.id] !== undefined ? (
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-primary" />
                              <span className="font-medium">{accountBalances[sub.id]?.toFixed(2)} USDT</span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {sub.performance !== undefined ? (
                            <div className={`flex items-center gap-2 ${getPerformanceColor(sub.performance)}`}>
                              {sub.performance > 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingUp className="h-4 w-4 transform rotate-180" />
                              )}
                              <span className="font-medium">{sub.performance.toFixed(2)}%</span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${
                              selectedSubAccountId === sub.id ? "rotate-180" : ""
                            }`}
                          />
                        </TableCell>
                      </TableRow>
                      {selectedSubAccountId === sub.id && (
                        <TableRow key={`${sub.id}-details`}>
                          <TableCell colSpan={5} className="p-0">
                            <div className="p-6 bg-muted/10 rounded-lg space-y-6 border-t border-b">
                              <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
                                  <TabsTrigger value="overview" className="flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" />
                                    <span className="hidden sm:inline">Vista General</span>
                                  </TabsTrigger>
                                  <TabsTrigger value="assets" className="flex items-center gap-2">
                                    <Coins className="h-4 w-4" />
                                    <span className="hidden sm:inline">Assets</span>
                                  </TabsTrigger>
                                  <TabsTrigger value="performance" className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="hidden sm:inline">Rendimiento</span>
                                  </TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="mt-6">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card className="bg-card/50">
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                          <Wallet className="h-4 w-4" />
                                          Balance Total
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="text-3xl font-bold">
                                          {accountBalances[sub.id] !== undefined
                                            ? `${accountBalances[sub.id]?.toFixed(2)} USDT`
                                            : "No disponible"}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Última actualización: {formatDate(new Date().toISOString())}
                                        </p>
                                      </CardContent>
                                    </Card>

                                    <Card className="bg-card/50">
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                          <ExternalLink className="h-4 w-4" />
                                          Exchange
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="text-3xl font-bold uppercase">{sub.exchange}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          ID: {sub.id.substring(0, 8)}...
                                        </p>
                                      </CardContent>
                                    </Card>

                                    <Card className="bg-card/50">
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                          <TrendingUp className="h-4 w-4" />
                                          Rendimiento
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className={`text-3xl font-bold ${getPerformanceColor(sub.performance)}`}>
                                          {sub.performance !== undefined
                                            ? `${sub.performance.toFixed(2)}%`
                                            : "No disponible"}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Últimos 30 días</p>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  {/* Top Assets Summary */}
                                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="bg-card/50">
                                      <CardHeader>
                                        <CardTitle className="text-sm font-medium">Top Assets</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-4">
                                          {sub.assets?.slice(0, 3).map((asset) => (
                                            <div key={asset.coin} className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                  <span className="font-bold text-xs text-primary">
                                                    {asset.coin.substring(0, 3)}
                                                  </span>
                                                </div>
                                                <div>
                                                  <p className="font-medium">{asset.coin}</p>
                                                  <p className="text-xs text-muted-foreground">
                                                    {asset.walletBalance} {asset.coin}
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <p className="font-medium">${asset.usdValue.toFixed(2)}</p>
                                                <p className="text-xs text-muted-foreground">
                                                  {((asset.usdValue / (accountBalances[sub.id] || 1)) * 100).toFixed(1)}
                                                  %
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </CardContent>
                                    </Card>

                                    <Card className="bg-card/50">
                                      <CardHeader>
                                        <CardTitle className="text-sm font-medium">Información de la Cuenta</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-4">
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Nombre:</span>
                                            <span className="font-medium">{sub.name}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">ID:</span>
                                            <span className="font-medium">{sub.id}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Usuario ID:</span>
                                            <span className="font-medium">{sub.userId}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Última actualización:</span>
                                            <span className="font-medium">{formatDate(new Date().toISOString())}</span>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </TabsContent>

                                <TabsContent value="assets" className="mt-6">
                                  <div className="space-y-6">
                                    <Card className="bg-card/50">
                                      <CardHeader>
                                        <CardTitle className="text-sm font-medium">Distribución de Assets</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-4">
                                          {sub.assets?.slice(0, 5).map((asset) => {
                                            const percentage = (asset.usdValue / (accountBalances[sub.id] || 1)) * 100
                                            return (
                                              <div key={asset.coin} className="space-y-1">
                                                <div className="flex justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                      <span className="font-bold text-xs text-primary">
                                                        {asset.coin.substring(0, 2)}
                                                      </span>
                                                    </div>
                                                    <span className="font-medium">{asset.coin}</span>
                                                  </div>
                                                  <span className="font-medium">${asset.usdValue.toFixed(2)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <Progress value={percentage} className="h-2" />
                                                  <span className="text-xs text-muted-foreground">
                                                    {percentage.toFixed(1)}%
                                                  </span>
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </CardContent>
                                    </Card>

                                    <div className="mt-6">
                                      <h4 className="font-medium mb-4 flex items-center gap-2">
                                        <Coins className="h-4 w-4" />
                                        Todos los Assets
                                      </h4>
                                      <div className="rounded-lg border overflow-hidden">
                                        <Table>
                                          <TableHeader className="bg-muted/50">
                                            <TableRow>
                                              <TableHead>Token</TableHead>
                                              <TableHead>Balance</TableHead>
                                              <TableHead>Valor USD</TableHead>
                                              <TableHead>% del Total</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {sub.assets?.length === 0 ? (
                                              <TableRow>
                                                <TableCell
                                                  colSpan={4}
                                                  className="text-center py-6 text-muted-foreground"
                                                >
                                                  No hay assets disponibles
                                                </TableCell>
                                              </TableRow>
                                            ) : (
                                              <ScrollArea className="max-h-[300px]">
                                                {sub.assets?.map((asset) => (
                                                  <TableRow key={asset.coin}>
                                                    <TableCell>
                                                      <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                          <span className="font-bold text-xs text-primary">
                                                            {asset.coin.substring(0, 2)}
                                                          </span>
                                                        </div>
                                                        <span className="font-medium">{asset.coin}</span>
                                                      </div>
                                                    </TableCell>
                                                    <TableCell>
                                                      {asset.walletBalance.toFixed(6)} {asset.coin}
                                                    </TableCell>
                                                    <TableCell>${asset.usdValue.toFixed(2)}</TableCell>
                                                    <TableCell>
                                                      {(
                                                        (asset.usdValue / (accountBalances[sub.id] || 1)) *
                                                        100
                                                      ).toFixed(2)}
                                                      %
                                                    </TableCell>
                                                  </TableRow>
                                                ))}
                                              </ScrollArea>
                                            )}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </div>
                                  </div>
                                </TabsContent>

                                <TabsContent value="performance" className="mt-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="bg-card/50">
                                      <CardHeader>
                                        <CardTitle className="text-sm font-medium">Rendimiento</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="flex items-center justify-center py-6">
                                          <div className="relative w-32 h-32 flex items-center justify-center">
                                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                              <circle
                                                className="text-muted stroke-current"
                                                strokeWidth="10"
                                                stroke="currentColor"
                                                fill="transparent"
                                                r="40"
                                                cx="50"
                                                cy="50"
                                              />
                                              <circle
                                                className={`${
                                                  (sub.performance || 0) > 0 ? "text-green-500" : "text-red-500"
                                                } stroke-current`}
                                                strokeWidth="10"
                                                strokeDasharray={`${Math.min(Math.abs(sub.performance || 0) * 2.5, 250)} 250`}
                                                strokeLinecap="round"
                                                stroke="currentColor"
                                                fill="transparent"
                                                r="40"
                                                cx="50"
                                                cy="50"
                                                transform="rotate(-90 50 50)"
                                              />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                              <div
                                                className={`text-2xl font-bold ${getPerformanceColor(sub.performance)}`}
                                              >
                                                {sub.performance?.toFixed(1)}%
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-center mt-4">
                                          <p className="text-sm text-muted-foreground">
                                            Rendimiento en los últimos 30 días
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    <Card className="bg-card/50">
                                      <CardHeader>
                                        <CardTitle className="text-sm font-medium">Historial de Rendimiento</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-4">
                                          {Array.from({ length: 5 }).map((_, i) => {
                                            const randomPerf = Math.random() * 20 - 10
                                            const date = new Date()
                                            date.setDate(date.getDate() - i * 7)

                                            return (
                                              <div key={i} className="flex items-center justify-between">
                                                <div>
                                                  <p className="font-medium">Semana {5 - i}</p>
                                                  <p className="text-xs text-muted-foreground">
                                                    {new Intl.DateTimeFormat("es-ES", {
                                                      day: "2-digit",
                                                      month: "2-digit",
                                                    }).format(date)}
                                                  </p>
                                                </div>
                                                <div
                                                  className={`flex items-center gap-2 ${getPerformanceColor(randomPerf)}`}
                                                >
                                                  {randomPerf > 0 ? (
                                                    <TrendingUp className="h-4 w-4" />
                                                  ) : (
                                                    <TrendingUp className="h-4 w-4 transform rotate-180" />
                                                  )}
                                                  <span className="font-medium">{randomPerf.toFixed(2)}%</span>
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Exchange Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Distribución por Exchange</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exchangeDistribution.map(({ exchange, balance, percentage }) => (
                <div key={exchange} className="space-y-1">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="uppercase font-semibold bg-primary/5 text-primary border-primary/20"
                      >
                        {exchange}
                      </Badge>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-medium">${balance.toFixed(2)}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{percentage.toFixed(2)}% del total</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={percentage} className="h-2" />
                    <span className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Top Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topAssets.map(({ coin, value }) => (
                <div key={coin} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-xs text-primary">{coin.substring(0, 3)}</span>
                    </div>
                    <div>
                      <p className="font-medium">{coin}</p>
                      <p className="text-xs text-muted-foreground">
                        {((value / totalBalance) * 100).toFixed(1)}% del portfolio
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${value.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

