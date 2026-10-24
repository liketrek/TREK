// FE-STA2-DIALOG-001 to FE-STA2-DIALOG-008
// STA-02: the full list of the user's tour activities: the sums with what they
// rest on, the split by type, each tour with its basis and a switch to leave it
// out (dimmed, never hidden), and the way into its trip.
import userEvent from '@testing-library/user-event';
import { summarizeTourActivities, type TourActivityStatsEntry, type TourActivityStatsResponse } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSettings } from '../../../../tests/helpers/factories';
import { render, screen, within } from '../../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { useSettingsStore } from '../../../store/settingsStore';
import { TourActivityStatsDialog } from './TourActivityStatsDialog';
import type { TourActivityStats } from './useTourActivityStats';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => navigate,
}));

const TODAY = '2026-10-20';

function entry(overrides: Partial<TourActivityStatsEntry> = {}): TourActivityStatsEntry {
  return {
    place_id: 1,
    name: 'Ridge',
    tour_type: 'hike',
    trip: { id: 5, title: 'Alps' },
    derived_from_place_id: null,
    date: '2026-07-02',
    basis: 'plan',
    track: null,
    day_count: 1,
    distance_km: 12,
    ascent_m: 800,
    descent_m: 790,
    excluded: false,
    ...overrides,
  };
}

function statsOf(
  data: TourActivityStatsResponse | null,
  overrides: Partial<TourActivityStats> = {}
): TourActivityStats {
  return {
    status: data ? 'ready' : 'loading',
    data,
    summary: data ? summarizeTourActivities(data.entries, { today: TODAY }) : null,
    period: 'all',
    setPeriod: vi.fn(),
    periods: ['all', 'thisYear', 'last12'],
    type: 'all',
    setType: vi.fn(),
    types: ['all', 'hike', 'kayak'],
    pending: new Set(),
    setExcluded: vi.fn().mockResolvedValue(undefined),
    retry: vi.fn(),
    ...overrides,
  };
}

const data: TourActivityStatsResponse = {
  entries: [
    entry(),
    entry({
      place_id: 2,
      name: 'Lake',
      tour_type: 'kayak',
      date: '2026-08-01',
      basis: 'track',
      track: { place_id: 9, name: 'Watch export' },
      distance_km: 8.5,
      ascent_m: null,
      descent_m: null,
    }),
    entry({ place_id: 3, name: 'Long trail', date: '2026-06-01', day_count: 3, distance_km: null }),
    entry({ place_id: 4, name: 'Rained off', date: '2026-05-01', excluded: true }),
    entry({ place_id: 5, name: 'Next week', date: '2026-10-27' }),
  ],
  uncounted: { unassigned: 2, undated: 0 },
};

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  seedStore(useSettingsStore, { settings: buildSettings({ distance_unit: 'metric' }) });
});

describe('TourActivityStatsDialog', () => {
  it('FE-STA2-DIALOG-001: shows the sums, at least where a tour lacks the distance, and what they rest on', () => {
    render(<TourActivityStatsDialog stats={statsOf(data)} open onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'My tour activities' })).toBeInTheDocument();
    expect(screen.getByText('≥ 20.5 km')).toBeInTheDocument();
    expect(screen.getByTestId('tour-activity-basis-plan')).toHaveTextContent('2');
    expect(screen.getByTestId('tour-activity-basis-track')).toHaveTextContent('1');
    expect(screen.getByTestId('tour-activity-upcoming')).toHaveTextContent('1');
    expect(screen.getByTestId('tour-activity-unassigned')).toHaveTextContent('2');
    expect(screen.queryByTestId('tour-activity-undated')).not.toBeInTheDocument();
  });

  it('FE-STA2-DIALOG-002: splits by type, the count at the corner of each type', () => {
    render(<TourActivityStatsDialog stats={statsOf(data)} open onClose={vi.fn()} />);
    expect(within(screen.getByTestId('tour-activity-type-hike')).getByText('2')).toBeInTheDocument();
    expect(screen.getByTestId('tour-activity-type-kayak-distance')).toHaveTextContent('8.5 km');
    expect(screen.queryByTestId('tour-activity-type-kayak-ascent')).not.toBeInTheDocument();
  });

  it('FE-STA2-DIALOG-003: lists every done tour, newest first, with its basis; the one ahead is not there', () => {
    render(<TourActivityStatsDialog stats={statsOf(data)} open onClose={vi.fn()} />);
    const list = screen.getByTestId('tour-activity-list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    expect(screen.queryByText('Next week')).not.toBeInTheDocument();
    expect(screen.getByTestId('tour-activity-row-2-9')).toHaveTextContent('Recorded');
    expect(screen.getByTestId('tour-activity-track-corner')).toBeInTheDocument();
    expect(screen.getByTestId('tour-activity-row-1')).toHaveTextContent('Planned');
    expect(
      within(screen.getByTestId('tour-activity-row-3')).getByLabelText('Planned on several days, counted once')
    ).toHaveTextContent('3');
    expect(screen.queryByTestId('tour-activity-3-distance')).not.toBeInTheDocument();
  });

  it('FE-STA2-DIALOG-004: a tour left out stays listed and can be counted again, a counted one left out', async () => {
    const stats = statsOf(data);
    const user = userEvent.setup();
    render(<TourActivityStatsDialog stats={stats} open onClose={vi.fn()} />);
    expect(screen.getByTestId('tour-activity-row-4')).toHaveTextContent('Left out');
    await user.click(screen.getByRole('button', { name: 'Count again' }));
    expect(stats.setExcluded).toHaveBeenCalledWith(expect.objectContaining({ place_id: 4 }), false);
    await user.click(within(screen.getByTestId('tour-activity-row-1')).getByRole('button', { name: 'Leave out' }));
    expect(stats.setExcluded).toHaveBeenCalledWith(expect.objectContaining({ place_id: 1 }), true);
  });

  it('FE-STA2-DIALOG-005: a tour on its way to the server cannot be switched twice', () => {
    render(<TourActivityStatsDialog stats={statsOf(data, { pending: new Set([1]) })} open onClose={vi.fn()} />);
    expect(screen.getByTestId('tour-activity-toggle-1')).toBeDisabled();
  });

  it('FE-STA2-DIALOG-006: the trip of a tour opens from its badge', async () => {
    const user = userEvent.setup();
    render(<TourActivityStatsDialog stats={statsOf(data)} open onClose={vi.fn()} />);
    await user.click(within(screen.getByTestId('tour-activity-row-1')).getByText('Alps'));
    expect(navigate).toHaveBeenCalledWith('/trips/5');
  });

  it('FE-STA2-DIALOG-007: the filters sit on the head band and change period and type', async () => {
    const stats = statsOf(data);
    const user = userEvent.setup();
    render(<TourActivityStatsDialog stats={stats} open onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /Period/ }));
    await user.click(screen.getByRole('button', { name: 'This year' }));
    expect(stats.setPeriod).toHaveBeenCalledWith('thisYear');
    await user.click(screen.getByRole('button', { name: /Type/ }));
    await user.click(screen.getByRole('button', { name: 'Paddle tour' }));
    expect(stats.setType).toHaveBeenCalledWith('kayak');
  });

  it('FE-STA2-DIALOG-008: before the read, while empty, and closed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<TourActivityStatsDialog stats={statsOf(null)} open onClose={onClose} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    rerender(
      <TourActivityStatsDialog
        stats={statsOf({ entries: [], uncounted: { unassigned: 0, undated: 0 } })}
        open
        onClose={onClose}
      />
    );
    expect(screen.getByText('No completed tours yet')).toBeInTheDocument();
    const [closeButton] = screen.getAllByRole('button', { name: 'Close' });
    await user.click(closeButton as HTMLElement);
    expect(onClose).toHaveBeenCalled();
    rerender(<TourActivityStatsDialog stats={statsOf(null)} open={false} onClose={onClose} />);
    expect(screen.queryByText('My tour activities')).not.toBeInTheDocument();
  });
});
