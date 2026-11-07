import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';

import type { JourneyMapHandle } from './JourneyMap';
import { journeyDays } from './journeyCard';

interface CarouselEntry {
  id: number | string;
  entry_date: string;
}

export interface JourneyCarouselSyncOptions<E extends CarouselEntry> {
  /** The cards in carousel order. */
  entries: E[];
  /** The entries that have a marker on the map. */
  mapEntries: { id: number | string }[];
  /** A tap on the card that is already active opens it. */
  onOpenEntry: (entry: E) => void;
  /** A tap on another card also moves the map to it (the phone screen). */
  syncMapOnTap?: boolean;
  /**
   * Changes whenever the strip comes or goes (the phone screen shows a feed in its
   * place on a wide window), so its scroll tracking attaches to the strip on show.
   */
  layoutKey?: unknown;
}

/**
 * The card closest to the strip's horizontal centre. More stable than
 * IntersectionObserver thresholds when the active card can drift toward the
 * viewport edge with proximity snapping.
 */
function nearestCardIndex(el: HTMLDivElement | null, cards: Map<number, HTMLDivElement>): number | null {
  if (!el) return null;
  const center = el.getBoundingClientRect().left + el.clientWidth / 2;
  let bestIdx = 0;
  let bestDist = Infinity;
  cards.forEach((node, idx) => {
    const r = node.getBoundingClientRect();
    const d = Math.abs(r.left + r.width / 2 - center);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = idx;
    }
  });
  // The first and the last card can never reach the centre, so a carousel scrolled
  // as far as it goes means the card at that end: without this, opening on the
  // latest day settled on the one before it (#2851). Measured from the start in
  // either direction: in a right-to-left layout scrollLeft runs negative.
  const travel = el.scrollWidth - el.clientWidth;
  const scrolled = Math.abs(el.scrollLeft);
  if (travel > 1 && scrolled >= travel - 1) bestIdx = cards.size - 1;
  else if (travel > 1 && scrolled <= 0) bestIdx = 0;
  return bestIdx;
}

/**
 * How long the strip has to be still before the swipe counts as landed: long
 * enough to see past the gaps between scroll events of a momentum swipe, short
 * enough that the map follows the card without a noticeable wait.
 */
const SETTLE_MS = 90;

interface StripScrollOptions {
  carouselRef: RefObject<HTMLDivElement | null>;
  count: number;
  nearestCard: () => number | null;
  pickNearestCard: () => void;
  onLive: (index: number | null) => void;
  layoutKey: unknown;
}

/**
 * Follows the strip's scrolling: the card under the centre while it moves, the
 * active card once it settles. Every state update waits for the strip to come
 * to rest, because updating the active card mid swipe resizes the cards and
 * reflows the layout on every frame. Attaches again whenever `layoutKey`
 * changes, since the strip may only now be on screen.
 */
function useStripScroll({ carouselRef, count, nearestCard, pickNearestCard, onLive, layoutKey }: StripScrollOptions) {
  useEffect(() => {
    const el = carouselRef.current;
    if (!el || count === 0) return;
    let settleTimer: number | null = null;
    let frame: number | null = null;
    const onScroll = () => {
      if (frame == null) {
        frame = window.requestAnimationFrame(() => {
          frame = null;
          onLive(nearestCard());
        });
      }
      if (settleTimer != null) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(pickNearestCard, SETTLE_MS);
    };
    // Where the browser says when the snap has landed, the card grows right then
    // instead of a beat later; the timer stays for the ones that do not.
    const onScrollEnd = () => {
      if (settleTimer != null) window.clearTimeout(settleTimer);
      settleTimer = null;
      pickNearestCard();
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('scrollend', onScrollEnd, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('scrollend', onScrollEnd);
      if (settleTimer != null) window.clearTimeout(settleTimer);
      if (frame != null) window.cancelAnimationFrame(frame);
    };
  }, [carouselRef, count, pickNearestCard, nearestCard, onLive, layoutKey]);
}

/**
 * The card carousel over the journey map, behind both the phone journey screen and the
 * narrow desktop and public timeline: the active card is the one nearest the centre
 * once scrolling settles, and the map follows it; a marker, a day on the scrubber or a
 * tap brings its card to the centre.
 */
export function useJourneyCarouselSync<E extends CarouselEntry>({
  entries,
  mapEntries,
  onOpenEntry,
  syncMapOnTap = false,
  layoutKey,
}: JourneyCarouselSyncOptions<E>) {
  const mapRef = useRef<JourneyMapHandle>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [activeIndex, setActiveIndex] = useState(0);
  // The card nearest the centre while a swipe is still moving: drawn larger at
  // once (a transform, so nothing reflows), while the active card and the map
  // only follow once the strip settles. Null when not swiping.
  const [liveIndex, setLiveIndex] = useState<number | null>(null);

  const scrubberDays = useMemo(() => journeyDays(entries), [entries]);

  // Guarded: the map may not be initialised yet.
  const syncMapToCard = useCallback(
    (index: number) => {
      const entry = entries[index];
      if (!entry) return;
      const mapEntry = mapEntries.find((m) => String(m.id) === String(entry.id));
      try {
        if (mapEntry) mapRef.current?.focusMarker(String(mapEntry.id));
        else mapRef.current?.highlightMarker(null);
      } catch {
        /* map not initialised yet */
      }
    },
    [entries, mapEntries]
  );

  const nearestCard = useCallback(() => nearestCardIndex(carouselRef.current, cardRefs.current), []);

  const pickNearestCard = useCallback(() => {
    const bestIdx = nearestCard();
    if (bestIdx == null) return;
    setLiveIndex(null);
    setActiveIndex((prev) => {
      if (prev !== bestIdx) syncMapToCard(bestIdx);
      return bestIdx;
    });
  }, [nearestCard, syncMapToCard]);

  useStripScroll({ carouselRef, count: entries.length, nearestCard, pickNearestCard, onLive: setLiveIndex, layoutKey });

  const scrollCardIntoCenter = useCallback((idx: number) => {
    cardRefs.current.get(idx)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, []);

  const handleMarkerClick = useCallback(
    (markerId: string) => {
      const idx = entries.findIndex((e) => String(e.id) === markerId);
      if (idx === -1) return;
      setActiveIndex(idx);
      scrollCardIntoCenter(idx);
    },
    [entries, scrollCardIntoCenter]
  );

  // A tap on the active card opens it; any other card is brought to the centre
  // first rather than opened straight away.
  const handleCardTap = useCallback(
    (entry: E, idx: number) => {
      if (idx === activeIndex) {
        onOpenEntry(entry);
      } else {
        setActiveIndex(idx);
        scrollCardIntoCenter(idx);
        if (syncMapOnTap) syncMapToCard(idx);
      }
    },
    [activeIndex, onOpenEntry, scrollCardIntoCenter, syncMapOnTap, syncMapToCard]
  );

  // The marker card on the map names one entry, so a tap on it opens that entry
  // straight away, the same way a tap on the active carousel card does (#2885).
  const openEntryById = useCallback(
    (id: string) => {
      const entry = entries.find((e) => String(e.id) === id);
      if (entry) onOpenEntry(entry);
    },
    [entries, onOpenEntry]
  );

  // The day bar lands on the first entry of that day, which is where a reader who
  // asked for "day nine" means.
  const jumpToDay = useCallback(
    (date: string) => {
      const idx = entries.findIndex((e) => e.entry_date === date);
      if (idx === -1) return;
      setActiveIndex(idx);
      syncMapToCard(idx);
      scrollCardIntoCenter(idx);
    },
    [entries, scrollCardIntoCenter, syncMapToCard]
  );

  return {
    mapRef,
    carouselRef,
    cardRefs,
    activeIndex,
    /** The card to draw as the active one: the one at the centre while swiping, else the active card. */
    focusIndex: liveIndex ?? activeIndex,
    setActiveIndex,
    scrubberDays,
    syncMapToCard,
    handleMarkerClick,
    handleCardTap,
    openEntryById,
    jumpToDay,
  };
}
