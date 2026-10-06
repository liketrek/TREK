import { ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { useTranslation } from '../../i18n';
import JournalBody from './JournalBody';

/**
 * The story, folded, with whatever else belongs behind the fold.
 *
 * Nine lines was most of a screen: a feed of long entries read as a wall, and the
 * fold only earned its keep on the very longest of them (discussion #2299). Four
 * lines is enough to know whether this is the entry you were looking for.
 *
 * `children` is the rest of what unfolding reveals — today the pros and cons,
 * which are a detail of one entry rather than something to scan a journey by.
 * They keep the toggle alive on their own, so an entry with a two-line story and
 * a verdict still offers a way to see it.
 */
export function ExpandableStory({ story, children }: { story: string; children?: ReactNode }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const measuredRef = useRef(false);

  useEffect(() => {
    measuredRef.current = false;
  }, [story]);

  useEffect(() => {
    if (measuredRef.current) return;
    const el = ref.current;
    if (el && !expanded) {
      setClamped(el.scrollHeight > el.clientHeight);
      measuredRef.current = true;
    }
  });

  // The text block toggles the same clamp as the Show more / Show less buttons
  // below it. It only takes focus while there is something to toggle, so a
  // short story stays plain text instead of an empty stop in the tab order.
  const hasFold = clamped || !!children;
  const toggle: HTMLAttributes<HTMLDivElement> =
    hasFold || expanded
      ? {
          role: 'button',
          tabIndex: 0,
          'aria-expanded': expanded,
          onClick: () => setExpanded((e) => !e),
          onKeyDown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setExpanded((v) => !v);
            }
          },
        }
      : {};

  return (
    <div>
      <div
        ref={ref}
        {...toggle}
        className={`text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300 ${
          expanded ? '' : 'line-clamp-3 md:line-clamp-4'
        } ${hasFold || expanded ? 'cursor-pointer' : ''}`}
      >
        <JournalBody text={story} />
      </div>
      {expanded && children}
      {hasFold && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium text-zinc-500 transition-all hover:bg-zinc-200 active:scale-95 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          {t('common.showMore')} <ChevronRight size={10} />
        </button>
      )}
      {expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-2 inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium text-zinc-500 transition-all hover:bg-zinc-200 active:scale-95 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          {t('common.showLess')} <ChevronRight size={10} className="rotate-[-90deg]" />
        </button>
      )}
    </div>
  );
}
