'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useGoals } from '@/hooks/use-api';
import { formatCurrency } from '@/lib/utils';

export function GoalProgressWidget({ currency = 'INR' }: { currency?: string }) {
  const { data: goals, isLoading } = useGoals();

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  const activeGoals = goals?.filter((g) => g.status === 'ACTIVE').slice(0, 3) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Goal Progress</CardTitle>
        <Link href="/goals" className="text-sm text-primary hover:underline">View all</Link>
      </CardHeader>
      <CardContent>
        {activeGoals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active goals</p>
        ) : (
          <div className="space-y-4">
            {activeGoals.map((goal) => (
              <div key={goal.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{goal.name}</span>
                  <Badge variant={goal.progress.onTrack ? 'secondary' : 'outline'}>
                    {goal.progress.progressPercent.toFixed(0)}%
                  </Badge>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, goal.progress.progressPercent)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(goal.currentSavings, goal.currency || currency)} /{' '}
                  {formatCurrency(goal.targetAmount, goal.currency || currency)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
