import {ReactNode} from 'react';
import {notFound} from 'next/navigation';

import {isLocale, locales} from '@/lib/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({lang: locale}));
}

interface CoreLayoutProps {
  children: ReactNode;
  params: Promise<{lang: string}>;
}

export default async function CoreLayout({children, params}: CoreLayoutProps) {
  const {lang} = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  return <div className="min-h-screen bg-muted/10">{children}</div>;
}
