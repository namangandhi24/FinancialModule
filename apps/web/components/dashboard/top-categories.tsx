'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSpending } from '@/hooks/use-api';
import { formatCurrency } from '@/lib/utils';

export function TopCategoriesWidget({ currency = 'USD' }: { currency?: string }) {
  const { data, isLoading } = useSpending(5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Spending Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const categories = data?.categories || [];

  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Spending Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No spending data this month</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = categories.map((c) => ({
    name: c.name,
    value: c.total,
    color: c.color || '#64748b',
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Spending Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={160}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {categories.map((cat) => (
              <div key={cat.categoryId} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: cat.color || '#64748b' }}
                  />
                  <span>{cat.name}</span>
                </div>
                <span className="font-medium">{formatCurrency(cat.total, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
