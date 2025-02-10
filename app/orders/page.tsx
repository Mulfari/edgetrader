"use client"

import { useState } from "react"
import { AdvancedChart } from "react-tradingview-embed"
import { Expand, Shrink } from "lucide-react"

export default function OrdersPage() {
  const [symbol, setSymbol] = useState("BINANCE:BTCUSDT") // 🔹 Moneda inicial
  const [isExpanded, setIsExpanded] = useState(false) // 🔹 Expande el gráfico

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Trading Chart</h1>

      {/* 📌 Selector de monedas */}
      <div className="flex space-x-4 mb-4">
        <select
          className="p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        >
          <option value="BINANCE:BTCUSDT">Bitcoin (BTC/USDT)</option>
          <option value="BINANCE:ETHUSDT">Ethereum (ETH/USDT)</option>
          <option value="BINANCE:BNBUSDT">Binance Coin (BNB/USDT)</option>
          <option value="BINANCE:SOLUSDT">Solana (SOL/USDT)</option>
        </select>

        {/* 🔄 Botón de expandir */}
        <button
          className="p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex items-center"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <Shrink className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
        </button>
      </div>

      {/* 📊 Gráfico TradingView */}
      <div className={`transition-all ${isExpanded ? "w-full h-screen" : "w-full h-96"}`}>
        <AdvancedChart widgetProps={{ theme: "dark", symbol, height: "100%" }} />
      </div>
    </div>
  )
}
