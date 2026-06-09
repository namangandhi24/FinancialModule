'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
  SUPPORTED_CURRENCIES,
  CurrencyCode,
} from '@finpilot/shared';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUser, useUpdateProfile, useChangePassword, useSessions, useRevokeSession, useSetup2FA, useEnable2FA, useDisable2FA } from '@/hooks/use-api';

export default function SettingsPage() {
  const { user } = useUser();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [twoFAMessage, setTwoFAMessage] = useState('');
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [totpToken, setTotpToken] = useState('');

  const { data: sessions } = useSessions();
  const revokeSession = useRevokeSession();
  const setup2FA = useSetup2FA();
  const enable2FA = useEnable2FA();
  const disable2FA = useDisable2FA();

  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    values: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      defaultCurrency: (user?.defaultCurrency as UpdateProfileInput['defaultCurrency']) || CurrencyCode.USD,
    },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onProfileSubmit = async (data: UpdateProfileInput) => {
    await updateProfile.mutateAsync(data);
    setProfileMessage('Profile updated successfully');
    setTimeout(() => setProfileMessage(''), 3000);
  };

  const onPasswordSubmit = async (data: ChangePasswordInput) => {
    try {
      setPasswordError('');
      await changePassword.mutateAsync(data);
      setPasswordMessage('Password changed successfully');
      passwordForm.reset();
      setTimeout(() => setPasswordMessage(''), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  return (
    <DashboardShell title="Settings">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              {profileMessage && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                  {profileMessage}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" {...profileForm.register('firstName')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" {...profileForm.register('lastName')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Default currency</Label>
                <Select
                  value={profileForm.watch('defaultCurrency')}
                  onValueChange={(v) =>
                    profileForm.setValue('defaultCurrency', v as UpdateProfileInput['defaultCurrency'])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              {passwordMessage && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                  {passwordMessage}
                </div>
              )}
              {passwordError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {passwordError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? 'Changing...' : 'Change password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Manage devices signed into your account</CardDescription>
          </CardHeader>
          <CardContent>
            {!sessions?.length ? (
              <p className="text-sm text-muted-foreground">No active sessions.</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{session.userAgent || 'Unknown device'}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.ipAddress || 'Unknown IP'} · Expires{' '}
                        {new Date(session.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeSession.mutate(session.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>Add an extra layer of security with TOTP</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {twoFAMessage && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                {twoFAMessage}
              </div>
            )}
            {setupData && (
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">Scan this in your authenticator app:</p>
                <p className="text-xs break-all text-muted-foreground">{setupData.otpauthUrl}</p>
                <p className="text-xs text-muted-foreground">Secret: {setupData.secret}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="6-digit code"
                maxLength={6}
                value={totpToken}
                onChange={(e) => setTotpToken(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={async () => {
                  const data = await setup2FA.mutateAsync();
                  setSetupData(data);
                }}
                disabled={setup2FA.isPending}
              >
                Setup
              </Button>
              <Button
                onClick={async () => {
                  await enable2FA.mutateAsync(totpToken);
                  setTwoFAMessage('2FA enabled successfully');
                  setSetupData(null);
                  setTotpToken('');
                }}
                disabled={!totpToken || enable2FA.isPending}
              >
                Enable
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await disable2FA.mutateAsync(totpToken);
                  setTwoFAMessage('2FA disabled');
                  setTotpToken('');
                }}
                disabled={!totpToken || disable2FA.isPending}
              >
                Disable
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
