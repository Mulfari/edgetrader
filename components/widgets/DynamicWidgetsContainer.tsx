"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, LayoutGrid } from 'lucide-react';
import dynamic from 'next/dynamic';
import SimpleTradingWidget from './SimpleTradingWidget';
import LongShortRatioWidget from './LongShortRatioWidget';
import VolumeAnalysisWidget from './VolumeAnalysisWidget';
import RealTimeLongShortWidget from './RealTimeLongShortWidget';
import DataCollectionControlWidget from './DataCollectionControlWidget';

// Importar MarketTimesWidget dinámicamente para evitar errores de hidratación
const MarketTimesWidget = dynamic(() => import('./MarketTimesWidget'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
      <span className="text-gray-500">Cargando horarios de mercado...</span>
    </div>
  )
});

interface Widget {
  id: string;
  type: 'trading' | 'market-times' | 'long-short-ratio' | 'volume-analysis' | 'realtime-long-short' | 'data-control';
  symbol?: string;
  category?: 'spot' | 'linear';
}

const POPULAR_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT',
  'DOGEUSDT', 'LINKUSDT', 'UNIUSDT', 'AVAXUSDT', 'MATICUSDT'
];

export default function DynamicWidgetsContainer() {
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: 'data-control', type: 'data-control' },
    { id: 'market-times', type: 'market-times' },
    { id: 'trading-1', type: 'trading', symbol: 'BTCUSDT', category: 'spot' },
    { id: 'trading-2', type: 'trading', symbol: 'ETHUSDT', category: 'linear' }
  ]);

  const [newWidgetType, setNewWidgetType] = useState<'trading' | 'long-short-ratio' | 'volume-analysis' | 'realtime-long-short' | 'data-control'>('trading');
  const [newWidgetSymbol, setNewWidgetSymbol] = useState('BTCUSDT');
  const [newWidgetCategory, setNewWidgetCategory] = useState<'spot' | 'linear'>('spot');

  const addWidget = () => {
    let newWidget: Widget;
    if (newWidgetType === 'trading') {
      newWidget = {
        id: `trading-${Date.now()}`,
        type: 'trading',
        symbol: newWidgetSymbol,
        category: newWidgetCategory
      };
    } else if (newWidgetType === 'long-short-ratio') {
      newWidget = {
        id: `longshort-${Date.now()}`,
        type: 'long-short-ratio',
        symbol: newWidgetSymbol
      };
    } else if (newWidgetType === 'realtime-long-short') {
      newWidget = {
        id: `realtime-longshort-${Date.now()}`,
        type: 'realtime-long-short',
        symbol: newWidgetSymbol
      };
    } else if (newWidgetType === 'data-control') {
      newWidget = {
        id: `data-control-${Date.now()}`,
        type: 'data-control'
      };
    } else {
      newWidget = {
        id: `volume-${Date.now()}`,
        type: 'volume-analysis',
        symbol: newWidgetSymbol
      };
    }
    setWidgets(prev => [...prev, newWidget]);
  };

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== id));
  };

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'data-control':
        return (
          <div key={widget.id} className="col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-1">
            <DataCollectionControlWidget />
          </div>
        );
      case 'market-times':
        return (
          <div key={widget.id} className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
            <MarketTimesWidget />
          </div>
        );
      case 'trading':
        return (
          <div key={widget.id} className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2">
            <SimpleTradingWidget 
              defaultSymbol={widget.symbol}
              defaultCategory={widget.category}
              onRemove={() => removeWidget(widget.id)}
            />
          </div>
        );
      case 'long-short-ratio':
        return (
          <div key={widget.id} className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2">
            <LongShortRatioWidget 
              defaultSymbol={widget.symbol}
              onRemove={() => removeWidget(widget.id)}
            />
          </div>
        );
      case 'realtime-long-short':
        return (
          <div key={widget.id} className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2">
            <RealTimeLongShortWidget 
              defaultSymbol={widget.symbol}
              onRemove={() => removeWidget(widget.id)}
            />
          </div>
        );
      case 'volume-analysis':
        return (
          <div key={widget.id} className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2">
            <VolumeAnalysisWidget 
              defaultSymbol={widget.symbol}
              onRemove={() => removeWidget(widget.id)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const totalAnalysisWidgets = widgets.filter(w => 
    w.type === 'trading' || 
    w.type === 'long-short-ratio' || 
    w.type === 'volume-analysis' || 
    w.type === 'realtime-long-short'
  ).length;

  return (
    <div className="space-y-4 my-6">
      {/* Control para agregar widgets */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg gap-2 md:gap-0">
        <div className="flex items-center space-x-2">
          <LayoutGrid className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Widgets de Análisis ({totalAnalysisWidgets})
          </span>
        </div>
        <div className="flex flex-wrap items-center space-x-2 gap-2">
          <Select value={newWidgetType} onValueChange={(value) => setNewWidgetType(value as 'trading' | 'long-short-ratio' | 'volume-analysis' | 'realtime-long-short' | 'data-control')}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trading">Widget de Trading</SelectItem>
              <SelectItem value="long-short-ratio">Long/Short Ratio (5min)</SelectItem>
              <SelectItem value="realtime-long-short">Long/Short Tiempo Real ⚡</SelectItem>
              <SelectItem value="volume-analysis">Análisis de Volumen</SelectItem>
              <SelectItem value="data-control">Control de Colección de Datos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={newWidgetSymbol} onValueChange={setNewWidgetSymbol}>
            <SelectTrigger className="w-32">
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
          {newWidgetType === 'trading' && (
            <Select value={newWidgetCategory} onValueChange={(value: 'spot' | 'linear') => setNewWidgetCategory(value)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spot">Spot</SelectItem>
                <SelectItem value="linear">Futures</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button onClick={addWidget} size="sm" className="flex items-center space-x-1">
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </Button>
        </div>
      </div>
      {/* Grid de widgets */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {widgets.map(renderWidget)}
      </div>
      {/* Mensaje cuando no hay widgets de análisis */}
      {totalAnalysisWidgets === 0 && (
        <div className="text-center py-8 text-gray-500">
          <LayoutGrid className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No hay widgets de análisis</p>
          <p className="text-sm mb-4">Agrega un widget para empezar a analizar el mercado</p>
          <Button onClick={addWidget} className="flex items-center space-x-2 mx-auto">
            <Plus className="w-4 h-4" />
            <span>Agregar Widget</span>
          </Button>
        </div>
      )}
    </div>
  );
} 