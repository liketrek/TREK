// FE-ACT-DIALOG-001 to FE-ACT-DIALOG-004
// ACT-01, the link dialog: the day, the recordings with one taken by another
// tour dimmed, what the choice measures, the GPX import as the second way in,
// and only "Link" writing, once a free recording is chosen.
import { fireEvent, render, screen } from '@testing-library/react';
import type { TourListItem } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TourActivityDialog from './TourActivityDialog';
import type { TourActivities } from './useTourActivities';
import type { TrackAssignment } from './useTrackAssignment';

const hook = vi.hoisted(() => ({ assignment: null as unknown }));
vi.mock('./useTrackAssignment', () => ({ useTrackAssignment: () => hook.assignment }));
vi.mock('../TourGpxPreviewDialog', () => ({ default: () => null }));

const tour = { place_id: 7, name: 'Ridge', tour_type: 'hike' } as TourListItem;
const recording = (placeId: number, name: string) =>
  ({
    place_id: placeId,
    name,
    tour_type: 'hike',
    origin: 'gpx',
    has_waypoints: false,
    distance: 12.4,
    track_started_at: '2026-07-02T06:10:00Z',
    track_ended_at: '2026-07-02T09:25:00Z',
  }) as TourListItem;

function assignment(overrides: Partial<TrackAssignment> = {}): TrackAssignment {
  const watch = { tour: recording(20, 'Watch export'), takenBy: null };
  return {
    executions: [{ assignmentId: 11, day: { id: 1, date: '2026-07-02', title: null }, index: 0 }],
    assignmentId: 11,
    execution: { assignmentId: 11, day: null, index: 0 },
    chooseExecution: vi.fn(),
    candidates: [watch, { tour: recording(21, 'Phone export'), takenBy: 'Lake loop' }],
    selected: 20,
    choose: vi.fn(),
    choice: watch,
    replaces: [],
    gpxImport: {
      importing: false,
      preview: null,
      pick: vi.fn(),
      confirm: vi.fn(),
      cancel: vi.fn(),
      importFiles: vi.fn(),
    },
    importFields: { tour_type: 'hike' },
    ready: true,
    ...overrides,
  } as unknown as TrackAssignment;
}

const state = (overrides: Partial<TourActivities> = {}) =>
  ({
    busy: false,
    canEdit: true,
    assigning: {},
    assign: vi.fn(),
    closeAssign: vi.fn(),
    ...overrides,
  }) as unknown as TourActivities;

const show = (current: TourActivities = state()) =>
  render(<TourActivityDialog tripId={1} tour={tour} executions={[]} state={current} activities={[]} />);

beforeEach(() => {
  hook.assignment = assignment();
});

describe('TourActivityDialog (ACT-01)', () => {
  it('FE-ACT-DIALOG-001: offers the recordings, the taken one dimmed with its tour, and what the choice measures', () => {
    show();
    expect(screen.getByText('tours.activity.dialogEyebrow')).toBeInTheDocument();
    expect(screen.getByText('tours.activity.dialogHint')).toBeInTheDocument();
    const [watch, phone] = screen.getAllByTestId('tour-activity-candidate');
    expect(watch).toHaveAttribute('aria-checked', 'true');
    expect(phone).toBeDisabled();
    expect(phone).toHaveTextContent('tours.activity.ofTour');
    expect(watch).toHaveTextContent('3 h 15 min');
    expect(screen.getByText('tours.activity.time')).toBeInTheDocument();
  });

  it('FE-ACT-DIALOG-002: only Link writes, with the chosen recording and day', () => {
    const current = state();
    show(current);
    fireEvent.click(screen.getAllByTestId('tour-activity-candidate')[0] as HTMLElement);
    expect((hook.assignment as TrackAssignment).choose).toHaveBeenCalledWith(20);
    expect(current.assign).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('tour-activity-confirm'));
    expect(current.assign).toHaveBeenCalledWith(20, 11);
  });

  it('FE-ACT-DIALOG-003: nothing to link until a free recording is chosen; what it replaces is said', () => {
    hook.assignment = assignment({ ready: false, choice: null, selected: null, replaces: ['Old export'] });
    const current = state();
    show(current);
    expect(screen.getByTestId('tour-activity-confirm')).toBeDisabled();
    fireEvent.click(screen.getByTestId('tour-activity-confirm'));
    expect(current.assign).not.toHaveBeenCalled();
    expect(screen.getByText('tours.activity.replaces')).toBeInTheDocument();
    expect(screen.queryByText('tours.activity.time')).toBeNull();
  });

  it('FE-ACT-DIALOG-004: the GPX import is the way in when the trip has none; a list still loading waits', () => {
    const empty = assignment({ candidates: [], choice: null, selected: null, ready: false });
    hook.assignment = empty;
    const { unmount } = show();
    expect(screen.getByText('tours.activity.noCandidates')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /tours.activity.importGpx/ }));
    expect(empty.gpxImport.pick).toHaveBeenCalled();
    unmount();

    hook.assignment = assignment({ candidates: null, choice: null, selected: null, ready: false });
    show();
    expect(screen.getByLabelText('common.loading')).toBeInTheDocument();
  });
});
