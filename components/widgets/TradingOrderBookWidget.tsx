"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, TrendingUp, TrendingDown, Target, AlertTriangle, Zap, Shield } from 'lucide-react';
import { useOrderBook } from '@/hooks/useOrderBook';
import { OrderBookLevel3Entry } from '@/types/market';

interface TradingOrderBookWidgetProps {
  defaultSymbol?: string;
  defaultCategory?: 'spot' | 'linear';
  className?: string;
}

const POPULAR_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT',
  'DOGEUSDT', 'LINKUSDT', 'UNIUSDT', 'AVAXUSDT', 'MATICUSDT'
];

interface OrderBookAnalysis {
  liquidityScore: number; // 0-100
  spreadQuality: 'excellent' | 'good' | 'fair' | 'poor';
  marketPressure: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  supportLevel: number;
  resistanceLevel: number;
  wallDetection: {
    bidWalls: Array<{ price: number; size: number; strength: 'weak' | 'medium' | 'strong' }>;
    askWalls: Array<{ price: number; size: number; strength: 'weak' | 'medium' | 'strong' }>;
  };
  slippageEstimate: {
    buy100: number;
    buy500: number;
    buy1000: number;
    sell100: number;
    sell500: number;
    sell1000: number;
  };
}

export default function TradingOrderBookWidget({ 
  defaultSymbol = 'BTCUSDT', 
  defaultCategory = 'spot',
  className = ''
}: TradingOrderBookWidgetProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(defaultSymbol);
  const [selectedCategory, setSelectedCategory] = useState<'spot' | 'linear'>(defaultCategory);
  const [view, setView] = useState<'analysis' | 'orderbook'>('analysis');

  const { orderBook, loading, error, lastUpdate, refresh } = useOrderBook({
    symbol: selectedSymbol,
    category: selectedCategory,
    limit: 50,
    refreshInterval: 1000
  });

  // Análisis del order book
  const analysis = useMemo((): OrderBookAnalysis | null => {
    if (!orderBook || !orderBook.bids.length || !orderBook.asks.length) return null;

    const bids = orderBook.bids.slice(0, 20);
    const asks = orderBook.asks.slice(0, 20);
    
    const bestBid = parseFloat(bids[0].price);
    const bestAsk = parseFloat(asks[0].price);
    const spread = bestAsk - bestBid;
    const midPrice = (bestBid + bestAsk) / 2;
    const spreadPercent = (spread / midPrice) * 100;

    // Calcular liquidez total
    const totalBidVolume = bids.reduce((sum, bid) => sum + parseFloat(bid.size), 0);
    const totalAskVolume = asks.reduce((sum, ask) => sum + parseFloat(ask.size), 0);
    const totalVolume = totalBidVolume + totalAskVolume;

    // Score de liquidez (0-100)
    const liquidityScore = Math.min(100, Math.max(0, (totalVolume / 1000) * 10));

    // Calidad del spread
    let spreadQuality: 'excellent' | 'good' | 'fair' | 'poor';
    if (spreadPercent < 0.01) spreadQuality = 'excellent';
    else if (spreadPercent < 0.05) spreadQuality = 'good';
    else if (spreadPercent < 0.1) spreadQuality = 'fair';
    else spreadQuality = 'poor';

    // Presión del mercado
    const bidPressure = totalBidVolume;
    const askPressure = totalAskVolume;
    const pressureRatio = bidPressure / askPressure;
    
    let marketPressure: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
    if (pressureRatio > 1.5) marketPressure = 'strong_buy';
    else if (pressureRatio > 1.1) marketPressure = 'buy';
    else if (pressureRatio > 0.9) marketPressure = 'neutral';
    else if (pressureRatio > 0.6) marketPressure = 'sell';
    else marketPressure = 'strong_sell';

    // Detectar muros (órdenes grandes)
    const avgBidSize = totalBidVolume / bids.length;
    const avgAskSize = totalAskVolume / asks.length;
    
    const bidWalls = bids
      .filter(bid => parseFloat(bid.size) > avgBidSize * 3)
      .map(bid => ({
        price: parseFloat(bid.price),
        size: parseFloat(bid.size),
        strength: parseFloat(bid.size) > avgBidSize * 5 ? 'strong' as const : 
                 parseFloat(bid.size) > avgBidSize * 4 ? 'medium' as const : 'weak' as const
      }))
      .slice(0, 3);

    const askWalls = asks
      .filter(ask => parseFloat(ask.size) > avgAskSize * 3)
      .map(ask => ({
        price: parseFloat(ask.price),
        size: parseFloat(ask.size),
        strength: parseFloat(ask.size) > avgAskSize * 5 ? 'strong' as const : 
                 parseFloat(ask.size) > avgAskSize * 4 ? 'medium' as const : 'weak' as const
      }))
      .slice(0, 3);

    // Estimación de slippage
    const calculateSlippage = (side: 'buy' | 'sell', usdAmount: number) => {
      const orders = side === 'buy' ? asks : bids;
      let remainingUsd = usdAmount;
      let totalCost = 0;
      let totalQuantity = 0;

      for (const order of orders) {
        const price = parseFloat(order.price);
        const size = parseFloat(order.size);
        const orderValue = price * size;

        if (remainingUsd <= orderValue) {
          const partialQuantity = remainingUsd / price;
          totalQuantity += partialQuantity;
          totalCost += remainingUsd;
          break;
        } else {
          totalQuantity += size;
          totalCost += orderValue;
          remainingUsd -= orderValue;
        }
      }

      const avgPrice = totalCost / totalQuantity;
      const referencePrice = side === 'buy' ? bestAsk : bestBid;
      return ((avgPrice - referencePrice) / referencePrice) * 100;
    };

    return {
      liquidityScore,
      spreadQuality,
      marketPressure,
      supportLevel: bestBid,
      resistanceLevel: bestAsk,
      wallDetection: { bidWalls, askWalls },
      slippageEstimate: {
        buy100: calculateSlippage('buy', 100),
        buy500: calculateSlippage('buy', 500),
        buy1000: calculateSlippage('buy', 1000),
        sell100: calculateSlippage('sell', 100),
        sell500: calculateSlippage('sell', 500),
        sell1000: calculateSlippage('sell', 1000),
      }
    };
  }, [orderBook]);

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 100) return price.toFixed(3);
    if (price >= 10) return price.toFixed(4);
    if (price >= 1) return price.toFixed(5);
    return price.toFixed(6);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(2)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(2)}K`;
    return volume.toFixed(2);
  };

  const getPressureColor = (pressure: string) => {
    switch (pressure) {
      case 'strong_buy': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'buy': return 'text-green-500 bg-green-50 dark:bg-green-900/10';
      case 'neutral': return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
      case 'sell': return 'text-red-500 bg-red-50 dark:bg-red-900/10';
      case 'strong_sell': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPressureText = (pressure: string) => {
    switch (pressure) {
      case 'strong_buy': return 'Compra Fuerte';
      case 'buy': return 'Compra';
      case 'neutral': return 'Neutral';
      case 'sell': return 'Venta';
      case 'strong_sell': return 'Venta Fuerte';
      default: return 'Desconocido';
    }
  };

  const getSpreadColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const OrderBookRow = ({ entry, side, isWall }: { 
    entry: OrderBookLevel3Entry; 
    side: 'bid' | 'ask'; 
    isWall?: boolean;
  }) => {
    const isBuy = side === 'bid';
    const textColor = isBuy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const bgColor = isWall ? (isBuy ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10') : '';
    
    return (
      <div className={`flex items-center justify-between py-1 px-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${bgColor}`}>
        <span className={`font-mono ${textColor} flex-1`}>
          {formatPrice(parseFloat(entry.price))}
        </span>
        <span className="text-gray-600 dark:text-gray-400 flex-1 text-center">
          {formatVolume(parseFloat(entry.size))}
        </span>
        {isWall && <Shield className="w-3 h-3 text-yellow-500 ml-1" />}
      </div>
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Trading Order Book</span>
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
        ) : analysis ? (
          <Tabs value={view} onValueChange={(value: any) => setView(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mx-4 mb-2" style={{ width: 'calc(100% - 2rem)' }}>
              <TabsTrigger value="analysis" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Análisis
              </TabsTrigger>
              <TabsTrigger value="orderbook" className="text-xs">
                <Target className="w-3 h-3 mr-1" />
                Order Book
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="mt-4 px-4 space-y-4">
              {/* Métricas principales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Liquidez:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${analysis.liquidityScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono">{analysis.liquidityScore.toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Spread:</span>
                    <span className={`text-xs font-semibold ${getSpreadColor(analysis.spreadQuality)}`}>
                      {analysis.spreadQuality.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Presión:</span>
                    <Badge className={`text-xs ${getPressureColor(analysis.marketPressure)}`}>
                      {getPressureText(analysis.marketPressure)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Muros:</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-green-600">{analysis.wallDetection.bidWalls.length}</span>
                      <span className="text-xs text-gray-400">/</span>
                      <span className="text-xs text-red-600">{analysis.wallDetection.askWalls.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estimación de slippage */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Slippage Estimado (USDT):</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-gray-500">$100</div>
                    <div className="text-green-600">+{analysis.slippageEstimate.buy100.toFixed(3)}%</div>
                    <div className="text-red-600">{analysis.slippageEstimate.sell100.toFixed(3)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">$500</div>
                    <div className="text-green-600">+{analysis.slippageEstimate.buy500.toFixed(3)}%</div>
                    <div className="text-red-600">{analysis.slippageEstimate.sell500.toFixed(3)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">$1K</div>
                    <div className="text-green-600">+{analysis.slippageEstimate.buy1000.toFixed(3)}%</div>
                    <div className="text-red-600">{analysis.slippageEstimate.sell1000.toFixed(3)}%</div>
                  </div>
                </div>
              </div>

              {/* Muros detectados */}
              {(analysis.wallDetection.bidWalls.length > 0 || analysis.wallDetection.askWalls.length > 0) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1 text-yellow-500" />
                    Muros Detectados:
                  </h4>
                  <div className="space-y-1 text-xs">
                    {analysis.wallDetection.bidWalls.map((wall, i) => (
                      <div key={i} className="flex items-center justify-between text-green-600">
                        <span>Soporte: {formatPrice(wall.price)}</span>
                        <span>{formatVolume(wall.size)} ({wall.strength})</span>
                      </div>
                    ))}
                    {analysis.wallDetection.askWalls.map((wall, i) => (
                      <div key={i} className="flex items-center justify-between text-red-600">
                        <span>Resistencia: {formatPrice(wall.price)}</span>
                        <span>{formatVolume(wall.size)} ({wall.strength})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="orderbook" className="mt-4">
              <div className="px-2">
                <div className="flex items-center justify-between py-2 px-2 text-xs font-medium text-gray-500 border-b">
                  <span>Precio</span>
                  <span>Volumen</span>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {/* Asks */}
                  <div className="space-y-0">
                    {orderBook?.asks.slice(0, 10).reverse().map((entry, index) => (
                      <OrderBookRow
                        key={`ask-${entry.id || index}`}
                        entry={entry}
                        side="ask"
                        isWall={analysis.wallDetection.askWalls.some(wall => 
                          Math.abs(wall.price - parseFloat(entry.price)) < 0.01
                        )}
                      />
                    ))}
                  </div>

                  {/* Spread */}
                  <div className="flex items-center justify-center py-2 px-4 bg-blue-50 dark:bg-blue-900/20 border-y my-1">
                    <div className="text-center">
                      <div className="font-mono text-xs text-blue-600 dark:text-blue-400">
                        Spread: {formatPrice(analysis.resistanceLevel - analysis.supportLevel)}
                      </div>
                    </div>
                  </div>

                  {/* Bids */}
                  <div className="space-y-0">
                    {orderBook?.bids.slice(0, 10).map((entry, index) => (
                      <OrderBookRow
                        key={`bid-${entry.id || index}`}
                        entry={entry}
                        side="bid"
                        isWall={analysis.wallDetection.bidWalls.some(wall => 
                          Math.abs(wall.price - parseFloat(entry.price)) < 0.01
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="p-4 text-center text-gray-500">
            Cargando análisis...
          </div>
        )}
      </CardContent>
    </Card>
  );
} 