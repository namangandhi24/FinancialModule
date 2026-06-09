'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createInvestmentSchema,
  type CreateInvestmentInput,
  InvestmentType,
  CurrencyCode,
} from '@finpilot/shared';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  useInvestments,
  useInvestmentAllocation,
  useInvestmentSummary,
  useCreateInvestment,
  useDeleteInvestment,
  useUser,
} from '@/hooks/use-api';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2, TrendingUp } from 'lucide-react';

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7'];
const TYPE_LABELS: Record<string, string> = {
  MUTUAL_FUND: 'Mutual Fund',
  STOCK: 'Stock',
  ETF: 'ETF',
  GOLD: 'Gold',
};

export default function InvestmentsPage() {
  const { user } = useUser();
  const currency = user?.defaultCurrency || 'INR';
  const [showCreate, setShowCreate] = useState(false);
  const { data: investments, isLoading } = useInvestments();
  const { data: allocation } = useInvestmentAllocation();
  const { data: summary } = useInvestmentSummary();
  const createInvestment = useCreateInvestment();
  const deleteInvestment = useDeleteInvestment();

  const form = useForm<CreateInvestmentInput>({
    resolver: zodResolver(createInvestmentSchema),
    defaultValues: {
      type: InvestmentType.MUTUAL_FUND,
      currency: currency as CreateInvestmentInput['currency'],
    },
  });

  const onSubmit = async (data: CreateInvestmentInput) => {
    await createInvestment.mutateAsync(data);
    setShowCreate(false);
    form.reset();
  };

  const chartData =
    allocation?.allocation.map((a) => ({
      name: TYPE_LABELS[a.type] || a.type,
      value: a.value,
    })) || [];

  return (
    <DashboardShell title="Investments">
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Investment
        </Button>
      </div>

      {summary && (
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Portfolio Value</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalCurrent, currency)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Invested</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalInvested, currency)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Gain / Loss</p>
              <p className={`text-2xl font-bold ${summary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.totalGainLoss >= 0 ? '+' : ''}
                {formatCurrency(summary.totalGainLoss, currency)}
                <span className="text-sm ml-2">({summary.gainLossPercent.toFixed(1)}%)</span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : investments?.length === 0 ? (
              <div className="py-8 text-center">
                <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No investments tracked yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {investments?.map((inv) => (
                  <div key={inv.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{inv.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {TYPE_LABELS[inv.type]} {inv.symbol && `· ${inv.symbol}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{inv.currency}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => deleteInvestment.mutate(inv.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{formatCurrency(inv.totalValue, inv.currency)}</span>
                      <span className={inv.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {inv.gainLoss >= 0 ? '+' : ''}
                        {formatCurrency(inv.gainLoss, inv.currency)} ({inv.gainLossPercent.toFixed(1)}%)
                      </span>
                    </div>
                    {inv.holdings.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {inv.holdings.map((h) => (
                          <span key={h.id} className="mr-3">
                            {h.quantity} @ {formatCurrency(h.currentPrice, inv.currency)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No allocation data</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Investment</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register('name')} placeholder="Nifty 50 Index Fund" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.watch('type')}
                  onValueChange={(v) => form.setValue('type', v as CreateInvestmentInput['type'])}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(InvestmentType).map((t) => (
                      <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input id="symbol" {...form.register('symbol')} placeholder="NIFTYBEES" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={createInvestment.isPending}>
              Add Investment
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
