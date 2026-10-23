import type { BookPageCard, BookPageSetup, BookSpread } from '@trek/shared';
import { useMemo } from 'react';

import { useTranslation } from '../../../../i18n';
import { useStudioStore } from '../../../../store/studioStore';
import { SpreadThumb } from '../../../Studio/SpreadThumb';
import { useStudioPageHint } from '../../../Studio/useStudioPageHint';
import type { ChangeItem } from '../../assistantParts';
import { useAssistantScope, useAssistantView } from '../../assistantViewContext';
import { type BookPageView, pageViewOf } from './bookCardModel';

/**
 * The page of a book change drawn small, from the book open in the Studio:
 * while the change waits, the page as it is and as the change would leave it
 * (the page the server's trial made, which the card carries, while the book
 * is at the version the trial ran on; a delete draws each page it takes);
 * once applied, the page as it is now. Each is the editor's own view under a
 * scale, so the card can never look different from the page. Pressing one
 * shows that page in the Studio. Nothing where the Studio does not hold the
 * page, outside the Studio or on another book.
 */

/** A thumbnail's height in pixels; its width follows the page. */
const THUMB_HEIGHT = 72;

/** One page drawn small; pressing it shows the page in the Studio, pointing at it outlines it in the page rail. */
function PageThumb({
  spread,
  page,
  caption,
  onShow,
}: {
  spread: BookSpread;
  page: BookPageSetup;
  caption: string | null;
  onShow: () => void;
}) {
  const { t } = useTranslation();
  const hint = useStudioPageHint(spread.id);
  const wide = spread.role === 'inner' ? page.pageWidth * 2 : page.pageWidth;
  return (
    <button
      type="button"
      onClick={onShow}
      {...hint}
      aria-label={t('assistant.card.book.showPage')}
      className="flex flex-col items-start gap-0.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <SpreadThumb
        spread={spread}
        page={page}
        width={(THUMB_HEIGHT * wide) / page.pageHeight}
        className="relative overflow-hidden rounded-sm ring-1 ring-edge-faint"
      />
      {caption && <span className="text-caption text-content-faint">{caption}</span>}
    </button>
  );
}

/** One page of the change: before and after it, "Before" and "After" under them when both are drawn. */
function PageViewThumbs({ view, page, onShow }: { view: BookPageView; page: BookPageSetup; onShow: () => void }) {
  const { t } = useTranslation();
  return (
    <>
      {view.before && (
        <PageThumb
          spread={view.before}
          page={page}
          caption={view.after ? t('assistant.card.book.before') : null}
          onShow={onShow}
        />
      )}
      {view.after && (
        <PageThumb
          spread={view.after}
          page={page}
          caption={view.before ? t('assistant.card.book.after') : null}
          onShow={onShow}
        />
      )}
    </>
  );
}

export default function BookPageThumbs({ card, item }: { card: BookPageCard; item: ChangeItem }) {
  const scope = useAssistantScope();
  const version = useAssistantView().bookVersion ?? null;
  const doc = useStudioStore((s) => s.doc);
  const setActiveSpread = useStudioStore((s) => s.setActiveSpread);
  const views = useMemo(() => pageViewOf(card, doc, item.state, version), [card, doc, item.state, version]);
  // The Studio's book is this card's only in this journey's chat; anywhere else it may be another or an old copy.
  const ownBook = scope.kind === 'journey' && scope.journeyId === card.journeyId;
  if (!ownBook || views.length === 0 || !doc) return null;
  return (
    <div className="flex flex-wrap items-end gap-2">
      {views.map((view) => (
        <PageViewThumbs key={view.index} view={view} page={doc.page} onShow={() => setActiveSpread(view.index)} />
      ))}
    </div>
  );
}
