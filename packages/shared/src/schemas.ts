import { z } from 'zod';
import {
  AccountStatus,
  AccountType,
  CurrencyCode,
  GoalStatus,
  InvestmentType,
  TransactionType,
  UserRole,
} from './enums';

export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const currencySchema = z.nativeEnum(CurrencyCode);

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  defaultCurrency: currencySchema.optional().default(CurrencyCode.USD),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  defaultCurrency: currencySchema.optional(),
});

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.nativeEnum(AccountType),
  institution: z.string().max(100).optional(),
  balance: z.number(),
  currency: currencySchema,
  status: z.nativeEnum(AccountStatus).optional().default(AccountStatus.ACTIVE),
});

export const updateAccountSchema = createAccountSchema.partial();

export const createTransactionSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  date: z.coerce.date(),
  merchant: z.string().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
  type: z.nativeEnum(TransactionType),
  tags: z.array(z.string().max(50)).optional().default([]),
  transferToAccountId: z.string().uuid().optional(),
});

export const updateTransactionSchema = createTransactionSchema
  .omit({ transferToAccountId: true })
  .partial()
  .extend({
    updatedAt: z.coerce.date().optional(),
  });

export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  search: z.string().max(100).optional(),
});

export const accountQuerySchema = z.object({
  type: z.nativeEnum(AccountType).optional(),
  status: z.nativeEnum(AccountStatus).optional(),
});

export const netWorthHistoryQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const cashFlowQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const spendingQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(20).optional().default(5),
});

export const importUploadSchema = z.object({
  accountId: z.string().uuid('Account is required'),
});

export const createCategorizationRuleSchema = z.object({
  pattern: z.string().min(1).max(100),
  categoryId: z.string().uuid(),
});

export type ImportUploadInput = z.infer<typeof importUploadSchema>;
export type CreateCategorizationRuleInput = z.infer<typeof createCategorizationRuleSchema>;

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.number().positive('Budget amount must be positive'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  currency: currencySchema,
});

export const updateBudgetSchema = createBudgetSchema.partial();

export const budgetQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const budgetPerformanceQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const createGoalSchema = z.object({
  name: z.string().min(1).max(100),
  targetAmount: z.number().positive(),
  currentSavings: z.number().min(0).optional().default(0),
  monthlyContribution: z.number().min(0).optional().default(0),
  targetDate: z.coerce.date(),
  currency: currencySchema,
  status: z.nativeEnum(GoalStatus).optional().default(GoalStatus.ACTIVE),
});

export const updateGoalSchema = createGoalSchema.partial();

export const createInvestmentSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.nativeEnum(InvestmentType),
  symbol: z.string().max(20).optional(),
  currency: currencySchema,
});

export const updateInvestmentSchema = createInvestmentSchema.partial();

export const createHoldingSchema = z.object({
  quantity: z.number().positive(),
  averageCost: z.number().positive(),
  currentPrice: z.number().min(0).optional().default(0),
});

export const updateHoldingSchema = createHoldingSchema.partial();

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type BudgetQuery = z.infer<typeof budgetQuerySchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>;
export type CreateHoldingInput = z.infer<typeof createHoldingSchema>;
export type UpdateHoldingInput = z.infer<typeof updateHoldingSchema>;

export const forecastHorizonSchema = z.union([
  z.literal(1),
  z.literal(5),
  z.literal(10),
  z.literal(20),
]);

export const generateForecastSchema = z.object({
  horizon: forecastHorizonSchema,
  annualGrowthRate: z.number().min(-0.5).max(0.5).optional().default(0.07),
  monthlySavingsRate: z.number().min(0).optional(),
});

export const forecastQuerySchema = z.object({
  horizon: forecastHorizonSchema.optional(),
});

export const retirementProjectionSchema = z.object({
  currentAge: z.number().int().min(18).max(100),
  retirementAge: z.number().int().min(40).max(100),
  currentSavings: z.number().min(0),
  monthlyContribution: z.number().min(0),
  annualExpensesInRetirement: z.number().positive(),
  expectedReturn: z.number().min(0).max(0.2).optional().default(0.07),
  inflationRate: z.number().min(0).max(0.15).optional().default(0.03),
  safeWithdrawalRate: z.number().min(0.01).max(0.1).optional().default(0.04),
  simulations: z.number().int().min(100).max(5000).optional().default(1000),
});

export const aiChatSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
});

export const aiConversationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const insightsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  type: z.string().optional(),
});

export const notificationsQuerySchema = z.object({
  unreadOnly: z.coerce.boolean().optional().default(false),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const markNotificationsSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  markAll: z.boolean().optional().default(false),
});

export const adminUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const adminAuditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const enable2FASchema = z.object({
  token: z.string().length(6).regex(/^\d+$/),
});

export const verify2FASchema = z.object({
  token: z.string().length(6).regex(/^\d+$/),
});

export const loginWith2FASchema = loginSchema.extend({
  totpCode: z.string().length(6).regex(/^\d+$/).optional(),
});

export type GenerateForecastInput = z.infer<typeof generateForecastSchema>;
export type ForecastQuery = z.infer<typeof forecastQuerySchema>;
export type RetirementProjectionInput = z.infer<typeof retirementProjectionSchema>;
export type AiChatInput = z.infer<typeof aiChatSchema>;
export type InsightsQuery = z.infer<typeof insightsQuerySchema>;
export type NotificationsQuery = z.infer<typeof notificationsQuerySchema>;
export type MarkNotificationsInput = z.infer<typeof markNotificationsSchema>;
export type Enable2FAInput = z.infer<typeof enable2FASchema>;
export type Verify2FAInput = z.infer<typeof verify2FASchema>;
export type LoginWith2FAInput = z.infer<typeof loginWith2FASchema>;

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.nativeEnum(UserRole),
  defaultCurrency: z.nativeEnum(CurrencyCode),
  createdAt: z.coerce.date(),
});

export const authResponseSchema = z.object({
  user: userResponseSchema,
  accessToken: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
export type AccountQuery = z.infer<typeof accountQuerySchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
