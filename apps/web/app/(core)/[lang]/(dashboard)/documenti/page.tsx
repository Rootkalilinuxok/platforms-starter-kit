import {getTranslations} from 'next-intl/server';

import {DocumentFeed, type DocumentItem} from '@/components/dashboard/document-feed';
import {loadJsonContent} from '@/lib/content';
import type {Locale} from '@/lib/i18n/config';

export default async function DocumentsPage({
  params
}: {
  params: Promise<{lang: Locale}>;
}) {
  const {lang} = await params;
  const tDashboard = await getTranslations({locale: lang, namespace: 'dashboard'});
  const documents = await loadJsonContent<DocumentItem[]>('core/documents.json');

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        {tDashboard('documents.title')} aggregated from your connected workspaces.
      </p>
      <DocumentFeed title={tDashboard('documents.title')} emptyLabel={tDashboard('documents.empty')} items={documents} />
    </div>
  );
}
