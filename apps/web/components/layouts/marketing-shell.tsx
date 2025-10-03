'use client';

import Link from 'next/link';
import {ReactNode} from 'react';
import {useTranslations} from 'next-intl';

import {buttonVariants} from '@/components/ui/button';
import {cn} from '@/lib/utils';

interface MarketingShellProps {
  children: ReactNode;
  locale: string;
}

export function MarketingShell({children, locale}: MarketingShellProps) {
  const t = useTranslations('common');

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href={`/${locale}`} className="text-lg font-semibold tracking-tight">
            {t('productName')}
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <Link href={`/${locale}/prezzi`} className={cn(buttonVariants({variant: 'ghost'}), 'px-4')}>
              {t('nav.pricing')}
            </Link>
            <Link href={`/${locale}/comparatori/banking`} className={cn(buttonVariants({variant: 'ghost'}), 'px-4')}>
              {t('nav.comparators')}
            </Link>
            <Link href={`/${locale}/dashboard`} className={cn(buttonVariants({variant: 'ghost'}), 'px-4')}>
              {t('nav.dashboard')}
            </Link>
            <Link href={`/${locale}/prezzi`} className={cn(buttonVariants({variant: 'default'}), 'ml-2 px-4')}>
              {t('cta.primary')}
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-16 sm:py-24">
        {children}
      </main>
      <footer className="border-t border-border/60 bg-background/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-4 px-6 py-10 text-sm text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()} {t('productName')}. {t('footer.rights')}
          </span>
          <Link href={`/${locale}/prezzi`} className="hover:text-foreground">
            {t('footer.contact')}
          </Link>
        </div>
      </footer>
    </div>
  );
}
