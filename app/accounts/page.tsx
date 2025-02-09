"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

// Función para obtener el userId desde el token
function getUserIdFromToken(): string | null {
  const token = localStorage.getItem("token"); // Obtiene el token del usuario
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1])); // Decodifica el token JWT
    return payload.sub || null; // Retorna el userId (sub)
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

export default function AccountsPage() {
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    exchange: "",
    apiKey: "",
    apiSecret: "",
    name: "",
  });

  const handleAddAccount = async () => {
    const userId = getUserIdFromToken(); // Obtener el userId del token

    if (!userId) {
      alert("Error: No se pudo obtener el ID del usuario.");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const res = await fetch("https://edgetrader.vercel.app/subaccounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          exchange: newAccount.exchange,
          apiKey: newAccount.apiKey,
          apiSecret: newAccount.apiSecret,
          name: newAccount.name,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error en la API:", errorData);
        alert("Error al guardar la cuenta: " + (errorData.error || "Desconocido"));
        return;
      }

      const data = await res.json();
      alert("Cuenta guardada correctamente.");
      setShowAddAccount(false);
      setNewAccount({ exchange: "", apiKey: "", apiSecret: "", name: "" });

    } catch (error) {
      console.error("Error de red:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Accounts
          </h1>
          <button
            className="mt-4 flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            onClick={() => setShowAddAccount(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Account
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {showAddAccount && (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow space-y-6">
            <h2 className="text-lg font-bold">Add New Account</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select Exchange
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                value={newAccount.exchange}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, exchange: e.target.value })
                }
              >
                <option value="">Select one</option>
                <option value="bybit">Bybit</option>
                <option value="binance">Binance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                API Key
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                value={newAccount.apiKey}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, apiKey: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                API Secret
              </label>
              <input
                type="password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                value={newAccount.apiSecret}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, apiSecret: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Account Name
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                value={newAccount.name}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, name: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                onClick={() => setShowAddAccount(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                onClick={handleAddAccount}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
