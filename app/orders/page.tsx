"use client";

import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Loader2, RefreshCw } from "lucide-react";

// 📌 Registrar módulos de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function OrdersPage() {
  const [bitcoinData, setBitcoinData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 📌 Obtener datos del precio de Bitcoin
  const fetchBitcoinData = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7");
      const data = await response.json();

      const prices = data.prices.map((item: number[]) => item[1]); // Obtener solo los precios
      const timestamps = data.prices.map((item: number[]) => new Date(item[0]).toLocaleDateString());

      setBitcoinData(prices);
      setLabels(timestamps);
    } catch (error) {
      console.error("Error fetching Bitcoin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBitcoinData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Bitcoin Price (Last 7 Days)</h1>
          <button onClick={fetchBitcoinData} className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : (
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: "Bitcoin Price (USD)",
                  data: bitcoinData,
                  borderColor: "rgb(255, 99, 132)",
                  backgroundColor: "rgba(255, 99, 132, 0.2)",
                  tension: 0.4,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: true, position: "top" },
                title: { display: true, text: "Bitcoin Price Chart" },
              },
            }}
          />
        )}
      </div>
    </div>
  );
}
