"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, Server, Key, Eye, EyeOff } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface CreateSubAccountProps {
  onClose?: () => void;
}

export default function CreateSubAccount({ onClose }: CreateSubAccountProps) {
  const [name, setName] = useState("")
  const [exchange, setExchange] = useState("bybit")
  const [apiKey, setApiKey] = useState("")
  const [apiSecret, setApiSecret] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showSecret, setShowSecret] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subaccounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          exchange,
          apiKey,
          apiSecret,
        }),
      })

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error al crear la subcuenta");
      }

      toast({
        title: "Subcuenta creada",
        description: "La subcuenta se ha creado correctamente",
      });

      if (onClose) {
        onClose();
      }
      
      router.refresh(); // Refrescar la página para mostrar la nueva subcuenta
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al crear la subcuenta";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Crear Nueva Subcuenta</CardTitle>
        <CardDescription>
          Conecta tu cuenta de exchange para monitorear tus operaciones y balance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nombre de la Subcuenta
              </Label>
              <Input
                id="name"
                placeholder="Mi Cuenta Principal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="exchange" className="text-sm font-medium">
                Exchange
              </Label>
              <Select value={exchange} onValueChange={setExchange}>
                <SelectTrigger id="exchange">
                  <SelectValue placeholder="Selecciona un exchange" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bybit">Bybit</SelectItem>
                  <SelectItem value="binance">Binance</SelectItem>
                  <SelectItem value="kucoin">KuCoin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="apiKey" className="text-sm font-medium">
                API Key
              </Label>
              <div className="flex items-center space-x-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="apiKey"
                  placeholder="Ingresa tu API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="apiSecret" className="text-sm font-medium">
                API Secret
              </Label>
              <div className="flex items-center space-x-2 relative">
                <Key className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="apiSecret"
                  type={showSecret ? "text" : "password"}
                  placeholder="Ingresa tu API Secret"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  required
                  className="flex-1 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tus credenciales están seguras y encriptadas. Nunca compartimos tus claves con terceros.
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-red-600 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            {onClose && (
              <Button variant="outline" type="button" onClick={onClose}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Server className="mr-2 h-4 w-4" />
                  Crear Subcuenta
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}