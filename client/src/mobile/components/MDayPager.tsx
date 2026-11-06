import type { ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { tickHaptic } from '../../native/haptics';
import type { Day } from '../../types';

/**
 * Pages through the trip's days the way a native pager does: the previous,
 * current and next day sit side by side in a horizontal scroll-snap strip, so
 * the finger drags real paper, the neighbour slides in with it, and the
 * browser's compositor owns the gesture. Momentum, rubber-banding at the first
 * and last day, axis locking against the vertical scroll and the swallowed tap
 * after a swipe are all the platform's own, in the PWA and the app alike.
 *
 * The day only changes once the strip has come to rest on a neighbour. Then
 * the selection moves, the window of three shifts by one and the strip is put
 * back on the centre page before the next paint, so nothing visibly jumps.
 * Keys follow the day ids, so the page that slid in keeps its state (scroll
 * position, fetched route and weather) as it becomes the current one.
 *
 * RTL needs nothing of its own: under dir="rtl" the strip lays out right to
 * left, which puts the next day on the left, and every offset here is read off
 * bounding rects rather than scrollLeft, whose sign flips in RTL.
 */

/** Fallback settle delay where `scrollend` is missing (Safari before 26). */
const SETTLE_MS = 90;
/** How close to a page edge counts as resting on it. */
const REST_PX = 2;

export interface MDayPagerProps {
  days: Day[];
  selectedDayId: number | null;
  onSelectDay: (dayId: number) => void;
  /** Draws one day. Pages other than the current one are inert and hidden
   *  from assistive tech, so they never take focus or a tap. */
  renderDay: (dayId: number | null, active: boolean) => ReactNode;
  /** Holds the strip still: a reorder drag or an open menu owns the finger. */
  locked?: boolean;
  /** Live-region text after a swipe lands on a day. */
  describeDay: (index: number, total: number) => string;
}

interface Page {
  key: string;
  dayId: number | null;
  active: boolean;
}

/** The window of pages around the selection. A selection that points at no
 *  day (the whole-trip view, or a day deleted remotely) still gets its page,
 *  with the first day next to it as a way back. */
export function pagesFor(days: Day[], selectedDayId: number | null): Page[] {
  const i = days.findIndex((d) => d.id === selectedDayId);
  if (i < 0) {
    const first = days[0];
    return [
      { key: 'none', dayId: selectedDayId, active: true },
      ...(first ? [{ key: `d${first.id}`, dayId: first.id, active: false }] : []),
    ];
  }
  const pages: Page[] = [];
  const prev = days[i - 1];
  const next = days[i + 1];
  if (prev) pages.push({ key: `d${prev.id}`, dayId: prev.id, active: false });
  pages.push({ key: `d${days[i].id}`, dayId: days[i].id, active: true });
  if (next) pages.push({ key: `d${next.id}`, dayId: next.id, active: false });
  return pages;
}

export default function MDayPager({
  days,
  selectedDayId,
  onSelectDay,
  renderDay,
  locked = false,
  describeDay,
}: MDayPagerProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState('');
  const pages = pagesFor(days, selectedDayId);
  const windowKey = pages.map((p) => p.key).join(',');

  // The handlers below are attached once, so they read the props through here.
  const latest = useRef({ days, onSelectDay, describeDay, selectedDayId });
  latest.current = { days, onSelectDay, describeDay, selectedDayId };
  /** The day a landed swipe asked for, until the selection catches up. Stops a
   *  late scroll event from selecting it twice. */
  const requested = useRef<number | null>(null);

  /** Puts the strip back on the current page, instantly. */
  const recentre = useCallback(() => {
    const strip = stripRef.current;
    const current = strip?.querySelector<HTMLElement>('[data-page-active]');
    if (!strip || !current) return;
    const offset = current.getBoundingClientRect().left - strip.getBoundingClientRect().left;
    if (Math.abs(offset) > 0.5) strip.scrollLeft += offset;
  }, []);

  // Before paint whenever the window moves: a landed swipe or a chip tap.
  useLayoutEffect(() => {
    requested.current = null;
    recentre();
  }, [windowKey, recentre]);

  // Rotation and split view change the page width; keep the current page whole.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => recentre());
    observer.observe(strip);
    return () => observer.disconnect();
  }, [recentre]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    let timer = 0;
    let touching = false;

    const settle = () => {
      if (touching) return;
      const left = strip.getBoundingClientRect().left;
      let resting: HTMLElement | null = null;
      for (const child of Array.from(strip.children) as HTMLElement[]) {
        if (Math.abs(child.getBoundingClientRect().left - left) <= REST_PX) resting = child;
      }
      // Still between pages: the snap has not finished, another event follows.
      if (!resting || resting.hasAttribute('data-page-active')) return;
      const raw = resting.dataset.dayId;
      const dayId = raw ? Number(raw) : NaN;
      if (!Number.isFinite(dayId) || requested.current === dayId) return;
      requested.current = dayId;
      const s = latest.current;
      tickHaptic();
      s.onSelectDay(dayId);
      const index = s.days.findIndex((d) => d.id === dayId);
      if (index >= 0) setAnnouncement(s.describeDay(index, s.days.length));
    };
    const later = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, SETTLE_MS);
    };
    const onScrollEnd = () => {
      window.clearTimeout(timer);
      settle();
    };
    const onTouchStart = () => {
      touching = true;
    };
    const onTouchEnd = () => {
      touching = false;
      later();
    };

    strip.addEventListener('scroll', later, { passive: true });
    strip.addEventListener('scrollend', onScrollEnd);
    strip.addEventListener('touchstart', onTouchStart, { passive: true });
    strip.addEventListener('touchend', onTouchEnd, { passive: true });
    strip.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      window.clearTimeout(timer);
      strip.removeEventListener('scroll', later);
      strip.removeEventListener('scrollend', onScrollEnd);
      strip.removeEventListener('touchstart', onTouchStart);
      strip.removeEventListener('touchend', onTouchEnd);
      strip.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  return (
    <>
      {/* Swipe-landed days only. A chip tap already speaks its own label plus
          the aria-current flip, so announcing there would say the day twice. */}
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
      <div
        ref={stripRef}
        data-day-pager=""
        className={`absolute inset-0 flex snap-x snap-mandatory overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${locked ? 'overflow-x-hidden' : 'overflow-x-auto'}`}
      >
        {pages.map((page) => (
          <div
            key={page.key}
            data-day-id={page.dayId ?? ''}
            data-page-active={page.active ? '' : undefined}
            inert={!page.active}
            aria-hidden={page.active ? undefined : true}
            className="relative h-full w-full flex-none snap-center snap-always"
          >
            {renderDay(page.dayId, page.active)}
          </div>
        ))}
      </div>
    </>
  );
}
