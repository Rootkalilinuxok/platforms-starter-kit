import {getTranslations} from 'next-intl/server';

import {DocumentFeed} from '@/components/dashboard/document-feed';
import {SummaryCallouts} from '@/components/dashboard/summary-callouts';
import {loadJsonContent} from '@/lib/content';
import type {Locale} from '@/lib/i18n/config';

interface DashboardContent {
  summaries: Array<{title: string; body: string; tone: 'info' | 'success' | 'warning'}>;
  documents: Array<{id: string; name: string; submittedAt: string; status: 'pending' | 'approved' | 'rejected'}>;
}

export default async function DashboardHome({
  params
}: {
  params: Promise<{lang: Locale}>;
}) {
  const {lang} = await params;
  const tDashboard = await getTranslations({locale: lang, namespace: 'dashboard'});
  const content = await loadJsonContent<DashboardContent>('core/dashboard.json');

  return (
    <div className="space-y-10">
      <SummaryCallouts items={content.summaries} />
      <DocumentFeed title={tDashboard('documents.title')} emptyLabel={tDashboard('documents.empty')} items={content.documents} />
    </div>
  );
}
