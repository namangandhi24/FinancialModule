'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { retirementProjectionSchema, type RetirementProjectionInput } from '@finpilot/shared';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useRetirementProjection, useUser } from '@/hooks/use-api';
import { formatCurrency } from '@/lib/utils';

interface RetirementResult {
  yearsToRetirement: number;
  deterministicCorpusAtRetirement: number;
  monteCarlo: {
    medianCorpus: number;
    p10: number;
    p90: number;
    successProbability: number;
  };
  safeWithdrawal: {
    rate: number;
    annualAmount: number;
    requiredCorpus: number;
    meetsGoal: boolean;
  };
  yearlyProjection: { age: number; balance: number }[];
}

export default function RetirementPage() {
  const { user } = useUser();
  const currency = user?.defaultCurrency || 'INR';
  const project = useRetirementProjection();
  const [result, setResult] = useState<RetirementResult | null>(null);

  const form = useForm<RetirementProjectionInput>({
    resolver: zodResolver(retirementProjectionSchema),
    defaultValues: {
      currentAge: 35,
      retirementAge: 60,
      currentSavings: 500000,
      monthlyContribution: 25000,
      annualExpensesInRetirement: 600000,
      expectedReturn: 0.07,
      inflationRate: 0.03,
      safeWithdrawalRate: 0.04,
    },
  });

  const onSubmit = async (data: RetirementProjectionInput) => {
    const res = await project.mutateAsync(data);
    setResult(res as RetirementResult);
  };

  const chartData = result?.yearlyProjection.map((p) => ({
    age: p.age,
    balance: p.balance,
  }));

  return (
    <DashboardShell title="Retirement Planner">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Current age</Label>
                  <Input type="number" {...form.register('currentAge', { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label>Retirement age</Label>
                  <Input type="number" {...form.register('retirementAge', { valueAsNumber: true })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Current savings</Label>
                <Input type="number" {...form.register('currentSavings', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label>Monthly contribution</Label>
                <Input type="number" {...form.register('monthlyContribution', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label>Annual expenses in retirement</Label>
                <Input
                  type="number"
                  {...form.register('annualExpensesInRetirement', { valueAsNumber: true })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={project.isPending}>
                {project.isPending ? 'Calculating...' : 'Run Monte Carlo'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {result && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Median corpus at retirement</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(result.monteCarlo.medianCorpus, currency)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Success probability</p>
                  <p className="text-2xl font-bold">{result.monteCarlo.successProbability}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Safe withdrawal (4%)</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(result.safeWithdrawal.annualAmount, currency)}/yr
                  </p>
                  <Badge variant={result.safeWithdrawal.meetsGoal ? 'secondary' : 'outline'} className="mt-2">
                    {result.safeWithdrawal.meetsGoal ? 'On track' : 'Gap to goal'}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Growth Projection</CardTitle>
            </CardHeader>
            <CardContent>
              {!chartData?.length ? (
                <p className="text-sm text-muted-foreground py-12 text-center">
                  Enter your details and run the simulation.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: 'Age', position: 'insideBottom' }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                    <Line type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
