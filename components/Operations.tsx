"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface Operation {
  id: string;
  type: 'buy' | 'sell';
  symbol: string;
  amount: number;
  price: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'cancelled';
  profit?: number;
}

export default function Operations() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, completed, pending, cancelled
  const [sortBy, setSortBy] = useState('date'); // date, amount, profit
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc

  useEffect(() => {
    // Aquí irá la lógica para cargar las operaciones
    // Por ahora usaremos datos de ejemplo
    const mockOperations: Operation[] = [
      {
        id: '1',
        type: 'buy',
        symbol: 'BTC/USDT',
        amount: 0.5,
        price: 45000,
        timestamp: '2024-03-20T10:30:00',
        status: 'completed',
        profit: 1200
      },
      // Añadir más operaciones de ejemplo...
    ];

    setTimeout(() => {
      setOperations(mockOperations);
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Operaciones
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Gestiona y monitorea tus operaciones de trading
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors">
            Nueva Operación
          </button>
        </div>
      </div>

      {/* Filters and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Operaciones</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {isLoading ? '-' : operations.length}
              </p>
            </div>
            <div className="p-2 bg-violet-500/10 rounded-lg">
              <LineChart className="w-6 h-6 text-violet-500" />
            </div>
          </div>
        </div>
        {/* Añadir más stats... */}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-zinc-800 rounded-xl shadow-sm">
        <select
          className="px-3 py-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white border-0"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Todas las operaciones</option>
          <option value="completed">Completadas</option>
          <option value="pending">Pendientes</option>
          <option value="cancelled">Canceladas</option>
        </select>
        
        <select
          className="px-3 py-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white border-0"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="date">Ordenar por fecha</option>
          <option value="amount">Ordenar por monto</option>
          <option value="profit">Ordenar por beneficio</option>
        </select>
      </div>

      {/* Operations Table */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Par
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Beneficio
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Cargando operaciones...
                  </td>
                </tr>
              ) : operations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No hay operaciones para mostrar
                  </td>
                </tr>
              ) : (
                operations.map((operation) => (
                  <tr key={operation.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                      {new Date(operation.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        operation.type === 'buy' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                        {operation.type === 'buy' ? 'Compra' : 'Venta'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                      {operation.symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                      ${operation.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                      {operation.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        operation.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : operation.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {operation.status === 'completed' ? 'Completada' : 
                         operation.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {operation.profit !== undefined && (
                        <span className={`flex items-center ${
                          operation.profit >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {operation.profit >= 0 ? '+' : '-'}${Math.abs(operation.profit).toLocaleString()}
                          {operation.profit >= 0 
                            ? <TrendingUp className="ml-1 h-4 w-4" />
                            : <TrendingDown className="ml-1 h-4 w-4" />
                          }
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}