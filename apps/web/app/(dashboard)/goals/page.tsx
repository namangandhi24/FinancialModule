'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createGoalSchema, type CreateGoalInput, CurrencyCode } from '@finpilot/shared';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
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
import { useGoals, useCreateGoal, useDeleteGoal, useUser } from '@/hooks/use-api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Trash2, Target } from 'lucide-react';

export default function GoalsPage() {
  const { user } = useUser();
  const currency = user?.defaultCurrency || 'INR';
  const [showCreate, setShowCreate] = useState(false);
  const { data: goals, isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const deleteGoal = useDeleteGoal();

  const form = useForm<CreateGoalInput>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      currency: currency as CreateGoalInput['currency'],
      currentSavings: 0,
      monthlyContribution: 0,
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  const onSubmit = async (data: CreateGoalInput) => {
    await createGoal.mutateAsync(data);
    setShowCreate(false);
    form.reset();
  };

  return (
    <DashboardShell title="Goals">
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Goal
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : goals?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No goals yet. Set your first financial goal.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals?.map((goal) => (
            <Card key={goal.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{goal.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Target: {formatDate(goal.targetDate)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={goal.progress.onTrack ? 'secondary' : 'outline'}>
                      {goal.status}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => deleteGoal.mutate(goal.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mb-2 flex justify-between text-sm">
                  <span>{goal.progress.progressPercent.toFixed(1)}% complete</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(goal.currentSavings, goal.currency)} /{' '}
                    {formatCurrency(goal.targetAmount, goal.currency)}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, goal.progress.progressPercent)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-muted-foreground">Required / month</p>
                    <p className="font-medium">
                      {formatCurrency(goal.progress.requiredMonthlySavings, goal.currency)}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-muted-foreground">Achievement odds</p>
                    <p className="font-medium">
                      {goal.progress.achievementProbability.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Goal name</Label>
              <Input id="name" {...form.register('name')} placeholder="Emergency Fund" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target amount</Label>
                <Input id="targetAmount" type="number" {...form.register('targetAmount', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentSavings">Current savings</Label>
                <Input id="currentSavings" type="number" {...form.register('currentSavings', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyContribution">Monthly contribution</Label>
                <Input id="monthlyContribution" type="number" {...form.register('monthlyContribution', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  {...form.register('targetDate', { setValueAs: (v) => new Date(v) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={form.watch('currency')}
                onValueChange={(v) => form.setValue('currency', v as CreateGoalInput['currency'])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(CurrencyCode).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={createGoal.isPending}>
              Create Goal
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
