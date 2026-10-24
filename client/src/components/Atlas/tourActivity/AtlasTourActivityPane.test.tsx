// FE-STA2-PANE-001 to FE-STA2-PANE-006
// STA-02: the Atlas tab of the user's own tour activities: the distance large
// with how many tours at its corner, the climb, the types, what the numbers
// rest on, and the full list in a dialog.
import userEvent from '@testing-library/user-event';
import { summarizeTourActivities, type TourActivityStatsEntry, type TourActivityStatsResponse } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSettings } from '../../../../tests/helpers/factories';
import { render, screen } from '../../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { useSettingsStore } from '../../../store/settingsStore';
import { AtlasTourActivityPane } from './AtlasTourActivityPane';
import type { TourActivityStats } from './useTourActivityStats';

const hook = vi.hoisted(() => ({ current: null as unknown, active: [] as boolean[] }));
vi.mock('./useTourActivityStats', () => ({
  useTourActivityStats: (active: boolean) => {
    hook.active.push(active);
    return hook.current;
  },
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

function statsOf(data: TourActivityStatsResponse | null, overrides: Partial<TourActivityStats> = {}) {
  const stats: TourActivityStats = {
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
  hook.current = stats;
  return stats;
}

const data: TourActivityStatsResponse = {
  entries: [
    entry(),
    entry({ place_id: 2, name: 'Summit', date: '2026-08-01', distance_km: 20.5, ascent_m: 1200, descent_m: 1200 }),
    entry({
      place_id: 3,
      name: 'Lake',
      tour_type: 'kayak',
      basis: 'track',
      track: { place_id: 9, name: 'Watch' },
      distance_km: 8,
      ascent_m: null,
      descent_m: null,
    }),
  ],
  uncounted: { unassigned: 0, undated: 1 },
};

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  hook.active = [];
  seedStore(useSettingsStore, { settings: buildSettings({ distance_unit: 'metric' }) });
});

describe('AtlasTourActivityPane', () => {
  it('FE-STA2-PANE-001: follows whether the tab is shown, silent before, loading until the read is there', () => {
    statsOf(null, { status: 'idle' });
    const { rerender } = render(<AtlasTourActivityPane active={false} />);
    expect(hook.active).toEqual([false]);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    statsOf(null);
    rerender(<AtlasTourActivityPane active />);
    expect(hook.active).toEqual([false, true]);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  it('FE-STA2-PANE-002: shows the distance large with the tour count at its corner, and the climb', () => {
    statsOf(data);
    render(<AtlasTourActivityPane active />);
    expect(screen.getByTestId('atlas-tour-activity-distance')).toHaveTextContent('40.5km');
    expect(screen.getByTestId('atlas-tour-activity-count')).toHaveTextContent('3');
    expect(screen.getByTestId('atlas-tour-activity-ascent')).toHaveTextContent('2000m');
    expect(screen.getByTestId('atlas-tour-activity-type-hike')).toHaveTextContent('2');
    expect(screen.getByTestId('atlas-tour-activity-type-kayak')).toHaveTextContent('8 km');
  });

  it('FE-STA2-PANE-003: says what the numbers rest on and what does not count', () => {
    statsOf(data);
    render(<AtlasTourActivityPane active />);
    expect(screen.getByTestId('tour-activity-basis-plan')).toHaveTextContent('Planned2');
    expect(screen.getByTestId('tour-activity-basis-track')).toHaveTextContent('Recorded1');
    expect(screen.getByTestId('tour-activity-undated')).toHaveTextContent('1');
  });

  it('FE-STA2-PANE-004: one type chosen leaves the type columns out; nothing done says so', () => {
    statsOf(data, { type: 'hike', summary: summarizeTourActivities(data.entries, { today: TODAY, type: 'hike' }) });
    const { rerender } = render(<AtlasTourActivityPane active />);
    expect(screen.queryByTestId('atlas-tour-activity-type-hike')).not.toBeInTheDocument();

    statsOf(data, { summary: summarizeTourActivities(data.entries, { today: TODAY, from: '2027-01-01' }) });
    rerender(<AtlasTourActivityPane active />);
    expect(screen.getByText('No completed tours in this period')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show tours' })).not.toBeInTheDocument();
  });

  it('FE-STA2-PANE-005: the full list opens in the dialog', async () => {
    statsOf(data);
    const user = userEvent.setup();
    render(<AtlasTourActivityPane active />);
    await user.click(screen.getByRole('button', { name: 'Show tours' }));
    expect(screen.getByRole('heading', { name: 'My tour activities' })).toBeInTheDocument();
    expect(screen.getByTestId('tour-activity-list')).toBeInTheDocument();
  });

  it('FE-STA2-PANE-006: offline and failed reads say so, a failed one with a retry', async () => {
    statsOf(null, { status: 'offline' });
    const { rerender } = render(<AtlasTourActivityPane active />);
    expect(screen.getByText(/needs a connection/i)).toBeInTheDocument();

    const failed = statsOf(null, { status: 'error' });
    rerender(<AtlasTourActivityPane active />);
    expect(screen.getByRole('alert')).toHaveTextContent('Tour activities could not be loaded');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(failed.retry).toHaveBeenCalled();
  });
});
