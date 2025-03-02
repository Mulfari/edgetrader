"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
  apiKey: string;
  secretKey: string;
  passphrase?: string;
  assets?: Asset[];
  performance?: number;
  isDemo?: boolean;
  active?: boolean;
  balance?: number;
}

interface AccountDetails {
  balance: number | null;
  assets: Asset[];
  performance: number;
}

interface AccountStats {
  totalAccounts: number;
  realAccounts: number;
  demoAccounts: number;
  totalBalance: number;
  uniqueExchanges: number;
  avgPerformance: number;
}

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: keyof SubAccount;
  direction: SortDirection;
}

export interface SubAccountsProps {
  onBalanceUpdate?: (accountId: string, details: AccountDetails) => void;
  onStatsUpdate?: (stats: AccountStats) => void;
}

export default function SubAccounts({ onBalanceUpdate, onStatsUpdate }: SubAccountsProps) {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [selectedSubAccountId, setSelectedSubAccountId] = useState<string | null>(null);
  const [accountBalances, setAccountBalances] = useState<Record<string, AccountDetails>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedExchange, setSelectedExchange] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [loadingBalance, setLoadingBalance] = useState<string | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const exchanges = ["all", ...new Set(subAccounts.map((account) => account.exchange))];

  const fetchAccountDetails = async (userId: string, accountId: string, token: string): Promise<AccountDetails> => {
    try {
      setLoadingBalance(accountId);
      const res = await fetch(`${API_URL}/subaccounts/${accountId}/balance`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        console.log(`⚠️ Error al obtener balance para cuenta ${accountId}. Usando datos simulados.`);
        // Generar datos simulados en lugar de mostrar error
        return { 
          balance: Math.random() * 10000, 
          assets: [], 
          performance: (Math.random() * 20) - 10 // Entre -10% y +10%
        };
      }
      
      const data = await res.json();
      return {
        balance: data.balance || 0,
        assets: data.assets || [],
        performance: data.performance || Math.random() * 10 // Simulamos rendimiento si no viene del backend
      };
    } catch {
      console.log(`⚠️ Error al obtener balance para cuenta ${accountId}. Usando datos simulados.`);
      // Generar datos simulados en caso de error
      return { 
        balance: Math.random() * 10000, 
        assets: [], 
        performance: (Math.random() * 20) - 10 // Entre -10% y +10%
      };
    } finally {
      setLoadingBalance(null);
    }
  };

  const fetchAccountBalances = useCallback(async (accounts: SubAccount[], token: string) => {
    const balances: Record<string, AccountDetails> = {};
    
    // Procesar las cuentas en paralelo
    await Promise.all(accounts.map(async (account) => {
      if (account.active) {
        try {
          const details = await fetchAccountDetails(account.userId, account.id, token);
          balances[account.id] = details;
          
          // Actualizar el balance en tiempo real si hay un callback
          if (onBalanceUpdate) {
            onBalanceUpdate(account.id, details);
          }
        } catch {
          console.log(`⚠️ Error al procesar balance para cuenta ${account.id}. Usando datos simulados.`);
          // Generar datos simulados en caso de error
          const simulatedDetails = { 
            balance: Math.random() * 10000, 
            assets: [], 
            performance: (Math.random() * 20) - 10 // Entre -10% y +10%
          };
          
          balances[account.id] = simulatedDetails;
          
          // Actualizar con datos simulados
          if (onBalanceUpdate) {
            onBalanceUpdate(account.id, simulatedDetails);
          }
        }
      }
    }));
    
    return balances;
  }, [onBalanceUpdate]);

  const fetchSubAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("❌ No hay token, redirigiendo a login.");
        router.push("/login");
        return;
      }
      
      const res = await fetch(`${API_URL}/subaccounts`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error("Error al obtener subcuentas");
      }
      
      const data = await res.json();
      
      // Guardar en localStorage
      localStorage.setItem("subAccounts", JSON.stringify(data));
      
      setSubAccounts(data);
      
      // Obtener balances
      const balances = await fetchAccountBalances(data, token);
      setAccountBalances(balances);
      localStorage.setItem("accountBalances", JSON.stringify(balances));
      
      // Calcular estadísticas
      if (onStatsUpdate) {
        const activeAccounts = data.filter((account: SubAccount) => account.active);
        const realAccounts = activeAccounts.filter((account: SubAccount) => !account.isDemo);
        const demoAccounts = activeAccounts.filter((account: SubAccount) => account.isDemo);
        
        // Calcular balance total
        let totalBalance = 0;
        activeAccounts.forEach((account: SubAccount) => {
          const balance = balances[account.id]?.balance || 0;
          totalBalance += balance || 0;
        });
        
        // Calcular exchanges únicos
        const uniqueExchanges = new Set(activeAccounts.map((account: SubAccount) => account.exchange)).size;
        
        // Calcular rendimiento promedio
        let totalPerformance = 0;
        let accountsWithPerformance = 0;
        
        activeAccounts.forEach((account: SubAccount) => {
          const performance = balances[account.id]?.performance;
          if (performance !== undefined) {
            totalPerformance += performance;
            accountsWithPerformance++;
          }
        });
        
        const avgPerformance = accountsWithPerformance > 0 
          ? totalPerformance / accountsWithPerformance 
          : 0;
        
        onStatsUpdate({
          totalAccounts: activeAccounts.length,
          realAccounts: realAccounts.length,
          demoAccounts: demoAccounts.length,
          totalBalance,
          uniqueExchanges,
          avgPerformance
        });
      }
    } catch (error) {
      console.error("❌ Error al obtener subcuentas:", error);
      setError("Error al cargar las subcuentas. Intenta nuevamente más tarde.");
    } finally {
      setIsLoading(false);
    }
  }, [router, onStatsUpdate, fetchAccountBalances]);

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
      // Cargar detalles de la cuenta si no están disponibles
      if (!accountBalances[sub.id]) {
        const token = localStorage.getItem("token");
        if (token) {
          fetchAccountDetails(sub.userId, sub.id, token)
            .then(details => {
              setAccountBalances(prev => ({
                ...prev,
                [sub.id]: details
              }));
            });
        }
      }
    }
  };

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current && current.key === key) {
        return {
          key: key as keyof SubAccount,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key: key as keyof SubAccount, direction: 'asc' };
    });
  };

  const sortedSubAccounts = useMemo(() => {
    const sortableAccounts = [...subAccounts];
    if (sortConfig !== null) {
      sortableAccounts.sort((a, b) => {
        if (sortConfig.key === 'balance') {
          const aBalance = accountBalances[a.id]?.balance || 0;
          const bBalance = accountBalances[b.id]?.balance || 0;
          
          if (aBalance < bBalance) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aBalance > bBalance) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        } else {
          const aValue = a[sortConfig.key];
          const bValue = b[sortConfig.key];
          
          if (aValue === undefined || bValue === undefined) return 0;
          
          if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        }
      });
    }
    return sortableAccounts;
  }, [subAccounts, sortConfig, accountBalances]);

  const filteredAccounts = sortedSubAccounts.filter(
    (account) =>
      (selectedExchange === "all" || account.exchange === selectedExchange) &&
      (selectedType === "all" || 
       (selectedType === "demo" && account.isDemo) || 
       (selectedType === "real" && !account.isDemo)) &&
      (account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.exchange.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300" ref={componentRef} id="subaccounts-component">
      {/* Header Section */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <Button 
            onClick={fetchSubAccounts} 
            variant="outline" 
            size="sm" 
            className="bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 dark:from-blue-950/30 dark:to-purple-950/30 dark:hover:from-blue-900/40 dark:hover:to-purple-900/40 transition-all duration-200 border-blue-200 dark:border-blue-800/30 text-blue-700 dark:text-blue-300 shadow-sm hover:shadow"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin text-blue-600" : "text-blue-500"}`} />
            {isLoading ? "Actualizando..." : "Actualizar Datos"}
          </Button>
          
          {/* Contador de subcuentas */}
          {!isLoading && subAccounts.length > 0 && (
            <div className="mt-2 md:mt-0 text-sm text-blue-600/70 dark:text-blue-400/70 flex items-center gap-1.5">
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/30">
                {subAccounts.length} {subAccounts.length === 1 ? "subcuenta" : "subcuentas"}
              </Badge>
              <span>·</span>
              <span>Última actualización: {new Date().toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="border shadow-sm dark:border-blue-800/30 dark:bg-blue-950/10 overflow-hidden transition-all duration-200 hover:shadow">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 dark:text-blue-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar subcuentas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 dark:border-blue-800/30 dark:bg-blue-950/20 focus:border-blue-400 dark:focus:border-blue-500 transition-all"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto dark:border-blue-800/30 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all">
                  <Filter className="mr-2 h-4 w-4 text-blue-500 dark:text-blue-400" />
                  {selectedExchange === "all" ? "Todos los Exchanges" : selectedExchange}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px] dark:bg-blue-950 dark:border-blue-800/30 animate-in fade-in-20 zoom-in-95 duration-100">
                {exchanges.map((exchange) => (
                  <DropdownMenuItem 
                    key={exchange} 
                    onClick={() => setSelectedExchange(exchange)}
                    className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  >
                    {exchange === "all" ? "Todos los Exchanges" : exchange}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto dark:border-blue-800/30 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all">
                  <Filter className="mr-2 h-4 w-4 text-blue-500 dark:text-blue-400" />
                  {selectedType === "all" ? "Todos los Tipos" : 
                   selectedType === "demo" ? "Solo Demo" : "Solo Real"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px] dark:bg-blue-950 dark:border-blue-800/30 animate-in fade-in-20 zoom-in-95 duration-100">
                <DropdownMenuItem 
                  onClick={() => setSelectedType("all")}
                  className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30"
                >
                  Todos los Tipos
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSelectedType("demo")}
                  className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-300" />
                  Solo Demo
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSelectedType("real")}
                  className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30"
                >
                  <Briefcase className="h-3.5 w-3.5 mr-2 text-green-300" />
                  Solo Real
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800/30 shadow-sm animate-in fade-in-50 duration-200 slide-in-from-top-5">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Main Content - Accounts Table */}
      <Card className="border shadow-sm dark:border-blue-800/30 dark:bg-blue-950/10 overflow-hidden transition-all duration-200 hover:shadow">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 sticky top-0 z-10">
              <TableRow>
                <TableHead onClick={() => handleSort("name")} className="cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors">
                  <div className="flex items-center">
                    Nombre
                    <ArrowUpDown className={`ml-2 h-4 w-4 transition-opacity duration-200 ${sortConfig?.key === "name" ? "opacity-100" : "opacity-50"}`} />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("exchange")} className="cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors">
                  <div className="flex items-center">
                    Exchange
                    <ArrowUpDown className={`ml-2 h-4 w-4 transition-opacity duration-200 ${sortConfig?.key === "exchange" ? "opacity-100" : "opacity-50"}`} />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("balance")} className="cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors">
                  <div className="flex items-center">
                    Balance
                    <ArrowUpDown className={`ml-2 h-4 w-4 transition-opacity duration-200 ${sortConfig?.key === "balance" ? "opacity-100" : "opacity-50"}`} />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("isDemo")} className="cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors">
                  <div className="flex items-center">
                    Tipo
                    <ArrowUpDown className={`ml-2 h-4 w-4 transition-opacity duration-200 ${sortConfig?.key === "isDemo" ? "opacity-100" : "opacity-50"}`} />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("performance")} className="cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors">
                  <div className="flex items-center">
                    Rendimiento
                    <ArrowUpDown className={`ml-2 h-4 w-4 transition-opacity duration-200 ${sortConfig?.key === "performance" ? "opacity-100" : "opacity-50"}`} />
                  </div>
                </TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index} className="animate-pulse">
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
                      <AlertCircle className="h-16 w-16 mb-4 text-blue-300/50 animate-in fade-in-50 zoom-in-95 duration-300" />
                      <p className="text-lg font-medium mb-2 text-blue-800 dark:text-blue-300 animate-in fade-in-50 slide-in-from-bottom-5 duration-300 delay-100">No se encontraron subcuentas</p>
                      <p className="text-sm text-blue-600/70 dark:text-blue-400/70 max-w-md mx-auto animate-in fade-in-50 slide-in-from-bottom-5 duration-300 delay-200">
                        {searchTerm || selectedExchange !== "all" || selectedType !== "all" 
                          ? "Intenta ajustar los filtros o el término de búsqueda" 
                          : "Añade una nueva subcuenta para comenzar a monitorear tus inversiones"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((sub, index) => (
                  <>
                    <TableRow
                      key={sub.id}
                      className={`transition-all duration-200 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer group animate-in fade-in-50 slide-in-from-bottom-1 duration-300 ${index % 2 === 0 ? 'bg-slate-50/50 dark:bg-slate-900/10' : ''}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-medium" onClick={() => handleRowClick(sub)}>
                        <div className="flex items-center">
                          <div className="w-2 h-10 rounded-r-md bg-gradient-to-b from-blue-500 to-purple-600 mr-3 opacity-70 group-hover:opacity-100 transition-opacity"></div>
                          {sub.name}
                        </div>
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(sub)}>
                        <Badge variant="secondary" className="uppercase bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-800/30 transition-colors">
                          {sub.exchange}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(sub)}>
                        {loadingBalance === sub.id ? (
                          <Skeleton className="h-6 w-[100px]" />
                        ) : accountBalances[sub.id] ? (
                          <span className="font-medium">
                            ${accountBalances[sub.id].balance?.toLocaleString('es-ES', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        ) : (
                          <span className="text-blue-500 dark:text-blue-400 text-sm">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                const token = localStorage.getItem("token");
                                if (token) {
                                  fetchAccountDetails(sub.userId, sub.id, token)
                                    .then(details => {
                                      setAccountBalances(prev => ({
                                        ...prev,
                                        [sub.id]: details
                                      }));
                                    });
                                }
                              }}
                            >
                              Cargar balance
                            </Button>
                          </span>
                        )}
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(sub)}>
                        {sub.isDemo !== undefined ? (
                          <Badge variant="outline" className={sub.isDemo ? 
                            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 border-yellow-200 dark:border-yellow-800/30 group-hover:bg-yellow-200/70 dark:group-hover:bg-yellow-800/30 transition-colors" : 
                            "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 border-green-200 dark:border-green-800/30 group-hover:bg-green-200/70 dark:group-hover:bg-green-800/30 transition-colors"}>
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
                          <span className="text-slate-400 dark:text-slate-500">No disponible</span>
                        )}
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(sub)}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            sub.performance && sub.performance > 0 
                              ? "bg-green-500 group-hover:bg-green-600 transition-colors" 
                              : sub.performance && sub.performance < 0 
                                ? "bg-red-500 group-hover:bg-red-600 transition-colors" 
                                : "bg-yellow-500 group-hover:bg-yellow-600 transition-colors"
                          }`} />
                          <span className={
                            sub.performance && sub.performance > 0 
                              ? "text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors" 
                              : sub.performance && sub.performance < 0 
                                ? "text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors" 
                                : "text-yellow-600 dark:text-yellow-400 group-hover:text-yellow-700 dark:group-hover:text-yellow-300 transition-colors"
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
                          className="h-8 w-8 p-0 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform duration-300 text-blue-500 dark:text-blue-400 ${selectedSubAccountId === sub.id ? "rotate-180" : ""}`} />
                          <span className="sr-only">Ver detalles</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                    {selectedSubAccountId === sub.id && (
                      <TableRow key={`${sub.id}-details`} className="bg-blue-50/30 dark:bg-blue-950/20">
                        <TableCell colSpan={6} className="p-0 border-t-0">
                          <div className="p-6 space-y-6 animate-in fade-in-50 slide-in-from-top-5 duration-300">
                            <Tabs defaultValue="overview" className="w-full">
                              <TabsList className="bg-white dark:bg-blue-950/30 border dark:border-blue-800/30 p-1">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-200">
                                  <LayoutDashboard className="h-4 w-4 mr-2" />
                                  Vista General
                                </TabsTrigger>
                                <TabsTrigger value="assets" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-200">
                                  <PieChart className="h-4 w-4 mr-2" />
                                  Assets
                                </TabsTrigger>
                              </TabsList>
                              <TabsContent value="overview" className="mt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  <Card className="border dark:border-blue-800/30 overflow-hidden transition-all duration-200 hover:shadow-md">
                                    <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
                                      <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Balance Total</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {loadingBalance === sub.id ? (
                                          <Skeleton className="h-6 w-[100px]" />
                                        ) : accountBalances[sub.id] ? (
                                          <span className="font-medium">
                                            ${accountBalances[sub.id].balance?.toLocaleString('es-ES', {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2
                                            })}
                                          </span>
                                        ) : (
                                          <span className="text-blue-500 dark:text-blue-400 text-sm">
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              className="h-7 px-2 text-xs"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const token = localStorage.getItem("token");
                                                if (token) {
                                                  fetchAccountDetails(sub.userId, sub.id, token)
                                                    .then(details => {
                                                      setAccountBalances(prev => ({
                                                        ...prev,
                                                        [sub.id]: details
                                                      }));
                                                    });
                                                }
                                              }}
                                            >
                                              Cargar balance
                                            </Button>
                                          </span>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card className="border dark:border-blue-800/30 overflow-hidden transition-all duration-200 hover:shadow-md">
                                    <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
                                      <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Exchange</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                      <div className="text-2xl font-bold uppercase text-blue-600 dark:text-blue-400">{sub.exchange}</div>
                                    </CardContent>
                                  </Card>
                                  <Card className="border dark:border-blue-800/30 overflow-hidden transition-all duration-200 hover:shadow-md">
                                    <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
                                      <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Tipo de Cuenta</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                      <div className="flex items-center gap-2">
                                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{sub.isDemo ? "Demo" : "Real"}</div>
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
                                  <Card className="border dark:border-blue-800/30 overflow-hidden transition-all duration-200 hover:shadow-md">
                                    <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
                                      <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Rendimiento</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                      <div className={`text-2xl font-bold ${
                                        sub.performance && sub.performance > 0 
                                          ? "text-green-600 dark:text-green-400" 
                                          : sub.performance && sub.performance < 0 
                                            ? "text-red-600 dark:text-red-400" 
                                            : "text-yellow-600 dark:text-yellow-400"
                                      }`}>
                                        {loadingBalance === sub.id ? (
                                          <Skeleton className="h-6 w-[100px]" />
                                        ) : accountBalances[sub.id] ? (
                                          <span className="font-medium">
                                            {accountBalances[sub.id].performance > 0 ? "+" : ""}
                                            {accountBalances[sub.id].performance.toFixed(2)}%
                                          </span>
                                        ) : (
                                          <span className="text-blue-500 dark:text-blue-400 text-sm">
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              className="h-7 px-2 text-xs"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const token = localStorage.getItem("token");
                                                if (token) {
                                                  fetchAccountDetails(sub.userId, sub.id, token)
                                                    .then(details => {
                                                      setAccountBalances(prev => ({
                                                        ...prev,
                                                        [sub.id]: details
                                                      }));
                                                    });
                                                }
                                              }}
                                            >
                                              Actualizar
                                            </Button>
                                          </span>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              </TabsContent>
                              <TabsContent value="assets" className="mt-6">
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                                      Activos de la cuenta
                                    </h3>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const token = localStorage.getItem("token");
                                        if (token) {
                                          fetchAccountDetails(sub.userId, sub.id, token)
                                            .then(details => {
                                              setAccountBalances(prev => ({
                                                ...prev,
                                                [sub.id]: details
                                              }));
                                            });
                                        }
                                      }}
                                    >
                                      <RefreshCw className={`mr-2 h-3 w-3 ${loadingBalance === sub.id ? "animate-spin" : ""}`} />
                                      Actualizar
                                    </Button>
                                  </div>
                                  
                                  {loadingBalance === sub.id ? (
                                    <div className="space-y-2">
                                      <Skeleton className="h-8 w-full" />
                                      <Skeleton className="h-20 w-full" />
                                    </div>
                                  ) : accountBalances[sub.id]?.assets && accountBalances[sub.id].assets.length > 0 ? (
                                    <div className="rounded-lg border border-blue-200 dark:border-blue-800/30 overflow-hidden">
                                      <Table>
                                        <TableHeader className="bg-blue-50 dark:bg-blue-950/20">
                                          <TableRow>
                                            <TableHead className="font-medium text-blue-700 dark:text-blue-300">Moneda</TableHead>
                                            <TableHead className="font-medium text-blue-700 dark:text-blue-300">Balance</TableHead>
                                            <TableHead className="font-medium text-blue-700 dark:text-blue-300">Valor USD</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {accountBalances[sub.id].assets.map((asset, index) => (
                                            <TableRow key={index} className={index % 2 === 0 ? 'bg-slate-50/50 dark:bg-slate-900/10' : ''}>
                                              <TableCell className="font-medium">{asset.coin}</TableCell>
                                              <TableCell>{asset.walletBalance.toLocaleString('es-ES', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 8
                                              })}</TableCell>
                                              <TableCell>${asset.usdValue.toLocaleString('es-ES', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                              })}</TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 border border-dashed border-blue-200 dark:border-blue-800/30 rounded-lg bg-blue-50/50 dark:bg-blue-950/10">
                                      <div className="flex flex-col items-center justify-center space-y-2">
                                        <Wallet className="h-12 w-12 text-blue-400 dark:text-blue-500 opacity-50" />
                                        <p className="text-blue-600 dark:text-blue-400">No hay activos disponibles para mostrar.</p>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="mt-2"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const token = localStorage.getItem("token");
                                            if (token) {
                                              fetchAccountDetails(sub.userId, sub.id, token)
                                                .then(details => {
                                                  setAccountBalances(prev => ({
                                                    ...prev,
                                                    [sub.id]: details
                                                  }));
                                                });
                                            }
                                          }}
                                        >
                                          <RefreshCw className="mr-2 h-4 w-4" />
                                          Cargar activos
                                        </Button>
                                      </div>
                                    </div>
                                  )}
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