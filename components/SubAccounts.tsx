"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Search,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Wallet,
  ArrowUpDown,
  BarChart3,
  Settings2,
  ExternalLink,
  Filter,
} from "lucide-react"
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

type SortConfig = {
  key: keyof SubAccount
  direction: "asc" | "desc"
} | null

export default function SubAccounts() {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
  const [selectedSubAccountId, setSelectedSubAccountId] = useState<string | null>(null)
  const [accountBalance, setAccountBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)
  const [selectedExchange, setSelectedExchange] = useState<string>("all")
  const router = useRouter()

  const totalBalance = subAccounts.reduce((sum, account) => sum + (account.balance || 0), 0)
  const exchanges = ["all", ...new Set(subAccounts.map((account) => account.exchange))]

  const fetchSubAccounts = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      console.error("❌ No hay token, redirigiendo a login.")
      router.push("/login")
      return
    }

    try {
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
    } catch (error) {
      console.error("❌ Error obteniendo subcuentas:", error)
      setError("No se pudieron cargar las subcuentas")
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const fetchAccountDetails = async (userId: string) => {
    const token = localStorage.getItem("token")
    if (!API_URL || !userId || !token) return

    try {
      setIsBalanceLoading(true)
      setError(null)
      setAccountBalance(null)

      const res = await fetch(`${API_URL}/account-details/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error("Error al obtener detalles de la cuenta")

      const data = await res.json()
      setAccountBalance(typeof data.balance === "number" ? data.balance : 0)
    } catch (error) {
      console.error("❌ Error obteniendo detalles de la cuenta:", error)
      setError("No se pudo obtener la información de la cuenta.")
    } finally {
      setIsBalanceLoading(false)
    }
  }

  useEffect(() => {
    fetchSubAccounts()
  }, [fetchSubAccounts])

  const handleRowClick = (sub: SubAccount) => {
    if (selectedSubAccountId === sub.id) {
      setSelectedSubAccountId(null)
    } else {
      setSelectedSubAccountId(sub.id)
      fetchAccountDetails(sub.userId)
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBalance.toFixed(2)} USDT</div>
            <p className="text-xs text-muted-foreground">Across {subAccounts.length} accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exchanges Activos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exchanges.length - 1}</div>
            <p className="text-xs text-muted-foreground">Connected trading platforms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Actualización</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Date().toLocaleTimeString()}</div>
            <p className="text-xs text-muted-foreground">Auto-refresh cada 5 minutos</p>
          </CardContent>
        </Card>
      </div>

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
                          {sub.balance ? (
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{sub.balance.toFixed(2)} USDT</span>
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
                              <Tabs defaultValue="overview" className="w-full">
                                <TabsList>
                                  <TabsTrigger value="overview">Vista General</TabsTrigger>
                                  <TabsTrigger value="settings">Configuración</TabsTrigger>
                                </TabsList>
                                <TabsContent value="overview" className="mt-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card>
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        {isBalanceLoading ? (
                                          <Skeleton className="h-6 w-24" />
                                        ) : (
                                          <div className="text-2xl font-bold">
                                            {accountBalance !== null
                                              ? `${accountBalance.toFixed(2)} USDT`
                                              : "No disponible"}
                                          </div>
                                        )}
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
                                <TabsContent value="settings">
                                  <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <h4 className="font-medium">Configuración de la Cuenta</h4>
                                        <p className="text-sm text-muted-foreground">
                                          Gestiona la configuración de tu cuenta de {sub.exchange}
                                        </p>
                                      </div>
                                      <Button variant="outline">
                                        <Settings2 className="mr-2 h-4 w-4" />
                                        Configurar
                                      </Button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <h4 className="font-medium">Exchange Dashboard</h4>
                                        <p className="text-sm text-muted-foreground">
                                          Accede al dashboard de {sub.exchange}
                                        </p>
                                      </div>
                                      <Button variant="outline">
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Abrir
                                      </Button>
                                    </div>
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
    </div>
  )
}

