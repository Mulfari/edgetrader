"use client"

import { useState, useEffect } from "react"
import { Line } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js"
import { Loader2 } from "lucide-react"

// ✅ Registrar elementos de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function OrdersPage() {
  const [bitcoinData, setBitcoinData] = useState<number[]>([])
  const [labels, setLabels] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 🔥 Obtener datos de Bitcoin desde la API de CoinGecko
  useEffect(() => {
    const fetchBitcoinData = async () => {
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7")
        const data = await response.json()
        
        // 📌 Extraer precios y fechas
        const prices = data.prices.map((price: number[]) => price[1]) // Precio en USD
        const dates = data.prices.map((price: number[]) => new Date(price[0]).toLocaleDateString()) // Fecha

        setBitcoinData(prices)
        setLabels(dates)
      } catch (error) {
        console.error("Error fetching Bitcoin data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBitcoinData()
  }, [])

  // 📊 Configuración de datos para el gráfico
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Bitcoin Price (USD)",
        data: bitcoinData,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        tension: 0.3, // Suaviza la línea
      },
    ],
  }

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
      {/* 📈 Sección del gráfico a la izquierda */}
      <div className="w-2/3 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Bitcoin Price Chart</h1>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-300" />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <Line data={chartData} />
          </div>
        )}
      </div>

      {/* 🛒 Sección de órdenes vacía a la derecha */}
      <div className="w-1/3 p-6 bg-white dark:bg-gray-800 rounded-lg shadow ml-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Order Section</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Aquí se agregarán las órdenes más adelante.</p>
      </div>
    </div>
  )
}
