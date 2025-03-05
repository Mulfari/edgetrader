"use client";

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import TradingViewChart from '@/components/TradingViewChart';

interface SubAccount {
  id: string;
  name: string;
  balance: number;
  exchange: string;
}

export default function NewOperation() {
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [marketType, setMarketType] = useState<'spot' | 'futures'>('spot');
  const [selectedSubAccounts, setSelectedSubAccounts] = useState<string[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Detectar el tema cuando el componente se monta (client-side)
  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  // Datos de ejemplo - En producción vendrían de una API
  const availablePairs = [
    'BTC/USDT',
    'ETH/USDT',
    'SOL/USDT',
    'BNB/USDT',
    'ADA/USDT'
  ];

  const subAccounts: SubAccount[] = [
    { id: '1', name: 'Principal', balance: 10000, exchange: 'Binance' },
    { id: '2', name: 'Trading', balance: 5000, exchange: 'Binance' },
    { id: '3', name: 'Largo Plazo', balance: 15000, exchange: 'Kraken' }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/operations"
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
                Nueva Operación
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors">
                Cancelar
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors">
                Crear Operación
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Panel Superior */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Selector de Par */}
            <div className="relative">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Par de Trading
              </label>
              <div className="relative">
                <select
                  value={selectedPair}
                  onChange={(e) => setSelectedPair(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 text-base border-zinc-300 dark:border-zinc-600 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  {availablePairs.map((pair) => (
                    <option key={pair} value={pair}>{pair}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                </div>
              </div>
            </div>

            {/* Selector de Mercado */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Tipo de Mercado
              </label>
              <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg p-1">
                <button
                  onClick={() => setMarketType('spot')}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    marketType === 'spot'
                      ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Spot
                </button>
                <button
                  onClick={() => setMarketType('futures')}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    marketType === 'futures'
                      ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Futuros
                </button>
              </div>
            </div>

            {/* Selector de Subcuentas */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Subcuentas
              </label>
              <div className="relative">
                <select
                  multiple
                  value={selectedSubAccounts}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedSubAccounts(values);
                  }}
                  className="w-full pl-3 pr-10 py-2 text-base border-zinc-300 dark:border-zinc-600 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  {subAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - ${account.balance.toLocaleString()} ({account.exchange})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panel del Gráfico */}
          <div className="lg:col-span-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-4">
            <TradingViewChart 
              symbol={selectedPair.replace('/', '')} 
              theme={theme}
            />
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Formulario de Operación */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-4">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">
                Detalles de la Operación
              </h3>
              
              {/* Tipo de Orden */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Tipo de Orden
                </label>
                <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg p-1">
                  <button className="flex-1 px-3 py-1.5 text-sm font-medium rounded-md bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm">
                    Compra
                  </button>
                  <button className="flex-1 px-3 py-1.5 text-sm font-medium rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                    Venta
                  </button>
                </div>
              </div>

              {/* Precio */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Precio
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full pl-3 pr-10 py-2 text-base border-zinc-300 dark:border-zinc-600 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-3">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">USDT</span>
                  </div>
                </div>
              </div>

              {/* Cantidad */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Cantidad
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full pl-3 pr-10 py-2 text-base border-zinc-300 dark:border-zinc-600 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-3">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">BTC</span>
                  </div>
                </div>
              </div>

              {marketType === 'futures' && (
                <>
                  {/* Apalancamiento */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Apalancamiento
                    </label>
                    <select className="w-full pl-3 pr-10 py-2 text-base border-zinc-300 dark:border-zinc-600 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">
                      <option>1x</option>
                      <option>2x</option>
                      <option>5x</option>
                      <option>10x</option>
                      <option>20x</option>
                      <option>50x</option>
                      <option>100x</option>
                    </select>
                  </div>

                  {/* Precio de Liquidación */}
                  <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-rose-600 dark:text-rose-400">Precio de Liquidación</span>
                      <span className="font-medium text-rose-700 dark:text-rose-300">$25,420.65</span>
                    </div>
                  </div>
                </>
              )}

              {/* Stop Loss y Take Profit */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Stop Loss (opcional)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full pl-3 pr-10 py-2 text-base border-zinc-300 dark:border-zinc-600 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      placeholder="0.00"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-3">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">USDT</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Take Profit (opcional)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full pl-3 pr-10 py-2 text-base border-zinc-300 dark:border-zinc-600 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      placeholder="0.00"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-3">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">USDT</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Book de Órdenes */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-4">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">
                Book de Órdenes
              </h3>
              <div className="space-y-2">
                {/* Ejemplo de órdenes */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-600 dark:text-emerald-400">28,450.00</span>
                  <span className="text-zinc-600 dark:text-zinc-400">0.5421 BTC</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-600 dark:text-emerald-400">28,449.50</span>
                  <span className="text-zinc-600 dark:text-zinc-400">0.3215 BTC</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-rose-600 dark:text-rose-400">28,448.80</span>
                  <span className="text-zinc-600 dark:text-zinc-400">0.8932 BTC</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-rose-600 dark:text-rose-400">28,448.20</span>
                  <span className="text-zinc-600 dark:text-zinc-400">1.2451 BTC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 