"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronUp, ChevronDown, Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface Trade {
  id: string
  userId: string
  pair: string
  type: "buy" | "sell"
  entryPrice: number
  exitPrice?: number
  amount: number
  status: "open" | "closed"
  openDate: string
  closeDate?: string
  pnl?: number
  market: "spot" | "futures"
  leverage?: number
  stopLoss?: number
  takeProfit?: number
}

interface OperationsProps {
  trades: Trade[]
}

export default function Operations({ trades }: OperationsProps) {
  const [tradeMarketFilter, setTradeMarketFilter] = useState<"all" | "spot" | "futures">("all")
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTrades = useMemo(() => {
    return trades
      .filter((trade) => tradeMarketFilter === "all" || trade.market === tradeMarketFilter)
      .filter((trade) => trade.status === activeTab)
      .filter(
        (trade) =>
          trade.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trade.market.toLowerCase().includes(searchTerm.toLowerCase()),
      )
  }, [trades, tradeMarketFilter, activeTab, searchTerm])

  const totalPnL = useMemo(() => {
    return filteredTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
  }, [filteredTrades])

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-primary">Operaciones</h2>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Nueva Operación
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs
          value={tradeMarketFilter}
          onValueChange={(value) => setTradeMarketFilter(value as "all" | "spot" | "futures")}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="spot">Spot</TabsTrigger>
            <TabsTrigger value="futures">Futuros</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "open" | "closed")}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="open">Abiertas</TabsTrigger>
            <TabsTrigger value="closed">Cerradas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-secondary">
          <CardTitle className="flex items-center justify-between text-2xl">
            <span>{activeTab === "open" ? "Operaciones Abiertas" : "Operaciones Cerradas"}</span>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {filteredTrades.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {activeTab === "closed" && (
            <div className="mb-6 p-6 bg-secondary rounded-lg shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xl font-medium">PnL Total</span>
                <span className={`text-3xl font-bold ${totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {totalPnL.toFixed(2)} USDT
                </span>
              </div>
            </div>
          )}
          <div className="mb-6 relative">
            <Input
              placeholder="Buscar por par o mercado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full max-w-md"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            <Accordion type="single" collapsible className="w-full">
              {filteredTrades.map((trade) => (
                <AccordionItem value={trade.id} key={trade.id} className="border-b">
                  <AccordionTrigger className="hover:bg-secondary/50 transition-colors">
                    <div className="grid grid-cols-6 w-full gap-4 items-center">
                      <span className="font-medium text-primary">{trade.pair}</span>
                      <Badge
                        variant={trade.type === "buy" ? "default" : "destructive"}
                        className="flex items-center gap-1 w-fit"
                      >
                        {trade.type === "buy" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {trade.type.toUpperCase()}
                      </Badge>
                      <span className="text-muted-foreground">{trade.entryPrice.toFixed(2)}</span>
                      <span className="text-muted-foreground">{trade.amount}</span>
                      <Badge variant={trade.market === "spot" ? "secondary" : "outline"} className="w-fit">
                        {trade.market.toUpperCase()}
                      </Badge>
                      {activeTab === "open" ? (
                        <span className="text-muted-foreground">{new Date(trade.openDate).toLocaleString()}</span>
                      ) : (
                        <span
                          className={`font-medium ${trade.pnl && trade.pnl >= 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          {trade.pnl?.toFixed(2)} USDT
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-6 p-6 bg-secondary rounded-lg mt-4">
                      <div>
                        <h4 className="font-semibold text-lg mb-4">Detalles de la Operación</h4>
                        <div className="space-y-2">
                          <p>
                            <span className="font-medium">ID:</span> {trade.id}
                          </p>
                          <p>
                            <span className="font-medium">Usuario ID:</span> {trade.userId}
                          </p>
                          <p>
                            <span className="font-medium">Estado:</span>{" "}
                            {trade.status === "open" ? "Abierta" : "Cerrada"}
                          </p>
                          <p>
                            <span className="font-medium">Fecha de Apertura:</span>{" "}
                            {new Date(trade.openDate).toLocaleString()}
                          </p>
                          {trade.closeDate && (
                            <p>
                              <span className="font-medium">Fecha de Cierre:</span>{" "}
                              {new Date(trade.closeDate).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-4">Información Financiera</h4>
                        <div className="space-y-2">
                          <p>
                            <span className="font-medium">Precio de Entrada:</span> {trade.entryPrice.toFixed(2)}
                          </p>
                          {trade.exitPrice && (
                            <p>
                              <span className="font-medium">Precio de Salida:</span> {trade.exitPrice.toFixed(2)}
                            </p>
                          )}
                          <p>
                            <span className="font-medium">Cantidad:</span> {trade.amount}
                          </p>
                          {trade.pnl !== undefined && (
                            <p>
                              <span className="font-medium">PnL:</span>
                              <span className={trade.pnl >= 0 ? "text-green-500" : "text-red-500"}>
                                {" "}
                                {trade.pnl.toFixed(2)} USDT
                              </span>
                            </p>
                          )}
                          {trade.market === "futures" && (
                            <>
                              {trade.leverage && (
                                <p>
                                  <span className="font-medium">Apalancamiento:</span> {trade.leverage}x
                                </p>
                              )}
                              {trade.stopLoss && (
                                <p>
                                  <span className="font-medium">Stop Loss:</span> {trade.stopLoss}
                                </p>
                              )}
                              {trade.takeProfit && (
                                <p>
                                  <span className="font-medium">Take Profit:</span> {trade.takeProfit}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

