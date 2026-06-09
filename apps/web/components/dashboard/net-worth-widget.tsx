'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNetWorth, useNetWorthHistory, useCashFlow } from '@/hooks/use-api';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function NetWorthWidget({ currency = 'USD' }: { currency?: string }) {
  const { data: current, isLoading: loadingCurrent } = useNetWorth();
  const { data: history, isLoading: loadingHistory } = useNetWorthHistory();

  if (loadingCurrent || loadingHistory) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const netWorth = current?.netWorth || 0;
  const isPositive = netWorth >= 0;

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Net Worth</CardTitle>
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-3xl font-bold">{formatCurrency(netWorth, currency)}</p>
          <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
            <span>Assets: {formatCurrency(current?.assetsTotal || 0, currency)}</span>
            <span>Liabilities: {formatCurrency(current?.liabilitiesTotal || 0, currency)}</span>
          </div>
        </div>
        {history?.history && history.history.length > 0 && (
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={history.history.slice(-30)}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(d) =>
                  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }
              />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
              <Line
                type="monotone"
                dataKey="netWorth"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function CashFlowWidget({ currency = 'USD' }: { currency?: string }) {
  const { data: cashFlow, isLoading } = useCashFlow();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Monthly Cash Flow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Income</span>
          <span className="font-medium text-green-600">
            +{formatCurrency(cashFlow?.income || 0, currency)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Expenses</span>
          <span className="font-medium text-red-600">
            -{formatCurrency(cashFlow?.expenses || 0, currency)}
          </span>
        </div>
        <div className="border-t pt-3 flex justify-between">
          <span className="text-sm font-medium">Net</span>
          <span
            className={`font-bold ${(cashFlow?.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {formatCurrency(cashFlow?.netCashFlow || 0, currency)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
