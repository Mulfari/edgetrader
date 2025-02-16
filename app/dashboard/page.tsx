"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface SubAccount {
  id: string;
  userId: string;
  name: string;
  exchange: string;
  balance?: number;
  lastUpdated: string;
  performance: number;
}

export default function SubAccounts() {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchSubAccounts = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error al obtener subcuentas");

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Respuesta inesperada del servidor");

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
          } catch {
            return { ...sub, balance: 0 };
          }
        })
      );

      setSubAccounts(subAccountsWithBalance);
    } catch {
      console.error("No se pudieron cargar las subcuentas");
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
        <Button onClick={fetchSubAccounts} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Actualizar Todo
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Subcuentas ({subAccounts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center">Cargando...</p>
          ) : (
            <Accordion type="single" collapsible>
              {subAccounts.length === 0 ? (
                <p className="text-center">No se encontraron subcuentas</p>
              ) : (
                subAccounts.map((sub) => (
                  <AccordionItem key={sub.id} value={sub.id}>
                    <AccordionTrigger>
                      {sub.name} - {sub.exchange.toUpperCase()} - {sub.balance?.toFixed(2) ?? "0.00"} USDT
                    </AccordionTrigger>
                    <AccordionContent>
                      <p>Última actualización: {new Date(sub.lastUpdated).toLocaleString()}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))
              )}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
