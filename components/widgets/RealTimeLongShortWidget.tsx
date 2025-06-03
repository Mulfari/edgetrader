"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, TrendingUp, TrendingDown, Activity, X, Radio, Wifi, WifiOff, BarChart3, Clock, Zap, Gauge, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts';
import { useRealTimeLongShort } from '@/hooks/useRealTimeLongShort';

interface RealTimeLongShortWidgetProps {
  defaultSymbol?: string;
  onRemove?: () => void;
  className?: string;
}

const POPULAR_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT',
  'DOGEUSDT', 'LINKUSDT', 'UNIUSDT', 'AVAXUSDT', 'MATICUSDT'
];

const WINDOW_SIZES = [
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '2m', value: 120 },
  { label: '5m', value: 300 }
];

export default function RealTimeLongShortWidget({ 
  defaultSymbol = 'BTCUSDT', 
  onRemove,
  className = ''
}: RealTimeLongShortWidgetProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(defaultSymbol);
  const [windowSize, setWindowSize] = useState(60);
  const [view, setView] = useState<'overview' | 'chart' | 'details'>('overview');

  const { 
    data, 
    history, 
    isConnected, 
    error, 
    lastUpdate, 
    reconnect 
  } = useRealTimeLongShort(selectedSymbol, windowSize);

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
  
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toFixed(2);
  };

  const formatVolumeUSD = (volumeUSD: number) => {
    if (volumeUSD >= 1000000) return `$${(volumeUSD / 1000000).toFixed(1)}M`;
    if (volumeUSD >= 1000) return `$${(volumeUSD / 1000).toFixed(1)}K`;
    return `$${volumeUSD.toFixed(0)}`;
  };

  const formatPrice = (price: number) => {
    if (price >= 100000) return `$${(price / 1000).toFixed(1)}K`;
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const chartData = history.slice(-30).map((item, index) => ({
    time: index,
    longRatio: item.buyRatio * 100,
    shortRatio: item.sellRatio * 100,
    volume: item.totalVolume,
    trades: item.trades
  }));

  const getDominance = () => {
    const diff = Math.abs(data.buyRatio - data.sellRatio);
    if (diff > 0.3) return 'extreme';
    if (diff > 0.15) return 'strong';
    if (diff > 0.05) return 'moderate';
    return 'balanced';
  };

  const getMarketSentiment = () => {
    if (data.buyRatio > 0.65) return { text: 'Muy Alcista', color: 'emerald', icon: TrendingUp };
    if (data.buyRatio > 0.55) return { text: 'Alcista', color: 'green', icon: TrendingUp };
    if (data.sellRatio > 0.65) return { text: 'Muy Bajista', color: 'red', icon: TrendingDown };
    if (data.sellRatio > 0.55) return { text: 'Bajista', color: 'orange', icon: TrendingDown };
    return { text: 'Neutral', color: 'gray', icon: Activity };
  };

  const sentiment = getMarketSentiment();
  const SentimentIcon = sentiment.icon;

  const getPulseAnimation = () => {
    if (!isConnected) return '';
    const dominance = getDominance();
    if (dominance === 'extreme') return 'animate-ping';
    if (dominance === 'strong') return 'animate-pulse';
    return '';
  };

  return (
    <Card className={`w-full ${className} overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900 border-2 shadow-xl`}>
      {/* Header mejorado */}
      <CardHeader className="pb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-indigo-400/20 animate-pulse"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 bg-white/20 backdrop-blur-sm rounded-xl ${getPulseAnimation()}`}>
              <Zap className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold flex items-center space-x-2">
                <span>Long/Short Ratio</span>
                <Badge className="bg-yellow-400 text-yellow-900 border-0 font-bold animate-pulse">
                  <Radio className="w-3 h-3 mr-1" />
                  LIVE
                </Badge>
              </CardTitle>
              <div className="flex items-center space-x-3 mt-1">
                <Badge variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                  {selectedSymbol.replace('USDT', '')}
                </Badge>
                {data.currentPrice > 0 && (
                  <Badge variant="outline" className="bg-yellow-400/20 backdrop-blur-sm text-yellow-100 border-yellow-300/30">
                    {formatPrice(data.currentPrice)}
                  </Badge>
                )}
                <div className="flex items-center space-x-1 text-sm">
                  <SentimentIcon className="w-4 h-4" />
                  <span>{sentiment.text}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {lastUpdate && (
              <div className="flex items-center space-x-1 text-xs bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                <Clock className="w-3 h-3" />
                <span>{lastUpdate.toLocaleTimeString()}</span>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={reconnect}
              disabled={isConnected}
              className="h-8 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
            
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-8 w-8 p-0 text-white/70 hover:text-red-300 hover:bg-red-500/20"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="text-center">
            <div className="text-gray-500">Volumen USD</div>
            <div className="font-bold">{formatVolumeUSD(data.totalVolumeUSD)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Trades</div>
            <div className="font-bold">{data.trades}</div>
          </div>
          {data.currentPrice > 0 && (
            <div className="text-center">
              <div className="text-gray-500">Precio</div>
              <div className="font-bold">{formatPrice(data.currentPrice)}</div>
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="relative z-10 flex items-center justify-between mt-4">
          <div className="flex items-center space-x-3">
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="w-32 h-8 text-xs bg-white/20 backdrop-blur-sm border-white/30 text-white">
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
            
            <Select value={windowSize.toString()} onValueChange={(value) => setWindowSize(parseInt(value))}>
              <SelectTrigger className="w-20 h-8 text-xs bg-white/20 backdrop-blur-sm border-white/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WINDOW_SIZES.map(ws => (
                  <SelectItem key={ws.value} value={ws.value.toString()}>
                    {ws.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado de conexión mejorado */}
          <div className="flex items-center space-x-2">
            {error ? (
              <Badge className="bg-red-500 text-white border-0 animate-pulse">
                <WifiOff className="w-3 h-3 mr-1" />
                Error
              </Badge>
            ) : isConnected ? (
              <Badge className="bg-emerald-500 text-white border-0">
                <div className="w-2 h-2 bg-emerald-300 rounded-full mr-2 animate-ping"></div>
                Conectado
              </Badge>
            ) : (
              <Badge className="bg-yellow-500 text-white border-0">
                <Wifi className="w-3 h-3 mr-1 animate-spin" />
                Conectando...
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {error ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <WifiOff className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-red-700 dark:text-red-400">Error de Conexión</h3>
              <p className="text-sm text-red-600 dark:text-red-500 mt-1">{error}</p>
            </div>
            <Button onClick={reconnect} className="bg-red-500 hover:bg-red-600 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reconectar
            </Button>
          </div>
        ) : (
          <Tabs value={view} onValueChange={(value: any) => setView(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mx-4 mb-4 mt-4" style={{ width: 'calc(100% - 2rem)' }}>
              <TabsTrigger value="overview" className="text-xs font-medium">
                <Gauge className="w-3 h-3 mr-1" />
                Resumen
              </TabsTrigger>
              <TabsTrigger value="chart" className="text-xs font-medium">
                <BarChart3 className="w-3 h-3 mr-1" />
                Gráfico
              </TabsTrigger>
              <TabsTrigger value="details" className="text-xs font-medium">
                <Target className="w-3 h-3 mr-1" />
                Detalles
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="px-4 pb-4 space-y-6">
              {/* Barra de ratio simplificada */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border shadow-sm">
                {/* Header simplificado */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    Long/Short Ratio
                  </h3>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                    <div className="font-bold text-lg">{formatVolumeUSD(data.totalVolumeUSD)}</div>
                  </div>
                </div>

                {/* Barra principal */}
                <div className="relative h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border">
                  {/* Lado Long */}
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-700 ease-out flex items-center justify-center"
                    style={{ width: `${data.buyRatio * 100}%` }}
                  >
                    {data.buyRatio > 0.15 && (
                      <span className="text-white font-bold text-lg">
                        {formatPercent(data.buyRatio)}
                      </span>
                    )}
                  </div>
                  
                  {/* Lado Short */}
                  <div 
                    className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-500 to-rose-600 transition-all duration-700 ease-out flex items-center justify-center"
                    style={{ width: `${data.sellRatio * 100}%` }}
                  >
                    {data.sellRatio > 0.15 && (
                      <span className="text-white font-bold text-lg">
                        {formatPercent(data.sellRatio)}
                      </span>
                    )}
                  </div>

                  {/* Línea central */}
                  <div className="absolute left-1/2 top-2 bottom-2 w-px bg-white/60 transform -translate-x-1/2"></div>
                </div>

                {/* Etiquetas y valores */}
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded"></div>
                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400">Long</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{formatVolumeUSD(data.buyVolumeUSD)}</div>
                    </div>
                  </div>

                  {/* Centro con sentimiento */}
                  <div className="text-center">
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                      sentiment.color === 'emerald' ? 'bg-green-100 text-green-700' :
                      sentiment.color === 'red' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      <SentimentIcon className="w-4 h-4" />
                      <span>{sentiment.text}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-semibold text-red-700 dark:text-red-400">Short</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{formatVolumeUSD(data.sellVolumeUSD)}</div>
                    </div>
                    <div className="w-4 h-4 bg-gradient-to-l from-red-500 to-rose-600 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Mini gráfico en tiempo real */}
              {chartData.length > 0 && (
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center">
                      <Activity className="w-4 h-4 mr-2 text-blue-500" />
                      Tendencia en Tiempo Real
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      Últimos {WINDOW_SIZES.find(w => w.value === windowSize)?.label}
                    </Badge>
                  </div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="longGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="shortGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis hide />
                        <YAxis hide domain={[0, 100]} />
                        <ReferenceLine y={50} stroke="#64748b" strokeDasharray="2 2" strokeOpacity={0.5} />
                        <Area 
                          type="monotone" 
                          dataKey="longRatio" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          fill="url(#longGradient)"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="shortRatio" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          fill="url(#shortGradient)"
                        />
                        <Tooltip 
                          formatter={(value: any, name: string) => [
                            `${value.toFixed(1)}%`, 
                            name === 'longRatio' ? 'Longs' : 'Shorts'
                          ]}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                            fontSize: '12px'
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Métricas rápidas */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-xl border shadow-sm">
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{data.trades}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Trades</div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-xl border shadow-sm">
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{formatVolumeUSD(data.totalVolumeUSD)}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Volumen USD</div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-xl border shadow-sm">
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{data.currentPrice > 0 ? formatPrice(data.currentPrice) : '-'}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Precio Actual</div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-xl border shadow-sm">
                  <div className={`text-2xl font-bold ${
                    getDominance() === 'extreme' ? 'text-red-600' :
                    getDominance() === 'strong' ? 'text-orange-600' :
                    getDominance() === 'moderate' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {getDominance() === 'extreme' ? 'Extremo' :
                     getDominance() === 'strong' ? 'Fuerte' :
                     getDominance() === 'moderate' ? 'Moderado' :
                     'Equilibrado'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Dominio</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chart" className="px-4 pb-4">
              {chartData.length > 0 && (
                <div className="h-80 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900 rounded-2xl p-4 border">
                  <h4 className="font-semibold mb-4 text-slate-700 dark:text-slate-300">
                    Evolución del Ratio Long/Short
                  </h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis hide />
                      <YAxis 
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        fontSize={12}
                        stroke="#64748b"
                      />
                      <ReferenceLine y={50} stroke="#64748b" strokeDasharray="2 2" />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          `${value.toFixed(1)}%`, 
                          name === 'longRatio' ? 'Longs' : 'Shorts'
                        ]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="longRatio" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={false}
                        strokeLinecap="round"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="shortRatio" 
                        stroke="#ef4444" 
                        strokeWidth={3}
                        dot={false}
                        strokeLinecap="round"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </TabsContent>

            <TabsContent value="details" className="px-4 pb-4 space-y-4">
              {/* Análisis detallado */}
              <div className={`p-6 rounded-2xl border-2 ${
                sentiment.color === 'emerald' 
                  ? 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200 text-emerald-800'
                  : sentiment.color === 'red'
                  ? 'bg-gradient-to-br from-red-50 to-rose-100 border-red-200 text-red-800'
                  : 'bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200 text-gray-800'
              } dark:from-slate-800 dark:to-slate-700 dark:border-slate-600 dark:text-slate-200`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <SentimentIcon className="w-6 h-6" />
                    <span className="font-bold text-lg">{sentiment.text}</span>
                  </div>
                  <Badge className={`${
                    data.buyRatio > data.sellRatio 
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      : data.sellRatio > data.buyRatio
                      ? 'bg-red-100 text-red-700 border-red-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}>
                    {data.buyRatio > data.sellRatio ? `+${((data.buyRatio - data.sellRatio) * 100).toFixed(1)}%` : 
                     data.sellRatio > data.buyRatio ? `-${((data.sellRatio - data.buyRatio) * 100).toFixed(1)}%` : 
                     'Equilibrado'}
                  </Badge>
                </div>
                <p className="leading-relaxed">
                  {sentiment.color === 'emerald' 
                    ? `Fuerte predominio de órdenes de compra (${formatPercent(data.buyRatio)}). El mercado muestra clara presión alcista con alta probabilidad de movimientos al alza.`
                    : sentiment.color === 'red'
                    ? `Predominio significativo de órdenes de venta (${formatPercent(data.sellRatio)}). El mercado refleja presión bajista con tendencia a movimientos a la baja.`
                    : `El mercado está equilibrado entre compras y ventas. Esto sugiere una fase de consolidación sin una dirección clara definida.`
                  }
                </p>
              </div>

              {/* Información técnica */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <h5 className="font-semibold text-blue-700 dark:text-blue-300 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  💡 Análisis Técnico en Tiempo Real
                </h5>
                <div className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
                  <p>
                    <strong>Metodología:</strong> Este análisis se basa en trades individuales procesados en tiempo real mediante WebSocket de Bybit.
                  </p>
                  <p>
                    <strong>Interpretación:</strong> Cada trade se clasifica como presión de compra (taker Buy) o presión de venta (taker Sell), 
                    proporcionando una visión inmediata del sentimiento del mercado.
                  </p>
                  <p>
                    <strong>Ventana de tiempo:</strong> Los datos se procesan en ventanas de {WINDOW_SIZES.find(w => w.value === windowSize)?.label} 
                    para filtrar ruido y mostrar tendencias significativas.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
} 