import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

const SUPPORTED_LANGS = ['en', 'it'];

export function generateStaticParams() {
  return SUPPORTED_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const language = SUPPORTED_LANGS.includes(lang) ? lang : 'en';

  return {
    title: {
      template: `%s | Platforms Starter Kit`,
      default: `Auth | Platforms Starter Kit`
    },
    alternates: {
      canonical: `/${language}`
    }
  };
}

export default async function LangLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!SUPPORTED_LANGS.includes(lang)) {
    notFound();
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
      <div className="w-full max-w-md">{children}</div>
    </section>
  );
}
