import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Bell, User, Search, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [subaccounts, setSubaccounts] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      fetchSubaccounts();
    }
  }, [router]);

  const fetchSubaccounts = async () => {
    const token = localStorage.getItem("token");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    try {
      const response = await fetch(`${API_URL}/subaccounts`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch subaccounts');
      const data = await response.json();
      setSubaccounts(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching subaccounts:", error);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (isLoading) {
    return <div>Loading...</div>; // Implement a proper loading component
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
                <ThemeToggle />
                <button
                  className="ml-4 p-2 text-gray-400 hover:text-gray-500 relative"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                >
                  <Bell className="h-6 w-6" />
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
            <h3 className="text-gray-700 dark:text-gray-200 text-3xl font-medium">Accounts</h3>
            <ul>
              {subaccounts.map((account) => (
                <li key={account.id}>{account.name}</li>
              ))}
            </ul>
            {/* Add more content here */}
          </div>
        </main>
      </div>
    </div>
  );
}
