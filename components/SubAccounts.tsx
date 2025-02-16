"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { LogOut, CreditCard, Plus, Search, ChevronDown, RefreshCw, AlertCircle, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface SubAccount {
  id: string;
  userId: string;
  name: string;
  exchange: string;
  balance: number;
  lastUpdated: string;
  performance: number;
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Función para obtener subcuentas del backend
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null); // Limpiar errores previos
    try {
      const { data } = await axios.get<SubAccount[]>("/api/subaccounts"); // Reemplaza con tu endpoint real
      setSubAccounts(data);
    } catch (err) {
      console.error("Error al cargar las subcuentas:", err);
      setError("No se pudieron cargar las subcuentas. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    router.push("/login");
  };

  const filteredSubAccounts = subAccounts.filter((account) =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.exchange.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Financiero</h1>
            <div className="flex items-center">
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="ml-8">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
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
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>

          {/* Mostrar error si la solicitud falla */}
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

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
                    <TableCell colSpan={5} className="text-center">
                      <RefreshCw className="animate-spin mx-auto h-6 w-6" />
                      <span className="mt-2 block">Cargando subcuentas...</span>
                    </TableCell>
                  </TableRow>
                ) : filteredSubAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <AlertCircle className="mx-auto mb-2 h-6 w-6" />
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
                        <span className={`font-semibold ${sub.performance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {sub.performance >= 0 ? '+' : ''}{sub.performance.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(sub.lastUpdated).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
