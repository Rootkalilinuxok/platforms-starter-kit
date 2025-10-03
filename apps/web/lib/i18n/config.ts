import type {LocalePrefix} from 'next-intl/routing';

export const locales = ['en', 'it', 'es'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localePrefix: LocalePrefix = 'always';

export const namespaceSeparator = '.' as const;

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
