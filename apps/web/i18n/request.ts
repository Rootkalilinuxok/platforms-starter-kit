import type {RequestConfig} from 'next-intl/server';

import {getDictionary} from '@/lib/i18n/get-dictionary';
import type {Locale} from '@/lib/i18n/config';

export default async function getRequestConfig({locale}: {locale: string}) {
  const typedLocale = (locale as Locale) ?? 'en';

  return {
    locale: typedLocale,
    messages: await getDictionary(typedLocale)
  } satisfies RequestConfig;
}
