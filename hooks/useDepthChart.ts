import { useMemo } from 'react';
import { OrderBookLevel3, OrderBookLevel3Entry } from '@/types/market';

export interface DepthChartData {
  price: number;
  cumulativeVolume: number;
  side: 'bid' | 'ask';
}

export interface OrderLadderEntry extends OrderBookLevel3Entry {
  volumePercentage: number;
  cumulativeVolume: number;
}

export interface VWAPData {
  bidVWAP: number;
  askVWAP: number;
  midPrice: number;
  spread: number;
  spreadPercentage: number;
}

export interface DepthChartProcessedData {
  bidDepthData: DepthChartData[];
  askDepthData: DepthChartData[];
  bidLadder: OrderLadderEntry[];
  askLadder: OrderLadderEntry[];
  vwapData: VWAPData | null;
  maxVolume: number;
  maxCumulativeVolume: number;
}

export function useDepthChart(orderBook: OrderBookLevel3 | null, maxEntries: number = 25): DepthChartProcessedData {
  return useMemo(() => {
    if (!orderBook || !orderBook.bids.length || !orderBook.asks.length) {
      return {
        bidDepthData: [],
        askDepthData: [],
        bidLadder: [],
        askLadder: [],
        vwapData: null,
        maxVolume: 0,
        maxCumulativeVolume: 0
      };
    }

    // Limitar las entradas para mejor rendimiento
    const limitedBids = orderBook.bids.slice(0, maxEntries);
    const limitedAsks = orderBook.asks.slice(0, maxEntries);

    // Calcular datos acumulativos para bids (de mayor a menor precio)
    let cumulativeBidVolume = 0;
    const bidDepthData: DepthChartData[] = limitedBids.map(bid => {
      cumulativeBidVolume += parseFloat(bid.size);
      return {
        price: parseFloat(bid.price),
        cumulativeVolume: cumulativeBidVolume,
        side: 'bid' as const
      };
    });

    // Calcular datos acumulativos para asks (de menor a mayor precio)
    let cumulativeAskVolume = 0;
    const askDepthData: DepthChartData[] = limitedAsks.map(ask => {
      cumulativeAskVolume += parseFloat(ask.size);
      return {
        price: parseFloat(ask.price),
        cumulativeVolume: cumulativeAskVolume,
        side: 'ask' as const
      };
    });

    // Encontrar el volumen máximo para normalización
    const allVolumes = [...limitedBids, ...limitedAsks].map(entry => parseFloat(entry.size));
    const maxVolume = Math.max(...allVolumes);
    const maxCumulativeVolume = Math.max(cumulativeBidVolume, cumulativeAskVolume);

    // Crear ladder entries con porcentajes
    const bidLadder: OrderLadderEntry[] = limitedBids.map((bid, index) => ({
      ...bid,
      volumePercentage: (parseFloat(bid.size) / maxVolume) * 100,
      cumulativeVolume: bidDepthData[index].cumulativeVolume
    }));

    const askLadder: OrderLadderEntry[] = limitedAsks.map((ask, index) => ({
      ...ask,
      volumePercentage: (parseFloat(ask.size) / maxVolume) * 100,
      cumulativeVolume: askDepthData[index].cumulativeVolume
    }));

    // Calcular VWAP (Volume Weighted Average Price)
    const calculateVWAP = (entries: OrderBookLevel3Entry[]): number => {
      let totalValue = 0;
      let totalVolume = 0;
      
      entries.forEach(entry => {
        const price = parseFloat(entry.price);
        const volume = parseFloat(entry.size);
        totalValue += price * volume;
        totalVolume += volume;
      });
      
      return totalVolume > 0 ? totalValue / totalVolume : 0;
    };

    const bidVWAP = calculateVWAP(limitedBids);
    const askVWAP = calculateVWAP(limitedAsks);
    const midPrice = (bidVWAP + askVWAP) / 2;
    
    const bestBid = parseFloat(limitedBids[0]?.price || '0');
    const bestAsk = parseFloat(limitedAsks[0]?.price || '0');
    const spread = bestAsk - bestBid;
    const spreadPercentage = midPrice > 0 ? (spread / midPrice) * 100 : 0;

    const vwapData: VWAPData = {
      bidVWAP,
      askVWAP,
      midPrice,
      spread,
      spreadPercentage
    };

    return {
      bidDepthData,
      askDepthData,
      bidLadder,
      askLadder,
      vwapData,
      maxVolume,
      maxCumulativeVolume
    };
  }, [orderBook, maxEntries]);
} 