// FE-JOURNEY-MAPPICK-001 to FE-JOURNEY-MAPPICK-003
//
// JRN-04: what a picked plan place or stay is, and several on one spot as a list.
import type { JourneyMapPlace, JourneyMapStay } from '@trek/shared';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import JourneyMapPickCard from './JourneyMapPickCard';
import type { JourneyMapMark } from './journeyMapMarks';

const PLACE: JourneyMapPlace = {
  place_id: 4,
  trip_id: 2,
  trip_title: 'Venice',
  name: 'Piazza San Marco',
  lat: 45.434,
  lng: 12.3388,
  days: ['2026-05-14', '2026-05-15'],
  time: '10:00',
  category_color: null,
  category_icon: null,
  entry_id: null,
};
const STAY: JourneyMapStay = {
  id: 9,
  entry_id: 7,
  name: 'Rialto market',
  lat: 45.438,
  lng: 12.336,
  started_at: '2026-05-14T09:00:00+02:00',
  ended_at: '2026-05-14T10:00:00+02:00',
};
const plan = (over: Partial<JourneyMapPlace> = {}): JourneyMapMark => ({
  kind: 'plan',
  key: 'plan:4',
  lat: 45.434,
  lng: 12.3388,
  color: '#64748b',
  place: { ...PLACE, ...over },
});
const stay: JourneyMapMark = { kind: 'stay', key: 'stay:9', lat: 45.438, lng: 12.336, color: '#14b8a6', stay: STAY };

describe('JourneyMapPickCard', () => {
  it('FE-JOURNEY-MAPPICK-001: a planned place names its trip and days and says when nothing was written about it', () => {
    render(<JourneyMapPickCard marks={[plan()]} onClose={vi.fn()} onOpenEntry={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Piazza San Marco' })).toBeInTheDocument();
    expect(screen.getByText('Planned')).toBeInTheDocument();
    expect(screen.getByText('Venice')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('Nothing written about it yet.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open entry' })).toBeNull();
  });

  it('FE-JOURNEY-MAPPICK-002: a place written about and a stay lead to their entry', () => {
    const onOpenEntry = vi.fn();
    const { unmount } = render(
      <JourneyMapPickCard marks={[plan({ entry_id: 12 })]} onClose={vi.fn()} onOpenEntry={onOpenEntry} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open entry' }));
    expect(onOpenEntry).toHaveBeenCalledWith('12');
    unmount();

    render(
      <JourneyMapPickCard
        marks={[stay]}
        onClose={vi.fn()}
        onOpenEntry={onOpenEntry}
        entryTitleOf={() => 'A day in Venice'}
      />
    );
    expect(screen.getByText('Part of “A day in Venice”')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open entry' }));
    expect(onOpenEntry).toHaveBeenLastCalledWith('7');
  });

  it('FE-JOURNEY-MAPPICK-003: several on one spot come as a list, each reachable, and Escape closes', () => {
    const onClose = vi.fn();
    render(<JourneyMapPickCard marks={[plan(), stay]} onClose={onClose} />);

    expect(screen.getByRole('dialog', { name: 'At this spot' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Rialto market/ }));
    expect(screen.getByRole('dialog', { name: 'Rialto market' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to the list' }));
    expect(screen.getByRole('button', { name: /Piazza San Marco/ })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
