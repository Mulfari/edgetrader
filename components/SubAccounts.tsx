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
  LayoutDashboard,
  Plus
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
  isSimulated?: boolean;
  isDemo?: boolean;
  isError?: boolean;
  error?: string;
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
  const [selectedType, setSelectedType] = useState<string>("all");
  const [loadingBalance, setLoadingBalance] = useState<string | null>(null);
  const [isLoadingAllBalances, setIsLoadingAllBalances] = useState(false);
  const [balancesInitiallyLoaded, setBalancesInitiallyLoaded] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchAccountDetails = async (userId: string, accountId: string, token: string): Promise<AccountDetails> => {
    try {
      setLoadingBalance(accountId);
      console.log(`🔍 Solicitando balance para cuenta ${accountId}...`);
      
      // Buscar la cuenta para verificar si es demo o real
      const account = subAccounts.find(acc => acc.id === accountId);
      const isDemo = account?.isDemo === true;
      
      console.log(`📊 Tipo de cuenta: ${isDemo ? 'Demo' : 'Real'}, Exchange: ${account?.exchange}`);
      
      const res = await fetch(`${API_URL}/subaccounts/${accountId}/balance`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(`❌ Error al obtener balance para cuenta ${accountId}:`, errorData);
        console.error(`   Status: ${res.status} ${res.statusText}`);
        
        // Detectar error de restricción geográfica
        const isGeoRestriction = 
          errorData.message?.includes('ubicación geográfica') || 
          errorData.message?.includes('CloudFront') ||
          errorData.statusCode === 403;
        
        if (isDemo) {
          console.log(`⚠️ Cuenta demo ${accountId}: Usando datos simulados.`);
          // Solo generar datos simulados para cuentas demo
          return { 
            balance: Math.random() * 10000, 
            assets: [
              { coin: 'BTC', walletBalance: Math.random() * 0.5, usdValue: Math.random() * 5000 },
              { coin: 'ETH', walletBalance: Math.random() * 5, usdValue: Math.random() * 3000 },
              { coin: 'USDT', walletBalance: Math.random() * 5000, usdValue: Math.random() * 5000 }
            ], 
            performance: (Math.random() * 20) - 10, // Entre -10% y +10%
            isSimulated: true,
            isDemo: true,
            isError: false
          };
        } else {
          // Para cuentas reales, lanzar un error que será capturado por el catch
          let errorMessage = errorData.message || errorData.error || 'Error al obtener balance real';
          
          // Mensaje específico para restricción geográfica
          if (isGeoRestriction) {
            errorMessage = 'La API de Bybit no está disponible en tu ubicación geográfica. Considera usar una VPN o contactar con soporte.';
          }
          
          throw new Error(errorMessage);
        }
      }
      
      const data = await res.json();
      console.log(`✅ Datos recibidos para cuenta ${accountId}:`, {
        balance: data.balance,
        assetsCount: data.assets?.length || 0,
        isSimulated: data.isSimulated,
        isDemo: data.isDemo
      });
      
      // Importante: No generar datos simulados aquí si la cuenta es demo
      // Usar los datos que devuelve el backend
      return {
        balance: data.balance || 0,
        assets: data.assets || [],
        performance: data.performance || 0,
        isSimulated: data.isSimulated || false,
        isDemo: isDemo, // Usar el valor de isDemo de la cuenta, no del backend
        isError: false
      };
    } catch (error: unknown) {
      console.error(`❌ Error al obtener balance para cuenta ${accountId}:`, error);
      
      // Buscar la cuenta para verificar si es demo o real
      const account = subAccounts.find(acc => acc.id === accountId);
      const isDemo = account?.isDemo === true;
      
      if (isDemo) {
        console.log(`⚠️ Cuenta demo ${accountId}: Usando datos simulados debido al error.`);
        // Solo generar datos simulados para cuentas demo
        return { 
          balance: Math.random() * 10000, 
          assets: [
            { coin: 'BTC', walletBalance: Math.random() * 0.5, usdValue: Math.random() * 5000 },
            { coin: 'ETH', walletBalance: Math.random() * 5, usdValue: Math.random() * 3000 },
            { coin: 'USDT', walletBalance: Math.random() * 5000, usdValue: Math.random() * 5000 }
          ], 
          performance: (Math.random() * 20) - 10, // Entre -10% y +10%
          isSimulated: true,
          isDemo: true,
          isError: false
        };
      } else {
        // Para cuentas reales, establecer un objeto con error
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener balance';
        setError(`Error al obtener balance de la cuenta real: ${errorMessage}`);
        return { 
          balance: null, 
          assets: [], 
          performance: 0,
          error: errorMessage,
          isError: true,
          isSimulated: false,
          isDemo: false
        };
      }
    } finally {
      setLoadingBalance(null);
    }
  };

  // Función para cargar automáticamente los balances de todas las subcuentas
  const loadAllBalances = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || subAccounts.length === 0) return;
    
    console.log("🔄 Cargando balances para todas las subcuentas automáticamente...");
    setIsLoadingAllBalances(true);
    
    try {
      const activeAccounts = subAccounts.filter(acc => acc.active);
      const balancesPromises = activeAccounts.map(acc => 
        fetchAccountDetails(acc.userId, acc.id, token)
          .then(details => ({ id: acc.id, details }))
      );
      
      const results = await Promise.allSettled(balancesPromises);
      
      const newBalances = { ...accountBalances };
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { id, details } = result.value;
          newBalances[id] = details;
          
          if (onBalanceUpdate) {
            onBalanceUpdate(id, details);
          }
        }
      });
      
      setAccountBalances(newBalances);
      setBalancesInitiallyLoaded(true);
    } catch (error) {
      console.error("Error al cargar todos los balances:", error);
    } finally {
      setIsLoadingAllBalances(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subAccounts, fetchAccountDetails, onBalanceUpdate]);

  const fetchAccountBalances = useCallback(async (accounts: SubAccount[], token: string) => {
    console.log(`🔄 Obteniendo balances para ${accounts.length} subcuentas...`);
    setIsLoadingAllBalances(true);
    
    const balances: Record<string, AccountDetails> = {};
    
    await Promise.all(accounts.map(async (account) => {
      if (account.active) {
        try {
          const details = await fetchAccountDetails(account.userId, account.id, token);
          balances[account.id] = details;
          
          if (onBalanceUpdate) {
            onBalanceUpdate(account.id, details);
          }
        } catch (error) {
          console.error(`Error al obtener balance para cuenta ${account.id}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          
          // Si es una cuenta demo, generar datos simulados
          if (account.isDemo) {
            console.log(`⚠️ Cuenta demo ${account.id}: Usando datos simulados debido al error.`);
            const demoDetails: AccountDetails = { 
              balance: Math.random() * 10000, 
              assets: [
                { coin: 'BTC', walletBalance: Math.random() * 0.5, usdValue: Math.random() * 5000 },
                { coin: 'ETH', walletBalance: Math.random() * 5, usdValue: Math.random() * 3000 },
                { coin: 'USDT', walletBalance: Math.random() * 5000, usdValue: Math.random() * 5000 }
              ], 
              performance: (Math.random() * 20) - 10,
              isSimulated: true,
              isDemo: true,
              isError: false
            };
            balances[account.id] = demoDetails;
            
            if (onBalanceUpdate) {
              onBalanceUpdate(account.id, demoDetails);
            }
          } else {
            // Para cuentas reales, establecer un objeto con error
            const errorDetails: AccountDetails = { 
              balance: null, 
              assets: [], 
              performance: 0,
              error: errorMessage,
              isError: true,
              isSimulated: false,
              isDemo: false
            };
            balances[account.id] = errorDetails;
            
            if (onBalanceUpdate) {
              onBalanceUpdate(account.id, errorDetails);
            }
          }
        }
      }
    }));
    
    setIsLoadingAllBalances(false);
    return balances;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onBalanceUpdate]);

  const fetchSubAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      if (!token) {
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
      setSubAccounts(data);
      
      // Obtener balances para todas las subcuentas activas
      const balances = await fetchAccountBalances(data.filter((acc: SubAccount) => acc.active), token);
      setAccountBalances(balances);
      
      // Calcular estadísticas
      if (data.length > 0 && onStatsUpdate) {
        const stats: AccountStats = {
          totalAccounts: data.length,
          realAccounts: data.filter((acc: SubAccount) => !acc.isDemo).length,
          demoAccounts: data.filter((acc: SubAccount) => acc.isDemo).length,
          totalBalance: Object.values(balances).reduce((sum, acc) => sum + (acc.balance || 0), 0),
          uniqueExchanges: new Set(data.map((acc: SubAccount) => acc.exchange)).size,
          avgPerformance: Object.values(balances).reduce((sum, acc) => sum + (acc.performance || 0), 0) / Object.values(balances).length || 0
        };
        onStatsUpdate(stats);
      }
    } catch (error) {
      console.error("❌ Error al obtener subcuentas:", error);
      setError("Error al cargar las subcuentas. Intenta nuevamente más tarde.");
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Modificar el useEffect para cargar las subcuentas automáticamente
  useEffect(() => {
    console.log("🔄 Cargando subcuentas automáticamente al iniciar el componente");
    fetchSubAccounts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nuevo useEffect para cargar los balances cuando cambian las subcuentas
  useEffect(() => {
    if (subAccounts.length > 0 && !isLoading && !balancesInitiallyLoaded) {
      console.log("🔄 Subcuentas cargadas, actualizando balances...");
      // Usamos un pequeño retraso para evitar ciclos
      const timer = setTimeout(() => {
        loadAllBalances();
      }, 500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subAccounts.length, isLoading, balancesInitiallyLoaded]);

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight">Subcuentas</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBalancesInitiallyLoaded(false);
                loadAllBalances();
              }}
              disabled={isLoadingAllBalances}
              className="flex items-center h-9"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingAllBalances ? "animate-spin" : ""}`} />
              {isLoadingAllBalances ? "Actualizando..." : "Actualizar todos"}
            </Button>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar subcuentas..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Filtrar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem onClick={() => setSelectedType("all")}>
                  Todas las cuentas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedType("real")}>
                  Cuentas reales
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedType("demo")}>
                  Cuentas demo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mostrar mensaje de error si existe */}
      {error && (
        <div className="p-4 border border-red-200 dark:border-red-800/30 rounded-lg bg-red-50/50 dark:bg-red-950/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border border-yellow-200 dark:border-yellow-800/30 rounded-lg bg-yellow-50/50 dark:bg-yellow-950/10">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Información sobre cuentas demo</h3>
            <p className="text-xs text-yellow-600/90 dark:text-yellow-400/90 mt-1">
              Las cuentas demo de Bybit ahora muestran datos reales desde el endpoint <code className="bg-yellow-100 dark:bg-yellow-900/30 px-1 py-0.5 rounded text-xs">api-demo.bybit.com</code>. 
              Para ver balances y activos, asegúrate de tener fondos virtuales en tu cuenta demo de Bybit.
              Si no ves datos, es posible que necesites depositar fondos virtuales en tu cuenta demo.
            </p>
          </div>
        </div>
      </div>
      
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
                        {searchTerm || selectedType !== "all" 
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
                        {loadingBalance === sub.id || (isLoadingAllBalances && !accountBalances[sub.id]) ? (
                          <Skeleton className="h-6 w-[100px]" />
                        ) : accountBalances[sub.id] ? (
                          accountBalances[sub.id].isError ? (
                            <div className="flex items-center text-red-500 dark:text-red-400 text-lg">
                              <AlertCircle className="h-5 w-5 mr-2" />
                              <span>Error al cargar datos</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                ${accountBalances[sub.id].balance?.toLocaleString('es-ES', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </span>
                              {accountBalances[sub.id].isDemo && !accountBalances[sub.id].isSimulated && (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 border-yellow-200 dark:border-yellow-800/30">
                                  <div className="flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    <span>Demo</span>
                                  </div>
                                </Badge>
                              )}
                              {accountBalances[sub.id].isSimulated && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500 border-blue-200 dark:border-blue-800/30">
                                  <div className="flex items-center gap-1">
                                    <PieChart className="h-3 w-3" />
                                    <span>Simulado</span>
                                  </div>
                                </Badge>
                              )}
                            </div>
                          )
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
                                  setLoadingBalance(sub.id);
                                  fetchAccountDetails(sub.userId, sub.id, token)
                                    .then(details => {
                                      setAccountBalances(prev => ({
                                        ...prev,
                                        [sub.id]: details
                                      }));
                                      setLoadingBalance(null);
                                    })
                                    .catch(() => {
                                      setLoadingBalance(null);
                                    });
                                }
                              }}
                            >
                              {loadingBalance === sub.id || (isLoadingAllBalances && !accountBalances[sub.id]) ? (
                                <div className="flex items-center gap-1">
                                  <RefreshCw className={`mr-2 h-3 w-3 ${loadingBalance === sub.id || isLoadingAllBalances ? "animate-spin" : ""}`} />
                                  <span>Cargando...</span>
                                </div>
                              ) : (
                                "Actualizar"
                              )}
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
                                        {loadingBalance === sub.id || (isLoadingAllBalances && !accountBalances[sub.id]) ? (
                                          <Skeleton className="h-6 w-[100px]" />
                                        ) : accountBalances[sub.id] ? (
                                          accountBalances[sub.id].isError ? (
                                            <div className="flex items-center text-red-500 dark:text-red-400 text-lg">
                                              <AlertCircle className="h-5 w-5 mr-2" />
                                              <span>Error al cargar datos</span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium">
                                                ${accountBalances[sub.id].balance?.toLocaleString('es-ES', {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2
                                                })}
                                              </span>
                                              {accountBalances[sub.id].isDemo && !accountBalances[sub.id].isSimulated && (
                                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 border-yellow-200 dark:border-yellow-800/30">
                                                  <div className="flex items-center gap-1">
                                                    <Sparkles className="h-3 w-3" />
                                                    <span>Demo</span>
                                                  </div>
                                                </Badge>
                                              )}
                                              {accountBalances[sub.id].isSimulated && (
                                                <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500 border-blue-200 dark:border-blue-800/30">
                                                  <div className="flex items-center gap-1">
                                                    <PieChart className="h-3 w-3" />
                                                    <span>Simulado</span>
                                                  </div>
                                                </Badge>
                                              )}
                                            </div>
                                          )
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
                                                  setLoadingBalance(sub.id);
                                                  fetchAccountDetails(sub.userId, sub.id, token)
                                                    .then(details => {
                                                      setAccountBalances(prev => ({
                                                        ...prev,
                                                        [sub.id]: details
                                                      }));
                                                      setLoadingBalance(null);
                                                    })
                                                    .catch(() => {
                                                      setLoadingBalance(null);
                                                    });
                                                }
                                              }}
                                            >
                                              {loadingBalance === sub.id || (isLoadingAllBalances && !accountBalances[sub.id]) ? (
                                                <div className="flex items-center gap-1">
                                                  <RefreshCw className={`mr-2 h-3 w-3 ${loadingBalance === sub.id || isLoadingAllBalances ? "animate-spin" : ""}`} />
                                                  <span>Cargando...</span>
                                                </div>
                                              ) : (
                                                "Actualizar"
                                              )}
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
                                        {loadingBalance === sub.id || (isLoadingAllBalances && !accountBalances[sub.id]) ? (
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
                                                  setLoadingBalance(sub.id);
                                                  fetchAccountDetails(sub.userId, sub.id, token)
                                                    .then(details => {
                                                      setAccountBalances(prev => ({
                                                        ...prev,
                                                        [sub.id]: details
                                                      }));
                                                      setLoadingBalance(null);
                                                    })
                                                    .catch(() => {
                                                      setLoadingBalance(null);
                                                    });
                                                }
                                              }}
                                            >
                                              {loadingBalance === sub.id || (isLoadingAllBalances && !accountBalances[sub.id]) ? (
                                                <div className="flex items-center gap-1">
                                                  <RefreshCw className={`mr-2 h-3 w-3 ${loadingBalance === sub.id || isLoadingAllBalances ? "animate-spin" : ""}`} />
                                                  <span>Cargando...</span>
                                                </div>
                                              ) : (
                                                "Actualizar"
                                              )}
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
                                          setLoadingBalance(sub.id);
                                          fetchAccountDetails(sub.userId, sub.id, token)
                                            .then(details => {
                                              setAccountBalances(prev => ({
                                                ...prev,
                                                [sub.id]: details
                                              }));
                                              setLoadingBalance(null);
                                            })
                                            .catch(() => {
                                              setLoadingBalance(null);
                                            });
                                        }
                                      }}
                                    >
                                      <RefreshCw className={`mr-2 h-3 w-3 ${loadingBalance === sub.id || isLoadingAllBalances ? "animate-spin" : ""}`} />
                                      Actualizar
                                    </Button>
                                  </div>
                                  
                                  {loadingBalance === sub.id || (isLoadingAllBalances && !accountBalances[sub.id]) ? (
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
                                              setLoadingBalance(sub.id);
                                              fetchAccountDetails(sub.userId, sub.id, token)
                                                .then(details => {
                                                  setAccountBalances(prev => ({
                                                    ...prev,
                                                    [sub.id]: details
                                                  }));
                                                  setLoadingBalance(null);
                                                })
                                                .catch(() => {
                                                  setLoadingBalance(null);
                                                });
                                            }
                                          }}
                                        >
                                          <RefreshCw className={`mr-2 h-4 w-4`} />
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