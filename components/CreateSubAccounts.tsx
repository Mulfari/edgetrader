"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Definir una interfaz para el error
interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  )
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError
  
  try {
    return new Error(JSON.stringify(maybeError))
  } catch {
    // Si la serialización falla, devolvemos un error genérico
    return new Error(String(maybeError))
  }
}

export default function CreateSubAccount() {
  const [name, setName] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [apiSecret, setApiSecret] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`${API_URL}/subaccounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          exchange: "bybit",
          apiKey,
          apiSecret,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || "Error al crear la subcuenta")
      }

      router.push("/dashboard") // Redirección al dashboard después de crear la subcuenta
      router.refresh() // Actualizar la página para mostrar la nueva subcuenta
    } catch (err: unknown) {
      const errorWithMessage = toErrorWithMessage(err)
      setError(errorWithMessage.message || "Ocurrió un error al crear la subcuenta")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Crear Nueva Subcuenta</CardTitle>
        <CardDescription>Agrega una nueva subcuenta de Bybit para monitorear</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Subcuenta</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Mi Subcuenta"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key de Bybit</Label>
            <Input
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
              placeholder="Ingresa tu API Key"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiSecret">API Secret de Bybit</Label>
            <Input
              id="apiSecret"
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              required
              placeholder="Ingresa tu API Secret"
            />
          </div>
          
          {error && (
            <div className="flex items-center gap-2 p-3 mt-4 text-sm border border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}
          
          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Creando..." : "Crear Subcuenta"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button variant="link" onClick={() => window.open("https://www.bybit.com/app/user/api-management", "_blank")}>
          ¿Cómo obtener API Keys?
        </Button>
      </CardFooter>
    </Card>
  )
}