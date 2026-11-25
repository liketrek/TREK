import type { TravelPlanDraft, TravelPlanSource } from '@trek/shared';
import { BadgeCheck, Database, ExternalLink } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../i18n';

interface TravelDraftSourcesProps {
  draft: TravelPlanDraft;
}

/** One row per distinct provider record the draft cites, with when it was checked. */
function collectSources(draft: TravelPlanDraft): TravelPlanSource[] {
  const seen = new Map<string, TravelPlanSource>();
  for (const day of draft.days) {
    for (const item of day.items) {
      const key = `${item.source.provider}|${item.source.sourceId ?? ''}|${item.source.checkedAt}`;
      if (!seen.has(key)) seen.set(key, item.source);
    }
  }
  return [...seen.values()];
}

export default function TravelDraftSources({ draft }: TravelDraftSourcesProps): React.ReactElement {
  const { t } = useTranslation();
  const sources = collectSources(draft);

  return (
    <section className="rounded-2xl border border-edge bg-surface-card p-4 shadow-sm sm:p-5">
      <header className="mb-3 flex items-center gap-2">
        <Database size={16} className="text-content-muted" />
        <h2 className="text-body font-semibold text-content">{t('planner.ai.sources')}</h2>
        {draft.factsCheckedAt && (
          <span className="ms-auto text-caption text-content-muted">
            {t('planner.ai.factsCheckedAt', { time: draft.factsCheckedAt })}
          </span>
        )}
      </header>

      {sources.length === 0 ? (
        <p className="text-body text-content-muted">{t('planner.ai.noSources')}</p>
      ) : (
        <ul className="space-y-2">
          {sources.map((source) => {
            const key = `${source.provider}|${source.sourceId ?? ''}|${source.checkedAt}`;
            return (
              <li
                key={key}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-surface-secondary px-3 py-2 text-caption"
              >
                <BadgeCheck size={14} className="text-success" />
                <span className="font-medium text-content">{source.provider}</span>
                {source.sourceId && (
                  <span className="inline-flex items-center gap-1 text-content-muted">
                    <ExternalLink size={11} />
                    {source.sourceId}
                  </span>
                )}
                <span className="text-content-muted">
                  {t('planner.ai.sourceCheckedAt', { time: source.checkedAt })}
                </span>
                <span className="ms-auto rounded-full bg-surface-tertiary px-2 py-0.5 text-content-secondary">
                  {t(`planner.ai.freshness.${source.freshness}`)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
