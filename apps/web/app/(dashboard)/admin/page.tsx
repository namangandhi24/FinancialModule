'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  useUser,
  useAdminStats,
  useAdminUsers,
  useAdminQueues,
  useAdminAudit,
} from '@/hooks/use-api';
import { UserRole } from '@finpilot/shared';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useUser();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: usersData, isLoading: usersLoading } = useAdminUsers();
  const { data: queuesData, isLoading: queuesLoading } = useAdminQueues();
  const { data: auditLogs, isLoading: auditLoading } = useAdminAudit();

  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (user?.role !== UserRole.ADMIN) return null;

  return (
    <DashboardShell title="Admin Dashboard">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Stats</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <dl className="space-y-2 text-sm">
                {stats &&
                  Object.entries(stats)
                    .filter(([k]) => k !== 'timestamp')
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <dt className="text-muted-foreground capitalize">{key}</dt>
                        <dd className="font-medium">{value}</dd>
                      </div>
                    ))}
              </dl>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Queue Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            {queuesLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2">Queue</th>
                      <th className="pb-2">Waiting</th>
                      <th className="pb-2">Active</th>
                      <th className="pb-2">Completed</th>
                      <th className="pb-2">Failed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queuesData?.queues.map((q) => (
                      <tr key={String(q.name)} className="border-b">
                        <td className="py-2 font-medium">{String(q.name)}</td>
                        <td className="py-2">{q.waiting ?? 0}</td>
                        <td className="py-2">{q.active ?? 0}</td>
                        <td className="py-2">{q.completed ?? 0}</td>
                        <td className="py-2">
                          {(q.failed ?? 0) > 0 ? (
                            <Badge variant="outline">{q.failed}</Badge>
                          ) : (
                            0
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="space-y-3">
                {(usersData?.items as { email: string; role: string; _count: { accounts: number; transactions: number } }[])?.map(
                  (u, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{u.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {u._count.accounts} accounts · {u._count.transactions} transactions
                        </p>
                      </div>
                      <Badge variant="outline">{u.role}</Badge>
                    </div>
                  ),
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(auditLogs as { action: string; entityType: string; createdAt: string; user?: { email: string } }[])?.map(
                  (log, i) => (
                    <div key={i} className="rounded-lg border p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{log.action}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.user?.email} · {log.entityType}
                      </p>
                    </div>
                  ),
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
