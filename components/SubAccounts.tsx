"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Wallet,
  ArrowUpDown,
  Filter,
  Edit,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ManageSubAccount from "./ManageSubAccount";

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
  performance?: number;
  apiKey: string;
  isDemo: boolean;
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

interface AccountBalance {
  subAccountId: string;
  balance: number;
  currency: string;
}

type SortConfig = {
  key: keyof SubAccount;
  direction: "asc" | "desc";
} | null;

interface SubAccountsProps {
  onBalanceUpdate?: (totalBalance: number, subAccountId: string) => void;
  refreshTrigger?: boolean;
}

export default function SubAccounts({ onBalanceUpdate, refreshTrigger }: SubAccountsProps) {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [selectedSubAccountId, setSelectedSubAccountId] = useState<string | null>(null);
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [selectedExchange, setSelectedExchange] = useState<string>("all");
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const { toast } = useToast();

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
    setError(null);
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    
    if (!token || !userId) {
      console.error("❌ No hay token o userId");
      setError("No hay token de autenticación o ID de usuario");
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: "No hay token de autenticación o ID de usuario",
      });
      setIsLoading(false);
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
          console.error("❌ Token inválido o expirado.");
          setError("Token inválido o expirado");
          toast({
            variant: "destructive",
            title: "Error de autenticación",
            description: "Token inválido o expirado",
          });
          setIsLoading(false);
          return;
        }
        throw new Error(`Error al obtener subcuentas - Código ${res.status}`);
      }

      const data = await res.json();
      console.log("Respuesta del backend:", data);
      
      // Verificar si hay subcuentas almacenadas que ya no existen en el servidor
      const storedSubAccounts = localStorage.getItem("subAccounts");
      if (storedSubAccounts) {
        try {
          const parsedSubAccounts = JSON.parse(storedSubAccounts);
          const missingAccounts = parsedSubAccounts.filter((stored: SubAccount) => 
            !data.some((current: SubAccount) => current.id === stored.id)
          );
          
          if (missingAccounts.length > 0) {
            console.log("Subcuentas que ya no existen en el servidor:", missingAccounts);
            // Mostrar notificación si hay subcuentas que ya no existen
            toast({
              title: "Información",
              description: "Algunas subcuentas han sido eliminadas del servidor y se han actualizado tus datos locales.",
            });
          }
        } catch (e) {
          console.error("Error al verificar subcuentas almacenadas:", e);
        }
      }
      
      setSubAccounts(data);

      const balances: AccountBalance[] = [];
      let totalBalance = 0;
      const updatedSubAccounts = await Promise.all(
        data.map(async (sub: SubAccount) => {
          const details = await fetchAccountDetails(sub.userId, sub.id, token);
          if (details.balance !== null) {
            balances.push({
              subAccountId: sub.id,
              balance: details.balance,
              currency: "USD"
            });
            totalBalance += details.balance;
          } else {
            balances.push({
              subAccountId: sub.id,
              balance: 0,
              currency: "USD"
            });
          }
          sub.assets = details.assets;
          sub.performance = Math.random() * 100;
          return sub;
        })
      );
      setSubAccounts(updatedSubAccounts);
      setAccountBalances(balances);
      if (onBalanceUpdate && updatedSubAccounts.length > 0) {
        onBalanceUpdate(totalBalance, updatedSubAccounts[0].id);
      }
      localStorage.setItem("subAccounts", JSON.stringify(updatedSubAccounts));
      localStorage.setItem("accountBalances", JSON.stringify(balances));
    } catch (error) {
      console.error("❌ Error obteniendo subcuentas:", error);
      setError("No se pudieron cargar las subcuentas");
    } finally {
      setIsLoading(false);
    }
  }, [fetchAccountDetails, onBalanceUpdate]);

  useEffect(() => {
    const storedSubAccounts = localStorage.getItem("subAccounts");
    const storedAccountBalances = localStorage.getItem("accountBalances");

    if (storedSubAccounts && storedAccountBalances) {
      try {
        const parsedSubAccounts = JSON.parse(storedSubAccounts);
        
        // Si no hay subcuentas almacenadas o el array está vacío, cargar desde el servidor
        if (!parsedSubAccounts || parsedSubAccounts.length === 0) {
          console.log("No hay subcuentas almacenadas, cargando desde el servidor");
          fetchSubAccounts();
          return;
        }
        
        const parsedBalances = JSON.parse(storedAccountBalances);
        setSubAccounts(parsedSubAccounts);
        setAccountBalances(parsedBalances);
        
        // Calcular el balance total para actualizar el dashboard
        if (onBalanceUpdate && parsedSubAccounts.length > 0) {
          let totalBalance = 0;
          parsedBalances.forEach((balance: AccountBalance) => {
            if (balance !== null) {
              totalBalance += Number(balance.balance);
            }
          });
          onBalanceUpdate(totalBalance, parsedSubAccounts[0].id);
        }
        
        setIsLoading(false);
      } catch (e) {
        console.error("Error al parsear datos almacenados:", e);
        fetchSubAccounts();
      }
    } else {
      fetchSubAccounts();
    }
  }, [fetchSubAccounts, onBalanceUpdate]);

  useEffect(() => {
    if (refreshTrigger) {
      fetchSubAccounts();
    }
  }, [refreshTrigger, fetchSubAccounts]);

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
      (account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.exchange.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleManageAccount = (id: string) => {
    if (!id || subAccounts.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay subcuentas disponibles para editar",
      });
      return;
    }
    
    // Verificar que la subcuenta existe antes de intentar editarla
    const subAccountExists = subAccounts.some(account => account.id === id);
    if (!subAccountExists) {
      // Limpiar cualquier ID de subcuenta almacenado que ya no exista
      const storedSubAccounts = localStorage.getItem("subAccounts");
      if (storedSubAccounts) {
        try {
          const parsedSubAccounts = JSON.parse(storedSubAccounts);
          const filteredSubAccounts = parsedSubAccounts.filter((acc: SubAccount) => 
            subAccounts.some(current => current.id === acc.id)
          );
          localStorage.setItem("subAccounts", JSON.stringify(filteredSubAccounts));
        } catch (e) {
          console.error("Error al actualizar subcuentas almacenadas:", e);
        }
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "La subcuenta seleccionada no existe o ha sido eliminada",
      });
      return;
    }
    
    setSelectedSubAccountId(id);
    setIsManageDialogOpen(true);
  };

  const getAccountBalance = (accountId: string) => {
    const balance = accountBalances.find(b => b.subAccountId === accountId);
    return balance ? balance.balance : 0;
  };

  const getCurrency = (accountId: string) => {
    const balance = accountBalances.find(b => b.subAccountId === accountId);
    return balance ? balance.currency : 'USD';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Subcuentas</CardTitle>
            <CardDescription>Gestiona y monitorea todas tus cuentas de trading</CardDescription>
          </div>
          <Button onClick={fetchSubAccounts} variant="outline" size="sm" className="w-full md:w-auto">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 mt-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar subcuentas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                {selectedExchange === "all" ? "Todos los Exchanges" : selectedExchange}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {exchanges.map((exchange) => (
                <DropdownMenuItem key={exchange} onClick={() => setSelectedExchange(exchange)}>
                  {exchange === "all" ? "Todos los Exchanges" : exchange}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="flex items-center gap-2 p-4 mb-4 text-red-600 bg-red-50 dark:bg-red-900/10 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort("name")} className="cursor-pointer hover:bg-muted/50">
                  Nombre
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead onClick={() => handleSort("exchange")} className="cursor-pointer hover:bg-muted/50">
                  Exchange
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead onClick={() => handleSort("balance")} className="cursor-pointer hover:bg-muted/50">
                  Balance
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead onClick={() => handleSort("performance")} className="cursor-pointer hover:bg-muted/50">
                  Rendimiento
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
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
                      <Skeleton className="h-5 w-[200px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-[20px]" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mb-3" />
                      <p className="text-sm font-medium mb-2">No se encontraron subcuentas</p>
                      <p className="text-xs text-muted-foreground">
                        Intenta ajustar los filtros o el término de búsqueda
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((sub) => (
                  <>
                    <TableRow
                      key={sub.id}
                      onClick={() => handleRowClick(sub)}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{sub.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="uppercase">
                          {sub.exchange}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getAccountBalance(sub.id) !== undefined ? (
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{getAccountBalance(sub.id).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getCurrency(sub.id)}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sub.performance !== undefined ? `${sub.performance.toFixed(2)}%` : "-"}
                      </TableCell>
                      <TableCell>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            selectedSubAccountId === sub.id ? "rotate-180" : ""
                          }`}
                        />
                      </TableCell>
                    </TableRow>
                    {selectedSubAccountId === sub.id && (
                      <TableRow key={`${sub.id}-details`}>
                        <TableCell colSpan={5}>
                          <div className="p-6 bg-muted/50 rounded-lg space-y-6">
                            <Tabs defaultValue="overview" className="w-full">
                              <TabsList>
                                <TabsTrigger value="overview">Vista General</TabsTrigger>
                                <TabsTrigger value="assets">Assets</TabsTrigger>
                              </TabsList>
                              <TabsContent value="overview" className="mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-2xl font-bold">
                                        {getAccountBalance(sub.id) !== undefined
                                          ? `${getAccountBalance(sub.id).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${getCurrency(sub.id)}`
                                          : "No disponible"}
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm font-medium">Exchange</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-2xl font-bold uppercase">{sub.exchange}</div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm font-medium">Rendimiento</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-2xl font-bold">
                                        {sub.performance !== undefined ? `${sub.performance.toFixed(2)}%` : "No disponible"}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              </TabsContent>
                              <TabsContent value="assets">
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  </div>
                                  <div className="mt-6">
                                    <h4 className="font-medium mb-4">Todos los Assets</h4>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Token</TableHead>
                                          <TableHead>Balance</TableHead>
                                          <TableHead>Valor USD</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {sub.assets?.map((asset) => (
                                          <TableRow key={asset.coin}>
                                            <TableCell className="font-medium">{asset.coin}</TableCell>
                                            <TableCell>{asset.walletBalance} {asset.coin}</TableCell>
                                            <TableCell>${asset.usdValue}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
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
        </div>
      </CardContent>

      <CardFooter>
        {subAccounts.length > 0 && (
          <Button onClick={() => handleManageAccount(subAccounts[0].id)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}
      </CardFooter>

      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogTitle className="sr-only">Gestionar Subcuenta</DialogTitle>
          <DialogDescription className="sr-only">
            Edita o elimina la información de tu subcuenta de trading
          </DialogDescription>
          {selectedSubAccountId && (
            <ManageSubAccount 
              subAccountId={selectedSubAccountId} 
              onClose={() => setIsManageDialogOpen(false)}
              onUpdate={fetchSubAccounts}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}