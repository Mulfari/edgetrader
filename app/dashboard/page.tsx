"use client";

import { useEffect, useState } from "react";

interface SubAccount {
  id: string;
  name: string;
  exchange: string;
}

export default function DashboardPage() {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSubAccounts = async () => {
      try {
        const token = localStorage.getItem("token"); // 🔹 Obtener token del usuario
        if (!token) {
          setError("⚠️ No hay token de autenticación.");
          setLoading(false);
          return;
        }

        const response = await fetch("https://bedgetrader-production.up.railway.app/subaccounts", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
        }

        const data: SubAccount[] = await response.json();
        setSubAccounts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchSubAccounts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Subcuentas</h1>

      {loading && <p className="text-gray-600 dark:text-gray-300">Cargando...</p>}

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {subAccounts.length > 0 ? (
        <ul className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          {subAccounts.map((acc) => (
            <li key={acc.id} className="border-b p-2 last:border-none">
              <strong>{acc.name}</strong> - {acc.exchange}
            </li>
          ))}
        </ul>
      ) : (
        !loading && <p className="text-gray-600 dark:text-gray-300">No hay subcuentas disponibles.</p>
      )}
    </div>
  );
}
