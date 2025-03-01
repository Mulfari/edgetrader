"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { 
  Plus, 
  Search, 
  RefreshCw, 
  ArrowLeft, 
  Trash2, 
  Eye, 
  EyeOff, 
  Filter,
  ArrowUpDown,
  AlertCircle
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

function getToken(): string | null {
  return localStorage.getItem("token") || null
}

interface SubAccount {
  id: string
  exchange: string
  apiKey: string
  apiSecret: string
  name: string
  isDemo: boolean
}

type ApiError = {
  message: string;
}

const exchangeOptions = [
  { value: "bybit", label: "Bybit" },
  { value: "binance", label: "Binance" },
  { value: "kucoin", label: "KuCoin" },
  { value: "ftx", label: "FTX" },
]

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<SubAccount[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newAccount, setNewAccount] = useState({
    exchange: "",
    apiKey: "",
    apiSecret: "",
    name: "",
    isDemo: false
  })
  const [showApiSecret, setShowApiSecret] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{key: keyof SubAccount, direction: "asc" | "desc"} | null>({
    key: "name",
    direction: "asc"
  })
  const [selectedExchange, setSelectedExchange] = useState<string>("all")
  const router = useRouter()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

  const fetchAccounts = useCallback(async () => {
    const token = getToken()
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      })

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token")
          router.push("/login")
          throw new Error("Sesión expirada. Por favor inicia sesión nuevamente.")
        }
        throw new Error("Error al cargar las subcuentas")
      }

      const data: SubAccount[] = await res.json()
      setAccounts(data)
    } catch (error: Error | ApiError | unknown) {
      console.error("Error al cargar subcuentas:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al cargar las subcuentas. Intenta nuevamente más tarde."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [API_URL, router])

  useEffect(() => {
    const token = getToken()
    if (token) {
      fetchAccounts()
    } else {
      setIsLoading(false)
      router.push("/login")
    }
  }, [fetchAccounts, router])

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = getToken()
    if (!token) {
      setError("No estás autenticado. Por favor inicia sesión nuevamente.")
      router.push("/login")
      return
    }

    if (!newAccount.name || !newAccount.exchange || !newAccount.apiKey || !newAccount.apiSecret) {
      setError("Por favor completa todos los campos requeridos.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAccount),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({})) as ApiError
        throw new Error(errorData.message || "Error al crear la subcuenta")
      }

      setIsAddDialogOpen(false)
      setNewAccount({ exchange: "", apiKey: "", apiSecret: "", name: "", isDemo: false })
      fetchAccounts()
    } catch (error: Error | ApiError | unknown) {
      console.error("Error al crear subcuenta:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al crear la subcuenta. Intenta nuevamente más tarde."
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAccount = async (accountId: string, accountName: string) => {
    const token = getToken()
    if (!token) {
      setError("No estás autenticado. Por favor inicia sesión nuevamente.")
      router.push("/login")
      return
    }

    if (!confirm(`¿Estás seguro que deseas eliminar la subcuenta "${accountName}"?`)) {
      return
    }

    try {
      const res = await fetch(`${API_URL}/subaccounts/${accountId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      })

      if (!res.ok) {
        throw new Error("Error al eliminar la subcuenta")
      }

      fetchAccounts()
    } catch (error: Error | ApiError | unknown) {
      console.error("Error al eliminar subcuenta:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al eliminar la subcuenta. Intenta nuevamente más tarde."
      setError(errorMessage)
    }
  }

  const handleSort = (key: keyof SubAccount) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === "asc") {
          return { key, direction: "desc" }
        }
        return { key: "name", direction: "asc" }
      }
      return { key, direction: "asc" }
    })
  }

  const sortedAccounts = useMemo(() => {
    if (!sortConfig) return accounts

    return [...accounts].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })
  }, [accounts, sortConfig])

  const filteredAccounts = useMemo(() => {
    return sortedAccounts.filter(
      (account) => {
        const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.exchange.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesExchange = selectedExchange === "all" || account.exchange === selectedExchange
        
        return matchesSearch && matchesExchange
      }
    )
  }, [sortedAccounts, searchTerm, selectedExchange])

  const exchanges = useMemo(() => {
    return ["all", ...new Set(accounts.map(account => account.exchange))]
  }, [accounts])

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">Gestión de Subcuentas</h1>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Subcuenta
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Agregar Nueva Subcuenta</DialogTitle>
                  <DialogDescription>
                    Ingresa los detalles de tu subcuenta de exchange para monitorearla.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddAccount}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nombre de la Subcuenta</Label>
                      <Input
                        id="name"
                        value={newAccount.name}
                        onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                        placeholder="Mi Subcuenta"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="exchange">Exchange</Label>
                      <Select 
                        value={newAccount.exchange} 
                        onValueChange={(value) => setNewAccount({ ...newAccount, exchange: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un exchange" />
                        </SelectTrigger>
                        <SelectContent>
                          {exchangeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        value={newAccount.apiKey}
                        onChange={(e) => setNewAccount({ ...newAccount, apiKey: e.target.value })}
                        placeholder="Ingresa tu API Key"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="apiSecret">API Secret</Label>
                      <div className="relative">
                        <Input
                          id="apiSecret"
                          type={showApiSecret ? "text" : "password"}
                          value={newAccount.apiSecret}
                          onChange={(e) => setNewAccount({ ...newAccount, apiSecret: e.target.value })}
                          placeholder="Ingresa tu API Secret"
                          required
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowApiSecret(!showApiSecret)}
                        >
                          {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isDemo"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={newAccount.isDemo}
                        onChange={(e) => setNewAccount({ ...newAccount, isDemo: e.target.checked })}
                      />
                      <Label htmlFor="isDemo">Esta es una cuenta Demo</Label>
                    </div>
                    {error && (
                      <div className="flex items-center gap-2 p-3 text-sm border border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md">
                        <AlertCircle className="h-4 w-4" />
                        <p>{error}</p>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Guardando..." : "Guardar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <Card className="w-full">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Subcuentas</CardTitle>
                <CardDescription>Gestiona tus subcuentas de exchanges</CardDescription>
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <Button onClick={fetchAccounts} variant="outline" size="sm" className="w-full md:w-auto">
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  Actualizar
                </Button>
              </div>
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
                    <TableHead>API Key</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">Cargando...</TableCell>
                        <TableCell>Cargando...</TableCell>
                        <TableCell>Cargando...</TableCell>
                        <TableCell>Cargando...</TableCell>
                        <TableCell className="text-right">Cargando...</TableCell>
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
                    filteredAccounts.map((account) => (
                      <TableRow key={account.id} className="transition-colors hover:bg-muted/50">
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="uppercase">
                            {account.exchange}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {account.apiKey.substring(0, 8)}...{account.apiKey.substring(account.apiKey.length - 4)}
                        </TableCell>
                        <TableCell>
                          {account.isDemo ? (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                              Demo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500">
                              Real
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAccount(account.id, account.name)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

