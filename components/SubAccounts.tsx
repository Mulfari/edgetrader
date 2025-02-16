"use client"

import { useState, useMemo } from "react"
import { Search, RefreshCw, Plus, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

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

  const filteredSubAccounts = useMemo(() => {
    return subAccounts.filter(
      (account) =>
        (account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.exchange.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (activeTab === "all" || account.exchange === activeTab),
    )
  }, [subAccounts, activeTab, searchTerm])

  const totalBalance = useMemo(() => {
    return filteredSubAccounts.reduce((sum, account) => sum + account.balance, 0)
  }, [filteredSubAccounts])

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-primary">Subcuentas</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="binance">Binance</TabsTrigger>
            <TabsTrigger value="bybit">Bybit</TabsTrigger>
            <TabsTrigger value="kraken">Kraken</TabsTrigger>
            <TabsTrigger value="ftx">FTX</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar Todo
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-secondary">
          <CardTitle className="flex items-center justify-between text-2xl">
            <span>Subcuentas</span>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {filteredSubAccounts.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6 p-6 bg-secondary rounded-lg shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xl font-medium">Balance Total</span>
              <span className="text-3xl font-bold text-primary">{totalBalance.toFixed(2)} USDT</span>
            </div>
          </div>
          <div className="mb-6 relative">
            <Input
              placeholder="Buscar por nombre o exchange..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full max-w-md"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            <Accordion type="single" collapsible className="w-full">
              {isLoading ? (
                <div className="text-center py-4">
                  <RefreshCw className="animate-spin mx-auto h-6 w-6" />
                  <span className="mt-2 block">Cargando subcuentas...</span>
                </div>
              ) : filteredSubAccounts.length === 0 ? (
                <div className="text-center py-4">
                  <AlertCircle className="mx-auto mb-2 h-6 w-6" />
                  No se encontraron subcuentas
                </div>
              ) : (
                filteredSubAccounts.map((sub) => (
                  <AccordionItem value={sub.id} key={sub.id} className="border-b">
                    <AccordionTrigger className="hover:bg-secondary/50 transition-colors">
                      <div className="grid grid-cols-5 w-full gap-4 items-center">
                        <span className="font-medium text-primary">{sub.name}</span>
                        <Badge variant="secondary" className="w-fit">
                          {sub.exchange.toUpperCase()}
                        </Badge>
                        <span className="font-semibold">{sub.balance.toFixed(2)} USDT</span>
                        <span className={`font-semibold ${sub.performance >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {sub.performance >= 0 ? "+" : ""}
                          {sub.performance.toFixed(2)}%
                        </span>
                        <span className="text-muted-foreground">{new Date(sub.lastUpdated).toLocaleString()}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="bg-secondary/30 rounded-lg mt-4 overflow-hidden">
                        <div className="grid md:grid-cols-2 gap-6 p-6">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-lg text-primary">Detalles de la Subcuenta</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <p className="font-medium">ID:</p>
                              <p>{sub.id}</p>
                              <p className="font-medium">Usuario ID:</p>
                              <p>{sub.userId}</p>
                              <p className="font-medium">Nombre:</p>
                              <p>{sub.name}</p>
                              <p className="font-medium">Exchange:</p>
                              <p>{sub.exchange.toUpperCase()}</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h4 className="font-semibold text-lg text-primary">Información Financiera</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <p className="font-medium">Balance:</p>
                              <p className="font-semibold">{sub.balance.toFixed(2)} USDT</p>
                              <p className="font-medium">Rendimiento:</p>
                              <p
                                className={`font-semibold ${sub.performance >= 0 ? "text-green-500" : "text-red-500"}`}
                              >
                                {sub.performance >= 0 ? "+" : ""}
                                {sub.performance.toFixed(2)}%
                              </p>
                              <p className="font-medium">Última Actualización:</p>
                              <p>{new Date(sub.lastUpdated).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-primary/5 p-4 flex justify-end space-x-2">
                          <Button variant="outline" className="w-32">
                            Editar
                          </Button>
                          <Button variant="destructive" className="w-32">
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))
              )}
            </Accordion>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

