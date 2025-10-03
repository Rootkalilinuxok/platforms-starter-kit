import {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {LucideIcon, Radar, ShieldCheck, Workflow} from 'lucide-react';

import {DualCta} from '@/components/cta/dual-cta';
import {FeatureCard} from '@/components/cards/feature-card';
import {MdxContent} from '@/components/mdx-content';
import {SectionHeading} from '@/components/sections/section-heading';
import {StatsGrid} from '@/components/sections/stats-grid';
import {loadJsonContent, loadMdxContent} from '@/lib/content';
import type {Locale} from '@/lib/i18n/config';
import {locales} from '@/lib/i18n/config';

interface HomeContent {
  hero: {
    primaryCta: {href: string; label: string};
    secondaryCta?: {href: string; label: string};
  };
  features: Array<{
    icon: keyof typeof iconMap;
    title: string;
    description: string;
  }>;
  stats: Array<{value: string; label: string}>;
}

const iconMap: Record<string, LucideIcon> = {
  radar: Radar,
  workflow: Workflow,
  'shield-check': ShieldCheck
};

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({lang: locale}));
}

export const metadata: Metadata = {
  title: 'Aurora Platform',
  description: 'Unified operations for regulated markets.'
};

function withLocaleHref(locale: string, href?: string) {
  if (!href) return undefined;
  if (href.startsWith('http')) return href;
  return `/${locale}${href}`;
}

export default async function HomePage({
  params
}: {
  params: Promise<{lang: Locale}>;
}) {
  const {lang} = await params;
  const tMarketing = await getTranslations({locale: lang, namespace: 'marketing'});
  const tCommon = await getTranslations({locale: lang, namespace: 'common'});

  const homeContent = await loadJsonContent<HomeContent>('marketing/home.json');
  const heroCopy = await loadMdxContent('marketing/home.mdx');

  return (
    <div className="flex flex-col gap-16">
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <div className="space-y-6">
          <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {tMarketing('hero.badge')}
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {tMarketing('hero.title')}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            {tMarketing('hero.body')}
          </p>
          <DualCta
            primary={{
              href: withLocaleHref(lang, homeContent.hero.primaryCta.href),
              label: tCommon('cta.primary')
            }}
            secondary={
              homeContent.hero.secondaryCta
                ? {
                    href: withLocaleHref(lang, homeContent.hero.secondaryCta.href),
                    label: homeContent.hero.secondaryCta.label
                  }
                : undefined
            }
            caption={tCommon('tagline')}
          />
        </div>
        <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-xl shadow-primary/10">
          <MdxContent source={heroCopy} />
        </div>
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow={tMarketing('highlights.title')}
          title={tCommon('productName')}
          description={tCommon('tagline')}
        />
        <div className="grid gap-6 md:grid-cols-3">
          {homeContent.features.map((feature) => {
            const Icon = iconMap[feature.icon] ?? Radar;
            return (
              <FeatureCard
                key={feature.title}
                icon={Icon}
                title={feature.title}
                description={feature.description}
              />
            );
          })}
        </div>
      </section>

      <section className="space-y-8">
        <SectionHeading title={tMarketing('testimonials.title')} description={tMarketing('testimonials.quote')} />
        <blockquote className="rounded-3xl border border-border/60 bg-background/80 p-8 text-lg font-medium italic text-muted-foreground">
          “{tMarketing('testimonials.quote')}”
          <footer className="mt-4 text-sm font-semibold not-italic text-foreground">
            — {tMarketing('testimonials.author')}
          </footer>
        </blockquote>
        <StatsGrid items={homeContent.stats} />
      </section>
    </div>
  );
}
