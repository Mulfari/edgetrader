"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [balances, setBalances] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const token = localStorage.getItem("token"); // 🔹 Usa el token del usuario
        if (!token) {
          setError("⚠️ No hay token de autenticación.");
          return;
        }

        const response = await fetch("https://bedgetrader-production.up.railway.app/subaccounts/balances", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setBalances(data);
      } catch (err: any) {
        setError(err.message || "Error desconocido");
      }
    };

    fetchBalances();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Prueba de Balances</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {balances.length > 0 ? (
        <ul className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          {balances.map((acc) => (
            <li key={acc.id} className="border-b p-2 last:border-none">
              <strong>{acc.name}:</strong> {acc.balance}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600 dark:text-gray-300">No hay balances disponibles.</p>
      )}
    </div>
  );
}
