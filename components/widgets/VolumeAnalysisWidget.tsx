"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, BarChart3, X, Activity, TrendingUp, TrendingDown, Radio, Clock, Volume2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { useVolumeAnalysis } from '@/hooks/useVolumeAnalysis';

interface VolumeAnalysisWidgetProps {
  defaultSymbol?: string;
  onRemove?: () => void;
  className?: string;
}

const POPULAR_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT',
  'DOGEUSDT', 'LINKUSDT', 'UNIUSDT', 'AVAXUSDT', 'MATICUSDT'
];

const INTERVALS = [
  { label: '1min', value: '1' },
  { label: '5min', value: '5' },
  { label: '15min', value: '15' },
  { label: '30min', value: '30' },
  { label: '1h', value: '60' },
  { label: '4h', value: '240' },
  { label: '1d', value: 'D' }
];

export default function VolumeAnalysisWidget({ 
  defaultSymbol = 'BTCUSDT', 
  onRemove,
  className = ''
}: VolumeAnalysisWidgetProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(defaultSymbol);
  const [selectedInterval, setSelectedInterval] = useState<'1' | '3' | '5' | '15' | '30' | '60' | '120' | '240' | '360' | '720' | 'D' | 'W' | 'M'>('60');
  const [view, setView] = useState<'chart' | 'analysis' | 'table'>('chart');
  const [countdown, setCountdown] = useState(30);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data, analysis, loading, error, lastUpdate, refresh } = useVolumeAnalysis({
    symbol: selectedSymbol,
    interval: selectedInterval,
    limit: 48,
    refreshInterval: 30000
  });

  // Countdown para próxima actualización
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastUpdate) {
        const secondsSinceUpdate = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
        const remaining = Math.max(0, 30 - secondsSinceUpdate);
        setCountdown(remaining);
        
        if (remaining === 0) {
          setIsUpdating(true);
          setTimeout(() => setIsUpdating(false), 2000);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(parseInt(timestamp)).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toFixed(1);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 100) return price.toFixed(3);
    if (price >= 10) return price.toFixed(4);
    if (price >= 1) return price.toFixed(5);
    return price.toFixed(6);
  };

  // Preparar datos para gráficos
  const chartData = data.slice(0, 24).reverse().map(item => ({
    time: formatTimestamp(item.timestamp),
    volume: parseFloat(item.volume),
    turnover: parseFloat(item.turnover),
    price: parseFloat(item.closePrice),
    high: parseFloat(item.highPrice),
    low: parseFloat(item.lowPrice),
    timestamp: item.timestamp
  }));

  const getVolumeColor = (volume: number, average: number) => {
    const ratio = volume / average;
    if (ratio > 2) return '#ef4444'; // Rojo para volumen extremo
    if (ratio > 1.5) return '#f97316'; // Naranja para volumen alto
    if (ratio > 1.2) return '#eab308'; // Amarillo para volumen moderado
    return '#3b82f6'; // Azul para volumen normal
  };

  const getTrendIcon = () => {
    if (!analysis) return <Activity className="w-4 h-4" />;
    
    switch (analysis.trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStrengthColor = () => {
    if (!analysis) return 'text-gray-600 bg-gray-100';
    
    switch (analysis.strength) {
      case 'extreme':
        return 'text-red-700 bg-gradient-to-r from-red-50 to-rose-100 border-red-200';
      case 'high':
        return 'text-orange-700 bg-gradient-to-r from-orange-50 to-amber-100 border-orange-200';
      case 'normal':
        return 'text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-100 border-emerald-200';
      case 'low':
        return 'text-gray-600 bg-gradient-to-r from-gray-50 to-slate-100 border-gray-200';
      default:
        return 'text-gray-600 bg-gradient-to-r from-gray-50 to-slate-100 border-gray-200';
    }
  };

  const getStrengthLabel = () => {
    if (!analysis) return 'Normal';
    
    switch (analysis.strength) {
      case 'extreme':
        return 'Extremo';
      case 'high':
        return 'Alto';
      case 'normal':
        return 'Normal';
      case 'low':
        return 'Bajo';
      default:
        return 'Normal';
    }
  };

  const getStrengthBadge = () => {
    if (!analysis) return null;
    
    return (
      <Badge className={`${getStrengthColor()} border`}>
        {getStrengthLabel()}
      </Badge>
    );
  };

  return (
    <Card className={`w-full ${className} overflow-hidden`}>
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold">Análisis de Volumen</span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-white/80 backdrop-blur-sm">
                  {selectedSymbol.replace('USDT', '')}
                </Badge>
                {analysis && (
                  <div className="flex items-center space-x-2">
                    {getTrendIcon()}
                    {getStrengthBadge()}
                  </div>
                )}
                {/* Badge EN VIVO */}
                <Badge className={`bg-gradient-to-r from-red-500 to-pink-600 text-white border-0 ${isUpdating ? 'animate-pulse' : ''}`}>
                  <Radio className="w-3 h-3 mr-1 animate-pulse" />
                  EN VIVO
                </Badge>
              </div>
            </div>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {/* Countdown */}
            <div className="flex items-center space-x-1 text-xs text-gray-500 bg-white/60 backdrop-blur-sm rounded-full px-2 py-1">
              <Clock className="w-3 h-3" />
              <span>{countdown}s</span>
            </div>
            
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
              className={`h-8 bg-white/80 backdrop-blur-sm hover:bg-white ${loading || isUpdating ? 'animate-pulse' : ''}`}
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="w-32 h-7 text-xs bg-white/80 backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_SYMBOLS.map(symbol => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol.replace('USDT', '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedInterval} onValueChange={(value: any) => setSelectedInterval(value)}>
              <SelectTrigger className="w-20 h-7 text-xs bg-white/80 backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVALS.map(interval => (
                  <SelectItem key={interval.value} value={interval.value}>
                    {interval.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {lastUpdate && (
            <span className="text-xs text-gray-500 bg-white/60 backdrop-blur-sm rounded-full px-2 py-1">
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {error ? (
          <div className="p-4 text-center text-red-500">
            <p>Error: {error}</p>
            <Button variant="outline" size="sm" onClick={refresh} className="mt-2">
              Reintentar
            </Button>
          </div>
        ) : (
          <Tabs value={view} onValueChange={(value: any) => setView(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mx-4 mb-2" style={{ width: 'calc(100% - 2rem)' }}>
              <TabsTrigger value="chart" className="text-xs">
                <BarChart3 className="w-3 h-3 mr-1" />
                Gráfico
              </TabsTrigger>
              <TabsTrigger value="analysis" className="text-xs">
                <Activity className="w-3 h-3 mr-1" />
                Análisis
              </TabsTrigger>
              <TabsTrigger value="table" className="text-xs">
                Datos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="mt-4 px-4 space-y-4">
              {/* Métricas actuales con gradientes */}
              {analysis && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200">
                    <div className="text-xs text-blue-600 mb-2 font-medium">Volumen Actual</div>
                    <div className="text-2xl font-bold text-blue-700 mb-1">
                      {formatVolume(analysis.currentVolume)}
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, (analysis.currentVolume / analysis.averageVolume) * 50)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200">
                    <div className="text-xs text-emerald-600 mb-2 font-medium">Promedio</div>
                    <div className="text-2xl font-bold text-emerald-700 mb-1">
                      {formatVolume(analysis.averageVolume)}
                    </div>
                    <div className="w-full bg-emerald-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full w-1/2"></div>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200">
                    <div className="text-xs text-purple-600 mb-2 font-medium">Ratio</div>
                    <div className="text-2xl font-bold text-purple-700 mb-1">
                      {analysis.volumeRatio.toFixed(2)}x
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, analysis.volumeRatio * 25)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gráfico de barras de volumen mejorado */}
              {chartData.length > 0 && (
                <div className="h-64 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl p-4">
                  <h4 className="text-sm font-medium mb-2">Volumen por Período</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="time" 
                        fontSize={10}
                        interval="preserveStartEnd"
                        stroke="#6b7280"
                      />
                      <YAxis 
                        fontSize={10}
                        tickFormatter={formatVolume}
                        stroke="#6b7280"
                      />
                      <Tooltip 
                        formatter={(value: any) => [formatVolume(value), 'Volumen']}
                        labelFormatter={(label) => `Tiempo: ${label}`}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="volume" 
                        fill="url(#volumeGradient)"
                        radius={[4, 4, 0, 0]}
                      />
                      <defs>
                        <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Gráfico combinado precio + volumen mejorado */}
              {chartData.length > 0 && (
                <div className="h-64 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl p-4">
                  <h4 className="text-sm font-medium mb-2">Precio vs Volumen</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="time" 
                        fontSize={10}
                        interval="preserveStartEnd"
                        stroke="#6b7280"
                      />
                      <YAxis 
                        yAxisId="price"
                        fontSize={10}
                        orientation="left"
                        tickFormatter={formatPrice}
                        stroke="#22c55e"
                      />
                      <YAxis 
                        yAxisId="volume"
                        fontSize={10}
                        orientation="right"
                        tickFormatter={formatVolume}
                        stroke="#3b82f6"
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          name === 'price' ? `$${formatPrice(value)}` : formatVolume(value),
                          name === 'price' ? 'Precio' : 'Volumen'
                        ]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line 
                        yAxisId="price"
                        type="monotone" 
                        dataKey="price" 
                        stroke="#22c55e" 
                        strokeWidth={3}
                        dot={false}
                        strokeLinecap="round"
                      />
                      <Bar 
                        yAxisId="volume"
                        dataKey="volume" 
                        fill="#3b82f6"
                        fillOpacity={0.3}
                        radius={[2, 2, 0, 0]}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </TabsContent>

            <TabsContent value="analysis" className="mt-4 px-4 space-y-4">
              {analysis ? (
                <>
                  {/* Análisis principal mejorado */}
                  <div className={`p-4 rounded-xl border-2 ${getStrengthColor()}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getTrendIcon()}
                        <span className="font-bold">
                          Volumen {getStrengthLabel()}
                        </span>
                      </div>
                      <Badge className={`${getStrengthColor()} border`}>
                        {analysis.volumeRatio.toFixed(2)}x promedio
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed">
                      {analysis.strength === 'extreme' && 'Volumen extremadamente alto - Posible evento significativo o alta volatilidad'}
                      {analysis.strength === 'high' && 'Volumen alto - Incremento en actividad de trading'}
                      {analysis.strength === 'normal' && 'Volumen normal - Actividad de trading estándar'}
                      {analysis.strength === 'low' && 'Volumen bajo - Poca actividad de trading, posible consolidación'}
                    </p>
                  </div>

                  {/* Métricas detalladas mejoradas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border">
                      <h5 className="text-sm font-medium mb-3 flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Métricas de Volumen
                      </h5>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            Actual:
                          </span>
                          <span className="font-mono font-bold">{formatVolume(analysis.currentVolume)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 flex items-center">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                            Promedio:
                          </span>
                          <span className="font-mono font-bold">{formatVolume(analysis.averageVolume)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 flex items-center">
                            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                            Ratio:
                          </span>
                          <span className="font-mono font-bold">{analysis.volumeRatio.toFixed(2)}x</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border">
                      <h5 className="text-sm font-medium mb-3 flex items-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                        Tendencia
                      </h5>
                      <div className="text-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Dirección:</span>
                          <div className="flex items-center space-x-1">
                            {getTrendIcon()}
                            <span className="capitalize font-medium">
                              {analysis.trend === 'increasing' ? 'Creciente' :
                               analysis.trend === 'decreasing' ? 'Decreciente' : 'Estable'}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fuerza:</span>
                          <span className="font-medium">{getStrengthLabel()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interpretación del volumen mejorada */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium flex items-center">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                      Interpretación del Volumen:
                    </h5>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg border border-emerald-200">
                        <h6 className="text-sm font-medium text-emerald-700 mb-1 flex items-center">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                          ✅ Volumen Alto
                        </h6>
                        <p className="text-xs text-emerald-600">
                          Confirma movimientos de precio, indica fuerte interés del mercado
                        </p>
                      </div>
                      
                      <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border border-yellow-200">
                        <h6 className="text-sm font-medium text-yellow-700 mb-1 flex items-center">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                          ⚠️ Volumen Bajo
                        </h6>
                        <p className="text-xs text-yellow-600">
                          Movimientos de precio menos confiables, posible falta de convicción
                        </p>
                      </div>
                      
                      <div className="p-3 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-lg border border-red-200">
                        <h6 className="text-sm font-medium text-red-700 mb-1 flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          🚨 Volumen Extremo
                        </h6>
                        <p className="text-xs text-red-600">
                          Posible evento significativo, alta volatilidad esperada
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Información educativa mejorada */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200">
                    <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      💡 ¿Por qué es importante el volumen?
                    </h5>
                    <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                      El volumen confirma la fuerza de los movimientos de precio. Un movimiento con alto volumen 
                      es más confiable que uno con bajo volumen. El volumen también puede indicar el inicio 
                      de nuevas tendencias o la continuación de las existentes.
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {loading ? (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      <span>Cargando análisis...</span>
                    </div>
                  ) : 'No hay datos disponibles'}
                </div>
              )}
            </TabsContent>

            <TabsContent value="table" className="mt-4">
              <div className="px-2">
                <div className="flex items-center justify-between py-3 px-3 text-xs font-medium text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-t-lg border-b">
                  <span>Tiempo</span>
                  <span>Volumen</span>
                  <span>Precio</span>
                  <span>Turnover</span>
                </div>

                <div className="max-h-80 overflow-y-auto bg-white dark:bg-gray-900 rounded-b-lg">
                  {data.slice(0, 20).map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-3 px-3 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                      <span className="text-gray-600 dark:text-gray-400 font-mono">
                        {formatTimestamp(item.timestamp)}
                      </span>
                      <span className="font-mono text-blue-600 font-medium">
                        {formatVolume(parseFloat(item.volume))}
                      </span>
                      <span className="font-mono text-emerald-600 font-medium">
                        ${formatPrice(parseFloat(item.closePrice))}
                      </span>
                      <span className="font-mono text-purple-600 font-medium">
                        {formatVolume(parseFloat(item.turnover))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
} 