import {ReactNode} from 'react';
import {notFound} from 'next/navigation';

import {MarketingShell} from '@/components/layouts/marketing-shell';
import {isLocale, locales} from '@/lib/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({lang: locale}));
}

interface MarketingLayoutProps {
  children: ReactNode;
  params: Promise<{lang: string}>;
}

export default async function MarketingLayout({children, params}: MarketingLayoutProps) {
  const {lang} = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  return <MarketingShell locale={lang}>{children}</MarketingShell>;
}
