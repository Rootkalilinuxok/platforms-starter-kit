import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import {SpeedInsights} from '@vercel/speed-insights/next';
import {NextIntlClientProvider} from 'next-intl';
import {getLocale, getMessages} from 'next-intl/server';

import './globals.css';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans'
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono'
});

export const metadata: Metadata = {
  title: 'Aurora Platform',
  description: 'Operate faster in regulated markets with automated workflows.'
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
