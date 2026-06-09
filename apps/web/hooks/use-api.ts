'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/ui-store';
import type { UserResponse } from '@finpilot/shared';

export function useUser() {
  const { user, setUser, clearUser } = useAuthStore();

  const query = useQuery({
    queryKey: ['user'],
    queryFn: () => api.get<UserResponse>('/users/me'),
    retry: false,
  });

  if (query.data && !user) {
    setUser(query.data);
  }

  return { ...query, user: user || query.data, clearUser };
}

export function useAccounts(params?: { type?: string; status?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set('type', params.type);
  if (params?.status) searchParams.set('status', params.status);
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ['accounts', params],
    queryFn: () => api.get<Account[]>(`/accounts${qs ? `?${qs}` : ''}`),
  });
}

export function useTransactions(params?: Record<string, string | number>) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') searchParams.set(k, String(v));
    });
  }
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () =>
      api.get<{ items: Transaction[]; pagination: Pagination }>(
        `/transactions${qs ? `?${qs}` : ''}`,
      ),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
  });
}

export function useNetWorth() {
  return useQuery({
    queryKey: ['net-worth'],
    queryFn: () => api.get<NetWorthCurrent>('/net-worth/current'),
  });
}

export function useCashFlow() {
  return useQuery({
    queryKey: ['cash-flow'],
    queryFn: () => api.get<CashFlow>('/net-worth/cash-flow'),
  });
}

export function useSpending(limit = 5) {
  return useQuery({
    queryKey: ['spending', limit],
    queryFn: () => api.get<SpendingData>(`/net-worth/spending?limit=${limit}`),
  });
}

export function useNetWorthHistory() {
  return useQuery({
    queryKey: ['net-worth-history'],
    queryFn: () => api.get<{ history: { date: string; netWorth: number }[] }>('/net-worth/history'),
  });
}

export interface Account {
  id: string;
  name: string;
  type: string;
  institution?: string;
  balance: number;
  currency: string;
  status: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  date: string;
  merchantName?: string;
  categoryId?: string;
  notes?: string;
  type: string;
  tags: string[];
  account?: { id: string; name: string; type: string; currency: string };
  category?: { id: string; name: string; slug: string; color?: string; icon?: string };
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  isSystem: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NetWorthCurrent {
  assetsTotal: number;
  liabilitiesTotal: number;
  netWorth: number;
  breakdown: Record<string, { total: number; count: number; currency: string }>;
  accountCount: number;
}

export interface CashFlow {
  income: number;
  expenses: number;
  netCashFlow: number;
}

export interface SpendingData {
  categories: {
    categoryId: string;
    name: string;
    slug: string;
    color: string | null;
    total: number;
  }[];
  totalSpending: number;
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post<Account>('/accounts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['net-worth'] });
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      api.patch<Account>(`/accounts/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['net-worth'] });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/accounts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['net-worth'] });
    },
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post<Transaction>('/transactions', data),
    onMutate: async (newTx) => {
      await qc.cancelQueries({ queryKey: ['transactions'] });
      const previous = qc.getQueryData(['transactions']);
      return { previous };
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['net-worth'] });
      qc.invalidateQueries({ queryKey: ['cash-flow'] });
      qc.invalidateQueries({ queryKey: ['spending'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      api.patch<Transaction>(`/transactions/${id}`, data),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['net-worth'] });
      qc.invalidateQueries({ queryKey: ['cash-flow'] });
      qc.invalidateQueries({ queryKey: ['spending'] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['net-worth'] });
      qc.invalidateQueries({ queryKey: ['cash-flow'] });
      qc.invalidateQueries({ queryKey: ['spending'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.patch<UserResponse>('/users/me', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user'] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: unknown) => api.patch('/users/me/password', data),
  });
}

export interface StatementImport {
  id: string;
  fileName: string;
  fileType: string;
  status: string;
  recordCount: number;
  errorMessage?: string;
  accountId?: string;
  createdAt: string;
  updatedAt: string;
}

export function useImports() {
  return useQuery({
    queryKey: ['imports'],
    queryFn: () => api.get<StatementImport[]>('/imports'),
  });
}

export function useUploadStatement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, file }: { accountId: string; file: File }) => {
      const formData = new FormData();
      formData.append('accountId', accountId);
      formData.append('file', file);
      return api.postForm<StatementImport>('/imports/upload', formData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['imports'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['net-worth'] });
      qc.invalidateQueries({ queryKey: ['net-worth-history'] });
      qc.invalidateQueries({ queryKey: ['cash-flow'] });
      qc.invalidateQueries({ queryKey: ['spending'] });
    },
  });
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  currency: string;
  category?: Category;
}

export interface BudgetPerformance {
  month: number;
  year: number;
  items: {
    budgetId: string;
    categoryId: string;
    category?: Category;
    budgetAmount: number;
    actual: number;
    remaining: number;
    percentUsed: number;
    isOverBudget: boolean;
    currency: string;
  }[];
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overBudgetCount: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentSavings: number;
  monthlyContribution: number;
  targetDate: string;
  currency: string;
  status: string;
  progress: {
    progressPercent: number;
    monthsRemaining: number;
    requiredMonthlySavings: number;
    achievementProbability: number;
    onTrack: boolean;
  };
}

export interface Investment {
  id: string;
  name: string;
  type: string;
  symbol?: string;
  currency: string;
  holdings: Holding[];
  totalCost: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface Holding {
  id: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  costBasis: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export function useBudgets(params?: { month?: number; year?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.month) searchParams.set('month', String(params.month));
  if (params?.year) searchParams.set('year', String(params.year));
  const qs = searchParams.toString();
  return useQuery({
    queryKey: ['budgets', params],
    queryFn: () => api.get<Budget[]>(`/budgets${qs ? `?${qs}` : ''}`),
  });
}

export function useBudgetPerformance(params?: { month?: number; year?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.month) searchParams.set('month', String(params.month));
  if (params?.year) searchParams.set('year', String(params.year));
  const qs = searchParams.toString();
  return useQuery({
    queryKey: ['budget-performance', params],
    queryFn: () => api.get<BudgetPerformance>(`/budgets/performance${qs ? `?${qs}` : ''}`),
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post<Budget>('/budgets', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      qc.invalidateQueries({ queryKey: ['budget-performance'] });
    },
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/budgets/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      qc.invalidateQueries({ queryKey: ['budget-performance'] });
    },
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: () => api.get<Goal[]>('/goals'),
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post<Goal>('/goals', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/goals/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useInvestments() {
  return useQuery({
    queryKey: ['investments'],
    queryFn: () => api.get<Investment[]>('/investments'),
  });
}

export function useInvestmentAllocation() {
  return useQuery({
    queryKey: ['investment-allocation'],
    queryFn: () =>
      api.get<{ allocation: { type: string; value: number; percent: number }[]; totalValue: number }>(
        '/investments/allocation',
      ),
  });
}

export function useInvestmentSummary() {
  return useQuery({
    queryKey: ['investment-summary'],
    queryFn: () =>
      api.get<{
        totalInvested: number;
        totalCurrent: number;
        totalGainLoss: number;
        gainLossPercent: number;
      }>('/investments/summary'),
  });
}

export function useCreateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post<Investment>('/investments', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments'] });
      qc.invalidateQueries({ queryKey: ['investment-allocation'] });
      qc.invalidateQueries({ queryKey: ['investment-summary'] });
    },
  });
}

export function useDeleteInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/investments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments'] });
      qc.invalidateQueries({ queryKey: ['investment-allocation'] });
      qc.invalidateQueries({ queryKey: ['investment-summary'] });
    },
  });
}

export interface Insight {
  id: string;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  channel: string;
  read: boolean;
  createdAt: string;
}

export interface Forecast {
  id: string;
  horizon: number;
  data: {
    startNetWorth: number;
    monthlySavings: number;
    annualGrowthRate: number;
    projections: { year: number; netWorth: number; savings: number }[];
    generatedAt: string;
  };
  createdAt: string;
}

export interface AiConversation {
  id: string;
  title?: string;
  updatedAt: string;
  messages?: { id: string; role: string; content: string; createdAt: string }[];
  _count?: { messages: number };
}

export interface AiStatus {
  openaiConfigured: boolean;
  ollamaAvailable: boolean;
  ollamaModels: string[];
  preferredProvider: string;
}

export interface Session {
  id: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  expiresAt: string;
}

export function useInsights(limit = 5) {
  return useQuery({
    queryKey: ['insights', limit],
    queryFn: () => api.get<Insight[]>(`/insights?limit=${limit}`),
  });
}

export function useGenerateInsights() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/insights/generate/sync'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insights'] }),
  });
}

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: ['notifications', unreadOnly],
    queryFn: () =>
      api.get<Notification[]>(`/notifications?unreadOnly=${unreadOnly}`),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => api.get<number>('/notifications/unread-count'),
    refetchInterval: 30000,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { ids?: string[]; markAll?: boolean }) =>
      api.patch('/notifications/read', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

export function useForecasts() {
  return useQuery({
    queryKey: ['forecasts'],
    queryFn: () => api.get<Forecast[]>('/forecasts'),
  });
}

export function useGenerateForecast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post<Forecast>('/forecasts/generate', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forecasts'] }),
  });
}

export function useRetirementProjection() {
  return useMutation({
    mutationFn: (data: unknown) => api.post('/retirement/project', data),
  });
}

export function useAiStatus() {
  return useQuery({
    queryKey: ['ai-status'],
    queryFn: () => api.get<AiStatus>('/ai/status'),
  });
}

export function useAiConversations() {
  return useQuery({
    queryKey: ['ai-conversations'],
    queryFn: () => api.get<AiConversation[]>('/ai/conversations'),
  });
}

export function useAiChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { message: string; conversationId?: string }) =>
      api.post<{ conversationId: string; message: { role: string; content: string }; toolsUsed: string[] }>(
        '/ai/chat',
        data,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-conversations'] });
    },
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get<Session[]>('/auth/sessions'),
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/auth/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

export function useSetup2FA() {
  return useMutation({
    mutationFn: () => api.post<{ secret: string; otpauthUrl: string }>('/auth/2fa/setup'),
  });
}

export function useEnable2FA() {
  return useMutation({
    mutationFn: (token: string) => api.post('/auth/2fa/enable', { token }),
  });
}

export function useDisable2FA() {
  return useMutation({
    mutationFn: (token: string) => api.post('/auth/2fa/disable', { token }),
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<Record<string, number>>('/admin/stats'),
  });
}

export function useAdminUsers(page = 1) {
  return useQuery({
    queryKey: ['admin-users', page],
    queryFn: () =>
      api.get<{ items: unknown[]; pagination: Pagination }>(`/admin/users?page=${page}`),
  });
}

export function useAdminQueues() {
  return useQuery({
    queryKey: ['admin-queues'],
    queryFn: () => api.get<{ queues: Record<string, number>[] }>('/admin/queues'),
  });
}

export function useAdminAudit() {
  return useQuery({
    queryKey: ['admin-audit'],
    queryFn: () => api.get<unknown[]>('/admin/audit'),
  });
}

export function useCategorizationRules() {
  return useQuery({
    queryKey: ['categorization-rules'],
    queryFn: () => api.get<unknown[]>('/categorization/rules'),
  });
}

export function useCreateCategorizationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { pattern: string; categoryId: string }) =>
      api.post('/categorization/rules', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorization-rules'] }),
  });
}
