"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Search, 
  RefreshCw, 
  Trash2, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle2,
  Server,
  Sparkles,
  KeyRound,
  Database,
  Tag
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface SubAccount {
  id: string
  exchange: string
  apiKey: string
  apiSecret: string
  name: string
  isDemo: boolean
}

type ApiError = {
  message: string;
}

type SubAccountManagerProps = {
  mode: "create" | "delete";
  onSuccess: () => void;
  onCancel: () => void;
}

const exchangeOptions = [
  { value: "bybit", label: "Bybit" },
  { value: "binance", label: "Binance" },
  { value: "kucoin", label: "KuCoin" },
  { value: "ftx", label: "FTX" },
]

function getToken(): string | null {
  return localStorage.getItem("token") || null
}

export default function SubAccountManager({ mode, onSuccess, onCancel }: SubAccountManagerProps) {
  const [accounts, setAccounts] = useState<SubAccount[]>([])
  const [newAccount, setNewAccount] = useState({
    exchange: "",
    apiKey: "",
    apiSecret: "",
    name: "",
    isDemo: false
  })
  const [showApiSecret, setShowApiSecret] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const router = useRouter()
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

  const fetchAccounts = useCallback(async () => {
    const token = getToken()
    if (!token) {
      console.error("❌ No hay token, redirigiendo a login.")
      router.push("/login")
      return
    }

    setIsLoading(true)
    setError(null)
    console.log("Intentando cargar subcuentas desde:", `${API_URL}/subaccounts`)

    try {
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      })

      console.log("Respuesta del servidor:", res.status, res.statusText)

      if (!res.ok) {
        if (res.status === 401) {
          console.error("❌ Token inválido, redirigiendo a login.")
          localStorage.removeItem("token")
          router.push("/login")
        }
        throw new Error(`Error al cargar las subcuentas. Código: ${res.status}`)
      }

      const data: SubAccount[] = await res.json()
      console.log("Subcuentas cargadas:", data)
      setAccounts(data)
      
      if (data.length === 0) {
        setError("No se encontraron subcuentas. Crea una nueva subcuenta primero.")
      }
    } catch (error: Error | ApiError | unknown) {
      console.error("❌ Error al cargar subcuentas:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al cargar las subcuentas. Intenta nuevamente más tarde."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [API_URL, router])

  useEffect(() => {
    if (mode === "delete") {
      fetchAccounts()
    } else {
      // Resetear el formulario cuando se abre el modal de creación
      setNewAccount({
        exchange: "",
        apiKey: "",
        apiSecret: "",
        name: "",
        isDemo: false
      })
      setError(null)
      setSuccess(null)
    }
  }, [mode, fetchAccounts])

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = getToken()
    if (!token) {
      setError("No estás autenticado. Por favor inicia sesión nuevamente.")
      return
    }

    if (!newAccount.name || !newAccount.exchange || !newAccount.apiKey || !newAccount.apiSecret) {
      setError("Por favor completa todos los campos requeridos.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Crear una copia del objeto para asegurar que isDemo se envía correctamente
      const accountData = {
        ...newAccount,
        isDemo: newAccount.isDemo
      }
      
      console.log("Enviando datos de subcuenta:", accountData)
      
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(accountData),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({})) as ApiError
        throw new Error(errorData.message || "Error al crear la subcuenta")
      }

      // Limpiar el localStorage para forzar una recarga fresca de datos
      localStorage.removeItem("subAccounts")
      localStorage.removeItem("accountBalances")
      
      setSuccess("¡Subcuenta creada exitosamente!")
      
      // Esperar un momento antes de cerrar el modal para mostrar el mensaje de éxito
      setTimeout(() => {
        setNewAccount({ exchange: "", apiKey: "", apiSecret: "", name: "", isDemo: false })
        if (onSuccess) onSuccess()
        onCancel()
      }, 1500)
    } catch (error: Error | ApiError | unknown) {
      console.error("❌ Error al crear subcuenta:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al crear la subcuenta. Intenta nuevamente más tarde."
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!selectedAccountId) {
      setError("Debes seleccionar una cuenta para eliminar")
      return
    }

    const token = getToken()
    if (!token) {
      console.error("❌ No hay token, redirigiendo a login.")
      router.push("/login")
      return
    }

    if (!confirm(`¿Estás seguro que deseas eliminar la subcuenta "${accounts.find(a => a.id === selectedAccountId)?.name}"?`)) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/subaccounts/${selectedAccountId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      })

      if (!res.ok) {
        throw new Error("Error al eliminar la subcuenta")
      }

      // Limpiar el localStorage para forzar una recarga fresca de datos
      localStorage.removeItem("subAccounts")
      localStorage.removeItem("accountBalances")
      
      // Actualizar la lista local de cuentas
      setAccounts(accounts.filter(account => account.id !== selectedAccountId))
      
      // Mostrar mensaje de éxito
      setSuccess(`Subcuenta "${accounts.find(a => a.id === selectedAccountId)?.name}" eliminada exitosamente`)
      
      // Esperar un momento antes de llamar a onSuccess
      setTimeout(() => {
        if (onSuccess) onSuccess()
      }, 500)
    } catch (error: Error | ApiError | unknown) {
      console.error("❌ Error al eliminar subcuenta:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al eliminar la subcuenta. Intenta nuevamente más tarde."
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredAccounts = accounts.filter(
    (account) => account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                account.exchange.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Función para manejar el cambio en el checkbox de Demo
  const handleDemoCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Checkbox Demo cambiado a:", e.target.checked)
    setNewAccount({ ...newAccount, isDemo: e.target.checked })
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className={mode === "delete" ? "sm:max-w-[600px]" : "sm:max-w-[550px]"}>
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {mode === "create" ? (
              <>
                <Server className="h-5 w-5 text-primary" />
                Agregar Nueva Subcuenta
              </>
            ) : (
              <>
                <Trash2 className="h-5 w-5 text-destructive" />
                Eliminar Subcuenta
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {mode === "create" 
              ? "Ingresa los detalles de tu subcuenta de exchange para monitorearla."
              : "Selecciona la subcuenta que deseas eliminar."}
          </DialogDescription>
        </DialogHeader>

        {mode === "create" ? (
          <form onSubmit={handleAddAccount} className="space-y-6">
            <Card className="border-primary/10 bg-primary/5">
              <CardContent className="pt-6">
                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Tag className="h-5 w-5 text-primary" />
                    </div>
                    <div className="grid gap-1.5 flex-1">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nombre de la Subcuenta
                      </Label>
                      <Input
                        id="name"
                        value={newAccount.name}
                        onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                        placeholder="Mi Subcuenta"
                        className="h-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div className="grid gap-1.5 flex-1">
                      <Label htmlFor="exchange" className="text-sm font-medium">
                        Exchange
                      </Label>
                      <Select 
                        value={newAccount.exchange} 
                        onValueChange={(value) => setNewAccount({ ...newAccount, exchange: value })}
                        required
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecciona un exchange" />
                        </SelectTrigger>
                        <SelectContent>
                          {exchangeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <KeyRound className="h-5 w-5 text-primary" />
                    </div>
                    <div className="grid gap-1.5 flex-1">
                      <Label htmlFor="apiKey" className="text-sm font-medium">
                        API Key
                      </Label>
                      <Input
                        id="apiKey"
                        value={newAccount.apiKey}
                        onChange={(e) => setNewAccount({ ...newAccount, apiKey: e.target.value })}
                        placeholder="Ingresa tu API Key"
                        className="h-10 font-mono text-sm"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <KeyRound className="h-5 w-5 text-primary" />
                    </div>
                    <div className="grid gap-1.5 flex-1">
                      <Label htmlFor="apiSecret" className="text-sm font-medium">
                        API Secret
                      </Label>
                      <div className="relative">
                        <Input
                          id="apiSecret"
                          type={showApiSecret ? "text" : "password"}
                          value={newAccount.apiSecret}
                          onChange={(e) => setNewAccount({ ...newAccount, apiSecret: e.target.value })}
                          placeholder="Ingresa tu API Secret"
                          className="h-10 pr-10 font-mono text-sm"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowApiSecret(!showApiSecret)}
                        >
                          {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
              <div className="bg-yellow-500/10 p-2 rounded-full">
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <Label htmlFor="isDemo" className="text-sm font-medium flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDemo"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={newAccount.isDemo}
                    onChange={handleDemoCheckboxChange}
                    disabled={isSubmitting}
                  />
                  <span>Esta es una cuenta Demo</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Marca esta opción si estás usando una cuenta de práctica sin fondos reales
                </p>
              </div>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm border border-destructive/50 bg-destructive/10 text-destructive rounded-md">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            {success && (
              <div className="flex items-center gap-2 p-3 text-sm border border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <p>{success}</p>
              </div>
            )}
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-1">
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    Guardar Subcuenta
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar subcuentas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={fetchAccounts}
                disabled={isLoading}
                className="h-10 w-10"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm border border-destructive/50 bg-destructive/10 text-destructive rounded-md">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            {success && (
              <div className="flex items-center gap-2 p-3 text-sm border border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <p>{success}</p>
              </div>
            )}

            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Nombre</TableHead>
                    <TableHead className="w-[30%]">Exchange</TableHead>
                    <TableHead className="w-[20%]">Tipo</TableHead>
                    <TableHead className="text-right w-[10%]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index} className="h-[57px]">
                        <TableCell className="font-medium">
                          <div className="h-5 w-[150px] bg-muted animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-[100px] bg-muted animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-5 w-[80px] bg-muted animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="h-8 w-8 bg-muted animate-pulse rounded-full ml-auto"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                          <AlertCircle className="h-12 w-12 mb-3 text-muted-foreground/70" />
                          <p className="text-sm font-medium mb-2">No se encontraron subcuentas</p>
                          <p className="text-xs text-muted-foreground">
                            {searchTerm ? "Intenta ajustar el término de búsqueda" : "No hay subcuentas disponibles"}
                          </p>
                          {!searchTerm && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-4"
                              onClick={() => {
                                onCancel();
                                // Pequeño retraso para evitar problemas con la animación del modal
                                setTimeout(() => {
                                  // Aquí deberías tener una forma de abrir el modal de creación
                                  if (onSuccess) onSuccess();
                                }, 300);
                              }}
                            >
                              Crear una subcuenta
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAccounts.map((account) => (
                      <TableRow key={account.id} className="transition-colors hover:bg-muted/50">
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="uppercase">
                            {account.exchange}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {account.isDemo ? (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                              Demo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500">
                              Real
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedAccountId(account.id);
                              setError(null);
                              setSuccess(null);
                            }}
                            disabled={isSubmitting}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={onCancel}>
                Cerrar
              </Button>
              {selectedAccountId && (
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  disabled={isSubmitting}
                  className="gap-1"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Eliminar Subcuenta
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 