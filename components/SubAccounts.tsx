"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, Plus, AlertCircle } from "lucide-react";
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
import { useRouter } from "next/navigation";

interface SubAccount {
  id: string;
  userId: string;
  name: string;
  exchange: string;
  balance?: number;
  lastUpdated?: string;
  performance?: number;
}

export default function SubAccounts() {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchSubAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
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
      
      if (!Array.isArray(data)) {
        throw new Error("Respuesta inesperada del servidor");
      }

      const subAccountsWithBalance = await Promise.all(
        data.map(async (sub) => {
          try {
            const balanceRes = await fetch(`${API_URL}/account-details/${sub.userId}`, {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            });

            if (!balanceRes.ok) throw new Error("Error al obtener balance");
            const balanceData = await balanceRes.json();
            return { ...sub, balance: balanceData.balance ?? 0 };
          } catch (error) {
            console.error(`❌ Error obteniendo balance de ${sub.name}:`, error);
            return { ...sub, balance: 0 };
          }
        })
      );
      
      setSubAccounts(subAccountsWithBalance);
    } catch (error) {
      console.error("❌ Error obteniendo subcuentas:", error);
      setError("No se pudieron cargar las subcuentas");
    } finally {
      setIsLoading(false);
    }
  }, [router, API_URL]);

  useEffect(() => {
    fetchSubAccounts();
  }, [fetchSubAccounts]);

  const filteredSubAccounts = subAccounts.filter(
    (account) =>
      (account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.exchange.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (activeTab === "all" || account.exchange === activeTab)
  );

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-primary">Subcuentas</h2>
        <Button onClick={fetchSubAccounts} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar Todo
        </Button>
      </div>

      {error && <p className="text-red-500">{error}</p>}
      
      {isLoading ? (
        <p className="text-center text-gray-500">Cargando subcuentas...</p>
      ) : (
        <Card className="shadow-lg">
          <CardHeader className="bg-secondary">
            <CardTitle className="flex items-center justify-between text-2xl">
              <span>Subcuentas</span>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {filteredSubAccounts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="w-full">
              {filteredSubAccounts.length === 0 ? (
                <p className="text-center text-gray-500">No se encontraron subcuentas</p>
              ) : (
                filteredSubAccounts.map((sub) => (
                  <AccordionItem value={sub.id} key={sub.id} className="border-b">
                    <AccordionTrigger>
                      <span className="font-medium text-primary">{sub.name}</span>
                      <Badge variant="secondary">{sub.exchange.toUpperCase()}</Badge>
                      <span className="font-semibold">{sub.balance?.toFixed(2) ?? "0.00"} USDT</span>
                    </AccordionTrigger>
                  </AccordionItem>
                ))
              )}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}