"use client";

import { useEffect, useRef } from 'react';

interface TradingViewWidget {
  widget: {
    new (config: {
      container_id: string;
      symbol: string;
      interval: string;
      timezone: string;
      theme: string;
      style: string;
      locale: string;
      toolbar_bg: string;
      enable_publishing: boolean;
      hide_side_toolbar: boolean;
      allow_symbol_change: boolean;
      save_image: boolean;
      studies: string[];
      show_popup_button: boolean;
      popup_width: string;
      popup_height: string;
      height: string;
      width: string;
    }): TradingViewChartInstance;
  };
}

interface TradingViewChartInstance {
  options: {
    symbol: string;
    theme: string;
    interval: string;
  };
  iframe: HTMLIFrameElement;
}

declare global {
  interface Window {
    TradingView: TradingViewWidget;
  }
}

interface TradingViewChartProps {
  symbol: string;
  theme?: 'light' | 'dark';
}

export default function TradingViewChart({ symbol, theme = 'light' }: TradingViewChartProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (container.current && window.TradingView) {
        new window.TradingView.widget({
          container_id: container.current.id,
          symbol: symbol,
          interval: '1',
          timezone: 'Etc/UTC',
          theme: theme,
          style: '1',
          locale: 'es',
          toolbar_bg: theme === 'light' ? '#f4f4f5' : '#27272a',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          save_image: false,
          studies: [
            'MASimple@tv-basicstudies',
            'RSI@tv-basicstudies',
            'MACD@tv-basicstudies'
          ],
          show_popup_button: true,
          popup_width: '1000',
          popup_height: '650',
          height: '100%',
          width: '100%',
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [symbol, theme]);

  return (
    <div className="w-full h-full">
      <div
        id="tradingview_widget"
        ref={container}
        className="w-full h-full"
      />
    </div>
  );
} 