"use client";

import { useState } from "react";
import crypto from "crypto";

export default function DashboardPage() {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateSignature = (params: string, timestamp: string) => {
    const recvWindow = "5000"; // Ventana de recepción
    const queryString = `${timestamp}${apiKey}${recvWindow}${params}`;
    return crypto.createHmac("sha256", apiSecret).update(queryString).digest("hex");
  };

  const fetchBalance = async () => {
    if (!apiKey || !apiSecret) {
      return;
    }

    setLoading(true);
    setError(null);

    const TIMESTAMP = Date.now().toString();
    const PARAMS = "accountType=UNIFIED";
    const SIGNATURE = generateSignature(PARAMS, TIMESTAMP);

    const url = `https://api-testnet.bybit.com/v5/account/wallet-balance?${PARAMS}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-BAPI-API-KEY": apiKey,
          "X-BAPI-TIMESTAMP": TIMESTAMP,
          "X-BAPI-RECV-WINDOW": "5000",
          "X-BAPI-SIGN": SIGNATURE,
        },
      });

      const data = await response.json();
      console.log("📌 Respuesta de Bybit:", data);

      if (data.retCode === 0) {
        setBalance(data.result.list[0]?.totalWalletBalance || "0.00");
      } else {
      }
    } catch (err) {
      console.error("❌ Error al obtener balance:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Consultar Balance en Bybit</h1>

      <div className="mt-4">
        <label className="block text-sm font-medium">API Key:</label>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full px-4 py-2 border rounded mt-1"
          placeholder="Ingresa tu API Key"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium">API Secret:</label>
        <input
          type="password"
          value={apiSecret}
          onChange={(e) => setApiSecret(e.target.value)}
          className="w-full px-4 py-2 border rounded mt-1"
          placeholder="Ingresa tu API Secret"
        />
      </div>

      <button
        onClick={fetchBalance}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        disabled={loading}
      >
        {loading ? "Consultando..." : "Obtener Balance"}
      </button>

      {balance !== null && <p className="mt-4">Balance: ${balance}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}
