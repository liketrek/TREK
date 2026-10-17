// FE-JRN-CAROUSEL-001 to FE-JRN-CAROUSEL-007: the card carousel over the journey map,
// behind both the phone journey screen and the narrow desktop and public timeline.
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { JourneyMapHandle } from './JourneyMap';
import { useJourneyCarouselSync, type JourneyCarouselSyncOptions } from './useJourneyCarouselSync';

interface Entry {
  id: number;
  entry_date: string;
}

const ENTRIES: Entry[] = [
  { id: 1, entry_date: '2026-05-01' },
  { id: 2, entry_date: '2026-05-01' },
  { id: 3, entry_date: '2026-05-02' },
];

type Options = JourneyCarouselSyncOptions<Entry>;

function setup(over: Partial<Options> = {}) {
  const props: Options = {
    entries: ENTRIES,
    mapEntries: [{ id: '1' }, { id: '3' }],
    onOpenEntry: vi.fn(),
    ...over,
  };
  const hook = renderHook((p: Options) => useJourneyCarouselSync(p), { initialProps: props });
  const map = { focusMarker: vi.fn(), highlightMarker: vi.fn(), invalidateSize: vi.fn() };
  (hook.result.current.mapRef as { current: JourneyMapHandle | null }).current = map as unknown as JourneyMapHandle;
  const cards = ENTRIES.map((_, i) => {
    const node = document.createElement('div');
    node.scrollIntoView = vi.fn();
    node.getBoundingClientRect = () => ({ left: i * 100, width: 100 }) as DOMRect;
    hook.result.current.cardRefs.current.set(i, node);
    return node;
  });
  return { ...hook, props, map, cards };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useJourneyCarouselSync', () => {
  it('FE-JRN-CAROUSEL-001: groups the scrubber days by date', () => {
    const { result } = setup();
    expect(result.current.scrubberDays.map((d) => d.date)).toEqual(['2026-05-01', '2026-05-02']);
  });

  it('FE-JRN-CAROUSEL-002: the map focuses a card with a marker and clears the highlight for one without', () => {
    const { result, map } = setup();
    result.current.syncMapToCard(2);
    expect(map.focusMarker).toHaveBeenCalledWith('3');
    result.current.syncMapToCard(1);
    expect(map.highlightMarker).toHaveBeenCalledWith(null);
    result.current.syncMapToCard(9);
    expect(map.focusMarker).toHaveBeenCalledTimes(1);
  });

  it('FE-JRN-CAROUSEL-003: a map that is not ready yet is ignored', () => {
    const { result, map } = setup();
    map.focusMarker.mockImplementation(() => {
      throw new Error('not ready');
    });
    expect(() => result.current.syncMapToCard(0)).not.toThrow();
  });

  it('FE-JRN-CAROUSEL-004: a marker brings its card to the centre', () => {
    const { result, cards } = setup();
    act(() => result.current.handleMarkerClick('3'));
    expect(result.current.activeIndex).toBe(2);
    expect(cards[2].scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    act(() => result.current.handleMarkerClick('99'));
    expect(result.current.activeIndex).toBe(2);
  });

  it('FE-JRN-CAROUSEL-005: a tap opens the active card and centres another, moving the map only on the phone', () => {
    const desktop = setup();
    act(() => desktop.result.current.handleCardTap(ENTRIES[0], 0));
    expect(desktop.props.onOpenEntry).toHaveBeenCalledWith(ENTRIES[0]);
    act(() => desktop.result.current.handleCardTap(ENTRIES[2], 2));
    expect(desktop.result.current.activeIndex).toBe(2);
    expect(desktop.map.focusMarker).not.toHaveBeenCalled();

    const phone = setup({ syncMapOnTap: true });
    act(() => phone.result.current.handleCardTap(ENTRIES[2], 2));
    expect(phone.map.focusMarker).toHaveBeenCalledWith('3');
    expect(phone.props.onOpenEntry).not.toHaveBeenCalled();
  });

  it('FE-JRN-CAROUSEL-006: a day on the scrubber lands on its first entry', () => {
    const { result, map, cards } = setup();
    act(() => result.current.jumpToDay('2026-05-02'));
    expect(result.current.activeIndex).toBe(2);
    expect(map.focusMarker).toHaveBeenCalledWith('3');
    expect(cards[2].scrollIntoView).toHaveBeenCalled();
    act(() => result.current.jumpToDay('2030-01-01'));
    expect(result.current.activeIndex).toBe(2);
  });

  it('FE-JRN-CAROUSEL-007: once scrolling settles the card nearest the centre becomes active', () => {
    const carousel = document.createElement('div');
    carousel.getBoundingClientRect = () => ({ left: 0 }) as DOMRect;
    Object.defineProperty(carousel, 'clientWidth', { value: 500 });
    const hook = renderHook(
      (p: Options) => {
        const sync = useJourneyCarouselSync(p);
        (sync.carouselRef as { current: HTMLDivElement | null }).current = carousel;
        return sync;
      },
      { initialProps: { entries: [], mapEntries: [{ id: '3' }], onOpenEntry: vi.fn() } }
    );
    const map = { focusMarker: vi.fn(), highlightMarker: vi.fn(), invalidateSize: vi.fn() };
    (hook.result.current.mapRef as { current: JourneyMapHandle | null }).current = map as unknown as JourneyMapHandle;
    // The listener attaches once there are cards.
    hook.rerender({ entries: ENTRIES, mapEntries: [{ id: '3' }], onOpenEntry: vi.fn() });
    ENTRIES.forEach((_, i) => {
      const node = document.createElement('div');
      node.getBoundingClientRect = () => ({ left: i * 200, width: 100 }) as DOMRect;
      hook.result.current.cardRefs.current.set(i, node);
    });

    carousel.dispatchEvent(new Event('scroll'));
    act(() => vi.advanceTimersByTime(100));
    carousel.dispatchEvent(new Event('scroll'));
    act(() => vi.advanceTimersByTime(149));
    expect(hook.result.current.activeIndex).toBe(0);
    act(() => vi.advanceTimersByTime(1));
    // Centre 250: card 1 spans 200 to 300.
    expect(hook.result.current.activeIndex).toBe(1);
    expect(map.highlightMarker).toHaveBeenCalledWith(null);
  });
});
