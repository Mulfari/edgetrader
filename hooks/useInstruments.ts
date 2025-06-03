import { useState, useEffect } from 'react';

export interface Instrument {
  symbol: string;
  maxLeverage: string;
  contractType?: string;
  baseCoin?: string;
  quoteCoin?: string;
  tickSize?: string;
  minOrderQty?: string;
  lotSizeFilter?: {
    basePrecision: string;
    quotePrecision: string;
    minOrderQty: string;
    maxOrderQty: string;
  };
  priceFilter?: {
    minPrice: string;
    maxPrice: string;
    tickSize: string;
  };
}

interface UseInstrumentsResult {
  instruments: Instrument[];
  isLoading: boolean;
  error: string | null;
  getInstrumentBySymbol: (symbol: string) => Instrument | undefined;
  getLeverageOptions: (symbol: string) => number[];
  getMaxLeverage: (symbol: string) => number;
}

export function useInstruments(exchangeType: 'bybit' | 'binance' = 'bybit', isDemo: boolean = false): UseInstrumentsResult {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/exchange/instruments?exchangeType=${exchangeType}&isDemo=${isDemo}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch instruments');
        }

        setInstruments(data.data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching instruments:', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstruments();
  }, [exchangeType, isDemo]);

  // Función para obtener un instrumento específico por símbolo
  const getInstrumentBySymbol = (symbol: string): Instrument | undefined => {
    // Limpiar el símbolo para coincidencias
    const cleanSymbol = symbol.replace('USDT', '').replace('PERP', '');
    return instruments.find(inst => {
      const instCleanSymbol = inst.symbol.replace('USDT', '').replace('PERP', '');
      return instCleanSymbol === cleanSymbol || inst.symbol === symbol;
    });
  };

  // Función para generar opciones de apalancamiento basadas en el máximo
  const getLeverageOptions = (symbol: string): number[] => {
    const instrument = getInstrumentBySymbol(symbol);
    if (!instrument) {
      return [1, 2, 5, 10, 20]; // Default fallback
    }

    const maxLev = parseInt(instrument.maxLeverage);
    const options: number[] = [1];

    // Generar opciones basadas en el apalancamiento máximo
    const commonLeverages = [2, 5, 10, 20, 25, 50, 75, 100, 125];
    
    for (const lev of commonLeverages) {
      if (lev <= maxLev && !options.includes(lev)) {
        options.push(lev);
      }
    }

    // Si el máximo no está en la lista común, agregarlo
    if (!options.includes(maxLev)) {
      options.push(maxLev);
    }

    return options.sort((a, b) => a - b);
  };

  // Función para obtener el apalancamiento máximo
  const getMaxLeverage = (symbol: string): number => {
    const instrument = getInstrumentBySymbol(symbol);
    return instrument ? parseInt(instrument.maxLeverage) : 20;
  };

  return {
    instruments,
    isLoading,
    error,
    getInstrumentBySymbol,
    getLeverageOptions,
    getMaxLeverage
  };
} 