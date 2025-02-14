'use client'

import { useState, useEffect, useCallback } from 'react'
import crypto from 'crypto'
import { Sidebar } from '@/components/Sidebar'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

interface SubAccount {
  id: string
  name: string
  exchange: string
  apiKey: string
  apiSecret: string
  balance?: number | null
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchSubAccounts = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subaccounts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setSubAccounts(data)

      // 🔹 Una vez obtenidas las subcuentas, obtener el balance de cada una
      data.forEach((sub: SubAccount) => fetchBalance(sub))
    } catch (error) {
      console.error('Error obteniendo subcuentas:', error)
      setError('No se pudieron cargar las subcuentas.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchBalance = async (sub: SubAccount) => {
    if (!sub.apiKey || !sub.apiSecret) return

    try {
      const baseUrl = 'https://api-testnet.bybit.com'
      const endpoint = '/v5/account/wallet-balance'
      const params = 'accountType=UNIFIED'
      const timestamp = Date.now().toString()
      const recvWindow = '5000'

      // 🔹 Generar firma HMAC SHA256
      const signature = crypto
        .createHmac('sha256', sub.apiSecret)
        .update(timestamp + sub.apiKey + recvWindow + params)
        .digest('hex')

      const res = await fetch(`${baseUrl}${endpoint}?${params}`, {
        method: 'GET',
        headers: {
          'X-BAPI-API-KEY': sub.apiKey,
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-RECV-WINDOW': recvWindow,
          'X-BAPI-SIGN': signature,
        },
      })

      const data = await res.json()
      if (data.retCode !== 0) throw new Error(`Error en la API: ${data.retMsg}`)

      const totalBalance = Number(data.result.list[0]?.totalWalletBalance || 0)

      // 🔹 Actualizar el estado con el balance obtenido
      setSubAccounts((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, balance: totalBalance } : s))
      )
    } catch (error) {
      console.error(`❌ Error obteniendo balance de ${sub.name}:`, error)
    }
  }

  useEffect(() => {
    fetchSubAccounts()
  }, [fetchSubAccounts])

  const totalBalance = subAccounts.reduce((sum, sub) => sum + (sub.balance || 0), 0)

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
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">
            <h3 className="text-gray-700 dark:text-gray-200 text-3xl font-medium mb-6">Dashboard</h3>

            {error && <p className="text-red-500">{error}</p>}

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
              <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Balance Total</h4>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">${totalBalance.toFixed(2)}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Subcuentas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {subAccounts.map((sub) => (
                  <div key={sub.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-md">
                    <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{sub.name}</p>
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      ${sub.balance ? sub.balance.toFixed(2) : 'Cargando...'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
}
