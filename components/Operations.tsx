"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
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
  tags?: string[];
  notes?: string;
}

interface DashboardStats {
  totalOperations: number;
  totalProfit: number;
  successRate: number;
  bestOperation: Operation | null;
  worstOperation: Operation | null;
  monthlyVolume: number;
}

export default function Operations() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d, 1y, all
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    // Datos de ejemplo mejorados
    const mockOperations: Operation[] = [
      {
        id: '1',
        type: 'buy',
        symbol: 'BTC/USDT',
        amount: 0.5,
        price: 45000,
        timestamp: '2024-03-20T10:30:00',
        status: 'completed',
        profit: 1200,
        tags: ['swing', 'trend'],
        notes: 'Entrada en soporte fuerte'
      },
      {
        id: '2',
        type: 'sell',
        symbol: 'ETH/USDT',
        amount: 2.5,
        price: 3200,
        timestamp: '2024-03-19T15:45:00',
        status: 'completed',
        profit: -300,
        tags: ['scalping'],
        notes: 'Salida por stop loss'
      },
      {
        id: '3',
        type: 'buy',
        symbol: 'SOL/USDT',
        amount: 10,
        price: 125,
        timestamp: '2024-03-18T09:15:00',
        status: 'pending',
        tags: ['position'],
        notes: 'Esperando confirmación'
      },
      {
        id: '4',
        type: 'sell',
        symbol: 'BNB/USDT',
        amount: 5,
        price: 420,
        timestamp: '2024-03-17T14:20:00',
        status: 'completed',
        profit: 850,
        tags: ['day-trade'],
        notes: 'Toma de beneficios'
      },
      {
        id: '5',
        type: 'buy',
        symbol: 'ADA/USDT',
        amount: 1000,
        price: 0.65,
        timestamp: '2024-03-16T11:30:00',
        status: 'cancelled',
        tags: ['spot'],
        notes: 'Orden cancelada por volatilidad'
      }
    ];

    const mockStats: DashboardStats = {
      totalOperations: mockOperations.length,
      totalProfit: mockOperations.reduce((acc, op) => acc + (op.profit || 0), 0),
      successRate: 65,
      bestOperation: mockOperations.reduce<Operation | null>((best, op) => {
        if (!best) return op;
        return (op.profit || 0) > (best.profit || 0) ? op : best;
      }, null),
      worstOperation: mockOperations.reduce<Operation | null>((worst, op) => {
        if (!worst) return op;
        return (op.profit || 0) < (worst.profit || 0) ? op : worst;
      }, null),
      monthlyVolume: 125000
    };

    setTimeout(() => {
      setOperations(mockOperations);
      setStats(mockStats);
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header mejorado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Dashboard de Operaciones
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Vista general del rendimiento y operaciones
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="px-3 py-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-sm"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
            <option value="all">Todo</option>
          </select>
          <button className="px-4 py-2 text-sm font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors">
            Nueva Operación
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Operaciones</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {isLoading ? '-' : stats?.totalOperations}
              </p>
            </div>
            <div className="p-2 bg-violet-500/10 rounded-lg">
              <LineChart className="w-6 h-6 text-violet-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Beneficio Total</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {isLoading ? '-' : `$${stats?.totalProfit.toLocaleString()}`}
              </p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {isLoading ? '-' : `${stats?.successRate}%`}
              </p>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Volumen Mensual</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {isLoading ? '-' : `$${stats?.monthlyVolume.toLocaleString()}`}
              </p>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <LineChart className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters mejorados */}
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

        <input
          type="text"
          placeholder="Buscar por símbolo..."
          className="px-3 py-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white border-0"
        />

        <button className="px-3 py-2 text-sm text-violet-500 hover:text-violet-600 font-medium">
          Limpiar filtros
        </button>
      </div>

      {/* Tabla mejorada */}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Etiquetas
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Cargando operaciones...
                  </td>
                </tr>
              ) : operations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No hay operaciones para mostrar
                  </td>
                </tr>
              ) : (
                operations.map((operation) => (
                  <tr key={operation.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-1">
                        {operation.tags?.map((tag) => (
                          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        <div className="px-6 py-3 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700">
              Anterior
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700">
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                Mostrando <span className="font-medium">1</span> a <span className="font-medium">5</span> de{' '}
                <span className="font-medium">20</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700">
                  Anterior
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700">
                  1
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700">
                  2
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700">
                  Siguiente
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}