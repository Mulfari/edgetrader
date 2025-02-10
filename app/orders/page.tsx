"use client"

import { useState } from "react"
import { AdvancedChart } from "react-tradingview-embed"
import { Expand, Shrink, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const symbols = [
  { value: "BINANCE:BTCUSDT", label: "Bitcoin (BTC/USDT)" },
  { value: "BINANCE:ETHUSDT", label: "Ethereum (ETH/USDT)" },
  { value: "BINANCE:BNBUSDT", label: "Binance Coin (BNB/USDT)" },
  { value: "BINANCE:SOLUSDT", label: "Solana (SOL/USDT)" },
]

const orderTypes = [
  { value: "market", label: "Market Order" },
  { value: "limit", label: "Limit Order" },
  { value: "stop", label: "Stop Order" },
]

export default function TradingPanelPage() {
  const [symbol, setSymbol] = useState("BINANCE:BTCUSDT")
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-background p-6">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard" className="flex items-center text-foreground hover:text-primary">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="font-semibold text-lg">Back to Dashboard</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Trading Panel</h1>
      </div>

      <Card className="mb-4">
        <CardContent className="flex justify-between items-center p-4">
          <h2 className="text-lg font-semibold">{symbol.split(":")[1]} Market</h2>

          <Select value={symbol} onValueChange={setSymbol}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a symbol" />
            </SelectTrigger>
            <SelectContent>
              {symbols.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <Shrink className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
          </Button>
        </CardContent>
      </Card>

      <div className="flex space-x-6">
        <Card className={`transition-all flex-1 ${isExpanded ? "h-[calc(100vh-12rem)]" : "h-[550px]"}`}>
          <CardContent className="p-0 h-full">
            <AdvancedChart widgetProps={{ theme: "dark", symbol, height: "100%", width: "100%" }} />
          </CardContent>
        </Card>

        <Card className="w-96">
          <CardHeader>
            <CardTitle>Place Order</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderType">Order Type</Label>
              <Select>
                <SelectTrigger id="orderType">
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  {orderTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (if applicable)</Label>
              <Input id="price" type="number" placeholder="Market Price" />
            </div>

            <div className="flex justify-between pt-4">
              <Button className="w-[48%]" variant="default">
                Buy {symbol.split(":")[1]}
              </Button>
              <Button className="w-[48%]" variant="destructive">
                Sell {symbol.split(":")[1]}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}