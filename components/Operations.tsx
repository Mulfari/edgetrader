"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart,
  Clock,
  Search,
  Table,
  Grid,
  Info,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Pause,
  Play
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";

// Estilos para las animaciones
const styles = `
  @keyframes pulseGreen {
    0% { background-color: rgba(16, 185, 129, 0.1); }
    50% { background-color: rgba(16, 185, 129, 0.3); }
    100% { background-color: rgba(16, 185, 129, 0.1); }
  }
  
  @keyframes pulseRed {
    0% { background-color: rgba(239, 68, 68, 0.1); }
    50% { background-color: rgba(239, 68, 68, 0.3); }
    100% { background-color: rgba(239, 68, 68, 0.1); }
  }
  
  .animate-pulse-green {
    animation: pulseGreen 2s ease-in-out;
  }
  
  .animate-pulse-red {
    animation: pulseRed 2s ease-in-out;
  }
`;

// Actualizada para coincidir con la interfaz del backend
interface Operation {
  id: string;
  subAccountId: string;
  symbol: string;
  side: 'buy' | 'sell';
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
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [hoveredOperation, setHoveredOperation] = useState<string | null>(null);
  const [expandedOperation, setExpandedOperation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLiveUpdating, setIsLiveUpdating] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [updateInterval, setUpdateInterval] = useState<number>(5000); // 5 segundos por defecto
  const [changedOperations, setChangedOperations] = useState<Record<string, { profit: number, timestamp: number }>>({});
  const [subaccountErrors, setSubaccountErrors] = useState<Array<{
    subaccountId: string;
    subaccountName: string;
    error: string;
    isDemo: boolean;
  }>>([]);

  // Inicializar el componente
  useEffect(() => {
    if (token) {
      fetchOpenPerpetualOperations();
      
      // Configurar actualización periódica si isLiveUpdating está activado
      let intervalId: NodeJS.Timeout | null = null;
      
      if (isLiveUpdating) {
        intervalId = setInterval(() => {
          fetchOpenPerpetualOperations(false); // false = no mostrar loading
        }, updateInterval);
      }
      
      // Limpiar el intervalo cuando el componente se desmonte
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    } else {
      setOperations([]);
      setOperationsBySubAccount({});
      calculateStats([]);
    }
  }, [token, isLiveUpdating, updateInterval]);
  
  // Función para obtener las operaciones abiertas en perpetual
  const fetchOpenPerpetualOperations = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subaccounts/user/all-open-perpetual-operations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener operaciones abiertas en perpetual');
      }
      
      // Manejar errores de subcuentas individuales
      if (data.errors && data.errors.length > 0) {
        setSubaccountErrors(data.errors);
        console.warn(`${data.errors.length} subcuentas fallaron:`, data.errors);
      } else {
        setSubaccountErrors([]);
      }
      
      // Detectar cambios en las operaciones
      const newChangedOperations = { ...changedOperations };
      
      // Comparar con las operaciones anteriores para detectar cambios
      data.operations.forEach((newOp: Operation) => {
        const existingOp = operations.find(op => op.id === newOp.id);
        
        if (existingOp && existingOp.profit !== newOp.profit) {
          // Registrar el cambio
          newChangedOperations[newOp.id] = {
            profit: newOp.profit || 0,
            timestamp: Date.now()
          };
        }
      });
      
      setChangedOperations(newChangedOperations);
      
      // Actualizar el estado con las operaciones obtenidas
      setOperations(data.operations);
      
      // Agrupar operaciones por subcuenta
      const operationsBySubAcc = data.operations.reduce((acc: Record<string, Operation[]>, operation: Operation) => {
        if (!acc[operation.subAccountId]) {
          acc[operation.subAccountId] = [];
        }
        acc[operation.subAccountId].push(operation);
        return acc;
      }, {});
      
      setOperationsBySubAccount(operationsBySubAcc);
      
      // Calcular estadísticas
      calculateStats(data.operations);
      
      // Actualizar la hora de la última actualización
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('Error al obtener operaciones abiertas en perpetual');
      setError('Error al obtener operaciones abiertas en perpetual. Por favor, intenta de nuevo más tarde.');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };
  
  // Función para alternar las actualizaciones en vivo
  const toggleLiveUpdates = () => {
    setIsLiveUpdating(!isLiveUpdating);
  };
  
  // Función para cambiar el intervalo de actualización
  const changeUpdateInterval = (newInterval: number) => {
    setUpdateInterval(newInterval);
  };
  
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
  
  // Ordenar operaciones por fecha (más reciente primero)
  const sortedOperations = [...operations].sort((a, b) => {
    return new Date(b.openTime).getTime() - new Date(a.openTime).getTime();
  });

  // Función para verificar si una operación ha cambiado recientemente
  const hasRecentlyChanged = (operationId: string): boolean => {
    if (!changedOperations[operationId]) return false;
    
    // Considerar "reciente" si cambió en los últimos 3 segundos
    const isRecent = Date.now() - changedOperations[operationId].timestamp < 3000;
    return isRecent;
  };
  
  // Función para obtener la clase CSS para el efecto de cambio
  const getChangeEffectClass = (operationId: string, profit: number | undefined): string => {
    if (!hasRecentlyChanged(operationId)) return '';
    
    const previousProfit = changedOperations[operationId]?.profit || 0;
    const currentProfit = profit || 0;
    
    if (currentProfit > previousProfit) {
      return 'animate-pulse-green';
    } else if (currentProfit < previousProfit) {
      return 'animate-pulse-red';
    }
    
    return '';
  };

  const renderOperationCard = (operation: Operation) => (
    <div 
      key={operation.id} 
      onMouseEnter={() => setHoveredOperation(operation.id)}
      onMouseLeave={() => setHoveredOperation(null)}
      className={`group bg-white dark:bg-zinc-800 rounded-xl shadow-sm transition-all duration-300 border-2 relative overflow-hidden cursor-pointer
        border-transparent hover:border-violet-200 dark:hover:border-violet-800/30 hover:shadow-md hover:scale-[1.01]
        ${expandedOperation === operation.id ? 'p-8' : 'p-6'}
        ${hasRecentlyChanged(operation.id) ? 'border-l-4 border-l-violet-500' : ''}`}
    >
      {/* Efecto de brillo al hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {/* Indicador de borde izquierdo mejorado */}
      <div className={`absolute left-0 top-0 w-1 h-full transition-all duration-300 ${
        operation.profit && operation.profit > 0
          ? 'bg-emerald-500'
          : operation.profit && operation.profit < 0
          ? 'bg-rose-500'
          : 'bg-yellow-500'
      } ${hoveredOperation === operation.id ? 'w-1.5' : 'w-1'}`} />

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
          } ${getChangeEffectClass(operation.id, operation.profit)}`}>
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
      onMouseEnter={() => setHoveredOperation(operation.id)}
      onMouseLeave={() => setHoveredOperation(null)}
      className={`group transition-all duration-200 cursor-pointer relative hover:bg-zinc-50 dark:hover:bg-zinc-700/50 ${
        hasRecentlyChanged(operation.id) ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''
      }`}
    >
      <td className="absolute inset-0 pointer-events-none">
        {/* Efecto de brillo al hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
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
            } ${getChangeEffectClass(operation.id, operation.profit)}`}>
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
      <td className="px-6 py-4 text-right">
        <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 inline-flex items-center justify-center p-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40">
          <ChevronRight className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Estilos para las animaciones */}
      <style jsx>{styles}</style>
      
      {/* Mostrar errores de subcuentas si existen */}
      {subaccountErrors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                Errores en {subaccountErrors.length} subcuenta{subaccountErrors.length > 1 ? 's' : ''}
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-400 space-y-1">
                {subaccountErrors.map((error, index) => (
                  <div key={error.subaccountId} className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-500">•</span>
                    <div>
                      <span className="font-medium">{error.subaccountName}</span>
                      {error.isDemo && <span className="text-xs ml-1">(Demo)</span>}:
                      <span className="ml-1">{error.error}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-red-600 dark:text-red-500">
                Por favor, verifica las credenciales API de las subcuentas afectadas en la configuración.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live Updates Control */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLiveUpdates}
            className={`p-2 rounded-lg transition-colors ${
              isLiveUpdating 
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50' 
                : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50'
            }`}
          >
            {isLiveUpdating ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <div>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white">
              {isLiveUpdating ? 'Actualizaciones en vivo activadas' : 'Actualizaciones en vivo desactivadas'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isLiveUpdating 
                ? `Actualizando cada ${updateInterval/1000} segundos` 
                : 'Haz clic para activar las actualizaciones en vivo'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {isLiveUpdating && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Intervalo:</span>
              <select 
                value={updateInterval}
                onChange={(e) => changeUpdateInterval(Number(e.target.value))}
                className="text-xs bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-md px-2 py-1 text-zinc-900 dark:text-white"
              >
                <option value={1000}>1s</option>
                <option value={2000}>2s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
                <option value={60000}>1m</option>
              </select>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchOpenPerpetualOperations()}
              className="p-2 bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {lastUpdateTime ? (
                <>
                  Última actualización: {lastUpdateTime.toLocaleTimeString()}
                  <span className="ml-1 text-zinc-400 dark:text-zinc-500">
                    ({Math.floor((Date.now() - lastUpdateTime.getTime()) / 1000)}s atrás)
                  </span>
                </>
              ) : (
                'Sin actualizar'
              )}
            </div>
          </div>
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

      {/* Operaciones */}
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
              <Link href="/operations/new">
                <button className="px-4 py-2 text-sm font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  Nueva Operación
                </button>
              </Link>
            </div>
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
                          Crea una nueva operación para empezar
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
                  Crea una nueva operación para empezar
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
      </div>
    </div>
  );
}