export interface OrderBookLevel3Entry {
  price: string;
  size: string;
  side: 'buy' | 'sell';
  id?: string;
}

export interface OrderBookLevel3 {
  symbol: string;
  bids: OrderBookLevel3Entry[];
  asks: OrderBookLevel3Entry[];
  timestamp: number;
  updateId?: number;
}

export interface OrderBookSpread {
  spread: number;
  spreadPercent: number;
  midPrice: number;
}

export interface MarketTicker {
  symbol: string;
  price: string;
  change: string;
  volume: string;
  high24h: string;
  low24h: string;
  bidPrice: string;
  askPrice: string;
}

export interface OrderBookSnapshot {
  symbol: string;
  bids: [string, string][];
  asks: [string, string][];
  timestamp: number;
  updateId: number;
}

// Nuevos tipos para los widgets
export interface LongShortRatioData {
  symbol: string;
  buyRatio: string;
  sellRatio: string;
  timestamp: string;
}

export interface OpenInterestData {
  symbol: string;
  openInterest: string;
  timestamp: string;
}

export interface VolumeData {
  symbol: string;
  timestamp: string;
  volume: string;
  turnover: string;
  openPrice: string;
  closePrice: string;
  highPrice: string;
  lowPrice: string;
}

export interface LiquidationSummary {
  symbol: string;
  longLiquidations24h: string;
  shortLiquidations24h: string;
  totalLiquidations24h: string;
  lastUpdate: number;
}

export interface LiquidationData {
  symbol: string;
  side: 'Buy' | 'Sell';
  size: string;
  price: string;
  time: number;
}

// Tipos para configuración de widgets
export interface WidgetTimeframe {
  label: string;
  value: string;
  minutes: number;
}

export interface LongShortAnalysis {
  currentRatio: {
    long: number;
    short: number;
  };
  trend: 'bullish' | 'bearish' | 'neutral';
  strength: 'weak' | 'moderate' | 'strong';
  recommendation: string;
}

export interface VolumeAnalysis {
  currentVolume: number;
  averageVolume: number;
  volumeRatio: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  strength: 'low' | 'normal' | 'high' | 'extreme';
}

export interface OpenInterestAnalysis {
  currentOI: number;
  previousOI: number;
  change: number;
  changePercent: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  interpretation: string;
} 