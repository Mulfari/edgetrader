"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { LogOut, CreditCard, Building2, Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/ThemeToggle"

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
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
  const [selectedSubAccount, setSelectedSubAccount] = useState<SubAccount | null>(null)
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
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

  const filteredSubAccounts = subAccounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.exchange.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <header className="flex justify-between items-center p-6 bg-gray-800 shadow-lg">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Dashboard
        </h1>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-300 hover:text-white">
            <LogOut size={24} />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <Input
            type="text"
            placeholder="Buscar subcuentas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 bg-gray-700 text-white placeholder-gray-400 border-gray-600"
          />
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus size={20} className="mr-2" /> Agregar Subcuenta
          </Button>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-6 shadow-lg animate-pulse">
                  <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
              ))
            : filteredSubAccounts.map((sub) => (
                <motion.div
                  key={sub.id}
                  className={`bg-gray-800 rounded-lg p-6 shadow-lg cursor-pointer transition-all hover:shadow-xl ${
                    selectedSubAccount?.id === sub.id ? 'ring-2 ring-purple-500' : ''
                  }`}
                  onClick={() => {
                    if (sub.id !== selectedSubAccount?.id) {
                      setSelectedSubAccount(sub)
                      fetchAccountDetails(sub.userId)
                    } else {
                      setSelectedSubAccount(null)
                    }
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">{sub.name}</h3>
                    {sub.exchange === 'binance' ? (
                      <CreditCard size={24} className="text-yellow-500" />
                    ) : (
                      <Building2 size={24} className="text-blue-500" />
                    )}
                  </div>
                  <p className="text-gray-400">{sub.exchange.toUpperCase()}</p>
                  {selectedSubAccount?.id === sub.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 pt-4 border-t border-gray-700"
                    >
                      {isBalanceLoading ? (
                        <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse"></div>
                      ) : (
                        <p className="text-lg">
                          <span className="font-semibold">Balance:</span>{' '}
                          {accountDetails?.balance?.toFixed(2) ?? "0.00"} USDT
                        </p>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ))}
        </div>
      </main>
    </div>
  )
}