import { Suspense } from 'react';
import { SignupForm, type SignupSupportedLang } from './signup-form';

const SUPPORTED_LANGS: SignupSupportedLang[] = ['en', 'it'];

export default async function SignupPage({
  params
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const safeLang: SignupSupportedLang = SUPPORTED_LANGS.includes(lang as SignupSupportedLang)
    ? (lang as SignupSupportedLang)
    : 'en';

  return (
    <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Loading…</div>}>
      <SignupForm lang={safeLang} />
    </Suspense>
  );
}
