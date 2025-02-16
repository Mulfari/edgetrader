"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight, LogOut, RefreshCw, CreditCard, DollarSign } from "lucide-react"

interface SubAccount {
  id: string
  userId: string
  name: string
  exchange: string
}

interface AccountDetails {
  balance?: number
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
  const [selectedSubAccount, setSelectedSubAccount] = useState<SubAccount | null>(null)
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

    console.log(`📡 Solicitando detalles de cuenta para userId: ${userId}`)

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
      setAccountDetails({ balance })
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex justify-between items-center p-4 bg-card shadow-md fixed w-full z-10 top-0 left-0 transition-all duration-300">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="text-muted-foreground hover:text-primary"
        >
          {isSidebarCollapsed ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
        </Button>
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </header>

      <div className="flex mt-16">
        <div className="relative transition-all duration-300" style={{ width: isSidebarCollapsed ? "4rem" : "16rem" }}>
          <Sidebar isCollapsed={isSidebarCollapsed} />
        </div>
        <main
          className="flex-1 p-8 transition-all duration-300"
          style={{ marginLeft: isSidebarCollapsed ? "4rem" : "16rem" }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-foreground">Subcuentas</h2>
            <Button onClick={fetchSubAccounts} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>

          {error && <p className="text-destructive bg-destructive/10 p-3 rounded-md mb-4">{error}</p>}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subAccounts.map((sub) => (
                <Card
                  key={sub.id}
                  className="cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => {
                    if (sub.id !== selectedSubAccount?.id) {
                      setSelectedSubAccount(sub)
                      fetchAccountDetails(sub.userId)
                    } else {
                      setSelectedSubAccount(null)
                    }
                  }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="mr-2 h-5 w-5 text-primary" />
                      {sub.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{sub.exchange.toUpperCase()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedSubAccount && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Información de la Cuenta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <strong>Nombre:</strong> {selectedSubAccount.name}
                  </p>
                  <p>
                    <strong>Exchange:</strong> {selectedSubAccount.exchange}
                  </p>
                  {isBalanceLoading ? (
                    <Skeleton className="h-6 w-1/3" />
                  ) : (
                    <p className="flex items-center">
                      <strong>Balance:</strong>
                      <span className="ml-2 text-xl font-bold text-primary flex items-center">
                        <DollarSign className="h-5 w-5 mr-1" />
                        {accountDetails?.balance?.toFixed(2) ?? "0.00"} USDT
                      </span>
                    </p>
                  )}
                </div>
                <Button className="mt-4" variant="secondary" onClick={() => setSelectedSubAccount(null)}>
                  Cerrar
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}

