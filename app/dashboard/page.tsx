"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"
import { ChevronLeft, ChevronRight, LogOut, Eye, EyeOff } from "lucide-react"
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

  // ✅ Obtener subcuentas
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
  const fetchBalance = async (subAccountId: string, exchange: string) => {
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

      // 🔹 2️⃣ Determinar si se usa testnet o producción
      const bybitBaseUrl = exchange === "bybit" ? "https://api.bybit.com" : "https://api-testnet.bybit.com"
      const url = `${bybitBaseUrl}/v5/account/wallet-balance?accountType=UNIFIED`

      // 🔹 3️⃣ Generar firma para la solicitud a Bybit
      const timestamp = Date.now().toString()
      const recvWindow = "5000"

      const message = timestamp + apiKey + recvWindow
      const crypto = await import("crypto")
      const signature = crypto.createHmac("sha256", apiSecret).update(message).digest("hex")

      // 🔹 4️⃣ Consultar balance en Bybit
      const bybitRes = await fetch(url, {
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

      // 🔹 Verificación de datos antes de acceder a `list[0]`
      const balance = bybitData?.result?.list?.[0]?.totalWalletBalance || "0.00"

      // 🔹 Actualizar el balance en la UI
      setSubAccounts((prev) =>
        prev.map((sub) => (sub.id === subAccountId ? { ...sub, balance } : sub))
      )
    } catch (error) {
      console.error("Error obteniendo balance:", error)
      setSubAccounts((prev) => prev.map((sub) => (sub.id === subAccountId ? { ...sub, balance: "Error" } : sub)))
    } finally {
      setLoadingBalances((prev) => ({ ...prev, [subAccountId]: false }))
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  if (isLoading) return <LoadingSkeleton />

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className="flex-1 flex flex-col">
        {/* 🔹 Navbar */}
        <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow">
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-gray-600 dark:text-gray-400">
            {isSidebarCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
          </button>
          <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button onClick={handleLogout} className="text-gray-600 dark:text-gray-400 hover:text-red-500">
              <LogOut size={24} />
            </button>
          </div>
        </header>

        {/* 🔹 Contenido principal */}
        <main className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Subcuentas</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {subAccounts.map((sub) => (
              <div key={sub.id} className="p-5 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{sub.name}</h3>
                <p className="text-gray-500 dark:text-gray-400">{sub.exchange.toUpperCase()}</p>

                <div className="mt-4">
                  {loadingBalances[sub.id] ? (
                    <p className="text-blue-500">Cargando...</p>
                  ) : (
                    <p className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                      {sub.balance !== undefined ? `$${sub.balance}` : "Balance oculto"}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => fetchBalance(sub.id, sub.exchange)}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
                >
                  {sub.balance !== undefined ? <EyeOff size={18} className="mr-2" /> : <Eye size={18} className="mr-2" />}
                  {sub.balance !== undefined ? "Ocultar Balance" : "Mostrar Balance"}
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin dark:border-indigo-400"></div>
      <p className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Cargando...</p>
    </div>
  )
}
