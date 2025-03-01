"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
}

interface ApiError {
  message?: string;
  status?: number;
}

export default function EditSubAccountPage({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState({
    name: "",
    exchange: "bybit",
    apiKey: "",
    apiSecret: "",
    isDemo: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subAccount, setSubAccount] = useState<SubAccount | null>(null);
  const router = useRouter();
  const { id } = params;

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
        setFormData({
          name: account.name,
          exchange: account.exchange,
          apiKey: "", // No mostramos la API key por seguridad
          apiSecret: "", // No mostramos la API secret por seguridad
          isDemo: account.isDemo || false,
        });
      } catch (error: unknown) {
        console.error("❌ Error al obtener subcuenta:", error);
        setError(error instanceof Error ? error.message : "Error al obtener subcuenta");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubAccount();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No hay token, redirigiendo a login.");
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/subaccounts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({})) as ApiError;
        throw new Error(errorData.message || `Error al actualizar subcuenta - Código ${res.status}`);
      }

      const data = await res.json();
      console.log("Subcuenta actualizada:", data);
      
      // Redirigir al dashboard
      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("❌ Error al actualizar subcuenta:", error);
      setError(error instanceof Error ? error.message : "Error al actualizar subcuenta. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
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

        <Card className="max-w-2xl mx-auto">
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

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Editar Subcuenta</CardTitle>
          <CardDescription>
            Actualiza los detalles de tu subcuenta de trading.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Subcuenta</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Mi cuenta principal"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exchange">Exchange</Label>
              <Input
                id="exchange"
                value={formData.exchange}
                onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
                placeholder="Ej: bybit"
                required
              />
              <p className="text-sm text-muted-foreground">
                Actualmente solo soportamos Bybit.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key (Dejar en blanco para mantener la actual)</Label>
              <Input
                id="apiKey"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="Ingresa tu nueva API Key o deja en blanco para mantener la actual"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret (Dejar en blanco para mantener la actual)</Label>
              <Input
                id="apiSecret"
                type="password"
                value={formData.apiSecret}
                onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                placeholder="Ingresa tu nueva API Secret o deja en blanco para mantener la actual"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDemo"
                checked={formData.isDemo}
                onChange={(e) => setFormData({ ...formData, isDemo: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isDemo" className="cursor-pointer">
                Esta es una cuenta de prueba (demo)
              </Label>
            </div>

            <div className="flex gap-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => router.push("/dashboard")}
              >
                Cancelar
              </Button>
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 