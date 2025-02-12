"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"
import { Bell, User, ChevronLeft, ChevronRight } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  interface SubAccount {
    id: string
    apiKey: string
    apiSecret: string
    name: string
  }
  
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
   // Temporalmente `any[]` hasta ver la estructura de la API
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchSubAccounts = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error("Error al obtener las subcuentas")

      const data = await res.json()
      console.log("🔍 Respuesta de /subaccounts:", data) // 👀 Aquí vemos la estructura
      setSubAccounts(data) // Guardamos las subcuentas en el estado
    } catch (error) {
      console.error("Error obteniendo subcuentas:", error)
      setError("No se pudieron cargar las subcuentas.")
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchSubAccounts()
  }, [fetchSubAccounts])

  if (isLoading) return <LoadingSkeleton />

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className="flex-1 flex flex-col">
        <nav className="bg-white dark:bg-gray-800 shadow-sm w-full z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2">
                  {isSidebarCollapsed ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
                </button>
                <span className="ml-4 text-2xl font-bold text-indigo-600 dark:text-indigo-400">YourBrand</span>
              </div>
              <div className="flex items-center">
                <ThemeToggle />
                <button className="ml-4 p-2 text-gray-400 hover:text-gray-500">
                  <Bell className="h-6 w-6" />
                </button>
                <button className="ml-4 p-2 text-gray-400 hover:text-gray-500">
                  <User className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">
            <h3 className="text-gray-700 dark:text-gray-200 text-3xl font-medium mb-6">Dashboard</h3>

            {error && <p className="text-red-500">{error}</p>}

            {/* 🔍 Mostramos la respuesta de la API para analizarla */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
              <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Datos de la API</h4>
              <pre className="text-sm text-gray-600 dark:text-gray-300">{JSON.stringify(subAccounts, null, 2)}</pre>
            </div>
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
