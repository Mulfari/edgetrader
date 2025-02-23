"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, RefreshCw, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useRouter } from "next/navigation"

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface SubAccount {
  id: string
  userId: string
  name: string
  exchange: string
  balance?: number
  lastUpdated?: string
}

export default function SubAccounts() {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
  const [accountBalances, setAccountBalances] = useState<Record<string, number | null>>({})
  const [loadingBalances, setLoadingBalances] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // ✅ Obtener subcuentas del usuario
  const fetchSubAccounts = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      console.error("❌ No hay token, redirigiendo a login.")
      router.push("/login")
      return
    }

    try {
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        if (res.status === 401) {
          console.error("❌ Token inválido, redirigiendo a login.")
          localStorage.removeItem("token")
          router.push("/login")
        }
        throw new Error(`Error al obtener subcuentas - Código ${res.status}`)
      }

      const data = await res.json()
      setSubAccounts(data)
    } catch (error) {
      console.error("❌ Error obteniendo subcuentas:", error)
      setError("No se pudieron cargar las subcuentas")
    } finally {
      setIsLoading(false)
    }
  }, [router])

  // ✅ Obtener balance de la cuenta seleccionada
  const fetchAccountDetails = async (userId: string) => {
    const token = localStorage.getItem("token")
    if (!API_URL || !userId || !token) return

    try {
      setLoadingBalances((prev) => ({ ...prev, [userId]: true }))
      setError(null)

      const res = await fetch(`${API_URL}/account-details/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error("Error al obtener detalles de la cuenta")

      const data = await res.json()
      setAccountBalances((prev) => ({
        ...prev,
        [userId]: typeof data.balance === "number" ? data.balance : 0,
      }))
    } catch (error) {
      console.error("❌ Error obteniendo detalles de la cuenta:", error)
      setError("No se pudo obtener la información de la cuenta.")
    } finally {
      setLoadingBalances((prev) => ({ ...prev, [userId]: false }))
    }
  }

  useEffect(() => {
    fetchSubAccounts()
  }, [fetchSubAccounts])

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar subcuentas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>
        <Button onClick={fetchSubAccounts} variant="outline" size="default" className="w-full md:w-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar Todo
        </Button>
      </div>

      {error && <p className="text-red-500 text-center p-4">{error}</p>}

      <div className="w-full bg-background rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Nombre</TableHead>
              <TableHead>Exchange</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Última Actualización</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  <RefreshCw className="animate-spin mx-auto h-6 w-6" />
                  <span className="mt-2 block">Cargando subcuentas...</span>
                </TableCell>
              </TableRow>
            ) : subAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  <AlertCircle className="mx-auto mb-2 h-6 w-6" />
                  No se encontraron subcuentas
                </TableCell>
              </TableRow>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {subAccounts.map((sub) => (
                  <AccordionItem value={sub.id} key={sub.id} className="border-0">
                    <TableRow className="hover:bg-muted/50">
                      <TableCell className="py-2">
                        <AccordionTrigger className="hover:no-underline py-0">{sub.name}</AccordionTrigger>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="secondary" className="font-normal">
                          {sub.exchange.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">{sub.balance ? `${sub.balance.toFixed(2)} USDT` : "-"}</TableCell>
                      <TableCell className="py-2">
                        {sub.lastUpdated ? new Date(sub.lastUpdated).toLocaleString() : "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={4} className="p-0 border-0">
                        <AccordionContent>
                          <div className="bg-muted/30 p-4">
                            <h4 className="text-base font-medium mb-4">Detalles de la Cuenta</h4>
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <span className="w-24">ID:</span>
                                <span className="text-muted-foreground font-mono text-sm">{sub.id}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="w-24">Usuario ID:</span>
                                <span className="text-muted-foreground font-mono text-sm">{sub.userId}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="w-24">Balance:</span>
                                <span>
                                  {loadingBalances[sub.userId] ? (
                                    <div className="flex items-center gap-2">
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                      <span>Cargando...</span>
                                    </div>
                                  ) : accountBalances[sub.userId] !== undefined ? (
                                    <span>{accountBalances[sub.userId]?.toFixed(2)} USDT</span>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => fetchAccountDetails(sub.userId)}
                                      className="h-7 px-3"
                                    >
                                      Cargar Balance
                                    </Button>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </TableCell>
                    </TableRow>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

