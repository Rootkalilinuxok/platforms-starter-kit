import { Suspense } from 'react';
import { ResetForm, type ResetSupportedLang } from './reset-form';

const SUPPORTED_LANGS: ResetSupportedLang[] = ['en', 'it'];

export default async function ResetPage({
  params
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const safeLang: ResetSupportedLang = SUPPORTED_LANGS.includes(lang as ResetSupportedLang)
    ? (lang as ResetSupportedLang)
    : 'en';

  return (
    <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Loading…</div>}>
      <ResetForm lang={safeLang} />
    </Suspense>
  );
}
