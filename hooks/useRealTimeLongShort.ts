import { useState, useEffect, useRef, useCallback } from 'react';

interface BybitTrade {
  T: number;        // timestamp en ms
  s: string;        // símbolo
  S: string;        // lado del taker: "Buy" | "Sell"
  v: string;        // tamaño del trade
  p: string;        // precio del trade
  L: string;        // dirección del tick: "PlusTick" | "MinusTick" | "ZeroTick"
  i: string;        // trade ID
  BT: boolean;      // es trade de bloque
}

interface BybitTradeData {
  topic: string;
  type: string;
  ts: number;
  data: BybitTrade[];
}

interface VolumeData {
  buyVolume: number;
  sellVolume: number;
  totalVolume: number;
  buyRatio: number;
  sellRatio: number;
  trades: number;
  timestamp: number;
  currentPrice: number; // Precio actual en tiempo real
  buyVolumeUSD: number; // Volumen de compra en USD
  sellVolumeUSD: number; // Volumen de venta en USD
  totalVolumeUSD: number; // Volumen total en USD
}

interface RealTimeLongShortData {
  current: VolumeData;
  history: VolumeData[];
  isConnected: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export const useRealTimeLongShort = (symbol: string = 'BTCUSDT', windowSizeSeconds: number = 60) => {
  const [data, setData] = useState<RealTimeLongShortData>({
    current: {
      buyVolume: 0,
      sellVolume: 0,
      totalVolume: 0,
      buyRatio: 0.5,
      sellRatio: 0.5,
      trades: 0,
      timestamp: Date.now(),
      currentPrice: 0,
      buyVolumeUSD: 0,
      sellVolumeUSD: 0,
      totalVolumeUSD: 0
    },
    history: [],
    isConnected: false,
    error: null,
    lastUpdate: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const tradesRef = useRef<{ price: number; volume: number; timestamp: number; side: 'buy' | 'sell' }[]>([]);
  const currentPriceRef = useRef<number>(0); // Referencia para el precio actual
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Función para determinar si un trade es compra o venta basado en datos de Bybit
  const determineTradeSide = (trade: BybitTrade): 'buy' | 'sell' => {
    // El campo S indica el lado del taker (quien ejecuta la orden)
    // Buy = alguien compró (presión alcista/long)
    // Sell = alguien vendió (presión bajista/short)
    return trade.S === 'Buy' ? 'buy' : 'sell';
  };

  // Función para calcular métricas de volumen
  const calculateVolumeMetrics = useCallback((): VolumeData => {
    const now = Date.now();
    const windowStart = now - (windowSizeSeconds * 1000);
    
    // Filtrar trades dentro de la ventana de tiempo
    const recentTrades = tradesRef.current.filter(trade => trade.timestamp >= windowStart);
    
    let buyVolume = 0;
    let sellVolume = 0;
    let buyTrades = 0;
    let sellTrades = 0;
    let buyVolumeUSD = 0;
    let sellVolumeUSD = 0;

    recentTrades.forEach(trade => {
      const volumeUSD = trade.volume * trade.price; // Volumen en USD
      
      if (trade.side === 'buy') {
        buyVolume += trade.volume;
        buyVolumeUSD += volumeUSD;
        buyTrades++;
      } else {
        sellVolume += trade.volume;
        sellVolumeUSD += volumeUSD;
        sellTrades++;
      }
    });

    const totalVolume = buyVolume + sellVolume;
    const totalVolumeUSD = buyVolumeUSD + sellVolumeUSD;
    const buyRatio = totalVolume > 0 ? buyVolume / totalVolume : 0.5;
    const sellRatio = totalVolume > 0 ? sellVolume / totalVolume : 0.5;

    return {
      buyVolume,
      sellVolume,
      totalVolume,
      buyRatio,
      sellRatio,
      trades: recentTrades.length,
      timestamp: now,
      currentPrice: currentPriceRef.current,
      buyVolumeUSD,
      sellVolumeUSD,
      totalVolumeUSD
    };
  }, [windowSizeSeconds]);

  // Función para conectar al WebSocket
  const connect = useCallback(() => {
    try {
      const wsUrl = 'wss://stream.bybit.com/v5/public/linear';
      console.log('🔗 Conectando a Bybit WebSocket:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket conectado a Bybit');
        
        // Suscribirse al stream de trades públicos
        const subscribeMessage = {
          op: 'subscribe',
          args: [`publicTrade.${symbol}`]
        };
        
        console.log('📡 Enviando suscripción:', subscribeMessage);
        wsRef.current?.send(JSON.stringify(subscribeMessage));
        
        setData(prev => ({ ...prev, isConnected: true, error: null }));
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Ignorar mensajes de confirmación de suscripción
          if (message.success !== undefined) {
            console.log('✅ Suscripción confirmada:', message);
            return;
          }

          // Procesar datos de trades
          if (message.topic && message.topic.startsWith('publicTrade.') && message.data) {
            const tradeData: BybitTradeData = message;
            
            console.log('📊 Trades recibidos:', tradeData.data.length);
            
            tradeData.data.forEach((trade: BybitTrade) => {
              const side = determineTradeSide(trade);
              const volume = parseFloat(trade.v); // v = volumen
              const price = parseFloat(trade.p);  // p = precio
              const timestamp = trade.T;          // T = timestamp

              // Actualizar precio actual con el trade más reciente
              currentPriceRef.current = price;

              // Agregar trade al array
              tradesRef.current.push({
                price,
                volume,
                timestamp,
                side
              });

              // Mantener solo trades de los últimos 5 minutos para eficiencia
              const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
              tradesRef.current = tradesRef.current.filter(t => t.timestamp >= fiveMinutesAgo);
            });

            // Actualizar métricas inmediatamente
            const metrics = calculateVolumeMetrics();
            setData(prev => ({
              ...prev,
              current: metrics,
              lastUpdate: new Date()
            }));
          }
        } catch (error) {
          console.error('❌ Error procesando mensaje WebSocket:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
        setData(prev => ({ 
          ...prev, 
          isConnected: false, 
          error: 'Error de conexión WebSocket' 
        }));
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket desconectado:', event.code, event.reason);
        setData(prev => ({ ...prev, isConnected: false }));
        
        // Intentar reconectar automáticamente
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Backoff exponencial
          
          console.log(`🔄 Reintentando conexión en ${delay/1000}s (intento ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setData(prev => ({ 
            ...prev, 
            error: 'No se pudo reconectar después de varios intentos' 
          }));
        }
      };

    } catch (error) {
      console.error('❌ Error creando WebSocket:', error);
      setData(prev => ({ 
        ...prev, 
        isConnected: false, 
        error: 'Error al crear conexión WebSocket' 
      }));
    }
  }, [symbol, calculateVolumeMetrics]);

  // Función para desconectar
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Función para reconectar manualmente
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttempts.current = 0;
    connect();
  }, [disconnect, connect]);

  // Efecto para manejar la conexión inicial y cleanup
  useEffect(() => {
    connect();
    
    // Intervalo para actualizar métricas y agregar al historial cada 5 segundos
    intervalRef.current = setInterval(() => {
      const metrics = calculateVolumeMetrics();
      
      setData(prev => {
        const newHistory = [...prev.history, metrics].slice(-120); // Mantener últimos 10 minutos (120 * 5s)
        
        return {
          ...prev,
          current: metrics,
          history: newHistory,
          lastUpdate: new Date()
        };
      });
    }, 5000);

    return () => {
      disconnect();
    };
  }, [symbol, connect, disconnect, calculateVolumeMetrics]);

  // Efecto para limpiar datos cuando cambia el símbolo
  useEffect(() => {
    tradesRef.current = [];
    currentPriceRef.current = 0; // Reset del precio actual
    setData(prev => ({
      ...prev,
      current: {
        buyVolume: 0,
        sellVolume: 0,
        totalVolume: 0,
        buyRatio: 0.5,
        sellRatio: 0.5,
        trades: 0,
        timestamp: Date.now(),
        currentPrice: 0,
        buyVolumeUSD: 0,
        sellVolumeUSD: 0,
        totalVolumeUSD: 0
      },
      history: []
    }));
  }, [symbol]);

  return {
    data: data.current,
    history: data.history,
    isConnected: data.isConnected,
    error: data.error,
    lastUpdate: data.lastUpdate,
    reconnect,
    disconnect
  };
}; 