"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronUp, ChevronDown } from "lucide-react"
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Operaciones</h2>
        <Button>Nueva Operación</Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs
          value={tradeMarketFilter}
          onValueChange={(value) => setTradeMarketFilter(value as "all" | "spot" | "futures")}
        >
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="spot">Spot</TabsTrigger>
            <TabsTrigger value="futures">Futuros</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "open" | "closed")}>
          <TabsList>
            <TabsTrigger value="open">Abiertas</TabsTrigger>
            <TabsTrigger value="closed">Cerradas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{activeTab === "open" ? "Operaciones Abiertas" : "Operaciones Cerradas"}</span>
            <Badge variant="outline">{filteredTrades.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTab === "closed" && (
            <div className="mb-6 p-4 bg-secondary rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">PnL Total</span>
                <span className={`text-2xl font-bold ${totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {totalPnL.toFixed(2)} USDT
                </span>
              </div>
            </div>
          )}
          <div className="mb-4">
            <Input
              placeholder="Buscar por par o mercado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="overflow-x-auto">
            <Accordion type="single" collapsible className="w-full">
              {filteredTrades.map((trade) => (
                <AccordionItem value={trade.id} key={trade.id}>
                  <AccordionTrigger>
                    <div className="grid grid-cols-6 w-full">
                      <span className="font-medium">{trade.pair}</span>
                      <Badge
                        variant={trade.type === "buy" ? "default" : "destructive"}
                        className="flex items-center gap-1 w-fit"
                      >
                        {trade.type === "buy" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {trade.type.toUpperCase()}
                      </Badge>
                      <span>{trade.entryPrice.toFixed(2)}</span>
                      <span>{trade.amount}</span>
                      <Badge variant={trade.market === "spot" ? "secondary" : "outline"} className="w-fit">
                        {trade.market.toUpperCase()}
                      </Badge>
                      {activeTab === "open" ? (
                        <span>{new Date(trade.openDate).toLocaleString()}</span>
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
                    <div className="grid grid-cols-2 gap-4 p-4 bg-secondary rounded-lg">
                      <div>
                        <p className="font-semibold">Detalles de la Operación</p>
                        <p>ID: {trade.id}</p>
                        <p>Usuario ID: {trade.userId}</p>
                        <p>Estado: {trade.status === "open" ? "Abierta" : "Cerrada"}</p>
                        <p>Fecha de Apertura: {new Date(trade.openDate).toLocaleString()}</p>
                        {trade.closeDate && <p>Fecha de Cierre: {new Date(trade.closeDate).toLocaleString()}</p>}
                      </div>
                      <div>
                        <p className="font-semibold">Información Financiera</p>
                        <p>Precio de Entrada: {trade.entryPrice.toFixed(2)}</p>
                        {trade.exitPrice && <p>Precio de Salida: {trade.exitPrice.toFixed(2)}</p>}
                        <p>Cantidad: {trade.amount}</p>
                        {trade.pnl !== undefined && <p>PnL: {trade.pnl.toFixed(2)} USDT</p>}
                        {trade.market === "futures" && (
                          <>
                            {trade.leverage && <p>Apalancamiento: {trade.leverage}x</p>}
                            {trade.stopLoss && <p>Stop Loss: {trade.stopLoss}</p>}
                            {trade.takeProfit && <p>Take Profit: {trade.takeProfit}</p>}
                          </>
                        )}
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

