'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginWith2FASchema, type LoginWith2FAInput } from '@finpilot/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/ui-store';
import { TrendingUp } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState('');
  const [needs2FA, setNeeds2FA] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginWith2FAInput>({
    resolver: zodResolver(loginWith2FASchema),
  });

  const onSubmit = async (data: LoginWith2FAInput) => {
    try {
      setError('');
      const result = await api.post<{
        user?: Parameters<typeof setUser>[0];
        requires2FA?: boolean;
      }>('/auth/login', data);

      if (result.requires2FA) {
        setNeeds2FA(true);
        setCredentials({ email: data.email, password: data.password });
        return;
      }

      if (result.user) {
        setUser(result.user);
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const onSubmit2FA = async (totpCode: string) => {
    if (!credentials) return;
    try {
      setError('');
      const result = await api.post<{ user: Parameters<typeof setUser>[0] }>('/auth/login', {
        ...credentials,
        totpCode,
      });
      setUser(result.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid 2FA code');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TrendingUp className="h-5 w-5" />
          </Link>
          <CardTitle>{needs2FA ? 'Two-factor authentication' : 'Welcome back'}</CardTitle>
          <CardDescription>
            {needs2FA ? 'Enter the 6-digit code from your authenticator app' : 'Sign in to your FinPilot account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {needs2FA ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const code = (e.currentTarget.elements.namedItem('totp') as HTMLInputElement).value;
                onSubmit2FA(code);
              }}
              className="space-y-4"
            >
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="totp">Authentication code</Label>
                <Input id="totp" name="totp" maxLength={6} placeholder="000000" autoComplete="one-time-code" />
              </div>
              <Button type="submit" className="w-full">Verify</Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setNeeds2FA(false)}>
                Back
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register('password')} />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          )}
          {!needs2FA && (
            <>
              <div className="mt-4 text-center text-sm">
                <Link href="/reset-password" className="text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
