'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useInsights, useGenerateInsights } from '@/hooks/use-api';
import { Sparkles, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export function AiInsightsWidget() {
  const { data: insights, isLoading } = useInsights(3);
  const generate = useGenerateInsights();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4" />
          AI Insights
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
        >
          <RefreshCw className={`h-4 w-4 ${generate.isPending ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !insights?.length ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">No insights yet.</p>
            <Button size="sm" variant="outline" onClick={() => generate.mutate()}>
              Generate insights
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => (
              <div key={insight.id} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{insight.message}</p>
              </div>
            ))}
            <Link href="/copilot" className="text-xs text-primary hover:underline">
              Ask AI Copilot →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
