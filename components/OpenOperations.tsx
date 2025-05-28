'use client';

import React from 'react';
import { Clock, TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react';

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
  // Campos adicionales para futuros
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
  
  // Función para obtener las clases de animación basadas en la dirección del precio
  const getPriceAnimationClasses = (operation: Operation) => {
    if (!hasRecentlyChanged(operation.id)) {
      return { direction: 'neutral', priceClass: '', arrowClass: '', glowClass: '' };
    }
    
    const direction = getPriceDirection(operation.id);
    
    if (direction === 'up') {
      return {
        direction: 'up',
        priceClass: 'animate-price-up',
        arrowClass: 'animate-arrow-up',
        glowClass: 'glow-green'
      };
    } else if (direction === 'down') {
      return {
        direction: 'down',
        priceClass: 'animate-price-down',
        arrowClass: 'animate-arrow-down',
        glowClass: 'glow-red'
      };
    }
    
    return {
      direction: 'neutral',
      priceClass: '',
      arrowClass: '',
      glowClass: ''
    };
  };
  return (
    <>
      <style jsx>{`
        @keyframes pulseGreen {
          0%, 100% { 
            background-color: rgba(34, 197, 94, 0.1);
            border-color: rgba(34, 197, 94, 0.3);
          }
          50% { 
            background-color: rgba(34, 197, 94, 0.3);
            border-color: rgba(34, 197, 94, 0.6);
          }
        }
        
        @keyframes pulseRed {
          0%, 100% { 
            background-color: rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.3);
          }
          50% { 
            background-color: rgba(239, 68, 68, 0.3);
            border-color: rgba(239, 68, 68, 0.6);
          }
        }
        
        @keyframes pulseBlue {
          0%, 100% { 
            background-color: rgba(59, 130, 246, 0.1);
            border-color: rgba(59, 130, 246, 0.3);
          }
          50% { 
            background-color: rgba(59, 130, 246, 0.3);
            border-color: rgba(59, 130, 246, 0.6);
          }
        }
        
        @keyframes priceUp {
          0% { 
            color: rgb(34, 197, 94);
            text-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
          }
          50% { 
            color: rgb(34, 197, 94);
            text-shadow: 0 0 12px rgba(34, 197, 94, 0.7);
          }
          100% { 
            color: rgb(34, 197, 94);
            text-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
          }
        }
        
        @keyframes priceDown {
          0% { 
            color: rgb(239, 68, 68);
            text-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
          }
          50% { 
            color: rgb(239, 68, 68);
            text-shadow: 0 0 12px rgba(239, 68, 68, 0.7);
          }
          100% { 
            color: rgb(239, 68, 68);
            text-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
          }
        }
        
        @keyframes arrowBounceUp {
          0%, 100% { 
            transform: translateY(0) rotate(0deg);
            opacity: 0.7;
          }
          50% { 
            transform: translateY(-5px) rotate(5deg);
            opacity: 1;
          }
        }
        
        @keyframes arrowBounceDown {
          0%, 100% { 
            transform: translateY(0) rotate(0deg);
            opacity: 0.7;
          }
          50% { 
            transform: translateY(5px) rotate(-5deg);
            opacity: 1;
          }
        }
        
        @keyframes glowGreen {
          0%, 100% { 
            box-shadow: 0 0 5px rgba(34, 197, 94, 0.3);
          }
          50% { 
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.6), 0 0 30px rgba(34, 197, 94, 0.4);
          }
        }
        
        @keyframes glowRed {
          0%, 100% { 
            box-shadow: 0 0 5px rgba(239, 68, 68, 0.3);
          }
          50% { 
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.6), 0 0 30px rgba(239, 68, 68, 0.4);
          }
        }
        
        .animate-pulse-green {
          animation: pulseGreen 2s ease-in-out;
        }
        
        .animate-pulse-red {
          animation: pulseRed 2s ease-in-out;
        }
        
        .animate-pulse-blue {
          animation: pulseBlue 2s ease-in-out;
        }
        
        .animate-price-up {
          animation: priceUp 1.5s ease-in-out;
        }
        
        .animate-price-down {
          animation: priceDown 1.5s ease-in-out;
        }
        
        .animate-arrow-up {
          animation: arrowBounceUp 1s ease-in-out infinite;
        }
        
        .animate-arrow-down {
          animation: arrowBounceDown 1s ease-in-out infinite;
        }
        
        .glow-green {
          animation: glowGreen 2s ease-in-out;
        }
        
        .glow-red {
          animation: glowRed 2s ease-in-out;
        }
      `}</style>
    <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-700 overflow-hidden">
      {/* Cabecera simplificada */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-violet-500 rounded-full"></div>
            <h3 className="text-base font-medium text-zinc-900 dark:text-white">
              Operaciones Abiertas
              <span className="text-xs font-medium text-white dark:text-zinc-900 bg-violet-500 dark:bg-violet-400 px-2 py-0.5 rounded-full ml-2">
                {openOperations.length}
              </span>
            </h3>
          </div>
          {!autoRefreshEnabled && !isLoadingOperations && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualización automática pausada</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Contenido de operaciones */}
      {isLoadingOperations ? (
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center">
            <svg className="animate-spin h-6 w-6 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-3 text-zinc-600 dark:text-zinc-400">Cargando operaciones...</span>
          </div>
        </div>
      ) : operationsError ? (
        <div className="p-6 text-center">
          <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span className="text-sm text-rose-700 dark:text-rose-300">{operationsError}</span>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 px-4 py-2 text-xs font-medium text-white bg-violet-500 hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700 rounded-md transition-colors"
              >
                Reintentar
              </button>
            )}
          </div>
        </div>
      ) : openOperations.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No hay operaciones abiertas
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {openOperations.map((operation) => (
            <div 
              key={operation.id}
              className={`bg-white dark:bg-zinc-800 rounded-lg p-4 transition-all duration-300 ${
                operation.side === 'buy' 
                  ? 'border-emerald-200 dark:border-emerald-800/30 hover:border-emerald-300 dark:hover:border-emerald-700/50' 
                  : 'border-rose-200 dark:border-rose-800/30 hover:border-rose-300 dark:hover:border-rose-700/50'
              } ${hasRecentlyChanged(operation.id) ? 'ring-2 ring-violet-500/20' : ''} ${
                hasRecentlyChanged(operation.id) 
                  ? getChangeEffectClass(operation.id, operation.profit).includes('green') 
                    ? 'border-2 border-emerald-400 dark:border-emerald-500'
                    : getChangeEffectClass(operation.id, operation.profit).includes('red')
                      ? 'border-2 border-rose-400 dark:border-rose-500'
                      : getChangeEffectClass(operation.id, operation.profit).includes('blue')
                        ? 'border-2 border-blue-400 dark:border-blue-500'
                        : 'border-2'
                  : 'border-2'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    operation.side === 'buy'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                  }`}>
                    {operation.side === 'buy' ? 'LONG' : 'SHORT'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {operation.symbol}
                      </span>
                      {operation.leverage && (
                        <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded text-xs font-medium">
                          {operation.leverage}x
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {subAccounts.find(acc => acc.id === operation.subAccountId)?.name || 'Subcuenta'}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded text-zinc-500 dark:text-zinc-400">
                        {operation.exchange}
                      </span>
                    </div>
                  </div>
                </div>
                
                {operation.profit !== undefined && (() => {
                  const priceDirection = getPriceDirection(operation);
                  const isProfit = (operation.profit || 0) >= 0;
                  return (
                    <div className={`flex flex-col items-end gap-1 px-3 py-2 rounded-lg ${
                      isProfit
                        ? 'bg-emerald-100/50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                        : 'bg-rose-100/50 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400'
                    }`}>
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-semibold ${
                          hasRecentlyChanged(operation.id) && priceDirection.direction === 'up' ? 'animate-price-up' :
                          hasRecentlyChanged(operation.id) && priceDirection.direction === 'down' ? 'animate-price-down' : ''
                        }`}>
                          {operation.profit && operation.profit >= 0 ? '+' : ''}${operation.profit ? operation.profit.toFixed(2) : '0.00'}
                        </span>
                        <span className={`${
                          hasRecentlyChanged(operation.id) && priceDirection.direction === 'up' ? 'animate-arrow-up' :
                          hasRecentlyChanged(operation.id) && priceDirection.direction === 'down' ? 'animate-arrow-down' : ''
                        }`}>
                          {isProfit 
                            ? <TrendingUp className="w-3.5 h-3.5" />
                            : <TrendingDown className="w-3.5 h-3.5" />
                          }
                        </span>
                      </div>
                      {operation.profitPercentage !== undefined && (
                        <span className={`text-xs font-medium ${
                          hasRecentlyChanged(operation.id) && priceDirection.direction === 'up' ? 'animate-price-up' :
                          hasRecentlyChanged(operation.id) && priceDirection.direction === 'down' ? 'animate-price-down' : ''
                        }`}>
                          {operation.profitPercentage >= 0 ? '+' : ''}{operation.profitPercentage.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700">
                <div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Precio entrada</span>
                  <span className={`text-sm font-medium text-zinc-900 dark:text-white transition-all duration-300 ${
                    hasRecentlyChanged(operation.id) ? 'animate-price-up' : ''
                  }`}>
                    ${operation.price !== undefined && operation.price !== null && operation.price > 0 
                      ? operation.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6}) 
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Precio liquidación</span>
                  <span className={`text-sm font-medium transition-all duration-300 ${
                    hasRecentlyChanged(operation.id) 
                      ? operation.liquidationPrice && operation.price && operation.liquidationPrice < operation.price
                        ? 'text-rose-600 dark:text-rose-400 animate-price-down'
                        : 'text-amber-600 dark:text-amber-400 animate-price-up'
                      : 'text-zinc-900 dark:text-white'
                  }`}>
                    ${operation.liquidationPrice !== undefined && operation.liquidationPrice !== null && operation.liquidationPrice > 0 
                      ? operation.liquidationPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Cantidad</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {operation.quantity && operation.quantity > 0 
                      ? operation.quantity.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 6}) 
                      : '0'} {operation.symbol}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Valor total</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    ${operation.positionValue && operation.positionValue > 0 
                      ? operation.positionValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
                                          : operation.price !== null && operation.quantity && operation.price > 0 && operation.quantity > 0 
                      ? (operation.price * operation.quantity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
                      : 'N/A'}
                  </span>
                </div>
              </div>
              
              {/* Precio actual del mercado */}
              {operation.markPrice && (() => {
                const priceDirection = getPriceDirection(operation);
                return (
                  <div className={`mt-4 p-3 rounded-lg border transition-all duration-300 ${
                    priceDirection.direction === 'up' 
                      ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800/30' 
                      : priceDirection.direction === 'down'
                        ? 'bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 border-rose-200 dark:border-rose-800/30'
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/30'
                  } ${priceDirection.glowClass}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                          priceDirection.direction === 'up' 
                            ? 'bg-emerald-500' 
                            : priceDirection.direction === 'down'
                              ? 'bg-rose-500'
                              : 'bg-blue-500'
                        }`}></div>
                        <span className={`text-xs font-medium ${
                          priceDirection.direction === 'up' 
                            ? 'text-emerald-700 dark:text-emerald-300' 
                            : priceDirection.direction === 'down'
                              ? 'text-rose-700 dark:text-rose-300'
                              : 'text-blue-700 dark:text-blue-300'
                        }`}>
                          Precio Actual
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold transition-all duration-300 ${
                          priceDirection.direction === 'up' 
                            ? 'text-emerald-900 dark:text-emerald-100' 
                            : priceDirection.direction === 'down'
                              ? 'text-rose-900 dark:text-rose-100'
                              : 'text-blue-900 dark:text-blue-100'
                        } ${priceDirection.priceClass}`}>
                          ${operation.markPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}
                        </div>
                        {operation.price !== null && operation.price > 0 && (
                          <div className={`text-xs font-medium flex items-center justify-end gap-1 ${
                            operation.markPrice > operation.price 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : operation.markPrice < operation.price
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-zinc-600 dark:text-zinc-400'
                          }`}>
                            <span className={`${priceDirection.arrowClass}`}>
                              {operation.markPrice > operation.price ? '↗' : operation.markPrice < operation.price ? '↘' : '→'}
                            </span>
                            <span>
                              {operation.markPrice > operation.price ? '+' : ''}
                              ${(operation.markPrice - operation.price).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-700">
                <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <Clock className="w-3 h-3" />
                  {operation.openTime ? new Date(operation.openTime).toLocaleString() : 'N/A'}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClosePosition?.(operation.id);
                  }}
                  className="px-3 py-1 text-xs font-medium text-white bg-violet-500 hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700 rounded-md transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
} 