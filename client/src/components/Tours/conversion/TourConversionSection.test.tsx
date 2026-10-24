import { act, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TourListItem } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { useSettingsStore } from '../../../store/settingsStore';
import type { TourPlannerController } from '../planner/useTourPlanner';
import TourConversionSection from './TourConversionSection';
import { useGpxConversion } from './useGpxConversion';

const routing = vi.hoisted(() => ({ route: vi.fn(), run: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../planner/tourRouting', () => ({ routeWalkingTour: routing.route, routeRun: routing.run }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

const imported: TourListItem = {
  place_id: 14,
  name: 'Recorded ridge',
  description: 'Above the lake',
  website: null,
  tour_type: 'hike',
  distance: 2,
  elevation_gain: 100,
  elevation_loss: 100,
  duration: null,
  difficulty: 'moderate',
  wanderer_ref: 'https://wanderer.test#abc',
  match_confidence: 1,
  max_hiking_difficulty: 2,
  planned: false,
  caution: false,
  has_waypoints: false,
};

/** A straight track north, about two kilometres. */
const track: [number, number][] = Array.from({ length: 181 }, (_, i) => [47 + (i * 2) / 180 / 111.2, 11]);

function planner(overrides: Partial<TourPlannerController> = {}): TourPlannerController {
  return {
    canEdit: true,
    mode: { type: 'view-gpx', placeId: imported.place_id, tour: imported },
    readOnlyGpxTour: { tour: imported, routeGeometry: null },
    readOnlyGpxAnalysis: { routeCoordinates: track },
    startDerivedTour: vi.fn().mockReturnValue(true),
    ...overrides,
  } as unknown as TourPlannerController;
}

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  seedStore(useSettingsStore, { settings: { distance_unit: 'metric' } });
  routing.route.mockResolvedValue({ coordinates: track, distanceMeters: 2000, durationSeconds: 1800 });
  routing.run.mockResolvedValue({ coordinates: track, distanceMeters: 2000, durationSeconds: 1800 });
});

describe('useGpxConversion', () => {
  it('PR1-05A: analyses only when asked, then compares the routed suggestion to the track', async () => {
    const { result } = renderHook(() => useGpxConversion(planner()));
    expect(result.current.status).toBe('idle');
    expect(result.current.available).toBe(true);
    expect(routing.route).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.analyze();
    });

    expect(routing.route).toHaveBeenCalledWith(result.current.points, expect.any(AbortSignal), 2);
    expect(result.current.status).toBe('ready');
    expect(result.current.comparison?.withinCorridor).toBe(1);
    expect(result.current.line).toEqual(track);
  });

  it('PR1-05A: routes an import without a grade with T3 paths allowed', async () => {
    const ungraded = { ...imported, max_hiking_difficulty: null };
    const { result } = renderHook(() =>
      useGpxConversion(
        planner({
          mode: { type: 'view-gpx', placeId: ungraded.place_id, tour: ungraded },
          readOnlyGpxTour: { tour: ungraded, routeGeometry: null },
        } as Partial<TourPlannerController>)
      )
    );
    await act(async () => {
      await result.current.analyze();
    });
    expect(routing.route).toHaveBeenLastCalledWith(expect.any(Array), expect.any(AbortSignal), 3);
  });

  it('routes an ungraded hike again with every path allowed when T3 finds no way, and plans it with that grade', async () => {
    const ungraded = { ...imported, max_hiking_difficulty: null };
    routing.route.mockResolvedValueOnce(null);
    const startDerivedTour = vi.fn().mockReturnValue(true);
    const { result } = renderHook(() =>
      useGpxConversion(
        planner({
          startDerivedTour,
          mode: { type: 'view-gpx', placeId: ungraded.place_id, tour: ungraded },
          readOnlyGpxTour: { tour: ungraded, routeGeometry: null },
        } as Partial<TourPlannerController>)
      )
    );
    await act(async () => {
      await result.current.analyze();
    });
    expect(routing.route.mock.calls.map((call) => call[2])).toEqual([3, 6]);
    expect(result.current.status).toBe('ready');
    act(() => {
      result.current.adopt('new');
    });
    expect(startDerivedTour).toHaveBeenCalledWith(expect.objectContaining({ difficulty: 6 }));
  });

  it('PR1-05A: says so when no route is found, and stays retryable', async () => {
    routing.route.mockResolvedValueOnce(null);
    const { result } = renderHook(() => useGpxConversion(planner()));
    await act(async () => {
      await result.current.analyze();
    });
    expect(result.current.status).toBe('failed');
    expect(result.current.error).toBe('routing');

    await act(async () => {
      await result.current.analyze();
    });
    expect(result.current.status).toBe('ready');
  });

  it('PR1-05A: a track too short to plan from fails without asking the router', async () => {
    const { result } = renderHook(() =>
      useGpxConversion(
        planner({
          readOnlyGpxAnalysis: {
            routeCoordinates: [
              [47, 11],
              [47, 11],
            ],
          },
        } as Partial<TourPlannerController>)
      )
    );
    await act(async () => {
      await result.current.analyze();
    });
    // Two identical points simplify to start and end, which the router may still connect;
    // a single point has nothing to plan from.
    const single = renderHook(() =>
      useGpxConversion(
        planner({ readOnlyGpxAnalysis: { routeCoordinates: [[47, 11]] } } as Partial<TourPlannerController>)
      )
    );
    expect(single.result.current.available).toBe(false);
  });

  it('PR1-05B: replacing hands the points to the planner as the import planned over in place', async () => {
    const controller = planner();
    const { result } = renderHook(() => useGpxConversion(controller));
    await act(async () => {
      await result.current.analyze();
    });
    let started = false;
    act(() => {
      started = result.current.adopt('replace');
    });
    expect(started).toBe(true);
    expect(controller.startDerivedTour).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Recorded ridge',
        description: 'Above the lake',
        difficulty: 2,
        sourcePlaceId: 14,
        inPlace: true,
      })
    );
    expect(result.current.status).toBe('idle');
  });

  it('PR1-05B: a new tour beside the import remembers where it came from', async () => {
    const controller = planner();
    const { result } = renderHook(() => useGpxConversion(controller));
    await act(async () => {
      await result.current.analyze();
    });
    act(() => {
      result.current.adopt('new');
    });
    expect(controller.startDerivedTour).toHaveBeenCalledWith(
      expect.objectContaining({ sourcePlaceId: 14, inPlace: false })
    );
  });

  it('RUN-01: a run import is routed for its profile and planned as a run, its pace left to the runner', async () => {
    const run = {
      ...imported,
      tour_type: 'run' as const,
      run_profile: 'running' as const,
      max_hiking_difficulty: null,
    };
    const controller = planner({
      mode: { type: 'view-gpx', placeId: run.place_id, tour: run },
      readOnlyGpxTour: { tour: run, routeGeometry: null },
    } as Partial<TourPlannerController>);
    const { result } = renderHook(() => useGpxConversion(controller));
    await act(async () => {
      await result.current.analyze();
    });
    expect(routing.run).toHaveBeenCalledWith(result.current.points, 'running', expect.any(AbortSignal));
    expect(routing.route).not.toHaveBeenCalled();
    act(() => {
      result.current.adopt('new');
    });
    const draft = vi.mocked(controller.startDerivedTour).mock.calls[0]?.[0];
    expect(draft).toMatchObject({ tourType: 'run', runProfile: 'running', runPaceSecondsPerKm: null });
    expect(draft).not.toHaveProperty('paddle');
  });

  it('RUN-01: a run planned over in place again keeps the pace it holds', async () => {
    const run = {
      ...imported,
      tour_type: 'run' as const,
      run_profile: 'running' as const,
      run_pace_seconds_per_km: 330,
      max_hiking_difficulty: null,
    };
    const controller = planner({
      mode: { type: 'view-gpx', placeId: run.place_id, tour: run },
      readOnlyGpxTour: { tour: run, routeGeometry: null },
    } as Partial<TourPlannerController>);
    const { result } = renderHook(() => useGpxConversion(controller));
    await act(async () => {
      await result.current.analyze();
    });
    act(() => {
      result.current.adopt('replace');
    });
    expect(controller.startDerivedTour).toHaveBeenCalledWith(
      expect.objectContaining({ inPlace: true, tourType: 'run', runProfile: 'running', runPaceSecondsPerKm: 330 })
    );
  });

  it('SKI-02: a ski track is planned over as a ski tour of its discipline, its legs drawn straight', async () => {
    const ski = {
      ...imported,
      tour_type: 'ski' as const,
      ski_discipline: 'cross_country' as const,
      ski_technique: 'classic' as const,
      max_hiking_difficulty: null,
    };
    const controller = planner({
      mode: { type: 'view-gpx', placeId: ski.place_id, tour: ski },
      readOnlyGpxTour: { tour: ski, routeGeometry: null },
    } as Partial<TourPlannerController>);
    const { result } = renderHook(() => useGpxConversion(controller));
    expect(result.current.available).toBe(true);
    expect(result.current.paddle).toBe(true);
    await act(async () => {
      await result.current.analyze();
    });
    const legs = routing.route.mock.calls[0]?.[0] as Array<{ fixedLeg: { kind: string } | null }>;
    expect(legs.slice(0, -1).every((point) => point.fixedLeg?.kind === 'free')).toBe(true);
    expect(routing.run).not.toHaveBeenCalled();
    act(() => {
      result.current.adopt('new');
    });
    expect(controller.startDerivedTour).toHaveBeenCalledWith(
      expect.objectContaining({ tourType: 'ski', ski: { discipline: 'cross_country', technique: 'classic' } })
    );
  });

  it('SKI-02: a ski track that names no discipline is planned over too, the planner asks for it', async () => {
    const ski = { ...imported, tour_type: 'ski' as const, ski_discipline: null, max_hiking_difficulty: null };
    const controller = planner({
      mode: { type: 'view-gpx', placeId: ski.place_id, tour: ski },
      readOnlyGpxTour: { tour: ski, routeGeometry: null },
    } as Partial<TourPlannerController>);
    const { result } = renderHook(() => useGpxConversion(controller));
    expect(result.current.available).toBe(true);
    expect(result.current.ski).toBe(true);
    await act(async () => {
      await result.current.analyze();
    });
    act(() => {
      result.current.adopt('new');
    });
    // Nothing is chosen for the skier: the draft opens without a discipline, and saving waits for one.
    expect(controller.startDerivedTour).toHaveBeenCalledWith(
      expect.objectContaining({ tourType: 'ski', ski: { discipline: null, technique: null } })
    );
  });

  it('PR1-05B: nothing is adopted before the suggestion is ready', () => {
    const controller = planner();
    const { result } = renderHook(() => useGpxConversion(controller));
    expect(result.current.adopt('new')).toBe(false);
    expect(controller.startDerivedTour).not.toHaveBeenCalled();
  });

  it('PR1-05A: another import in view starts idle again, and discarding forgets the analysis', async () => {
    const { result, rerender } = renderHook(({ controller }) => useGpxConversion(controller), {
      initialProps: { controller: planner() },
    });
    await act(async () => {
      await result.current.analyze();
    });
    expect(result.current.status).toBe('ready');

    const other = { ...imported, place_id: 15 };
    rerender({
      controller: planner({
        mode: { type: 'view-gpx', placeId: 15, tour: other },
        readOnlyGpxTour: { tour: other, routeGeometry: null },
      } as Partial<TourPlannerController>),
    });
    expect(result.current.status).toBe('idle');

    rerender({ controller: planner() });
    await act(async () => {
      await result.current.analyze();
    });
    act(() => result.current.cancel());
    expect(result.current.status).toBe('idle');
  });

  it('PR1-05A: is not offered without the right to add tours', () => {
    const { result } = renderHook(() => useGpxConversion(planner({ canEdit: false })));
    expect(result.current.available).toBe(false);
  });
});

describe('TourConversionSection', () => {
  function Section({ controller }: { controller: TourPlannerController }) {
    const conversion = useGpxConversion(controller);
    return <TourConversionSection conversion={conversion} />;
  }

  it('PR1-05A: offers the analysis, then the comparison with both ways to take it over', async () => {
    const controller = planner();
    render(<Section controller={controller} />);

    await userEvent.click(screen.getByRole('button', { name: 'Plan an editable version' }));

    expect(await screen.findByRole('button', { name: 'Replace the import' })).toBeInTheDocument();
    expect(screen.getByText('Within 50 m of the track')).toBeInTheDocument();
    expect(screen.getByText('100 %')).toBeInTheDocument();
    expect(
      screen.getByText('The suggestion follows the track closely. It is routed anew, so it is not the same line.')
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Replace the import' }));
    expect(controller.startDerivedTour).toHaveBeenCalledWith(expect.objectContaining({ inPlace: true }));
    expect(toast.info).toHaveBeenCalledWith(
      'Opened in the editor. Save it to replace the import; the recorded track stays restorable.'
    );
  });

  it('PR1-05B: plans a new tour beside the import on request', async () => {
    const controller = planner();
    render(<Section controller={controller} />);
    await userEvent.click(screen.getByRole('button', { name: 'Plan an editable version' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Plan as new tour' }));
    expect(controller.startDerivedTour).toHaveBeenCalledWith(expect.objectContaining({ inPlace: false }));
    expect(toast.info).toHaveBeenCalledWith('Opened as a new tour. Save it to keep it; the import stays as it is.');
  });

  it('PR1-05A: warns when the suggestion leaves the track for longer stretches', async () => {
    const elsewhere: [number, number][] = track.map(([lat, lng]) => [lat, lng + 0.01]);
    routing.route.mockResolvedValue({ coordinates: elsewhere, distanceMeters: 2000, durationSeconds: 1800 });
    render(<Section controller={planner()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Plan an editable version' }));
    expect(
      await screen.findByText(
        'The suggestion leaves the track over longer stretches. Check it on the map before you plan with it.'
      )
    ).toBeInTheDocument();
  });

  it('PR1-05A: reports a failed routing and retries it', async () => {
    routing.route.mockResolvedValueOnce(null);
    render(<Section controller={planner()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Plan an editable version' }));
    expect(await screen.findByText('No route was found through the control points.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('button', { name: 'Replace the import' })).toBeInTheDocument();
  });

  it('PR1-05A: discarding returns to the offer', async () => {
    render(<Section controller={planner()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Plan an editable version' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Discard' }));
    expect(screen.getByRole('button', { name: 'Plan an editable version' })).toBeInTheDocument();
  });

  it('PR1-05A: shows nothing to someone who may not add tours', () => {
    const { container } = render(<Section controller={planner({ canEdit: false })} />);
    expect(container).toBeEmptyDOMElement();
  });
});
