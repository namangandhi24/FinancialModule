'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateForecastSchema, type GenerateForecastInput } from '@finpilot/shared';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useForecasts, useGenerateForecast, useUser } from '@/hooks/use-api';
import { formatCurrency } from '@/lib/utils';

export default function ForecastsPage() {
  const { user } = useUser();
  const currency = user?.defaultCurrency || 'INR';
  const { data: forecasts, isLoading } = useForecasts();
  const generate = useGenerateForecast();
  const [horizon, setHorizon] = useState<1 | 5 | 10 | 20>(10);

  const form = useForm<GenerateForecastInput>({
    resolver: zodResolver(generateForecastSchema),
    defaultValues: { horizon: 10, annualGrowthRate: 0.07 },
  });

  const latest = forecasts?.[0];
  const chartData = latest?.data.projections.map((p) => ({
    year: `Year ${p.year}`,
    netWorth: p.netWorth,
  }));

  const onSubmit = async (data: GenerateForecastInput) => {
    await generate.mutateAsync(data);
  };

  return (
    <DashboardShell title="Financial Forecasts">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generate Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Horizon (years)</Label>
                <Select
                  value={String(horizon)}
                  onValueChange={(v) => {
                    const h = Number(v) as 1 | 5 | 10 | 20;
                    setHorizon(h);
                    form.setValue('horizon', h);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 5, 10, 20].map((y) => (
                      <SelectItem key={y} value={String(y)}>{y} years</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Annual growth rate</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register('annualGrowthRate', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>Monthly savings (optional)</Label>
                <Input
                  type="number"
                  placeholder="Auto from cash flow"
                  {...form.register('monthlySavingsRate', { valueAsNumber: true })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={generate.isPending}>
                {generate.isPending ? 'Generating...' : 'Generate Forecast'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Net Worth Projection</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : !chartData?.length ? (
              <p className="text-sm text-muted-foreground py-12 text-center">
                Generate a forecast to see your projected net worth.
              </p>
            ) : (
              <>
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Starting net worth</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(latest!.data.startNetWorth, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Projected ({latest!.horizon}y)</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(
                        latest!.data.projections[latest!.data.projections.length - 1]?.netWorth || 0,
                        currency,
                      )}
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                    <Line type="monotone" dataKey="netWorth" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
