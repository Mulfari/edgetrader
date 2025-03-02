"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Wallet,
  ArrowUpDown,
  Filter,
  Sparkles,
  Briefcase,
  PieChart,
  LayoutDashboard
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Asset {
  coin: string;
  walletBalance: number;
  usdValue: number;
}

interface SubAccount {
  id: string;
  userId: string;
  name: string;
  exchange: string;
  balance?: number;
  lastUpdated?: string;
  assets?: Asset[];
  performance?: number; // Añadimos el campo de rendimiento
  isDemo?: boolean; // Añadimos el campo isDemo para identificar el tipo de cuenta
}

interface AccountDetailsResponse {
  list: {
    totalEquity: string;
    coin: {
      coin: string;
      walletBalance: string;
      usdValue: string;
    }[];
  }[];
}

type SortConfig = {
  key: keyof SubAccount;
  direction: "asc" | "desc";
} | null;

interface SubAccountsProps {
  onBalanceUpdate?: (totalBalance: number) => void;
  onStatsUpdate?: (stats: { 
    total: number; 
    real: number; 
    demo: number; 
    exchanges: number; 
    performance: number 
  }) => void;
}

export default function SubAccounts({ onBalanceUpdate, onStatsUpdate }: SubAccountsProps) {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [selectedSubAccountId, setSelectedSubAccountId] = useState<string | null>(null);
  const [accountBalances, setAccountBalances] = useState<Record<string, number | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [selectedExchange, setSelectedExchange] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const componentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const exchanges = ["all", ...new Set(subAccounts.map((account) => account.exchange))];

  const fetchAccountDetails = useCallback(async (userId: string, subAccountId: string, token: string) => {
    if (!API_URL || !userId || !token) return { balance: null, assets: [] };

    try {
      const res = await fetch(`${API_URL}/account-details/${userId}/${subAccountId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Error al obtener detalles de la cuenta");

      const data: AccountDetailsResponse = await res.json();
      console.log("Detalles de la cuenta:", data);
      if (!data || !data.list || data.list.length === 0) {
        console.error("❌ La respuesta de Bybit no contiene 'list' o está vacía:", data);
        return { balance: 0, assets: [], rawData: data };
      }

      return {
        balance: parseFloat(data.list[0]?.totalEquity ?? "0"),
        assets: data.list[0]?.coin?.map((coin) => ({
          coin: coin.coin,
          walletBalance: parseFloat(coin.walletBalance) || 0,
          usdValue: parseFloat(coin.usdValue) || 0,
        })) || [],
        rawData: data,
      };

    } catch (error) {
      console.error("❌ Error obteniendo detalles de la cuenta:", error);
      return { balance: null, assets: [] };
    }
  }, []);

  const fetchSubAccounts = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No hay token, redirigiendo a login.");
      router.push("/login");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          console.error("❌ Token inválido, redirigiendo a login.");
          localStorage.removeItem("token");
          router.push("/login");
        }
        throw new Error(`Error al obtener subcuentas - Código ${res.status}`);
      }

      const data = await res.json();
      console.log("Respuesta del backend:", data);
      setSubAccounts(data);

      const balances: Record<string, number | null> = {};
      let totalBalance = 0;
      const updatedSubAccounts = await Promise.all(
        data.map(async (sub: SubAccount) => {
          const details = await fetchAccountDetails(sub.userId, sub.id, token);
          balances[sub.id] = details.balance;
          sub.assets = details.assets;
          sub.performance = Math.random() * 100;
          sub.isDemo = sub.isDemo !== undefined ? sub.isDemo : false;
          if (details.balance !== null) {
            totalBalance += details.balance;
          }
          return sub;
        })
      );
      setSubAccounts(updatedSubAccounts);
      setAccountBalances(balances);
      if (onBalanceUpdate) {
        onBalanceUpdate(totalBalance);
      }
      
      // Enviar estadísticas al dashboard
      if (onStatsUpdate) {
        const realAccounts = updatedSubAccounts.filter((acc: SubAccount) => !acc.isDemo).length;
        const demoAccounts = updatedSubAccounts.filter((acc: SubAccount) => acc.isDemo).length;
        const uniqueExchanges = new Set(updatedSubAccounts.map((acc: SubAccount) => acc.exchange)).size;
        const avgPerformance = updatedSubAccounts.length > 0 
          ? updatedSubAccounts.reduce((sum: number, acc: SubAccount) => sum + (acc.performance || 0), 0) / updatedSubAccounts.length
          : 0;
          
        onStatsUpdate({
          total: updatedSubAccounts.length,
          real: realAccounts,
          demo: demoAccounts,
          exchanges: uniqueExchanges,
          performance: avgPerformance
        });
      }
      
      localStorage.setItem("subAccounts", JSON.stringify(updatedSubAccounts));
      localStorage.setItem("accountBalances", JSON.stringify(balances));
    } catch (error) {
      console.error("❌ Error obteniendo subcuentas:", error);
      setError("No se pudieron cargar las subcuentas");
    } finally {
      setIsLoading(false);
    }
  }, [fetchAccountDetails, router, onBalanceUpdate, onStatsUpdate]);

  useEffect(() => {
    const storedSubAccounts = localStorage.getItem("subAccounts");
    const storedAccountBalances = localStorage.getItem("accountBalances");

    if (storedSubAccounts && storedAccountBalances) {
      const parsedSubAccounts = JSON.parse(storedSubAccounts);
      setSubAccounts(parsedSubAccounts);
      setAccountBalances(JSON.parse(storedAccountBalances));
      setIsLoading(false);
      
      // Enviar estadísticas al dashboard
      if (onStatsUpdate) {
        const realAccounts = parsedSubAccounts.filter((acc: SubAccount) => !acc.isDemo).length;
        const demoAccounts = parsedSubAccounts.filter((acc: SubAccount) => acc.isDemo).length;
        const uniqueExchanges = new Set(parsedSubAccounts.map((acc: SubAccount) => acc.exchange)).size;
        const avgPerformance = parsedSubAccounts.length > 0 
          ? parsedSubAccounts.reduce((sum: number, acc: SubAccount) => sum + (acc.performance || 0), 0) / parsedSubAccounts.length
          : 0;
          
        onStatsUpdate({
          total: parsedSubAccounts.length,
          real: realAccounts,
          demo: demoAccounts,
          exchanges: uniqueExchanges,
          performance: avgPerformance
        });
      }
    } else {
      fetchSubAccounts();
    }
  }, [fetchSubAccounts, onStatsUpdate]);

  useEffect(() => {
    const handleRefresh = () => {
      console.log("Evento refresh recibido en SubAccounts");
      fetchSubAccounts();
    };

    // Usar el elemento actual o el elemento padre
    const element = componentRef.current || document.getElementById('subaccounts-component');
    if (element) {
      console.log("Agregando event listener para refresh en SubAccounts");
      element.addEventListener('refresh', handleRefresh);
      
      return () => {
        console.log("Eliminando event listener para refresh en SubAccounts");
        element.removeEventListener('refresh', handleRefresh);
      };
    } else {
      console.error("No se pudo encontrar el elemento para agregar el event listener en SubAccounts");
    }
  }, [fetchSubAccounts]);

  const handleRowClick = (sub: SubAccount) => {
    if (selectedSubAccountId === sub.id) {
      setSelectedSubAccountId(null);
    } else {
      setSelectedSubAccountId(sub.id);
    }
  };

  const handleSort = (key: keyof SubAccount) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === "asc") {
          return { key, direction: "desc" };
        }
        return null;
      }
      return { key, direction: "asc" };
    });
  };

  const sortedAccounts = [...subAccounts].sort((a, b) => {
    if (!sortConfig) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue === undefined || bValue === undefined) return 0;

    if (sortConfig.direction === "asc") {
      return aValue < bValue ? -1 : 1;
    } else {
      return aValue > bValue ? -1 : 1;
    }
  });

  const filteredAccounts = sortedAccounts.filter(
    (account) =>
      (selectedExchange === "all" || account.exchange === selectedExchange) &&
      (selectedType === "all" || 
       (selectedType === "demo" && account.isDemo) || 
       (selectedType === "real" && !account.isDemo)) &&
      (account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.exchange.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6" ref={componentRef} id="subaccounts-component">
      {/* Header Section */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            {/* Eliminado el título "Subcuentas" */}
          </div>
          <Button 
            onClick={fetchSubAccounts} 
            variant="default" 
            size="sm" 
            className="mt-2 md:mt-0"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar Datos
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="border shadow-sm dark:border-blue-800/30 dark:bg-blue-950/10">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar subcuentas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 dark:border-blue-800/30 dark:bg-blue-950/20"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto dark:border-blue-800/30 dark:bg-blue-950/20">
                  <Filter className="mr-2 h-4 w-4" />
                  {selectedExchange === "all" ? "Todos los Exchanges" : selectedExchange}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px] dark:bg-blue-950 dark:border-blue-800/30">
                {exchanges.map((exchange) => (
                  <DropdownMenuItem 
                    key={exchange} 
                    onClick={() => setSelectedExchange(exchange)}
                    className="cursor-pointer"
                  >
                    {exchange === "all" ? "Todos los Exchanges" : exchange}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto dark:border-blue-800/30 dark:bg-blue-950/20">
                  <Filter className="mr-2 h-4 w-4" />
                  {selectedType === "all" ? "Todos los Tipos" : 
                   selectedType === "demo" ? "Solo Demo" : "Solo Real"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px] dark:bg-blue-950 dark:border-blue-800/30">
                <DropdownMenuItem 
                  onClick={() => setSelectedType("all")}
                  className="cursor-pointer"
                >
                  Todos los Tipos
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSelectedType("demo")}
                  className="cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-500" />
                  Solo Demo
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSelectedType("real")}
                  className="cursor-pointer"
                >
                  <Briefcase className="h-3.5 w-3.5 mr-2 text-green-500" />
                  Solo Real
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800/30 shadow-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Main Content - Accounts Table */}
      <Card className="border shadow-sm dark:border-blue-800/30 dark:bg-blue-950/10">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50 dark:bg-blue-950/30">
              <TableRow>
                <TableHead onClick={() => handleSort("name")} className="cursor-pointer hover:bg-muted/80 dark:hover:bg-blue-900/20 transition-colors">
                  <div className="flex items-center">
                    Nombre
                    <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("exchange")} className="cursor-pointer hover:bg-muted/80 dark:hover:bg-blue-900/20 transition-colors">
                  <div className="flex items-center">
                    Exchange
                    <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("balance")} className="cursor-pointer hover:bg-muted/80 dark:hover:bg-blue-900/20 transition-colors">
                  <div className="flex items-center">
                    Balance
                    <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("isDemo")} className="cursor-pointer hover:bg-muted/80 dark:hover:bg-blue-900/20 transition-colors">
                  <div className="flex items-center">
                    Tipo
                    <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("performance")} className="cursor-pointer hover:bg-muted/80 dark:hover:bg-blue-900/20 transition-colors">
                  <div className="flex items-center">
                    Rendimiento
                    <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-5 w-[150px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-[120px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-[80px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-[200px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-[20px] ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-[300px]">
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                      <AlertCircle className="h-16 w-16 mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium mb-2">No se encontraron subcuentas</p>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        {searchTerm || selectedExchange !== "all" || selectedType !== "all" 
                          ? "Intenta ajustar los filtros o el término de búsqueda" 
                          : "Añade una nueva subcuenta para comenzar a monitorear tus inversiones"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((sub) => (
                  <>
                    <TableRow
                      key={sub.id}
                      className="transition-all duration-200 hover:bg-muted/50 dark:hover:bg-blue-900/20 cursor-pointer"
                    >
                      <TableCell className="font-medium" onClick={() => handleRowClick(sub)}>
                        <div className="flex items-center">
                          <div className="w-2 h-10 rounded-r-md bg-primary mr-3 opacity-70"></div>
                          {sub.name}
                        </div>
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(sub)}>
                        <Badge variant="secondary" className="uppercase">
                          {sub.exchange}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(sub)}>
                        {accountBalances[sub.id] !== undefined ? (
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-primary" />
                            <span className="font-medium">{accountBalances[sub.id]?.toFixed(2)} USDT</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(sub)}>
                        {sub.isDemo !== undefined ? (
                          <Badge variant="outline" className={sub.isDemo ? 
                            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 border-yellow-200 dark:border-yellow-800/30" : 
                            "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 border-green-200 dark:border-green-800/30"}>
                            {sub.isDemo ? (
                              <div className="flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                <span>Demo</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                <span>Real</span>
                              </div>
                            )}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(sub)}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            sub.performance && sub.performance > 0 
                              ? "bg-green-500" 
                              : sub.performance && sub.performance < 0 
                                ? "bg-red-500" 
                                : "bg-yellow-500"
                          }`} />
                          <span className={
                            sub.performance && sub.performance > 0 
                              ? "text-green-600 dark:text-green-400" 
                              : sub.performance && sub.performance < 0 
                                ? "text-red-600 dark:text-red-400" 
                                : ""
                          }>
                            {sub.performance !== undefined ? `${sub.performance.toFixed(2)}%` : "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRowClick(sub)}
                          className="h-8 w-8 p-0 rounded-full"
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${selectedSubAccountId === sub.id ? "rotate-180" : ""}`} />
                          <span className="sr-only">Ver detalles</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                    {selectedSubAccountId === sub.id && (
                      <TableRow key={`${sub.id}-details`} className="bg-muted/30 dark:bg-blue-950/20">
                        <TableCell colSpan={6} className="p-0 border-t-0">
                          <div className="p-6 space-y-6 animate-in fade-in-50 duration-200">
                            <Tabs defaultValue="overview" className="w-full">
                              <TabsList className="bg-background border dark:bg-blue-950/30 dark:border-blue-800/30">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                  <LayoutDashboard className="h-4 w-4 mr-2" />
                                  Vista General
                                </TabsTrigger>
                                <TabsTrigger value="assets" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                  <PieChart className="h-4 w-4 mr-2" />
                                  Assets
                                </TabsTrigger>
                              </TabsList>
                              <TabsContent value="overview" className="mt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  <Card>
                                    <CardHeader className="pb-2 bg-blue-50 dark:bg-blue-950/20">
                                      <CardTitle className="text-sm font-medium text-muted-foreground dark:text-blue-300">Balance Total</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {accountBalances[sub.id] !== undefined
                                          ? `${accountBalances[sub.id]?.toFixed(2)} USDT`
                                          : "No disponible"}
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardHeader className="pb-2 bg-purple-50 dark:bg-purple-950/20">
                                      <CardTitle className="text-sm font-medium text-muted-foreground dark:text-purple-300">Exchange</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                      <div className="text-2xl font-bold uppercase text-purple-600 dark:text-purple-400">{sub.exchange}</div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardHeader className="pb-2 bg-amber-50 dark:bg-amber-950/20">
                                      <CardTitle className="text-sm font-medium text-muted-foreground dark:text-amber-300">Tipo de Cuenta</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                      <div className="flex items-center gap-2">
                                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{sub.isDemo ? "Demo" : "Real"}</div>
                                        <Badge variant="outline" className={sub.isDemo ? 
                                          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 border-yellow-200 dark:border-yellow-800/30" : 
                                          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 border-green-200 dark:border-green-800/30"}>
                                          {sub.isDemo ? (
                                            <div className="flex items-center gap-1">
                                              <Sparkles className="h-3 w-3" />
                                              <span>Práctica</span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1">
                                              <Briefcase className="h-3 w-3" />
                                              <span>Fondos Reales</span>
                                            </div>
                                          )}
                                        </Badge>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardHeader className="pb-2 bg-green-50 dark:bg-green-950/20">
                                      <CardTitle className="text-sm font-medium text-muted-foreground dark:text-green-300">Rendimiento</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                      <div className={`text-2xl font-bold ${
                                        sub.performance && sub.performance > 0 
                                          ? "text-green-600 dark:text-green-400" 
                                          : sub.performance && sub.performance < 0 
                                            ? "text-red-600 dark:text-red-400" 
                                            : "text-yellow-600 dark:text-yellow-400"
                                      }`}>
                                        {sub.performance !== undefined ? `${sub.performance.toFixed(2)}%` : "No disponible"}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              </TabsContent>
                              <TabsContent value="assets" className="mt-6">
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-lg flex items-center gap-2">
                                      <Wallet className="h-5 w-5 text-primary" />
                                      Todos los Assets
                                    </h4>
                                    <Button variant="outline" size="sm" className="gap-1">
                                      <RefreshCw className="h-3.5 w-3.5" />
                                      Actualizar
                                    </Button>
                                  </div>
                                  <Card>
                                    <CardContent className="p-0">
                                      <Table>
                                        <TableHeader className="bg-muted/50 dark:bg-blue-950/30">
                                          <TableRow>
                                            <TableHead>Token</TableHead>
                                            <TableHead>Balance</TableHead>
                                            <TableHead>Valor USD</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {sub.assets?.length ? (
                                            sub.assets.map((asset) => (
                                              <TableRow key={asset.coin} className="hover:bg-muted/50 dark:hover:bg-blue-900/20 transition-colors">
                                                <TableCell className="font-medium">{asset.coin}</TableCell>
                                                <TableCell>{asset.walletBalance} {asset.coin}</TableCell>
                                                <TableCell>${asset.usdValue}</TableCell>
                                              </TableRow>
                                            ))
                                          ) : (
                                            <TableRow>
                                              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground dark:text-blue-300/70">
                                                No hay assets disponibles
                                              </TableCell>
                                            </TableRow>
                                          )}
                                        </TableBody>
                                      </Table>
                                    </CardContent>
                                  </Card>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}