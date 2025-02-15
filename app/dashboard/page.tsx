"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchSubAccounts = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error al obtener subcuentas");

      const data = await res.json();
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className="flex-1 flex flex-col">
        <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-gray-600 dark:text-gray-400"
          >
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

        <main className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Subcuentas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {subAccounts.map((sub) => (
              <div
                key={sub.id}
                className="p-5 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col items-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => setSelectedSubAccount(sub)}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{sub.name}</h3>
                <p className="text-gray-500 dark:text-gray-400">{sub.exchange.toUpperCase()}</p>
                <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Ver detalles
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>

      {selectedSubAccount && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold">Detalles de Subcuenta</h2>
            <p><strong>Nombre:</strong> {selectedSubAccount.name}</p>
            <p><strong>Exchange:</strong> {selectedSubAccount.exchange}</p>
            <p><strong>Más información próximamente...</strong></p>
            <button 
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              onClick={() => setSelectedSubAccount(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
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