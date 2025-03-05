"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart,
  Clock,
  Tag,
  Filter,
  Search,
  RefreshCw,
  Table,
  Grid,
  Info,
  ExternalLink,
  ChevronRight
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
  exchange?: string;
  fee?: number;
}

interface DashboardStats {
  totalOperations: number;
  totalProfit: number;
  successRate: number;
  bestOperation: Operation | null;
  worstOperation: Operation | null;
  monthlyVolume: number;
  weeklyOperations: number;
  averageProfit: number;
  totalFees: number;
  profitableSymbols: { symbol: string; profit: number }[];
}

export default function Operations() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [dateRange, setDateRange] = useState('7d');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [view, setView] = useState<'table' | 'cards'>('table');

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
        notes: 'Entrada en soporte fuerte',
        exchange: 'Binance',
        fee: 2.5
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
        notes: 'Salida por stop loss',
        exchange: 'Kraken',
        fee: 1.8
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
        notes: 'Esperando confirmación',
        exchange: 'Binance',
        fee: 0.5
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
        notes: 'Toma de beneficios',
        exchange: 'Binance',
        fee: 1.2
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
        notes: 'Orden cancelada por volatilidad',
        exchange: 'Kraken',
        fee: 0
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
      monthlyVolume: 125000,
      weeklyOperations: 12,
      averageProfit: 450,
      totalFees: mockOperations.reduce((acc, op) => acc + (op.fee || 0), 0),
      profitableSymbols: [
        { symbol: 'BTC/USDT', profit: 2500 },
        { symbol: 'ETH/USDT', profit: 1200 },
        { symbol: 'SOL/USDT', profit: 800 }
      ]
    };

    setTimeout(() => {
      setOperations(mockOperations);
      setStats(mockStats);
      setIsLoading(false);
    }, 1000);
  }, []);

  const renderOperationCard = (operation: Operation) => (
    <div 
      key={operation.id} 
      className="group bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-transparent hover:border-violet-200 dark:hover:border-violet-800/30 relative overflow-hidden"
    >
      {/* Indicador de borde izquierdo */}
      <div className={`absolute left-0 top-0 w-1 h-full ${
        operation.profit && operation.profit > 0
          ? 'bg-emerald-500'
          : operation.profit && operation.profit < 0
          ? 'bg-rose-500'
          : 'bg-yellow-500'
      } opacity-70 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-start justify-between mb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              operation.type === 'buy' 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
            }`}>
              {operation.type === 'buy' ? 'Compra' : 'Venta'}
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              operation.status === 'completed'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                : operation.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {operation.status === 'completed' ? 'Completada' : 
               operation.status === 'pending' ? 'Pendiente' : 'Cancelada'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {operation.symbol}
            </h3>
            <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700/50 px-2 py-0.5 rounded">
              <ExternalLink className="w-3.5 h-3.5" />
              {operation.exchange}
            </div>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {new Date(operation.timestamp).toLocaleString()}
          </p>
        </div>
        {operation.profit !== undefined && (
          <div className={`flex items-center gap-1 px-3 py-2 rounded-lg ${
            operation.profit >= 0
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
          }`}>
            <span className="text-lg font-semibold">
              {operation.profit >= 0 ? '+' : '-'}${Math.abs(operation.profit).toLocaleString()}
            </span>
            {operation.profit >= 0 
              ? <TrendingUp className="h-5 w-5" />
              : <TrendingDown className="h-5 w-5" />
            }
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 p-4 mb-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500"></span>
            Precio
          </p>
          <p className="text-base font-medium text-zinc-900 dark:text-white">
            ${operation.price.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500"></span>
            Cantidad
          </p>
          <p className="text-base font-medium text-zinc-900 dark:text-white">
            {operation.amount}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {operation.notes && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>{operation.notes}</p>
          </div>
        )}
        {operation.tags && operation.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {operation.tags.map((tag) => (
              <span 
                key={tag} 
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors cursor-pointer"
              >
                <Tag className="w-3 h-3 mr-1.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
        {operation.fee !== undefined && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Comisión: ${operation.fee.toLocaleString()}
          </p>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            Editar
          </button>
          <span className="text-zinc-300 dark:text-zinc-600">•</span>
          <button className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            Duplicar
          </button>
        </div>
        <button className="inline-flex items-center justify-center p-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all group-hover:scale-105">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

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
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setView('table')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors inline-flex items-center gap-2 ${
                view === 'table'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Table className="w-4 h-4" />
              Tabla
            </button>
            <button
              onClick={() => setView('cards')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors inline-flex items-center gap-2 ${
                view === 'cards'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              Tarjetas
            </button>
          </div>
          <select
            className="px-3 py-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-sm border-0 focus:ring-2 focus:ring-violet-500"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
            <option value="all">Todo</option>
          </select>
          <button className="px-4 py-2 text-sm font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors flex items-center gap-2">
            <PieChart className="w-4 h-4" />
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
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                <span className="text-emerald-500">+{stats?.weeklyOperations || 0}</span> esta semana
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
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Promedio: <span className="text-emerald-500">${stats?.averageProfit.toLocaleString()}</span>
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
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Operaciones completadas
              </p>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <PieChart className="w-6 h-6 text-blue-500" />
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
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Comisiones: <span className="text-rose-500">${stats?.totalFees.toLocaleString()}</span>
              </p>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <BarChart className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos y Análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">
            Distribución por Par
          </h3>
          <div className="h-64 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
            Gráfico de distribución por par (próximamente)
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">
            Rendimiento Histórico
          </h3>
          <div className="h-64 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
            Gráfico de rendimiento (próximamente)
          </div>
        </div>
      </div>

      {/* Filters mejorados */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
            Operaciones
          </h3>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar por símbolo, tipo, estado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white border-0 focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <select
                className="px-3 py-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white border-0 focus:ring-2 focus:ring-violet-500"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Todas las operaciones</option>
                <option value="completed">Completadas</option>
                <option value="pending">Pendientes</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <select
                className="px-3 py-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white border-0 focus:ring-2 focus:ring-violet-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date">Ordenar por fecha</option>
                <option value="amount">Ordenar por monto</option>
                <option value="profit">Ordenar por beneficio</option>
              </select>
            </div>

            <button 
              onClick={() => {
                setFilter('all');
                setSortBy('date');
                setSearchTerm('');
                setSelectedTags([]);
              }}
              className="px-3 py-2 text-sm text-violet-500 hover:text-violet-600 font-medium flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Limpiar filtros
            </button>
          </div>

          {/* Tags populares */}
          <div className="mt-4 flex flex-wrap gap-2">
            {['swing', 'scalping', 'position', 'day-trade', 'spot'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  if (selectedTags.includes(tag)) {
                    setSelectedTags(selectedTags.filter(t => t !== tag));
                  } else {
                    setSelectedTags([...selectedTags, tag]);
                  }
                }}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400'
                    : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                }`}
              >
                <Tag className="w-3 h-3" />
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Vista condicional: Tabla o Tarjetas */}
        {view === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
              <thead>
                <tr className="bg-gradient-to-r from-zinc-50/80 to-zinc-100/80 dark:from-zinc-800/80 dark:to-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <div className="flex items-center gap-2 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                      Fecha
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <div className="flex items-center gap-2 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                      Tipo/Estado
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <div className="flex items-center gap-2 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                      Par/Exchange
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <div className="flex items-center gap-2 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                      Precio/Cantidad
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <div className="flex items-center gap-2 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                      Beneficio
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <div className="flex items-center gap-2 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                      Etiquetas
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-700">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td colSpan={7} className="px-6 py-6">
                        <div className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded-lg"></div>
                      </td>
                    </tr>
                  ))
                ) : operations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-3 bg-zinc-100 dark:bg-zinc-700 rounded-full">
                          <Search className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                          No hay operaciones para mostrar
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          Intenta ajustar los filtros o crear una nueva operación
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  operations.map((operation) => (
                    <tr 
                      key={operation.id} 
                      className="group hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-all duration-200 cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-zinc-900 dark:text-white">
                            {new Date(operation.timestamp).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(operation.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            operation.type === 'buy' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                          }`}>
                            {operation.type === 'buy' ? 'Compra' : 'Venta'}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            operation.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : operation.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {operation.status === 'completed' ? 'Completada' : 
                             operation.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-zinc-900 dark:text-white">
                            {operation.symbol}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            {operation.exchange}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-zinc-900 dark:text-white">
                            ${operation.price.toLocaleString()}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {operation.amount} unidades
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {operation.profit !== undefined && (
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium flex items-center ${
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
                            {operation.fee !== undefined && (
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                Comisión: ${operation.fee.toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {operation.tags?.map((tag) => (
                            <span 
                              key={tag} 
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors cursor-pointer"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 inline-flex items-center justify-center p-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Cargando operaciones...
                </div>
              </div>
            ) : operations.length === 0 ? (
              <div className="col-span-full flex items-center justify-center py-12 text-zinc-500 dark:text-zinc-400">
                No hay operaciones para mostrar
              </div>
            ) : (
              operations.map(renderOperationCard)
            )}
          </div>
        )}
        
        {/* Paginación mejorada */}
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