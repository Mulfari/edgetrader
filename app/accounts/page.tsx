"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Plus, X, ChevronDown, Eye, EyeOff, Trash2, Edit2, Search, RefreshCw, BarChart2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

function getToken(): string | null {
  return localStorage.getItem("token") || null
}

interface Account {
  id: string
  exchange: string
  apiKey: string
  apiSecret: string
  name: string
  balance: number
  lastUpdated: string
  health: "good" | "warning" | "critical"
}

const exchangeOptions = [
  { value: "bybit", label: "Bybit" },
  { value: "binance", label: "Binance" },
  { value: "kucoin", label: "KuCoin" },
  { value: "ftx", label: "FTX" },
]

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

export default function AccountsPage() {
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [newAccount, setNewAccount] = useState({
    exchange: "",
    apiKey: "",
    apiSecret: "",
    name: "",
  })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showApiSecret, setShowApiSecret] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "exchange" | "balance" | "health">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [filterExchange, setFilterExchange] = useState<string>("")
  const [filterHealth, setFilterHealth] = useState<string>("")
  const [showStats, setShowStats] = useState(false)

  const fetchAccounts = useCallback(async () => {
    const token = getToken()
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error("Failed to fetch accounts")
      }

      const data: Account[] = await res.json()
      setAccounts(data)
    } catch (error) {
      console.error("Error fetching accounts:", error)
      setError("Failed to load accounts. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = getToken()
    if (token) {
      setIsAuthenticated(true)
      fetchAccounts()
    } else {
      setIsAuthenticated(false)
      setIsLoading(false)
    }
  }, [fetchAccounts])

  const handleAddAccount = async () => {
    const token = getToken()
    if (!token) {
      setError("You are not authenticated. Please log in again.")
      return
    }

    try {
      const method = editingAccount ? "PUT" : "POST"
      const url = editingAccount ? `${API_URL}/subaccounts/${editingAccount.id}` : `${API_URL}/subaccounts`

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAccount),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Unknown error occurred")
      }

      setShowAddAccount(false)
      setNewAccount({ exchange: "", apiKey: "", apiSecret: "", name: "" })
      setEditingAccount(null)
      fetchAccounts()
    } catch (error) {
      console.error("Error adding/updating account:", error)
    }
  }

  const handleDeleteAccount = async (accountId: string) => {
    const token = getToken()
    if (!token) {
      setError("You are not authenticated. Please log in again.")
      return
    }

    if (!confirm("Are you sure you want to delete this account?")) {
      return
    }

    try {
      const res = await fetch(`${API_URL}/subaccounts/${accountId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error("Failed to delete account")
      }

      fetchAccounts()
    } catch (error) {
      console.error("Error deleting account:", error)
      setError("Failed to delete account. Please try again later.")
    }
  }

  const handleEditAccount = (account: Account) => {
    setNewAccount({ ...account, apiSecret: "" })
    setEditingAccount(account)
    setShowAddAccount(true)
  }

  const filteredAndSortedAccounts = useMemo(() => {
    return accounts
      .filter(
        (account) =>
          (account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.exchange.toLowerCase().includes(searchTerm.toLowerCase())) &&
          (filterExchange ? account.exchange === filterExchange : true) &&
          (filterHealth ? account.health === filterHealth : true),
      )
      .sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return sortOrder === "asc" ? -1 : 1
        if (a[sortBy] > b[sortBy]) return sortOrder === "asc" ? 1 : -1
        return 0
      })
  }, [accounts, searchTerm, sortBy, sortOrder, filterExchange, filterHealth])

  const accountStats = useMemo(() => {
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
    const accountsByExchange = accounts.reduce(
      (acc, account) => {
        acc[account.exchange] = (acc[account.exchange] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    const accountsByHealth = accounts.reduce(
      (acc, account) => {
        acc[account.health] = (acc[account.health] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return { totalBalance, accountsByExchange, accountsByHealth }
  }, [accounts])

  const chartData = {
    labels: accounts.map((account) => account.name),
    datasets: [
      {
        label: "Account Balance",
        data: accounts.map((account) => account.balance),
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  }

  const renderAccountForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Exchange</label>
        <div className="relative">
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={newAccount.exchange}
            onChange={(e) => setNewAccount({ ...newAccount, exchange: e.target.value })}
          >
            <option value="">Select one</option>
            {exchangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={newAccount.apiKey}
          onChange={(e) => setNewAccount({ ...newAccount, apiKey: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Secret</label>
        <div className="relative">
          <input
            type={showApiSecret ? "text" : "password"}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10"
            value={newAccount.apiSecret}
            onChange={(e) => setNewAccount({ ...newAccount, apiSecret: e.target.value })}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            onClick={() => setShowApiSecret(!showApiSecret)}
          >
            {showApiSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={newAccount.name}
          onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Accounts</h1>
            <div className="flex space-x-4">
              {isAuthenticated && (
                <>
                  <button
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                    onClick={() => {
                      setEditingAccount(null)
                      setNewAccount({ exchange: "", apiKey: "", apiSecret: "", name: "" })
                      setShowAddAccount(true)
                    }}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Account
                  </button>
                  <button
                    className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                    onClick={() => setShowStats(!showStats)}
                  >
                    <BarChart2 className="h-5 w-5 mr-2" />
                    {showStats ? "Hide" : "Show"} Stats
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <AnimatePresence>
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg mb-6"
              role="alert"
            >
              <p className="font-bold">Authentication Required</p>
              <p>Please log in to view and manage your accounts.</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6"
              role="alert"
            >
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          isAuthenticated && (
            <>
              {showStats && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
                >
                  <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Account Statistics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">Total Balance</h3>
                      <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                        ${accountStats.totalBalance.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Accounts by Exchange
                      </h3>
                      <ul>
                        {Object.entries(accountStats.accountsByExchange).map(([exchange, count]) => (
                          <li key={exchange} className="text-sm text-gray-600 dark:text-gray-400">
                            {exchange}: {count}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">Account Health</h3>
                      <ul>
                        {Object.entries(accountStats.accountsByHealth).map(([health, count]) => (
                          <li key={health} className="text-sm text-gray-600 dark:text-gray-400">
                            {health}: {count}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">Account Balances</h3>
                    <div className="h-64">
                      <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4 md:mb-0">
                    Your Accounts
                  </h2>
                  <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search accounts..."
                        className="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                    <div className="flex space-x-2">
                      <select
                        className="pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={filterExchange}
                        onChange={(e) => setFilterExchange(e.target.value)}
                      >
                        <option value="">All Exchanges</option>
                        {exchangeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select
                        className="pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={filterHealth}
                        onChange={(e) => setFilterHealth(e.target.value)}
                      >
                        <option value="">All Health</option>
                        <option value="good">Good</option>
                        <option value="warning">Warning</option>
                        <option value="critical">Critical</option>
                      </select>
                      <button
                        onClick={fetchAccounts}
                        className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        title="Refresh accounts"
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {["Name", "Exchange", "Balance", "Health", "Last Updated", "Actions"].map((header) => (
                          <th
                            key={header}
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                            onClick={() => {
                              if (header.toLowerCase() !== "actions" && header.toLowerCase() !== "last updated") {
                                setSortBy(header.toLowerCase() as "name" | "exchange" | "balance" | "health")
                                setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                              }
                            }}
                          >
                            {header}
                            {sortBy === header.toLowerCase() && (sortOrder === "asc" ? " ▲" : " ▼")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                      {filteredAndSortedAccounts.map((account) => (
                        <motion.tr
                          key={account.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-lg">
                                  {account.name[0].toUpperCase()}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{account.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">{account.exchange}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              ${account.balance.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                account.health === "good"
                                  ? "bg-green-100 text-green-800"
                                  : account.health === "warning"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {account.health}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(account.lastUpdated).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditAccount(account)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 mr-4"
                            >
                              <Edit2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(account.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )
        )}

        <AnimatePresence>
          {showAddAccount && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6 max-w-md w-full"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {editingAccount ? "Edit Account" : "Add New Account"}
                  </h2>
                  <button
                    onClick={() => setShowAddAccount(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                {renderAccountForm()}
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                    onClick={() => setShowAddAccount(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                    onClick={handleAddAccount}
                  >
                    {editingAccount ? "Update" : "Save"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

