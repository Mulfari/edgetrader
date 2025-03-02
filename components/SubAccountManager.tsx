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
  Tag,
  Briefcase
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
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

    // Validación del formulario
    const errors: Record<string, string> = {}
    if (!newAccount.name) errors.name = "El nombre es obligatorio"
    if (!newAccount.exchange) errors.exchange = "Debes seleccionar un exchange"
    if (!newAccount.apiKey) errors.apiKey = "La API Key es obligatoria"
    if (!newAccount.apiSecret) errors.apiSecret = "El API Secret es obligatorio"
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    setFormErrors({})

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

        {error && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm flex items-start gap-2 animate-in fade-in-50 slide-in-from-top-5 duration-200">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 text-green-600 dark:text-green-400 rounded-lg p-3 text-sm flex items-start gap-2 animate-in fade-in-50 slide-in-from-top-5 duration-200">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>{success}</p>
          </div>
        )}

        {mode === "create" ? (
          <form onSubmit={handleAddAccount} className="space-y-6">
            <Card className="border-primary/10 bg-primary/5">
              <CardContent className="pt-6">
                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Tag className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nombre de la Subcuenta
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Un nombre descriptivo para identificar esta cuenta
                      </p>
                    </div>
                  </div>
                  <div className="pl-12">
                    <Input
                      id="name"
                      placeholder="Ej: Bybit Principal"
                      value={newAccount.name}
                      onChange={(e) => {
                        setNewAccount({ ...newAccount, name: e.target.value })
                        if (formErrors.name) {
                          const newErrors = { ...formErrors }
                          delete newErrors.name
                          setFormErrors(newErrors)
                        }
                      }}
                      className={formErrors.name ? "border-red-300 focus-visible:ring-red-300" : ""}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-red-500 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-200">{formErrors.name}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/10 bg-primary/5">
              <CardContent className="pt-6">
                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Database className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <Label htmlFor="exchange" className="text-sm font-medium">
                        Exchange
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Selecciona la plataforma de trading
                      </p>
                    </div>
                  </div>
                  <div className="pl-12">
                    <Select
                      value={newAccount.exchange}
                      onValueChange={(value) => {
                        setNewAccount({ ...newAccount, exchange: value })
                        if (formErrors.exchange) {
                          const newErrors = { ...formErrors }
                          delete newErrors.exchange
                          setFormErrors(newErrors)
                        }
                      }}
                    >
                      <SelectTrigger className={formErrors.exchange ? "border-red-300 focus-visible:ring-red-300" : ""}>
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
                    {formErrors.exchange && (
                      <p className="text-xs text-red-500 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-200">{formErrors.exchange}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/10 bg-primary/5">
              <CardContent className="pt-6">
                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <KeyRound className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <Label htmlFor="apiKey" className="text-sm font-medium">
                        Credenciales API
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Ingresa tus credenciales de API del exchange
                      </p>
                    </div>
                  </div>
                  <div className="pl-12 space-y-4">
                    <div>
                      <Label htmlFor="apiKey" className="text-xs mb-1.5 block">
                        API Key
                      </Label>
                      <Input
                        id="apiKey"
                        placeholder="Ingresa tu API Key"
                        value={newAccount.apiKey}
                        onChange={(e) => {
                          setNewAccount({ ...newAccount, apiKey: e.target.value })
                          if (formErrors.apiKey) {
                            const newErrors = { ...formErrors }
                            delete newErrors.apiKey
                            setFormErrors(newErrors)
                          }
                        }}
                        className={formErrors.apiKey ? "border-red-300 focus-visible:ring-red-300" : ""}
                      />
                      {formErrors.apiKey && (
                        <p className="text-xs text-red-500 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-200">{formErrors.apiKey}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="apiSecret" className="text-xs mb-1.5 block">
                        API Secret
                      </Label>
                      <div className="relative">
                        <Input
                          id="apiSecret"
                          type={showApiSecret ? "text" : "password"}
                          placeholder="Ingresa tu API Secret"
                          value={newAccount.apiSecret}
                          onChange={(e) => {
                            setNewAccount({ ...newAccount, apiSecret: e.target.value })
                            if (formErrors.apiSecret) {
                              const newErrors = { ...formErrors }
                              delete newErrors.apiSecret
                              setFormErrors(newErrors)
                            }
                          }}
                          className={`pr-10 ${formErrors.apiSecret ? "border-red-300 focus-visible:ring-red-300" : ""}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowApiSecret(!showApiSecret)}
                        >
                          {showApiSecret ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="sr-only">
                            {showApiSecret ? "Ocultar contraseña" : "Mostrar contraseña"}
                          </span>
                        </Button>
                      </div>
                      {formErrors.apiSecret && (
                        <p className="text-xs text-red-500 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-200">{formErrors.apiSecret}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDemo"
                  checked={newAccount.isDemo}
                  onChange={handleDemoCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isDemo" className="text-sm flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                  Cuenta Demo
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Marca esta opción si es una cuenta de práctica
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Subcuenta"
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            {accounts.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-muted/30 p-4 rounded-full mb-4">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No hay subcuentas disponibles</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  No se encontraron subcuentas para eliminar. Primero debes crear una subcuenta.
                </p>
                <Button 
                  className="mt-6 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                  onClick={() => {
                    onCancel()
                    // Aquí podrías añadir lógica para abrir el modal de creación
                  }}
                >
                  Crear Nueva Subcuenta
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar subcuentas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  {isLoading ? (
                    <div className="py-8 flex flex-col items-center justify-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
                      <p className="text-sm text-muted-foreground">Cargando subcuentas...</p>
                    </div>
                  ) : (
                    <div className="mt-4 border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Exchange</TableHead>
                            <TableHead>Tipo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAccounts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center">
                                No se encontraron resultados para &quot;{searchTerm}&quot;
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredAccounts.map((account) => (
                              <TableRow 
                                key={account.id} 
                                className={`cursor-pointer transition-colors hover:bg-purple-50/50 dark:hover:bg-purple-900/20 ${
                                  selectedAccountId === account.id ? "bg-destructive/10 hover:bg-destructive/20" : ""
                                }`}
                                onClick={() => setSelectedAccountId(account.id)}
                              >
                                <TableCell>
                                  <div className="flex items-center justify-center">
                                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                                      selectedAccountId === account.id 
                                        ? "border-destructive bg-destructive/10" 
                                        : "border-muted-foreground/30"
                                    }`}>
                                      {selectedAccountId === account.id && (
                                        <div className="h-2 w-2 rounded-full bg-destructive" />
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">{account.name}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="uppercase">
                                    {account.exchange}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {account.isDemo ? (
                                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 border-yellow-200 dark:border-yellow-800/30">
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      Demo
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 border-green-200 dark:border-green-800/30">
                                      <Briefcase className="h-3 w-3 mr-1" />
                                      Real
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-col space-y-2">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
                    <p className="font-medium text-destructive mb-1 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4" />
                      Advertencia
                    </p>
                    <p className="text-muted-foreground">
                      Esta acción eliminará permanentemente la subcuenta seleccionada y no podrá ser recuperada.
                    </p>
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={!selectedAccountId || isSubmitting}
                    className="w-full sm:w-auto gap-2"
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
                </DialogFooter>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
} 