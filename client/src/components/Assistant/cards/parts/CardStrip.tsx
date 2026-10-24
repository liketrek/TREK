import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

import { useAssistantView } from '../../assistantViewContext';
import { useCardStrip } from './useCardStrip';

// In the strip's head, never over a card: a press that ends a pixel off still lands on the arrow.
const ARROW =
  'grid h-7 w-7 place-items-center rounded-full bg-surface-card text-content-secondary shadow-sm ring-1 ring-edge-faint transition-colors hover:text-content disabled:cursor-default disabled:opacity-40 disabled:hover:text-content-secondary';

/**
 * A row of cards to swipe or scroll through, running out to the chat's
 * edges: the next card peeks in, so the row says it goes on, and the edges
 * fade where there is more. In the desktop window a head over the row names
 * it, counts it and holds two arrows that move it by whole cards, off while
 * that way is the end. `children` are the cards, each an `li`.
 */
export default function CardStrip({
  label,
  count,
  watch,
  children,
}: {
  label: string;
  count: number;
  /** What the strip shows; a change measures it again. */
  watch: unknown;
  children: ReactNode;
}) {
  const { variant } = useAssistantView();
  const { listRef, fade, measure, page } = useCardStrip(watch);
  return (
    <section aria-label={label} className="-mx-4">
      {variant === 'window' && (fade.start || fade.end) && (
        // The cards are reachable by Tab; the arrows are for the pointer only.
        <div className="mb-1.5 flex items-center gap-2 px-4">
          <span className="min-w-0 flex-1 truncate text-caption font-medium text-content-muted">
            {label}
            <span className="ms-1.5 tabular-nums text-content-faint">{count}</span>
          </span>
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            disabled={!fade.start}
            onClick={() => page(-1)}
            className={ARROW}
          >
            <ChevronLeft size={15} className="rtl:-scale-x-100" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            disabled={!fade.end}
            onClick={() => page(1)}
            className={ARROW}
          >
            <ChevronRight size={15} className="rtl:-scale-x-100" />
          </button>
        </div>
      )}
      <ul
        ref={listRef}
        onScroll={measure}
        data-fade-start={fade.start || undefined}
        data-fade-end={fade.end || undefined}
        className="trek-assistant-strip flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto overscroll-x-contain px-4 pb-2 pt-0.5 motion-safe:scroll-smooth"
      >
        {children}
      </ul>
    </section>
  );
}
