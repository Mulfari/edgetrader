"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, Key, Eye, EyeOff, Trash2, Edit } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface SubAccount {
  id: string;
  name: string;
  exchange: string;
  apiKey: string;
  apiSecret: string;
  isDemo: boolean;
}

interface ManageSubAccountProps {
  subAccountId: string;
  onClose?: () => void;
  onUpdate?: () => void;
}

export default function ManageSubAccount({ subAccountId, onClose, onUpdate }: ManageSubAccountProps) {
  const [subAccount, setSubAccount] = useState<SubAccount | null>(null)
  const [name, setName] = useState("")
  const [exchange, setExchange] = useState("bybit")
  const [apiKey, setApiKey] = useState("")
  const [apiSecret, setApiSecret] = useState("")
  const [isDemo, setIsDemo] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")
  const [showSecret, setShowSecret] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSubAccount = async () => {
      setIsLoading(true)
      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          throw new Error("No hay token de autenticación");
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subaccounts/${subAccountId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error("Error al obtener la subcuenta");
        }

        const data = await response.json();
        setSubAccount(data);
        setName(data.name);
        setExchange(data.exchange);
        setApiKey(data.apiKey);
        setApiSecret(data.apiSecret || ""); // La API Secret podría estar oculta
        setIsDemo(data.isDemo || false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al obtener la subcuenta";
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
    };

    if (subAccountId) {
      fetchSubAccount();
    }
  }, [subAccountId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subaccounts/${subAccountId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          exchange,
          apiKey,
          apiSecret,
          isDemo,
        }),
      })

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error al actualizar la subcuenta");
      }

      toast({
        title: "Subcuenta actualizada",
        description: `La subcuenta ${isDemo ? 'demo' : ''} se ha actualizado correctamente`,
      });

      if (onUpdate) {
        onUpdate();
      }

      if (onClose) {
        onClose();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al actualizar la subcuenta";
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

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subaccounts/${subAccountId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error("Error al eliminar la subcuenta");
      }

      toast({
        title: "Subcuenta eliminada",
        description: "La subcuenta se ha eliminado correctamente",
      });

      if (onUpdate) {
        onUpdate();
      }

      if (onClose) {
        onClose();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar la subcuenta";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      console.error(err);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  if (isLoading && !subAccount) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-bold">Gestionar Subcuenta</CardTitle>
          <CardDescription>
            Actualiza o elimina la información de tu subcuenta.
          </CardDescription>
        </div>
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente tu subcuenta
                y todos los datos asociados a ella.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Eliminar"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isDemo" 
                checked={isDemo} 
                onCheckedChange={(checked: boolean | "indeterminate") => setIsDemo(checked === true)}
              />
              <Label 
                htmlFor="isDemo" 
                className="text-sm font-medium cursor-pointer"
              >
                Esta es una cuenta demo
              </Label>
            </div>
            <div className={`text-xs text-muted-foreground ${isDemo ? 'block' : 'hidden'}`}>
              <p className="mb-1">Al marcar esta opción, se utilizará la API de demo de Bybit:</p>
              <p className="font-mono text-xs bg-muted p-1 rounded">https://api-demo.bybit.com</p>
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
                  Actualizando...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Actualizar Subcuenta
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 