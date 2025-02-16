"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, Plus, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface SubAccount {
  id: string;
  userId: string;
  name: string;
  exchange: string;
  balance: number;
  lastUpdated: string;
  performance: number;
}

export default function SubAccounts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchSubAccounts = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("Error al obtener subcuentas");
      const data = await res.json();
      
      const subAccountsWithBalance = await Promise.all(
        data.map(async (sub: SubAccount) => {
          try {
            const balanceRes = await fetch(`${API_URL}/account-details/${sub.userId}`, {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!balanceRes.ok) throw new Error("Error al obtener balance");
            const balanceData = await balanceRes.json();
            return { ...sub, balance: balanceData.balance ?? 0 };
          } catch {
            return { ...sub, balance: 0 };
          }
        })
      );
      setSubAccounts(subAccountsWithBalance);
    } catch (error) {
      setError("No se pudieron cargar las subcuentas");
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchSubAccounts();
  }, [fetchSubAccounts]);
  
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-primary">Subcuentas</h2>
        <Button onClick={fetchSubAccounts} className="bg-primary hover:bg-primary/90">
          <RefreshCw className="mr-2 h-4 w-4" /> Actualizar Todo
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-secondary">
          <CardTitle className="flex items-center justify-between text-2xl">
            <span>Subcuentas</span>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {isLoading ? "Cargando..." : subAccounts.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-4">
              <RefreshCw className="animate-spin mx-auto h-6 w-6" />
              <span className="mt-2 block">Cargando subcuentas...</span>
            </div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">{error}</div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {subAccounts.map((sub) => (
                <AccordionItem value={sub.id} key={sub.id} className="border-b">
                  <AccordionTrigger className="hover:bg-secondary/50 transition-colors">
                    <div className="grid grid-cols-5 w-full gap-4 items-center">
                      <span className="font-medium text-primary">{sub.name}</span>
                      <Badge variant="secondary" className="w-fit">
                        {sub.exchange.toUpperCase()}
                      </Badge>
                      <span className="font-semibold">{sub.balance.toFixed(2)} USDT</span>
                      <span className={`font-semibold ${sub.performance >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {sub.performance >= 0 ? "+" : ""}{sub.performance.toFixed(2)}%
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(sub.lastUpdated).toLocaleString()}
                      </span>
                    </div>
                  </AccordionTrigger>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
