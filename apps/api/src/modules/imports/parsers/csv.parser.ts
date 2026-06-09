import { parse } from 'csv-parse/sync';
import { ParsedStatementRow } from './types';
import { TransactionType } from '@prisma/client';

const DATE_KEYS = ['date', 'transaction date', 'txn date', 'posted date'];
const AMOUNT_KEYS = ['amount', 'debit', 'credit', 'value'];
const MERCHANT_KEYS = ['merchant', 'description', 'narration', 'payee', 'details', 'memo'];
const TYPE_KEYS = ['type', 'transaction type', 'dr/cr'];

function findColumn(headers: string[], candidates: string[]): string | undefined {
  const normalized = headers.map((h) => h.toLowerCase().trim());
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate);
    if (idx >= 0) return headers[idx];
  }
  return undefined;
}

function parseDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

function parseAmount(row: Record<string, string>, amountKey?: string, headers?: string[]): number | null {
  if (amountKey && row[amountKey]) {
    const val = parseFloat(row[amountKey].replace(/[,$₹]/g, ''));
    if (!isNaN(val) && val !== 0) return Math.abs(val);
  }

  const debitKey = headers?.find((h) => h.toLowerCase().includes('debit'));
  const creditKey = headers?.find((h) => h.toLowerCase().includes('credit'));

  if (debitKey && row[debitKey]) {
    const val = parseFloat(row[debitKey].replace(/[,$₹]/g, ''));
    if (!isNaN(val) && val !== 0) return Math.abs(val);
  }
  if (creditKey && row[creditKey]) {
    const val = parseFloat(row[creditKey].replace(/[,$₹]/g, ''));
    if (!isNaN(val) && val !== 0) return Math.abs(val);
  }

  return null;
}

function inferType(row: Record<string, string>, typeKey?: string, headers?: string[]): 'EXPENSE' | 'INCOME' {
  if (typeKey && row[typeKey]) {
    const t = row[typeKey].toLowerCase();
    if (t.includes('credit') || t.includes('income') || t.includes('deposit')) return 'INCOME';
  }

  const creditKey = headers?.find((h) => h.toLowerCase().includes('credit'));
  if (creditKey && row[creditKey]) {
    const val = parseFloat(row[creditKey].replace(/[,$₹]/g, ''));
    if (!isNaN(val) && val !== 0) return 'INCOME';
  }

  return 'EXPENSE';
}

export function parseCsvBuffer(buffer: Buffer): ParsedStatementRow[] {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  if (records.length === 0) return [];

  const headers = Object.keys(records[0]);
  const dateKey = findColumn(headers, DATE_KEYS);
  const amountKey = findColumn(headers, AMOUNT_KEYS);
  const merchantKey = findColumn(headers, MERCHANT_KEYS);
  const typeKey = findColumn(headers, TYPE_KEYS);

  const rows: ParsedStatementRow[] = [];

  for (const record of records) {
    const dateVal = dateKey ? record[dateKey] : record[headers[0]];
    const date = dateVal ? parseDate(dateVal) : null;
    const amount = parseAmount(record, amountKey, headers);

    if (!date || amount === null) continue;

    rows.push({
      date,
      amount,
      merchant: merchantKey ? record[merchantKey]?.trim() : undefined,
      notes: merchantKey ? undefined : record[headers[1]]?.trim(),
      type: inferType(record, typeKey, headers),
    });
  }

  return rows;
}

export function mapRowType(type?: 'EXPENSE' | 'INCOME'): TransactionType {
  return type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE;
}
