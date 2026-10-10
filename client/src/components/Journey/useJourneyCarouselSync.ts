import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
}: JourneyCarouselSyncOptions<E>) {
  const mapRef = useRef<JourneyMapHandle>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [activeIndex, setActiveIndex] = useState(0);

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

  // Pick the card closest to the horizontal centre. More stable than
  // IntersectionObserver thresholds when the active card can drift toward the
  // viewport edge with proximity snapping.
  const pickNearestCard = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const center = el.getBoundingClientRect().left + el.clientWidth / 2;
    let bestIdx = 0;
    let bestDist = Infinity;
    cardRefs.current.forEach((node, idx) => {
      const r = node.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - center);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = idx;
      }
    });
    setActiveIndex((prev) => {
      if (prev !== bestIdx) syncMapToCard(bestIdx);
      return bestIdx;
    });
  }, [syncMapToCard]);

  // Defer every state update until scrolling settles: updating the active card
  // mid swipe resizes the cards and reflows the layout on every frame.
  useEffect(() => {
    const el = carouselRef.current;
    if (!el || entries.length === 0) return;
    let settleTimer: number | null = null;
    const onScroll = () => {
      if (settleTimer != null) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(pickNearestCard, 150);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (settleTimer != null) window.clearTimeout(settleTimer);
    };
  }, [entries.length, pickNearestCard]);

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
    setActiveIndex,
    scrubberDays,
    syncMapToCard,
    handleMarkerClick,
    handleCardTap,
    jumpToDay,
  };
}
