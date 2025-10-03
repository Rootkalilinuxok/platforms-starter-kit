import {Locale} from './config';

export async function getDictionary(locale: Locale) {
  const dictionaries = {
    en: () => import('./dictionaries/en.json').then((module) => module.default),
    it: () => import('./dictionaries/it.json').then((module) => module.default),
    es: () => import('./dictionaries/es.json').then((module) => module.default)
  } as const;

  return dictionaries[locale]();
}
