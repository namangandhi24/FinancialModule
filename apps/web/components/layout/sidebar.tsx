'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Target,
  TrendingUp,
  Settings,
  ChevronLeft,
  Menu,
  Moon,
  Sun,
  LogOut,
  Sparkles,
  Upload,
  PieChart,
  LineChart,
  Landmark,
  Bell,
  Shield,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUIStore, useAuthStore } from '@/stores/ui-store';
import { api } from '@/lib/api-client';
import { UserRole } from '@finpilot/shared';
import { useUnreadNotificationCount } from '@/hooks/use-api';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts', label: 'Accounts', icon: Wallet },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/imports', label: 'Import Statements', icon: Upload },
  { href: '/budgets', label: 'Budgets', icon: PieChart },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/investments', label: 'Investments', icon: TrendingUp },
  { href: '/forecasts', label: 'Forecasts', icon: LineChart },
  { href: '/retirement', label: 'Retirement', icon: Landmark },
  { href: '/copilot', label: 'AI Copilot', icon: Sparkles },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const adminNav = [{ href: '/admin', label: 'Admin', icon: Shield }];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useUIStore();
  const { user, clearUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { data: unreadCount } = useUnreadNotificationCount();

  const handleLogout = async () => {
    await api.post('/auth/logout');
    clearUser();
    window.location.href = '/login';
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        style={{ display: sidebarCollapsed ? 'none' : 'block' }}
        onClick={() => setSidebarCollapsed(true)}
      />
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r bg-card transition-transform lg:translate-x-0',
          sidebarCollapsed ? '-translate-x-full' : 'translate-x-0',
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TrendingUp className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold">FinPilot AI</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={() => setSidebarCollapsed(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            const showBadge = item.href === '/notifications' && unreadCount && unreadCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}

          {user?.role === UserRole.ADMIN &&
            adminNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <div className="border-t p-4 space-y-2">
          {user && (
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Toggle theme
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>
    </>
  );
}

export function DashboardHeader({ title }: { title: string }) {
  const { setSidebarCollapsed } = useUIStore();

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setSidebarCollapsed(false)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-xl font-semibold">{title}</h1>
    </header>
  );
}
