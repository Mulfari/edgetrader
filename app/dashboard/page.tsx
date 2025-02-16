"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ChevronLeft, ChevronRight, LogOut, Briefcase, DollarSign, TrendingUp } from 'lucide-react';
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SubAccount {
  id: string;
  userId: string;
  name: string;
  exchange: string;
  balance: number;
}

const exchangeIcons: { [key: string]: React.ElementType } = {
  binance: TrendingUp,
  coinbase: Briefcase,
  kraken: DollarSign,
};

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [selectedSubAccount, setSelectedSubAccount] = useState<SubAccount | null>(null);
  const router = useRouter();

  // ✅ Simulando API call con ejemplo de datos
  const fetchSubAccounts = useCallback(async () => {
    setTimeout(() => {
      const exampleData: SubAccount[] = [
        { id: "1", userId: "user1", name: "Main Account", exchange: "binance", balance: 5000.75 },
        { id: "2", userId: "user1", name: "Trading Account", exchange: "coinbase", balance: 2500.50 },
        { id: "3", userId: "user1", name: "Savings Account", exchange: "kraken", balance: 10000.25 },
      ];
      setSubAccounts(exampleData);
      setIsLoading(false);
    }, 1500);
  }, []);

  useEffect(() => {
    fetchSubAccounts();
  }, [fetchSubAccounts]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const totalBalance = subAccounts.reduce((sum, account) => sum + (account.balance ?? 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-md w-48"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-32"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-40"></div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <header className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg fixed w-full z-10 top-0 left-0 transition-all duration-300">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
          >
            {isSidebarCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
          </button>
          <h1 className="text-2xl font-bold">Crypto Dashboard</h1>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={handleLogout} className="text-white hover:bg-white/20 rounded-full p-2 transition-all">
                  <LogOut size={24} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        <div className="flex mt-16">
          <div className="relative transition-all duration-300" style={{ width: isSidebarCollapsed ? '4rem' : '16rem' }}>
            <Sidebar isCollapsed={isSidebarCollapsed} />
          </div>
          <main className="flex-1 p-8 transition-all duration-300" style={{ marginLeft: isSidebarCollapsed ? '4rem' : '16rem' }}>
            <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Portfolio Summary</h2>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">${totalBalance.toFixed(2)} USD</p>
              <p className="text-gray-500 dark:text-gray-400">Total Balance Across All Accounts</p>
            </div>

            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">Your Accounts</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subAccounts.map((sub) => {
                const ExchangeIcon = exchangeIcons[sub.exchange.toLowerCase()] || Briefcase;
                return (
                  <Tooltip key={sub.id}>
                    <TooltipTrigger asChild>
                      <div
                        className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center h-48 cursor-pointer hover:shadow-xl transition-all hover:bg-indigo-50 dark:hover:bg-gray-700"
                        onClick={() => setSelectedSubAccount(sub.id !== selectedSubAccount?.id ? sub : null)}
                      >
                        <ExchangeIcon size={48} className="text-indigo-500 dark:text-indigo-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{sub.name}</h3>
                        <p className="text-gray-500 dark:text-gray-400">{sub.exchange.toUpperCase()}</p>
                        <p className="text-2xl text-indigo-600 dark:text-indigo-400 font-bold mt-2">
                          ${sub.balance?.toFixed(2) ?? "0.00"}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to view details</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {selectedSubAccount && (
              <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Account Details</h2>
                <p><strong>Name:</strong> {selectedSubAccount.name}</p>
                <p><strong>Exchange:</strong> {selectedSubAccount.exchange}</p>
                <p><strong>Balance:</strong> ${selectedSubAccount.balance?.toFixed(2) ?? "0.00"}</p>
                <button 
                  className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                  onClick={() => setSelectedSubAccount(null)}
                >
                  Close Details
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
