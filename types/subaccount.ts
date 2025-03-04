export interface SubAccount {
  id: string;
  userId: string;
  name: string;
  balance: number;
  type: 'demo' | 'real';
  exchange: string;
  status: 'active' | 'inactive';
  isDemo: boolean;
  performance: number;
  createdAt: string;
  updatedAt: string;
}

export interface AccountDetails {
  balance: number | null;
  assets: Array<{
    symbol: string;
    quantity: number;
    value: number;
  }>;
  performance: number;
  isError: boolean;
  error?: string;
  isSimulated: boolean;
  isDemo: boolean;
}

export interface AccountStats {
  totalAccounts: number;
  realAccounts: number;
  demoAccounts: number;
  totalBalance: number;
  realBalance: number;
  demoBalance: number;
  uniqueExchanges: number;
  avgPerformance: number;
} 