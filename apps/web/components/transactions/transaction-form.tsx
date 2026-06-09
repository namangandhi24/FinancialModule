'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createTransactionSchema,
  type CreateTransactionInput,
  TransactionType,
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
import {
  useCreateTransaction,
  useUpdateTransaction,
  useAccounts,
  useCategories,
  type Transaction,
} from '@/hooks/use-api';
import { useEffect } from 'react';

const TX_TYPES = Object.values(TransactionType);

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction;
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
}: TransactionFormDialogProps) {
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const isEditing = !!transaction;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      type: TransactionType.EXPENSE,
      date: new Date(),
      tags: [],
    },
  });

  const txType = watch('type');

  useEffect(() => {
    if (transaction) {
      reset({
        accountId: transaction.accountId,
        amount: Number(transaction.amount),
        date: new Date(transaction.date),
        merchant: transaction.merchantName || '',
        categoryId: transaction.categoryId,
        notes: transaction.notes || '',
        type: transaction.type as CreateTransactionInput['type'],
        tags: transaction.tags || [],
      });
    } else {
      reset({
        accountId: accounts?.[0]?.id || '',
        amount: 0,
        date: new Date(),
        type: TransactionType.EXPENSE,
        tags: [],
      });
    }
  }, [transaction, accounts, reset]);

  const onSubmit = async (data: CreateTransactionInput) => {
    if (isEditing && transaction) {
      await updateTx.mutateAsync({
        id: transaction.id,
        data: { ...data, updatedAt: transaction.updatedAt },
      });
    } else {
      await createTx.mutateAsync(data);
    }
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Account</Label>
            <Select
              value={watch('accountId')}
              onValueChange={(v) => setValue('accountId', v)}
            >
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
            {errors.accountId && <p className="text-sm text-destructive">{errors.accountId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={watch('type')}
                onValueChange={(v) => setValue('type', v as CreateTransactionInput['type'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TX_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" {...register('amount', { valueAsNumber: true })} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
          </div>

          {txType === TransactionType.TRANSFER && (
            <div className="space-y-2">
              <Label>Transfer to</Label>
              <Select
                value={watch('transferToAccountId') || ''}
                onValueChange={(v) => setValue('transferToAccountId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.filter((a) => a.id !== watch('accountId')).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              {...register('date', {
                setValueAs: (v) => (v ? new Date(v) : new Date()),
              })}
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant</Label>
            <Input id="merchant" {...register('merchant')} />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={watch('categoryId') || ''}
              onValueChange={(v) => setValue('categoryId', v || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" {...register('notes')} />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create Transaction'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
