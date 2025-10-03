import { Suspense } from 'react';
import { LoginForm, type LoginSupportedLang } from './login-form';

const SUPPORTED_LANGS: LoginSupportedLang[] = ['en', 'it'];

export default async function LoginPage({
  params
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const safeLang: LoginSupportedLang = SUPPORTED_LANGS.includes(lang as LoginSupportedLang)
    ? (lang as LoginSupportedLang)
    : 'en';

  return (
    <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Loading…</div>}>
      <LoginForm lang={safeLang} />
    </Suspense>
  );
}
