import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';

import {Leaderboard} from '@/components/tables/leaderboard';
import {MetricsTable} from '@/components/tables/metrics-table';
import {SectionHeading} from '@/components/sections/section-heading';
import {loadJsonContent} from '@/lib/content';
import type {Locale} from '@/lib/i18n/config';
import {locales} from '@/lib/i18n/config';

interface ComparatorContent {
  [key: string]: {
    leaders: Array<{name: string; coverage: string; automation: number; countries: number}>;
  };
}

export function generateStaticParams() {
  const verticals = ['banking', 'insurance', 'utilities'];
  return locales.flatMap((locale) => verticals.map((vertical) => ({lang: locale, vertical})));
}

export default async function ComparatorPage({
  params
}: {
  params: Promise<{lang: Locale; vertical: string}>;
}) {
  const {lang, vertical} = await params;
  const data = await loadJsonContent<ComparatorContent>('core/comparators.json');
  const entry = data[vertical];

  if (!entry) {
    notFound();
  }

  const verticalT = await getTranslations({
    locale: lang,
    namespace: `comparators.verticals.${vertical}`
  });

  const metrics = verticalT.raw('metrics') as Array<{label: string; unit: string}>;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-10">
      <SectionHeading
        eyebrow={verticalT('name')}
        title={verticalT('summary')}
        description="Benchmarks refreshed every week across thousands of customer journeys."
      />
      <MetricsTable metrics={metrics} />
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Leaders this quarter</h3>
        <Leaderboard leaders={entry.leaders} />
      </div>
    </div>
  );
}
