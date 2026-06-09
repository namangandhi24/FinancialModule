export interface ParsedStatementRow {
  date: Date;
  amount: number;
  merchant?: string;
  notes?: string;
  type?: 'EXPENSE' | 'INCOME';
}
