'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users, Settings, X, PlusCircle, Wallet, TrendingUp, ChevronRight, EyeOff, Eye } from 'lucide-react';

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

interface SubAccountSelectorProps {
  subAccounts: SubAccount[];
  selectedSubAccount: string | null;
  onSubAccountChange: (subAccountId: string | null) => void;
  isLoading?: boolean;
}

interface BalanceAsset {
  coin: string;
  walletBalance: number;
  usdValue: number;
  equity: number;
  unrealisedPnl: number;
  availableToWithdraw: number;
}

interface AccountInfo {
  totalMarginBalance: number;
  totalAvailableBalance: number;
  totalWalletBalance: number;
  totalEquity: number;
  totalPerpUPL: number;
  totalInitialMargin: number;
}

interface RealBalance {
  balanceUsd: number;
  assets: BalanceAsset[];
  accountInfo?: AccountInfo;
}

interface CachedBalance extends RealBalance {
  timestamp: number;
  subaccountId: string;
}

// Cache con TTL de 5 minutos para vista normal
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Constante para el intervalo de actualización (10 segundos)
const AUTO_UPDATE_INTERVAL = 10 * 1000;

// Flag para logs de desarrollo (puedes cambiar a false en producción)
const DEBUG_AUTO_UPDATE = process.env.NODE_ENV === 'development';

export default function SubAccountSelector({ 
  subAccounts, 
  selectedSubAccount, 
  onSubAccountChange,
  isLoading = false 
}: SubAccountSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccountForPreview, setSelectedAccountForPreview] = useState<string | null>(selectedSubAccount);
  const [realBalances, setRealBalances] = useState<Record<string, RealBalance>>({});
  const [isLoadingBalance, setIsLoadingBalance] = useState<Record<string, boolean>>({});
  const [hideSmallAssets, setHideSmallAssets] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Referencias para cache y actualización automática
  const balanceCache = useRef<Map<string, CachedBalance>>(new Map());
  const autoUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  // Función para verificar si el cache es válido
  const isCacheValid = (subaccountId: string): boolean => {
    const cached = balanceCache.current.get(subaccountId);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < CACHE_TTL;
  };

  // Función para obtener balance desde cache o API
  const getBalanceFromCacheOrAPI = async (subaccountId: string, forceRefresh = false): Promise<RealBalance | null> => {
    // Si tenemos cache válido y no es refresh forzado, usar cache
    if (!forceRefresh && isCacheValid(subaccountId)) {
      const cached = balanceCache.current.get(subaccountId);
      if (cached) {
        return {
          balanceUsd: cached.balanceUsd,
          assets: cached.assets,
          accountInfo: cached.accountInfo
        };
      }
    }

    // Obtener datos frescos de la API
    try {
      const response = await fetch('/api/subaccount/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subaccountId })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("Error fetching balance:", result?.error || `HTTP status ${response.status}`);
        return null;
      }

      const balanceData = result.data || { balanceUsd: 0, assets: [] };
      
      // Guardar en cache
      balanceCache.current.set(subaccountId, {
        ...balanceData,
        timestamp: Date.now(),
        subaccountId
      });

      return balanceData;
    } catch (error: any) {
      console.error("Error fetching real balance:", error);
      return null;
    }
  };

  // Función para abrir el modal
  const openModal = async () => {
    setSelectedAccountForPreview(selectedSubAccount);
    setIsModalOpen(true);
    
    // Cargar balances con refresh forzado al abrir el modal - TODOS EN PARALELO
    const balancePromises = subAccounts
      .filter(account => !isLoadingBalance[account.id])
      .map(account => fetchRealBalance(account.id, true)); // true = force refresh
    
    // Ejecutar todas las llamadas en paralelo
    try {
      await Promise.all(balancePromises);
      console.log(`✅ Cargados ${balancePromises.length} balances en paralelo`);
    } catch (error) {
      console.error('Error cargando algunos balances:', error);
      // Continuar aunque alguna falle
    }
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAccountForPreview(selectedSubAccount);
  };

  // Función para seleccionar una subcuenta en el modal
  const handleSelectSubAccount = (subAccountId: string | null) => {
    onSubAccountChange(subAccountId);
    setIsModalOpen(false);
  };

  // Función para preview de subcuenta en el modal
  const handlePreviewSubAccount = (subAccountId: string | null) => {
    setSelectedAccountForPreview(subAccountId);
  };

  // Función para obtener el balance real de una subcuenta
  const fetchRealBalance = async (subaccountId: string, forceRefresh = false) => {
    try {
      setIsLoadingBalance(prev => ({ ...prev, [subaccountId]: true }));
      
      console.log(`Fetching balance for subaccount: ${subaccountId}, forceRefresh: ${forceRefresh}`);
      
      const result = await getBalanceFromCacheOrAPI(subaccountId, forceRefresh);

      if (result) {
        setRealBalances(prev => ({
          ...prev,
          [subaccountId]: result
        }));
      }

    } catch (error: any) {
      console.error("Error fetching real balance:", error);
    } finally {
      setIsLoadingBalance(prev => ({ ...prev, [subaccountId]: false }));
    }
  };

  // Función para actualización silenciosa (sin mostrar loading state)
  const fetchRealBalanceSilent = async (subaccountId: string) => {
    try {
      if (DEBUG_AUTO_UPDATE) {
        console.log(`🔄 Actualización silenciosa para subcuenta: ${subaccountId}`);
      }
      
      const result = await getBalanceFromCacheOrAPI(subaccountId, true); // Siempre force refresh

      if (result) {
        setRealBalances(prev => ({
          ...prev,
          [subaccountId]: result
        }));
        if (DEBUG_AUTO_UPDATE) {
          console.log(`✅ Balance actualizado silenciosamente para: ${subaccountId}`);
        }
      }

    } catch (error: any) {
      console.error("Error en actualización silenciosa:", error);
      // En caso de error, no hacer nada - mantener los datos actuales
    }
  };

  // Función para iniciar actualización automática
  const startAutoUpdate = (subaccountId: string) => {
    // Limpiar intervalo existente
    if (autoUpdateInterval.current) {
      clearInterval(autoUpdateInterval.current);
    }

    // Crear nuevo intervalo
    autoUpdateInterval.current = setInterval(() => {
      // Solo actualizar si la pestaña está activa y el modal no está abierto
      if (!document.hidden && !isModalOpen) {
        fetchRealBalanceSilent(subaccountId);
      }
    }, AUTO_UPDATE_INTERVAL);

    if (DEBUG_AUTO_UPDATE) {
      console.log(`🚀 Iniciada actualización automática cada ${AUTO_UPDATE_INTERVAL/1000}s para subcuenta: ${subaccountId}`);
    }
  };

  // Función para detener actualización automática
  const stopAutoUpdate = () => {
    if (autoUpdateInterval.current) {
      clearInterval(autoUpdateInterval.current);
      autoUpdateInterval.current = null;
      if (DEBUG_AUTO_UPDATE) {
        console.log('⏹️ Detenida actualización automática');
      }
    }
  };

  // Cargar balance de subcuenta activa al montar el componente (usando cache)
  useEffect(() => {
    if (selectedSubAccount && !realBalances[selectedSubAccount]) {
      fetchRealBalance(selectedSubAccount, false); // false = usar cache si está disponible
    }
  }, [selectedSubAccount]);

  // Manejar actualización automática basada en subcuenta seleccionada
  useEffect(() => {
    if (selectedSubAccount) {
      // Iniciar actualización automática para la nueva subcuenta
      startAutoUpdate(selectedSubAccount);
    } else {
      // Detener actualización automática si no hay subcuenta seleccionada
      stopAutoUpdate();
    }

    // Cleanup al cambiar subcuenta o desmontar
    return () => {
      stopAutoUpdate();
    };
  }, [selectedSubAccount]);

  // Pausar/reanudar actualización cuando el modal se abra/cierre
  useEffect(() => {
    if (isModalOpen) {
      // Pausar actualización automática cuando el modal está abierto
      // (no detener completamente, solo pausar)
      if (DEBUG_AUTO_UPDATE) {
        console.log('⏸️ Pausando actualización automática (modal abierto)');
      }
    } else if (selectedSubAccount) {
      // Reanudar/reiniciar cuando se cierre el modal
      if (DEBUG_AUTO_UPDATE) {
        console.log('▶️ Reanudando actualización automática (modal cerrado)');
      }
      startAutoUpdate(selectedSubAccount);
    }
  }, [isModalOpen, selectedSubAccount]);

  // Manejar visibilidad de la pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (DEBUG_AUTO_UPDATE) {
          console.log('👁️‍🗨️ Pestaña oculta - pausando actualizaciones');
        }
      } else if (selectedSubAccount && !isModalOpen) {
        if (DEBUG_AUTO_UPDATE) {
          console.log('👁️ Pestaña visible - reanudando actualizaciones');
        }
        // Hacer una actualización inmediata al volver a la pestaña
        fetchRealBalanceSilent(selectedSubAccount);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedSubAccount, isModalOpen]);

  // Obtener la subcuenta seleccionada
  const selectedAccount = subAccounts.find(acc => acc.id === selectedSubAccount);
  const previewAccount = subAccounts.find(acc => acc.id === selectedAccountForPreview);

  // Función para obtener información específica de balance de una subcuenta
  const getBalanceInfo = (subaccountId: string) => {
    const realBalance = realBalances[subaccountId];
    if (!realBalance || !realBalance.accountInfo) {
      return {
        marginBalance: 0,
        availableBalance: 0,
        totalBalance: 0,
        equity: 0,
        unrealisedPnl: 0
      };
    }
    
    return {
      marginBalance: realBalance.accountInfo.totalMarginBalance,
      availableBalance: realBalance.accountInfo.totalAvailableBalance,
      totalBalance: realBalance.accountInfo.totalEquity,
      equity: realBalance.accountInfo.totalEquity,
      unrealisedPnl: realBalance.accountInfo.totalPerpUPL
    };
  };

  // Cerrar modal con Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      // Limpiar intervalo al desmontar el componente
      stopAutoUpdate();
    };
  }, [isModalOpen]);

  // Formatear número con decimales apropiados
  const formatBalance = (value: number): string => {
    if (value >= 1) {
      return value.toFixed(2);
    } else if (value >= 0.01) {
      return value.toFixed(4);
    } else {
      return value.toFixed(8);
    }
  };

  // Formatear balance con máximo 2 decimales (para margin y available balance)
  const formatBalanceSimple = (value: number): string => {
    return value.toFixed(2);
  };

  // Función para limpiar el nombre quitando referencias al exchange
  const cleanAccountName = (name: string): string => {
    // Remover variaciones comunes de exchange del nombre
    return name
      .replace(/\s*-\s*bybit/gi, '')
      .replace(/\s*-\s*binance/gi, '')
      .replace(/\s*bybit\s*/gi, '')
      .replace(/\s*binance\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Obtener todas las monedas con balance real
  const getAccountAssets = (subaccountId: string) => {
    const realBalance = realBalances[subaccountId];
    if (!realBalance || !realBalance.assets) {
      return [];
    }
    let assets = realBalance.assets.filter(asset => asset.walletBalance > 0);
    
    // Filtrar assets menores a 1$ si la opción está activada
    if (hideSmallAssets) {
      assets = assets.filter(asset => asset.usdValue >= 1);
    }
    
    return assets.sort((a, b) => b.usdValue - a.usdValue); // Ordenar por valor USD descendente
  };

  // Calcular valor total aproximado en USDT (para el modal solamente)
  const calculateTotalValue = (subaccountId: string) => {
    const realBalance = realBalances[subaccountId];
    if (realBalance) {
      return realBalance.balanceUsd;
    }
    
    // Fallback a los valores ficticios si no tenemos balance real
    const account = subAccounts.find(acc => acc.id === subaccountId);
    if (!account) return 0;
    
    const prices = {
      btc: 43000,
      eth: 2600,
      usdt: 1
    };
    
    let total = 0;
    Object.entries(account.balance).forEach(([asset, value]) => {
      if (value && asset.toLowerCase() in prices) {
        const price = prices[asset.toLowerCase() as keyof typeof prices];
        total += value * price;
      }
    });
    
    return total;
  };

  return (
    <>
    <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        {/* Encabezado - sin botón de configuración */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-white flex items-center">
          <Users className="w-4 h-4 text-violet-500 mr-1.5" />
          Subcuenta Activa
        </h3>
      </div>

      {/* Contenido */}
      <div className="p-4">
          {(isLoading && subAccounts.length === 0) ? (
            /* Estado de carga inicial - solo cuando no hay subcuentas disponibles */
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  Cargando subcuentas...
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                  Obteniendo información de tus subcuentas configuradas.
                </p>
              </div>
            </div>
          ) : subAccounts.length === 0 ? (
            /* Sin subcuentas disponibles */
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full p-3">
              <Users className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                No hay subcuentas disponibles
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                Necesitas añadir subcuentas para poder operar.
              </p>
            </div>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 transition-colors">
              <PlusCircle className="w-4 h-4" />
              Añadir subcuenta
            </Link>
          </div>
          ) : selectedAccount ? (
            /* Vista de subcuenta seleccionada - OPCIÓN 1: Compacta pero más grande */
            <div 
              className="rounded-lg border border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-50/50 to-blue-50/50 dark:from-violet-900/20 dark:to-blue-900/20 cursor-pointer hover:bg-violet-100/50 dark:hover:bg-violet-900/30 transition-colors p-4"
              onClick={openModal}
            >
              {/* Header con nombre y badges */}
              <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {cleanAccountName(selectedAccount.name)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      selectedAccount.is_demo 
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    }`}>
                      {selectedAccount.is_demo ? 'Demo' : 'Real'}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
                      Bybit
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Wallet className="w-4 h-4" />
                  <ChevronRight className="w-4 h-4" />
              </div>
            </div>

              {/* Balance principal */}
              <div className="mb-3">
                {isLoadingBalance[selectedAccount.id] ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-32 mb-1"></div>
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20"></div>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">
                      ${formatBalance(getBalanceInfo(selectedAccount.id).equity)}
                      </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">Total Equity</div>
                    {getBalanceInfo(selectedAccount.id).unrealisedPnl !== 0 && (
                      <div className={`text-sm font-medium ${
                        getBalanceInfo(selectedAccount.id).unrealisedPnl >= 0 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {getBalanceInfo(selectedAccount.id).unrealisedPnl >= 0 ? '+' : ''}
                        ${formatBalance(getBalanceInfo(selectedAccount.id).unrealisedPnl)} PnL
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Balances secundarios en línea */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">Margin Balance</div>
                  <div className="text-base font-semibold text-zinc-900 dark:text-white font-mono">
                    {isLoadingBalance[selectedAccount.id] ? '...' : `$${formatBalanceSimple(getBalanceInfo(selectedAccount.id).marginBalance)}`}
          </div>
                </div>
                <div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Available Balance</div>
                  <div className="text-base font-semibold text-zinc-900 dark:text-white font-mono">
                    {isLoadingBalance[selectedAccount.id] ? '...' : `$${formatBalanceSimple(getBalanceInfo(selectedAccount.id).availableBalance)}`}
                  </div>
                  </div>
                </div>
              </div>
            ) : (
            /* Vista sin subcuenta seleccionada - hay subcuentas disponibles */
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full p-3">
                  <Users className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    No hay subcuenta seleccionada
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                  Tienes {subAccounts.length} subcuenta{subAccounts.length !== 1 ? 's' : ''} disponible{subAccounts.length !== 1 ? 's' : ''}. Selecciona una para empezar a operar.
                  </p>
                </div>
                <button
                onClick={openModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Seleccionar subcuenta
                </button>
              </div>
            )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          {/* Contenedor del modal */}
          <div 
            className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="bg-zinc-900 border-b border-zinc-800">
              <div className="flex items-center h-16">
                {/* Sección izquierda - Icono y título */}
                <div className="flex items-center gap-4 px-6 h-16 border-r border-zinc-800">
                  <div className="relative">
                    <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/25">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-xs font-bold text-white">{subAccounts.length}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white tracking-tight">Subcuentas</span>
                      <span className="text-xs text-zinc-400 font-medium">Gestión v2</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-400 font-medium">
                        {subAccounts.length === 0 ? 'Sin configurar' : `${subAccounts.length} disponible${subAccounts.length !== 1 ? 's' : ''}`}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                      <span className="text-sm font-medium text-zinc-400">Trading</span>
                    </div>
                  </div>
                </div>

                {/* Información de subcuentas */}
                <div className="flex items-center gap-8 px-6">
                  {/* Total de subcuentas */}
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-400 font-medium">Total</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">{subAccounts.length}</span>
                      <span className="text-sm font-medium text-zinc-400">subcuentas</span>
                    </div>
                  </div>

                  {/* Cuentas reales */}
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-400 font-medium">Reales</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-emerald-400">{subAccounts.filter(acc => !acc.is_demo).length}</span>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    </div>
                  </div>

                  {/* Cuentas demo */}
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-400 font-medium">Demo</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-amber-400">{subAccounts.filter(acc => acc.is_demo).length}</span>
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    </div>
                  </div>

                  {/* Subcuenta actual */}
                  {selectedSubAccount && (
                    <div className="flex flex-col">
                      <span className="text-xs text-zinc-400 font-medium">Actual</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-violet-400 max-w-32 truncate">
                          {cleanAccountName(subAccounts.find(acc => acc.id === selectedSubAccount)?.name || 'Sin selección')}
                        </span>
                        <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controles del header */}
                <div className="flex items-center gap-3 px-6 ml-auto">
                  {/* Botón de cerrar */}
                  <button
                    onClick={closeModal}
                    className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-all duration-200 group"
                    title="Cerrar (ESC)"
                  >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                  </button>
                </div>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="flex flex-1 min-h-0">
              {/* Lista de Subcuentas */}
              <div className="w-full md:w-1/2 border-r border-zinc-200 dark:border-zinc-700 overflow-y-auto">
                <div className="p-3 md:p-4">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
                    Subcuentas Disponibles ({subAccounts.length})
                  </div>
                  
                  <div className="space-y-2 md:space-y-3">
                    {/* Opción para deseleccionar */}
                    <div
                      onClick={() => handlePreviewSubAccount(null)}
                      className={`p-3 md:p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                        selectedAccountForPreview === null
                          ? 'border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20'
                          : 'border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedAccountForPreview === null
                            ? 'border-violet-500 bg-violet-500'
                            : 'border-zinc-300 dark:border-zinc-600'
                        }`}>
                          {selectedAccountForPreview === null && (
                            <div className="w-full h-full rounded-full bg-white scale-50" />
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 italic">
                            Sin subcuenta seleccionada
                          </span>
                          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                            No operar con ninguna subcuenta
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Lista de subcuentas */}
                    {subAccounts.map((account) => (
                      <div
                        key={account.id}
                        onClick={() => handlePreviewSubAccount(account.id)}
                        className={`p-3 md:p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                          selectedAccountForPreview === account.id
                            ? 'border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20'
                            : 'border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 mt-1 ${
                            selectedAccountForPreview === account.id
                              ? 'border-violet-500 bg-violet-500'
                              : 'border-zinc-300 dark:border-zinc-600'
                          }`}>
                            {selectedAccountForPreview === account.id && (
                              <div className="w-full h-full rounded-full bg-white scale-50" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 md:mb-2">
                              <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                                {cleanAccountName(account.name)}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                                account.is_demo 
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              }`}>
                                {account.is_demo ? 'Demo' : 'Real'}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                ID: {account.id.substring(0, 8)}...
                              </p>
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                {isLoadingBalance[account.id] ? (
                                  "Cargando balance..."
                                ) : (
                                  `Total: $${formatBalance(calculateTotalValue(account.id))} USDT`
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Panel de Detalles */}
              <div className="hidden md:block w-1/2 overflow-y-auto">
                <div className="p-3 md:p-4">
                  {previewAccount ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                          Balance y Assets
                        </div>
                        
                        {/* Toggle para ocultar assets pequeños */}
                        <button
                          onClick={() => setHideSmallAssets(!hideSmallAssets)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            hideSmallAssets 
                              ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' 
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                          }`}
                          title={hideSmallAssets ? 'Mostrar todos los assets' : 'Ocultar assets < $1'}
                        >
                          {hideSmallAssets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          {hideSmallAssets ? 'Filtrado' : 'Todo'}
                        </button>
                      </div>
                      
                      {/* Información mejorada de la cuenta */}
                      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 md:p-4 mb-3 md:mb-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                            <Wallet className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                              {cleanAccountName(previewAccount.name)}
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {previewAccount.is_demo ? 'Cuenta Demo' : 'Cuenta Real'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Balance principal */}
                        <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 rounded-lg p-4 mb-4 border border-violet-100 dark:border-violet-800/50">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-violet-700 dark:text-violet-300">Total Equity</h4>
                            {getBalanceInfo(previewAccount.id).unrealisedPnl !== 0 && (
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                getBalanceInfo(previewAccount.id).unrealisedPnl >= 0 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                              }`}>
                                {getBalanceInfo(previewAccount.id).unrealisedPnl >= 0 ? '+' : ''}
                                ${formatBalance(getBalanceInfo(previewAccount.id).unrealisedPnl)} PnL
                              </span>
                            )}
                          </div>
                          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                            {isLoadingBalance[previewAccount.id] ? (
                              "Cargando..."
                            ) : (
                              `$${formatBalance(getBalanceInfo(previewAccount.id).equity)}`
                            )}
                          </p>
                        </div>

                        {/* Grid de información detallada */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-emerald-100 dark:border-emerald-900/30">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Margin Balance</p>
                            </div>
                            <p className="text-base font-semibold text-emerald-700 dark:text-emerald-300 truncate">
                              {isLoadingBalance[previewAccount.id] ? (
                                "..."
                              ) : (
                                `$${formatBalance(getBalanceInfo(previewAccount.id).marginBalance)}`
                              )}
                            </p>
                          </div>
                          <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-blue-100 dark:border-blue-900/30">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Available Balance</p>
                            </div>
                            <p className="text-base font-semibold text-blue-700 dark:text-blue-300 truncate">
                              {isLoadingBalance[previewAccount.id] ? (
                                "..."
                              ) : (
                                `$${formatBalance(getBalanceInfo(previewAccount.id).availableBalance)}`
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Información adicional expandible */}
                        {!isLoadingBalance[previewAccount.id] && realBalances[previewAccount.id]?.accountInfo && (
                          <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                            <details className="group">
                              <summary className="flex items-center justify-between cursor-pointer text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200">
                                <span>Información Detallada</span>
                                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </summary>
                              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                                <div className="flex justify-between">
                                  <span>Wallet Balance:</span>
                                  <span className="font-mono">${formatBalance(realBalances[previewAccount.id].accountInfo!.totalWalletBalance)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Initial Margin:</span>
                                  <span className="font-mono">${formatBalance(realBalances[previewAccount.id].accountInfo!.totalInitialMargin)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total Assets:</span>
                                  <span className="font-mono">{getAccountAssets(previewAccount.id).length} activos</span>
                                </div>
                              </div>
                            </details>
                          </div>
                        )}
                      </div>

                      {/* Lista de Assets */}
                      <div className="space-y-2 md:space-y-3">
                        {isLoadingBalance[previewAccount.id] ? (
                          <div className="text-center py-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto mb-2"></div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              Obteniendo balance real...
                            </p>
                          </div>
                        ) : getAccountAssets(previewAccount.id).length > 0 ? (
                          getAccountAssets(previewAccount.id).map((asset) => {
                            const iconMap: {[key: string]: string} = {
                              'BTC': 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
                              'USDT': 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
                              'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
                              'USDC': 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
                              'SOL': 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
                              'XRP': 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
                              'SUI': 'https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg',
                              'ONDO': 'https://assets.coingecko.com/coins/images/26580/small/ONDO.png',
                              'VIRTUAL': 'https://assets.coingecko.com/coins/images/34057/standard/LOGOMARK.png?1708356054',
                              'ADA': 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
                              'LINK': 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
                              'HBAR': 'https://assets.coingecko.com/coins/images/3688/small/hbar.png',
                              'TRX': 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
                              'RNDR': 'https://assets.coingecko.com/coins/images/11636/small/rndr.png',
                              'AVAX': 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
                              'DOT': 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
                              'MATIC': 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
                              'DOGE': 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
                              'SHIB': 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
                              'LTC': 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
                              'BCH': 'https://assets.coingecko.com/coins/images/780/small/bitcoin-cash-circle.png',
                              'UNI': 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',
                              'ATOM': 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png',
                              'FTM': 'https://assets.coingecko.com/coins/images/4001/small/Fantom.png',
                              'NEAR': 'https://assets.coingecko.com/coins/images/10365/small/near_icon.png',
                              'ICP': 'https://assets.coingecko.com/coins/images/14495/small/Internet_Computer_logo.png',
                              'APT': 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png',
                              'OP': 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
                              'ARB': 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
                              'PEPE': 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
                              'WIF': 'https://assets.coingecko.com/coins/images/33767/small/dogwifhat.jpg',
                              'BONK': 'https://assets.coingecko.com/coins/images/28600/small/bonk.jpg'
                            };
                            
                            const fallbackIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Ctext x='12' y='16' text-anchor='middle' fill='%236b7280' font-size='8' font-family='Arial'%3E%3C/text%3E%3C/svg%3E";
                            
                            return (
                              <div key={asset.coin} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="relative w-[18px] h-[18px] flex-shrink-0">
                                    <Image 
                                      src={iconMap[asset.coin] || fallbackIcon}
                                      alt={asset.coin} 
                                      width={18} 
                                      height={18}
                                      className="object-contain rounded-full"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = fallbackIcon;
                                      }}
                                    />
                                    {/* Fallback text overlay si la imagen falla */}
                                    {!iconMap[asset.coin] && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 rounded-full">
                                        <span className="text-[8px] font-bold text-zinc-600 dark:text-zinc-300">
                                          {asset.coin.slice(0, 2)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className="text-sm font-medium text-zinc-900 dark:text-white block truncate">
                                      {asset.coin}
                                    </span>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                      ${formatBalance(asset.usdValue)} USD
                                      {asset.unrealisedPnl !== 0 && (
                                        <span className={`ml-2 ${
                                          asset.unrealisedPnl >= 0 ? 'text-emerald-500' : 'text-red-500'
                                        }`}>
                                          ({asset.unrealisedPnl >= 0 ? '+' : ''}${formatBalance(asset.unrealisedPnl)})
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <span className="text-sm font-mono font-medium text-zinc-900 dark:text-white block">
                                    {formatBalance(asset.walletBalance)}
                                  </span>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {asset.coin}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-6 md:py-8">
                            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full p-3 w-12 h-12 mx-auto mb-3">
                              <TrendingUp className="w-6 h-6 text-zinc-400" />
                            </div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              {hideSmallAssets ? 'No hay assets con valor mayor a $1' : 'No hay balance disponible en esta subcuenta'}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full p-4 mb-4">
                        <Users className="w-8 h-8 text-zinc-400" />
                      </div>
                      <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
                        Selecciona una subcuenta
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
                        Elige una subcuenta de la lista para ver su balance y assets disponibles
                      </p>
                    </div>
        )}
      </div>
    </div>
            </div>

            {/* Footer del Modal */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 md:p-6 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Link 
                  href="/dashboard" 
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Añadir Subcuenta</span>
                  <span className="sm:hidden">Añadir</span>
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSelectSubAccount(selectedAccountForPreview)}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 transition-colors"
                >
                  <span className="hidden sm:inline">Seleccionar Subcuenta</span>
                  <span className="sm:hidden">Seleccionar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 