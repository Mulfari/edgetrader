"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import axios from "axios";

interface SubAccount {
  id: string;
  name: string;
  exchange: string;
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [selectedSubAccount, setSelectedSubAccount] = useState<SubAccount | null>(null);
  const [accountInfo, setAccountInfo] = useState<any | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchSubAccounts = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const { data } = await axios.get(`${API_URL}/subaccounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubAccounts(data);
    } catch (error) {
      console.error("Error obteniendo subcuentas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubAccounts();
  }, []);

  const fetchAccountInfo = async (subAccountId: string) => {
    setLoadingInfo(true);
    setAccountInfo(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const { data } = await axios.post(`${API_URL}/subaccounts/${subAccountId}/assets`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAccountInfo(data);
    } catch (error) {
      console.error("Error obteniendo información de la cuenta:", error);
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleSelectSubAccount = (sub: SubAccount) => {
    if (selectedSubAccount?.id === sub.id) {
      setSelectedSubAccount(null);
      setAccountInfo(null);
    } else {
      setSelectedSubAccount(sub);
      fetchAccountInfo(sub.id);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-md fixed w-full z-10 top-0 left-0 transition-all duration-300">
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="text-gray-600 dark:text-gray-400 hover:text-indigo-500"
        >
          {isSidebarCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <button onClick={handleLogout} className="text-gray-600 dark:text-gray-400 hover:text-red-500 transition-all">
            <LogOut size={24} />
          </button>
        </div>
      </header>

      <div className="flex mt-16">
        <div className="relative w-[16rem] transition-all duration-300" style={{ width: isSidebarCollapsed ? '4rem' : '16rem' }}>
          <Sidebar isCollapsed={isSidebarCollapsed} />
        </div>
        <main className="flex-1 p-8 transition-all duration-300" style={{ marginLeft: isSidebarCollapsed ? '4rem' : '16rem' }}>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">Subcuentas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subAccounts.map((sub) => (
              <div key={sub.id} className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center h-40 cursor-pointer hover:shadow-xl transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSelectSubAccount(sub)}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{sub.name}</h3>
                <p className="text-gray-500 dark:text-gray-400">{sub.exchange.toUpperCase()}</p>
              </div>
            ))}
          </div>

          {selectedSubAccount && (
            <div className="mt-8 p-6 bg-gray-200 dark:bg-gray-700 rounded-2xl shadow-md">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Información de la cuenta</h2>
              <div className="mt-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                {loadingInfo ? (
                  <p className="text-gray-600 dark:text-gray-300">Cargando información...</p>
                ) : accountInfo ? (
                  <pre className="text-sm text-gray-900 dark:text-gray-100">{JSON.stringify(accountInfo, null, 2)}</pre>
                ) : (
                  <p className="text-gray-600 dark:text-gray-300">No hay información disponible.</p>
                )}
                <button 
                  className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                  onClick={() => setSelectedSubAccount(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin dark:border-indigo-400"></div>
      <p className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Cargando...</p>
    </div>
  );
}