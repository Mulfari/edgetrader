"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, RefreshCw, Plus, AlertCircle, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Sidebar } from "@/components/Sidebar"
import { ThemeToggle } from "@/components/ThemeToggle"

interface SubAccount {
  id: string
  userId: string
  name: string
  exchange: string
  balance: number
  lastUpdated: string
  performance: number
}

export default function SubAccounts() {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [error, setError] = useState<string | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
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

      const subAccountsWithDetails = await Promise.all(
        data.map(async (sub) => {
          try {
            const detailsRes = await fetch(`${API_URL}/account-details/${sub.userId}`, {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            })

            if (!detailsRes.ok) throw new Error("Error al obtener detalles de la cuenta")

            const detailsData = await detailsRes.json()
            return {
              ...sub,
              balance: detailsData.balance ?? 0,
              lastUpdated: detailsData.lastUpdated ?? new Date().toISOString(),
              performance: detailsData.performance ?? 0,
            }
          } catch (error) {
            console.error(`❌ Error obteniendo detalles de ${sub.name}:`, error)
            return {
              ...sub,
              balance: 0,
              lastUpdated: new Date().toISOString(),
              performance: 0,
            }
          }
        }),
      )

      setSubAccounts(subAccountsWithDetails)
      setError(null)
    } catch (error) {
      console.error("❌ Error obteniendo subcuentas:", error)
      setError("No se pudieron cargar las subcuentas")
    } finally {
      setIsLoading(false)
    }
  }, [router, API_URL])

  useEffect(() => {
    fetchSubAccounts()
  }, [fetchSubAccounts])

  const filteredSubAccounts = useMemo(() => {
    return subAccounts.filter(
      (account) =>
        (account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.exchange.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (activeTab === "all" || account.exchange === activeTab),
    )
  }, [subAccounts, activeTab, searchTerm])

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex justify-between items-center p-4 bg-card shadow-md fixed w-full z-10 top-0 left-0 transition-all duration-300">
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="text-muted-foreground hover:text-primary"
        >
          {isSidebarCollapsed ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
        </button>
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex mt-16">
        <div className="relative transition-all duration-300" style={{ width: isSidebarCollapsed ? "4rem" : "16rem" }}>
          <Sidebar isCollapsed={isSidebarCollapsed} />
        </div>
        <main
          className="flex-1 p-6 transition-all duration-300"
          style={{ marginLeft: isSidebarCollapsed ? "4rem" : "16rem" }}
        >
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-primary">Subcuentas</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Agregar Subcuenta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Nueva Subcuenta</DialogTitle>
                    <DialogDescription>Ingrese los detalles de la nueva subcuenta aquí.</DialogDescription>
                  </DialogHeader>
                  {/* Add form fields for new subaccount here */}
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="binance">Binance</TabsTrigger>
                  <TabsTrigger value="bybit">Bybit</TabsTrigger>
                  <TabsTrigger value="kraken">Kraken</TabsTrigger>
                  <TabsTrigger value="ftx">FTX</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button onClick={fetchSubAccounts} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar Todo
              </Button>
            </div>

            <Card className="shadow-lg">
              <CardHeader className="bg-secondary">
                <CardTitle className="flex items-center justify-between text-2xl">
                  <span>Subcuentas</span>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {filteredSubAccounts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6 relative">
                  <Input
                    placeholder="Buscar por nombre o exchange..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full max-w-md"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                </div>
                <div className="overflow-x-auto">
                  <Accordion type="single" collapsible className="w-full">
                    {isLoading ? (
                      <div className="text-center py-4">
                        <RefreshCw className="animate-spin mx-auto h-6 w-6" />
                        <span className="mt-2 block">Cargando subcuentas...</span>
                      </div>
                    ) : error ? (
                      <div className="text-center py-4 text-destructive">
                        <AlertCircle className="mx-auto mb-2 h-6 w-6" />
                        {error}
                      </div>
                    ) : filteredSubAccounts.length === 0 ? (
                      <div className="text-center py-4">
                        <AlertCircle className="mx-auto mb-2 h-6 w-6" />
                        No se encontraron subcuentas
                      </div>
                    ) : (
                      filteredSubAccounts.map((sub) => (
                        <AccordionItem value={sub.id} key={sub.id} className="border-b">
                          <AccordionTrigger className="hover:bg-secondary/50 transition-colors">
                            <div className="grid grid-cols-5 w-full gap-4 items-center">
                              <span className="font-medium text-primary">{sub.name}</span>
                              <Badge variant="secondary" className="w-fit">
                                {sub.exchange.toUpperCase()}
                              </Badge>
                              <span className="font-semibold">{sub.balance.toFixed(2)} USDT</span>
                              <span
                                className={`font-semibold ${sub.performance >= 0 ? "text-green-500" : "text-red-500"}`}
                              >
                                {sub.performance >= 0 ? "+" : ""}
                                {sub.performance.toFixed(2)}%
                              </span>
                              <span className="text-muted-foreground">
                                {new Date(sub.lastUpdated).toLocaleString()}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="bg-secondary/30 rounded-lg mt-4 overflow-hidden">
                              <div className="grid md:grid-cols-2 gap-6 p-6">
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-lg text-primary">Detalles de la Subcuenta</h4>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <p className="font-medium">ID:</p>
                                    <p>{sub.id}</p>
                                    <p className="font-medium">Usuario ID:</p>
                                    <p>{sub.userId}</p>
                                    <p className="font-medium">Nombre:</p>
                                    <p>{sub.name}</p>
                                    <p className="font-medium">Exchange:</p>
                                    <p>{sub.exchange.toUpperCase()}</p>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-lg text-primary">Información Financiera</h4>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <p className="font-medium">Balance:</p>
                                    <p className="font-semibold">{sub.balance.toFixed(2)} USDT</p>
                                    <p className="font-medium">Rendimiento:</p>
                                    <p
                                      className={`font-semibold ${sub.performance >= 0 ? "text-green-500" : "text-red-500"}`}
                                    >
                                      {sub.performance >= 0 ? "+" : ""}
                                      {sub.performance.toFixed(2)}%
                                    </p>
                                    <p className="font-medium">Última Actualización:</p>
                                    <p>{new Date(sub.lastUpdated).toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))
                    )}
                  </Accordion>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

