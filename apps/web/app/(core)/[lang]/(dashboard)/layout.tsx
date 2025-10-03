import {ReactNode} from 'react';

import {DashboardShell} from '@/components/layouts/dashboard-shell';
import type {Locale} from '@/lib/i18n/config';

interface DashboardLayoutProps {
  children: ReactNode;
  params: Promise<{lang: Locale}>;
}

export default async function DashboardLayout({children, params}: DashboardLayoutProps) {
  const {lang} = await params;
  return <DashboardShell locale={lang}>{children}</DashboardShell>;
}
