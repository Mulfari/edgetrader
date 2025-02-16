"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronUp, ChevronDown } from "lucide-react"

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
}

interface OperationsProps {
  trades: Trade[]
}

export default function Operations({ trades }: OperationsProps) {
  const [tradeMarketFilter, setTradeMarketFilter] = useState<"all" | "spot" | "futures">("all")
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open")

  const filteredTrades = trades.filter((trade) => tradeMarketFilter === "all" || trade.market === tradeMarketFilter)

  const openTrades = filteredTrades.filter((trade) => trade.status === "open")
  const closedTrades = filteredTrades.filter((trade) => trade.status === "closed")

  const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold">Operaciones</h2>
        <div className="flex flex-col sm:flex-row gap-4">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{activeTab === "open" ? "Operaciones Abiertas" : "Operaciones Cerradas"}</span>
            <Badge variant="outline">{activeTab === "open" ? openTrades.length : closedTrades.length}</Badge>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Par</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Mercado</TableHead>
                  {activeTab === "open" ? (
                    <TableHead>Fecha de Apertura</TableHead>
                  ) : (
                    <>
                      <TableHead>PnL</TableHead>
                      <TableHead>Fecha de Cierre</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(activeTab === "open" ? openTrades : closedTrades).map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">{trade.pair}</TableCell>
                    <TableCell>
                      <Badge
                        variant={trade.type === "buy" ? "default" : "destructive"}
                        className="flex items-center gap-1"
                      >
                        {trade.type === "buy" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {trade.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {activeTab === "open" ? (
                        trade.entryPrice.toFixed(2)
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-xs">E: {trade.entryPrice.toFixed(2)}</span>
                          <span className="text-xs">S: {trade.exitPrice?.toFixed(2)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{trade.amount}</TableCell>
                    <TableCell>
                      <Badge variant={trade.market === "spot" ? "secondary" : "outline"}>
                        {trade.market.toUpperCase()}
                      </Badge>
                    </TableCell>
                    {activeTab === "open" ? (
                      <TableCell>{new Date(trade.openDate).toLocaleString()}</TableCell>
                    ) : (
                      <>
                        <TableCell>
                          <span
                            className={`font-medium ${trade.pnl && trade.pnl >= 0 ? "text-green-500" : "text-red-500"}`}
                          >
                            {trade.pnl?.toFixed(2)} USDT
                          </span>
                        </TableCell>
                        <TableCell>{trade.closeDate && new Date(trade.closeDate).toLocaleString()}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

