"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, TrendingUp, TrendingDown, Target, Zap, X, Settings } from 'lucide-react';
import { useOrderBook } from '@/hooks/useOrderBook';

interface SimpleTradingWidgetProps {
  defaultSymbol?: string;
  defaultCategory?: 'spot' | 'linear';
  onRemove?: () => void;
  className?: string;
}

const POPULAR_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT',
  'DOGEUSDT', 'LINKUSDT', 'UNIUSDT', 'AVAXUSDT', 'MATICUSDT'
];

interface TradingSignal {
  type: 'buy' | 'sell' | 'neutral';
  strength: 'weak' | 'medium' | 'strong';
  reason: string;
  confidence: number; // 0-100
}

interface QuickAnalysis {
  bestBid: number;
  bestAsk: number;
  spread: number;
  spreadPercent: number;
  signal: TradingSignal;
  liquidityGood: boolean;
  bigOrders: {
    bidWalls: Array<{ price: number; size: number }>;
    askWalls: Array<{ price: number; size: number }>;
  };
  liquidityDetails: {
    totalVolume: number;
    bidVolume: number;
    askVolume: number;
    volumeRatio: number;
    balanceStrength: 'equilibrado' | 'leve' | 'moderado' | 'fuerte' | 'extremo';
    dominantSide: 'compradores' | 'vendedores' | 'equilibrado';
    dominancePercent: number;
  };
  liquidityMetrics: {
    current: {
      totalVolume: number;
      bidVolume: number;
      askVolume: number;
      spread: number;
      spreadPercent: number;
    };
    averages: {
      totalVolume5min: number;
      bidVolume5min: number;
      askVolume5min: number;
      spread5min: number;
      spreadPercent5min: number;
    };
    trends: {
      volumeTrend: 'subiendo' | 'bajando' | 'estable';
      spreadTrend: 'ampliando' | 'estrechando' | 'estable';
      volumeChange: number; // porcentaje
      spreadChange: number; // porcentaje
    };
    quality: {
      score: number; // 0-100
      level: 'excelente' | 'buena' | 'regular' | 'pobre' | 'muy_pobre';
      reason: string;
    };
  };
}

export default function SimpleTradingWidget({ 
  defaultSymbol = 'BTCUSDT', 
  defaultCategory = 'spot',
  onRemove,
  className = ''
}: SimpleTradingWidgetProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(defaultSymbol);
  const [selectedCategory, setSelectedCategory] = useState<'spot' | 'linear'>(defaultCategory);
  const [view, setView] = useState<'quick' | 'orderbook' | 'settings'>('quick');
  
  // Configuración de sensibilidad
  const [signalSensitivity, setSignalSensitivity] = useState([3]); // 1=muy sensible, 5=muy conservador
  const [liquiditySensitivity, setLiquiditySensitivity] = useState([3]); // 1=muy permisivo, 5=muy estricto

  // Historial de liquidez para promedios
  const [liquidityHistory, setLiquidityHistory] = useState<Array<{
    timestamp: number;
    totalVolume: number;
    bidVolume: number;
    askVolume: number;
    spread: number;
  }>>([]);

  const { orderBook, loading, error, lastUpdate, refresh } = useOrderBook({
    symbol: selectedSymbol,
    category: selectedCategory,
    limit: 20,
    refreshInterval: 3000
  });

  // Funciones de formato
  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 100) return price.toFixed(3);
    if (price >= 10) return price.toFixed(4);
    if (price >= 1) return price.toFixed(5);
    return price.toFixed(6);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toFixed(1);
  };

  // Análisis con sensibilidad configurable
  const analysis = useMemo((): QuickAnalysis | null => {
    if (!orderBook || !orderBook.bids.length || !orderBook.asks.length) return null;

    const bids = orderBook.bids.slice(0, 15);
    const asks = orderBook.asks.slice(0, 15);
    
    const bestBid = parseFloat(bids[0].price);
    const bestAsk = parseFloat(asks[0].price);
    const spread = bestAsk - bestBid;
    const midPrice = (bestBid + bestAsk) / 2;
    const spreadPercent = (spread / midPrice) * 100;

    // Calcular volúmenes
    const totalBidVolume = bids.reduce((sum, bid) => sum + parseFloat(bid.size), 0);
    const totalAskVolume = asks.reduce((sum, ask) => sum + parseFloat(ask.size), 0);
    const totalVolume = totalBidVolume + totalAskVolume;

    // Calcular promedios de 5 minutos usando el historial actual
    const calculateAverages = () => {
      if (liquidityHistory.length === 0) {
        return {
          totalVolume5min: totalVolume,
          bidVolume5min: totalBidVolume,
          askVolume5min: totalAskVolume,
          spread5min: spreadPercent,
          spreadPercent5min: spreadPercent
        };
      }

      const sum = liquidityHistory.reduce((acc, entry) => ({
        totalVolume: acc.totalVolume + entry.totalVolume,
        bidVolume: acc.bidVolume + entry.bidVolume,
        askVolume: acc.askVolume + entry.askVolume,
        spread: acc.spread + entry.spread
      }), { totalVolume: 0, bidVolume: 0, askVolume: 0, spread: 0 });

      const count = liquidityHistory.length;
      return {
        totalVolume5min: sum.totalVolume / count,
        bidVolume5min: sum.bidVolume / count,
        askVolume5min: sum.askVolume / count,
        spread5min: sum.spread / count,
        spreadPercent5min: sum.spread / count
      };
    };

    const averages = calculateAverages();

    // Calcular tendencias
    const calculateTrends = () => {
      if (liquidityHistory.length < 10) {
        return {
          volumeTrend: 'estable' as const,
          spreadTrend: 'estable' as const,
          volumeChange: 0,
          spreadChange: 0
        };
      }

      // Comparar últimos 10 vs anteriores 10
      const recent = liquidityHistory.slice(-10);
      const previous = liquidityHistory.slice(-20, -10);

      if (previous.length === 0) {
        return {
          volumeTrend: 'estable' as const,
          spreadTrend: 'estable' as const,
          volumeChange: 0,
          spreadChange: 0
        };
      }

      const recentAvgVolume = recent.reduce((sum, entry) => sum + entry.totalVolume, 0) / recent.length;
      const previousAvgVolume = previous.reduce((sum, entry) => sum + entry.totalVolume, 0) / previous.length;
      const volumeChange = ((recentAvgVolume - previousAvgVolume) / previousAvgVolume) * 100;

      const recentAvgSpread = recent.reduce((sum, entry) => sum + entry.spread, 0) / recent.length;
      const previousAvgSpread = previous.reduce((sum, entry) => sum + entry.spread, 0) / previous.length;
      const spreadChange = ((recentAvgSpread - previousAvgSpread) / previousAvgSpread) * 100;

      return {
        volumeTrend: volumeChange > 5 ? 'subiendo' as const : volumeChange < -5 ? 'bajando' as const : 'estable' as const,
        spreadTrend: spreadChange > 10 ? 'ampliando' as const : spreadChange < -10 ? 'estrechando' as const : 'estable' as const,
        volumeChange,
        spreadChange
      };
    };

    const trends = calculateTrends();

    // Calcular calidad de liquidez
    const calculateQuality = () => {
      let score = 0;
      let reasons = [];

      // Volumen total (40% del score)
      if (totalVolume > 1000) {
        score += 40;
        reasons.push('volumen excelente');
      } else if (totalVolume > 500) {
        score += 30;
        reasons.push('buen volumen');
      } else if (totalVolume > 200) {
        score += 20;
        reasons.push('volumen moderado');
      } else {
        score += 10;
        reasons.push('volumen bajo');
      }

      // Spread (30% del score)
      if (spreadPercent < 0.01) {
        score += 30;
        reasons.push('spread excelente');
      } else if (spreadPercent < 0.03) {
        score += 25;
        reasons.push('spread bueno');
      } else if (spreadPercent < 0.05) {
        score += 15;
        reasons.push('spread aceptable');
      } else {
        score += 5;
        reasons.push('spread amplio');
      }

      // Balance (20% del score)
      const volumeRatio = totalBidVolume / totalAskVolume;
      const balance = Math.abs(volumeRatio - 1);
      if (balance < 0.2) {
        score += 20;
        reasons.push('bien balanceado');
      } else if (balance < 0.5) {
        score += 15;
        reasons.push('moderadamente balanceado');
      } else {
        score += 5;
        reasons.push('desbalanceado');
      }

      // Estabilidad (10% del score)
      if (Math.abs(trends.volumeChange) < 10 && Math.abs(trends.spreadChange) < 15) {
        score += 10;
        reasons.push('estable');
      } else {
        score += 5;
        reasons.push('volátil');
      }

      let level: 'excelente' | 'buena' | 'regular' | 'pobre' | 'muy_pobre';
      if (score >= 85) level = 'excelente';
      else if (score >= 70) level = 'buena';
      else if (score >= 50) level = 'regular';
      else if (score >= 30) level = 'pobre';
      else level = 'muy_pobre';

      return {
        score,
        level,
        reason: reasons.join(', ')
      };
    };

    const quality = calculateQuality();
    
    // Criterios de liquidez basados en sensibilidad
    const liquidityThresholds = {
      1: { minSide: 50, maxSpread: 0.1, minTotal: 150 },   // Muy permisivo
      2: { minSide: 100, maxSpread: 0.07, minTotal: 250 }, // Permisivo
      3: { minSide: 200, maxSpread: 0.05, minTotal: 500 }, // Normal
      4: { minSide: 300, maxSpread: 0.03, minTotal: 750 }, // Estricto
      5: { minSide: 500, maxSpread: 0.02, minTotal: 1000 } // Muy estricto
    };
    
    const liqThreshold = liquidityThresholds[liquiditySensitivity[0] as keyof typeof liquidityThresholds];
    const liquidityGood = totalBidVolume > liqThreshold.minSide && 
                         totalAskVolume > liqThreshold.minSide && 
                         spreadPercent < liqThreshold.maxSpread && 
                         totalVolume > liqThreshold.minTotal;

    // Detectar órdenes grandes
    const avgBidSize = totalBidVolume / bids.length;
    const avgAskSize = totalAskVolume / asks.length;
    
    const bidWalls = bids
      .filter(bid => parseFloat(bid.size) > avgBidSize * 4)
      .map(bid => ({ price: parseFloat(bid.price), size: parseFloat(bid.size) }))
      .slice(0, 2);

    const askWalls = asks
      .filter(ask => parseFloat(ask.size) > avgAskSize * 4)
      .map(ask => ({ price: parseFloat(ask.price), size: parseFloat(ask.size) }))
      .slice(0, 2);

    // Balance mejorado y más claro
    const volumeRatio = totalBidVolume / totalAskVolume;
    const ratioDeviation = Math.abs(volumeRatio - 1);
    
    // Determinar lado dominante y porcentaje
    let dominantSide: 'compradores' | 'vendedores' | 'equilibrado';
    let dominancePercent: number;
    
    if (volumeRatio > 1.1) {
      dominantSide = 'compradores';
      dominancePercent = ((volumeRatio - 1) * 100);
    } else if (volumeRatio < 0.9) {
      dominantSide = 'vendedores';
      dominancePercent = ((1 - volumeRatio) * 100);
    } else {
      dominantSide = 'equilibrado';
      dominancePercent = 0;
    }
    
    // Clasificar la fuerza del desequilibrio
    let balanceStrength: 'equilibrado' | 'leve' | 'moderado' | 'fuerte' | 'extremo';
    if (ratioDeviation < 0.1) balanceStrength = 'equilibrado';
    else if (ratioDeviation < 0.3) balanceStrength = 'leve';
    else if (ratioDeviation < 0.6) balanceStrength = 'moderado';
    else if (ratioDeviation < 1.0) balanceStrength = 'fuerte';
    else balanceStrength = 'extremo';

    // Umbrales de señal basados en sensibilidad
    const signalThresholds = {
      1: { buyRatio: 1.2, sellRatio: 0.8, maxSpread: 0.05, minStrength: 'leve' },     // Muy sensible
      2: { buyRatio: 1.4, sellRatio: 0.7, maxSpread: 0.04, minStrength: 'moderado' }, // Sensible
      3: { buyRatio: 2.0, sellRatio: 0.5, maxSpread: 0.02, minStrength: 'fuerte' },   // Normal
      4: { buyRatio: 2.5, sellRatio: 0.4, maxSpread: 0.015, minStrength: 'fuerte' },  // Conservador
      5: { buyRatio: 3.0, sellRatio: 0.33, maxSpread: 0.01, minStrength: 'extremo' }  // Muy conservador
    };
    
    const sigThreshold = signalThresholds[signalSensitivity[0] as keyof typeof signalThresholds];
    
    let signal: TradingSignal;

    // Verificar si el balance cumple el mínimo requerido
    const strengthLevels = ['equilibrado', 'leve', 'moderado', 'fuerte', 'extremo'];
    const currentStrengthIndex = strengthLevels.indexOf(balanceStrength);
    const requiredStrengthIndex = strengthLevels.indexOf(sigThreshold.minStrength);
    const strengthRequirementMet = currentStrengthIndex >= requiredStrengthIndex;

    if (volumeRatio > sigThreshold.buyRatio && liquidityGood && spreadPercent < sigThreshold.maxSpread && strengthRequirementMet) {
      signal = {
        type: 'buy',
        strength: volumeRatio > sigThreshold.buyRatio * 1.5 ? 'strong' : 'medium',
        reason: `Presión de compra ${balanceStrength} (${dominancePercent.toFixed(0)}% más compradores)`,
        confidence: Math.min(80, 40 + (volumeRatio - 1) * 20)
      };
    } else if (volumeRatio < sigThreshold.sellRatio && liquidityGood && spreadPercent < sigThreshold.maxSpread && strengthRequirementMet) {
      signal = {
        type: 'sell',
        strength: volumeRatio < sigThreshold.sellRatio * 0.7 ? 'strong' : 'medium',
        reason: `Presión de venta ${balanceStrength} (${dominancePercent.toFixed(0)}% más vendedores)`,
        confidence: Math.min(80, 40 + (1 - volumeRatio) * 20)
      };
    } else if (!liquidityGood) {
      signal = {
        type: 'neutral',
        strength: 'weak',
        reason: `Liquidez insuficiente (${formatVolume(totalVolume)} total, requiere ${formatVolume(liqThreshold.minTotal)})`,
        confidence: 20
      };
    } else if (spreadPercent > sigThreshold.maxSpread) {
      signal = {
        type: 'neutral',
        strength: 'weak',
        reason: `Spread amplio (${spreadPercent.toFixed(3)}%) - Costos altos`,
        confidence: 25
      };
    } else {
      const balanceText = balanceStrength === 'equilibrado' ? 'perfecto' : 
                         balanceStrength === 'leve' ? 'casi equilibrado' : 
                         `desequilibrio ${balanceStrength}`;
      signal = {
        type: 'neutral',
        strength: 'weak',
        reason: `Mercado ${balanceText} - Esperar señal más clara`,
        confidence: Math.max(30, 50 - ratioDeviation * 30)
      };
    }

    return {
      bestBid,
      bestAsk,
      spread,
      spreadPercent,
      signal,
      liquidityGood,
      bigOrders: { bidWalls, askWalls },
      liquidityDetails: {
        totalVolume,
        bidVolume: totalBidVolume,
        askVolume: totalAskVolume,
        volumeRatio,
        balanceStrength,
        dominantSide,
        dominancePercent
      },
      liquidityMetrics: {
        current: {
          totalVolume,
          bidVolume: totalBidVolume,
          askVolume: totalAskVolume,
          spread,
          spreadPercent
        },
        averages,
        trends,
        quality
      }
    };
  }, [orderBook, signalSensitivity, liquiditySensitivity, liquidityHistory]);

  // useEffect para actualizar el historial de liquidez
  useEffect(() => {
    if (!analysis) return;

    const now = Date.now();
    const newEntry = {
      timestamp: now,
      totalVolume: analysis.liquidityMetrics.current.totalVolume,
      bidVolume: analysis.liquidityMetrics.current.bidVolume,
      askVolume: analysis.liquidityMetrics.current.askVolume,
      spread: analysis.liquidityMetrics.current.spreadPercent
    };

    // Mantener solo los últimos 5 minutos (100 entradas aprox)
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    
    setLiquidityHistory(prev => {
      // Verificar si ya tenemos una entrada muy reciente para evitar duplicados
      const lastEntry = prev[prev.length - 1];
      if (lastEntry && (now - lastEntry.timestamp) < 2000) {
        return prev; // No agregar si la última entrada es muy reciente
      }

      const updated = [...prev, newEntry].filter(entry => entry.timestamp > fiveMinutesAgo);
      return updated;
    });
  }, [analysis?.liquidityMetrics.current.totalVolume, analysis?.liquidityMetrics.current.spreadPercent]);

  const getSignalColor = (signal: TradingSignal) => {
    if (signal.type === 'buy') return 'text-green-600 bg-green-100 dark:bg-green-900/20 border-green-300';
    if (signal.type === 'sell') return 'text-red-600 bg-red-100 dark:bg-red-900/20 border-red-300';
    return 'text-gray-600 bg-gray-100 dark:bg-gray-800 border-gray-300';
  };

  const getSignalIcon = (signal: TradingSignal) => {
    if (signal.type === 'buy') return <TrendingUp className="w-5 h-5" />;
    if (signal.type === 'sell') return <TrendingDown className="w-5 h-5" />;
    return <Target className="w-5 h-5" />;
  };

  const getSignalText = (signal: TradingSignal) => {
    if (signal.type === 'buy') return `COMPRAR (${signal.strength.toUpperCase()})`;
    if (signal.type === 'sell') return `VENDER (${signal.strength.toUpperCase()})`;
    return 'ESPERAR';
  };

  const getDominanceColor = (side: string) => {
    if (side === 'compradores') return 'text-green-600 bg-green-100';
    if (side === 'vendedores') return 'text-red-600 bg-red-100';
    return 'text-blue-600 bg-blue-100';
  };

  const getSensitivityLabel = (value: number, type: 'signal' | 'liquidity') => {
    const labels = {
      signal: ['Muy Sensible', 'Sensible', 'Normal', 'Conservador', 'Muy Conservador'],
      liquidity: ['Muy Permisivo', 'Permisivo', 'Normal', 'Estricto', 'Muy Estricto']
    };
    return labels[type][value - 1];
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Trading Quick</span>
            <Badge variant="outline" className="ml-2">
              {selectedSymbol}
            </Badge>
            {analysis && analysis.signal.type !== 'neutral' && (
              <Badge className={`ml-2 ${getSignalColor(analysis.signal)}`}>
                {analysis.signal.confidence}% confianza
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            
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
            <TabsList className="grid w-full grid-cols-3 mx-4 mb-2" style={{ width: 'calc(100% - 2rem)' }}>
              <TabsTrigger value="quick" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Análisis
              </TabsTrigger>
              <TabsTrigger value="orderbook" className="text-xs">
                <Target className="w-3 h-3 mr-1" />
                Order Book
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">
                <Settings className="w-3 h-3 mr-1" />
                Config
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quick" className="mt-4 px-4 space-y-4">
              {/* Señal principal */}
              <div className={`p-4 rounded-lg border-2 ${getSignalColor(analysis.signal)}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getSignalIcon(analysis.signal)}
                    <span className="font-bold text-xl">{getSignalText(analysis.signal)}</span>
                  </div>
                  {analysis.signal.type !== 'neutral' && (
                    <span className="text-lg font-bold">{analysis.signal.confidence}%</span>
                  )}
                </div>
                <p className="text-sm leading-relaxed">{analysis.signal.reason}</p>
              </div>

              {/* Precios clave */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Mejor Compra</div>
                  <div className="font-mono text-lg font-bold text-green-600">
                    ${formatPrice(analysis.bestBid)}
                  </div>
                </div>
                
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Spread</div>
                  <div className="font-mono text-lg font-bold text-blue-600">
                    {analysis.spreadPercent.toFixed(3)}%
                  </div>
                </div>
                
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Mejor Venta</div>
                  <div className="font-mono text-lg font-bold text-red-600">
                    ${formatPrice(analysis.bestAsk)}
                  </div>
                </div>
              </div>

              {/* Liquidez detallada */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Liquidez:</span>
                    <Badge className={analysis.liquidityGood ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {analysis.liquidityGood ? '✅ Excelente' : '⚠️ Insuficiente'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Score de Calidad</div>
                    <div className={`text-sm font-bold ${
                      analysis.liquidityMetrics.quality.score >= 80 ? 'text-green-600' :
                      analysis.liquidityMetrics.quality.score >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {analysis.liquidityMetrics.quality.score}/100
                    </div>
                  </div>
                </div>

                {/* Métricas actuales vs promedio */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-600">Actual:</h5>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-mono">{formatVolume(analysis.liquidityMetrics.current.totalVolume)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Compradores:</span>
                        <span className="font-mono text-green-600">{formatVolume(analysis.liquidityMetrics.current.bidVolume)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vendedores:</span>
                        <span className="font-mono text-red-600">{formatVolume(analysis.liquidityMetrics.current.askVolume)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Spread:</span>
                        <span className="font-mono">{analysis.liquidityMetrics.current.spreadPercent.toFixed(3)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-600">Promedio 5min:</h5>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-mono">{formatVolume(analysis.liquidityMetrics.averages.totalVolume5min)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Compradores:</span>
                        <span className="font-mono text-green-600">{formatVolume(analysis.liquidityMetrics.averages.bidVolume5min)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vendedores:</span>
                        <span className="font-mono text-red-600">{formatVolume(analysis.liquidityMetrics.averages.askVolume5min)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Spread:</span>
                        <span className="font-mono">{analysis.liquidityMetrics.averages.spreadPercent5min.toFixed(3)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tendencias */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Tendencias:</h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span>Volumen:</span>
                      <div className="flex items-center space-x-1">
                        <span className={`${
                          analysis.liquidityMetrics.trends.volumeTrend === 'subiendo' ? 'text-green-600' :
                          analysis.liquidityMetrics.trends.volumeTrend === 'bajando' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {analysis.liquidityMetrics.trends.volumeTrend === 'subiendo' ? '📈' :
                           analysis.liquidityMetrics.trends.volumeTrend === 'bajando' ? '📉' : '➡️'}
                        </span>
                        <span className="font-mono">
                          {analysis.liquidityMetrics.trends.volumeChange > 0 ? '+' : ''}
                          {analysis.liquidityMetrics.trends.volumeChange.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Spread:</span>
                      <div className="flex items-center space-x-1">
                        <span className={`${
                          analysis.liquidityMetrics.trends.spreadTrend === 'estrechando' ? 'text-green-600' :
                          analysis.liquidityMetrics.trends.spreadTrend === 'ampliando' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {analysis.liquidityMetrics.trends.spreadTrend === 'estrechando' ? '📉' :
                           analysis.liquidityMetrics.trends.spreadTrend === 'ampliando' ? '📈' : '➡️'}
                        </span>
                        <span className="font-mono">
                          {analysis.liquidityMetrics.trends.spreadChange > 0 ? '+' : ''}
                          {analysis.liquidityMetrics.trends.spreadChange.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calidad detallada */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300">Análisis de Calidad:</h5>
                    <Badge variant="outline" className={`text-xs ${
                      analysis.liquidityMetrics.quality.level === 'excelente' ? 'border-green-500 text-green-700' :
                      analysis.liquidityMetrics.quality.level === 'buena' ? 'border-blue-500 text-blue-700' :
                      analysis.liquidityMetrics.quality.level === 'regular' ? 'border-yellow-500 text-yellow-700' :
                      'border-red-500 text-red-700'
                    }`}>
                      {analysis.liquidityMetrics.quality.level}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                    {analysis.liquidityMetrics.quality.reason}
                  </p>
                </div>
              </div>

              {/* Balance del mercado simplificado */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-medium">Balance del mercado:</span>
                <Badge className={getDominanceColor(analysis.liquidityDetails.dominantSide)}>
                  {analysis.liquidityDetails.dominantSide === 'equilibrado' 
                    ? 'Equilibrado' 
                    : `${analysis.liquidityDetails.dominancePercent.toFixed(0)}% más ${analysis.liquidityDetails.dominantSide}`
                  }
                </Badge>
              </div>

              {/* Órdenes grandes solo si existen */}
              {(analysis.bigOrders.bidWalls.length > 0 || analysis.bigOrders.askWalls.length > 0) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    🛡️ Órdenes Grandes Detectadas:
                  </h4>
                  <div className="space-y-1 text-xs">
                    {analysis.bigOrders.bidWalls.map((wall, i) => (
                      <div key={i} className="flex items-center justify-between text-green-600 p-2 bg-green-50 dark:bg-green-900/10 rounded">
                        <span>💚 Soporte: ${formatPrice(wall.price)}</span>
                        <span className="font-mono">{formatVolume(wall.size)}</span>
                      </div>
                    ))}
                    {analysis.bigOrders.askWalls.map((wall, i) => (
                      <div key={i} className="flex items-center justify-between text-red-600 p-2 bg-red-50 dark:bg-red-900/10 rounded">
                        <span>❤️ Resistencia: ${formatPrice(wall.price)}</span>
                        <span className="font-mono">{formatVolume(wall.size)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="mt-4 px-4 space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Settings className="w-4 h-4 mr-1" />
                  Configuración de Sensibilidad
                </h4>
                
                {/* Sensibilidad de señales */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Sensibilidad de Señales:</label>
                    <Badge variant="outline" className="text-xs">
                      {getSensitivityLabel(signalSensitivity[0], 'signal')}
                    </Badge>
                  </div>
                  <input
                    type="range"
                    value={signalSensitivity[0]}
                    onChange={(e) => setSignalSensitivity([parseInt(e.target.value)])}
                    max={5}
                    min={1}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Muy Sensible</span>
                    <span>Muy Conservador</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {signalSensitivity[0] === 1 && "Señales frecuentes, más ruido pero no te pierdes oportunidades"}
                    {signalSensitivity[0] === 2 && "Señales moderadamente frecuentes, buen balance"}
                    {signalSensitivity[0] === 3 && "Configuración equilibrada, señales solo cuando hay claridad"}
                    {signalSensitivity[0] === 4 && "Señales conservadoras, menos ruido pero puede perder algunas oportunidades"}
                    {signalSensitivity[0] === 5 && "Solo señales muy claras, mínimo ruido pero muy selectivo"}
                  </p>
                </div>

                {/* Sensibilidad de liquidez */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Sensibilidad de Liquidez:</label>
                    <Badge variant="outline" className="text-xs">
                      {getSensitivityLabel(liquiditySensitivity[0], 'liquidity')}
                    </Badge>
                  </div>
                  <input
                    type="range"
                    value={liquiditySensitivity[0]}
                    onChange={(e) => setLiquiditySensitivity([parseInt(e.target.value)])}
                    max={5}
                    min={1}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Muy Permisivo</span>
                    <span>Muy Estricto</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {liquiditySensitivity[0] === 1 && "Acepta liquidez baja, útil para altcoins o mercados pequeños"}
                    {liquiditySensitivity[0] === 2 && "Requisitos moderados de liquidez"}
                    {liquiditySensitivity[0] === 3 && "Configuración estándar, buena liquidez requerida"}
                    {liquiditySensitivity[0] === 4 && "Requisitos altos de liquidez, solo mercados muy líquidos"}
                    {liquiditySensitivity[0] === 5 && "Máxima exigencia, solo para los mercados más líquidos"}
                  </p>
                </div>

                {/* Información actual */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <h5 className="text-sm font-medium mb-2">Configuración Actual:</h5>
                  <div className="text-xs space-y-1">
                    <p>• Señales: {getSensitivityLabel(signalSensitivity[0], 'signal')}</p>
                    <p>• Liquidez: {getSensitivityLabel(liquiditySensitivity[0], 'liquidity')}</p>
                    <p className="text-gray-500 mt-2">Los cambios se aplican inmediatamente</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="orderbook" className="mt-4">
              <div className="px-2">
                <div className="flex items-center justify-between py-2 px-2 text-xs font-medium text-gray-500 border-b">
                  <span>Precio</span>
                  <span>Volumen</span>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {/* Asks (Vendedores) */}
                  <div className="space-y-0">
                    {orderBook?.asks.slice(0, 10).reverse().map((entry, index) => (
                      <div key={`ask-${index}`} className="flex items-center justify-between py-1 px-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                        <span className="font-mono text-red-600 dark:text-red-400">
                          {formatPrice(parseFloat(entry.price))}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatVolume(parseFloat(entry.size))}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Spread */}
                  <div className="flex items-center justify-center py-2 px-4 bg-blue-50 dark:bg-blue-900/20 border-y my-1">
                    <div className="text-center">
                      <div className="font-mono text-xs text-blue-600 dark:text-blue-400">
                        Spread: ${formatPrice(analysis.spread)} ({analysis.spreadPercent.toFixed(3)}%)
                      </div>
                    </div>
                  </div>

                  {/* Bids (Compradores) */}
                  <div className="space-y-0">
                    {orderBook?.bids.slice(0, 10).map((entry, index) => (
                      <div key={`bid-${index}`} className="flex items-center justify-between py-1 px-2 text-xs hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors">
                        <span className="font-mono text-green-600 dark:text-green-400">
                          {formatPrice(parseFloat(entry.price))}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
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
            Cargando datos de trading...
          </div>
        )}
      </CardContent>
    </Card>
  );
} 