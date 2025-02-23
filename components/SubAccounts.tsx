"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface SubAccount {
  id: string;
  userId: string;
  name: string;
  exchange: string;
  balance?: number;
  lastUpdated?: string;
  performance?: number;
}

export default function SubAccounts() {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ✅ Obtener subcuentas del usuario
  const fetchSubAccounts = useCallback(async () => {
    if (!API_URL) {
      console.error("❌ Error: NEXT_PUBLIC_API_URL no está definido.");
      setError("Error de configuración del servidor");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Error al obtener subcuentas");

      const data = await res.json();
      console.log("📡 Datos obtenidos del backend:", data);

      if (!Array.isArray(data)) {
        throw new Error("Respuesta inesperada del servidor");
      }

      setSubAccounts(data);
    } catch (error) {
      console.error("❌ Error obteniendo subcuentas:", error);
      setError("No se pudieron cargar las subcuentas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubAccounts();
  }, [fetchSubAccounts]);

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
            ) : subAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <AlertCircle className="mx-auto mb-2 h-6 w-6" />
                  No se encontraron subcuentas
                </TableCell>
              </TableRow>
            ) : (
              subAccounts.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{sub.exchange.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>{sub.balance ? `${sub.balance.toFixed(2)} USDT` : "-"}</TableCell>
                  <TableCell>{sub.lastUpdated ? new Date(sub.lastUpdated).toLocaleString() : "-"}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => console.log("Ver detalles", sub.id)}>
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
