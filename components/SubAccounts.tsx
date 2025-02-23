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
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0 md:space-x-4">
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

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Nombre</TableHead>
              <TableHead className="w-[20%]">Exchange</TableHead>
              <TableHead className="w-[25%]">Balance</TableHead>
              <TableHead className="w-[25%]">Última Actualización</TableHead>
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
              <Accordion type="single" collapsible>
                {subAccounts.map((sub) => (
                  <AccordionItem value={sub.id} key={sub.id} className="border-b-0">
                    <TableRow className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <AccordionTrigger className="hover:no-underline">{sub.name}</AccordionTrigger>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="px-3 py-1">
                          {sub.exchange.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sub.balance ? (
                          <span className="font-medium text-primary">{sub.balance.toFixed(2)} USDT</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{sub.lastUpdated ? new Date(sub.lastUpdated).toLocaleString() : "-"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={4} className="border-t-0 pt-0">
                        <AccordionContent>
                          <div className="p-6 bg-muted/50 rounded-lg mt-2 space-y-4">
                            <div className="grid gap-6">
                              <div className="space-y-4">
                                <h4 className="text-lg font-semibold">Detalles de la Cuenta</h4>
                                <div className="grid gap-4">
                                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/40">
                                    <span className="font-medium">ID:</span>
                                    <span className="text-muted-foreground">{sub.id}</span>
                                  </div>
                                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/40">
                                    <span className="font-medium">Usuario ID:</span>
                                    <span className="text-muted-foreground">{sub.userId}</span>
                                  </div>
                                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/40">
                                    <span className="font-medium">Balance Detallado:</span>
                                    <span>
                                      {loadingBalances[sub.userId] ? (
                                        <div className="flex items-center gap-2">
                                          <RefreshCw className="h-4 w-4 animate-spin" />
                                          <span>Cargando...</span>
                                        </div>
                                      ) : accountBalances[sub.userId] !== undefined ? (
                                        <span className="font-semibold text-primary">
                                          {accountBalances[sub.userId]?.toFixed(2)} USDT
                                        </span>
                                      ) : (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => fetchAccountDetails(sub.userId)}
                                          className="hover:bg-primary/10"
                                        >
                                          Cargar Balance
                                        </Button>
                                      )}
                                    </span>
                                  </div>
                                </div>
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

