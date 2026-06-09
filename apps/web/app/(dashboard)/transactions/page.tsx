'use client';

import { useState } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TransactionFormDialog } from '@/components/transactions/transaction-form';
import {
  useTransactions,
  useAccounts,
  useCategories,
  useDeleteTransaction,
  type Transaction,
} from '@/hooks/use-api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [accountFilter, setAccountFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const { data, isLoading } = useTransactions({
    page,
    limit: 20,
    ...(accountFilter && { accountId: accountFilter }),
    ...(typeFilter && { type: typeFilter }),
    ...(search && { search }),
  });
  const { data: accounts } = useAccounts();
  const deleteTx = useDeleteTransaction();

  const handleDelete = async (id: string) => {
    if (confirm('Delete this transaction?')) {
      await deleteTx.mutateAsync(id);
    }
  };

  return (
    <DashboardShell title="Transactions">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Input
          placeholder="Search merchant or notes..."
          className="max-w-xs"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select value={accountFilter} onValueChange={(v) => { setAccountFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {accounts?.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {['EXPENSE', 'INCOME', 'TRANSFER', 'INVESTMENT', 'LOAN_PAYMENT'].map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No transactions found. Add your first transaction to get started.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Merchant</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Account</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((tx) => (
                <tr key={tx.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm">{formatDate(tx.date)}</td>
                  <td className="px-4 py-3 text-sm font-medium">{tx.merchantName || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {tx.category ? (
                      <Badge variant="secondary" style={{ backgroundColor: tx.category.color + '20' }}>
                        {tx.category.name}
                      </Badge>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{tx.account?.name}</td>
                  <td className={`px-4 py-3 text-right text-sm font-medium ${tx.type === 'INCOME' ? 'text-green-600' : ''}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(Number(tx.amount), tx.account?.currency || 'USD')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditingTx(tx)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <TransactionFormDialog open={showCreate} onOpenChange={setShowCreate} />
      {editingTx && (
        <TransactionFormDialog
          open={!!editingTx}
          onOpenChange={(open) => !open && setEditingTx(null)}
          transaction={editingTx}
        />
      )}
    </DashboardShell>
  );
}
