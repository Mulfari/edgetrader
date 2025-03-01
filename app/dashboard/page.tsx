"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut, TrendingUp, Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import SubAccounts from "@/components/SubAccounts";
import Operations from "@/components/Operations";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import CreateSubAccount from "@/components/CreateSubAccounts";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// Definir el tipo de operación
interface Trade {
  id: string;
  userId: string;
  pair: string;
  type: "buy" | "sell";
  entryPrice: number;
  exitPrice?: number;
  amount: number;
  status: "open" | "closed";
  openDate: string;
  closeDate?: string;
  pnl?: number;
  market: "spot" | "futures";
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
}

// Interfaz para el token decodificado
interface DecodedToken {
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showCreateSubAccount, setShowCreateSubAccount] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Definir handleLogout antes de usarlo
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('subAccounts');
    localStorage.removeItem('accountBalances');
    setCurrentUserId(null);
    setTrades([]);
    setTotalBalance(0);
    setDataLoaded(false);
    setAuthChecked(false);
    router.push("/login");
  }, [router]);

  // Verificar si el token es válido (expiración)
  const isTokenValid = useCallback((token: string): boolean => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;
      
      console.log('Token expira en:', new Date(decoded.exp * 1000).toLocaleString());
      console.log('Hora actual:', new Date(currentTime * 1000).toLocaleString());
      
      if (decoded.exp < currentTime) {
        console.log('Token expirado');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return false;
    }
  }, []);

  // Función para refrescar los datos
  const refreshData = useCallback(() => {
    // Verificar token antes de refrescar
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
      toast({
        variant: "destructive",
        title: "Error de sesión",
        description: "No se pudo actualizar. Sesión no válida."
      });
      return;
    }
    
    // Verificar si el token es válido
    if (!isTokenValid(token)) {
      toast({
        variant: "destructive",
        title: "Sesión expirada",
        description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
      });
      handleLogout();
      return;
    }
    
    // Si el token es válido, proceder con la actualización
    setRefreshing(true);
    setDataLoaded(false);
    
    // Simular un pequeño retraso para mostrar el indicador de carga
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, [toast, isTokenValid, handleLogout]);

  // Verificar autenticación solo una vez al cargar
  useEffect(() => {
    console.log('Ejecutando efecto de verificación de autenticación, authChecked:', authChecked);
    
    if (authChecked) return;

    const checkAuth = () => {
      console.log('Verificando autenticación...');
      
      // Comprobar si hay token y userId en localStorage
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      console.log('Token encontrado:', !!token);
      console.log('UserId encontrado:', !!userId);

      if (!token || !userId) {
        console.log('No hay token o userId, redirigiendo a login');
        setAuthError('No hay sesión activa');
        toast({
          variant: "destructive",
          title: "Sesión no iniciada",
          description: "Por favor, inicia sesión para acceder al dashboard."
        });
        router.push('/login');
        return;
      }

      // Verificar si el token ha expirado
      if (!isTokenValid(token)) {
        console.log('Token expirado, redirigiendo a login');
        toast({
          variant: "destructive",
          title: "Sesión expirada",
          description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
        });
        handleLogout();
        return;
      }

      // Si hay token y userId válidos, establecer el estado
      console.log('Token válido, estableciendo userId:', userId);
      setCurrentUserId(userId);
      setIsLoading(false);
      setAuthChecked(true);
    };

    // Ejecutar verificación después de un pequeño retraso para asegurar que el componente esté montado
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, [router, isTokenValid, toast, authChecked, handleLogout]);

  // Función para obtener las operaciones de la API
  const fetchTrades = useCallback(async (userId: string, subAccountId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: "No hay token de autenticación"
        });
        return;
      }

      if (!userId || userId === 'undefined') {
        toast({
          variant: "destructive",
          title: "Error de usuario",
          description: "ID de usuario no válido"
        });
        return;
      }

      if (!subAccountId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "ID de subcuenta no válido"
        });
        return;
      }

      console.log(`📡 Obteniendo operaciones para usuario ${userId} y subcuenta ${subAccountId}`);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/account-details/${userId}/${subAccountId}/trades`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            variant: "destructive",
            title: "Error de autenticación",
            description: "Token inválido o expirado"
          });
          return;
        }
        
        if (response.status === 404) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Subcuenta no encontrada"
          });
          return;
        }

        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener operaciones');
      }

      const data = await response.json();
      setTrades(data);
    } catch (error) {
      console.error('Error al obtener operaciones:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al obtener operaciones"
      });
    }
  }, [toast]);

  // Función para actualizar el balance total y obtener operaciones
  const updateTotalBalance = useCallback((balance: number, subAccountId: string, forceRefresh = false) => {
    setTotalBalance(balance);
    
    // Solo cargar datos si no se han cargado antes o si se fuerza la recarga
    if ((subAccountId && currentUserId && (!dataLoaded || forceRefresh))) {
      fetchTrades(currentUserId, subAccountId);
      setDataLoaded(true);
    } else if (!subAccountId || !currentUserId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Falta ID de usuario o subcuenta"
      });
    }
  }, [currentUserId, dataLoaded, fetchTrades, toast]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <p className="text-center text-muted-foreground">Cargando datos...</p>
    </div>;
  }

  if (authError) {
    return <div className="flex flex-col items-center justify-center min-h-screen">
      <p className="text-center text-red-500 mb-4">{authError}</p>
      <Button onClick={() => router.push('/login')}>Ir a Login</Button>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold">Dashboard Financiero</h1>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData} 
                disabled={refreshing || isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBalance.toFixed(2)} USDT</div>
                <p className="text-xs text-muted-foreground mt-1">Balance agregado de todas las cuentas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rendimiento Promedio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">- %</div>
                <Progress value={0} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="accounts" className="space-y-4">
            <TabsList>
              <TabsTrigger value="accounts">Subcuentas</TabsTrigger>
              <TabsTrigger value="trades">Operaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="accounts" className="space-y-4">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setShowCreateSubAccount(true)}>
                  Añadir Subcuenta
                </Button>
              </div>
              <SubAccounts 
                onBalanceUpdate={(balance, subAccountId) => updateTotalBalance(balance, subAccountId, refreshing)} 
                refreshTrigger={refreshing} 
              />
            </TabsContent>

            <TabsContent value="trades" className="space-y-4">
              <div className="bg-card rounded-lg">
                <Operations trades={trades} />
              </div>
            </TabsContent>
          </Tabs>
        </>
      </main>

      <Dialog open={showCreateSubAccount} onOpenChange={setShowCreateSubAccount}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogTitle className="sr-only">Crear Nueva Subcuenta</DialogTitle>
          <CreateSubAccount onClose={() => {
            setShowCreateSubAccount(false);
            refreshData();
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}