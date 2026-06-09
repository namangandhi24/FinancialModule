'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, DashboardHeader } from '@/components/layout/sidebar';
import { CommandPalette } from '@/components/layout/command-palette';
import { useUser } from '@/hooks/use-api';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const router = useRouter();
  const { user, isLoading, isError } = useUser();

  useEffect(() => {
    if (isError) {
      router.push('/login');
    }
  }, [isError, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Skeleton className="hidden w-64 lg:block" />
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <CommandPalette />
      <Sidebar />
      <div className="lg:pl-64">
        <DashboardHeader title={title} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
