'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  RefreshCw,
  ChevronDown,
  Target,
  Clock,
  Users,
  Activity,
  Zap,
  X,
  MoreHorizontal,
  DollarSign,
  Percent,
  BarChart3,
  TrendingUp as TrendUp,
  TrendingDown as TrendDown
} from 'lucide-react';

interface SubAccount {
  id: string;
  name: string;
  created_at: string;
  api_key: string;
  secret_key: string;
  is_demo: boolean;
  balance: {
    btc: number;
    usdt: number;
    eth?: number;
    [key: string]: number | undefined;
  };
}

interface Operation {
  id: string;
  subAccountId: string;
  symbol: string;
  side: 'buy' | 'sell';
  status: 'open' | 'closed' | 'canceled';
  price: number | null;
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
  markPrice?: number | null;
  liquidationPrice?: number | null;
  positionValue?: number | null;
}

interface OpenOperationsProps {
  openOperations: Operation[];
  isLoadingOperations: boolean;
  operationsError: string | null;
  subAccounts: SubAccount[];
  hasRecentlyChanged: (operationId: string) => boolean;
  getChangeEffectClass: (operationId: string, profit: number | undefined) => string;
  getPriceDirection: (operationId: string) => 'up' | 'down' | 'neutral';
  onClosePosition?: (operationId: string) => void;
  onRetry?: () => void;
  autoRefreshEnabled?: boolean;
}

// Función para determinar si es posición o orden
const getOperationType = (operation: Operation): 'position' | 'order' => {
  if (operation.filledQuantity && operation.filledQuantity > 0) {
    if (operation.remainingQuantity && operation.remainingQuantity > 0) {
      return 'order'; // Orden parcialmente ejecutada
    }
    return 'position'; // Posición abierta
  }
  return 'order'; // Orden pendiente
};

// Función para limpiar nombre de subcuenta
const cleanAccountName = (name: string): string => {
  return name
    .replace(/\s*-\s*bybit/gi, '')
    .replace(/\s*-\s*binance/gi, '')
    .replace(/\s*bybit\s*/gi, '')
    .replace(/\s*binance\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Función para formatear números con separadores de miles
const formatNumber = (num: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

export default function OpenOperations({
  openOperations,
  isLoadingOperations,
  operationsError,
  subAccounts,
  hasRecentlyChanged,
  getChangeEffectClass,
  getPriceDirection,
  onClosePosition,
  onRetry,
  autoRefreshEnabled = true
}: OpenOperationsProps) {
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'positions' | 'orders'>('all');
  const [expandedSubAccounts, setExpandedSubAccounts] = useState<Record<string, boolean>>({});

  // Filtrar operaciones según el tipo seleccionado
  const filteredOperations = openOperations.filter(operation => {
    if (filterType === 'all') return true;
    const operationType = getOperationType(operation);
    return filterType === 'positions' ? operationType === 'position' : operationType === 'order';
  });

  // Agrupar por subcuenta para mejor organización
  const groupedBySubAccount = filteredOperations.reduce((groups, operation) => {
    const subAccount = subAccounts.find(acc => acc.id === operation.subAccountId);
    if (!subAccount) return groups;
    
    const key = operation.subAccountId;
    if (!groups[key]) {
      groups[key] = {
        subAccount,
        operations: []
      };
    }
    groups[key].operations.push(operation);
    return groups;
  }, {} as Record<string, { subAccount: SubAccount; operations: Operation[] }>);

  // Calcular totales
  const totalProfit = filteredOperations.reduce((sum, op) => sum + (op.profit || 0), 0);
  const positionsCount = openOperations.filter(op => getOperationType(op) === 'position').length;
  const ordersCount = openOperations.filter(op => getOperationType(op) === 'order').length;

  // Función para alternar expansión de subcuenta
  const toggleSubAccount = (subAccountId: string) => {
    setExpandedSubAccounts(prev => ({
        ...prev,
        [subAccountId]: !prev[subAccountId]
    }));
  };
    
    return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-700 overflow-hidden">
      {/* Header simplificado y más limpio */}
      <div className="border-b border-zinc-200 dark:border-zinc-700">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-3 text-lg font-semibold text-zinc-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                <div className="w-1 h-6 bg-gradient-to-b from-violet-500 to-blue-500 rounded-full"></div>
                <span>Operaciones Activas</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Badges informativos */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Target className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{positionsCount}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <Clock className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                  <span className="text-xs font-medium text-orange-700 dark:text-orange-300">{ordersCount}</span>
                </div>
                {totalProfit !== 0 && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                    totalProfit >= 0
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    <Activity className="w-3 h-3" />
                    <span className={`text-xs font-medium ${
                      totalProfit >= 0
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {totalProfit >= 0 ? '+' : ''}${formatNumber(totalProfit)}
                    </span>
                </div>
              )}
                </div>
              </div>
              
            {/* Filtros simples */}
            {isExpanded && openOperations.length > 0 && (
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg p-1">
                <button 
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filterType === 'all'
                      ? 'bg-white dark:bg-zinc-600 shadow-sm text-zinc-900 dark:text-white'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Todas ({openOperations.length})
                </button>
                <button 
                  onClick={() => setFilterType('positions')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filterType === 'positions'
                      ? 'bg-white dark:bg-zinc-600 shadow-sm text-blue-700 dark:text-blue-300'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-blue-700 dark:hover:text-blue-300'
                  }`}
                >
                  Posiciones ({positionsCount})
                </button>
              <button 
                  onClick={() => setFilterType('orders')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filterType === 'orders'
                      ? 'bg-white dark:bg-zinc-600 shadow-sm text-orange-700 dark:text-orange-300'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-orange-700 dark:hover:text-orange-300'
                  }`}
                >
                  Órdenes ({ordersCount})
              </button>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido */}
      {isExpanded && (
        <div className="p-4">
          {isLoadingOperations ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-zinc-600 dark:text-zinc-400">Cargando operaciones...</span>
              </div>
            </div>
          ) : operationsError ? (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300">{operationsError}</span>
              </div>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-lg transition-colors"
                >
                  Reintentar
                </button>
              )}
            </div>
          ) : filteredOperations.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-zinc-400" />
              </div>
              <p className="text-zinc-500 dark:text-zinc-400">
                {filterType === 'all' 
                  ? 'No hay operaciones abiertas' 
                  : filterType === 'positions'
                  ? 'No hay posiciones abiertas'
                  : 'No hay órdenes pendientes'
                }
              </p>
            </div>
          ) : (
            /* Lista detallada agrupada por subcuenta */
            <div className="space-y-4">
              {Object.entries(groupedBySubAccount).map(([subAccountId, group]) => {
                const isSubAccountExpanded = expandedSubAccounts[subAccountId] !== false; // Por defecto expandido
                const subAccountProfit = group.operations.reduce((sum, op) => sum + (op.profit || 0), 0);
                const subAccountPositions = group.operations.filter(op => getOperationType(op) === 'position').length;
                const subAccountOrders = group.operations.filter(op => getOperationType(op) === 'order').length;

    return (
                  <div key={subAccountId} className="bg-zinc-50 dark:bg-zinc-700/30 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-600">
                    {/* Header de la subcuenta */}
        <div 
                      onClick={() => toggleSubAccount(subAccountId)}
                      className="px-4 py-3 bg-zinc-100 dark:bg-zinc-700 border-b border-zinc-200 dark:border-zinc-600 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
        >
                      <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <span className="font-semibold text-zinc-900 dark:text-white">
                              {cleanAccountName(group.subAccount.name)}
              </span>
              {group.subAccount.is_demo && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-full">
                  Demo
                </span>
              )}
            </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 rounded-full font-medium">
                              {group.operations[0]?.exchange || 'Bybit'}
                            </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Estadísticas de la subcuenta */}
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-1">
                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-zinc-600 dark:text-zinc-400">
                                {subAccountPositions}
                </span>
              </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-zinc-600 dark:text-zinc-400">
                                {subAccountOrders}
                </span>
              </div>
                            {subAccountProfit !== 0 && (
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                                subAccountProfit >= 0
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                                <Activity className="w-3 h-3" />
                                <span className="text-xs font-medium">
                                  {subAccountProfit >= 0 ? '+' : ''}${formatNumber(subAccountProfit)}
                  </span>
                </div>
              )}
            </div>
            
                          <ChevronDown className={`w-4 h-4 transition-transform ${
                            isSubAccountExpanded ? 'rotate-180' : ''
                          }`} />
                        </div>
          </div>
        </div>
        
                    {/* Operaciones de la subcuenta */}
                    {isSubAccountExpanded && (
                      <div className="divide-y divide-zinc-200 dark:divide-zinc-600">
                        {group.operations.map((operation) => {
                          const operationType = getOperationType(operation);
                          
                          return (
                            <div
                              key={operation.id}
                              className={`p-4 hover:bg-white dark:hover:bg-zinc-600/50 transition-colors ${
                                hasRecentlyChanged(operation.id) ? 'bg-violet-50 dark:bg-violet-900/20 border-l-4 border-violet-500' : ''
                              }`}
                            >
                              {/* Información principal de la operación */}
                              <div className="space-y-4">
                                {/* Header de la operación */}
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-4">
                                    {/* Tipo e icono */}
                                    <div className="flex flex-col items-center gap-1">
                                      <div className={`p-2 rounded-lg ${
                                        operationType === 'position'
                                          ? 'bg-blue-100 dark:bg-blue-900/30'
                                          : 'bg-orange-100 dark:bg-orange-900/30'
                                      }`}>
                                        {operationType === 'position' ? (
                                          <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        ) : (
                                          <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  )}
                </div>
                                      <span className={`text-xs font-medium ${
                                        operationType === 'position'
                                          ? 'text-blue-700 dark:text-blue-300'
                                          : 'text-orange-700 dark:text-orange-300'
                                      }`}>
                                        {operationType === 'position' ? 'Posición' : 'Orden'}
                </span>
            </div>
            
                                    {/* Información básica */}
                                    <div className="space-y-2">
            <div className="flex items-center gap-3">
                                        <span className="text-xl font-bold text-zinc-900 dark:text-white">
                                          {operation.symbol}
                                        </span>
                                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                          operation.side === 'buy'
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                        }`}>
                                          {operation.side === 'buy' ? 'LONG' : 'SHORT'}
                                        </span>
                                        {operation.leverage && (
                                          <span className="px-3 py-1 text-sm font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-full">
                                            {operation.leverage}x
                                          </span>
                                        )}
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                          operation.status === 'open'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                                        }`}>
                                          {operation.status.toUpperCase()}
                                        </span>
            </div>
          </div>
        </div>
        
                                  {/* P&L destacado */}
                                  {operation.profit !== undefined && (
                                    <div className="text-right">
                                      <div className={`text-2xl font-bold ${
                                        operation.profit >= 0
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : 'text-red-600 dark:text-red-400'
                                      } ${getChangeEffectClass(operation.id, operation.profit)}`}>
                                        {operation.profit >= 0 ? '+' : ''}${formatNumber(operation.profit)}
                </div>
                                      {operation.profitPercentage !== undefined && (
                                        <div className={`text-lg font-medium ${
                                          operation.profitPercentage >= 0
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-red-600 dark:text-red-400'
                                        }`}>
                                          {operation.profitPercentage >= 0 ? '+' : ''}{formatNumber(operation.profitPercentage)}%
                  </div>
                  )}
                </div>
                      )}
                    </div>

                                {/* Grid de información detallada */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                  {/* Precio de entrada */}
                                  <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
                                    <div className="flex items-center gap-2 mb-1">
                                      <DollarSign className="w-4 h-4 text-zinc-500" />
                                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Precio de Entrada</span>
                                    </div>
                                    <span className="text-lg font-bold text-zinc-900 dark:text-white">
                                      ${operation.price ? formatNumber(operation.price) : 'N/A'}
                                    </span>
                                  </div>

                                  {/* Cantidad */}
                                  <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
                                    <div className="flex items-center gap-2 mb-1">
                                      <BarChart3 className="w-4 h-4 text-zinc-500" />
                                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Cantidad</span>
                                    </div>
                                    <span className="text-lg font-bold text-zinc-900 dark:text-white">
                                      {formatNumber(operation.quantity, 4)}
                                      </span>
                                    {operationType === 'order' && operation.remainingQuantity && (
                                      <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                        Pendiente: {formatNumber(operation.remainingQuantity, 4)}
                                      </div>
                                    )}
                                  </div>

                                  {/* Valor de posición */}
                                  <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
                                    <div className="flex items-center gap-2 mb-1">
                                      <TrendUp className="w-4 h-4 text-zinc-500" />
                                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Valor Posición</span>
                                    </div>
                                    <span className="text-lg font-bold text-zinc-900 dark:text-white">
                                      {operation.positionValue ? `$${formatNumber(operation.positionValue)}` : '--'}
                                    </span>
                                  </div>

                                  {/* Precio de liquidación */}
                                  <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
                                    <div className="flex items-center gap-2 mb-1">
                                      <AlertTriangle className="w-4 h-4 text-zinc-500" />
                                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Liquidación</span>
                                    </div>
                                    <span className="text-lg font-bold text-zinc-900 dark:text-white">
                                      {operation.liquidationPrice !== undefined && operation.liquidationPrice !== null 
                                        ? `$${formatNumber(operation.liquidationPrice)}` 
                                        : '--'
                                      }
                                    </span>
                                  </div>
                                </div>

                                {/* Información adicional si existe */}
                                {(operation.markPrice || operation.fee || operation.filledQuantity) && (
                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                                    {/* Precio de marca */}
                                    {operation.markPrice && (
                                      <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-700 rounded-lg p-3">
                                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Precio de Marca:</span>
                                        <span className="font-semibold text-zinc-900 dark:text-white">
                                          ${formatNumber(operation.markPrice)}
                                        </span>
                                      </div>
                                    )}

                                    {/* Comisión */}
                                    {operation.fee && (
                                      <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-700 rounded-lg p-3">
                                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Comisión:</span>
                                        <span className="font-semibold text-zinc-900 dark:text-white">
                                          ${formatNumber(operation.fee)}
                                        </span>
                                      </div>
                                    )}

                                    {/* Cantidad ejecutada */}
                                    {operation.filledQuantity && (
                                      <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-700 rounded-lg p-3">
                                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Ejecutada:</span>
                                        <span className="font-semibold text-zinc-900 dark:text-white">
                                          {formatNumber(operation.filledQuantity, 4)}
                                        </span>
                    </div>
                  )}
                </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                      </div>
                );
              })}
                  </div>
                )}
        </div>
        )}
      </div>
  );
} 