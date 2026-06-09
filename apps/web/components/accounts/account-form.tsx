'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createAccountSchema,
  type CreateAccountInput,
  SUPPORTED_CURRENCIES,
  AccountType,
  CurrencyCode,
  AccountStatus,
} from '@finpilot/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateAccount, useUpdateAccount, type Account } from '@/hooks/use-api';
import { useEffect } from 'react';

const ACCOUNT_TYPES = Object.values(AccountType);

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
}

export function AccountFormDialog({ open, onOpenChange, account }: AccountFormDialogProps) {
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const isEditing = !!account;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      type: AccountType.SAVINGS,
      currency: CurrencyCode.USD,
      balance: 0,
      status: AccountStatus.ACTIVE,
    },
  });

  useEffect(() => {
    if (account) {
      reset({
        name: account.name,
        type: account.type as CreateAccountInput['type'],
        institution: account.institution || '',
        balance: Number(account.balance),
        currency: account.currency as CreateAccountInput['currency'],
        status: account.status as CreateAccountInput['status'],
      });
    } else {
      reset({
        name: '',
        type: AccountType.SAVINGS,
        currency: CurrencyCode.USD,
        balance: 0,
        status: AccountStatus.ACTIVE,
      });
    }
  }, [account, reset]);

  const onSubmit = async (data: CreateAccountInput) => {
    if (isEditing && account) {
      await updateAccount.mutateAsync({ id: account.id, data });
    } else {
      await createAccount.mutateAsync(data);
    }
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Account' : 'Add Account'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Account type</Label>
            <Select
              value={watch('type')}
              onValueChange={(v) => setValue('type', v as CreateAccountInput['type'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="institution">Institution</Label>
            <Input id="institution" {...register('institution')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="balance">Balance</Label>
              <Input id="balance" type="number" step="0.01" {...register('balance', { valueAsNumber: true })} />
              {errors.balance && <p className="text-sm text-destructive">{errors.balance.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={watch('currency')}
                onValueChange={(v) => setValue('currency', v as CreateAccountInput['currency'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Account' : 'Create Account'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
