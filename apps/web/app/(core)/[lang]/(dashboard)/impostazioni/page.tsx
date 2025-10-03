import {getTranslations} from 'next-intl/server';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import type {Locale} from '@/lib/i18n/config';

const controls = [
  {
    id: 'workflow-policies',
    title: 'Workflow policies',
    description: 'Configure approval chains, manual review limits and escalation paths.'
  },
  {
    id: 'data-residency',
    title: 'Data residency',
    description: 'Select storage regions and retention periods aligned with your regulators.'
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Manage API keys, webhook endpoints and partner data exchanges.'
  }
];

export default async function SettingsPage({
  params
}: {
  params: Promise<{lang: Locale}>;
}) {
  const {lang} = await params;
  const tDashboard = await getTranslations({locale: lang, namespace: 'dashboard'});

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">{tDashboard('settings.description')}</p>
      <div className="grid gap-6 md:grid-cols-3">
        {controls.map((control) => (
          <Card key={control.id} className="border-border/60">
            <CardHeader>
              <CardTitle>{control.title}</CardTitle>
              <CardDescription>{control.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm">
                Manage
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
