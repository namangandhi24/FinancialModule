'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTransactions } from '@/hooks/use-api';
import { formatCurrency, formatDate } from '@/lib/utils';

export function RecentTransactionsWidget({ currency = 'USD' }: { currency?: string }) {
  const { data, isLoading } = useTransactions({ limit: 5, page: 1 });

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const transactions = data?.items || [];

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Recent Transactions</CardTitle>
        <Link href="/transactions" className="text-sm text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: tx.category?.color || '#64748b' }}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {tx.merchantName || tx.category?.name || 'Transaction'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.date)} · {tx.account?.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-medium ${
                      tx.type === 'INCOME' ? 'text-green-600' : 'text-foreground'
                    }`}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(Number(tx.amount), tx.account?.currency || currency)}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {tx.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
