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
  Plus,
  Trash2,
  X
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SubAccountManager from "@/components/SubAccountManager";

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
  balanceHistory?: {
    timestamp: number;
    balance: number;
  }[];
  lastUpdate?: number;
}

interface AccountStats {
  totalAccounts: number;
  realAccounts: number;
  demoAccounts: number;
  totalBalance: number;
  realBalance: number;
  demoBalance: number;
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
  const [loadingAllBalances, setLoadingAllBalances] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [selectedAccountsToDelete, setSelectedAccountsToDelete] = useState<string[]>([]);

  const fetchAccountDetails = async (userId: string, accountId: string, token: string): Promise<AccountDetails> => {
    try {
      setLoadingBalance(accountId);
      console.log(`🔍 Solicitando balance para cuenta ${accountId}...`);
      
      const account = subAccounts.find(acc => acc.id === accountId);
      const isDemo = account?.isDemo === true;
      
      console.log(`📊 Tipo de cuenta: ${isDemo ? 'Demo' : 'Real'}, Exchange: ${account?.exchange}`);
      
      // Obtener el balance actual
      const balanceRes = await fetch(`${API_URL}/subaccounts/${accountId}/balance`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!balanceRes.ok) {
        const errorData = await balanceRes.json().catch(() => ({}));
        console.error(`❌ Error al obtener balance para cuenta ${accountId}:`, errorData);
        console.error(`   Status: ${balanceRes.status} ${balanceRes.statusText}`);
        
        const isGeoRestriction = 
          errorData.message?.includes('ubicación geográfica') || 
          errorData.message?.includes('CloudFront') ||
          errorData.statusCode === 403;
        
        if (isDemo) {
          // Generar datos simulados para cuentas demo
          const simulatedBalance = Math.random() * 10000;
          const simulatedHistory = generateSimulatedHistory(simulatedBalance);
          const simulatedPerformance = calculatePerformance(simulatedHistory);
          
          return { 
            balance: simulatedBalance,
            assets: [
              { coin: 'BTC', walletBalance: Math.random() * 0.5, usdValue: Math.random() * 5000 },
              { coin: 'ETH', walletBalance: Math.random() * 5, usdValue: Math.random() * 3000 },
              { coin: 'USDT', walletBalance: Math.random() * 5000, usdValue: Math.random() * 5000 }
            ],
            performance: simulatedPerformance,
            balanceHistory: simulatedHistory,
            lastUpdate: Date.now(),
            isSimulated: true,
            isDemo: true,
            isError: false
          };
        } else {
          let errorMessage = errorData.message || errorData.error || 'Error al obtener balance real';
          if (isGeoRestriction) {
            errorMessage = 'La API de Bybit no está disponible en tu ubicación geográfica. Considera usar una VPN o contactar con soporte.';
          }
          throw new Error(errorMessage);
        }
      }
      
      // Obtener el historial de balances
      const historyRes = await fetch(`${API_URL}/subaccounts/${accountId}/balance/history`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const balanceData = await balanceRes.json();
      const historyData = historyRes.ok ? await historyRes.json() : { history: [] };
      
      // Calcular el rendimiento basado en el historial
      const performance = calculatePerformance(historyData.history);
      
      console.log(`✅ Datos recibidos para cuenta ${accountId}:`, {
        balance: balanceData.balance,
        assetsCount: balanceData.assets?.length || 0,
        performance: performance,
        historyLength: historyData.history?.length || 0
      });
      
      return {
        balance: balanceData.balance || 0,
        assets: balanceData.assets || [],
        performance: performance,
        balanceHistory: historyData.history || [],
        lastUpdate: Date.now(),
        isSimulated: false,
        isDemo: isDemo,
        isError: false
      };
      
    } catch (error: unknown) {
      console.error(`❌ Error al obtener balance para cuenta ${accountId}:`, error);
      
      const account = subAccounts.find(acc => acc.id === accountId);
      const isDemo = account?.isDemo === true;
      
      if (isDemo) {
        const simulatedBalance = Math.random() * 10000;
        const simulatedHistory = generateSimulatedHistory(simulatedBalance);
        const simulatedPerformance = calculatePerformance(simulatedHistory);
        
        return { 
          balance: simulatedBalance,
          assets: [
            { coin: 'BTC', walletBalance: Math.random() * 0.5, usdValue: Math.random() * 5000 },
            { coin: 'ETH', walletBalance: Math.random() * 5, usdValue: Math.random() * 3000 },
            { coin: 'USDT', walletBalance: Math.random() * 5000, usdValue: Math.random() * 5000 }
          ],
          performance: simulatedPerformance,
          balanceHistory: simulatedHistory,
          lastUpdate: Date.now(),
          isSimulated: true,
          isDemo: true,
          isError: false
        };
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener balance';
        setError(`Error al obtener balance de la cuenta real: ${errorMessage}`);
        return { 
          balance: null, 
          assets: [], 
          performance: 0,
          balanceHistory: [],
          lastUpdate: Date.now(),
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

  // Función para generar historial simulado
  const generateSimulatedHistory = (currentBalance: number) => {
    const history = [];
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    // Generar datos para los últimos 30 días
    for (let i = 30; i >= 0; i--) {
      const timestamp = now - (i * dayInMs);
      // Generar una variación aleatoria entre -5% y +5% del balance actual
      const variation = (Math.random() * 0.1 - 0.05);
      const balance = currentBalance * (1 + variation);
      
      history.push({
        timestamp,
        balance
      });
    }
    
    return history;
  };

  // Función para calcular el rendimiento
  const calculatePerformance = (history: { timestamp: number; balance: number }[]) => {
    if (!history || history.length < 2) return 0;
    
    // Ordenar el historial por timestamp
    const sortedHistory = [...history].sort((a, b) => a.timestamp - b.timestamp);
    
    // Obtener el primer y último balance
    const firstBalance = sortedHistory[0].balance;
    const lastBalance = sortedHistory[sortedHistory.length - 1].balance;
    
    // Calcular el rendimiento porcentual
    const performance = ((lastBalance - firstBalance) / firstBalance) * 100;
    
    return Number(performance.toFixed(2));
  };

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
        const errorData = await res.json().catch(() => ({}));
        console.error(`❌ Error del servidor al obtener subcuentas:`, {
          status: res.status,
          statusText: res.statusText,
          errorData
        });
        
        let errorMessage = 'Error al obtener subcuentas';
        if (res.status === 401) {
          errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
          router.push("/login");
        } else if (res.status === 403) {
          errorMessage = 'No tienes permisos para acceder a las subcuentas.';
        } else if (res.status === 500) {
          errorMessage = 'Error interno del servidor. Por favor, intenta nuevamente más tarde.';
        }
        
        if (errorData.message) {
          errorMessage = `${errorMessage}: ${errorData.message}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      setSubAccounts(data);
      
      // Obtener balances para todas las subcuentas, no solo las activas
      if (data.length > 0) {
        console.log(`🔄 Cargando balances para ${data.length} subcuentas automáticamente...`);
        setLoadingAllBalances(true);
        
        // Crear un array de promesas para todas las subcuentas
        const balancePromises = data.map(async (account: SubAccount) => {
          try {
            const details = await fetchAccountDetails(account.userId, account.id, token);
            return { accountId: account.id, details };
          } catch (error) {
            console.error(`Error al cargar balance para cuenta ${account.id}:`, error);
            return { 
              accountId: account.id, 
              details: { 
                balance: null, 
                assets: [], 
                performance: 0,
                isError: true,
                error: error instanceof Error ? error.message : 'Error desconocido',
                isSimulated: false,
                isDemo: account.isDemo || false
              } 
            };
          }
        });
        
        // Procesar las promesas a medida que se completan
        const balances: Record<string, AccountDetails> = {};
        for (const promise of balancePromises) {
          const result = await promise;
          balances[result.accountId] = result.details;
          
          // Actualizar el estado de balances incrementalmente
          setAccountBalances(prev => ({
            ...prev,
            [result.accountId]: result.details
          }));
          
          // Notificar al componente padre si existe el callback
          if (onBalanceUpdate) {
            onBalanceUpdate(result.accountId, result.details);
          }
        }
        
        // Calcular estadísticas
        if (onStatsUpdate) {
          const stats: AccountStats = {
            totalAccounts: data.length,
            realAccounts: data.filter((acc: SubAccount) => !acc.isDemo).length,
            demoAccounts: data.filter((acc: SubAccount) => acc.isDemo).length,
            totalBalance: Object.values(balances).reduce((sum, acc) => sum + (acc.balance || 0), 0),
            realBalance: Object.entries(balances).reduce((sum, [accountId, acc]) => {
              const account = data.find((a: SubAccount) => a.id === accountId);
              return sum + (!account?.isDemo ? (acc.balance || 0) : 0);
            }, 0),
            demoBalance: Object.entries(balances).reduce((sum, [accountId, acc]) => {
              const account = data.find((a: SubAccount) => a.id === accountId);
              return sum + (account?.isDemo ? (acc.balance || 0) : 0);
            }, 0),
            uniqueExchanges: new Set(data.map((acc: SubAccount) => acc.exchange)).size,
            avgPerformance: Object.values(balances).reduce((sum, acc) => sum + (acc.performance || 0), 0) / Object.values(balances).length || 0
          };
          onStatsUpdate(stats);
        }
        
        setLoadingAllBalances(false);
      }
    } catch (error) {
      console.error("❌ Error al obtener subcuentas:", error);
      setError("Error al cargar las subcuentas. Intenta nuevamente más tarde.");
      setLoadingAllBalances(false);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, onStatsUpdate]);

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
      (selectedType === "all" || 
       (selectedType === "demo" && account.isDemo) || 
       (selectedType === "real" && !account.isDemo)) &&
      (account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.exchange.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Función para actualizar todos los balances manualmente
  const refreshAllBalances = async () => {
    if (loadingAllBalances || subAccounts.length === 0) return;
    
    try {
      setLoadingAllBalances(true);
      
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      
      console.log(`🔄 Actualizando balances para ${subAccounts.length} subcuentas...`);
      
      // Crear un array de promesas para todas las subcuentas
      const balancePromises = subAccounts.map(async (account: SubAccount) => {
        try {
          const details = await fetchAccountDetails(account.userId, account.id, token);
          return { accountId: account.id, details };
        } catch (error) {
          console.error(`Error al actualizar balance para cuenta ${account.id}:`, error);
          return { 
            accountId: account.id, 
            details: { 
              balance: null, 
              assets: [], 
              performance: 0,
              isError: true,
              error: error instanceof Error ? error.message : 'Error desconocido',
              isSimulated: false,
              isDemo: account.isDemo || false
            } 
          };
        }
      });
      
      // Procesar las promesas a medida que se completan
      const balances: Record<string, AccountDetails> = {};
      for (const promise of balancePromises) {
        const result = await promise;
        balances[result.accountId] = result.details;
        
        // Actualizar el estado de balances incrementalmente
        setAccountBalances(prev => ({
          ...prev,
          [result.accountId]: result.details
        }));
        
        // Notificar al componente padre si existe el callback
        if (onBalanceUpdate) {
          onBalanceUpdate(result.accountId, result.details);
        }
      }
      
      // Calcular estadísticas
      if (onStatsUpdate) {
        const stats: AccountStats = {
          totalAccounts: subAccounts.length,
          realAccounts: subAccounts.filter((acc: SubAccount) => !acc.isDemo).length,
          demoAccounts: subAccounts.filter((acc: SubAccount) => acc.isDemo).length,
          totalBalance: Object.values(balances).reduce((sum, acc) => sum + (acc.balance || 0), 0),
          realBalance: Object.entries(balances).reduce((sum, [accountId, acc]) => {
            const account = subAccounts.find((a: SubAccount) => a.id === accountId);
            return sum + (!account?.isDemo ? (acc.balance || 0) : 0);
          }, 0),
          demoBalance: Object.entries(balances).reduce((sum, [accountId, acc]) => {
            const account = subAccounts.find((a: SubAccount) => a.id === accountId);
            return sum + (account?.isDemo ? (acc.balance || 0) : 0);
          }, 0),
          uniqueExchanges: new Set(subAccounts.map((acc: SubAccount) => acc.exchange)).size,
          avgPerformance: Object.values(balances).reduce((sum, acc) => sum + (acc.performance || 0), 0) / Object.values(balances).length || 0
        };
        onStatsUpdate(stats);
      }
    } catch (error) {
      console.error("❌ Error al actualizar balances:", error);
      setError("Error al actualizar los balances. Intenta nuevamente más tarde.");
    } finally {
      setLoadingAllBalances(false);
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchSubAccounts();
  };

  // Función para eliminar subcuentas seleccionadas
  const handleDeleteSubAccounts = async () => {
    if (selectedAccountsToDelete.length === 0) {
      setError("Por favor, selecciona al menos una subcuenta para eliminar");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const deletePromises = selectedAccountsToDelete.map(async (accountId) => {
        const response = await fetch(`${API_URL}/subaccounts/${accountId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Error al eliminar la subcuenta ${accountId}`);
        }
      });

      await Promise.all(deletePromises);
      
      // Actualizar la lista de subcuentas
      setSubAccounts(subAccounts.filter(account => !selectedAccountsToDelete.includes(account.id)));
      setSelectedAccountsToDelete([]); // Limpiar selección
      setIsDeleteModalOpen(false); // Cerrar el modal
      setError(null);
    } catch (error) {
      setError("Error al eliminar las subcuentas seleccionadas");
      console.error("Error al eliminar subcuentas:", error);
    }
  };

  // Función para manejar la selección de subcuentas en el modal
  const handleSelectAccountToDelete = (accountId: string) => {
    setSelectedAccountsToDelete(prev => {
      if (prev.includes(accountId)) {
        return prev.filter(id => id !== accountId);
      } else {
        return [...prev, accountId];
      }
    });
  };

  return (
    <div className="space-y-4" ref={componentRef}>
      <div className="space-y-6 animate-in fade-in-50 duration-300" ref={componentRef} id="subaccounts-component">
        {/* Header Section */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex flex-col space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                Subcuentas
                {loadingAllBalances && (
                  <span className="ml-2 inline-flex items-center text-sm font-normal text-blue-600 dark:text-blue-400">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Cargando balances...
                  </span>
                )}
              </h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar subcuentas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
                <Button
                  onClick={refreshAllBalances}
                  disabled={loadingAllBalances}
                  variant="outline"
                  size="icon"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingAllBalances ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Subcuenta
              </Button>
              <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Subcuentas
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Eliminar Subcuentas</DialogTitle>
                    <DialogDescription>
                      Selecciona las subcuentas que deseas eliminar. Esta acción no se puede deshacer.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[400px] overflow-y-auto">
                    <div className="space-y-2">
                      {subAccounts.map((account) => (
                        <div
                          key={account.id}
                          className={`p-4 rounded-lg border transition-all cursor-pointer ${
                            selectedAccountsToDelete.includes(account.id)
                              ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                              : 'border-gray-200 hover:border-red-300 dark:border-gray-800'
                          }`}
                          onClick={() => handleSelectAccountToDelete(account.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{account.name}</p>
                              <p className="text-sm text-gray-500">
                                {account.exchange} • {account.isDemo ? 'Demo' : 'Real'}
                              </p>
                            </div>
                            {selectedAccountsToDelete.includes(account.id) && (
                              <div className="text-red-500">
                                <X className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedAccountsToDelete([]);
                        setIsDeleteModalOpen(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={handleDeleteSubAccounts}
                      disabled={selectedAccountsToDelete.length === 0}
                    >
                      Eliminar ({selectedAccountsToDelete.length})
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Mostrar mensaje de error si existe */}
        {error && (
          <div className="p-4 border border-red-200 dark:border-red-800/30 rounded-lg bg-red-50/50 dark:bg-red-950/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 text-xs border-red-200 dark:border-red-800/30 hover:bg-red-100/50 dark:hover:bg-red-900/30"
                    onClick={() => {
                      setError(null);
                      fetchSubAccounts();
                    }}
                  >
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Reintentar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-red-600 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/30"
                    onClick={() => router.push("/login")}
                  >
                    Iniciar sesión nuevamente
                  </Button>
                </div>
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
                Si no ves datos es posible que necesites depositar fondos virtuales en tu cuenta demo.
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
                          {loadingBalance === sub.id ? (
                            <Skeleton className="h-6 w-[100px]" />
                          ) : accountBalances[sub.id] ? (
                            accountBalances[sub.id].isError ? (
                              <div className="flex items-center text-red-500 dark:text-red-400 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span>Error</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 px-2 text-xs ml-2"
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
                                        })
                                        .finally(() => {
                                          setLoadingBalance(null);
                                        });
                                    }
                                  }}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Reintentar
                                </Button>
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
                            <Skeleton className="h-6 w-[100px]" />
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
                                    <Card className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                                        <CardTitle className="text-base font-medium text-white/90">Balance Total</CardTitle>
                                        <Wallet className="h-5 w-5 text-white/70" />
                                      </CardHeader>
                                      <CardContent className="pt-2">
                                        <div className="text-4xl font-bold tracking-tight py-2">
                                          ${accountBalances[selectedSubAccountId]?.balance?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
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
                                            <Skeleton className="h-6 w-[100px]" />
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
                                        disabled={loadingBalance === sub.id}
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
                                              })
                                              .finally(() => {
                                                setLoadingBalance(null);
                                              });
                                          }
                                        }}
                                      >
                                        <RefreshCw className={`mr-2 h-3 w-3 ${loadingBalance === sub.id ? "animate-spin" : ""}`} />
                                        {loadingBalance === sub.id ? "Actualizando..." : "Actualizar"}
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
                                    ) : accountBalances[sub.id]?.isError ? (
                                      <div className="text-center py-8 border border-dashed border-red-200 dark:border-red-800/30 rounded-lg bg-red-50/50 dark:bg-red-950/10">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                          <AlertCircle className="h-12 w-12 text-red-400 dark:text-red-500 opacity-50" />
                                          <p className="text-red-600 dark:text-red-400">Error al cargar los activos.</p>
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
                                                  })
                                                  .finally(() => {
                                                    setLoadingBalance(null);
                                                  });
                                              }
                                            }}
                                          >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Reintentar
                                          </Button>
                                        </div>
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
                                                  })
                                                  .finally(() => {
                                                    setLoadingBalance(null);
                                                  });
                                              }
                                            }}
                                          >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Actualizar
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

      {/* Modal de Crear Subcuenta */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="p-0 bg-transparent border-none shadow-none max-w-2xl">
          <SubAccountManager
            mode="create"
            onSuccess={handleCreateSuccess}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Eliminar Subcuenta */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="p-0 bg-transparent border-none shadow-none max-w-2xl">
          <SubAccountManager
            mode="delete"
            onSuccess={() => {
              setIsDeleteModalOpen(false);
              fetchSubAccounts();
            }}
            onCancel={() => setIsDeleteModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}