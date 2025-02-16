"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"
import { ChevronLeft, ChevronRight, LogOut, CreditCard, Building2 } from 'lucide-react'
import { ThemeToggle } from "@/components/ThemeToggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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
    console.log("Sesión cerrada exitosamente")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex justify-between items-center p-4 bg-card shadow-md fixed w-full z-10 top-0 left-0 transition-all duration-300">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        >
          {isSidebarCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </Button>
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut size={24} />
          </Button>
        </div>
      </header>

      <div className="flex mt-16">
        <div 
          className="relative transition-all duration-300" 
          style={{ width: isSidebarCollapsed ? '4rem' : '16rem' }}
        >
          <Sidebar isCollapsed={isSidebarCollapsed} />
        </div>
        <main 
          className="flex-1 p-8 transition-all duration-300" 
          style={{ marginLeft: isSidebarCollapsed ? '4rem' : '16rem' }}
        >
          <h2 className="text-3xl font-bold mb-6">Subcuentas</h2>

          {error && (
            <div className="bg-destructive text-destructive-foreground p-4 rounded-md mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="h-40">
                    <CardHeader className="space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))
              : subAccounts.map((sub) => (
                  <Card 
                    key={sub.id} 
                    className={`h-40 cursor-pointer transition-all hover:shadow-lg ${
                      selectedSubAccount?.id === sub.id ? 'ring-2 ring-primary' : ''
                    }`}
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
                      <CardTitle>{sub.name}</CardTitle>
                      <CardDescription>{sub.exchange.toUpperCase()}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                      {sub.exchange === 'binance' ? <CreditCard size={48} /> : <Building2 size={48} />}
                    </CardContent>
                  </Card>
                ))}
          </div>

          {selectedSubAccount && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Información de la cuenta</CardTitle>
                <CardDescription>{selectedSubAccount.name} - {selectedSubAccount.exchange.toUpperCase()}</CardDescription>
              </CardHeader>
              <CardContent>
                {isBalanceLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                ) : (
                  <>
                    <p><strong>Nombre:</strong> {selectedSubAccount.name}</p>
                    <p><strong>Exchange:</strong> {selectedSubAccount.exchange}</p>
                    <p><strong>Balance:</strong> {accountDetails?.balance?.toFixed(2) ?? "0.00"} USDT</p>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="secondary" onClick={() => setSelectedSubAccount(null)}>
                  Cerrar
                </Button>
              </CardFooter>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}