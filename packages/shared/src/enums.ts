export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum AccountType {
  SAVINGS = 'SAVINGS',
  CURRENT = 'CURRENT',
  CREDIT_CARD = 'CREDIT_CARD',
  CASH = 'CASH',
  INVESTMENT = 'INVESTMENT',
  LOAN = 'LOAN',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
  TRANSFER = 'TRANSFER',
  INVESTMENT = 'INVESTMENT',
  LOAN_PAYMENT = 'LOAN_PAYMENT',
}

export enum CurrencyCode {
  USD = 'USD',
  INR = 'INR',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CAD = 'CAD',
  AUD = 'AUD',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
}

export enum StatementImportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
}

export enum InvestmentType {
  MUTUAL_FUND = 'MUTUAL_FUND',
  STOCK = 'STOCK',
  ETF = 'ETF',
  GOLD = 'GOLD',
}

export const LIABILITY_ACCOUNT_TYPES: AccountType[] = [
  AccountType.CREDIT_CARD,
  AccountType.LOAN,
];

export const ASSET_ACCOUNT_TYPES: AccountType[] = [
  AccountType.SAVINGS,
  AccountType.CURRENT,
  AccountType.CASH,
  AccountType.INVESTMENT,
];

export function isLiabilityAccount(type: AccountType): boolean {
  return LIABILITY_ACCOUNT_TYPES.includes(type);
}

export function getSignedBalance(type: AccountType, balance: number): number {
  return isLiabilityAccount(type) ? -Math.abs(balance) : balance;
}
