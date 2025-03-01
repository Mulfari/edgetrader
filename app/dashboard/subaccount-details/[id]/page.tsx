"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface SubAccount {
  id: string;
  userId: string;
  name: string;
  exchange: string;
  apiKey?: string;
  apiSecret?: string;
  isDemo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Balance {
  totalEquity: number;
  availableBalance: number;
  usedMargin: number;
  orderMargin: number;
  unrealizedPnL: number;
  currency: string;
}

interface ApiError {
  message?: string;
  status?: number;
}

type Props = {
  params: {
    id: string;
  };
};

export default function SubAccountDetailsPage({ params }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subAccount, setSubAccount] = useState<SubAccount | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const router = useRouter();
  const { id } = params;

  const fetchBalance = useCallback(async () => {
    if (!subAccount) return;
    
    setIsLoadingBalance(true);
    setBalanceError(null);
    
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No hay token, redirigiendo a login.");
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/subaccounts/${id}/balance`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({})) as ApiError;
        throw new Error(errorData.message || `Error al obtener balance - Código ${res.status}`);
      }

      const data = await res.json();
      console.log("Balance obtenido:", data);
      
      setBalance({
        totalEquity: data.totalEquity || 0,
        availableBalance: data.availableBalance || 0,
        usedMargin: data.usedMargin || 0,
        orderMargin: data.orderMargin || 0,
        unrealizedPnL: data.unrealizedPnL || 0,
        currency: data.currency || "USDT",
      });
    } catch (error: unknown) {
      console.error("❌ Error al obtener balance:", error);
      setBalanceError(error instanceof Error ? error.message : "Error al obtener balance. Inténtalo de nuevo.");
    } finally {
      setIsLoadingBalance(false);
    }
  }, [id, router, subAccount]);

  useEffect(() => {
    const fetchSubAccount = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("❌ No hay token, redirigiendo a login.");
        router.push("/login");
        return;
      }

      try {
        // Obtener la lista de subcuentas y filtrar por ID
        const res = await fetch(`${API_URL}/subaccounts`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Error al obtener subcuentas - Código ${res.status}`);
        }

        const data = await res.json();
        const account = data.find((acc: SubAccount) => acc.id === id);
        
        if (!account) {
          throw new Error("Subcuenta no encontrada");
        }
        
        setSubAccount(account);
      } catch (error: unknown) {
        console.error("❌ Error al obtener subcuenta:", error);
        setError(error instanceof Error ? error.message : "Error al obtener subcuenta");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubAccount();
  }, [id, router]);

  useEffect(() => {
    if (subAccount) {
      fetchBalance();
    }
  }, [subAccount, fetchBalance]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Dashboard
        </Button>

        <Card className="max-w-2xl mx-auto mb-6">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !subAccount) {
    return (
      <div className="container mx-auto py-8">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Dashboard
        </Button>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
              {error}
            </div>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={() => router.push("/dashboard")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver al Dashboard
      </Button>

      {subAccount && (
        <>
          <Card className="max-w-2xl mx-auto mb-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Detalles de la Subcuenta</CardTitle>
              <CardDescription>
                Información detallada de tu subcuenta de trading.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Nombre</h3>
                    <p className="text-lg font-medium">{subAccount.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Exchange</h3>
                    <p className="text-lg font-medium">{subAccount.exchange}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Tipo de Cuenta</h3>
                    <p className="text-lg font-medium">
                      {subAccount.isDemo ? "Demo" : "Real"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">ID</h3>
                    <p className="text-lg font-medium truncate">{subAccount.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Creada</h3>
                    <p className="text-lg font-medium">{formatDate(subAccount.createdAt)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Última Actualización</h3>
                    <p className="text-lg font-medium">{formatDate(subAccount.updatedAt)}</p>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => router.push(`/dashboard/edit-subaccount/${id}`)}
                  >
                    Editar Subcuenta
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => {
                      if (confirm("¿Estás seguro de que deseas eliminar esta subcuenta? Esta acción no se puede deshacer.")) {
                        const token = localStorage.getItem("token");
                        if (!token) {
                          console.error("❌ No hay token, redirigiendo a login.");
                          router.push("/login");
                          return;
                        }
                        
                        fetch(`${API_URL}/subaccounts/${id}`, {
                          method: "DELETE",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                        })
                          .then(res => {
                            if (!res.ok) {
                              return res.json().then(data => {
                                throw new Error(data.message || `Error al eliminar subcuenta - Código ${res.status}`);
                              });
                            }
                            alert("Subcuenta eliminada correctamente");
                            router.push("/dashboard");
                          })
                          .catch(error => {
                            console.error("❌ Error al eliminar subcuenta:", error);
                            alert(error instanceof Error ? error.message : "Error al eliminar subcuenta. Inténtalo de nuevo.");
                          });
                      }
                    }}
                  >
                    Eliminar Subcuenta
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Balance de la Cuenta</CardTitle>
              <CardDescription>
                Información financiera de tu subcuenta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {balanceError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                  {balanceError}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-4" 
                    onClick={fetchBalance}
                    disabled={isLoadingBalance}
                  >
                    Reintentar
                  </Button>
                </div>
              )}

              {isLoadingBalance ? (
                <div className="space-y-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : balance ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Balance Total</h3>
                      <p className="text-lg font-medium">{formatCurrency(balance.totalEquity)} {balance.currency}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Balance Disponible</h3>
                      <p className="text-lg font-medium">{formatCurrency(balance.availableBalance)} {balance.currency}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Margen Utilizado</h3>
                      <p className="text-lg font-medium">{formatCurrency(balance.usedMargin)} {balance.currency}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Margen de Órdenes</h3>
                      <p className="text-lg font-medium">{formatCurrency(balance.orderMargin)} {balance.currency}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">PnL No Realizado</h3>
                    <p className={`text-lg font-medium ${balance.unrealizedPnL > 0 ? 'text-green-600' : balance.unrealizedPnL < 0 ? 'text-red-600' : ''}`}>
                      {formatCurrency(balance.unrealizedPnL)} {balance.currency}
                    </p>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full mt-4" 
                    onClick={fetchBalance}
                    disabled={isLoadingBalance}
                  >
                    Actualizar Balance
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">No se pudo cargar la información del balance.</p>
                  <Button 
                    variant="outline" 
                    onClick={fetchBalance}
                    disabled={isLoadingBalance}
                  >
                    Cargar Balance
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 