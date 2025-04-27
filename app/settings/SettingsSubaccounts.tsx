import { useState, useEffect } from "react";
import { Plus, Trash2, Key, Shield, RefreshCw, Check, X, ChevronDown, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { 
  getUserSubaccounts, 
  createSubaccount, 
  deleteSubaccount,
  getSubaccountBalance,
  Subaccount
} from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

// Lista de exchanges disponibles
const AVAILABLE_EXCHANGES = [
  { id: "binance", name: "Binance" },
  { id: "bybit", name: "Bybit" }
];

export default function SettingsSubaccounts() {
  const [subaccounts, setSubaccounts] = useState<Subaccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Subaccount | null>(null);
  const [form, setForm] = useState({
    identifier: "",
    name: AVAILABLE_EXCHANGES[0].id, // Default a la primera opción (Binance)
    apiKey: "",
    secretKey: "",
    isDemo: false
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [selectedSubaccountId, setSelectedSubaccountId] = useState<string | null>(null);
  const [balanceData, setBalanceData] = useState<{
    balance: number;
    assets: Array<{
      coin: string;
      walletBalance: number;
      usdValue: number;
    }>;
  } | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchSubaccounts();
  }, []);

  const fetchSubaccounts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await getUserSubaccounts();
      
      if (error) {
        console.error("Error específico al obtener subcuentas:", error);
        toast({
          title: "Error",
          description: `No se pudieron cargar las subcuentas: ${error}`,
          variant: "destructive",
        });
        return;
      }
      
      setSubaccounts(data || []);
    } catch (error: any) {
      console.error("Error no controlado al cargar subcuentas:", error);
      toast({
        title: "Error inesperado",
        description: `Error al cargar subcuentas: ${error?.message || error}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSubaccounts();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prevForm => ({
        ...prevForm,
        [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsAdding(true);
      
      // Obtener el nombre del exchange seleccionado
      const selectedExchange = AVAILABLE_EXCHANGES.find(ex => ex.id === form.name);
      
      // Crear un nombre combinado: identificador - nombre del exchange
      const displayName = form.identifier.trim() 
        ? `${form.identifier.trim()} - ${selectedExchange?.name || form.name}` 
        : selectedExchange?.name || form.name;
      
      const { success, error } = await createSubaccount(
        displayName, // Usar el nombre combinado
        form.apiKey,
        form.secretKey,
        form.isDemo
      );
      
      if (error) {
        console.error("Error específico al añadir subcuenta:", error);
        toast({
          title: "Error",
          description: `No se pudo añadir la subcuenta: ${error}`,
          variant: "destructive",
        });
        return;
      }
      
      // Recargar subcuentas
      await fetchSubaccounts();
      
      // Limpiar formulario
      setForm({ 
        identifier: "", 
        name: AVAILABLE_EXCHANGES[0].id, // Reset a la primera opción
        apiKey: "", 
        secretKey: "",
        isDemo: false
      });
      setAddDialogOpen(false);
      
      toast({
        title: "Éxito",
        description: "Subcuenta añadida correctamente",
      });
    } catch (error: any) {
      console.error("Error no controlado al añadir subcuenta:", error);
      toast({
        title: "Error inesperado",
        description: `Error al añadir subcuenta: ${error?.message || error}`,
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { success, error } = await deleteSubaccount(id);
      
      if (error) {
        console.error("Error específico al eliminar subcuenta:", error);
        toast({
          title: "Error",
          description: `No se pudo eliminar la subcuenta: ${error}`,
          variant: "destructive",
        });
        return;
      }
      
      // Actualizar lista localmente sin necesidad de recargar
      setSubaccounts(subaccounts.filter((s) => s.id !== id));
      setConfirmDelete(null);
      
      toast({
        title: "Éxito",
        description: "Subcuenta eliminada correctamente",
      });
    } catch (error: any) {
      console.error("Error no controlado al eliminar subcuenta:", error);
      toast({
        title: "Error inesperado",
        description: `Error al eliminar subcuenta: ${error?.message || error}`,
        variant: "destructive",
      });
    }
  };

  // Función para ocultar parcialmente las claves para mostrar en la UI
  const maskKey = (key: string) => {
    if (!key) return "••••••••";
    return key.substring(0, 3) + "••••••••" + key.substring(key.length - 3);
  };

  const openDeleteConfirm = (id: string) => {
    setConfirmDelete(id);
  };

  // Función para extraer el nombre del exchange y el identificador de un nombre combinado
  const parseDisplayName = (displayName: string) => {
    // Si el nombre contiene " - ", dividirlo en identificador y nombre de exchange
    const parts = displayName.split(" - ");
    if (parts.length > 1) {
      return {
        identifier: parts[0],
        exchangeName: parts.slice(1).join(" - ") // Por si hay más de un " - "
      };
    }
    // Si no tiene el formato esperado, devolver todo como nombre de exchange
    return {
      identifier: "",
      exchangeName: displayName
    };
  };

  // Función para obtener el balance de una subcuenta (usando API Route)
  const fetchBalance = async (subaccountId: string) => {
    try {
      setBalanceError(null);
      setIsLoadingBalance(true);
      setSelectedSubaccountId(subaccountId);
      setBalanceDialogOpen(true);
      setBalanceData(null); // Reset previous data
      
      console.log(`Calling API route '/api/subaccount/balance' for subaccount: ${subaccountId}`);
      
      // Llamar a la API Route interna de Next.js
      const response = await fetch('/api/subaccount/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subaccountId })
      });

      const result = await response.json();

      console.log("API route response:", result);

      if (!response.ok || !result.success) {
        console.error("Error fetching balance from API route:", result?.error || `HTTP status ${response.status}`);
        setBalanceError(result?.error || `Error ${response.status} al obtener balance`);
        return;
      }
      
      // Si todo fue bien, establecer los datos
      setBalanceData(result.data || { balance: 0, assets: [] });

    } catch (error: any) {
      console.error("Error no controlado en fetchBalance:", error);
      setBalanceError(error?.message || "Error inesperado al obtener balance");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Helper para obtener un icono simple basado en el nombre
  const getExchangeIcon = (exchangeName: string) => {
    return <Key className="h-4 w-4" />; // Icono por defecto ajustado
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="divide-y divide-border">
        <div className="px-4 py-6 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 p-3 rounded-lg bg-muted text-primary">
                 <Key className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
                  Subcuentas y API Keys
                </h2>
                <p className="text-sm text-muted-foreground">
                  Gestiona tus conexiones con exchanges de criptomonedas.
                </p>
              </div>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="flex-1 sm:flex-none"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>

              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex-1 sm:flex-none">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Conexión
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Añadir nueva conexión</DialogTitle>
                    <DialogDescription>
                        Introduce los detalles de la conexión del exchange. Las claves se guardarán de forma segura.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAdd}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                        <Label htmlFor="identifier">Nombre identificador (opcional)</Label>
                        <Input
                            id="identifier"
                            name="identifier"
                            placeholder="Ej: Cuenta Principal, Bot Grid"
                            value={form.identifier}
                            onChange={handleInputChange}
                        />
                        <p className="text-xs text-muted-foreground">
                            Un nombre descriptivo para esta conexión.
                        </p>
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor="name">Exchange</Label>
                        <Select
                            value={form.name}
                            onValueChange={(value) => handleSelectChange(value, 'name')}
                        >
                            <SelectTrigger>
                            <SelectValue placeholder="Selecciona un exchange" />
                            </SelectTrigger>
                            <SelectContent>
                            {AVAILABLE_EXCHANGES.map((exchange) => (
                                <SelectItem key={exchange.id} value={exchange.id}>
                                {exchange.name}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                            id="apiKey"
                            name="apiKey"
                            placeholder="API Key generada en el exchange"
                            value={form.apiKey}
                            onChange={handleInputChange}
                            required
                        />
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor="secretKey">Secret Key</Label>
                        <Input
                            id="secretKey"
                            name="secretKey"
                            placeholder="Secret Key generada en el exchange"
                            value={form.secretKey}
                            onChange={handleInputChange}
                            required
                            type="password"
                        />
                        </div>
                        <div className="flex items-center space-x-2 pt-2"> 
                            <Checkbox 
                                id="isDemo" 
                                name="isDemo" 
                                checked={form.isDemo} 
                                onCheckedChange={(checked) => { 
                                handleInputChange({ 
                                    target: { name: 'isDemo', value: '', type: 'checkbox', checked: !!checked } 
                                } as React.ChangeEvent<HTMLInputElement>); 
                                }} 
                            /> 
                            <Label 
                                htmlFor="isDemo" 
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" 
                            > 
                                Esta es una cuenta Demo/Testnet 
                            </Label> 
                        </div> 
                        <p className="text-xs text-muted-foreground px-1 -mt-2"> 
                            Marca esta opción si usas claves de un entorno de pruebas. 
                        </p>
                        {(form.identifier || form.name) && (
                        <div className="mt-2 p-3 bg-muted/50 rounded-md border">
                            <p className="text-xs text-muted-foreground">
                            Nombre guardado: <strong className="text-foreground">
                                {form.identifier ? `${form.identifier} - ` : ''}
                                {AVAILABLE_EXCHANGES.find(ex => ex.id === form.name)?.name || form.name}
                            </strong>
                            </p>
                        </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setAddDialogOpen(false)}>
                        Cancelar
                        </Button>
                        <Button type="submit" disabled={isAdding || !form.name || !form.apiKey || !form.secretKey}>
                        {isAdding ? (
                            <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                        ) : (
                            <><Check className="mr-2 h-4 w-4" /> Añadir Conexión</>
                        )}
                        </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                       <Skeleton className="h-5 w-20 rounded-md" />
                       <Skeleton className="h-8 w-16 rounded-md" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-6 w-3/4 mb-2 rounded-md" />
                      <Skeleton className="h-4 w-1/2 rounded-md" />
                       <div className="flex items-center pt-2">
                         <Skeleton className="h-4 w-24 rounded-md" />
                       </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : subaccounts.length === 0 ? (
              <div className="text-center p-10 bg-muted/50 rounded-lg border border-dashed">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Key className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">
                  No hay conexiones de exchange
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                  Añade tu primera conexión para poder consultar balances y operar.
                </p>
                <Button onClick={() => setAddDialogOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Conexión
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {subaccounts.map((sub) => {
                    const { identifier, exchangeName } = parseDisplayName(sub.name);
                    return (
                      <motion.div
                        key={sub.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="overflow-hidden group relative">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start gap-2">
                              <Badge variant="outline" className="flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 text-xs">
                                {getExchangeIcon(exchangeName)}
                                <span>{exchangeName}</span>
                              </Badge>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-muted"
                                      onClick={() => fetchBalance(sub.id)}
                                      disabled={isLoadingBalance && selectedSubaccountId === sub.id}
                                    >
                                      <span className="sr-only">Ver Balance</span>
                                      {isLoadingBalance && selectedSubaccountId === sub.id ? (
                                        <RefreshCw className="h-4 w-4 animate-spin"/>
                                      ) : (
                                        <Wallet className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Ver Balance</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                     <Dialog open={confirmDelete === sub.id} onOpenChange={(open) => !open && setConfirmDelete(null)}>
                                        <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/80 hover:text-destructive hover:bg-destructive/10" onClick={() => openDeleteConfirm(sub.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                              <DialogTitle>¿Eliminar esta conexión?</DialogTitle>
                                              <DialogDescription>
                                              Estás a punto de eliminar la conexión <strong>{sub.name}</strong>. Esta acción no se puede deshacer.
                                              </DialogDescription>
                                          </DialogHeader>
                                          <DialogFooter className="mt-4">
                                              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
                                              <Button variant="destructive" onClick={() => handleDelete(sub.id)}>Eliminar</Button>
                                          </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                  </TooltipTrigger>
                                  <TooltipContent>Eliminar</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                             <p className="font-semibold text-base text-foreground leading-tight truncate" title={identifier || 'Subcuenta'}>
                                {identifier ? identifier : 'Subcuenta'}
                             </p>
                             <p className="text-sm text-muted-foreground mt-1">
                                Conectada: {new Date(sub.created_at || "").toLocaleDateString()}
                             </p>
                             <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-500 pt-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"></div>
                                <span>Activa</span>
                             </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

         <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                <DialogTitle>Balance de la subcuenta</DialogTitle>
                <DialogDescription>
                    Detalle de activos y balance total
                </DialogDescription>
                </DialogHeader>
                
                {isLoadingBalance ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
                ) : balanceError ? (
                <div className="bg-destructive/10 p-4 rounded-md text-destructive border border-destructive/30">
                    <p className="font-medium mb-1">Error al obtener balance</p>
                    <p className="text-sm">{balanceError}</p>
                </div>
                ) : balanceData ? (
                <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-md border">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Balance Total Estimado (USD):
                    </h3>
                    <p className="text-2xl font-semibold text-foreground">
                        ${balanceData.balance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    </div>
                    
                    <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Activos:
                    </h3>
                    {balanceData.assets.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">
                        No se encontraron activos con balance.
                        </p>
                    ) : (
                        <div className="border rounded-md overflow-hidden max-h-60 overflow-y-auto">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Moneda</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                                <TableHead className="text-right">Valor USD</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {balanceData.assets.map((asset, index) => (
                                <TableRow key={asset.coin + index} className="hover:bg-muted/50">
                                <TableCell className="font-medium">{asset.coin}</TableCell>
                                <TableCell className="text-right font-mono text-sm">{asset.walletBalance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</TableCell>
                                <TableCell className="text-right font-mono text-sm">${asset.usdValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                        </div>
                    )}
                    </div>
                </div>
                ) : (
                <p className="text-center text-muted-foreground italic">
                    No hay datos de balance disponibles.
                </p>
                )}
                
                <DialogFooter>
                <Button variant="outline" onClick={() => setBalanceDialogOpen(false)}>
                    Cerrar
                </Button>
                </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
    </TooltipProvider>
  );
} 