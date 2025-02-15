"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface SubAccount {
  id: string;
  userId: string;  // 🔹 Se añadió userId
  name: string;
  exchange: string;
}

interface AccountDetails {
  balance: number;
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [selectedSubAccount, setSelectedSubAccount] = useState<SubAccount | null>(null);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // ✅ Obtener subcuentas del usuario
  const fetchSubAccounts = useCallback(async () => {
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
      console.error("❌ Error obteniendo subcuentas:", error);
      setError("No se pudieron cargar las subcuentas");
    } finally {
      setIsLoading(false);
    }
  }, [router, API_URL]);

  // ✅ Obtener los detalles de la cuenta
  const fetchAccountDetails = async (userId: string) => {
    console.log(`📡 Solicitando detalles de cuenta para userId: ${userId}`);

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setIsBalanceLoading(true);
      setError(null);
      setAccountDetails(null);

      const res = await fetch(`${API_URL}/account-details/${userId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error al obtener detalles de la cuenta");

      const data = await res.json();
      setAccountDetails(data);
    } catch (error) {
      console.error("❌ Error obteniendo detalles de la cuenta:", error);
      setError("No se pudo obtener la información de la cuenta.");
    } finally {
      setIsBalanceLoading(false);
    }
  };

  useEffect(() => {
    fetchSubAccounts();
  }, [fetchSubAccounts]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (isLoading) return <p className="text-center text-gray-500">Cargando subcuentas...</p>;

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
          
          {error && <p className="text-red-500">{error}</p>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subAccounts.map((sub) => (
              <div
                key={sub.id}
                className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center h-40 cursor-pointer hover:shadow-xl transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => {
                  if (sub.id !== selectedSubAccount?.id) {
                    setSelectedSubAccount(sub);
                    fetchAccountDetails(sub.userId); // 🔹 Se usa `sub.userId` en lugar de `sub.id`
                  } else {
                    setSelectedSubAccount(null);
                  }
                }}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{sub.name}</h3>
                <p className="text-gray-500 dark:text-gray-400">{sub.exchange.toUpperCase()}</p>
              </div>
            ))}
          </div>

          {selectedSubAccount && (
            <div className="mt-8 p-6 bg-gray-200 dark:bg-gray-700 rounded-2xl shadow-md">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Información</h2>
              <div className="mt-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <p><strong>Nombre:</strong> {selectedSubAccount.name}</p>
                <p><strong>Exchange:</strong> {selectedSubAccount.exchange}</p>
                {isBalanceLoading ? (
                  <p>Cargando balance...</p>
                ) : accountDetails ? (
                  <p><strong>Balance:</strong> {accountDetails.balance.toFixed(2)} USDT</p>
                ) : (
                  <p className="text-red-500">{error ?? "Error al obtener balance."}</p>
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
