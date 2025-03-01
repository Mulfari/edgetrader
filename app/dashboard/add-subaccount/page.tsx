"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AddSubAccountPage() {
  const [formData, setFormData] = useState({
    name: "",
    exchange: "bybit",
    apiKey: "",
    apiSecret: "",
    isDemo: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No hay token, redirigiendo a login.");
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Error al crear subcuenta - Código ${res.status}`);
      }

      const data = await res.json();
      console.log("Subcuenta creada:", data);
      
      // Redirigir al dashboard
      router.push("/dashboard");
    } catch (error: any) {
      console.error("❌ Error al crear subcuenta:", error);
      setError(error.message || "Error al crear subcuenta. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

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
          <CardTitle className="text-2xl font-bold">Agregar Nueva Subcuenta</CardTitle>
          <CardDescription>
            Ingresa los detalles de tu nueva subcuenta de trading.
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
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="Ingresa tu API Key"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret</Label>
              <Input
                id="apiSecret"
                type="password"
                value={formData.apiSecret}
                onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                placeholder="Ingresa tu API Secret"
                required
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Subcuenta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 