// FE-ACT-SECTION-001 to FE-ACT-SECTION-008
// ACT-01 in the tour's detail, rendered without the translation provider so
// every text reads as its key: the actual tracks with their own values marked
// as such beside the plan's (ACT-02), a time only where the track measured
// one, the actions only for someone who may change the tour, and the map
// comparison only where a plan map is beside the detail and can draw it.
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { TourActivity, TourListItem } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTourActivityCompareStore } from '../../../store/tourActivityCompareStore';
import type { Day } from '../../../types';
import TourActivitySection from './TourActivitySection';
import type { PlanValues } from './planComparison';
import type { TourActivities } from './useTourActivities';

const hook = vi.hoisted(() => ({ state: null as unknown }));
vi.mock('./useTourActivities', () => ({ useTourActivities: () => hook.state }));
vi.mock('./TourActivityDialog', () => ({ default: () => <div data-testid="tour-activity-dialog" /> }));

const tour = { place_id: 7, name: 'Ridge', tour_type: 'hike' } as TourListItem;
const days = [{ id: 1, date: '2026-07-02', title: null }] as unknown as Day[];
const assignments = { '1': [{ id: 11, place_id: 7 }] } as never;

function activity(overrides: Partial<TourActivity['metrics']> = {}, assignmentId: number | null = 11): TourActivity {
  return {
    id: 4,
    assignment_id: assignmentId,
    day_id: 1,
    assigned_at: null,
    track: { place_id: 20, name: 'Watch export', origin: 'gpx', file_name: 'morning.gpx', imported_at: null },
    metrics: {
      distance_km: 0.1,
      elevation_gain_m: 100,
      elevation_loss_m: 0,
      started_at: '2026-07-02T06:10:00Z',
      ended_at: '2026-07-02T09:25:00Z',
      elapsed_minutes: 195,
      point_count: 2,
      ...overrides,
    },
    geometry: [
      [47, 11, 600],
      [47.001, 11, 700],
    ],
  };
}

function state(overrides: Partial<TourActivities> = {}): TourActivities {
  return {
    activities: [activity()],
    unavailable: false,
    canEdit: true,
    busy: false,
    assigning: null,
    openAssign: vi.fn(),
    closeAssign: vi.fn(),
    assign: vi.fn(),
    removing: null,
    askRemove: vi.fn(),
    cancelRemove: vi.fn(),
    remove: vi.fn(),
    ...overrides,
  } as TourActivities;
}

const plan: PlanValues = { distanceKm: 0.1, gain: 80, loss: 0, minutes: 180, minutesAtLeast: false, line: null };

const show = (canEdit = true, item: TourListItem = tour, mapCompare = false) =>
  render(
    <TourActivitySection
      tripId={1}
      tour={item}
      days={days}
      assignments={assignments}
      canEdit={canEdit}
      plan={plan}
      planColor="plan-paint"
      mapCompare={mapCompare}
    />
  );

beforeEach(() => {
  hook.state = state();
  useTourActivityCompareStore.setState({ comparison: null, mapAvailable: true });
});

describe('TourActivitySection (ACT-01)', () => {
  it("FE-ACT-SECTION-001: shows an actual track with its day, its file, its own values beside the plan's, and its profile", () => {
    show();
    expect(screen.getByText('tours.activity.label')).toBeInTheDocument();
    expect(screen.getByText('Watch export')).toBeInTheDocument();
    expect(screen.getByTestId('tour-activity-day')).toHaveTextContent('dayplan.dayN');
    expect(screen.getByText('morning.gpx')).toBeInTheDocument();
    expect(screen.getAllByText('tours.activity.badge').length).toBeGreaterThan(0);
    expect(screen.getByTestId('tour-activity-compare-time')).toHaveTextContent('3 h 15 min');
    expect(screen.getByTestId('tour-activity-compare-ascent')).toHaveTextContent('+20 m');
  });

  it('FE-ACT-SECTION-002: a track without times measures no time, and a track without a day says so', () => {
    hook.state = state({ activities: [activity({ elapsed_minutes: null, started_at: null, ended_at: null }, null)] });
    show();
    expect(screen.getByTestId('tour-activity-compare-time')).toHaveTextContent('tours.activity.noTime');
    expect(screen.getByTestId('tour-activity-day')).toHaveTextContent('tours.activity.noDay');
    expect(screen.queryByText('tours.activity.recordedOn')).toBeNull();
    // The recording's tile goes by the done mark every actual track has, never footprints.
    const head = screen.getByTestId('tour-activity').querySelector('header') as HTMLElement;
    expect(head.querySelector('svg.lucide-check-check')).not.toBeNull();
    expect(head.querySelector('svg.lucide-footprints')).toBeNull();
  });

  it('FE-ACT-SECTION-003: someone who may change the tour links, changes and unlinks; the dialog opens when asked', () => {
    const current = state();
    hook.state = current;
    const { rerender } = show();
    fireEvent.click(screen.getByRole('button', { name: /tours.activity.assign$/ }));
    expect(current.openAssign).toHaveBeenCalledWith();
    fireEvent.click(screen.getByRole('button', { name: /tours.activity.change/ }));
    expect(current.openAssign).toHaveBeenCalledWith({ assignmentId: 11, activityId: 4 });
    fireEvent.click(screen.getByRole('button', { name: /tours.activity.remove/ }));
    expect(current.askRemove).toHaveBeenCalledWith(current.activities?.[0]);

    hook.state = state({ assigning: {}, removing: activity() });
    rerender(
      <TourActivitySection
        tripId={1}
        tour={tour}
        days={days}
        assignments={assignments}
        canEdit
        plan={plan}
        planColor="plan-paint"
      />
    );
    expect(screen.getByTestId('tour-activity-dialog')).toBeInTheDocument();
    expect(screen.getByText('tours.activity.removeTitle')).toBeInTheDocument();
  });

  it('FE-ACT-SECTION-004: without the right to change it, the values show and no action does', () => {
    hook.state = state({ canEdit: false });
    show(false);
    expect(screen.getByText('Watch export')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /tours.activity.assign$/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /tours.activity.remove/ })).toBeNull();
  });

  it('FE-ACT-SECTION-005: an empty place for one when it may be linked; nothing while loading, when it cannot, or for a track of another tour', () => {
    hook.state = state({ activities: [] });
    const { unmount } = show();
    expect(screen.getByTestId('tour-activity-empty')).toHaveTextContent('tours.activity.empty');
    unmount();

    hook.state = state({ activities: [], canEdit: false });
    const readOnly = show(false);
    expect(readOnly.container).toBeEmptyDOMElement();
    readOnly.unmount();

    hook.state = state({ activities: null });
    const loading = show();
    expect(loading.container).toBeEmptyDOMElement();
    loading.unmount();

    hook.state = state();
    const track = show(true, { ...tour, activity_of: 3 });
    expect(track.container).toBeEmptyDOMElement();
  });

  it('FE-ACT-SECTION-006: tracks that could not be read are said to be unavailable, never shown as none, and nothing is linked over them', () => {
    hook.state = state({ activities: [], unavailable: true });
    const { unmount } = show();
    expect(screen.getByRole('status')).toHaveTextContent('tours.activity.unavailable');
    expect(screen.queryByTestId('tour-activity-empty')).toBeNull();
    expect(screen.getByRole('button', { name: /tours.activity.assign$/ })).toBeDisabled();
    unmount();

    hook.state = state({ activities: [], unavailable: true, canEdit: false });
    show(false);
    expect(screen.getByText('tours.activity.unavailable')).toBeInTheDocument();
  });

  it('FE-ACT-SECTION-007: beside a plan map a track is compared there and back, and on the phone it is not offered', () => {
    const { unmount } = show(false, tour, true);
    fireEvent.click(screen.getByRole('button', { name: /tours.activity.compare.show/ }));
    expect(useTourActivityCompareStore.getState().comparison).toEqual({ tourPlaceId: 7, trackPlaceId: 20 });
    expect(screen.getByRole('button', { name: /tours.activity.compare.hide/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /tours.activity.compare.hide/ }));
    expect(useTourActivityCompareStore.getState().comparison).toBeNull();

    act(() => useTourActivityCompareStore.getState().show({ tourPlaceId: 7, trackPlaceId: 20 }));
    unmount();
    expect(useTourActivityCompareStore.getState().comparison).toBeNull();

    show(false);
    expect(screen.queryByRole('button', { name: /tours.activity.compare.show/ })).toBeNull();
  });

  it('FE-ACT-SECTION-008: in road trip mode or with the overview open the map draws other lines, so no switch is offered and a running comparison ends', () => {
    show(false, tour, true);
    fireEvent.click(screen.getByRole('button', { name: /tours.activity.compare.show/ }));
    expect(useTourActivityCompareStore.getState().comparison).not.toBeNull();

    act(() => useTourActivityCompareStore.getState().setMapAvailable(false));
    expect(useTourActivityCompareStore.getState().comparison).toBeNull();
    expect(screen.queryByRole('button', { name: /tours.activity.compare.(show|hide)/ })).toBeNull();

    act(() => useTourActivityCompareStore.getState().setMapAvailable(true));
    expect(screen.getByRole('button', { name: /tours.activity.compare.show/ })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });
});
