"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, TrendingUp, TrendingDown, BarChart3, X, Activity, Radio, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useLongShortRatio } from '@/hooks/useLongShortRatio';

interface LongShortRatioWidgetProps {
  defaultSymbol?: string;
  onRemove?: () => void;
  className?: string;
}

const POPULAR_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT',
  'DOGEUSDT', 'LINKUSDT', 'UNIUSDT', 'AVAXUSDT', 'MATICUSDT'
];

const TIMEFRAMES = [
  { label: '5min', value: '5min' },
  { label: '15min', value: '15min' },
  { label: '30min', value: '30min' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' }
];

const COLORS = {
  long: '#10b981',
  short: '#ef4444',
  neutral: '#6b7280'
};

export default function LongShortRatioWidget({ 
  defaultSymbol = 'BTCUSDT', 
  onRemove,
  className = ''
}: LongShortRatioWidgetProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(defaultSymbol);
  const [selectedPeriod, setSelectedPeriod] = useState<'5min' | '15min' | '30min' | '1h' | '4h' | '1d'>('1h');
  const [view, setView] = useState<'chart' | 'analysis' | 'table'>('chart');
  const [countdown, setCountdown] = useState(30);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data, analysis, loading, error, lastUpdate, refresh } = useLongShortRatio({
    symbol: selectedSymbol,
    period: selectedPeriod,
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

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Preparar datos para el gráfico de líneas
  const chartData = data.slice(0, 24).reverse().map(item => ({
    time: formatTimestamp(item.timestamp),
    long: parseFloat(item.buyRatio) * 100,
    short: parseFloat(item.sellRatio) * 100,
    timestamp: item.timestamp
  }));

  // Datos para el gráfico de torta actual
  const pieData = analysis ? [
    { name: 'Longs', value: analysis.currentRatio.long * 100, color: COLORS.long },
    { name: 'Shorts', value: analysis.currentRatio.short * 100, color: COLORS.short }
  ] : [];

  const getTrendIcon = () => {
    if (!analysis) return <Activity className="w-4 h-4" />;
    
    switch (analysis.trend) {
      case 'bullish':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'bearish':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    if (!analysis) return 'text-gray-600 bg-gray-100';
    
    switch (analysis.trend) {
      case 'bullish':
        return 'text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-100 border-emerald-200';
      case 'bearish':
        return 'text-red-700 bg-gradient-to-r from-red-50 to-rose-100 border-red-200';
      default:
        return 'text-gray-600 bg-gradient-to-r from-gray-50 to-slate-100 border-gray-200';
    }
  };

  const getStrengthBadge = () => {
    if (!analysis) return null;
    
    const colors = {
      weak: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300',
      moderate: 'bg-gradient-to-r from-yellow-100 to-amber-200 text-yellow-800 border-yellow-300',
      strong: 'bg-gradient-to-r from-orange-100 to-red-200 text-orange-800 border-orange-300'
    };
    
    return (
      <Badge className={`${colors[analysis.strength]} border`}>
        {analysis.strength === 'weak' ? 'Débil' : 
         analysis.strength === 'moderate' ? 'Moderado' : 'Fuerte'}
      </Badge>
    );
  };

  return (
    <Card className={`w-full ${className} overflow-hidden`}>
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold">Long/Short Ratio</span>
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
            
            <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-20 h-7 text-xs bg-white/80 backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAMES.map(tf => (
                  <SelectItem key={tf.value} value={tf.value}>
                    {tf.label}
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
              {/* Ratio actual con gradientes */}
              {analysis && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200">
                    <div className="text-xs text-emerald-600 mb-2 font-medium">Posiciones Largas</div>
                    <div className="text-3xl font-bold text-emerald-700 mb-1">
                      {formatPercent(analysis.currentRatio.long)}
                    </div>
                    <div className="w-full bg-emerald-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${analysis.currentRatio.long * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl border border-red-200">
                    <div className="text-xs text-red-600 mb-2 font-medium">Posiciones Cortas</div>
                    <div className="text-3xl font-bold text-red-700 mb-1">
                      {formatPercent(analysis.currentRatio.short)}
                    </div>
                    <div className="w-full bg-red-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-rose-600 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${analysis.currentRatio.short * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gráfico de torta mejorado */}
              {pieData.length > 0 && (
                <div className="h-48 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl p-4">
                  <h4 className="text-sm font-medium mb-2 text-center">Distribución Actual</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Gráfico de líneas histórico mejorado */}
              {chartData.length > 0 && (
                <div className="h-64 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl p-4">
                  <h4 className="text-sm font-medium mb-2">Evolución Histórica</h4>
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
                        fontSize={10}
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        stroke="#6b7280"
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          `${value.toFixed(1)}%`, 
                          name === 'long' ? 'Longs' : 'Shorts'
                        ]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="long" 
                        stroke={COLORS.long} 
                        strokeWidth={3}
                        dot={false}
                        strokeLinecap="round"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="short" 
                        stroke={COLORS.short} 
                        strokeWidth={3}
                        dot={false}
                        strokeLinecap="round"
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
                  <div className={`p-4 rounded-xl border-2 ${getTrendColor()}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getTrendIcon()}
                        <span className="font-bold">
                          {analysis.trend === 'bullish' ? 'Tendencia Alcista' :
                           analysis.trend === 'bearish' ? 'Tendencia Bajista' :
                           'Mercado Neutral'}
                        </span>
                      </div>
                      {getStrengthBadge()}
                    </div>
                    <p className="text-sm leading-relaxed">{analysis.recommendation}</p>
                  </div>

                  {/* Métricas detalladas mejoradas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border">
                      <h5 className="text-sm font-medium mb-3 flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Distribución Actual
                      </h5>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-600 flex items-center">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                            Longs:
                          </span>
                          <span className="font-mono font-bold">{formatPercent(analysis.currentRatio.long)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-red-600 flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            Shorts:
                          </span>
                          <span className="font-mono font-bold">{formatPercent(analysis.currentRatio.short)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border">
                      <h5 className="text-sm font-medium mb-3 flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        Interpretación
                      </h5>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tendencia:</span>
                          <span className="capitalize font-medium">{analysis.trend}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fuerza:</span>
                          <span className="capitalize font-medium">
                            {analysis.strength === 'weak' ? 'Débil' : 
                             analysis.strength === 'moderate' ? 'Moderada' : 'Fuerte'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información educativa mejorada */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200">
                    <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      💡 ¿Qué significa el Long/Short Ratio?
                    </h5>
                    <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                      El ratio Long/Short muestra la proporción de traders con posiciones largas vs cortas. 
                      Un ratio alto de longs puede indicar sobrecompra (posible corrección), mientras que 
                      un ratio alto de shorts puede indicar sobreventa (posible rebote).
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {loading ? (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                  <span>Longs</span>
                  <span>Shorts</span>
                </div>

                <div className="max-h-80 overflow-y-auto bg-white dark:bg-gray-900 rounded-b-lg">
                  {data.slice(0, 20).map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-3 px-3 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                      <span className="text-gray-600 dark:text-gray-400 font-mono">
                        {formatTimestamp(item.timestamp)}
                      </span>
                      <span className="font-mono text-emerald-600 font-medium">
                        {formatPercent(parseFloat(item.buyRatio))}
                      </span>
                      <span className="font-mono text-red-600 font-medium">
                        {formatPercent(parseFloat(item.sellRatio))}
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