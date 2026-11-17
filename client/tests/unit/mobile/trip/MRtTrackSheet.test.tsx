import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FollowTrack } from '../../../../src/components/Roadtrip/useFollowTrack';
import { _pinSizeClass, type SizeClass } from '../../../../src/hooks/sizeClass';
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell';
import MRtTrackSheet, { MRtTrackEntry } from '../../../../src/mobile/screens/trip/roadtrip/MRtTrackSheet';
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip';
import { fireEvent, render, screen } from '../../../helpers/render';
import { resetAllStores } from '../../../helpers/store';

// FE-MOB-RTTRACK-001 to FE-MOB-RTTRACK-010
//
// The track a day follows, as a sheet on an iPad or an unfolded Duo, over the
// planner's followTrack (the desktop's RoadtripTrackModal runs on the same hook).

const COAST = { id: 11, name: 'Coast road', color: '#3366ff', lengthKm: 120, gapKm: 0.5 };
const PASS = { id: 12, name: '', color: '', lengthKm: 48, gapKm: 30 };

function follow(overrides: Partial<FollowTrack> = {}): FollowTrack {
  return {
    dayId: 5,
    open: vi.fn(),
    close: vi.fn(),
    tracks: [COAST, PASS],
    busy: false,
    round: 0,
    error: null,
    outcome: null,
    apply: vi.fn(async () => {}),
    clear: vi.fn(async () => {}),
    viaCount: 0,
    current: null,
    namesByDay: {},
    available: true,
    ...overrides,
  } as FollowTrack;
}

function planner(track: FollowTrack, overrides: Record<string, unknown> = {}): TripPlanner {
  return buildPlanner({
    followTrack: track,
    roadtripRoutes: { ...buildPlanner().roadtripRoutes, days: [{ dayId: 5, dayNumber: 3 }] },
    ...overrides,
  } as unknown as Partial<TripPlanner>);
}

function renderSheet(track: FollowTrack, size: SizeClass = 'wide') {
  _pinSizeClass(size);
  const shell = buildShell({} as Partial<MTripShellApi>);
  render(<MRtTrackSheet planner={planner(track)} shell={shell} />);
}

describe('MRtTrackSheet', () => {
  beforeEach(() => {
    resetAllStores();
  });

  afterEach(() => {
    _pinSizeClass(null);
  });

  it('FE-MOB-RTTRACK-001: opens for the day the planner names, on a large screen', () => {
    renderSheet(follow());
    expect(screen.getByRole('dialog', { name: 'Day 3 follows a track' })).toBeInTheDocument();
    expect(screen.getByText('Coast road')).toBeInTheDocument();
    expect(screen.getByText('Unnamed track')).toBeInTheDocument();
    expect(screen.getByText(/along this day/)).toBeInTheDocument();
  });

  it('FE-MOB-RTTRACK-002: stays closed on the phone', () => {
    renderSheet(follow(), 'compact');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('FE-MOB-RTTRACK-003: stays closed while no day is open', () => {
    renderSheet(follow({ dayId: null }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('FE-MOB-RTTRACK-004: a track is picked, explained, then followed', () => {
    const track = follow();
    renderSheet(track);
    const action = screen.getByRole('button', { name: 'Follow this track' });
    expect(action).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Coast road/ }));
    expect(screen.getByRole('button', { name: /Coast road/ })).toHaveAttribute('aria-pressed', 'true');
    expect(action).toBeEnabled();
    fireEvent.click(action);
    expect(track.apply).toHaveBeenCalledWith(11);
  });

  it('FE-MOB-RTTRACK-005: dropping the vias is offered only when the day carries some', () => {
    const track = follow({ viaCount: 4 });
    renderSheet(track);
    fireEvent.click(screen.getByRole('button', { name: /Drop 4/ }));
    expect(track.clear).toHaveBeenCalled();
  });

  it('FE-MOB-RTTRACK-006: says what the day follows today, and an empty trip says so', () => {
    renderSheet(follow({ current: { name: 'Coast road', strayKm: 1 }, tracks: [] }));
    expect(screen.getByText('Currently following Coast road')).toBeInTheDocument();
    expect(screen.getByText('No tracks in this trip')).toBeInTheDocument();
  });

  it('FE-MOB-RTTRACK-007: tells the round while it works', () => {
    renderSheet(follow({ busy: true, round: 2 }));
    expect(screen.getByText('Fitting the drive to the track, round 2')).toBeInTheDocument();
  });

  it('FE-MOB-RTTRACK-008: a routing failure is an alert', () => {
    renderSheet(follow({ error: 'route' }));
    expect(screen.getByRole('alert')).toHaveTextContent('The routing service did not answer.');
  });

  it('FE-MOB-RTTRACK-009: a fit that placed nothing says the drive already followed the track', () => {
    renderSheet(follow({ outcome: { vias: 0, strayKm: 0, capped: false } }));
    expect(screen.getByText('The drive already followed this track.')).toBeInTheDocument();
  });
});

describe('MRtTrackEntry', () => {
  afterEach(() => {
    _pinSizeClass(null);
  });

  it('FE-MOB-RTTRACK-010: offers the sheet on a large screen to an editor of a trip with tracks only', () => {
    const track = follow({ namesByDay: { 5: 'Coast road' } });
    _pinSizeClass('split');
    const { unmount } = render(<MRtTrackEntry planner={planner(track)} dayId={5} />);
    fireEvent.click(screen.getByRole('button', { name: 'Currently following Coast road' }));
    expect(track.open).toHaveBeenCalledWith(5);
    unmount();

    const hidden: [SizeClass, TripPlanner][] = [
      ['wide', planner(follow({ available: false }))],
      ['compact', planner(follow())],
      ['wide', planner(follow(), { can: vi.fn(() => false) })],
    ];
    for (const [size, p] of hidden) {
      _pinSizeClass(size);
      const view = render(<MRtTrackEntry planner={p} dayId={5} />);
      expect(view.container).toBeEmptyDOMElement();
      view.unmount();
    }
  });
});
