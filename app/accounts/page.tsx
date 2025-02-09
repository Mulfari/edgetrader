"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";

// Función para obtener el token JWT desde localStorage
function getToken(): string | null {
  return localStorage.getItem("token") || null;
}

// Función para obtener el userId desde el token JWT
function getUserIdFromToken(): string | null {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1])); // Decodificar el token JWT
    return payload.sub || null; // Retornar el userId (sub)
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

export default function AccountsPage() {
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]); // 🔹 Estado para almacenar cuentas
  const [newAccount, setNewAccount] = useState({
    exchange: "",
    apiKey: "",
    apiSecret: "",
    name: "",
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token) {
      setIsAuthenticated(true);
      fetchAccounts(); // 🔹 Cargar cuentas al montar el componente
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // 🔹 Función para obtener cuentas desde el backend
  const fetchAccounts = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Error al obtener cuentas:", res.statusText);
        return;
      }

      const data = await res.json();
      console.log("Cuentas obtenidas:", data);
      setAccounts(data);
    } catch (error) {
      console.error("Error de red al obtener cuentas:", error);
    }
  };

  const handleAddAccount = async () => {
    const token = getToken();
    if (!token) {
      alert("Error: No estás autenticado. Inicia sesión nuevamente.");
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          exchange: newAccount.exchange,
          apiKey: newAccount.apiKey,
          apiSecret: newAccount.apiSecret,
          name: newAccount.name,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error en la API:", errorData);
        alert("Error al guardar la cuenta: " + (errorData.message || "Desconocido"));
        return;
      }

      await res.json();
      alert("✅ Cuenta guardada correctamente.");
      setShowAddAccount(false);
      setNewAccount({ exchange: "", apiKey: "", apiSecret: "", name: "" });
      fetchAccounts(); // 🔹 Recargar cuentas después de agregar
    } catch (error) {
      console.error("Error de red:", error);
      alert("❌ No se pudo conectar con el servidor.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Accounts
          </h1>
          {isAuthenticated ? (
            <button
              className="mt-4 flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              onClick={() => setShowAddAccount(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Account
            </button>
          ) : (
            <p className="mt-4 text-red-500">Debes iniciar sesión para agregar cuentas.</p>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* 🔹 Mostrar cuentas */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Tus Cuentas</h2>
          {accounts.length > 0 ? (
            <ul>
              {accounts.map((account, index) =>
                account ? ( // ✅ Verifica que account no sea undefined
                  <li key={index} className="py-3 flex justify-between border-b border-gray-300 dark:border-gray-700">
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {account.name ? account.name : "Sin nombre"} ({account.exchange ? account.exchange : "Sin exchange"})
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {account.apiKey ? account.apiKey.slice(0, 4) : "****"}****
                    </span>
                  </li>
                ) : null
              )}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No tienes cuentas creadas.</p>
          )}
        </div>

        {/* Formulario para agregar cuenta */}
        {showAddAccount && isAuthenticated && (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow space-y-6 mt-6">
            <h2 className="text-lg font-bold">Add New Account</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Exchange</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                value={newAccount.exchange}
                onChange={(e) => setNewAccount({ ...newAccount, exchange: e.target.value })}
              >
                <option value="">Select one</option>
                <option value="bybit">Bybit</option>
                <option value="binance">Binance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">API Key</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                value={newAccount.apiKey}
                onChange={(e) => setNewAccount({ ...newAccount, apiKey: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">API Secret</label>
              <input
                type="password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                value={newAccount.apiSecret}
                onChange={(e) => setNewAccount({ ...newAccount, apiSecret: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600" onClick={() => setShowAddAccount(false)}>
                Cancel
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700" onClick={handleAddAccount}>
                Save
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
