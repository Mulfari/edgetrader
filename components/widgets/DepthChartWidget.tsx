"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, TrendingUp, TrendingDown, Activity, BarChart3, Target } from 'lucide-react';
import { useOrderBook } from '@/hooks/useOrderBook';
import { useDepthChart, OrderLadderEntry, VWAPData } from '@/hooks/useDepthChart';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Bar
} from 'recharts';

interface DepthChartWidgetProps {
  defaultSymbol?: string;
  defaultCategory?: 'spot' | 'linear';
  className?: string;
}

const POPULAR_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT',
  'DOGEUSDT', 'LINKUSDT', 'UNIUSDT', 'AVAXUSDT', 'MATICUSDT'
];

const DEPTH_OPTIONS = [10, 15, 20, 25];

export default function DepthChartWidget({ 
  defaultSymbol = 'BTCUSDT', 
  defaultCategory = 'spot',
  className = ''
}: DepthChartWidgetProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(defaultSymbol);
  const [selectedCategory, setSelectedCategory] = useState<'spot' | 'linear'>(defaultCategory);
  const [depth, setDepth] = useState(20);
  const [view, setView] = useState<'depth' | 'ladder'>('depth');

  const { orderBook, loading, error, lastUpdate, refresh } = useOrderBook({
    symbol: selectedSymbol,
    category: selectedCategory,
    limit: 50,
    refreshInterval: 1000
  });

  const { 
    bidDepthData, 
    askDepthData, 
    bidLadder, 
    askLadder, 
    vwapData, 
    maxVolume 
  } = useDepthChart(orderBook, depth);

  // Formatear precio
  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 100) return price.toFixed(3);
    if (price >= 10) return price.toFixed(4);
    if (price >= 1) return price.toFixed(5);
    return price.toFixed(6);
  };

  // Formatear volumen
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(2)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(2)}K`;
    return volume.toFixed(2);
  };

  // Combinar datos para el gráfico de profundidad
  const combinedDepthData = [
    ...bidDepthData.map(d => ({ ...d, bidVolume: d.cumulativeVolume, askVolume: 0 })),
    ...askDepthData.map(d => ({ ...d, bidVolume: 0, askVolume: d.cumulativeVolume }))
  ].sort((a, b) => a.price - b.price);

  // Componente de información VWAP
  const VWAPInfo = ({ vwap }: { vwap: VWAPData }) => (
    <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">VWAP Bid:</span>
          <span className="font-mono text-green-600 dark:text-green-400">
            {formatPrice(vwap.bidVWAP)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">VWAP Ask:</span>
          <span className="font-mono text-red-600 dark:text-red-400">
            {formatPrice(vwap.askVWAP)}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Mid Price:</span>
          <span className="font-mono text-blue-600 dark:text-blue-400">
            {formatPrice(vwap.midPrice)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Spread:</span>
          <span className="font-mono text-gray-700 dark:text-gray-300">
            {formatPrice(vwap.spread)} ({vwap.spreadPercentage.toFixed(3)}%)
          </span>
        </div>
      </div>
    </div>
  );

  // Componente de fila del ladder
  const LadderRow = ({ entry, side }: { entry: OrderLadderEntry; side: 'bid' | 'ask' }) => {
    const isAsk = side === 'ask';
    const barColor = isAsk ? 'bg-red-500' : 'bg-green-500';
    const textColor = isAsk ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
    
    return (
      <div className="flex items-center py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div className="flex-1 flex items-center justify-between text-xs">
          <span className={`font-mono ${textColor} min-w-0 flex-1`}>
            {formatPrice(parseFloat(entry.price))}
          </span>
          <span className="text-gray-600 dark:text-gray-400 min-w-0 flex-1 text-center">
            {formatVolume(parseFloat(entry.size))}
          </span>
          <span className="text-gray-500 dark:text-gray-500 min-w-0 flex-1 text-right">
            {formatVolume(entry.cumulativeVolume)}
          </span>
        </div>
        <div className="ml-2 w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
          <div 
            className={`h-full ${barColor} transition-all duration-300`}
            style={{ width: `${entry.volumePercentage}%` }}
          />
        </div>
      </div>
    );
  };

  // Tooltip personalizado para el gráfico
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
          <p className="font-mono text-sm">{`Precio: ${formatPrice(label)}`}</p>
          {data.bidVolume > 0 && (
            <p className="text-green-600 text-sm">{`Bids: ${formatVolume(data.bidVolume)}`}</p>
          )}
          {data.askVolume > 0 && (
            <p className="text-red-600 text-sm">{`Asks: ${formatVolume(data.askVolume)}`}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Depth Chart</span>
            <Badge variant="outline" className="ml-2">
              {selectedSymbol}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
              className="h-8"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_SYMBOLS.map(symbol => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Select value={selectedCategory} onValueChange={(value: 'spot' | 'linear') => setSelectedCategory(value)}>
              <SelectTrigger className="w-20 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spot">Spot</SelectItem>
                <SelectItem value="linear">Futures</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={depth.toString()} onValueChange={(value) => setDepth(parseInt(value))}>
              <SelectTrigger className="w-16 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPTH_OPTIONS.map(option => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {lastUpdate && (
            <span className="text-xs text-gray-500">
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
            <TabsList className="grid w-full grid-cols-2 mx-4 mb-2" style={{ width: 'calc(100% - 2rem)' }}>
              <TabsTrigger value="depth" className="text-xs">
                <BarChart3 className="w-3 h-3 mr-1" />
                Profundidad
              </TabsTrigger>
              <TabsTrigger value="ladder" className="text-xs">
                <Target className="w-3 h-3 mr-1" />
                Ladder
              </TabsTrigger>
            </TabsList>

            <div className="px-4">
              {vwapData && <VWAPInfo vwap={vwapData} />}
            </div>

            <TabsContent value="depth" className="mt-4">
              <div className="px-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={combinedDepthData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="price" 
                        type="number"
                        scale="linear"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={formatPrice}
                        fontSize={10}
                      />
                      <YAxis 
                        tickFormatter={formatVolume}
                        fontSize={10}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      
                      {/* Área de bids (verde) */}
                      <Area
                        type="stepAfter"
                        dataKey="bidVolume"
                        stackId="1"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.3}
                      />
                      
                      {/* Área de asks (rojo) */}
                      <Area
                        type="stepBefore"
                        dataKey="askVolume"
                        stackId="2"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.3}
                      />
                      
                      {/* Líneas de referencia para VWAP */}
                      {vwapData && (
                        <>
                          <ReferenceLine 
                            x={vwapData.bidVWAP} 
                            stroke="#10b981" 
                            strokeDasharray="5 5"
                            label={{ value: "VWAP Bid", position: "top" }}
                          />
                          <ReferenceLine 
                            x={vwapData.askVWAP} 
                            stroke="#ef4444" 
                            strokeDasharray="5 5"
                            label={{ value: "VWAP Ask", position: "top" }}
                          />
                          <ReferenceLine 
                            x={vwapData.midPrice} 
                            stroke="#3b82f6" 
                            strokeDasharray="2 2"
                            label={{ value: "Mid", position: "top" }}
                          />
                        </>
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ladder" className="mt-4">
              <div className="px-2">
                {/* Headers */}
                <div className="flex items-center justify-between py-2 px-2 text-xs font-medium text-gray-500 border-b">
                  <span className="flex-1">Precio</span>
                  <span className="flex-1 text-center">Volumen</span>
                  <span className="flex-1 text-right">Total</span>
                  <span className="w-16 ml-2 text-center">%</span>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {/* Asks (ventas) - orden inverso */}
                  <div className="space-y-0">
                    {askLadder.slice().reverse().map((entry, index) => (
                      <LadderRow
                        key={`ask-${entry.id || index}`}
                        entry={entry}
                        side="ask"
                      />
                    ))}
                  </div>

                  {/* Separador de spread */}
                  {vwapData && (
                    <div className="flex items-center justify-center py-3 px-4 bg-blue-50 dark:bg-blue-900/20 border-y my-1">
                      <div className="flex items-center space-x-4 text-sm">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <div className="text-center">
                          <div className="font-mono text-xs text-blue-600 dark:text-blue-400">
                            Spread: {formatPrice(vwapData.spread)}
                          </div>
                          <div className="text-xs text-gray-500">
                            ({vwapData.spreadPercentage.toFixed(3)}%)
                          </div>
                        </div>
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      </div>
                    </div>
                  )}

                  {/* Bids (compras) */}
                  <div className="space-y-0">
                    {bidLadder.map((entry, index) => (
                      <LadderRow
                        key={`bid-${entry.id || index}`}
                        entry={entry}
                        side="bid"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
} 