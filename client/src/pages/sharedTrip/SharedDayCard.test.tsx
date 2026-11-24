import { describe, expect, it, vi } from 'vitest';

import { render, screen } from '../../../tests/helpers/render';
import { SharedDayCard, type SharedDayCardProps } from './SharedDayCard';

/** FE-PAGE-SHARED-DAY-001: a day note's detail line on a shared trip wraps inside its card (#3082). */

const LONG_DETAIL =
  'Lorem Ipsum is simply dummy text of the printing and typesetting industry, https://example.com/a/very/long/unbroken/path/that/never/stops';

function renderDay(note: { id: number; text: string; time: string | null }) {
  const props: SharedDayCardProps = {
    day: { id: 9, title: 'Day One', date: '2026-07-02', day_number: 1 },
    index: 0,
    selected: false,
    collapsed: false,
    onSelect: vi.fn(),
    onToggleCollapse: vi.fn(),
    items: [{ type: 'note', sortKey: 0, data: note }],
    stays: [],
    placeCount: 0,
    stopNumber: {},
    categories: [],
  };
  return render(<SharedDayCard {...props} />);
}

describe('SharedDayCard', () => {
  it('FE-PAGE-SHARED-DAY-001: a long note detail wraps in its row instead of running out of a nowrap pill', () => {
    renderDay({ id: 1, text: 'Test', time: LONG_DETAIL });

    const detail = screen.getByTestId('shared-note-detail');
    expect(detail).toHaveTextContent(LONG_DETAIL);
    expect(detail.className).toContain('[overflow-wrap:anywhere]');
    expect(detail.className).toContain('min-w-0');
    // Nothing between the text and the row may forbid wrapping.
    let el: HTMLElement | null = screen.getByText(/Lorem Ipsum/);
    for (; el && el !== document.body; el = el.parentElement) {
      expect(el.className).not.toMatch(/whitespace-nowrap/);
    }
  });

  it('FE-PAGE-SHARED-DAY-001: a leading HH:MM stays a time pill and the rest becomes the wrapping detail', () => {
    renderDay({ id: 2, text: 'Museum', time: '08:30 meet at the north entrance' });

    expect(screen.getByText('08:30')).toBeInTheDocument();
    expect(screen.getByTestId('shared-note-detail')).toHaveTextContent('meet at the north entrance');
  });
});
