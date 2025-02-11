"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ThemeToggle } from "@/components/ThemeToggle"
import {
  Bell,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Wallet,
  CreditCard,
  Briefcase,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { Sidebar } from "@/components/Sidebar"

// Ejemplo de datos de cuentas
const accounts = [
  { id: 1, name: "Cuenta Principal", balance: 5750.0, icon: Wallet, color: "text-blue-500", trend: "up", change: 2.5 },
  {
    id: 2,
    name: "Cuenta de Ahorros",
    balance: 12000.5,
    icon: Briefcase,
    color: "text-green-500",
    trend: "up",
    change: 1.8,
  },
  {
    id: 3,
    name: "Tarjeta de Crédito",
    balance: -1500.75,
    icon: CreditCard,
    color: "text-red-500",
    trend: "down",
    change: 0.5,
  },
  {
    id: 4,
    name: "Inversiones",
    balance: 8500.25,
    icon: DollarSign,
    color: "text-purple-500",
    trend: "up",
    change: 3.2,
  },
]

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
    } else {
      setIsLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <Sidebar isCollapsed={isSidebarCollapsed} />

      <div className="flex-1 flex flex-col">
        <nav className="bg-white dark:bg-gray-800 shadow-sm w-full z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                >
                  {isSidebarCollapsed ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
                </button>
                <Link href="/" className="ml-4 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  YourBrand
                </Link>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search..."
                      className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute left-3 top-2.5">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
                <ThemeToggle />
                <button
                  className="ml-4 p-2 text-gray-400 hover:text-gray-500 relative"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                >
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
                </button>
                <div className="ml-4 relative flex-shrink-0">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="bg-white dark:bg-gray-800 rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="sr-only">Open user menu</span>
                    <User className="h-8 w-8 rounded-full" />
                  </button>
                  {isUserMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <LogOut className="inline-block h-5 w-5 mr-2" />
                        Logout
                      </button>
                      {/* Add other user menu items here */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">
            <h3 className="text-gray-700 dark:text-gray-200 text-3xl font-medium mb-6">Dashboard</h3>

            {/* Total Balance Section */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
              <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Balance Total</h4>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">${totalBalance.toFixed(2)}</p>
                <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out">
                  Ver Detalles
                </button>
              </div>
            </div>

            {/* Balances Section */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
              <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Balances por Cuenta</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer transition duration-300 ease-in-out transform hover:scale-105 ${selectedAccount === account.id ? "ring-2 ring-indigo-500" : ""}`}
                    onClick={() => setSelectedAccount(account.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <account.icon className={`h-8 w-8 ${account.color} mr-3`} />
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{account.name}</p>
                          <p
                            className={`text-lg font-semibold ${account.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                          >
                            ${Math.abs(account.balance).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {account.trend === "up" ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {account.trend === "up" ? "+" : "-"}
                      {account.change}% desde el mes pasado
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Details Section */}
            {selectedAccount !== null && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
                <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Detalles de {accounts.find((a) => a.id === selectedAccount)?.name}
                </h4>
                {/* Aquí puedes agregar más detalles sobre la cuenta seleccionada */}
                <p className="text-gray-600 dark:text-gray-300">
                  Más información y gráficos sobre la cuenta seleccionada irían aquí.
                </p>
              </div>
            )}

            <h3 className="text-gray-700 dark:text-gray-200 text-3xl font-medium mb-6">Cuentas</h3>
            {/* Add your Accounts content here */}
          </div>
        </main>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin dark:border-violet-400"></div>
      <p className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Cargando...</p>
    </div>
  )
}

