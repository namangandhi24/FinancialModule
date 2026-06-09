'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBudgetPerformance } from '@/hooks/use-api';
import { formatCurrency } from '@/lib/utils';

export function BudgetStatusWidget({ currency = 'INR' }: { currency?: string }) {
  const { data, isLoading } = useBudgetPerformance();

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
      </Card>
    );
  }

  const chartData =
    data?.items.slice(0, 5).map((item) => ({
      name: item.category?.name || 'Other',
      budget: item.budgetAmount,
      actual: item.actual,
    })) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Budget Status</CardTitle>
        {data && data.overBudgetCount > 0 && (
          <span className="text-xs text-destructive">{data.overBudgetCount} over budget</span>
        )}
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No budgets set this month</p>
        ) : (
          <>
            <div className="mb-4 flex justify-between text-sm">
              <span className="text-muted-foreground">
                Spent {formatCurrency(data?.totalSpent || 0, currency)} of{' '}
                {formatCurrency(data?.totalBudget || 0, currency)}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                <Legend />
                <Bar dataKey="budget" fill="hsl(var(--primary))" name="Budget" radius={2} />
                <Bar dataKey="actual" fill="hsl(var(--muted-foreground))" name="Actual" radius={2} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
