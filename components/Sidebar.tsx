import Link from "next/link"
import { Users, LineChart } from "lucide-react"

interface SidebarProps {
  isCollapsed: boolean
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  return (
    <aside
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } bg-white dark:bg-gray-800 h-screen transition-all duration-300 ease-in-out`}
    >
      <nav className="mt-5 px-2">
        {/* 📌 Enlace a Accounts */}
        <Link
          href="/accounts"
          className={`group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <Users className={`h-6 w-6 ${isCollapsed ? "" : "mr-4"}`} />
          {!isCollapsed && <span>Accounts</span>}
        </Link>

        {/* 📌 Nuevo enlace a Orders */}
        <Link
          href="/orders"
          className={`group flex items-center px-2 py-2 mt-2 text-base font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <LineChart className={`h-6 w-6 ${isCollapsed ? "" : "mr-4"}`} />
          {!isCollapsed && <span>Orders</span>}
        </Link>
      </nav>
    </aside>
  )
}
