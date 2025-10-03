'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LOGIN_TRANSLATIONS = {
  en: {
    title: 'Welcome back',
    description: 'Sign in with your account or continue with a provider.',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    signupCta: "Don't have an account?",
    signup: 'Create one',
    reset: 'Forgot password?',
    oauth: 'Continue with',
    error: 'Unable to sign in with those credentials.'
  },
  it: {
    title: 'Bentornato',
    description: 'Accedi con il tuo account o continua con un provider.',
    email: 'Email',
    password: 'Password',
    submit: 'Accedi',
    signupCta: 'Non hai un account?',
    signup: 'Creane uno',
    reset: 'Password dimenticata?',
    oauth: 'Continua con',
    error: 'Impossibile accedere con queste credenziali.'
  }
};

export type LoginSupportedLang = keyof typeof LOGIN_TRANSLATIONS;

interface LoginFormProps {
  lang: LoginSupportedLang;
}

export function LoginForm({ lang }: LoginFormProps) {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const locale = useMemo(() => LOGIN_TRANSLATIONS[lang] ?? LOGIN_TRANSLATIONS.en, [lang]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  async function handleSubmit(values: LoginFormValues) {
    setError(null);

    startTransition(async () => {
      const callbackUrl = searchParams.get('callbackUrl') ?? '/';
      const result = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
        callbackUrl
      });

      if (result?.error) {
        setError(locale.error);
        return;
      }

      if (result?.url) {
        window.location.href = result.url;
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
              autoComplete="current-password"
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? '...' : locale.submit}
          </Button>
        </form>

        <div className="grid grid-cols-1 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => signIn('google')}
            disabled={isPending}
          >
            {locale.oauth} Google
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => signIn('github')}
            disabled={isPending}
          >
            {locale.oauth} GitHub
          </Button>
          <Button type="button" variant="outline" onClick={() => signIn('email')} disabled={isPending}>
            {locale.oauth} Email
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-3">
        <Link href={`/${lang}/reset`} className="text-sm text-muted-foreground hover:text-primary">
          {locale.reset}
        </Link>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>{locale.signupCta}</span>
          <Link href={`/${lang}/signup`} className="font-medium text-primary">
            {locale.signup}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
