"use client"

import { useState } from "react"
import { Search, RefreshCw, Plus, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SubAccount {
  id: string
  userId: string
  name: string
  exchange: string
  balance: number
  lastUpdated: string
  performance: number
  assets: { [key: string]: number }
  equity: number
  availableBalance: number
  marginBalance: number
  unrealizedPnL: number
}

interface SubAccountsProps {
  subAccounts: SubAccount[]
  isLoading: boolean
  fetchData: () => void
}

export default function SubAccounts({ subAccounts, isLoading, fetchData }: SubAccountsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  //const [selectedAccount, setSelectedAccount] = useState<SubAccount | null>(null) //Removed as it's not used

  const filteredSubAccounts = subAccounts.filter(
    (account) =>
      (account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.exchange.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (activeTab === "all" || account.exchange === activeTab),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:space-x-4">
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
        <div className="flex space-x-4">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar Todo
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" /> Agregar Subcuenta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nueva Subcuenta</DialogTitle>
                <DialogDescription>Ingrese los detalles de la nueva subcuenta aquí.</DialogDescription>
              </DialogHeader>
              {/* Add form fields for new subaccount here */}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="binance">Binance</TabsTrigger>
          <TabsTrigger value="bybit">Bybit</TabsTrigger>
          <TabsTrigger value="kraken">Kraken</TabsTrigger>
          <TabsTrigger value="ftx">FTX</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Exchange</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Rendimiento</TableHead>
              <TableHead>Última Actualización</TableHead>
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
            ) : filteredSubAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <AlertCircle className="mx-auto mb-2 h-6 w-6" />
                  No se encontraron subcuentas
                </TableCell>
              </TableRow>
            ) : (
              filteredSubAccounts.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{sub.exchange.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="link" className="p-0 h-auto font-semibold text-blue-600 hover:underline">
                          {sub.balance.toFixed(2)} USDT
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Detalles de la Cuenta: {sub.name}</DialogTitle>
                          <DialogDescription>Información detallada de la subcuenta</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{sub.balance.toFixed(2)} USDT</div>
                            </CardContent>
                          </Card>
                          <div className="grid grid-cols-2 gap-4">
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Equity</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-lg font-semibold">{sub.equity.toFixed(2)} USDT</div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Balance Disponible</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-lg font-semibold">{sub.availableBalance.toFixed(2)} USDT</div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Balance de Margen</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-lg font-semibold">{sub.marginBalance.toFixed(2)} USDT</div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">PnL No Realizado</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div
                                  className={`text-lg font-semibold ${sub.unrealizedPnL >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {sub.unrealizedPnL.toFixed(2)} USDT
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm font-medium">Distribución de Activos</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2">
                                {Object.entries(sub.assets).map(([asset, amount]) => (
                                  <li key={asset} className="flex justify-between items-center">
                                    <span className="font-medium">{asset}</span>
                                    <span>{amount.toFixed(4)}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${sub.performance >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {sub.performance >= 0 ? "+" : ""}
                      {sub.performance.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell>{new Date(sub.lastUpdated).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

