"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart,
  Clock,
  Tag,
  Filter,
  Search,
  RefreshCw,
  Table,
  Grid,
  Info,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
  TooltipItem,
  Scale,
  CoreScaleOptions,
  ScriptableContext
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface Operation {
  id: string;
  type: 'buy' | 'sell';
  symbol: string;
  amount: number;
  price: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'cancelled';
  profit?: number;
  tags?: string[];
  notes?: string;
  exchange: string;
  accountId: string;
  accountName: string;
  fee?: number;
  leverage?: number;
  orderType: 'spot' | 'futures';
  position?: 'long' | 'short';
}

interface DashboardStats {
  totalOperations: number;
  totalProfit: number;
  successRate: number;
  bestOperation: Operation | null;
  worstOperation: Operation | null;
  monthlyVolume: number;
  weeklyOperations: number;
  averageProfit: number;
  totalFees: number;
  accountStats: {
    accountId: string;
    accountName: string;
    exchange: string;
    balance: number;
    unrealizedPnL: number;
    openPositions: number;
  }[];
}

// Componente para el gráfico de rendimiento
const PerformanceChart = ({ data }: { data: Operation[] }) => {
  const chartData = {
    labels: data.map(op => new Date(op.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: 'Beneficio Acumulado',
        data: data.reduce((acc, op, i) => {
          const prevValue = i > 0 ? acc[i - 1] : 0;
          acc.push(prevValue + (op.profit || 0));
          return acc;
        }, [] as number[]),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'white',
        pointHoverBorderColor: 'rgb(99, 102, 241)',
        pointHoverBorderWidth: 2
      },
      {
        label: 'Beneficio por Operación',
        data: data.map(op => op.profit || 0),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderDash: [5, 5],
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: 'white',
        pointHoverBorderColor: 'rgb(34, 197, 94)',
        pointHoverBorderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    plugins: {
      legend: { 
        display: true,
        position: 'top' as const,
        labels: {
          color: 'rgb(161, 161, 170)',
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: { 
        display: true, 
        text: 'Rendimiento Histórico',
        color: 'rgb(161, 161, 170)',
        font: {
          size: 16,
          weight: 'normal' as const
        },
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgb(24, 24, 27)',
        titleColor: 'rgb(244, 244, 245)',
        bodyColor: 'rgb(228, 228, 231)',
        bodyFont: {
          size: 14
        },
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        padding: 12,
        borderColor: 'rgb(63, 63, 70)',
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          label: function(context: TooltipItem<"line">) {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${value >= 0 ? '+' : ''}$${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'category' as const,
        grid: {
          display: false
        },
        ticks: {
          color: 'rgb(161, 161, 170)',
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11
          }
        },
        border: {
          display: false
        }
      },
      y: {
        type: 'linear' as const,
        grid: {
          color: 'rgba(161, 161, 170, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'rgb(161, 161, 170)',
          font: {
            size: 11
          },
          callback: function(value: number | string) {
            return '$' + Number(value).toLocaleString();
          }
        },
        border: {
          display: false
        }
      }
    }
  } as const;

  return (
    <div className="h-[300px] w-full">
      <Line data={chartData} options={options} />
    </div>
  );
};

// Componente para el gráfico de rendimiento por par
const ProfitBySymbolChart = ({ data }: { data: Operation[] }) => {
  const profitBySymbol = data.reduce((acc, op) => {
    if (!op.profit) return acc;
    acc[op.symbol] = (acc[op.symbol] || 0) + op.profit;
    return acc;
  }, {} as Record<string, number>);

  const sortedSymbols = Object.entries(profitBySymbol)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
    .slice(0, 5);

  const chartData = {
    labels: sortedSymbols.map(([symbol]) => symbol),
    datasets: [{
      data: sortedSymbols.map(([, profit]) => profit),
      backgroundColor: sortedSymbols.map(([, profit]) => 
        profit >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
      ),
      borderColor: sortedSymbols.map(([, profit]) => 
        profit >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
      ),
      borderWidth: 2,
      borderRadius: 4,
      maxBarThickness: 40
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Top 5 Pares por Rendimiento',
        color: 'rgb(161, 161, 170)',
        font: {
          size: 16,
          weight: 'normal' as const
        },
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgb(24, 24, 27)',
        titleColor: 'rgb(244, 244, 245)',
        bodyColor: 'rgb(228, 228, 231)',
        bodyFont: {
          size: 14
        },
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        padding: 12,
        borderColor: 'rgb(63, 63, 70)',
        borderWidth: 1,
        callbacks: {
          label: function(context: TooltipItem<"bar">) {
            const value = context.parsed.x;
            return `Beneficio: ${value >= 0 ? '+' : ''}$${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        beginAtZero: true,
        grid: {
          color: 'rgba(161, 161, 170, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'rgb(161, 161, 170)',
          font: {
            size: 11
          },
          callback: function(this: Scale<CoreScaleOptions>, tickValue: number | string) {
            return '$' + Number(tickValue).toLocaleString();
          }
        },
        border: {
          display: false
        }
      },
      y: {
        type: 'category' as const,
        grid: {
          display: false
        },
        ticks: {
          color: 'rgb(161, 161, 170)',
          font: {
            size: 12
          }
        },
        border: {
          display: false
        }
      }
    }
  } as const;

  return (
    <div className="h-[300px] w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
};

// Componente para el gráfico de rendimiento por cuenta
const AccountPerformanceChart = ({ data }: { data: Operation[] }) => {
  const performanceByAccount = data.reduce((acc, op) => {
    const key = `${op.exchange}-${op.accountName}`;
    if (!acc[key]) {
      acc[key] = {
        label: `${op.exchange} - ${op.accountName}`,
        data: []
      };
    }
    return acc;
  }, {} as Record<string, { label: string; data: number[] }>);

  // Agrupar operaciones por fecha y cuenta
  data.forEach(op => {
    const key = `${op.exchange}-${op.accountName}`;
    const date = new Date(op.timestamp).toLocaleDateString();
    performanceByAccount[key].data.push(op.profit || 0);
  });

  const chartData = {
    labels: Array.from(new Set(data.map(op => new Date(op.timestamp).toLocaleDateString()))),
    datasets: Object.values(performanceByAccount).map((account, index) => ({
      label: account.label,
      data: account.data,
      borderColor: [
        'rgb(99, 102, 241)',
        'rgb(34, 197, 94)',
        'rgb(234, 179, 8)',
        'rgb(239, 68, 68)',
      ][index % 4],
      backgroundColor: 'transparent',
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: 'white',
      pointBorderWidth: 2,
      pointHoverRadius: 6
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    plugins: {
      legend: { 
        display: true,
        position: 'top' as const,
        labels: {
          color: 'rgb(161, 161, 170)',
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: { 
        display: true, 
        text: 'Rendimiento por Cuenta',
        color: 'rgb(161, 161, 170)',
        font: {
          size: 16,
          weight: 'normal' as const
        },
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgb(24, 24, 27)',
        titleColor: 'rgb(244, 244, 245)',
        bodyColor: 'rgb(228, 228, 231)',
        bodyFont: { size: 14 },
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        padding: 12,
        borderColor: 'rgb(63, 63, 70)',
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          label: function(context: TooltipItem<"line">) {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${value >= 0 ? '+' : ''}$${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'category' as const,
        grid: { display: false },
        ticks: {
          color: 'rgb(161, 161, 170)',
          font: { size: 11 }
        },
        border: { display: false }
      },
      y: {
        type: 'linear' as const,
        beginAtZero: true,
        grid: {
          color: 'rgba(161, 161, 170, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'rgb(161, 161, 170)',
          font: { size: 11 },
          callback: function(this: Scale<CoreScaleOptions>, tickValue: number | string) {
            return '$' + Number(tickValue).toLocaleString();
          }
        },
        border: { display: false }
      }
    }
  } as const;

  return (
    <div className="h-[300px] w-full">
      <Line data={chartData} options={options} />
    </div>
  );
};

// Componente para mostrar el estado actual de las cuentas
const AccountStatusChart = ({ stats }: { stats: DashboardStats }) => {
  const chartData = {
    labels: stats.accountStats.map(acc => `${acc.exchange} - ${acc.accountName}`),
    datasets: [
      {
        label: 'Balance',
        data: stats.accountStats.map(acc => acc.balance),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
        borderRadius: 4,
        stack: 'combined'
      },
      {
        label: 'P&L No Realizado',
        data: stats.accountStats.map(acc => acc.unrealizedPnL),
        backgroundColor: (context: ScriptableContext<"bar">) => 
          Number(context.raw) > 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)',
        borderColor: (context: ScriptableContext<"bar">) => 
          Number(context.raw) > 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
        borderWidth: 2,
        borderRadius: 4,
        stack: 'combined'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: 'rgb(161, 161, 170)',
          usePointStyle: true
        }
      },
      title: {
        display: true,
        text: 'Estado Actual por Cuenta',
        color: 'rgb(161, 161, 170)',
        font: {
          size: 16,
          weight: 'normal' as const
        },
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgb(24, 24, 27)',
        titleColor: 'rgb(244, 244, 245)',
        bodyColor: 'rgb(228, 228, 231)',
        bodyFont: { size: 14 },
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        padding: 12,
        borderColor: 'rgb(63, 63, 70)',
        borderWidth: 1,
        callbacks: {
          label: function(context: TooltipItem<"bar">) {
            const value = context.raw as number;
            const label = context.dataset.label;
            return `${label}: ${value >= 0 ? '+' : ''}$${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        stacked: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(161, 161, 170, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'rgb(161, 161, 170)',
          font: { size: 11 },
          callback: function(this: Scale<CoreScaleOptions>, tickValue: number | string) {
            return '$' + Number(tickValue).toLocaleString();
          }
        },
        border: { display: false }
      },
      y: {
        type: 'category' as const,
        stacked: true,
        grid: { display: false },
        ticks: {
          color: 'rgb(161, 161, 170)',
          font: { size: 12 }
        },
        border: { display: false }
      }
    }
  } as const;

  return (
    <div className="h-[300px] w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default function Operations() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [dateRange, setDateRange] = useState('7d');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [view, setView] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    // Datos de ejemplo mejorados
    const mockOperations: Operation[] = [
      {
        id: '1',
        type: 'buy',
        symbol: 'BTC/USDT',
        amount: 0.5,
        price: 45000,
        timestamp: '2024-03-20T10:30:00',
        status: 'completed',
        profit: 1200,
        tags: ['swing', 'trend'],
        notes: 'Entrada en soporte fuerte',
        exchange: 'Binance',
        accountId: '1',
        accountName: 'Binance Spot Principal',
        orderType: 'spot',
        fee: 2.5
      },
      {
        id: '2',
        type: 'sell',
        symbol: 'ETH/USDT',
        amount: 2.5,
        price: 3200,
        timestamp: '2024-03-19T15:45:00',
        status: 'completed',
        profit: -300,
        tags: ['scalping'],
        notes: 'Salida por stop loss',
        exchange: 'Kraken',
        accountId: '2',
        accountName: 'Kraken Futures',
        orderType: 'futures',
        position: 'short',
        leverage: 5,
        fee: 1.8
      },
      {
        id: '3',
        type: 'buy',
        symbol: 'SOL/USDT',
        amount: 10,
        price: 125,
        timestamp: '2024-03-18T09:15:00',
        status: 'pending',
        tags: ['position'],
        notes: 'Esperando confirmación',
        exchange: 'Binance',
        accountId: '3',
        accountName: 'Binance Futures',
        orderType: 'futures',
        position: 'long',
        leverage: 10,
        fee: 0.5
      },
      {
        id: '4',
        type: 'sell',
        symbol: 'BNB/USDT',
        amount: 5,
        price: 420,
        timestamp: '2024-03-17T14:20:00',
        status: 'completed',
        profit: 850,
        tags: ['day-trade'],
        notes: 'Toma de beneficios',
        exchange: 'Binance',
        accountId: '1',
        accountName: 'Binance Spot Principal',
        orderType: 'spot',
        fee: 1.2
      },
      {
        id: '5',
        type: 'buy',
        symbol: 'ADA/USDT',
        amount: 1000,
        price: 0.65,
        timestamp: '2024-03-16T11:30:00',
        status: 'cancelled',
        tags: ['spot'],
        notes: 'Orden cancelada por volatilidad',
        exchange: 'Kraken',
        accountId: '4',
        accountName: 'Kraken Spot',
        orderType: 'spot',
        fee: 0
      }
    ];

    const mockStats: DashboardStats = {
      totalOperations: mockOperations.length,
      totalProfit: mockOperations.reduce((acc, op) => acc + (op.profit || 0), 0),
      successRate: 65,
      bestOperation: mockOperations.reduce<Operation | null>((best, op) => {
        if (!best) return op;
        return (op.profit || 0) > (best.profit || 0) ? op : best;
      }, null),
      worstOperation: mockOperations.reduce<Operation | null>((worst, op) => {
        if (!worst) return op;
        return (op.profit || 0) < (worst.profit || 0) ? op : worst;
      }, null),
      monthlyVolume: 125000,
      weeklyOperations: 12,
      averageProfit: 450,
      totalFees: mockOperations.reduce((acc, op) => acc + (op.fee || 0), 0),
      accountStats: [
        {
          accountId: '1',
          accountName: 'Binance Spot Principal',
          exchange: 'Binance',
          balance: 25000,
          unrealizedPnL: 1200,
          openPositions: 2
        },
        {
          accountId: '2',
          accountName: 'Kraken Futures',
          exchange: 'Kraken',
          balance: 15000,
          unrealizedPnL: -300,
          openPositions: 1
        },
        {
          accountId: '3',
          accountName: 'Binance Futures',
          exchange: 'Binance',
          balance: 20000,
          unrealizedPnL: 850,
          openPositions: 3
        },
        {
          accountId: '4',
          accountName: 'Kraken Spot',
          exchange: 'Kraken',
          balance: 10000,
          unrealizedPnL: 0,
          openPositions: 0
        }
      ]
    };

    setTimeout(() => {
      setOperations(mockOperations);
      setStats(mockStats);
      setIsLoading(false);
    }, 1000);
  }, []);

  const renderOperationCard = (operation: Operation) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      key={operation.id}
      className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              operation.type === 'buy' 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
            }`}>
              {operation.type === 'buy' ? 'Compra' : 'Venta'}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              operation.status === 'completed'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                : operation.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {operation.status === 'completed' ? 'Completada' : 
               operation.status === 'pending' ? 'Pendiente' : 'Cancelada'}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {operation.symbol}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {new Date(operation.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            <ExternalLink className="w-4 h-4" />
            {operation.exchange}
          </div>
          {operation.profit !== undefined && (
            <span className={`flex items-center mt-2 text-lg font-semibold ${
              operation.profit >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              {operation.profit >= 0 ? '+' : '-'}${Math.abs(operation.profit).toLocaleString()}
              {operation.profit >= 0 
                ? <TrendingUp className="ml-1 h-4 w-4" />
                : <TrendingDown className="ml-1 h-4 w-4" />
              }
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Precio</p>
          <p className="text-base font-medium text-zinc-900 dark:text-white">
            ${operation.price.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Cantidad</p>
          <p className="text-base font-medium text-zinc-900 dark:text-white">
            {operation.amount}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {operation.notes && (
          <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>{operation.notes}</p>
          </div>
        )}
        {operation.tags && operation.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {operation.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}
        {operation.fee !== undefined && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Comisión: ${operation.fee.toLocaleString()}
          </p>
        )}
      </div>
      
      <button className="mt-4 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-violet-500 hover:text-violet-600 bg-violet-50 dark:bg-violet-900/10 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-colors">
        Ver detalles
        <ChevronRight className="w-4 h-4 ml-1" />
      </button>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header mejorado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Dashboard de Operaciones
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Vista general del rendimiento y operaciones
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setView('table')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors inline-flex items-center gap-2 ${
                view === 'table'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Table className="w-4 h-4" />
              Tabla
            </button>
            <button
              onClick={() => setView('cards')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors inline-flex items-center gap-2 ${
                view === 'cards'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              Tarjetas
            </button>
          </div>
          <select
            className="px-3 py-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-sm border-0 focus:ring-2 focus:ring-violet-500"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
            <option value="all">Todo</option>
          </select>
          <button className="px-4 py-2 text-sm font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Nueva Operación
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Operaciones</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {isLoading ? '-' : stats?.totalOperations}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                <span className="text-emerald-500">+{stats?.weeklyOperations || 0}</span> esta semana
              </p>
            </div>
            <div className="p-2 bg-violet-500/10 rounded-lg">
              <LineChart className="w-6 h-6 text-violet-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Beneficio Total</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {isLoading ? '-' : `$${stats?.totalProfit.toLocaleString()}`}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Promedio: <span className="text-emerald-500">${stats?.averageProfit.toLocaleString()}</span>
              </p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {isLoading ? '-' : `${stats?.successRate}%`}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Operaciones completadas
              </p>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <PieChart className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Volumen Mensual</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {isLoading ? '-' : `$${stats?.monthlyVolume.toLocaleString()}`}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Comisiones: <span className="text-rose-500">${stats?.totalFees.toLocaleString()}</span>
              </p>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <BarChart className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gráficos y Análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm"
        >
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">
            Top 5 Pares por Rendimiento
          </h3>
          <ProfitBySymbolChart data={operations} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm"
        >
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">
            Rendimiento Histórico
          </h3>
          <PerformanceChart data={operations} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm"
        >
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">
            Rendimiento por Cuenta
          </h3>
          <AccountPerformanceChart data={operations} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm"
        >
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">
            Estado Actual por Cuenta
          </h3>
          {stats && <AccountStatusChart stats={stats} />}
        </motion.div>
      </div>

      {/* Filters mejorados */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
            Operaciones
          </h3>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar por símbolo, tipo, estado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white border-0 focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <select
                className="px-3 py-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white border-0 focus:ring-2 focus:ring-violet-500"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Todas las operaciones</option>
                <option value="completed">Completadas</option>
                <option value="pending">Pendientes</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <select
                className="px-3 py-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white border-0 focus:ring-2 focus:ring-violet-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date">Ordenar por fecha</option>
                <option value="amount">Ordenar por monto</option>
                <option value="profit">Ordenar por beneficio</option>
              </select>
            </div>

            <button 
              onClick={() => {
                setFilter('all');
                setSortBy('date');
                setSearchTerm('');
                setSelectedTags([]);
              }}
              className="px-3 py-2 text-sm text-violet-500 hover:text-violet-600 font-medium flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Limpiar filtros
            </button>
          </div>

          {/* Tags populares */}
          <div className="mt-4 flex flex-wrap gap-2">
            {['swing', 'scalping', 'position', 'day-trade', 'spot'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  if (selectedTags.includes(tag)) {
                    setSelectedTags(selectedTags.filter(t => t !== tag));
                  } else {
                    setSelectedTags([...selectedTags, tag]);
                  }
                }}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400'
                    : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                }`}
              >
                <Tag className="w-3 h-3" />
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Vista de operaciones con animaciones mejoradas */}
        <AnimatePresence mode="wait">
          {view === 'cards' ? (
            <motion.div
              key="cards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {isLoading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="col-span-full flex items-center justify-center py-12"
                  >
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Cargando operaciones...
                    </div>
                  </motion.div>
                ) : operations.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="col-span-full flex items-center justify-center py-12 text-zinc-500 dark:text-zinc-400"
                  >
                    No hay operaciones para mostrar
                  </motion.div>
                ) : (
                  operations.map(renderOperationCard)
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-x-auto"
            >
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Par
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Exchange
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Beneficio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Etiquetas
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Cargando operaciones...
                        </div>
                      </td>
                    </tr>
                  ) : operations.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        No hay operaciones para mostrar
                      </td>
                    </tr>
                  ) : (
                    operations.map((operation) => (
                      <tr key={operation.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                          {new Date(operation.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            operation.type === 'buy' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                          }`}>
                            {operation.type === 'buy' ? 'Compra' : 'Venta'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                          {operation.symbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                          {operation.exchange}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                          ${operation.price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                          {operation.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            operation.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : operation.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {operation.status === 'completed' ? 'Completada' : 
                             operation.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {operation.profit !== undefined && (
                            <span className={`flex items-center ${
                              operation.profit >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {operation.profit >= 0 ? '+' : '-'}${Math.abs(operation.profit).toLocaleString()}
                              {operation.profit >= 0 
                                ? <TrendingUp className="ml-1 h-4 w-4" />
                                : <TrendingDown className="ml-1 h-4 w-4" />
                              }
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-1">
                            {operation.tags?.map((tag) => (
                              <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Paginación mejorada */}
        <div className="px-6 py-3 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700">
              Anterior
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700">
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                Mostrando <span className="font-medium">1</span> a <span className="font-medium">5</span> de{' '}
                <span className="font-medium">20</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700">
                  Anterior
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700">
                  1
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700">
                  2
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700">
                  Siguiente
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}