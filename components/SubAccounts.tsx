"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, RefreshCw, AlertCircle, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

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

  const filteredAccounts = subAccounts.filter(
    (account) =>
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.exchange.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar subcuentas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>
        <Button onClick={fetchSubAccounts} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar Todo
        </Button>
      </div>

      {error && (
        <div className="flex items-center justify-center gap-2 text-red-500 text-center p-4 mb-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-background shadow-sm rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Exchange</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Última Actualización</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <RefreshCw className="animate-spin mx-auto h-6 w-6" />
                  <span className="mt-2 block">Cargando subcuentas...</span>
                </TableCell>
              </TableRow>
            ) : filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <AlertCircle className="mx-auto mb-2 h-6 w-6" />
                  No se encontraron subcuentas
                </TableCell>
              </TableRow>
            ) : (
              <Accordion type="single" collapsible>
                {filteredAccounts.map((sub) => (
                  <AccordionItem value={sub.id} key={sub.id} className="border-b-0">
                    <TableRow>
                      <TableCell className="font-medium">{sub.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{sub.exchange.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{sub.balance ? `${sub.balance.toFixed(2)} USDT` : "-"}</TableCell>
                      <TableCell>{sub.lastUpdated ? new Date(sub.lastUpdated).toLocaleString() : "-"}</TableCell>
                      <TableCell>
                        <AccordionTrigger className="py-0">
                          <span className="sr-only">Toggle details</span>
                          <ChevronDown className="h-4 w-4" />
                        </AccordionTrigger>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={5} className="p-0 border-b">
                        <AccordionContent>
                          <div className="p-4 bg-muted/50">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                                  <p className="text-sm">{sub.name}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Exchange</p>
                                  <p className="text-sm">{sub.exchange}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Balance Detallado</p>
                                  {loadingBalances[sub.userId] ? (
                                    <p className="text-sm">Cargando balance...</p>
                                  ) : (
                                    <p className="text-sm">
                                      {accountBalances[sub.userId] !== undefined
                                        ? `${accountBalances[sub.userId]?.toFixed(2)} USDT`
                                        : "Click para cargar"}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fetchAccountDetails(sub.userId)}
                                disabled={loadingBalances[sub.userId]}
                              >
                                {loadingBalances[sub.userId] ? (
                                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  "Actualizar Balance"
                                )}
                              </Button>
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

