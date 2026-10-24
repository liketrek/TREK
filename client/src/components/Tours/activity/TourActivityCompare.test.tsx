// FE-ACT-COMPARE-VIEW-001 to FE-ACT-COMPARE-VIEW-006
// ACT-02 in an actual track's card, rendered without the translation
// provider so every text reads as its key: plan and track side by side under
// their own names, the difference only where both are known, a missing value
// named as missing, the deviation from the planned line, and the map switch.
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { TourActivity } from '@trek/shared';
import { describe, expect, it, vi } from 'vitest';
import { formatDifference } from './compareValueText';
import type { PlanValues } from './planComparison';
import TourActivityCompare from './TourActivityCompare';

const plan: PlanValues = {
  distanceKm: 2,
  gain: 120,
  loss: null,
  minutes: 180,
  minutesAtLeast: false,
  line: [
    [47, 11],
    [47.01, 11],
    [47.02, 11],
  ],
};

function activity(overrides: Partial<TourActivity['metrics']> = {}): TourActivity {
  return {
    id: 4,
    assignment_id: 11,
    day_id: 1,
    assigned_at: null,
    track: { place_id: 20, name: 'Watch export', origin: 'gpx', file_name: 'morning.gpx', imported_at: null },
    metrics: {
      distance_km: 2.5,
      elevation_gain_m: 120,
      elevation_loss_m: 90,
      started_at: '2026-07-02T06:00:00Z',
      ended_at: '2026-07-02T09:15:00Z',
      elapsed_minutes: 195,
      point_count: 3,
      ...overrides,
    },
    geometry: [
      [47, 11, 600],
      [47.012, 11.01, 650],
      [47.02, 11, 700],
    ],
  };
}

const row = (key: string) => screen.getByTestId(`tour-activity-compare-${key}`);

function show(props: Partial<Parameters<typeof TourActivityCompare>[0]> = {}) {
  return render(
    <TourActivityCompare activity={activity()} plan={plan} planColor="plan-paint" unit="metric" {...props} />
  );
}

describe('TourActivityCompare (ACT-02)', () => {
  it('FE-ACT-COMPARE-VIEW-001: names plan, actual and difference, and sets each measure of both side by side', () => {
    show();
    const table = screen.getByTestId('tour-activity-compare');
    expect(within(table).getByText('tours.activity.compare.plan')).toBeInTheDocument();
    expect(within(table).getByText('tours.activity.badge')).toBeInTheDocument();
    expect(within(table).getByText('tours.activity.compare.difference')).toBeInTheDocument();
    expect(row('distance')).toHaveTextContent('2 km');
    expect(row('distance')).toHaveTextContent('2.5 km');
    expect(row('distance')).toHaveTextContent('+500 m');
    expect(row('ascent')).toHaveTextContent('±0 m');
    expect(row('time')).toHaveTextContent('3 h');
    expect(row('time')).toHaveTextContent('3 h 15 min');
    expect(row('time')).toHaveTextContent('+15 min');
  });

  it('FE-ACT-COMPARE-VIEW-002: a value a side does not carry is named missing, and nothing is set between them', () => {
    show({ activity: activity({ elapsed_minutes: null }), plan: { ...plan, gain: null } });
    expect(row('ascent')).toHaveTextContent('tours.activity.compare.notInPlan');
    expect(row('descent')).toHaveTextContent('tours.activity.compare.notInPlan');
    expect(row('time')).toHaveTextContent('tours.activity.noTime');
    expect(within(row('time')).queryByText(/min$/)).toBeNull();

    show({ activity: activity({ elevation_loss_m: null }), plan: { ...plan, loss: 80 } });
    expect(screen.getAllByTestId('tour-activity-compare-descent')[1]).toHaveTextContent(
      'tours.activity.compare.notInTrack'
    );
  });

  it('FE-ACT-COMPARE-VIEW-003: a planned total that is only a floor reads "at least" and is not subtracted from', () => {
    show({ plan: { ...plan, minutesAtLeast: true } });
    expect(row('time')).toHaveTextContent('≥ 3 h');
    expect(row('time')).not.toHaveTextContent('+15 min');
  });

  it('FE-ACT-COMPARE-VIEW-004: measures how far the track left the planned line, or says there is no line', () => {
    const { unmount } = show();
    expect(screen.getByText('tours.activity.compare.farthest')).toBeInTheDocument();
    expect(screen.getByText('tours.activity.compare.offPlan')).toBeInTheDocument();
    expect(screen.getByText('tours.activity.compare.offPlanValue')).toBeInTheDocument();
    unmount();

    show({ plan: { ...plan, line: null } });
    expect(screen.queryByText('tours.activity.compare.farthest')).toBeNull();
    expect(screen.getByText('tours.activity.compare.noLine')).toBeInTheDocument();
  });

  it('FE-ACT-COMPARE-VIEW-005: the map switch draws and ends the comparison, and says which it is', () => {
    const onToggle = vi.fn();
    const { rerender } = show({ map: { shown: false, onToggle } });
    const button = screen.getByRole('button', { name: /tours.activity.compare.show/ });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);

    rerender(
      <TourActivityCompare
        activity={activity()}
        plan={plan}
        planColor="plan-paint"
        unit="metric"
        map={{ shown: true, onToggle }}
      />
    );
    expect(screen.getByRole('button', { name: /tours.activity.compare.hide/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('FE-ACT-COMPARE-VIEW-006: no map switch without a plan map beside the detail, or without a line to draw', () => {
    const { unmount } = show();
    expect(screen.queryByRole('button', { name: /tours.activity.compare.show/ })).toBeNull();
    unmount();

    show({ activity: { ...activity(), geometry: [] }, map: { shown: false, onToggle: vi.fn() } });
    expect(screen.queryByRole('button', { name: /tours.activity.compare.show/ })).toBeNull();
  });
});

describe('formatDifference (ACT-02)', () => {
  it('signs a difference, calls one that rounds to nothing even, and keeps the unit shown', () => {
    expect(formatDifference('distance', -1.25, 'metric')).toBe('-1.3 km');
    expect(formatDifference('descent', 0.2, 'metric')).toBe('±0 m');
    expect(formatDifference('ascent', 30, 'imperial')).toBe('+98 ft');
    expect(formatDifference('time', -45, 'metric')).toBe('-45 min');
  });
});
