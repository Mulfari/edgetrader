"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { LogOut, CreditCard, Building2, Plus, Search, ChevronDown, RefreshCw, AlertCircle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

interface SubAccount {
  id: string
  userId: string
  name: string
  exchange: string
  balance: number
  lastUpdated: string
  performance: number
}

// Datos de ejemplo
const sampleSubAccounts: SubAccount[] = [
  { id: "1", userId: "user1", name: "Binance Main", exchange: "binance", balance: 5000, lastUpdated: "2023-04-15T10:30:00Z", performance: 2.5 },
  { id: "2", userId: "user1", name: "Bybit Futures", exchange: "bybit", balance: 3000, lastUpdated: "2023-04-15T11:00:00Z", performance: -1.2 },
  { id: "3", userId: "user1", name: "Kraken Spot", exchange: "kraken", balance: 2000, lastUpdated: "2023-04-15T09:45:00Z", performance: 0.8 },
  { id: "4", userId: "user1", name: "Binance Futures", exchange: "binance", balance: 4000, lastUpdated: "2023-04-15T10:15:00Z", performance: 3.7 },
  { id: "5", userId: "user1", name: "FTX Derivatives", exchange: "ftx", balance: 1500, lastUpdated: "2023-04-15T08:30:00Z", performance: -0.5 },
]

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
  const [selectedSubAccount, setSelectedSubAccount] = useState<SubAccount | null>(null)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const router = useRouter()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

  const fetchSubAccounts = useCallback(async () => {
    // Simulando una llamada a la API
    setIsLoading(true)
    setTimeout(() => {
      setSubAccounts(sampleSubAccounts)
      setIsLoading(false)
    }, 1000)
  }, [])

  const fetchAccountDetails = async (userId: string) => {
    // Simulando una actualización de balance
    setIsBalanceLoading(true)
    setTimeout(() => {
      setSubAccounts(prevAccounts => 
        prevAccounts.map(account => 
          account.userId === userId 
            ? {...account, balance: account.balance * (1 + (Math.random() * 0.1 - 0.05)), lastUpdated: new Date().toISOString()}
            : account
        )
      )
      setIsBalanceLoading(false)
    }, 1000)
  }

  useEffect(() => {
    fetchSubAccounts()
  }, [fetchSubAccounts])

  const handleLogout = () => {
    // Simulando logout
    router.push("/login")
  }

  const filteredSubAccounts = subAccounts.filter(account =>
    (account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.exchange.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (activeTab === "all" || account.exchange === activeTab)
  )

  const totalBalance = subAccounts.reduce((sum, account) => sum + account.balance, 0)
  const totalPerformance = subAccounts.reduce((sum, account) => sum + account.performance, 0) / subAccounts.length

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
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBalance.toFixed(2)} USDT</div>
                <p className="text-xs text-muted-foreground">
                  {subAccounts.length} subcuentas activas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rendimiento Promedio</CardTitle>
                {totalPerformance >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${totalPerformance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalPerformance.toFixed(2)}%
                </div>
                <Progress value={Math.abs(totalPerformance) * 10} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mayor Balance</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.max(...subAccounts.map(a => a.balance)).toFixed(2)} USDT
                </div>
                <p className="text-xs text-muted-foreground">
                  {subAccounts.reduce((a, b) => a.balance > b.balance ? a : b).name}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mejor Rendimiento</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {Math.max(...subAccounts.map(a => a.performance)).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {subAccounts.reduce((a, b) => a.performance > b.performance ? a : b).name}
                </p>
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
                Actualizar Todo
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
              <TabsTrigger value="bybit">Bybit</TabsTrigger>
              <TabsTrigger value="kraken">Kraken</TabsTrigger>
              <TabsTrigger value="ftx">FTX</TabsTrigger>
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
                  <TableHead>Rendimiento</TableHead>
                  <TableHead>Última Actualización</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      <RefreshCw size={24} className="animate-spin mx-auto" />
                      <span className="mt-2 block">Cargando subcuentas...</span>
                    </TableCell>
                  </TableRow>
                ) : filteredSubAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      <AlertCircle size={24} className="mx-auto mb-2" />
                      No se encontraron subcuentas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubAccounts.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`
                          ${sub.exchange === 'binance' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
                          ${sub.exchange === 'bybit' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
                          ${sub.exchange === 'kraken' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : ''}
                          ${sub.exchange === 'ftx' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                        `}>
                          {sub.exchange.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{sub.balance.toFixed(2)} USDT</span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${sub.performance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {sub.performance >= 0 ? '+' : ''}{sub.performance.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(sub.lastUpdated).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Acciones <ChevronDown size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => fetchAccountDetails(sub.userId)}>
                              Actualizar Balance
                            </DropdownMenuItem>
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