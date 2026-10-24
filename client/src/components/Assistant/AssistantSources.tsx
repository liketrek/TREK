import type { AssistantSources as Sources } from '@trek/shared';
import { Globe } from 'lucide-react';

import { useTranslation } from '../../i18n';

/** A page's host without "www.", as the chip names it; the whole address where it does not read as one. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * The pages an answer drew on from the provider's web search, under its text:
 * a row of quiet chips with each page's site and title, opening in a new tab.
 * No page's icon is loaded, so showing the sources asks no site for anything.
 */
export default function AssistantSources({ sources }: { sources: Sources['sources'] }) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t('assistant.sources.title')} className="flex flex-col gap-1.5">
      <span className="font-geist text-caption font-bold uppercase tracking-[.08em] text-content-faint">
        {t('assistant.sources.title')}
      </span>
      <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
        {sources.map((source) => (
          <li key={source.url} className="min-w-0 max-w-full">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              title={source.title}
              className="flex min-w-0 max-w-[16rem] items-center gap-1.5 rounded-full border border-edge-faint bg-surface-secondary px-2.5 py-1 text-caption text-content-secondary no-underline transition-colors hover:bg-surface-hover hover:text-content"
            >
              <Globe size={11} strokeWidth={2.2} aria-hidden="true" className="flex-none text-content-faint" />
              <span className="flex-none font-medium">{hostOf(source.url)}</span>
              {source.title && source.title !== source.url && (
                <bdi className="min-w-0 truncate text-content-muted">{source.title}</bdi>
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
