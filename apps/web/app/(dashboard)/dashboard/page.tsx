'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { NetWorthWidget, CashFlowWidget } from '@/components/dashboard/net-worth-widget';
import { TopCategoriesWidget } from '@/components/dashboard/top-categories';
import { RecentTransactionsWidget } from '@/components/dashboard/recent-transactions';
import { BudgetStatusWidget } from '@/components/dashboard/budget-status';
import { GoalProgressWidget } from '@/components/dashboard/goal-progress';
import { InvestmentAllocationWidget } from '@/components/dashboard/investment-allocation';
import { AiInsightsWidget } from '@/components/dashboard/ai-insights';
import { useUser } from '@/hooks/use-api';

export default function DashboardPage() {
  const { user } = useUser();
  const currency = user?.defaultCurrency || 'USD';

  return (
    <DashboardShell title="Dashboard">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <NetWorthWidget currency={currency} />
        <CashFlowWidget currency={currency} />
        <BudgetStatusWidget currency={currency} />
        <TopCategoriesWidget currency={currency} />
        <GoalProgressWidget currency={currency} />
        <InvestmentAllocationWidget currency={currency} />
        <RecentTransactionsWidget currency={currency} />
        <AiInsightsWidget />
      </div>
    </DashboardShell>
  );
}
