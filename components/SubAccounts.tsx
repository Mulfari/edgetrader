"use client"

import { useState, useEffect } from "react";
import { Search, RefreshCw, Plus, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubAccount, setSelectedSubAccount] = useState<SubAccount | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  // Obtener subcuentas del backend
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/subaccounts");
      const data = await response.json();
      setSubAccounts(data);
    } catch (error) {
      console.error("Error obteniendo subcuentas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener balance de una subcuenta desde Bybit
  const fetchBalance = async (subAccountId: string) => {
    try {
      const response = await fetch(`/api/subaccounts/${subAccountId}/balance`);
      const data = await response.json();
      setBalance(data.balance);
    } catch (error) {
      console.error("Error obteniendo balance de Bybit:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar Todo
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Exchange</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Rendimiento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                Cargando subcuentas...
              </TableCell>
            </TableRow>
          ) : (
            subAccounts.map((sub) => (
              <TableRow
                key={sub.id}
                onClick={() => {
                  setSelectedSubAccount(sub);
                  fetchBalance(sub.id);
                }}
                className="cursor-pointer hover:bg-gray-100"
              >
                <TableCell>{sub.name}</TableCell>
                <TableCell>
                  <Badge>{sub.exchange.toUpperCase()}</Badge>
                </TableCell>
                <TableCell>{sub.balance.toFixed(2)} USDT</TableCell>
                <TableCell className={sub.performance >= 0 ? "text-green-500" : "text-red-500"}>
                  {sub.performance.toFixed(2)}%
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Modal para mostrar balance de Bybit */}
      {selectedSubAccount && (
        <Dialog open={Boolean(selectedSubAccount)} onOpenChange={() => setSelectedSubAccount(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalles de {selectedSubAccount.name}</DialogTitle>
              <DialogDescription>
                <p><strong>Exchange:</strong> {selectedSubAccount.exchange}</p>
                <p><strong>Balance Local:</strong> {selectedSubAccount.balance.toFixed(2)} USDT</p>
                <p><strong>Balance Bybit:</strong> {balance !== null ? `${balance} USDT` : "Cargando..."}</p>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
