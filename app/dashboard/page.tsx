"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, RefreshCw, Plus, AlertCircle, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface SubAccount {
  id: string;
  userId: string;
  name: string;
  exchange: string;
  balance?: number;
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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
      console.error("Error obteniendo subcuentas:", error);
      setError("No se pudieron cargar las subcuentas");
    } finally {
      setIsLoading(false);
    }
  }, [router, API_URL]);

  useEffect(() => {
    fetchSubAccounts();
  }, [fetchSubAccounts]);

  const filteredSubAccounts = useMemo(() => {
    return subAccounts.filter(
      (account) =>
        (account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.exchange.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (activeTab === "all" || account.exchange === activeTab)
    );
  }, [subAccounts, activeTab, searchTerm]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button onClick={handleLogout} variant="outline">
              <LogOut size={20} />
            </Button>
          </div>
        </header>
        
        <div className="flex justify-between items-center mb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="binance">Binance</TabsTrigger>
              <TabsTrigger value="bybit">Bybit</TabsTrigger>
              <TabsTrigger value="kraken">Kraken</TabsTrigger>
              <TabsTrigger value="ftx">FTX</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={fetchSubAccounts} variant="outline">
            <RefreshCw size={20} /> Actualizar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subcuentas ({filteredSubAccounts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            
            <Accordion type="single" collapsible>
              {isLoading ? (
                <p>Cargando...</p>
              ) : filteredSubAccounts.length === 0 ? (
                <p>No hay subcuentas disponibles.</p>
              ) : (
                filteredSubAccounts.map((sub) => (
                  <AccordionItem value={sub.id} key={sub.id}>
                    <AccordionTrigger>
                      {sub.name} ({sub.exchange.toUpperCase()})
                    </AccordionTrigger>
                    <AccordionContent>
                      <p>Balance: {sub.balance?.toFixed(2) ?? "0.00"} USDT</p>
                    </AccordionContent>
                  </AccordionItem>
                ))
              )}
            </Accordion>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
