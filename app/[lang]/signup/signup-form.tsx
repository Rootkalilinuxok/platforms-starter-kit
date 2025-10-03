'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
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
import { signup } from '@/lib/api/auth';
import { PLANS, type PlanName } from '@/lib/rbac';

const signupSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    plan: z.enum(PLANS)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword']
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export const SIGNUP_TRANSLATIONS = {
  en: {
    title: 'Create your account',
    description: 'Choose a plan to get started with the platform.',
    name: 'Full name',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    plan: 'Plan',
    submit: 'Create account',
    loginCta: 'Already have an account?',
    login: 'Sign in',
    success: 'Account created successfully! Redirecting...',
    error: 'Unable to create your account. Please try again.'
  },
  it: {
    title: 'Crea il tuo account',
    description: 'Scegli un piano per iniziare a usare la piattaforma.',
    name: 'Nome completo',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Conferma password',
    plan: 'Piano',
    submit: 'Crea account',
    loginCta: 'Hai già un account?',
    login: 'Accedi',
    success: 'Account creato con successo! Reindirizzamento...',
    error: 'Impossibile creare il tuo account. Riprova più tardi.'
  }
};

export type SignupSupportedLang = keyof typeof SIGNUP_TRANSLATIONS;

interface SignupFormProps {
  lang: SignupSupportedLang;
}

export function SignupForm({ lang }: SignupFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const locale = useMemo(() => SIGNUP_TRANSLATIONS[lang] ?? SIGNUP_TRANSLATIONS.en, [lang]);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      plan: 'user_free'
    }
  });

  async function handleSubmit(values: SignupFormValues) {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        await signup({
          name: values.name,
          email: values.email,
          password: values.password,
          plan: values.plan as PlanName
        });

        setMessage(locale.success);
        await signIn('credentials', {
          redirect: false,
          email: values.email,
          password: values.password,
          callbackUrl: '/'
        });
        router.push('/');
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
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="name">{locale.name}</Label>
            <Input id="name" {...form.register('name')} autoComplete="name" />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{locale.email}</Label>
            <Input id="email" type="email" {...form.register('email')} autoComplete="email" />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{locale.password}</Label>
            <Input
              id="password"
              type="password"
              {...form.register('password')}
              autoComplete="new-password"
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{locale.confirmPassword}</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...form.register('confirmPassword')}
              autoComplete="new-password"
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">{locale.plan}</Label>
            <select
              id="plan"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...form.register('plan')}
            >
              {PLANS.map((plan) => (
                <option key={plan} value={plan}>
                  {plan.replace('_', ' ')}
                </option>
              ))}
            </select>
            {form.formState.errors.plan && (
              <p className="text-sm text-destructive">{form.formState.errors.plan.message}</p>
            )}
          </div>

          {message && <p className="text-sm text-emerald-600">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? '...' : locale.submit}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>{locale.loginCta}</span>
        <Link href={`/${lang}/login`} className="font-medium text-primary">
          {locale.login}
        </Link>
      </CardFooter>
    </Card>
  );
}
