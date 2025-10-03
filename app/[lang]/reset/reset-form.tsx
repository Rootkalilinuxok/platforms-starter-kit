'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { normalizeApiError } from '@/lib/api/client';
import { requestPasswordReset } from '@/lib/api/auth';

const resetSchema = z.object({
  email: z.string().email()
});

type ResetFormValues = z.infer<typeof resetSchema>;

export const RESET_TRANSLATIONS = {
  en: {
    title: 'Reset your password',
    description: 'Enter your email to receive a reset link.',
    email: 'Email',
    submit: 'Send reset link',
    backToLogin: 'Back to sign in',
    success: 'If the email exists we have sent a reset link.',
    error: 'Unable to process your request right now.'
  },
  it: {
    title: 'Reimposta la password',
    description: 'Inserisci la tua email per ricevere il link di reset.',
    email: 'Email',
    submit: 'Invia link di reset',
    backToLogin: 'Torna al login',
    success: 'Se la mail esiste ti abbiamo inviato un link di reset.',
    error: 'Impossibile elaborare la richiesta in questo momento.'
  }
};

export type ResetSupportedLang = keyof typeof RESET_TRANSLATIONS;

interface ResetFormProps {
  lang: ResetSupportedLang;
}

export function ResetForm({ lang }: ResetFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const locale = useMemo(() => RESET_TRANSLATIONS[lang] ?? RESET_TRANSLATIONS.en, [lang]);

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: ''
    }
  });

  async function handleSubmit(values: ResetFormValues) {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        await requestPasswordReset(values);
        setMessage(locale.success);
      } catch (err) {
        const apiError = normalizeApiError(err);
        setError(apiError.message ?? locale.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{locale.title}</CardTitle>
        <CardDescription>{locale.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email">{locale.email}</Label>
            <Input id="email" type="email" {...form.register('email')} autoComplete="email" />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          {message && <p className="text-sm text-emerald-600">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? '...' : locale.submit}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        <Link href={`/${lang}/login`} className="font-medium text-primary">
          {locale.backToLogin}
        </Link>
      </CardFooter>
    </Card>
  );
}
