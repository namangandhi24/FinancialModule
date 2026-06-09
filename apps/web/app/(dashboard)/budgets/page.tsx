'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createBudgetSchema,
  type CreateBudgetInput,
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  useBudgetPerformance,
  useCategories,
  useCreateBudget,
  useDeleteBudget,
  useUser,
} from '@/hooks/use-api';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

export default function BudgetsPage() {
  const { user } = useUser();
  const currency = user?.defaultCurrency || 'INR';
  const now = new Date();
  const [showCreate, setShowCreate] = useState(false);
  const { data: performance, isLoading } = useBudgetPerformance({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const { data: categories } = useCategories();
  const createBudget = useCreateBudget();
  const deleteBudget = useDeleteBudget();

  const form = useForm<CreateBudgetInput>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      currency: currency as CreateBudgetInput['currency'],
      amount: 0,
      categoryId: '',
    },
  });

  const onSubmit = async (data: CreateBudgetInput) => {
    await createBudget.mutateAsync(data);
    setShowCreate(false);
    form.reset();
  };

  const chartData =
    performance?.items.map((item) => ({
      name: item.category?.name || 'Other',
      budget: item.budgetAmount,
      actual: item.actual,
    })) || [];

  return (
    <DashboardShell title="Budgets">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {now.toLocaleString('default', { month: 'long', year: 'numeric' })} — Budget vs Actual
        </p>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Budget
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Spending vs Budget</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No budgets for this month. Add category limits to track spending.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                    <Legend />
                    <Bar dataKey="budget" fill="hsl(var(--primary))" name="Budget" radius={4} />
                    <Bar dataKey="actual" fill="#94a3b8" name="Actual" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(performance?.totalBudget || 0, currency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(performance?.totalSpent || 0, currency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p
                  className={`text-2xl font-bold ${(performance?.totalRemaining || 0) < 0 ? 'text-destructive' : 'text-green-600'}`}
                >
                  {formatCurrency(performance?.totalRemaining || 0, currency)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {performance && performance.items.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performance.items.map((item) => (
                <div
                  key={item.budgetId}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.category?.color || '#64748b' }}
                    />
                    <div>
                      <p className="font-medium text-sm">{item.category?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.actual, currency)} of{' '}
                        {formatCurrency(item.budgetAmount, currency)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={item.isOverBudget ? 'outline' : 'secondary'}>
                      {item.percentUsed.toFixed(0)}%
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteBudget.mutate(item.budgetId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Monthly Budget</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.watch('categoryId')}
                onValueChange={(v) => form.setValue('categoryId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Monthly limit</Label>
              <Input
                id="amount"
                type="number"
                {...form.register('amount', { valueAsNumber: true })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={createBudget.isPending}>
              Create Budget
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
