import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tickHaptic } from '../../native/haptics';
import type { Day } from '../../types';
import MDayPager from './MDayPager';
import { pagesFor } from './dayPagerPages';

vi.mock('../../native/haptics', () => ({ tickHaptic: vi.fn() }));

const DAYS = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }] as unknown as Day[];

function setup(selectedDayId: number | null, over: Partial<Parameters<typeof MDayPager>[0]> = {}) {
  const onSelectDay = vi.fn();
  const utils = render(
    <MDayPager
      days={DAYS}
      selectedDayId={selectedDayId}
      onSelectDay={onSelectDay}
      describeDay={(i, n) => `day ${i + 1} of ${n}`}
      renderDay={(dayId, active) => <p>{`page ${dayId ?? 'none'}${active ? ' live' : ''}`}</p>}
      {...over}
    />
  );
  const strip = utils.container.querySelector('[data-day-pager]') as HTMLElement;
  return { ...utils, strip, onSelectDay };
}

/** jsdom has no layout: say where each page sits, with `restingId` filling the strip. */
function place(strip: HTMLElement, restingId: number | null, between = false) {
  strip.getBoundingClientRect = () => ({ left: 0 }) as DOMRect;
  for (const page of Array.from(strip.children) as HTMLElement[]) {
    const here = page.dataset.dayId === String(restingId);
    page.getBoundingClientRect = () => ({ left: here ? (between ? 37 : 0) : 400 }) as DOMRect;
  }
}

beforeEach(() => {
  vi.mocked(tickHaptic).mockReset();
});

describe('pagesFor', () => {
  it('windows the selection with two days on either side, room for a second swipe', () => {
    expect(pagesFor(DAYS, 3).map((p) => [p.dayId, p.active])).toEqual([
      [1, false],
      [2, false],
      [3, true],
      [4, false],
      [5, false],
    ]);
  });

  it('has no page beyond the first and last day', () => {
    expect(pagesFor(DAYS, 1).map((p) => p.dayId)).toEqual([1, 2, 3]);
    expect(pagesFor(DAYS, 6).map((p) => p.dayId)).toEqual([4, 5, 6]);
  });

  it('keeps a page for a selection that points at no day, with the first day as the way back', () => {
    expect(pagesFor(DAYS, null).map((p) => [p.key, p.dayId, p.active])).toEqual([
      ['none', null, true],
      ['d1', 1, false],
    ]);
    expect(pagesFor([], null).map((p) => p.key)).toEqual(['none']);
  });
});

describe('MDayPager', () => {
  it('draws the current day live and its neighbours inert', () => {
    const { strip } = setup(2);

    expect(screen.getByText('page 2 live')).toBeInTheDocument();
    const pages = Array.from(strip.children) as HTMLElement[];
    expect(pages.map((p) => p.hasAttribute('inert'))).toEqual([true, false, true, true]);
    expect(pages[0]).toHaveAttribute('aria-hidden', 'true');
    expect(pages[1]).not.toHaveAttribute('aria-hidden');
  });

  it('selects the day the strip comes to rest on, with an announcement', () => {
    const { strip, onSelectDay } = setup(2);

    place(strip, 3);
    fireEvent(strip, new Event('scrollend'));

    expect(onSelectDay).toHaveBeenCalledWith(3);
    expect(screen.getByRole('status')).toHaveTextContent('day 3 of 6');
  });

  it('ticks once as the swipe crosses to another day, while the strip still moves, not again as it lands', () => {
    const { strip } = setup(2);

    place(strip, 3, true);
    fireEvent.scroll(strip);
    fireEvent.scroll(strip);
    expect(tickHaptic).toHaveBeenCalledTimes(1);

    place(strip, 3);
    fireEvent(strip, new Event('scrollend'));
    expect(tickHaptic).toHaveBeenCalledTimes(1);
  });

  it('a second swipe made during the snap carries on to the day after', () => {
    const { strip, onSelectDay } = setup(2);

    place(strip, 4);
    fireEvent(strip, new Event('scrollend'));

    expect(onSelectDay).toHaveBeenCalledWith(4);
  });

  it('previews the day a swipe heads for while the strip still moves, and takes it back', () => {
    const onPreview = vi.fn();
    const { strip, onSelectDay } = setup(2, { onPreview });

    place(strip, 3, true);
    fireEvent.scroll(strip);
    fireEvent.scroll(strip);
    expect(onPreview).toHaveBeenCalledTimes(1);
    expect(onPreview).toHaveBeenLastCalledWith(3);
    expect(onSelectDay).not.toHaveBeenCalled();

    place(strip, 2, true);
    fireEvent.scroll(strip);
    expect(onPreview).toHaveBeenLastCalledWith(null);
  });

  it('asks once, however many events report the same landing', () => {
    const { strip, onSelectDay } = setup(2);

    place(strip, 1);
    fireEvent(strip, new Event('scrollend'));
    fireEvent(strip, new Event('scrollend'));

    expect(onSelectDay).toHaveBeenCalledTimes(1);
  });

  it('does nothing when it comes back to the current day or is still between pages', () => {
    const { strip, onSelectDay } = setup(2);

    place(strip, 2);
    fireEvent(strip, new Event('scrollend'));
    place(strip, 3, true);
    fireEvent(strip, new Event('scrollend'));

    expect(onSelectDay).not.toHaveBeenCalled();
  });

  it('waits for the finger to lift where scrollend is missing', () => {
    vi.useFakeTimers();
    try {
      const { strip, onSelectDay } = setup(2);
      place(strip, 3);

      fireEvent.touchStart(strip);
      fireEvent.scroll(strip);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(onSelectDay).not.toHaveBeenCalled();

      fireEvent.touchEnd(strip);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(onSelectDay).toHaveBeenCalledWith(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it('puts the strip back on the current page when the window moves', () => {
    const { strip, rerender, onSelectDay } = setup(2);
    // jsdom keeps no scroll offset, so give the strip one to move.
    let scrollLeft = 0;
    Object.defineProperty(strip, 'scrollLeft', {
      configurable: true,
      get: () => scrollLeft,
      set: (v) => {
        scrollLeft = v;
      },
    });
    // After the selection moves to day 3, its page sits one page width to the right.
    const realQuery = strip.querySelector.bind(strip);
    vi.spyOn(strip, 'querySelector').mockImplementation((sel: string) => {
      const el = realQuery(sel) as HTMLElement | null;
      if (el && sel === '[data-page-active]') el.getBoundingClientRect = () => ({ left: 390 }) as DOMRect;
      return el;
    });
    strip.getBoundingClientRect = () => ({ left: 0 }) as DOMRect;

    rerender(
      <MDayPager
        days={DAYS}
        selectedDayId={3}
        onSelectDay={onSelectDay}
        describeDay={() => ''}
        renderDay={(dayId) => <p>{`page ${dayId}`}</p>}
      />
    );

    expect(strip.scrollLeft).toBe(390);
  });

  it('holds still while locked', () => {
    const { strip } = setup(2, { locked: true });
    expect(strip).toHaveClass('overflow-x-hidden');
    expect(strip).not.toHaveClass('overflow-x-auto');
  });
});
