"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeToggle } from "@/components/ThemeToggle"
import {
  Bell,
  User,
  DollarSign,
  Users,
  ShoppingCart,
  Menu,
  X,
  Search,
  Home,
  BarChart2,
  Settings,
  HelpCircle,
  PlusCircle,
  Filter,
  ArrowLeft,
  ArrowRight,
} from "lucide-react"
import { format } from "date-fns"

// Dummy data for recent orders
const recentOrders = [
  { id: 1, customer: "John Doe", total: 125.99, status: "Completed" },
  { id: 2, customer: "Jane Smith", total: 89.99, status: "Processing" },
  { id: 3, customer: "Bob Johnson", total: 199.99, status: "Shipped" },
  { id: 4, customer: "Alice Brown", total: 149.99, status: "Pending" },
  { id: 5, customer: "Charlie Davis", total: 79.99, status: "Completed" },
]

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date())
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

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                >
                  {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
                <Link href="/" className="ml-4 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  YourBrand
                </Link>
              </div>
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
                <div>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="bg-white dark:bg-gray-800 rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="sr-only">Open user menu</span>
                    <User className="h-8 w-8 rounded-full" />
                  </button>
                </div>
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        Your Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          localStorage.removeItem("token")
                          router.push("/login")
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16 flex">
        {/* Sidebar */}
        <aside
          className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-800 overflow-y-auto transition-transform duration-300 ease-in-out z-20`}
        >
          <div className="px-4 py-5">
            <nav>
              <Link
                href="/dashboard"
                className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Home className="mr-4 h-6 w-6" />
                Dashboard
              </Link>
              <Link
                href="/analytics"
                className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <BarChart2 className="mr-4 h-6 w-6" />
                Analytics
              </Link>
              <Link
                href="/accounts"
                className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Users className="mr-4 h-6 w-6" />
                Accounts
              </Link>
              <Link
                href="/settings"
                className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Settings className="mr-4 h-6 w-6" />
                Settings
              </Link>
              <Link
                href="/help"
                className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <HelpCircle className="mr-4 h-6 w-6" />
                Help
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className={`flex-1 transition-margin duration-300 ease-in-out ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button className="flex items-center justify-center p-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  <PlusCircle className="mr-2" />
                  New Order
                </button>
                <button className="flex items-center justify-center p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Users className="mr-2" />
                  Add User
                </button>
                <button className="flex items-center justify-center p-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                  <BarChart2 className="mr-2" />
                  View Reports
                </button>
                <button className="flex items-center justify-center p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  <Settings className="mr-2" />
                  Settings
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
              {" "}
              {/* Updated grid layout */}
              {/* Card for Total Revenue */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Revenue</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900 dark:text-white">$23,456</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <Link href="#" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                      View all
                    </Link>
                  </div>
                </div>
              </motion.div>
              {/* Card for Total Users */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Users</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900 dark:text-white">12,345</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <Link href="#" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                      View all
                    </Link>
                  </div>
                </div>
              </motion.div>
              {/* Card for Total Orders */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ShoppingCart className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Orders</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900 dark:text-white">1,234</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <Link href="#" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                      View all
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Recent Orders Table */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-8 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg"
            >
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Recent Orders</h3>
                <button className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Order ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Customer
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Total
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          #{order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {order.customer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              order.status === "Completed"
                                ? "bg-green-100 text-green-800"
                                : order.status === "Processing"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : order.status === "Shipped"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Calendar Component */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-8 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg"
            >
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Calendar</h3>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() =>
                      setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))
                    }
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h4 className="text-lg font-semibold">{format(selectedDate, "MMMM yyyy")}</h4>
                  <button
                    onClick={() =>
                      setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))
                    }
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
                {/* Add your calendar component here */}
                <div className="grid grid-cols-7 gap-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center font-semibold">
                      {day}
                    </div>
                  ))}
                  {/* Add calendar days here */}
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Notifications Panel */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-lg z-50 overflow-y-auto"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {/* Add your notifications list here */}
              <div className="space-y-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-800 dark:text-gray-200">New order received</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">2 minutes ago</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-gray-800 dark:text-gray-200">Payment successful</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">1 hour ago</p>
                </div>
                {/* Add more notifications as needed */}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 shadow mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">© 2023 YourBrand. All rights reserved.</p>
            <div className="flex space-x-4">
              <Link
                href="/privacy"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin dark:border-violet-400"></div>
      <p className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Loading...</p>
    </div>
  )
}