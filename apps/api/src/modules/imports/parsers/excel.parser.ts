import * as XLSX from 'xlsx';
import { parseCsvBuffer } from './csv.parser';
import { ParsedStatementRow } from './types';

export function parseExcelBuffer(buffer: Buffer): ParsedStatementRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const csv = XLSX.utils.sheet_to_csv(sheet);
  return parseCsvBuffer(Buffer.from(csv, 'utf-8'));
}
