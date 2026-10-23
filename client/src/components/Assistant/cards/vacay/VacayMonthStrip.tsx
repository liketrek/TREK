import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useAssistantView } from '../../assistantViewContext';
import { useCardStrip } from '../parts/useCardStrip';
import { type CellSize, monthKey, type PlacedProposal, todayStr, type VacayView } from './vacayCardModel';
import VacayMiniMonth from './VacayMiniMonth';

/**
 * The months of a vacation card side by side, to scroll through where they do
 * not fit; on the phone one month fills the row and the next is a swipe away.
 * The edges fade where there is more, as in the chat's other strips, and in
 * the desktop window two arrows over the row page it by whole months.
 */

const STRIP =
  'trek-assistant-strip flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-1 motion-safe:scroll-smooth';
const WINDOW_MONTH = 'flex-none snap-start';
const PHONE_MONTH = 'w-full flex-none snap-center';
const PAGER = 'mb-1 flex justify-end gap-1.5';
// The look of the arrows over the chat's other strips (parts/CardStrip.tsx).
const PAGE_ARROW =
  'grid h-7 w-7 place-items-center rounded-full bg-surface-card text-content-secondary shadow-sm ring-1 ring-edge-faint transition-colors hover:text-content disabled:cursor-default disabled:opacity-40 disabled:hover:text-content-secondary';

/** The two paging arrows, towards the start and towards the end; the months stay reachable by swipe and scroll. */
const PAGES = [
  { towards: -1, Icon: ChevronLeft, edge: 'start' },
  { towards: 1, Icon: ChevronRight, edge: 'end' },
] as const;

export default function VacayMonthStrip({
  view,
  placed,
  onToggle,
  labelOf,
}: {
  view: VacayView;
  placed: readonly PlacedProposal[];
  onToggle?: (toolCallId: string) => void;
  labelOf: (entry: PlacedProposal) => string;
}) {
  const { variant, density } = useAssistantView();
  // The months as text, so the strip measures again when they change and not on every render.
  const { listRef, fade, measure, page } = useCardStrip(view.months.map(monthKey).join(','));
  let size: CellSize = density === 'roomy' ? 'roomy' : 'compact';
  if (variant === 'fullscreen') size = 'phone';
  const today = todayStr();
  const paged = variant === 'window' && (fade.start || fade.end);
  return (
    <>
      {paged && (
        <div className={PAGER}>
          {PAGES.map(({ towards, Icon, edge }) => (
            // For the pointer only, as over the other strips: the cells are reachable by Tab.
            <button
              key={edge}
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              disabled={!fade[edge]}
              onClick={() => page(towards)}
              className={PAGE_ARROW}
            >
              <Icon size={15} className="rtl:-scale-x-100" />
            </button>
          ))}
        </div>
      )}
      <ul
        ref={listRef}
        onScroll={measure}
        data-fade-start={fade.start || undefined}
        data-fade-end={fade.end || undefined}
        className={STRIP}
      >
        {view.months.map((month) => (
          <li key={monthKey(month)} className={variant === 'fullscreen' ? PHONE_MONTH : WINDOW_MONTH}>
            <VacayMiniMonth
              view={view}
              month={month}
              placed={placed}
              today={today}
              size={size}
              onToggle={onToggle}
              labelOf={labelOf}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
