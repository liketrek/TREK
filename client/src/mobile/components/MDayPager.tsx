import type { ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { tickHaptic } from '../../native/haptics';
import { pagesFor, type PagerItem } from './dayPagerPages';

/**
 * Pages through the trip's days the way a native pager does: every day is a
 * page of a horizontal scroll-snap strip (dayPagerPages.ts), the current one
 * and two on either side drawn, so the finger drags real paper, the neighbour
 * slides in with it, and swipes made while the last one still snaps carry on
 * as far as the trip goes. The browser's compositor owns the gesture. Momentum, rubber-banding at the first
 * and last day, axis locking against the vertical scroll and the swallowed tap
 * after a swipe are all the platform's own, in the PWA and the app alike.
 *
 * The phone ticks as soon as another page becomes the nearer one, the moment
 * the swipe is decided, not once the snap has settled, which on iOS comes
 * a good while later. The day only changes once the strip has come to rest on
 * another page. Then
 * the selection moves and the days around it draw their content. The days
 * around the page a swipe is heading for draw theirs as soon as it becomes the
 * nearer one, so a run of quick swipes that never rests finds them drawn
 * instead of blank until the snap lands (#3067).
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

/** Anything with an id pages: trip days, a leave year's months, the plan's years. */

export interface MDayPagerProps {
  days: PagerItem[];
  selectedDayId: number | null;
  onSelectDay: (dayId: number) => void;
  /** Draws one day. Pages other than the current one are inert and hidden
   *  from assistive tech, so they never take focus or a tap. */
  renderDay: (dayId: number | null, active: boolean) => ReactNode;
  /** Holds the strip still: a reorder drag or an open menu owns the finger. */
  locked?: boolean;
  /** Live-region text after a swipe lands on a day. */
  describeDay: (index: number, total: number) => string;
  /**
   * In the page's flow instead of filling a positioned parent: the strip takes
   * the height of its tallest page, for content that sits in a scrolling column
   * (Vacay's month editor and year grid) rather than over the whole screen.
   */
  inFlow?: boolean;
  /**
   * The day a swipe is heading for, as soon as its page is the nearer one, and
   * null when the swipe falls back: lets a day rail follow the finger before
   * the snap lands and onSelectDay fires.
   */
  onPreview?: (dayId: number | null) => void;
}

export default function MDayPager({
  days,
  selectedDayId,
  onSelectDay,
  renderDay,
  locked = false,
  describeDay,
  inFlow = false,
  onPreview,
}: MDayPagerProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState('');
  /** The page a swipe last headed for. It stays after the landing, so swiping
   *  back over the same days finds them drawn too. */
  const [focusDayId, setFocusDayId] = useState<number | null>(null);
  const pages = pagesFor(days, selectedDayId, focusDayId);
  // Which page is current belongs in the key: on a trip of up to five days a
  // chip tap can keep the same pages, and the strip then stayed on the old day
  // while the rail already showed the new one.
  const windowKey = pages.map((p) => (p.active ? `*${p.key}` : p.key)).join(',');

  // The handlers below are attached once, so they read the props through here.
  const latest = useRef({ days, onSelectDay, describeDay, selectedDayId, onPreview });
  useLayoutEffect(() => {
    latest.current = { days, onSelectDay, describeDay, selectedDayId, onPreview };
  });
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

  // Before paint whenever the window or its current page moves: a landed swipe or a chip tap.
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
    let previewed: number | null = null;

    // The nearer page while the strip moves: a page past the middle is where the
    // swipe will land unless the finger turns back. Ticks as it changes to
    // another day, so the finger feels the detent while it is still moving.
    const preview = () => {
      const left = strip.getBoundingClientRect().left;
      let nearest: HTMLElement | null = null;
      let distance = Infinity;
      for (const child of Array.from(strip.children) as HTMLElement[]) {
        const d = Math.abs(child.getBoundingClientRect().left - left);
        if (d < distance) {
          distance = d;
          nearest = child;
        }
      }
      if (!nearest) return;
      const raw = nearest.hasAttribute('data-page-active') ? '' : nearest.dataset.dayId;
      const dayId = raw ? Number(raw) : null;
      const next = dayId != null && Number.isFinite(dayId) ? dayId : null;
      if (next === previewed) return;
      previewed = next;
      if (next !== null) {
        // Draw ahead of the finger: the days around this one, before it lands.
        setFocusDayId(next);
        tickHaptic();
      }
      latest.current.onPreview?.(next);
    };

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
      previewed = null;
      const s = latest.current;
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

    const onScroll = () => {
      preview();
      later();
    };
    strip.addEventListener('scroll', onScroll, { passive: true });
    strip.addEventListener('scrollend', onScrollEnd);
    strip.addEventListener('touchstart', onTouchStart, { passive: true });
    strip.addEventListener('touchend', onTouchEnd, { passive: true });
    strip.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      window.clearTimeout(timer);
      strip.removeEventListener('scroll', onScroll);
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
        className={`${inFlow ? 'relative items-start' : 'absolute inset-0'} flex snap-x snap-mandatory overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${locked ? 'overflow-x-hidden' : 'overflow-x-auto'}`}
      >
        {pages.map((page) => (
          <div
            key={page.key}
            data-day-id={page.dayId ?? ''}
            data-page-active={page.active ? '' : undefined}
            inert={!page.active}
            aria-hidden={page.active ? undefined : true}
            className={`relative w-full flex-none snap-center snap-always ${inFlow ? '' : 'h-full'}`}
          >
            {page.near ? renderDay(page.dayId, page.active) : null}
          </div>
        ))}
      </div>
    </>
  );
}
