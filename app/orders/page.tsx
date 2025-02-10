"use client"

import { useState } from "react"
import { AdvancedChart } from "react-tradingview-embed"
import { Expand, Shrink, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function OrdersPage() {
  const [symbol, setSymbol] = useState("BINANCE:BTCUSDT")
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 p-6">
      {/* 📌 Header con botón de regreso */}
      <div className="flex justify-between items-center mb-4">
        <Link href="/dashboard" className="flex items-center text-gray-900 dark:text-white hover:text-indigo-600">
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span className="font-semibold text-lg">Back to Dashboard</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trading Panel</h1>
      </div>

      {/* 📌 Barra superior con info */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {symbol.split(":")[1]} Market
        </h2>

        {/* 🔹 Selector de monedas */}
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

      {/* 📌 Layout general: Gráfico + Panel de órdenes */}
      <div className="flex space-x-6">
        {/* 📊 Contenedor del gráfico */}
        <div className={`transition-all flex-1 ${isExpanded ? "h-screen" : "h-[550px]"} bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4`}>
          <div className="h-full">
            <AdvancedChart widgetProps={{ theme: "dark", symbol, height: "100%" }} />
          </div>
        </div>

        {/* 📌 Panel de órdenes */}
        <div className="w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Place Order</h2>
          <div className="flex flex-col space-y-3">
            <label className="text-sm text-gray-600 dark:text-gray-300">Order Type</label>
            <select className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>Market Order</option>
              <option>Limit Order</option>
              <option>Stop Order</option>
            </select>

            <label className="text-sm text-gray-600 dark:text-gray-300">Amount</label>
            <input
              type="number"
              placeholder="0.00"
              className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />

            <label className="text-sm text-gray-600 dark:text-gray-300">Price (if applicable)</label>
            <input
              type="number"
              placeholder="Market Price"
              className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />

            <div className="flex justify-between">
              <button className="w-[48%] p-2 mt-4 bg-green-500 text-white rounded hover:bg-green-600 transition">
                Buy {symbol.split(":")[1]}
              </button>
              <button className="w-[48%] p-2 mt-4 bg-red-500 text-white rounded hover:bg-red-600 transition">
                Sell {symbol.split(":")[1]}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
