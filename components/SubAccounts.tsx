"use client"

import { useState } from "react"
import { Search, RefreshCw, Plus, AlertCircle, ChevronRight, X } from "lucide-react"
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface SubAccount {
  id: string
  userId: string
  name: string
  exchange: string
  balance: number
  lastUpdated: string
  performance: number
}

interface SubAccountsProps {
  subAccounts: SubAccount[]
  isLoading: boolean
  fetchData: () => void
}

export default function SubAccounts({ subAccounts, isLoading, fetchData }: SubAccountsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedAccount, setSelectedAccount] = useState<SubAccount | null>(null)

  const filteredSubAccounts = subAccounts.filter(
    (account) =>
      (account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.exchange.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (activeTab === "all" || account.exchange === activeTab),
  )

  const handleRowClick = (account: SubAccount) => {
    setSelectedAccount(account)
  }

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
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
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <RefreshCw className="animate-spin mx-auto h-6 w-6" />
                  <span className="mt-2 block">Cargando subcuentas...</span>
                </TableCell>
              </TableRow>
            ) : filteredSubAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <AlertCircle className="mx-auto mb-2 h-6 w-6" />
                  No se encontraron subcuentas
                </TableCell>
              </TableRow>
            ) : (
              filteredSubAccounts.map((sub) => (
                <TableRow
                  key={sub.id}
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleRowClick(sub)}
                >
                  <TableCell className="font-medium">{sub.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{sub.exchange.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{sub.balance.toFixed(2)} USDT</span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${sub.performance >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {sub.performance >= 0 ? "+" : ""}
                      {sub.performance.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell>{new Date(sub.lastUpdated).toLocaleString()}</TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedAccount} onOpenChange={() => setSelectedAccount(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detalles de la Subcuenta</SheetTitle>
            <SheetDescription>Información detallada de la subcuenta seleccionada</SheetDescription>
          </SheetHeader>
          {selectedAccount && (
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedAccount.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Exchange</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {selectedAccount.exchange.toUpperCase()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {selectedAccount.balance.toFixed(2)} USDT
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Rendimiento</h3>
                <p
                  className={`mt-1 text-sm font-semibold ${selectedAccount.performance >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {selectedAccount.performance >= 0 ? "+" : ""}
                  {selectedAccount.performance.toFixed(2)}%
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Última Actualización</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {new Date(selectedAccount.lastUpdated).toLocaleString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">ID de Usuario</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedAccount.userId}</p>
              </div>
            </div>
          )}
          <Button className="mt-6" onClick={() => setSelectedAccount(null)}>
            <X className="mr-2 h-4 w-4" />
            Cerrar
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  )
}

