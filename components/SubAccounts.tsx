"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw, AlertCircle, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface SubAccount {
  id: string;
  userId: string;
  name: string;
  exchange: string;
  balance?: number;
  lastUpdated?: string;
}

export default function SubAccounts() {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [selectedSubAccountId, setSelectedSubAccountId] = useState<string | null>(null);
  const [accountBalance, setAccountBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ✅ Obtener subcuentas del usuario
  const fetchSubAccounts = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No hay token, redirigiendo a login.");
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 🔹 Envía el token en el header
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          console.error("❌ Token inválido, redirigiendo a login.");
          localStorage.removeItem("token"); // 🔹 Eliminar token inválido
          router.push("/login");
        }
        throw new Error(`Error al obtener subcuentas - Código ${res.status}`);
      }

      const data = await res.json();
      setSubAccounts(data);
    } catch (error) {
      console.error("❌ Error obteniendo subcuentas:", error);
      setError("No se pudieron cargar las subcuentas");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // ✅ Obtener balance de la cuenta seleccionada
  const fetchAccountDetails = async (userId: string) => {
    const token = localStorage.getItem("token");
    if (!API_URL || !userId || !token) return;

    try {
      setIsBalanceLoading(true);
      setError(null);
      setAccountBalance(null);

      const res = await fetch(`${API_URL}/account-details/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Error al obtener detalles de la cuenta");

      const data = await res.json();
      setAccountBalance(typeof data.balance === "number" ? data.balance : 0);
    } catch (error) {
      console.error("❌ Error obteniendo detalles de la cuenta:", error);
      setError("No se pudo obtener la información de la cuenta.");
    } finally {
      setIsBalanceLoading(false);
    }
  };

  useEffect(() => {
    fetchSubAccounts();
  }, [fetchSubAccounts]);

  const handleRowClick = (sub: SubAccount) => {
    if (selectedSubAccountId === sub.id) {
      setSelectedSubAccountId(null);
    } else {
      setSelectedSubAccountId(sub.id);
      fetchAccountDetails(sub.userId);
    }
  };

  const filteredAccounts = subAccounts.filter(
    (account) =>
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.exchange.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar subcuentas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>
        <Button onClick={fetchSubAccounts} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar Todo
        </Button>
      </div>

      {error && <p className="text-red-500 text-center p-4">{error}</p>}

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Exchange</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Última Actualización</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <RefreshCw className="animate-spin mx-auto h-6 w-6" />
                  <span className="mt-2 block">Cargando subcuentas...</span>
                </TableCell>
              </TableRow>
            ) : filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <AlertCircle className="mx-auto mb-2 h-6 w-6" />
                  No se encontraron subcuentas
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((sub) => (
                <>
                  <TableRow key={sub.id} onClick={() => handleRowClick(sub)} className="cursor-pointer">
                    <TableCell className="font-medium">{sub.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{sub.exchange.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>{sub.balance ? `${sub.balance.toFixed(2)} USDT` : "-"}</TableCell>
                    <TableCell>{sub.lastUpdated ? new Date(sub.lastUpdated).toLocaleString() : "-"}</TableCell>
                    <TableCell>
                      <ChevronDown className={`h-4 w-4 transition-transform ${selectedSubAccountId === sub.id ? 'rotate-180' : ''}`} />
                    </TableCell>
                  </TableRow>
                  {selectedSubAccountId === sub.id && (
                    <TableRow key={`${sub.id}-details`}>
                      <TableCell colSpan={5}>
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <p><strong>Nombre:</strong> {sub.name}</p>
                          <p><strong>Exchange:</strong> {sub.exchange}</p>
                          {isBalanceLoading ? (
                            <p>Cargando balance...</p>
                          ) : (
                            <p><strong>Balance:</strong> {accountBalance !== null ? `${accountBalance.toFixed(2)} USDT` : "No disponible"}</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}