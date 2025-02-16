"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { LogOut, CreditCard, Building2, Plus, Search, ChevronDown, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/ThemeToggle"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SubAccount {
  id: string
  userId: string
  name: string
  exchange: string
}

interface AccountDetails {
  balance: number
  lastUpdated: string
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
  const [selectedSubAccount, setSelectedSubAccount] = useState<SubAccount | null>(null)
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null)
  const [allBalances, setAllBalances] = useState<{[key: string]: number}>({})
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const router = useRouter()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

  const fetchSubAccounts = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    try {
      setIsLoading(true)
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error("Error al obtener subcuentas")

      const data = await res.json()

      if (!Array.isArray(data)) {
        throw new Error("Respuesta inesperada del servidor")
      }

      setSubAccounts(data)
    } catch (error) {
      console.error("❌ Error obteniendo subcuentas:", error)
      setError("No se pudieron cargar las subcuentas")
    } finally {
      setIsLoading(false)
    }
  }, [router, API_URL])

  const fetchAccountDetails = async (userId: string) => {
    if (!userId) {
      console.error("❌ Error: userId es inválido.")
      return
    }

    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    try {
      setIsBalanceLoading(true)
      setError(null)
      setAccountDetails(null)

      const res = await fetch(`${API_URL}/account-details/${userId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error("Error al obtener detalles de la cuenta")

      const data = await res.json()

      const balance = typeof data.balance === "number" ? data.balance : 0
      const newAccountDetails = { balance, lastUpdated: new Date().toISOString() }
      setAccountDetails(newAccountDetails)
      setAllBalances(prev => ({...prev, [userId]: balance}))
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

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  const filteredSubAccounts = subAccounts.filter(account =>
    (account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.exchange.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (activeTab === "all" || account.exchange === activeTab)
  )

  const totalBalance = Object.values(allBalances).reduce((sum, balance) => sum + balance, 0)

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
                <LogOut size={20} className="mr-2" />
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
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBalance.toFixed(2)} USDT</div>
                <p className="text-xs text-muted-foreground">
                  Total de {Object.keys(allBalances).length} subcuentas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subcuentas Activas</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subAccounts.length}</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Buscar subcuentas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md"
              />
            </div>
            <div className="flex space-x-4">
              <Button onClick={fetchSubAccounts} variant="outline" size="sm">
                <RefreshCw size={16} className="mr-2" />
                Actualizar
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus size={20} className="mr-2" /> Agregar Subcuenta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Nueva Subcuenta</DialogTitle>
                    <DialogDescription>
                      Ingrese los detalles de la nueva subcuenta aquí.
                    </DialogDescription>
                  </DialogHeader>
                  {/* Aquí iría el formulario para agregar una nueva subcuenta */}
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="binance">Binance</TabsTrigger>
              <TabsTrigger value="other">Otras</TabsTrigger>
            </TabsList>
          </Tabs>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Exchange</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <RefreshCw size={24} className="animate-spin mx-auto" />
                      <span className="mt-2 block">Cargando subcuentas...</span>
                    </TableCell>
                  </TableRow>
                ) : filteredSubAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <AlertCircle size={24} className="mx-auto mb-2" />
                      No se encontraron subcuentas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubAccounts.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.name}</TableCell>
                      <TableCell>
                        {sub.exchange === 'binance' ? (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            <CreditCard size={16} className="mr-2" />
                            {sub.exchange.toUpperCase()}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            <Building2 size={16} className="mr-2" />
                            {sub.exchange.toUpperCase()}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {selectedSubAccount?.id === sub.id ? (
                          isBalanceLoading ? (
                            <span className="text-gray-500">Cargando...</span>
                          ) : (
                            <span className="font-semibold">{allBalances[sub.userId]?.toFixed(2) ?? "0.00"} USDT</span>
                          )
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedSubAccount(sub)
                              fetchAccountDetails(sub.userId)
                            }}
                          >
                            Ver balance
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Activa
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Acciones <ChevronDown size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  )
}