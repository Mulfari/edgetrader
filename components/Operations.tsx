"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown, TrendingDown, TrendingUp } from "lucide-react"

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

  const filteredTrades = trades.filter((trade) => tradeMarketFilter === "all" || trade.market === tradeMarketFilter)

  const openTrades = filteredTrades.filter((trade) => trade.status === "open")
  const closedTrades = filteredTrades.filter((trade) => trade.status === "closed")

  const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Operaciones</h2>
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
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Operaciones Abiertas</span>
              <Badge variant="outline">{openTrades.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Par</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Precio de Entrada</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Mercado</TableHead>
                  <TableHead>Fecha de Apertura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">{trade.pair}</TableCell>
                    <TableCell>
                      <Badge variant={trade.type === "buy" ? "default" : "destructive"}>
                        {trade.type === "buy" ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        {trade.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{trade.entryPrice.toFixed(2)}</TableCell>
                    <TableCell>{trade.amount}</TableCell>
                    <TableCell>
                      <Badge variant={trade.market === "spot" ? "secondary" : "outline"}>
                        {trade.market.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(trade.openDate).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Operaciones Cerradas</span>
              <Badge variant="outline">{closedTrades.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm font-medium text-muted-foreground">PnL Total</p>
              <p className={`text-2xl font-bold ${totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                {totalPnL.toFixed(2)} USDT
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Par</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Precio <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Mercado</TableHead>
                  <TableHead>PnL</TableHead>
                  <TableHead>Fecha de Cierre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closedTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">{trade.pair}</TableCell>
                    <TableCell>
                      <Badge variant={trade.type === "buy" ? "default" : "destructive"}>
                        {trade.type === "buy" ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        {trade.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Entrada: {trade.entryPrice.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">Salida: {trade.exitPrice?.toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{trade.amount}</TableCell>
                    <TableCell>
                      <Badge variant={trade.market === "spot" ? "secondary" : "outline"}>
                        {trade.market.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-medium ${trade.pnl && trade.pnl >= 0 ? "text-green-500" : "text-red-500"}`}
                      >
                        {trade.pnl?.toFixed(2)} USDT
                      </span>
                    </TableCell>
                    <TableCell>{trade.closeDate && new Date(trade.closeDate).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

