'use client';

import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInvestmentAllocation, useInvestmentSummary } from '@/hooks/use-api';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#eab308'];

const TYPE_LABELS: Record<string, string> = {
  MUTUAL_FUND: 'Mutual Funds',
  STOCK: 'Stocks',
  ETF: 'ETFs',
  GOLD: 'Gold',
};

export function InvestmentAllocationWidget({ currency = 'INR' }: { currency?: string }) {
  const { data: allocation, isLoading: loadingAlloc } = useInvestmentAllocation();
  const { data: summary, isLoading: loadingSummary } = useInvestmentSummary();

  if (loadingAlloc || loadingSummary) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
      </Card>
    );
  }

  const chartData =
    allocation?.allocation.map((a) => ({
      name: TYPE_LABELS[a.type] || a.type,
      value: a.value,
    })) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Investment Allocation</CardTitle>
        <Link href="/investments" className="text-sm text-primary hover:underline">View all</Link>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No investments tracked</p>
        ) : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={120}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value">
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1">
              {summary && (
                <p className="text-lg font-bold">{formatCurrency(summary.totalCurrent, currency)}</p>
              )}
              {summary && (
                <p className={`text-xs ${summary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.totalGainLoss >= 0 ? '+' : ''}
                  {formatCurrency(summary.totalGainLoss, currency)} (
                  {summary.gainLossPercent.toFixed(1)}%)
                </p>
              )}
              {chartData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
