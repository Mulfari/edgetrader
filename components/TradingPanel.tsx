'use client';

import React from 'react';
import { useInstruments } from '@/hooks/useInstruments';

interface SubAccount {
  id: string;
  name: string;
  created_at: string;
  api_key: string;
  secret_key: string;
  is_demo: boolean;
  balance: {
    btc: number;
    usdt: number;
    eth?: number;
    [key: string]: number | undefined;
  };
}

interface MarketTicker {
  symbol: string;
  price: string;
  change: string;
  high24h: string;
  low24h: string;
  volume24h?: string;
  volumeUSDT?: string;
  favorite?: boolean;
}

interface TradingPanelProps {
  // Estados del trading
  side: 'buy' | 'sell';
  setSide: (side: 'buy' | 'sell') => void;
  orderType: 'limit' | 'market';
  setOrderType: (type: 'limit' | 'market') => void;
  price: string;
  setPrice: (price: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  leverage: string;
  setLeverage: (leverage: string) => void;
  total: string;
  marketType: 'spot' | 'perpetual';
  selectedPair: MarketTicker;
  isLoading: boolean;
  selectedSubAccount: string | null;
  subAccounts: SubAccount[];

  // Funciones
  adjustPrice: (increment: boolean) => void;
  adjustAmount: (increment: boolean) => void;
  setAmountPercentage: (percentage: number) => void;
  getAvailableBalance: (assetType: 'base' | 'quote') => string;
  getBestPrice: (orderSide: 'buy' | 'sell') => string;
  formatNumber: (value: number | string) => string;
  calculateRisk: () => number;
  calculateRiskPercentage: () => number;
  calculateTotal: () => string;
  executeOrder: () => void;

  // Precios para los botones rápidos
  bestBidPrice: string;
  bestAskPrice: string;
}

export default function TradingPanel({
  // Estados
  side,
  setSide,
  orderType,
  setOrderType,
  price,
  setPrice,
  amount,
  setAmount,
  leverage,
  setLeverage,
  total,
  marketType,
  selectedPair,
  isLoading,
  selectedSubAccount,
  subAccounts,
  
  // Funciones
  adjustPrice,
  adjustAmount,
  setAmountPercentage,
  getAvailableBalance,
  getBestPrice,
  formatNumber,
  calculateRisk,
  calculateRiskPercentage,
  calculateTotal,
  executeOrder,
  
  // Precios
  bestBidPrice,
  bestAskPrice
}: TradingPanelProps) {

  // Obtener la subcuenta seleccionada
  const currentSubAccount = subAccounts.find(acc => acc.id === selectedSubAccount);
  
  // Determinar si es demo basado en la subcuenta seleccionada
  const isDemoAccount = currentSubAccount?.is_demo || false;

  // Hook para obtener información de instrumentos de Bybit
  const { 
    instruments, 
    isLoading: instrumentsLoading, 
    error: instrumentsError,
    getLeverageOptions, 
    getMaxLeverage 
  } = useInstruments('bybit', isDemoAccount);

  // Obtener opciones de apalancamiento para la moneda actual
  const currentLeverageOptions = getLeverageOptions(selectedPair.symbol);
  const maxLeverage = getMaxLeverage(selectedPair.symbol);
  
  // Validar que el apalancamiento actual sea válido
  const validateLeverage = (currentLeverage: string): string => {
    const leverageNum = parseInt(currentLeverage);
    
    if (!currentLeverageOptions.includes(leverageNum)) {
      // Si el apalancamiento actual no es válido, usar el primer valor disponible
      return currentLeverageOptions[0]?.toString() || '1';
    }
    
    return currentLeverage;
  };

  const validatedLeverage = validateLeverage(leverage);
  
  // Si el apalancamiento cambió, actualizarlo
  React.useEffect(() => {
    if (validatedLeverage !== leverage && currentLeverageOptions.length > 0) {
      setLeverage(validatedLeverage);
    }
  }, [selectedPair.symbol, leverage, validatedLeverage, setLeverage, currentLeverageOptions]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      {/* Header con Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex">
          <button 
            onClick={() => setSide('buy')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              side === 'buy'
                ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400 bg-green-50 dark:bg-green-950'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400'
            }`}
          >
            Comprar
          </button>
          <button 
            onClick={() => setSide('sell')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              side === 'sell'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-950'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400'
            }`}
          >
            Vender
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Tipo de Orden */}
        <div className="flex text-xs">
          <button 
            onClick={() => setOrderType('limit')}
            className={`px-3 py-1 rounded-l-md transition-colors ${
              orderType === 'limit'
                ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Límite
          </button>
          <button 
            onClick={() => setOrderType('market')}
            className={`px-3 py-1 rounded-r-md transition-colors ${
              orderType === 'market'
                ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Mercado
          </button>
        </div>

        {/* Campos de entrada */}
        <div className="space-y-3">
          {/* Precio */}
          {orderType === 'limit' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-zinc-500 dark:text-zinc-400">Precio</label>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">≈ {getBestPrice(side)}</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-2 text-xs text-zinc-400">USDT</span>
              </div>
            </div>
          )}

          {/* Cantidad */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-zinc-500 dark:text-zinc-400">Cantidad</label>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                Disp: {getAvailableBalance(side === 'buy' ? 'quote' : 'base')} {side === 'buy' ? 'USDT' : selectedPair.symbol}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
              <span className="absolute right-3 top-2 text-xs text-zinc-400">{selectedPair.symbol}</span>
            </div>
            {/* Porcentajes */}
            <div className="grid grid-cols-4 gap-1 mt-2">
              {[25, 50, 75, 100].map((percentage) => (
                <button 
                  key={percentage}
                  onClick={() => setAmountPercentage(percentage)}
                  className="py-1 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                >
                  {percentage}%
                </button>
              ))}
            </div>
          </div>

          {/* Apalancamiento (solo futuros) */}
          {marketType === 'perpetual' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-zinc-500 dark:text-zinc-400">
                  Apalancamiento
                  {instrumentsLoading && <span className="ml-1 text-blue-500">•</span>}
                </label>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {validatedLeverage}x / máx {maxLeverage}x
                </span>
              </div>
              
              {instrumentsError && (
                <div className="text-xs text-red-500 mb-2">
                  Error: {instrumentsError}
                </div>
              )}
              
              <div className="grid grid-cols-4 gap-1">
                {currentLeverageOptions.slice(0, 8).map((value) => (
                  <button 
                    key={value}
                    onClick={() => setLeverage(value.toString())}
                    disabled={instrumentsLoading}
                    className={`py-1 text-xs rounded transition-colors disabled:opacity-50 ${
                      validatedLeverage === value.toString()
                        ? 'bg-blue-500 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {value}x
                  </button>
                ))}
              </div>
              {currentLeverageOptions.length > 8 && (
                <div className="grid grid-cols-4 gap-1 mt-1">
                  {currentLeverageOptions.slice(8).map((value) => (
                    <button 
                      key={value}
                      onClick={() => setLeverage(value.toString())}
                      disabled={instrumentsLoading}
                      className={`py-1 text-xs rounded transition-colors disabled:opacity-50 ${
                        validatedLeverage === value.toString()
                          ? 'bg-blue-500 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {value}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Total */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-zinc-500 dark:text-zinc-400">Total</label>
            </div>
            <div className="relative">
              <input
                type="number"
                value={total}
                readOnly
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-500 dark:text-zinc-400"
                placeholder="0.00"
              />
              <span className="absolute right-3 top-2 text-xs text-zinc-400">USDT</span>
            </div>
          </div>
        </div>

        {/* Info compacta */}
        <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
          <div className="flex justify-between">
            <span>Costo aprox.</span>
            <span>{formatNumber(calculateRisk())} USDT</span>
          </div>
          {calculateRiskPercentage() > 0 && (
            <div className="flex justify-between">
              <span>% del balance</span>
              <span className={calculateRiskPercentage() > 20 ? 'text-red-500' : calculateRiskPercentage() > 10 ? 'text-yellow-500' : 'text-green-500'}>
                {calculateRiskPercentage().toFixed(1)}%
              </span>
            </div>
          )}
          {currentSubAccount && (
            <div className="flex justify-between">
              <span>Subcuenta:</span>
              <span className="truncate max-w-[100px]">{currentSubAccount.name}</span>
            </div>
          )}
        </div>

        {/* Botón de orden */}
        <button
          onClick={executeOrder}
          disabled={isLoading || !selectedSubAccount}
          className={`w-full py-3 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            side === 'buy'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Procesando...
            </div>
          ) : (
            `${side === 'buy' ? 'Comprar' : 'Vender'} ${selectedPair.symbol}`
          )}
        </button>

        {!selectedSubAccount && (
          <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
            Selecciona una subcuenta para operar
          </p>
        )}
      </div>
    </div>
  );
} 