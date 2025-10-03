'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import type {Route} from 'next';
import {ReactNode} from 'react';
import {useTranslations} from 'next-intl';

import {cn} from '@/lib/utils';

type Translator = ReturnType<typeof useTranslations>;

interface NavItem {
  href: string;
  label: (translators: {dashboard: Translator; common: Translator}) => string;
}

const navItems: NavItem[] = [
  {
    href: 'dashboard',
    label: ({common}) => common('nav.dashboard')
  },
  {
    href: 'documenti',
    label: ({dashboard}) => dashboard('documents.title')
  },
  {
    href: 'impostazioni',
    label: ({dashboard}) => dashboard('settings.title')
  }
];

interface DashboardShellProps {
  locale: string;
  children: ReactNode;
}

export function DashboardShell({locale, children}: DashboardShellProps) {
  const pathname = usePathname();
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 flex-col border-r border-border/60 bg-muted/20 p-6 md:flex">
        <div className="text-lg font-semibold">{tCommon('productName')}</div>
        <nav className="mt-8 flex flex-col gap-1 text-sm">
          {navItems.map((item) => {
            const href = `/${locale}/${item.href}` as Route;
            const isActive = pathname === href;
            const label = item.label({dashboard: tDashboard, common: tCommon});

            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  'rounded-md px-3 py-2 font-medium transition hover:bg-primary/10 hover:text-primary',
                  isActive && 'bg-primary/15 text-primary'
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">{tDashboard('welcome')}</h1>
            <p className="text-sm text-muted-foreground">{tDashboard('overview')}</p>
          </div>
          <Link
            href={`/${locale}/prezzi`}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm"
          >
            {tCommon('cta.primary')}
          </Link>
        </header>
        <main className="flex-1 space-y-12 bg-muted/10 px-6 py-10">{children}</main>
      </div>
    </div>
  );
}
