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
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";

// Actualizada para coincidir con la interfaz del backend
interface Operation {
  id: string;
  subAccountId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  status: 'open' | 'closed' | 'canceled';
  price: number;
  quantity: number;
  filledQuantity?: number;
  remainingQuantity?: number;
  leverage?: number;
  openTime: Date;
  closeTime?: Date;
  profit?: number;
  profitPercentage?: number;
  fee?: number;
  exchange: string;
  isDemo: boolean;
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
  const { user, token } = useAuth();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [operationsBySubAccount, setOperationsBySubAccount] = useState<{ [subAccountId: string]: Operation[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [marketFilter, setMarketFilter] = useState<'all' | 'spot' | 'futures'>('all');
  const [sortBy, setSortBy] = useState('date');
  const [dateRange, setDateRange] = useState('7d');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [selectedOperations, setSelectedOperations] = useState<string[]>([]);
  const [hoveredOperation, setHoveredOperation] = useState<string | null>(null);
  const [expandedOperation, setExpandedOperation] = useState<string | null>(null);
  const [selectedSubAccount, setSelectedSubAccount] = useState<string | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  // Cargar operaciones abiertas desde la API
  useEffect(() => {
    const fetchOpenOperations = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (!token) {
          throw new Error("No hay token de autenticación");
        }
        
        console.log("🔍 Obteniendo operaciones abiertas...");
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/operations/open`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error al obtener operaciones: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || "Error desconocido al obtener operaciones");
        }
        
        console.log("✅ Operaciones obtenidas:", data);
        
        // Guardar operaciones por subcuenta
        setOperationsBySubAccount(data.operations || {});
        
        // Aplanar todas las operaciones en un solo array
        const allOperations = Object.values(data.operations || {}).flat() as Operation[];
        
        // Convertir las fechas de string a Date
        const processedOperations = allOperations.map(op => ({
          ...op,
          openTime: new Date(op.openTime),
          closeTime: op.closeTime ? new Date(op.closeTime) : undefined
        }));
        
        setOperations(processedOperations);
        
        // Calcular estadísticas
        if (processedOperations.length > 0) {
          calculateStats(processedOperations);
        }
      } catch (err) {
        console.error("❌ Error al obtener operaciones:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
        // Usar datos de ejemplo en caso de error
        setMockData();
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOpenOperations();
  }, [token]);
  
  // Función para calcular estadísticas
  const calculateStats = (ops: Operation[]) => {
    const totalProfit = ops.reduce((acc, op) => acc + (op.profit || 0), 0);
    const completedOps = ops.filter(op => op.status === 'closed');
    const successRate = completedOps.length > 0 
      ? (completedOps.filter(op => (op.profit || 0) > 0).length / completedOps.length) * 100 
      : 0;
    
    const bestOperation = ops.reduce<Operation | null>((best, op) => {
      if (!best) return op;
      return (op.profit || 0) > (best.profit || 0) ? op : best;
    }, null);
    
    const worstOperation = ops.reduce<Operation | null>((worst, op) => {
      if (!worst) return op;
      return (op.profit || 0) < (worst.profit || 0) ? op : worst;
    }, null);
    
    // Calcular volumen mensual (suma de quantity * price)
    const monthlyVolume = ops
      .filter(op => {
        const opDate = new Date(op.openTime);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return opDate >= oneMonthAgo;
      })
      .reduce((acc, op) => acc + (op.quantity * op.price), 0);
    
    // Calcular operaciones semanales
    const weeklyOperations = ops.filter(op => {
      const opDate = new Date(op.openTime);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return opDate >= oneWeekAgo;
    }).length;
    
    // Calcular beneficio promedio
    const averageProfit = completedOps.length > 0 
      ? totalProfit / completedOps.length 
      : 0;
    
    // Calcular comisiones totales
    const totalFees = ops.reduce((acc, op) => acc + (op.fee || 0), 0);
    
    // Calcular símbolos más rentables
    const symbolProfits = ops.reduce((acc, op) => {
      if (!acc[op.symbol]) {
        acc[op.symbol] = 0;
      }
      acc[op.symbol] += op.profit || 0;
      return acc;
    }, {} as Record<string, number>);
    
    const profitableSymbols = Object.entries(symbolProfits)
      .map(([symbol, profit]) => ({ symbol, profit }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 3);
    
    setStats({
      totalOperations: ops.length,
      totalProfit,
      successRate,
      bestOperation,
      worstOperation,
      monthlyVolume,
      weeklyOperations,
      averageProfit,
      totalFees,
      profitableSymbols
    });
  };
  
  // Función para cargar datos de ejemplo en caso de error
  const setMockData = () => {
    // Datos de ejemplo mejorados
    const mockOperations: Operation[] = [
      {
        id: '1',
        subAccountId: 'demo-1',
        symbol: 'BTCUSDT',
        side: 'buy',
        type: 'limit',
        status: 'open',
        price: 45000,
        quantity: 0.5,
        filledQuantity: 0.2,
        remainingQuantity: 0.3,
        openTime: new Date('2024-03-20T10:30:00'),
        profit: 1200,
        fee: 2.5,
        exchange: 'binance',
        isDemo: true
      },
      {
        id: '2',
        subAccountId: 'demo-1',
        symbol: 'ETHUSDT',
        side: 'sell',
        type: 'market',
        status: 'open',
        price: 3200,
        quantity: 2.5,
        filledQuantity: 2.5,
        remainingQuantity: 0,
        leverage: 10,
        openTime: new Date('2024-03-19T15:45:00'),
        profit: -300,
        fee: 1.8,
        exchange: 'kraken',
        isDemo: true
      },
      {
        id: '3',
        subAccountId: 'demo-2',
        symbol: 'SOLUSDT',
        side: 'buy',
        type: 'limit',
        status: 'open',
        price: 125,
        quantity: 10,
        filledQuantity: 0,
        remainingQuantity: 10,
        leverage: 5,
        openTime: new Date('2024-03-18T09:15:00'),
        fee: 0.5,
        exchange: 'binance',
        isDemo: true
      }
    ];

    // Agrupar por subcuenta
    const groupedOperations = mockOperations.reduce((acc, op) => {
      if (!acc[op.subAccountId]) {
        acc[op.subAccountId] = [];
      }
      acc[op.subAccountId].push(op);
      return acc;
    }, {} as Record<string, Operation[]>);

    setOperationsBySubAccount(groupedOperations);
    setOperations(mockOperations);
    calculateStats(mockOperations);
  };

  // Filtrar operaciones según los filtros seleccionados
  const filteredOperations = operations.filter(operation => {
    // Filtrar por subcuenta
    if (selectedSubAccount !== 'all' && operation.subAccountId !== selectedSubAccount) {
      return false;
    }
    
    // Filtrar por estado
    if (filter !== 'all' && operation.status !== filter) {
      return false;
    }
    
    // Filtrar por tipo de mercado (spot/futures)
    if (marketFilter !== 'all') {
      const isSpot = !operation.leverage;
      if (marketFilter === 'spot' && !isSpot) return false;
      if (marketFilter === 'futures' && isSpot) return false;
    }
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        operation.symbol.toLowerCase().includes(searchLower) ||
        operation.exchange.toLowerCase().includes(searchLower) ||
        operation.side.toLowerCase().includes(searchLower) ||
        operation.type.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Ordenar operaciones
  const sortedOperations = [...filteredOperations].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.openTime).getTime() - new Date(a.openTime).getTime();
    } else if (sortBy === 'amount') {
      return (b.quantity * b.price) - (a.quantity * a.price);
    } else if (sortBy === 'profit') {
      return (b.profit || 0) - (a.profit || 0);
    }
    return 0;
  });

  const handleOperationSelect = (operationId: string) => {
    setSelectedOperations(prev => 
      prev.includes(operationId) 
        ? prev.filter(id => id !== operationId)
        : [...prev, operationId]
    );
  };

  const renderOperationCard = (operation: Operation) => (
    <div 
      key={operation.id} 
      onClick={() => handleOperationSelect(operation.id)}
      onMouseEnter={() => setHoveredOperation(operation.id)}
      onMouseLeave={() => setHoveredOperation(null)}
      className={`group bg-white dark:bg-zinc-800 rounded-xl shadow-sm transition-all duration-300 border-2 relative overflow-hidden cursor-pointer
        ${selectedOperations.includes(operation.id)
          ? 'border-violet-500 dark:border-violet-400 shadow-lg shadow-violet-100 dark:shadow-violet-900/20 scale-[1.02]'
          : 'border-transparent hover:border-violet-200 dark:hover:border-violet-800/30 hover:shadow-md hover:scale-[1.01]'}
        ${expandedOperation === operation.id ? 'p-8' : 'p-6'}`}
    >
      {/* Efecto de brillo al hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {/* Checkbox mejorado */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`absolute right-4 top-4 w-6 h-6 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
          selectedOperations.includes(operation.id)
            ? 'border-violet-500 bg-violet-500 dark:border-violet-400 dark:bg-violet-400 scale-110'
            : 'border-zinc-300 dark:border-zinc-600 group-hover:border-violet-400'
        }`}
      >
        <div className={`transform transition-transform duration-200 ${
          selectedOperations.includes(operation.id) ? 'scale-100' : 'scale-0'
        }`}>
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Indicador de borde izquierdo mejorado */}
      <div className={`absolute left-0 top-0 w-1 h-full transition-all duration-300 ${
        operation.profit && operation.profit > 0
          ? 'bg-emerald-500'
          : operation.profit && operation.profit < 0
          ? 'bg-rose-500'
          : 'bg-yellow-500'
      } ${hoveredOperation === operation.id ? 'w-1.5' : 'w-1'}`} />

      {/* Indicador de mercado */}
      <div className={`absolute right-0 top-12 -rotate-90 transform origin-right px-2 py-1 text-xs font-medium rounded-b-md ${
        operation.leverage ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      }`}>
        {operation.leverage ? 'Futuros' : 'Spot'}
      </div>

      <div className="flex items-start justify-between mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              operation.side === 'buy' 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/40'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 group-hover:bg-rose-200 dark:group-hover:bg-rose-900/40'
            }`}>
              {operation.side === 'buy' ? 'Compra' : 'Venta'}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              operation.status === 'closed'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/40'
                : operation.status === 'open'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/40'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-900/40'
            }`}>
              {operation.status === 'closed' ? 'Completada' : 
               operation.status === 'open' ? 'Pendiente' : 'Cancelada'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              {operation.symbol}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700/50 px-2.5 py-1 rounded-lg transition-colors group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700">
              <ExternalLink className="w-3.5 h-3.5" />
              {operation.exchange}
            </div>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            {new Date(operation.openTime).toLocaleString()}
          </p>
        </div>
        {operation.profit !== undefined && (
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
            operation.profit >= 0
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/40'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 group-hover:bg-rose-200 dark:group-hover:bg-rose-900/40'
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
      
      <div className="grid grid-cols-2 gap-4 p-4 mb-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl transition-all duration-200 group-hover:bg-zinc-100/80 dark:group-hover:bg-zinc-800/50">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 dark:bg-violet-500"></span>
            Precio
          </p>
          <p className="text-base font-medium text-zinc-900 dark:text-white">
            ${operation.price.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 dark:bg-violet-500"></span>
            Cantidad
          </p>
          <p className="text-base font-medium text-zinc-900 dark:text-white">
            {operation.quantity}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {operation.profit !== undefined && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-800 dark:text-blue-300 transition-all duration-200 group-hover:bg-blue-100/80 dark:group-hover:bg-blue-900/30">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>{operation.profitPercentage ? `${operation.profitPercentage}%` : ''}</p>
          </div>
        )}
        {operation.fee !== undefined && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Comisión: ${operation.fee.toLocaleString()}
          </p>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              // Lógica para editar
            }}
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
          <span className="text-zinc-300 dark:text-zinc-600">•</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              // Lógica para duplicar
            }}
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Duplicar
          </button>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setExpandedOperation(expandedOperation === operation.id ? null : operation.id);
          }}
          className={`inline-flex items-center justify-center p-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all group-hover:scale-105 ${
            expandedOperation === operation.id ? 'rotate-90' : ''
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderTableRow = (operation: Operation) => (
    <tr 
      key={operation.id}
      onClick={() => handleOperationSelect(operation.id)}
      onMouseEnter={() => setHoveredOperation(operation.id)}
      onMouseLeave={() => setHoveredOperation(null)}
      className={`group transition-all duration-200 cursor-pointer relative ${
        selectedOperations.includes(operation.id)
          ? 'bg-violet-50 dark:bg-violet-900/20'
          : 'hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
      }`}
    >
      <td className="absolute inset-0 pointer-events-none">
        {/* Efecto de brillo al hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </td>

      <td className="px-6 py-4 w-8">
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
            selectedOperations.includes(operation.id)
              ? 'border-violet-500 bg-violet-500 dark:border-violet-400 dark:bg-violet-400'
              : 'border-zinc-300 dark:border-zinc-600 group-hover:border-violet-400'
          }`}
        >
          <div className={`transform transition-transform duration-200 ${
            selectedOperations.includes(operation.id) ? 'scale-100' : 'scale-0'
          }`}>
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-zinc-900 dark:text-white">
            {new Date(operation.openTime).toLocaleDateString()}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {new Date(operation.openTime).toLocaleTimeString()}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            operation.side === 'buy' 
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
          }`}>
            {operation.side === 'buy' ? 'Compra' : 'Venta'}
          </span>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            operation.status === 'closed'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
              : operation.status === 'open'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {operation.status === 'closed' ? 'Completada' : 
             operation.status === 'open' ? 'Pendiente' : 'Cancelada'}
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
            {operation.quantity} unidades
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
          {/* Mostrar tipo de operación como etiqueta */}
          <span 
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors cursor-pointer"
          >
            <Tag className="w-3 h-3 mr-1" />
            {operation.type}
          </span>
          {/* Mostrar si es demo como etiqueta */}
          {operation.isDemo && (
            <span 
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
            >
              <Tag className="w-3 h-3 mr-1" />
              Demo
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 inline-flex items-center justify-center p-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40">
          <ChevronRight className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );

  const ActionBar = () => (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-4 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 flex items-center gap-4 z-50 transition-all duration-300 transform">
      <span className="text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
        {selectedOperations.length} {selectedOperations.length === 1 ? 'operación' : 'operaciones'} seleccionada{selectedOperations.length === 1 ? '' : 's'}
      </span>
      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700"></div>
      <button className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Exportar
      </button>
      <button className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-2">
        <Tag className="w-4 h-4" />
        Etiquetar
      </button>
      <button className="text-sm font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Eliminar
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
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
          <div className="h-64 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
            Gráfico de distribución por par (próximamente)
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm">
          <div className="h-64 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
            Gráfico de rendimiento (próximamente)
          </div>
        </div>
      </div>

      {/* Filters mejorados */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
              Operaciones
            </h3>
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
              <Link href="/operations/new">
                <button className="px-4 py-2 text-sm font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  Nueva Operación
                </button>
              </Link>
            </div>
          </div>
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
                value={marketFilter}
                onChange={(e) => setMarketFilter(e.target.value as 'all' | 'spot' | 'futures')}
              >
                <option value="all">Todos los mercados</option>
                <option value="spot">Solo Spot</option>
                <option value="futures">Solo Futuros</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <select
                className="px-3 py-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white border-0 focus:ring-2 focus:ring-violet-500"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Todas las operaciones</option>
                <option value="closed">Completadas</option>
                <option value="open">Pendientes</option>
                <option value="canceled">Canceladas</option>
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
            {['swing', 'scalping', 'position', 'day-trade', 'spot'].map((tagName) => (
              <button
                key={tagName}
                onClick={() => {
                  if (selectedTags.includes(tagName)) {
                    setSelectedTags(selectedTags.filter(t => t !== tagName));
                  } else {
                    setSelectedTags([...selectedTags, tagName]);
                  }
                }}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedTags.includes(tagName)
                    ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400'
                    : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                }`}
              >
                <Tag className="w-3 h-3" />
                {tagName}
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider w-8">
                    <input
                      type="checkbox"
                      className="rounded border-zinc-300 dark:border-zinc-600 text-violet-500 focus:ring-violet-500"
                      checked={selectedOperations.length === operations.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOperations(operations.map(op => op.id));
                        } else {
                          setSelectedOperations([]);
                        }
                      }}
                    />
                  </th>
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
                      <td colSpan={8} className="px-6 py-6">
                        <div className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded-lg"></div>
                      </td>
                    </tr>
                  ))
                ) : operations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
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
                  sortedOperations.map(renderTableRow)
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="animate-pulse bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm">
                  <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3 mb-4"></div>
                  <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3 mb-6"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full"></div>
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6"></div>
                  </div>
                </div>
              ))
            ) : operations.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center gap-4 py-12">
                <div className="p-4 bg-zinc-100 dark:bg-zinc-700 rounded-full">
                  <Search className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                </div>
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
                  No hay operaciones para mostrar
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-md">
                  Intenta ajustar los filtros o crea una nueva operación para empezar
                </p>
                <button className="mt-2 px-4 py-2 text-sm font-medium text-violet-500 hover:text-violet-600 bg-violet-50 dark:bg-violet-900/10 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-colors">
                  Crear nueva operación
                </button>
              </div>
            ) : (
              sortedOperations.map(renderOperationCard)
            )}
          </div>
        )}
        
        {selectedOperations.length > 0 && (
          <ActionBar />
        )}
      </div>
    </div>
  );
}