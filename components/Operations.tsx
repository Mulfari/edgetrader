"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronUp, ChevronDown, Plus, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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
}

interface OperationsProps {
  trades: Trade[]
}

export default function Operations({ trades }: OperationsProps) {
  const [tradeMarketFilter, setTradeMarketFilter] = useState<"all" | "spot" | "futures">("all")
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open")
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null)

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

  const handleTradeClick = (tradeId: string) => {
    setExpandedTradeId(expandedTradeId === tradeId ? null : tradeId)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold">Operaciones</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nueva Operación
        </Button>
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
          <CardTitle className="flex items-center gap-2">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]"></TableHead>
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
                {filteredTrades.map((trade) => (
                  <Collapsible
                    key={trade.id}
                    open={expandedTradeId === trade.id}
                    onOpenChange={() => handleTradeClick(trade.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <TableRow className="cursor-pointer hover:bg-muted">
                        <TableCell>
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${expandedTradeId === trade.id ? "rotate-90" : ""}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{trade.pair}</TableCell>
                        <TableCell>
                          <Badge
                            variant={trade.type === "buy" ? "default" : "destructive"}
                            className="flex items-center gap-1"
                          >
                            {trade.type === "buy" ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
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
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={7}>
                          <div className="p-4 bg-muted rounded-lg mt-2">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Fecha de Apertura</p>
                                <p>{new Date(trade.openDate).toLocaleString()}</p>
                              </div>
                              {trade.market === "futures" && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Apalancamiento</p>
                                  <p>{trade.leverage}x</p>
                                </div>
                              )}
                              {trade.status === "closed" && (
                                <>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Precio de Salida</p>
                                    <p>{trade.exitPrice?.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">PnL</p>
                                    <p className={trade.pnl && trade.pnl >= 0 ? "text-green-500" : "text-red-500"}>
                                      {trade.pnl?.toFixed(2)} USDT
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Fecha de Cierre</p>
                                    <p>{trade.closeDate && new Date(trade.closeDate).toLocaleString()}</p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

