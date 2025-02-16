"use client";

import { useState } from "react";
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

interface SubAccountsProps {
  subAccounts: SubAccount[];
  isLoading: boolean;
  fetchData: () => void;
}

export default function SubAccounts({ subAccounts, isLoading, fetchData }: SubAccountsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Filtrar subcuentas por búsqueda y exchange seleccionado
  const filteredSubAccounts = Array.isArray(subAccounts)
    ? subAccounts.filter(
        (account) =>
          (account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.exchange.toLowerCase().includes(searchTerm.toLowerCase())) &&
          (activeTab === "all" || account.exchange === activeTab)
      )
    : [];

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar subcuentas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>
        <div className="flex space-x-4">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar Todo
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" /> Agregar Subcuenta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nueva Subcuenta</DialogTitle>
                <DialogDescription>Ingrese los detalles de la nueva subcuenta aquí.</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="binance">Binance</TabsTrigger>
          <TabsTrigger value="bybit">Bybit</TabsTrigger>
          <TabsTrigger value="kraken">Kraken</TabsTrigger>
          <TabsTrigger value="ftx">FTX</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Exchange</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Rendimiento</TableHead>
              <TableHead>Última Actualización</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  <RefreshCw className="animate-spin mx-auto h-6 w-6 text-gray-500" />
                  <span className="mt-2 block">Cargando subcuentas...</span>
                </TableCell>
              </TableRow>
            ) : filteredSubAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  <AlertCircle className="mx-auto mb-2 h-6 w-6 text-gray-500" />
                  No se encontraron subcuentas
                </TableCell>
              </TableRow>
            ) : (
              filteredSubAccounts.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{sub.exchange.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{sub.balance.toFixed(2)} USDT</span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${sub.performance >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {sub.performance >= 0 ? "+" : ""}
                      {sub.performance.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    {sub.lastUpdated
                      ? new Intl.DateTimeFormat("es-ES", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(sub.lastUpdated))
                      : "No disponible"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
