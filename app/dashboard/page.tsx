"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"

interface SubAccount {
  id: string
  name: string
  exchange: string
  balance?: string | null
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
  const [loadingBalances, setLoadingBalances] = useState<{ [key: string]: boolean }>({})
  const router = useRouter()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

  // ✅ Obtener subcuentas del backend
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
      setSubAccounts(data)
    } catch (error) {
      console.error("Error obteniendo subcuentas:", error)
    } finally {
      setIsLoading(false)
    }
  }, [router, API_URL])

  useEffect(() => {
    fetchSubAccounts()
  }, [fetchSubAccounts])

  // ✅ Obtener API keys y consultar balance en Bybit
  const fetchBalance = async (subAccountId: string) => {
    setLoadingBalances((prev) => ({ ...prev, [subAccountId]: true }))

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      // 🔹 1️⃣ Obtener API keys del backend
      const keysRes = await fetch(`${API_URL}/subaccounts/${subAccountId}/keys`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!keysRes.ok) throw new Error("Error al obtener API keys")

      const { apiKey, apiSecret } = await keysRes.json()

      // 🔹 2️⃣ Consultar balance en Bybit
      const timestamp = Date.now().toString()
      const recvWindow = "5000"

      const message = timestamp + apiKey + recvWindow
      const crypto = await import("crypto")
      const signature = crypto.createHmac("sha256", apiSecret).update(message).digest("hex")

      const bybitRes = await fetch(`https://api-testnet.bybit.com/v5/account/wallet-balance?accountType=UNIFIED`, {
        method: "GET",
        headers: {
          "X-BAPI-API-KEY": apiKey,
          "X-BAPI-TIMESTAMP": timestamp,
          "X-BAPI-RECV-WINDOW": recvWindow,
          "X-BAPI-SIGN": signature,
        },
      })

      if (!bybitRes.ok) throw new Error("Error obteniendo balance de Bybit")

      const bybitData = await bybitRes.json()
      const totalBalance = bybitData.result.list[0]?.totalWalletBalance || "0.00"

      // 🔹 Actualizar el balance en la UI
      setSubAccounts((prev) =>
        prev.map((sub) => (sub.id === subAccountId ? { ...sub, balance: totalBalance } : sub))
      )
    } catch (error) {
      console.error("Error obteniendo balance:", error)
      setSubAccounts((prev) => prev.map((sub) => (sub.id === subAccountId ? { ...sub, balance: "Error" } : sub)))
    } finally {
      setLoadingBalances((prev) => ({ ...prev, [subAccountId]: false }))
    }
  }

  if (isLoading) return <p>Cargando...</p>

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className="flex-1 flex flex-col">
        <header className="flex justify-between p-4 bg-white dark:bg-gray-800 shadow">
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            {isSidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
          <ThemeToggle />
        </header>
        <main className="p-6">
          <h2 className="text-2xl font-bold">Subcuentas</h2>
          {subAccounts.map((sub) => (
            <div key={sub.id} className="p-4 bg-white dark:bg-gray-800 rounded shadow my-2">
              <p>{sub.name}</p>
              <p>
                Balance: {loadingBalances[sub.id] ? "Cargando..." : sub.balance ?? "Oculto"}
              </p>
              <button onClick={() => fetchBalance(sub.id)}>Mostrar balance</button>
            </div>
          ))}
        </main>
      </div>
    </div>
  )
}
