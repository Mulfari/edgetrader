"use client"

import { useState, useEffect, useCallback } from "react"
import { 
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
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import * as Dialog from "@radix-ui/react-dialog"
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
]

function getToken(): string | null {
  return localStorage.getItem("token") || null
}

interface NewAccount {
  exchange: string;
  name: string;
  apiKey: string;
  secretKey: string;
  isDemo: boolean;
}

export default function SubAccountManager({ mode, onSuccess, onCancel }: SubAccountManagerProps) {
  const [open, setOpen] = useState(true)
  const [accounts, setAccounts] = useState<SubAccount[]>([])
  const [newAccount, setNewAccount] = useState<NewAccount>({
    exchange: "",
    name: "",
    apiKey: "",
    secretKey: "",
    isDemo: false
  })
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
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

    setError(null)
    console.log("Intentando cargar subcuentas desde:", `${API_URL}/api/subaccounts`)

    try {
      const res = await fetch(`${API_URL}/api/subaccounts`, {
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
    }
  }, [API_URL, router])

  useEffect(() => {
    if (mode === "delete") {
      fetchAccounts()
    } else {
      // Resetear el formulario cuando se abre el modal de creación
      setNewAccount({
        exchange: "",
        name: "",
        apiKey: "",
        secretKey: "",
        isDemo: false
      })
      setError(null)
      setSuccess(null)
    }
  }, [mode, fetchAccounts])

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      setError("No estás autenticado. Por favor inicia sesión nuevamente.");
      router.push("/login");
      return;
    }

    // Validación del formulario
    const errors: Record<string, string> = {};
    if (!newAccount.name.trim()) {
      errors.name = "El nombre es obligatorio";
    } else if (newAccount.name.length < 3) {
      errors.name = "El nombre debe tener al menos 3 caracteres";
    }

    if (!newAccount.exchange) {
      errors.exchange = "Debes seleccionar un exchange";
    } else if (!exchangeOptions.some(opt => opt.value === newAccount.exchange)) {
      errors.exchange = "Exchange no válido";
    }

    if (!newAccount.apiKey.trim()) {
      errors.apiKey = "El API Key es obligatorio";
    } else if (newAccount.apiKey.length < 10) {
      errors.apiKey = "El API Key parece ser demasiado corto";
    }

    if (!newAccount.secretKey.trim()) {
      errors.secretKey = "El Secret Key es obligatorio";
    } else if (newAccount.secretKey.length < 10) {
      errors.secretKey = "El Secret Key parece ser demasiado corto";
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setFormErrors({});

    try {
      console.log("🔄 Creando nueva subcuenta...", {
        exchange: newAccount.exchange,
        name: newAccount.name,
        apiKeyLength: newAccount.apiKey.length
      });
      
      const res = await fetch(`${API_URL}/api/subaccounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          exchange: newAccount.exchange,
          apiKey: newAccount.apiKey.trim(),
          secretKey: newAccount.secretKey.trim(),
          name: newAccount.name.trim(),
          isDemo: newAccount.isDemo
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({})) as ApiError;
        console.error("❌ Error del servidor:", errorData);
        
        // Manejar errores específicos
        if (res.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          throw new Error("Sesión expirada. Por favor inicia sesión nuevamente.");
        } else if (res.status === 400) {
          throw new Error(errorData.message || "Error de validación en los datos proporcionados");
        } else if (res.status === 409) {
          throw new Error("Ya existe una subcuenta con este nombre o API Key");
        } else {
          throw new Error(errorData.message || "Error al crear la subcuenta");
        }
      }

      const data = await res.json();
      console.log("✅ Subcuenta creada exitosamente:", {
        id: data.id,
        name: data.name,
        exchange: data.exchange,
      });

      // Limpiar el localStorage para forzar una recarga fresca de datos
      localStorage.removeItem("subAccounts");
      localStorage.removeItem("accountBalances");
      
      setSuccess("¡Subcuenta creada exitosamente!");
      
      // Llamar a onSuccess inmediatamente para actualizar la lista de subcuentas
      if (onSuccess) onSuccess();
      
      // Esperar un momento antes de cerrar el modal
      setTimeout(() => {
        setNewAccount({
          exchange: "bybit",
          name: "",
          apiKey: "",
          secretKey: "",
          isDemo: false
        });
      }, 1500);
    } catch (error: unknown) {
      console.error("❌ Error al crear subcuenta:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al crear la subcuenta. Intenta nuevamente más tarde.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      const res = await fetch(`${API_URL}/api/subaccounts/${selectedAccountId}`, {
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
      
      // Llamar a onSuccess inmediatamente para actualizar la lista de subcuentas
      if (onSuccess) onSuccess()
      
      // Esperar un momento antes de cerrar el modal
      setTimeout(() => {
        // Limpiar el estado
        setSelectedAccountId(null);
      }, 500)
    } catch (error: Error | ApiError | unknown) {
      console.error("❌ Error al eliminar subcuenta:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al eliminar la subcuenta. Intenta nuevamente más tarde."
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(open) => {
      if (!open) {
        onCancel();
      }
      setOpen(open);
    }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content 
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] dark:bg-slate-900 sm:rounded-lg"
        >
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-xl font-semibold text-slate-900 dark:text-white">
                {mode === "create" ? "Agregar Nueva Subcuenta" : "Eliminar Subcuenta"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  <span className="sr-only">Cerrar</span>
                </Button>
              </Dialog.Close>
            </div>
            
            <Dialog.Description className="sr-only">
              {mode === "create" 
                ? "Formulario para agregar una nueva subcuenta con información de exchange, credenciales API y tipo de cuenta." 
                : "Formulario para eliminar una subcuenta existente del sistema."}
            </Dialog.Description>

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

            <div className="mt-4">
              {mode === "create" ? (
                <form onSubmit={handleAddAccount}>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <Card className="border-blue-100 dark:border-blue-800/30 bg-blue-50/50 dark:bg-blue-950/10">
                        <CardContent className="pt-6">
                          <div className="grid gap-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                                <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <Label htmlFor="name" className="text-sm font-medium">
                                  Nombre de la Subcuenta
                                </Label>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
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
                                className={formErrors.name ? "border-red-300 focus-visible:ring-red-300" : "border-blue-200 dark:border-blue-800/30 focus-visible:ring-blue-300"}
                              />
                              {formErrors.name && (
                                <p className="text-xs text-red-500 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-200">{formErrors.name}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-blue-100 dark:border-blue-800/30 bg-blue-50/50 dark:bg-blue-950/10">
                        <CardContent className="pt-6">
                          <div className="grid gap-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                                <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <Label htmlFor="exchange" className="text-sm font-medium">
                                  Exchange
                                </Label>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Selecciona el exchange al que pertenece esta cuenta
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
                                <SelectTrigger className={formErrors.exchange ? "border-red-300 focus-visible:ring-red-300" : "border-blue-200 dark:border-blue-800/30 focus-visible:ring-blue-300"}>
                                  <SelectValue placeholder="Seleccionar Exchange" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-slate-900 dark:border-blue-800/30">
                                  {exchangeOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
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

                      <Card className="border-blue-100 dark:border-blue-800/30 bg-blue-50/50 dark:bg-blue-950/10">
                        <CardContent className="pt-6">
                          <div className="grid gap-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                                <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <Label className="text-sm font-medium">
                                  Tipo de Cuenta
                                </Label>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Especifica si es una cuenta demo o real
                                </p>
                              </div>
                            </div>
                            <div className="pl-12">
                              <div className="flex flex-col gap-4">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="isReal"
                                    name="accountType"
                                    checked={!newAccount.isDemo}
                                    onChange={() => {
                                      console.log("Cambiando a cuenta REAL");
                                      setNewAccount({ ...newAccount, isDemo: false });
                                    }}
                                    className="h-4 w-4 border-blue-300 text-blue-600 focus:ring-blue-500 dark:border-blue-700 dark:bg-slate-800 dark:checked:border-blue-500 dark:checked:bg-blue-500 dark:focus:ring-offset-slate-900"
                                  />
                                  <div className="grid gap-1.5 leading-none">
                                    <label
                                      htmlFor="isReal"
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                                    >
                                      <Database className="h-4 w-4 text-blue-600" />
                                      Cuenta Real
                                    </label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      Cuenta con fondos reales en el exchange
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="isDemo"
                                    name="accountType"
                                    checked={newAccount.isDemo}
                                    onChange={() => {
                                      console.log("Cambiando a cuenta DEMO");
                                      setNewAccount({ ...newAccount, isDemo: true });
                                    }}
                                    className="h-4 w-4 border-blue-300 text-blue-600 focus:ring-blue-500 dark:border-blue-700 dark:bg-slate-800 dark:checked:border-blue-500 dark:checked:bg-blue-500 dark:focus:ring-offset-slate-900"
                                  />
                                  <div className="grid gap-1.5 leading-none">
                                    <label
                                      htmlFor="isDemo"
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                                    >
                                      <Sparkles className="h-4 w-4 text-yellow-300" />
                                      Cuenta Demo
                                    </label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      Cuenta de prueba sin fondos reales
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-6">
                      <Card className="border-blue-100 dark:border-blue-800/30 bg-blue-50/50 dark:bg-blue-950/10">
                        <CardContent className="pt-6">
                          <div className="grid gap-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                                <KeyRound className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <Label htmlFor="apiKey" className="text-sm font-medium">
                                  Credenciales API
                                </Label>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
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
                                  className={formErrors.apiKey ? "border-red-300 focus-visible:ring-red-300" : "border-blue-200 dark:border-blue-800/30 focus-visible:ring-blue-300"}
                                />
                                {formErrors.apiKey && (
                                  <p className="text-xs text-red-500 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-200">{formErrors.apiKey}</p>
                                )}
                              </div>
                              <div>
                                <Label htmlFor="secretKey" className="text-xs mb-1.5 block">
                                  API Secret Key
                                  <span className="text-red-500 ml-1">*</span>
                                </Label>
                                <div className="relative">
                                  <Input
                                    id="secretKey"
                                    type={showSecretKey ? "text" : "password"}
                                    placeholder="Ingresa tu API Secret Key"
                                    value={newAccount.secretKey}
                                    onChange={(e) => {
                                      setNewAccount({ ...newAccount, secretKey: e.target.value })
                                      if (formErrors.secretKey) {
                                        const newErrors = { ...formErrors };
                                        delete newErrors.secretKey;
                                        setFormErrors(newErrors);
                                      }
                                    }}
                                    className={formErrors.secretKey ? "border-red-300 focus-visible:ring-red-300 pr-10" : "border-blue-200 dark:border-blue-800/30 focus-visible:ring-blue-300 pr-10"}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowSecretKey(!showSecretKey)}
                                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
                                  >
                                    {showSecretKey ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">
                                      {showSecretKey ? "Ocultar" : "Mostrar"} Secret Key
                                    </span>
                                  </Button>
                                </div>
                                {formErrors.secretKey && (
                                  <p className="text-xs text-red-500 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-200">{formErrors.secretKey}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <Dialog.Close asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-blue-200 dark:border-blue-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300"
                      >
                        Cancelar
                      </Button>
                    </Dialog.Close>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Agregando...
                        </>
                      ) : (
                        "Agregar Subcuenta"
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg p-4 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full flex-shrink-0">
                        <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-red-800 dark:text-red-300 mb-1">Eliminar Subcuenta</h3>
                        <p className="text-red-600 dark:text-red-400 mb-3">
                          Esta acción eliminará permanentemente la subcuenta seleccionada y todos sus datos asociados.
                        </p>
                        <p className="text-red-600 dark:text-red-400">
                          <strong>Nota:</strong> Esta acción solo elimina la subcuenta de nuestro sistema, no afecta a tu cuenta en el exchange.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Card className="border-blue-100 dark:border-blue-800/30 bg-blue-50/50 dark:bg-blue-950/10">
                    <CardContent className="pt-6">
                      <div className="grid gap-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                            <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <Label htmlFor="accountToDelete" className="text-sm font-medium">
                              Seleccionar Subcuenta
                            </Label>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Elige la subcuenta que deseas eliminar
                            </p>
                          </div>
                        </div>
                        <div className="pl-12">
                          <Select
                            value={selectedAccountId || ""}
                            onValueChange={setSelectedAccountId}
                          >
                            <SelectTrigger className="border-blue-200 dark:border-blue-800/30 focus-visible:ring-blue-300">
                              <SelectValue placeholder="Selecciona una subcuenta" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-slate-900 dark:border-blue-800/30">
                              {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                  <div className="flex items-center gap-2">
                                    <span>{account.name}</span>
                                    <Badge variant="outline" className="ml-2 uppercase bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800/30">
                                      {account.exchange}
                                    </Badge>
                                    {account.isDemo && (
                                      <Badge variant="outline" className="ml-1 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/30">
                                        Demo
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end gap-3">
                    <Dialog.Close asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-blue-200 dark:border-blue-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300"
                      >
                        Cancelar
                      </Button>
                    </Dialog.Close>
                    <Button 
                      type="button" 
                      onClick={handleDeleteAccount}
                      disabled={isSubmitting || !selectedAccountId}
                      className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Eliminando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar Subcuenta
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
} 