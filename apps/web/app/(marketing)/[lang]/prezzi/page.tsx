import {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';

import {ComparisonTable} from '@/components/tables/comparison-table';
import {PricingGrid, type PricingGridProps} from '@/components/pricing/pricing-grid';
import {SectionHeading} from '@/components/sections/section-heading';
import {loadJsonContent} from '@/lib/content';
import type {Locale} from '@/lib/i18n/config';
import {locales} from '@/lib/i18n/config';

interface PricingContent {
  addons: Array<{title: string; description: string; price: string}>;
  comparisons: Array<{category: string; aurora: string; legacy: string}>;
}

export const metadata: Metadata = {
  title: 'Pricing — Aurora Platform',
  description: 'Transparent packages designed for regulated operators.'
};

export function generateStaticParams() {
  return locales.map((locale) => ({lang: locale}));
}

export default async function PricingPage({
  params
}: {
  params: Promise<{lang: Locale}>;
}) {
  const {lang} = await params;
  const tMarketing = await getTranslations({locale: lang, namespace: 'marketing'});
  const tPricing = await getTranslations({locale: lang, namespace: 'pricing'});

  const content = await loadJsonContent<PricingContent>('marketing/pricing.json');
  const plans = tPricing.raw('plans') as PricingGridProps['plans'];

  return (
    <div className="flex flex-col gap-16">
      <section className="space-y-6">
        <SectionHeading
          eyebrow={tMarketing('pricing.subtitle')}
          title={tMarketing('pricing.title')}
          description={tMarketing('pricing.subtitle')}
        />
        <PricingGrid plans={plans} />
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="What’s included"
          title="Add-ons for regulated operators"
          description="Extend Aurora with advanced automation, compliance tooling and dedicated expertise."
        />
        <div className="grid gap-6 md:grid-cols-2">
          {content.addons.map((addon) => (
            <div key={addon.title} className="rounded-2xl border border-border/60 bg-background/70 p-6 shadow-sm">
              <h3 className="text-xl font-semibold">{addon.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{addon.description}</p>
              <span className="mt-3 inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                {addon.price}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Aurora vs legacy"
          title="How Aurora compares"
          description="Benchmarks collected from operators transitioning from legacy BPM suites."
        />
        <ComparisonTable rows={content.comparisons} />
      </section>
    </div>
  );
}
