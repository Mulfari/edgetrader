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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    secretKey: ""
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
    setForm({ ...form, [e.target.name]: e.target.value });
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
        form.secretKey
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
        secretKey: "" 
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

  // Función para obtener el balance de una subcuenta
  const fetchBalance = async (subaccountId: string) => {
    try {
      setBalanceError(null);
      setIsLoadingBalance(true);
      setSelectedSubaccountId(subaccountId);
      setBalanceDialogOpen(true);
      
      // Llamar a la función que obtiene el balance
      const { success, data, error } = await getSubaccountBalance(subaccountId);
      
      if (!success || error) {
        console.error("Error al obtener balance:", error);
        setBalanceError(error || "Error desconocido al obtener balance");
        return;
      }
      
      setBalanceData(data || { balance: 0, assets: [] });
    } catch (error: any) {
      console.error("Error no controlado al obtener balance:", error);
      setBalanceError(error?.message || "Error al obtener balance");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-cyan-500 to-indigo-500 rounded-lg blur opacity-25 animate-pulse"></div>
              <div className="relative h-14 w-14 rounded-lg bg-gradient-to-br from-blue-500 via-cyan-500 to-indigo-500 p-[2px] transform hover:scale-105 transition-transform duration-300">
                <div className="h-full w-full rounded-[7px] bg-white dark:bg-zinc-900 flex items-center justify-center backdrop-blur-xl">
                  <Key className="h-7 w-7 text-blue-500 dark:text-cyan-400" />
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-500">
                Subcuentas/API Keys
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Gestiona tus conexiones con exchanges
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={isRefreshing || isLoading}
              className="h-9"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-9">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir subcuenta
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Añadir nueva subcuenta</DialogTitle>
                  <DialogDescription>
                    Introduce los detalles de la conexión del exchange
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAdd}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="identifier">Nombre identificador (opcional)</Label>
                      <Input
                        id="identifier"
                        name="identifier"
                        placeholder="Ej: Cuenta Personal, Trading Bot"
                        value={form.identifier}
                        onChange={handleInputChange}
                      />
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Un nombre descriptivo para identificar esta cuenta específica
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
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Selecciona la plataforma o exchange
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        name="apiKey"
                        placeholder="API Key del exchange"
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
                        placeholder="Secret Key del exchange"
                        value={form.secretKey}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    {(form.identifier || form.name) && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Se guardará como: <strong>
                            {form.identifier ? `${form.identifier} - ` : ''}
                            {AVAILABLE_EXCHANGES.find(ex => ex.id === form.name)?.name || form.name}
                          </strong>
                        </p>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isAdding || !form.name || !form.apiKey || !form.secretKey}>
                      {isAdding ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Añadiendo...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Añadir subcuenta
                        </>
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
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : subaccounts.length === 0 ? (
            <div className="text-center p-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
              <Key className="h-10 w-10 text-zinc-400 dark:text-zinc-500 mx-auto mb-3" />
              <h3 className="text-base font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                No hay subcuentas configuradas
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                Añade tu primera conexión a un exchange para empezar.
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir subcuenta
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {subaccounts.map((sub) => {
                  // Extraer identificador y nombre de exchange
                  const { identifier, exchangeName } = parseDisplayName(sub.name);
                  
                  return (
                    <motion.div
                      key={sub.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              {/* Nombre del exchange como Badge */}
                              <div className="mb-1">
                                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                                  {exchangeName}
                                </Badge>
                              </div>
                              
                              {/* Identificador como título principal */}
                              <CardTitle className="text-base">
                                {identifier ? identifier : 'Subcuenta'} 
                              </CardTitle>
                              
                              {/* Fecha de conexión */}
                              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                Conectada: {new Date(sub.created_at || "").toLocaleDateString()}
                              </p>
                            </div>
                            
                            {/* Botones de acciones */}
                            <div className="flex gap-1">
                              {/* Botón de ver balance */}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                onClick={() => fetchBalance(sub.id)}
                              >
                                <Wallet className="h-4 w-4" />
                              </Button>
                              
                              {/* Botón de eliminar */}
                              <Dialog open={confirmDelete === sub.id} onOpenChange={(open) => !open && setConfirmDelete(null)}>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => openDeleteConfirm(sub.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>¿Eliminar esta subcuenta?</DialogTitle>
                                    <DialogDescription>
                                      Estás a punto de eliminar la conexión con <strong>{sub.name}</strong>. Esta acción no se puede deshacer.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter className="mt-4">
                                    <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                                      Cancelar
                                    </Button>
                                    <Button variant="destructive" onClick={() => handleDelete(sub.id)}>
                                      Eliminar
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                              <span>Conectada</span>
                            </div>
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

      {/* Modal para mostrar balance */}
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
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : balanceError ? (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-600 dark:text-red-300">
              <p className="font-medium mb-1">Error al obtener balance</p>
              <p className="text-sm">{balanceError}</p>
            </div>
          ) : balanceData ? (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Balance Total:
                </h3>
                <p className="text-2xl font-semibold text-blue-700 dark:text-blue-300">
                  ${balanceData.balance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Activos:
                </h3>
                {balanceData.assets.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No hay activos disponibles.
                  </p>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Moneda</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Valor USD</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {balanceData.assets.map((asset, index) => (
                          <TableRow key={asset.coin + index} className={index % 2 === 0 ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''}>
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
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-zinc-500 dark:text-zinc-400">
              No hay datos de balance disponibles.
            </p>
          )}
          
          <DialogFooter>
            <Button onClick={() => setBalanceDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 