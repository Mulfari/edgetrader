"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { RefreshCw, TrendingUp, TrendingDown, Target, AlertTriangle, Zap, Shield, Calculator, Bell, Activity } from 'lucide-react';
import { useOrderBook } from '@/hooks/useOrderBook';
import { OrderBookLevel3Entry } from '@/types/market';

interface EnhancedTradingOrderBookWidgetProps {
  defaultSymbol?: string;
  defaultCategory?: 'spot' | 'linear';
  className?: string;
}

const POPULAR_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT',
  'DOGEUSDT', 'LINKUSDT', 'UNIUSDT', 'AVAXUSDT', 'MATICUSDT'
];

interface TradingAlert {
  id: string;
  type: 'liquidity_drop' | 'wall_detected' | 'spread_widening' | 'imbalance_extreme' | 'opportunity';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
  actionable: boolean;
}

interface OrderBookAnalysis {
  liquidityScore: number;
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
  tradabilityScore: number;
  liquidityVelocity: number;
  orderBookImbalance: number;
}

interface OrderSimulation {
  side: 'buy' | 'sell';
  amount: number;
  averagePrice: number;
  slippage: number;
  totalCost: number;
  priceImpact: number;
}

export default function EnhancedTradingOrderBookWidget({ 
  defaultSymbol = 'BTCUSDT', 
  defaultCategory = 'spot',
  className = ''
}: EnhancedTradingOrderBookWidgetProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(defaultSymbol);
  const [selectedCategory, setSelectedCategory] = useState<'spot' | 'linear'>(defaultCategory);
  const [view, setView] = useState<'analysis' | 'orderbook' | 'simulator' | 'alerts'>('analysis');
  const [alerts, setAlerts] = useState<TradingAlert[]>([]);
  const [simulationAmount, setSimulationAmount] = useState<string>('1000');
  const [simulationSide, setSimulationSide] = useState<'buy' | 'sell'>('buy');

  const { orderBook, loading, error, lastUpdate, refresh } = useOrderBook({
    symbol: selectedSymbol,
    category: selectedCategory,
    limit: 50,
    refreshInterval: 1000
  });

  // Análisis mejorado del order book
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

    // Score de liquidez mejorado (0-100)
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

    // Detectar muros
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

    // Score de tradabilidad (combinando múltiples factores)
    const tradabilityScore = Math.round(
      (liquidityScore * 0.4) + 
      ((spreadQuality === 'excellent' ? 100 : spreadQuality === 'good' ? 80 : spreadQuality === 'fair' ? 60 : 40) * 0.3) +
      ((Math.abs(pressureRatio - 1) < 0.2 ? 100 : Math.abs(pressureRatio - 1) < 0.5 ? 80 : 60) * 0.3)
    );

    // Velocidad de liquidez (simulada - en implementación real sería histórica)
    const liquidityVelocity = Math.random() * 20 - 10; // -10% a +10%

    // Imbalance del order book
    const orderBookImbalance = ((bidPressure - askPressure) / (bidPressure + askPressure)) * 100;

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
      },
      tradabilityScore,
      liquidityVelocity,
      orderBookImbalance
    };
  }, [orderBook]);

  // Sistema de alertas inteligentes
  useEffect(() => {
    if (!analysis) return;

    const newAlerts: TradingAlert[] = [];

    // Alerta de liquidez baja
    if (analysis.liquidityScore < 30) {
      newAlerts.push({
        id: `liquidity-${Date.now()}`,
        type: 'liquidity_drop',
        severity: 'high',
        message: `⚠️ Liquidez muy baja (${analysis.liquidityScore.toFixed(0)}%) - Cuidado con órdenes grandes`,
        timestamp: new Date(),
        actionable: true
      });
    }

    // Alerta de muros detectados
    if (analysis.wallDetection.bidWalls.length > 0) {
      const strongWalls = analysis.wallDetection.bidWalls.filter(w => w.strength === 'strong');
      if (strongWalls.length > 0) {
        newAlerts.push({
          id: `wall-${Date.now()}`,
          type: 'wall_detected',
          severity: 'medium',
          message: `🛡️ Muro de soporte fuerte detectado en $${strongWalls[0].price.toFixed(2)}`,
          timestamp: new Date(),
          actionable: true
        });
      }
    }

    // Alerta de spread amplio
    if (analysis.spreadQuality === 'poor') {
      newAlerts.push({
        id: `spread-${Date.now()}`,
        type: 'spread_widening',
        severity: 'medium',
        message: `📊 Spread muy amplio - Costos de trading elevados`,
        timestamp: new Date(),
        actionable: true
      });
    }

    // Alerta de imbalance extremo
    if (Math.abs(analysis.orderBookImbalance) > 30) {
      const direction = analysis.orderBookImbalance > 0 ? 'alcista' : 'bajista';
      newAlerts.push({
        id: `imbalance-${Date.now()}`,
        type: 'imbalance_extreme',
        severity: 'high',
        message: `🔥 Imbalance extremo ${direction} (${Math.abs(analysis.orderBookImbalance).toFixed(1)}%) - Posible movimiento fuerte`,
        timestamp: new Date(),
        actionable: true
      });
    }

    // Oportunidad de trading
    if (analysis.tradabilityScore > 85 && analysis.spreadQuality === 'excellent') {
      newAlerts.push({
        id: `opportunity-${Date.now()}`,
        type: 'opportunity',
        severity: 'low',
        message: `✨ Condiciones excelentes para trading - Score: ${analysis.tradabilityScore}/100`,
        timestamp: new Date(),
        actionable: true
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]); // Mantener solo 10 alertas
    }
  }, [analysis]);

  // Simulador de órdenes
  const simulateOrder = useMemo((): OrderSimulation | null => {
    if (!orderBook || !analysis) return null;

    const amount = parseFloat(simulationAmount);
    if (isNaN(amount) || amount <= 0) return null;

    const orders = simulationSide === 'buy' ? orderBook.asks : orderBook.bids;
    const referencePrice = simulationSide === 'buy' ? analysis.resistanceLevel : analysis.supportLevel;
    
    let remainingUsd = amount;
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

    const averagePrice = totalCost / totalQuantity;
    const slippage = ((averagePrice - referencePrice) / referencePrice) * 100;
    const priceImpact = Math.abs(slippage);

    return {
      side: simulationSide,
      amount,
      averagePrice,
      slippage: Math.abs(slippage),
      totalCost,
      priceImpact
    };
  }, [orderBook, analysis, simulationAmount, simulationSide]);

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

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50 dark:bg-red-900/10';
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      case 'low': return 'border-green-500 bg-green-50 dark:bg-green-900/10';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getTradabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Enhanced Trading Book</span>
            <Badge variant="outline" className="ml-2">
              {selectedSymbol}
            </Badge>
            {analysis && (
              <Badge className={`ml-2 ${getTradabilityColor(analysis.tradabilityScore)}`}>
                Score: {analysis.tradabilityScore}/100
              </Badge>
            )}
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
            
            {alerts.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                <Bell className="w-3 h-3 mr-1" />
                {alerts.length}
              </Badge>
            )}
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
            <TabsList className="grid w-full grid-cols-4 mx-4 mb-2" style={{ width: 'calc(100% - 2rem)' }}>
              <TabsTrigger value="analysis" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Análisis
              </TabsTrigger>
              <TabsTrigger value="simulator" className="text-xs">
                <Calculator className="w-3 h-3 mr-1" />
                Simulador
              </TabsTrigger>
              <TabsTrigger value="alerts" className="text-xs">
                <Bell className="w-3 h-3 mr-1" />
                Alertas
              </TabsTrigger>
              <TabsTrigger value="orderbook" className="text-xs">
                <Target className="w-3 h-3 mr-1" />
                Book
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="mt-4 px-4 space-y-4">
              {/* Métricas principales mejoradas */}
              <div className="grid grid-cols-3 gap-4">
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
                    <span className="text-sm text-gray-600">Tradabilidad:</span>
                    <span className={`text-xs font-semibold ${getTradabilityColor(analysis.tradabilityScore)}`}>
                      {analysis.tradabilityScore}/100
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
                    <span className="text-sm text-gray-600">Imbalance:</span>
                    <span className={`text-xs font-mono ${Math.abs(analysis.orderBookImbalance) > 20 ? 'text-red-600' : 'text-gray-600'}`}>
                      {analysis.orderBookImbalance > 0 ? '+' : ''}{analysis.orderBookImbalance.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Velocidad:</span>
                    <span className={`text-xs font-mono ${analysis.liquidityVelocity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analysis.liquidityVelocity > 0 ? '+' : ''}{analysis.liquidityVelocity.toFixed(1)}%
                    </span>
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

              {/* Estimación de slippage mejorada */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Slippage Estimado (USDT):</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="text-gray-500 font-medium">$100</div>
                    <div className="text-green-600">+{analysis.slippageEstimate.buy100.toFixed(3)}%</div>
                    <div className="text-red-600">{analysis.slippageEstimate.sell100.toFixed(3)}%</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="text-gray-500 font-medium">$500</div>
                    <div className="text-green-600">+{analysis.slippageEstimate.buy500.toFixed(3)}%</div>
                    <div className="text-red-600">{analysis.slippageEstimate.sell500.toFixed(3)}%</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="text-gray-500 font-medium">$1K</div>
                    <div className="text-green-600">+{analysis.slippageEstimate.buy1000.toFixed(3)}%</div>
                    <div className="text-red-600">{analysis.slippageEstimate.sell1000.toFixed(3)}%</div>
                  </div>
                </div>
              </div>

              {/* Muros detectados */}
              {(analysis.wallDetection.bidWalls.length > 0 || analysis.wallDetection.askWalls.length > 0) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Shield className="w-4 h-4 mr-1 text-yellow-500" />
                    Muros Detectados:
                  </h4>
                  <div className="space-y-1 text-xs">
                    {analysis.wallDetection.bidWalls.map((wall, i) => (
                      <div key={i} className="flex items-center justify-between text-green-600 p-2 bg-green-50 dark:bg-green-900/10 rounded">
                        <span>🛡️ Soporte: {formatPrice(wall.price)}</span>
                        <span>{formatVolume(wall.size)} ({wall.strength})</span>
                      </div>
                    ))}
                    {analysis.wallDetection.askWalls.map((wall, i) => (
                      <div key={i} className="flex items-center justify-between text-red-600 p-2 bg-red-50 dark:bg-red-900/10 rounded">
                        <span>⚔️ Resistencia: {formatPrice(wall.price)}</span>
                        <span>{formatVolume(wall.size)} ({wall.strength})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="simulator" className="mt-4 px-4 space-y-4">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Calculator className="w-4 h-4 mr-1" />
                  Simulador de Órdenes
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600">Lado:</label>
                    <Select value={simulationSide} onValueChange={(value: 'buy' | 'sell') => setSimulationSide(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Comprar</SelectItem>
                        <SelectItem value="sell">Vender</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600">Cantidad (USDT):</label>
                    <Input
                      type="number"
                      value={simulationAmount}
                      onChange={(e) => setSimulationAmount(e.target.value)}
                      placeholder="1000"
                    />
                  </div>
                </div>

                {simulateOrder && (
                  <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h5 className="text-sm font-medium">Resultado de la Simulación:</h5>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Precio Promedio:</span>
                          <span className="font-mono">${formatPrice(simulateOrder.averagePrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Slippage:</span>
                          <span className={`font-mono ${simulateOrder.slippage > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                            {simulateOrder.slippage.toFixed(3)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Costo Total:</span>
                          <span className="font-mono">${simulateOrder.totalCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Impacto:</span>
                          <span className={`font-mono ${simulateOrder.priceImpact > 0.2 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {simulateOrder.priceImpact.toFixed(3)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mt-2">
                      {simulateOrder.priceImpact < 0.1 ? '✅ Impacto bajo - Buena liquidez' :
                       simulateOrder.priceImpact < 0.5 ? '⚠️ Impacto moderado - Considerar dividir la orden' :
                       '🚨 Impacto alto - Dividir en órdenes más pequeñas'}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="mt-4 px-4 space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Bell className="w-4 h-4 mr-1" />
                  Alertas Inteligentes ({alerts.length})
                </h4>
                
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay alertas activas</p>
                    <p className="text-xs">Las alertas aparecerán automáticamente cuando se detecten condiciones importantes</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {alerts.map((alert) => (
                      <div key={alert.id} className={`p-3 border-l-4 rounded ${getAlertColor(alert.severity)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm">{alert.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {alert.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {alert.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                      <div key={`ask-${entry.id || index}`} className="flex items-center justify-between py-1 px-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span className="font-mono text-red-600 dark:text-red-400 flex-1">
                          {formatPrice(parseFloat(entry.price))}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 flex-1 text-center">
                          {formatVolume(parseFloat(entry.size))}
                        </span>
                      </div>
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
                      <div key={`bid-${entry.id || index}`} className="flex items-center justify-between py-1 px-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span className="font-mono text-green-600 dark:text-green-400 flex-1">
                          {formatPrice(parseFloat(entry.price))}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 flex-1 text-center">
                          {formatVolume(parseFloat(entry.size))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="p-4 text-center text-gray-500">
            Cargando análisis avanzado...
          </div>
        )}
      </CardContent>
    </Card>
  );
} 