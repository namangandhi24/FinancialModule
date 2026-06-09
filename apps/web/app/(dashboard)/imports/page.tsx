'use client';

import { useState, useRef } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAccounts, useImports, useUploadStatement } from '@/hooks/use-api';
import { formatDate } from '@/lib/utils';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  COMPLETED: 'default',
  PROCESSING: 'secondary',
  PENDING: 'outline',
  FAILED: 'secondary',
};

export default function ImportsPage() {
  const [accountId, setAccountId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: accounts } = useAccounts();
  const { data: imports, isLoading } = useImports();
  const upload = useUploadStatement();
  const [error, setError] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accountId) {
      setError('Select an account and file first');
      return;
    }

    try {
      setError('');
      await upload.mutateAsync({ accountId, file });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  return (
    <DashboardShell title="Import Statements">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Statement</CardTitle>
            <CardDescription>
              Import transactions from CSV or Excel (.xlsx, .xls). Rows are auto-categorized using
              the rule engine (e.g. SWIGGY → Food, UBER → Transport).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && accountId) {
                  upload.mutate({ accountId, file });
                }
              }}
            >
              <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="mb-2 text-sm font-medium">Drop CSV or Excel file here</p>
              <p className="mb-4 text-xs text-muted-foreground">Max 10 MB · PDF coming soon</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,text/csv"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                variant="outline"
                disabled={!accountId || upload.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {upload.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Choose file
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="rounded-md bg-muted/50 p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Expected CSV columns</p>
              <p>date, amount, description/merchant — optional: type, debit, credit</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import History</CardTitle>
            <CardDescription>Background jobs process files via BullMQ</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : imports?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No imports yet</p>
            ) : (
              <div className="space-y-3">
                {imports?.map((imp) => (
                  <div key={imp.id} className="flex items-start justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium text-sm">{imp.fileName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(imp.createdAt)} · {imp.fileType.toUpperCase()}
                        {imp.recordCount > 0 && ` · ${imp.recordCount} records`}
                      </p>
                      {imp.errorMessage && (
                        <p className="text-xs text-destructive mt-1">{imp.errorMessage}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {imp.status === 'COMPLETED' && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {imp.status === 'FAILED' && <XCircle className="h-4 w-4 text-destructive" />}
                      {imp.status === 'PROCESSING' && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      <Badge variant={STATUS_VARIANT[imp.status] || 'outline'}>{imp.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
