"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2, LayoutDashboard, LineChart, Settings, Users, CreditCard } from "lucide-react";
import SubAccounts from "@/components/SubAccounts";
import SubAccountManager from "@/components/SubAccountManager";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [totalBalance, setTotalBalance] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleBalanceUpdate = (balance: number) => {
    setTotalBalance(balance);
  };

  const handleSubAccountSuccess = () => {
    console.log("Actualizando lista de subcuentas después de operación exitosa");
    
    // Cerrar modales
    setShowCreateModal(false);
    setShowDeleteModal(false);
    
    // Limpiar localStorage para forzar recarga de datos
    localStorage.removeItem("subAccounts");
    localStorage.removeItem("accountBalances");
    
    // Dar tiempo para que se cierren los modales antes de actualizar
    setTimeout(() => {
      try {
        // Intentar encontrar el componente de subcuentas y enviar evento de actualización
        const subaccountsComponent = document.getElementById('subaccounts-component');
        if (subaccountsComponent) {
          console.log("Enviando evento refresh al componente de subcuentas");
          const refreshEvent = new CustomEvent('refresh', { bubbles: true });
          subaccountsComponent.dispatchEvent(refreshEvent);
        } else {
          console.error("No se encontró el componente de subcuentas para actualizar");
        }
      } catch (error) {
        console.error("Error al intentar actualizar subcuentas:", error);
      }
    }, 500);
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-gradient-to-b from-background to-muted/20 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Bienvenido a tu panel de control de trading</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Subcuenta
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowDeleteModal(true)}
            className="border-primary/20 hover:bg-primary/5 transition-all duration-200"
          >
            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
            Eliminar Subcuenta
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList className="bg-background border border-primary/10 p-1">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-200"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Vista General
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-200"
            >
              <LineChart className="mr-2 h-4 w-4" />
              Análisis
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-200"
            >
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </TabsTrigger>
          </TabsList>
          
          {totalBalance !== null && (
            <Card className="shadow-sm border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Balance Total</p>
                    <p className="text-2xl font-bold text-primary">${totalBalance.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm border-primary/10 hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2 bg-primary/5">
                <CardTitle className="text-sm font-medium text-muted-foreground">Subcuentas Activas</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">5</div>
                <p className="text-xs text-muted-foreground mt-1">+2 desde el mes pasado</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-primary/10 hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2 bg-primary/5">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rendimiento Total</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">+12.5%</div>
                <p className="text-xs text-muted-foreground mt-1">+2.3% desde la semana pasada</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-primary/10 hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2 bg-primary/5">
                <CardTitle className="text-sm font-medium text-muted-foreground">Operaciones Abiertas</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">12</div>
                <p className="text-xs text-muted-foreground mt-1">3 operaciones nuevas hoy</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-primary/10 hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2 bg-primary/5">
                <CardTitle className="text-sm font-medium text-muted-foreground">Alertas Activas</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">7</div>
                <p className="text-xs text-muted-foreground mt-1">2 alertas próximas a activarse</p>
              </CardContent>
            </Card>
          </div>

          <SubAccounts onBalanceUpdate={handleBalanceUpdate} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="shadow-sm border-primary/10">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Análisis de Rendimiento</CardTitle>
              <CardDescription>Visualiza el rendimiento de tus inversiones a lo largo del tiempo</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center bg-muted/20 rounded-md">
              <div className="text-center text-muted-foreground">
                <LineChart className="h-12 w-12 mx-auto mb-4 text-primary/40" />
                <p className="text-lg font-medium">Análisis próximamente</p>
                <p className="text-sm max-w-md mx-auto mt-2">
                  Estamos trabajando en herramientas avanzadas de análisis para ayudarte a visualizar y optimizar tu rendimiento.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="shadow-sm border-primary/10">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Configuración de la Cuenta</CardTitle>
              <CardDescription>Administra las preferencias de tu cuenta y notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center bg-muted/20 rounded-md">
              <div className="text-center text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 text-primary/40" />
                <p className="text-lg font-medium">Configuración próximamente</p>
                <p className="text-sm max-w-md mx-auto mt-2">
                  Pronto podrás personalizar tu experiencia, configurar notificaciones y ajustar preferencias de seguridad.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in-0 duration-200">
          <div className="w-full max-w-md p-4 animate-in slide-in-from-bottom-10 duration-300">
            <SubAccountManager 
              mode="create" 
              onSuccess={handleSubAccountSuccess} 
              onCancel={() => setShowCreateModal(false)} 
            />
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in-0 duration-200">
          <div className="w-full max-w-md p-4 animate-in slide-in-from-bottom-10 duration-300">
            <SubAccountManager 
              mode="delete" 
              onSuccess={handleSubAccountSuccess} 
              onCancel={() => setShowDeleteModal(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}