'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, Activity, Database, Clock, TrendingUp } from 'lucide-react';

interface CollectionStatus {
  isPaused: boolean;
  isConnected: boolean;
  symbols: string[];
  accumulatorData: Record<string, {
    buyVolume: number;
    sellVolume: number;
    totalTrades: number;
  }>;
  message: string;
  timestamp: string;
}

export default function DataCollectionControlWidget() {
  const [status, setStatus] = useState<CollectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Usando variable de entorno del backend
  // La URL se obtiene de NEXT_PUBLIC_APP_URL configurada en .env
  // ⚠️ IMPORTANTE: Se agrega /api porque el backend usa ese prefijo global
  const API_BASE_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api`;

  // 🔧 Debug: Mostrar la URL que se está usando
  console.log('🔗 API URL:', API_BASE_URL);

  const fetchStatus = async () => {
    try {
      console.log('📡 Haciendo request a:', `${API_BASE_URL}/trades/control/status`);
      const response = await fetch(`${API_BASE_URL}/trades/control/status`);
      if (!response.ok) throw new Error('Error al obtener estado');
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Error conectando al servidor');
      console.error('Error:', err);
    }
  };

  const toggleCollection = async () => {
    if (!status) return;
    
    setIsLoading(true);
    try {
      const endpoint = status.isPaused ? 'resume' : 'pause';
      const response = await fetch(`${API_BASE_URL}/trades/control/${endpoint}`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Error en la operación');
      
      // Actualizar estado inmediatamente
      await fetchStatus();
      setError(null);
    } catch (err) {
      setError('Error ejecutando operación');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Actualizar estado cada 5 segundos
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20">
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Control de Datos</h3>
            <p className="text-sm text-slate-400">Recolección en tiempo real</p>
          </div>
        </div>
        
        {/* Estado de conexión */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            status?.isConnected ? 'bg-green-400' : 'bg-red-400'
          } animate-pulse`} />
          <span className="text-xs text-slate-400">
            {status?.isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Estado Actual */}
      {status && (
        <div className="mb-6">
          <div className={`p-4 rounded-xl border ${
            status.isPaused 
              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' 
              : 'bg-green-500/10 border-green-500/30 text-green-300'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {status.isPaused ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Activity className="w-4 h-4 animate-pulse" />
              )}
              <span className="font-medium">{status.message}</span>
            </div>
            <p className="text-xs opacity-70">
              Última actualización: {new Date(status.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}

      {/* Métricas en tiempo real */}
      {status && !status.isPaused && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {Object.entries(status.accumulatorData).map(([symbol, data]) => (
            <div key={symbol} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                <span className="font-medium text-white text-sm">{symbol}</span>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-400">
                  Buy: {data.buyVolume.toFixed(4)} BTC
                </div>
                <div className="text-xs text-slate-400">
                  Sell: {data.sellVolume.toFixed(4)} BTC
                </div>
                <div className="text-xs text-green-400">
                  Trades: {data.totalTrades}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón de Control */}
      <div className="flex flex-col gap-3">
        <button
          onClick={toggleCollection}
          disabled={isLoading || !status}
          className={`flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            status?.isPaused
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25'
              : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg shadow-yellow-500/25'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : status?.isPaused ? (
            <Play className="w-5 h-5" />
          ) : (
            <Pause className="w-5 h-5" />
          )}
          
          {isLoading ? 'Procesando...' : status?.isPaused ? 'Reanudar Recolección' : 'Pausar Recolección'}
        </button>

        {/* Información adicional */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <Clock className="w-3 h-3" />
          <span>Ahorra costos durante desarrollo</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
          <button 
            onClick={fetchStatus}
            className="text-red-400 text-xs underline mt-1 hover:text-red-300"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
} 