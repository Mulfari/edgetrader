"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, RefreshCw, AlertCircle, ChevronDown, Wallet, ArrowUpDown, Filter, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface SubAccount {
  id: string
  userId: string
  name: string
  exchange: string
  balance?: number
  lastUpdated?: string
}

interface CoinData {
  coin: string
  walletBalance: string
  usdValue: string
  equity: string
  unrealisedPnl: string
  availableToWithdraw: string
  locked: string
  collateralSwitch: boolean
  marginCollateral: boolean
}

// Modificar la interfaz AssetResponse para que coincida con la estructura real de la respuesta
interface AssetResponse {
  retCode: number
  retMsg: string
  result: {
    list: [
      {
        totalEquity: string
        totalWalletBalance: string
        totalAvailableBalance: string
        totalMarginBalance: string
        accountType: string
        coin: CoinData[]
      },
    ]
  }
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
  const [assetData, setAssetData] = useState<AssetResponse | null>(null)
  const [isLoadingAssets, setIsLoadingAssets] = useState(false)
  const [assetError, setAssetError] = useState<string | null>(null)
  const router = useRouter()

  const exchanges = ["all", ...new Set(subAccounts.map((account) => account.exchange))]

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
      setSubAccounts(data)

      // Fetch account details for each subaccount
      const balances: Record<string, number | null> = {}
      let totalBalance = 0
      await Promise.all(
        data.map(async (sub: SubAccount) => {
          const balance = await fetchAccountDetails(sub.userId, token)
          balances[sub.id] = balance
          if (balance !== null) {
            totalBalance += balance
          }
        }),
      )
      setAccountBalances(balances)
      if (onBalanceUpdate) {
        onBalanceUpdate(totalBalance)
      }
    } catch (error) {
      console.error("❌ Error obteniendo subcuentas:", error)
      setError("No se pudieron cargar las subcuentas")
    } finally {
      setIsLoading(false)
    }
  }, [router, onBalanceUpdate])

  const fetchAccountDetails = async (userId: string, token: string) => {
    if (!API_URL || !userId || !token) return null

    try {
      const res = await fetch(`${API_URL}/account-details/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error("Error al obtener detalles de la cuenta")

      const data = await res.json()
      return typeof data.balance === "number" ? data.balance : 0
    } catch (error) {
      console.error("❌ Error obteniendo detalles de la cuenta:", error)
      return null
    }
  }

  // Modificar la función fetchAssetData para usar el endpoint correcto
  const fetchAssetData = async (userId: string) => {
    const token = localStorage.getItem("token")
    if (!token || !API_URL) {
      console.error("❌ No hay token para obtener assets")
      return
    }

    try {
      setIsLoadingAssets(true)
      setAssetError(null)

      // Usar el endpoint que devuelve la información de assets
      const res = await fetch(`${API_URL}/wallet/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error(`Error al obtener assets - Código ${res.status}`)
      }

      const data = await res.json()
      setAssetData(data)
    } catch (error) {
      console.error("❌ Error obteniendo assets:", error)
      setAssetError("No se pudieron cargar los assets")
    } finally {
      setIsLoadingAssets(false)
    }
  }

  useEffect(() => {
    fetchSubAccounts()
  }, [fetchSubAccounts]) // Solo se ejecuta una vez al montar el componente

  const handleRowClick = (sub: SubAccount) => {
    if (selectedSubAccountId === sub.id) {
      setSelectedSubAccountId(null)
      setAssetData(null) // Limpiar datos de assets al cerrar
    } else {
      setSelectedSubAccountId(sub.id)
      // No cargamos los assets inmediatamente, solo cuando se selecciona la pestaña
    }
  }

  const handleTabChange = (value: string, userId: string) => {
    if (value === "assets" && !assetData) {
      fetchAssetData(userId)
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

  // Función para formatear números con separadores de miles
  const formatNumber = (value: string | number) => {
    const num = typeof value === "string" ? Number.parseFloat(value) : value
    return num.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 8 })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Subcuentas</CardTitle>
            <CardDescription>Gestiona y monitorea todas tus cuentas de trading</CardDescription>
          </div>
          <Button onClick={fetchSubAccounts} variant="outline" size="sm" className="w-full md:w-auto">
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
              className="pl-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                {selectedExchange === "all" ? "Todos los Exchanges" : selectedExchange}
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

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort("name")} className="cursor-pointer hover:bg-muted/50">
                  Nombre
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead onClick={() => handleSort("exchange")} className="cursor-pointer hover:bg-muted/50">
                  Exchange
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead onClick={() => handleSort("balance")} className="cursor-pointer hover:bg-muted/50">
                  Balance
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead onClick={() => handleSort("lastUpdated")} className="cursor-pointer hover:bg-muted/50">
                  Última Actualización
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
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
                      <AlertCircle className="h-12 w-12 mb-3" />
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
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{sub.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="uppercase">
                          {sub.exchange}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {accountBalances[sub.id] !== undefined ? (
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{accountBalances[sub.id]?.toFixed(2)} USDT</span>
                            <span className="font-medium">{accountBalances[sub.id]?.toFixed(2)} USDT</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sub.lastUpdated ? new Date(sub.lastUpdated).toLocaleString() : "-"}
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
                        <TableCell colSpan={5}>
                          <div className="p-6 bg-muted/50 rounded-lg space-y-6">
                            <Tabs
                              defaultValue="overview"
                              className="w-full"
                              onValueChange={(value) => handleTabChange(value, sub.userId)}
                            >
                              <TabsList>
                                <TabsTrigger value="overview">Vista General</TabsTrigger>
                                <TabsTrigger value="assets">Assets</TabsTrigger>
                              </TabsList>
                              <TabsContent value="overview" className="mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-2xl font-bold">
                                        {accountBalances[sub.id] !== undefined
                                          ? `${accountBalances[sub.id]?.toFixed(2)} USDT`
                                          : "No disponible"}
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm font-medium">Exchange</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-2xl font-bold uppercase">{sub.exchange}</div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm font-medium">Última Actualización</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-2xl font-bold">
                                        {sub.lastUpdated ? new Date(sub.lastUpdated).toLocaleTimeString() : "-"}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              </TabsContent>
                              <TabsContent value="assets">
                                <div className="space-y-4">
                                  {assetError && (
                                    <div className="flex items-center gap-2 p-4 mb-4 text-red-600 bg-red-50 dark:bg-red-900/10 rounded-lg">
                                      <AlertCircle className="h-5 w-5" />
                                      <p className="text-sm font-medium">{assetError}</p>
                                    </div>
                                  )}

                                  {isLoadingAssets ? (
                                    <div className="flex justify-center items-center py-12">
                                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                      <span className="ml-2 text-sm text-muted-foreground">Cargando assets...</span>
                                    </div>
                                  ) : assetData ? (
                                    <>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card>
                                          <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium">Equity Total</CardTitle>
                                          </CardHeader>
                                          <CardContent>
                                            <div className="text-2xl font-bold">
                                              ${formatNumber(assetData.result.list[0].totalEquity)}
                                            </div>
                                          </CardContent>
                                        </Card>
                                        <Card>
                                          <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
                                          </CardHeader>
                                          <CardContent>
                                            <div className="text-2xl font-bold">
                                              ${formatNumber(assetData.result.list[0].totalWalletBalance)}
                                            </div>
                                          </CardContent>
                                        </Card>
                                        <Card>
                                          <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium">Disponible</CardTitle>
                                          </CardHeader>
                                          <CardContent>
                                            <div className="text-2xl font-bold">
                                              ${formatNumber(assetData.result.list[0].totalAvailableBalance)}
                                            </div>
                                          </CardContent>
                                        </Card>
                                      </div>
                                      <div className="mt-6">
                                        <h4 className="font-medium mb-4">Todos los Assets</h4>
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Token</TableHead>
                                              <TableHead>Balance</TableHead>
                                              <TableHead>Valor USD</TableHead>
                                              <TableHead>Disponible</TableHead>
                                              <TableHead>Estado</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {assetData.result.list[0].coin.map((coin) => (
                                              <TableRow key={coin.coin}>
                                                <TableCell className="font-medium">{coin.coin}</TableCell>
                                                <TableCell>
                                                  {formatNumber(coin.walletBalance)} {coin.coin}
                                                </TableCell>
                                                <TableCell>${formatNumber(coin.usdValue)}</TableCell>
                                                <TableCell>
                                                  {coin.availableToWithdraw
                                                    ? formatNumber(coin.availableToWithdraw)
                                                    : formatNumber(coin.walletBalance)}{" "}
                                                  {coin.coin}
                                                </TableCell>
                                                <TableCell>
                                                  <Badge
                                                    variant={coin.marginCollateral ? "default" : "outline"}
                                                    className={
                                                      coin.marginCollateral
                                                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                        : ""
                                                    }
                                                  >
                                                    {coin.marginCollateral ? "Colateral" : "Normal"}
                                                  </Badge>
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                      <AlertCircle className="h-12 w-12 mb-3" />
                                      <p className="text-sm font-medium mb-2">No hay datos de assets disponibles</p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchAssetData(sub.userId)}
                                        className="mt-2"
                                      >
                                        Cargar Assets
                                      </Button>
                                    </div>
                                  )}
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
  )
}

