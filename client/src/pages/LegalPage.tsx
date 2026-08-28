import React from 'react';
import { Link } from 'react-router';

import { useTranslation } from '../i18n';
import { useLegalPage } from './legal/useLegalPage';

export default function LegalPage(): React.ReactElement {
  const { t } = useTranslation();
  const { config } = useLegalPage();

  return (
    <main className="min-h-screen bg-surface px-4 py-12 text-content">
      <article className="mx-auto max-w-2xl rounded-2xl border border-edge bg-surface-card p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-bold">{t('legal.title')}</h1>
        <p className="mt-3 text-sm leading-6 text-content-muted">{t('legal.description')}</p>
        <section className="bg-surface-subtle mt-6 rounded-xl border border-edge p-4">
          <h2 className="font-semibold">GNU Affero General Public License v3</h2>
          <p className="mt-2 text-sm leading-6 text-content-muted">{t('legal.agpl')}</p>
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.en.html"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm underline"
          >
            {t('legal.license')}
          </a>
        </section>
        <section className="bg-surface-subtle mt-4 rounded-xl border border-edge p-4">
          <h2 className="font-semibold">{t('legal.source')}</h2>
          <p className="mt-2 text-sm text-content-muted">{t('legal.sourceDescription')}</p>
          {config?.sourceCodeUrl && (
            <a
              href={config.sourceCodeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block break-all text-sm underline"
            >
              {config.sourceCodeUrl}
            </a>
          )}
          {config?.version && <p className="mt-2 text-xs text-content-faint">v{config.version}</p>}
        </section>
        <Link to="/" className="mt-6 inline-block text-sm underline">
          {t('common.back')}
        </Link>
      </article>
    </main>
  );
}
