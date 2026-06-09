import { ParsedStatementRow } from './types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

export async function parsePdfBuffer(buffer: Buffer): Promise<ParsedStatementRow[]> {
  const data = await pdfParse(buffer);
  const lines = data.text
    .split('\n')
    .map((l: string) => l.trim())
    .filter(Boolean);

  const rows: ParsedStatementRow[] = [];
    const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/;
    const amountPattern = /([\d,]+\.\d{2}|\d+\.\d{2})/;

    for (const line of lines) {
      const dateMatch = line.match(datePattern);
      const amounts = line.match(new RegExp(amountPattern, 'g'));
      if (!dateMatch || !amounts?.length) continue;

      const amountStr = amounts[amounts.length - 1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) continue;

      const dateStr = dateMatch[1];
      const date = parseFlexibleDate(dateStr);
      if (!date) continue;

      const desc = line
        .replace(dateMatch[0], '')
        .replace(amounts[amounts.length - 1], '')
        .trim();

      rows.push({
        date,
        amount,
        merchant: desc || 'PDF import',
        type: 'EXPENSE',
      });
    }

    if (rows.length === 0) {
      throw new Error('No transactions found in PDF. Try CSV or Excel for better results.');
    }

    return rows;
}

function parseFlexibleDate(str: string): Date | null {
  const parts = str.includes('/') ? str.split('/') : str.split('-');
  if (parts.length !== 3) return null;

  let year: number;
  let month: number;
  let day: number;

  if (parts[0].length === 4) {
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else {
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
  }

  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
}
