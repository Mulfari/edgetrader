"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, TrendingUp, TrendingDown, Activity, Settings } from 'lucide-react';
import { useOrderBook } from '@/hooks/useOrderBook';
import { OrderBookLevel3Entry } from '@/types/market';

interface OrderBookWidgetProps {
  defaultSymbol?: string;
  defaultCategory?: 'spot' | 'linear';
  className?: string;
}

const POPULAR_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT',
  'DOGEUSDT', 'LINKUSDT', 'UNIUSDT', 'AVAXUSDT', 'MATICUSDT'
];

const DEPTH_OPTIONS = [10, 25, 50, 100];

export default function OrderBookWidget({ 
  defaultSymbol = 'BTCUSDT', 
  defaultCategory = 'spot',
  className = ''
}: OrderBookWidgetProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(defaultSymbol);
  const [selectedCategory, setSelectedCategory] = useState<'spot' | 'linear'>(defaultCategory);
  const [depth, setDepth] = useState(25);
  const [view, setView] = useState<'combined' | 'bids' | 'asks'>('combined');

  const { orderBook, spread, loading, error, lastUpdate, refresh } = useOrderBook({
    symbol: selectedSymbol,
    category: selectedCategory,
    limit: depth,
    refreshInterval: 1000
  });

  // Formatear precio con decimales apropiados
  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (num >= 1000) return num.toFixed(2);
    if (num >= 100) return num.toFixed(3);
    if (num >= 10) return num.toFixed(4);
    if (num >= 1) return num.toFixed(5);
    return num.toFixed(6);
  };

  // Formatear tamaño
  const formatSize = (size: string) => {
    const num = parseFloat(size);
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(4);
  };

  // Calcular el total acumulado
  const calculateCumulativeData = (entries: OrderBookLevel3Entry[]) => {
    let cumulative = 0;
    return entries.map(entry => {
      cumulative += parseFloat(entry.size);
      return { ...entry, cumulative };
    });
  };

  const bidsWithCumulative = useMemo(() => {
    if (!orderBook) return [];
    return calculateCumulativeData(orderBook.bids.slice(0, depth));
  }, [orderBook, depth]);

  const asksWithCumulative = useMemo(() => {
    if (!orderBook) return [];
    return calculateCumulativeData(orderBook.asks.slice(0, depth));
  }, [orderBook, depth]);

  // Calcular el máximo para el gráfico de barras
  const maxCumulative = useMemo(() => {
    const maxBids = Math.max(...bidsWithCumulative.map(b => b.cumulative), 0);
    const maxAsks = Math.max(...asksWithCumulative.map(a => a.cumulative), 0);
    return Math.max(maxBids, maxAsks);
  }, [bidsWithCumulative, asksWithCumulative]);

  const OrderBookRow = ({ 
    entry, 
    cumulative, 
    side, 
    maxCumulative 
  }: { 
    entry: OrderBookLevel3Entry; 
    cumulative: number; 
    side: 'buy' | 'sell'; 
    maxCumulative: number;
  }) => {
    const percentage = maxCumulative > 0 ? (cumulative / maxCumulative) * 100 : 0;
    const isBuy = side === 'buy';
    
    return (
      <div className={`relative flex items-center justify-between py-1 px-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}>
        {/* Barra de fondo para visualizar el volumen acumulado */}
        <div 
          className={`absolute inset-0 ${isBuy ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}
          style={{ 
            width: `${percentage}%`,
            [isBuy ? 'left' : 'right']: 0
          }}
        />
        
        <div className="relative z-10 flex items-center justify-between w-full">
          <span className={`font-mono ${isBuy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatPrice(entry.price)}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {formatSize(entry.size)}
          </span>
          <span className="text-gray-500 dark:text-gray-500 text-xs">
            {formatSize(cumulative.toString())}
          </span>
        </div>
      </div>
    );
  };

  const SpreadInfo = () => {
    if (!spread || !orderBook) return null;

    const bestBid = orderBook.bids[0]?.price;
    const bestAsk = orderBook.asks[0]?.price;

    return (
      <div className="flex items-center justify-center py-2 px-4 bg-gray-50 dark:bg-gray-800 border-y">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <span className="text-green-600 dark:text-green-400 font-mono">
              {bestBid ? formatPrice(bestBid) : '--'}
            </span>
            <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500">Spread</span>
            <span className="font-mono text-xs">
              {spread.spread.toFixed(6)} ({spread.spreadPercent.toFixed(3)}%)
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
            <span className="text-red-600 dark:text-red-400 font-mono">
              {bestAsk ? formatPrice(bestAsk) : '--'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Order Book L3</span>
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
              Actualizado: {lastUpdate.toLocaleTimeString()}
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
              <TabsTrigger value="combined" className="text-xs">Combinado</TabsTrigger>
              <TabsTrigger value="bids" className="text-xs">Compras</TabsTrigger>
              <TabsTrigger value="asks" className="text-xs">Ventas</TabsTrigger>
            </TabsList>

            <div className="px-2">
              {/* Headers */}
              <div className="flex items-center justify-between py-2 px-2 text-xs font-medium text-gray-500 border-b">
                <span>Precio</span>
                <span>Cantidad</span>
                <span>Total</span>
              </div>

              <TabsContent value="combined" className="mt-0">
                <div className="max-h-96 overflow-y-auto">
                  {/* Asks (ventas) - orden inverso para mostrar de menor a mayor precio */}
                  <div className="space-y-0">
                    {asksWithCumulative.slice().reverse().map((entry, index) => (
                      <OrderBookRow
                        key={`ask-${entry.id || index}`}
                        entry={entry}
                        cumulative={entry.cumulative}
                        side="sell"
                        maxCumulative={maxCumulative}
                      />
                    ))}
                  </div>

                  <SpreadInfo />

                  {/* Bids (compras) */}
                  <div className="space-y-0">
                    {bidsWithCumulative.map((entry, index) => (
                      <OrderBookRow
                        key={`bid-${entry.id || index}`}
                        entry={entry}
                        cumulative={entry.cumulative}
                        side="buy"
                        maxCumulative={maxCumulative}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bids" className="mt-0">
                <div className="max-h-96 overflow-y-auto space-y-0">
                  {bidsWithCumulative.map((entry, index) => (
                    <OrderBookRow
                      key={`bid-${entry.id || index}`}
                      entry={entry}
                      cumulative={entry.cumulative}
                      side="buy"
                      maxCumulative={maxCumulative}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="asks" className="mt-0">
                <div className="max-h-96 overflow-y-auto space-y-0">
                  {asksWithCumulative.map((entry, index) => (
                    <OrderBookRow
                      key={`ask-${entry.id || index}`}
                      entry={entry}
                      cumulative={entry.cumulative}
                      side="sell"
                      maxCumulative={maxCumulative}
                    />
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
} 