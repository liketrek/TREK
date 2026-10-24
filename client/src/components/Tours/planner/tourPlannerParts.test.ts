import { act, renderHook } from '@testing-library/react';
import { DEFAULT_SKI_ROUTE_OPTIONS } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { draftChoices, draftFromText } from './tourPlannerDraft';
import { openedTourFields, tourPlannerFacts, type TourPlannerFactsInput } from './tourPlannerFacts';
import { usePlannerHistory } from './usePlannerHistory';

const hike = (overrides: Partial<TourPlannerFactsInput> = {}): TourPlannerFactsInput => ({
  tourType: 'hike',
  maxHikingDifficulty: 3,
  hikingPreferences: null,
  bikeProfile: 'touring',
  runProfile: 'running',
  runPaceSecondsPerKm: null,
  website: '',
  plannedDurationMinutes: null,
  breakAdditionalMinutes: null,
  paddle: { boatType: null, waterContext: null, speedKmh: null, portageSpeedKmh: null, lakeStyle: null },
  paddleSpeedInvalid: false,
  paddleEstimate: null,
  routeAnalysis: null,
  durationSeconds: null,
  ...overrides,
});

describe('tourPlannerFacts', () => {
  it('times a bike tour by the router even with its heights in, and saves its profile and nothing of a hike', () => {
    const analysis = { distanceKm: 30, gain: 400, loss: 400 } as TourPlannerFactsInput['routeAnalysis'];
    const facts = tourPlannerFacts(
      hike({
        tourType: 'bike',
        bikeProfile: 'gravel',
        routeAnalysis: analysis,
        durationSeconds: 5_400,
        hikingPreferences: { avoid_steps: true },
      })
    );
    expect(facts.walkingDurationMinutes).toBe(90);
    expect(facts.typeFields).toMatchObject({
      tour_type: 'bike',
      bike_profile: 'gravel',
      max_hiking_difficulty: null,
      hiking_preferences: null,
      boat_type: null,
    });
    expect(tourPlannerFacts(hike()).typeFields).toMatchObject({ bike_profile: null, max_hiking_difficulty: 3 });
  });

  it('times a hike by the router until its heights are in, then by the signposts, breaks on top', () => {
    expect(tourPlannerFacts(hike({ durationSeconds: 3_570 })).walkingDurationMinutes).toBe(60);
    const analysis = { distanceKm: 8, gain: 600, loss: 600 } as TourPlannerFactsInput['routeAnalysis'];
    const facts = tourPlannerFacts(
      hike({ routeAnalysis: analysis, durationSeconds: 3_600, breakAdditionalMinutes: 30 })
    );
    const walking = facts.walkingDurationMinutes ?? 0;
    expect(walking).toBeGreaterThan(60);
    expect(facts.plannedTotalMinutes).toBe(walking + 30);
    expect(facts.savedDurationSeconds).toBe(walking * 60);
    expect(facts.typeFields).toMatchObject({ tour_type: 'hike', max_hiking_difficulty: 3, boat_type: null });
  });

  it('SKI-02: saves a ski tour with its discipline and router time, and asks for a discipline and a technique', () => {
    const analysis = { distanceKm: 8, gain: 600, loss: 600 } as TourPlannerFactsInput['routeAnalysis'];
    const snowshoe = tourPlannerFacts(
      hike({
        tourType: 'ski',
        ski: { discipline: 'snowshoe', technique: 'classic' },
        routeAnalysis: analysis,
        breakAdditionalMinutes: 30,
      })
    );
    expect(snowshoe.typeFields).toMatchObject({
      tour_type: 'ski',
      ski_discipline: 'snowshoe',
      ski_technique: null,
      max_hiking_difficulty: null,
      hiking_preferences: null,
    });
    expect(snowshoe.skiMissing).toBeNull();
    // A ski time is the piste router's, never the signposts' rule: without one, nothing is saved.
    expect(snowshoe.walkingDurationMinutes).toBeNull();
    expect(snowshoe.plannedTotalMinutes).toBeNull();
    expect(snowshoe.savedDurationSeconds).toBeNull();
    expect(snowshoe.typeFields).toMatchObject({
      ski_options: DEFAULT_SKI_ROUTE_OPTIONS,
      ski_route_build: null,
      ski_planned_legs: null,
    });
    const routed = tourPlannerFacts(
      hike({
        tourType: 'ski',
        ski: { discipline: 'alpine', technique: null },
        durationSeconds: 3_600,
        skiRouteBuild: '2026-11-02',
        skiPlannedLegs: [0],
      })
    );
    expect(routed.walkingDurationMinutes).toBe(60);
    expect(routed.savedDurationSeconds).toBe(3_600);
    expect(routed.typeFields).toMatchObject({ ski_route_build: '2026-11-02', ski_planned_legs: [0] });

    expect(tourPlannerFacts(hike({ tourType: 'ski' })).skiMissing).toBe('discipline');
    const crossCountry = hike({ tourType: 'ski', ski: { discipline: 'cross_country', technique: null } });
    expect(tourPlannerFacts(crossCountry).skiMissing).toBe('technique');
    const skating = tourPlannerFacts({ ...crossCountry, ski: { discipline: 'cross_country', technique: 'skating' } });
    expect(skating.typeFields).toMatchObject({ ski_discipline: 'cross_country', ski_technique: 'skating' });
    for (const tourType of ['hike', 'bike', 'walk', 'kayak'] as const) {
      const other = tourPlannerFacts(hike({ tourType, ski: { discipline: 'alpine', technique: null } }));
      expect(other.typeFields).toMatchObject({ ski_discipline: null, ski_technique: null });
      if (tourType !== 'kayak') {
        expect(other.typeFields).toMatchObject({ ski_options: null, ski_route_build: null, ski_planned_legs: null });
      }
      expect(other.skiMissing).toBeNull();
    }
  });

  it('HIK-01 withdrawn: a hike saves no winter label at all', () => {
    expect(tourPlannerFacts(hike()).typeFields).not.toHaveProperty('winter_activity');
  });

  it('RUN-01: times a run as its distance at the pace, nothing else, and saves its profile and pace', () => {
    // 8 km with 600 m up and down at 6:00 min/km: 48 minutes, the climb left out.
    const analysis = { distanceKm: 8, gain: 600, loss: 600 } as TourPlannerFactsInput['routeAnalysis'];
    const facts = tourPlannerFacts(
      hike({ tourType: 'run', runPaceSecondsPerKm: 360, routeAnalysis: analysis, durationSeconds: 7200 })
    );
    expect(facts.walkingDurationMinutes).toBe(48);
    expect(facts.plannedTotalMinutes).toBe(48);
    expect(facts.savedDurationSeconds).toBe(48 * 60);
    expect(facts.runPaceMissing).toBe(false);
    expect(facts.runPaceInvalid).toBe(false);
    expect(facts.typeFields).toMatchObject({
      tour_type: 'run',
      run_profile: 'running',
      run_pace_seconds_per_km: 360,
      max_hiking_difficulty: null,
      hiking_preferences: null,
      ski_discipline: null,
      bike_profile: null,
    });
    const withBreak = hike({
      tourType: 'run',
      runPaceSecondsPerKm: 360,
      routeAnalysis: analysis,
      breakAdditionalMinutes: 12,
    });
    expect(tourPlannerFacts(withBreak).plannedTotalMinutes).toBe(60);
  });

  it('RUN-01: a run without a pace, or with one that is none, has no time and no save, never the router time', () => {
    const analysis = { distanceKm: 8, gain: 0, loss: 0 } as TourPlannerFactsInput['routeAnalysis'];
    const missing = tourPlannerFacts(hike({ tourType: 'run', routeAnalysis: analysis, durationSeconds: 7200 }));
    expect(missing.walkingDurationMinutes).toBeNull();
    expect(missing.savedDurationSeconds).toBeNull();
    expect(missing.runPaceMissing).toBe(true);
    for (const pace of [Number.NaN, 0, -360, 1201]) {
      const facts = tourPlannerFacts(hike({ tourType: 'run', runPaceSecondsPerKm: pace, routeAnalysis: analysis }));
      expect(facts.runPaceInvalid).toBe(true);
      expect(facts.walkingDurationMinutes).toBeNull();
    }
    // Before the route is in, the time waits for it.
    expect(tourPlannerFacts(hike({ tourType: 'run', runPaceSecondsPerKm: 360 })).walkingDurationMinutes).toBeNull();
    // Another type carries neither, and is never held back by a pace.
    const bike = tourPlannerFacts(hike({ tourType: 'bike', runPaceSecondsPerKm: 360 }));
    expect(bike.typeFields).toMatchObject({ run_profile: null, run_pace_seconds_per_km: null });
    expect([bike.runPaceMissing, bike.runPaceInvalid]).toEqual([false, false]);
    const paddle = tourPlannerFacts(hike({ tourType: 'kayak', runPaceSecondsPerKm: 360 }));
    expect(paddle.typeFields).toMatchObject({ run_profile: null, run_pace_seconds_per_km: null });
  });

  it('RUN-01: opens a saved run with its profile and pace, and any tour cached before them with none', () => {
    const run = { name: 'River loop', tour_type: 'run', run_profile: 'running', run_pace_seconds_per_km: 330 };
    expect(openedTourFields(run as Parameters<typeof openedTourFields>[0])).toMatchObject({
      tourType: 'run',
      runProfile: 'running',
      runPaceSecondsPerKm: 330,
    });
    const hikeOpened = openedTourFields({ name: 'Ridge', tour_type: 'hike' } as Parameters<typeof openedTourFields>[0]);
    expect(hikeOpened).toMatchObject({
      runProfile: 'running',
      runPaceSecondsPerKm: null,
      ski: { discipline: null, technique: null },
    });
  });

  it('SKI-02: opens a saved ski tour with its discipline and technique, and any other tour with none chosen', () => {
    const ski = { name: 'Loipe', tour_type: 'ski', ski_discipline: 'cross_country', ski_technique: 'classic' };
    expect(openedTourFields(ski as Parameters<typeof openedTourFields>[0])).toMatchObject({
      tourType: 'ski',
      ski: { discipline: 'cross_country', technique: 'classic' },
    });
    const stray = { name: 'Ridge', tour_type: 'hike', ski_discipline: 'alpine' };
    expect(openedTourFields(stray as Parameters<typeof openedTourFields>[0]).ski).toEqual({
      discipline: null,
      technique: null,
    });
  });

  it('holds the fields to their bounds, and a total that runs past a day without an override', () => {
    const facts = tourPlannerFacts(
      hike({ website: 'http://plain.example', plannedDurationMinutes: 1.5, breakAdditionalMinutes: -1 })
    );
    expect(facts).toMatchObject({ websiteInvalid: true, plannedDurationInvalid: true, breakAdditionalInvalid: true });
    expect(tourPlannerFacts(hike({ durationSeconds: 1_500 * 60 })).plannedTotalInvalid).toBe(true);
    expect(
      tourPlannerFacts(hike({ durationSeconds: 1_500 * 60, plannedDurationMinutes: 600 })).plannedTotalInvalid
    ).toBe(false);
    expect(tourPlannerFacts(hike({ website: 'https://ok.example' })).websiteInvalid).toBe(false);
  });

  it('times a paddle tour on the water and asks for its boat and water', () => {
    const paddle = hike({
      tourType: 'kayak',
      paddle: { boatType: 'canoe', waterContext: null, speedKmh: 5, portageSpeedKmh: 3, lakeStyle: 'shore' },
      paddleEstimate: { waterMinutes: 80, estimateMinutes: 95 },
      durationSeconds: 999,
    });
    const facts = tourPlannerFacts(paddle);
    expect(facts.walkingDurationMinutes).toBe(95);
    expect(facts.paddleIncomplete).toBe(true);
    expect(facts.typeFields).toMatchObject({
      tour_type: 'kayak',
      max_hiking_difficulty: null,
      boat_type: 'canoe',
      paddle_lake_style: 'shore',
    });
    const unknown = tourPlannerFacts({ ...paddle, paddleEstimate: { waterMinutes: null, estimateMinutes: null } });
    expect(unknown.walkingDurationMinutes).toBeNull();
    expect(unknown.savedDurationSeconds).toBeNull();
  });

  it('CW-02: times a city walk by the router on foot, its stays on top in place of breaks, and saves no hiking limit', () => {
    const analysis = { distanceKm: 4, gain: 300, loss: 300 } as TourPlannerFactsInput['routeAnalysis'];
    const walk = hike({
      tourType: 'walk',
      routeAnalysis: analysis,
      durationSeconds: 3_000,
      breakAdditionalMinutes: 40,
      stays: { stayMinutes: 75, unknownStays: 0, stations: 2 },
      hikingPreferences: { avoid_steps: true },
    });
    const facts = tourPlannerFacts(walk);
    expect(facts.walkingDurationMinutes).toBe(50);
    expect(facts.automaticPlannedTotalMinutes).toBe(125);
    expect(facts.plannedTotalMinutes).toBe(125);
    expect(facts.savedDurationSeconds).toBe(3_000);
    expect(facts.typeFields).toMatchObject({
      tour_type: 'walk',
      max_hiking_difficulty: null,
      hiking_preferences: null,
      bike_profile: null,
      boat_type: null,
    });
    expect(facts.stationStays).toMatchObject({
      walkingMinutes: 50,
      stayMinutes: 75,
      totalMinutes: 125,
      partial: false,
    });
    // Stays nobody entered count for nothing; a total typed by hand still wins.
    expect(tourPlannerFacts({ ...walk, stays: null }).automaticPlannedTotalMinutes).toBe(50);
    expect(tourPlannerFacts({ ...walk, plannedDurationMinutes: 180 }).plannedTotalMinutes).toBe(180);
    expect(tourPlannerFacts({ ...walk, stays: null, durationSeconds: null }).automaticPlannedTotalMinutes).toBeNull();
  });

  it('CW-02: a walk whose walking time is not known plans at least the stays entered, as its overview says', () => {
    const walk = hike({
      tourType: 'walk',
      durationSeconds: null,
      stays: { stayMinutes: 120, unknownStays: 1, stations: 3 },
    });
    const facts = tourPlannerFacts(walk);
    expect(facts.walkingDurationMinutes).toBeNull();
    expect(facts.plannedTotalMinutes).toBe(120);
    expect(facts.stationStays).toMatchObject({ walkingMinutes: null, totalMinutes: 120, partial: true });
    expect(facts.plannedTotalInvalid).toBe(false);
    // Stays past the longest plan a tour may have hold the save up as the walking time would.
    expect(
      tourPlannerFacts({ ...walk, stays: { stayMinutes: 1_500, unknownStays: 0, stations: 2 } }).plannedTotalInvalid
    ).toBe(true);
    expect(tourPlannerFacts(hike({ durationSeconds: 600 })).stationStays).toBeNull();
  });

  it('MDT-01: a multi-day tour may take a day a stage on the move, a day tour one day', () => {
    // 30 hours on the move: too long for a day, room enough for two stages.
    const long = hike({ tourType: 'bike', durationSeconds: 30 * 3600 });
    expect(tourPlannerFacts(long).plannedTotalInvalid).toBe(true);
    expect(tourPlannerFacts({ ...long, stageCount: 2 }).plannedTotalInvalid).toBe(false);
    const withBreaks = { ...long, stageCount: 2, breakAdditionalMinutes: 19 * 60 };
    expect(tourPlannerFacts(withBreaks).plannedTotalInvalid).toBe(true);
  });
});

describe('usePlannerHistory', () => {
  it('goes back and forth, forgets the undone on a new step, and keeps at most thirty', () => {
    const { result } = renderHook(() => usePlannerHistory<number>());
    act(() => result.current.record(1));
    act(() => result.current.record(2));
    let step: number | null = null;
    act(() => {
      step = result.current.undo(3);
    });
    expect(step).toBe(2);
    expect(result.current.canRedo).toBe(true);
    act(() => {
      step = result.current.redo(2);
    });
    expect(step).toBe(3);
    act(() => {
      result.current.undo(3);
    });
    act(() => result.current.record(9));
    expect(result.current.canRedo).toBe(false);
    act(() => {
      step = result.current.redo(9);
    });
    expect(step).toBeNull();
    act(() => result.current.clear());
    expect(result.current.canUndo).toBe(false);
    act(() => {
      step = result.current.undo(0);
    });
    expect(step).toBeNull();
    for (let i = 0; i < 40; i++) act(() => result.current.record(i));
    let undone = 0;
    for (let i = 0; i < 40; i++)
      act(() => {
        if (result.current.undo(-1) !== null) undone++;
      });
    expect(undone).toBe(30);
  });

  it('moves its mark on every step taken, undone, redone or cleared, and not on an undo with nothing left', () => {
    const { result } = renderHook(() => usePlannerHistory<number>());
    expect(result.current.mark).toBe(0);
    act(() => result.current.record(1));
    expect(result.current.mark).toBe(1);
    act(() => {
      result.current.undo(2);
    });
    expect(result.current.mark).toBe(2);
    act(() => {
      result.current.undo(1);
    });
    expect(result.current.mark).toBe(2);
    act(() => {
      result.current.redo(1);
    });
    expect(result.current.mark).toBe(3);
    act(() => result.current.clear());
    expect(result.current.mark).toBe(4);
  });
});

describe('draftFromText', () => {
  const text = (value: unknown) => JSON.stringify(value);

  it('gives back a draft that passes the check with its points in order, and nothing for one that does not', () => {
    const draft = {
      version: 9 as const,
      name: 'Ridge',
      waypoints: [
        { id: 'a', lat: 47, lng: 11, role: 'via' as const },
        { id: 'b', lat: 47.1, lng: 11.1, role: 'via' as const },
      ],
      baseRevision: 4,
    };
    const restored = draftFromText(text(draft));
    expect(restored).toMatchObject({ name: 'Ridge', baseRevision: 4 });
    expect(restored?.waypoints.map((point) => [point.id, point.role])).toEqual([
      ['a', 'start'],
      ['b', 'end'],
    ]);
    expect(draftFromText(null)).toBeNull();
    expect(draftFromText(text({ ...draft, baseRevision: 0 }))).toBeNull();
    expect(draftFromText('{not json')).toBeNull();
    expect(draftFromText(text({ ...draft, version: 99 }))).toBeNull();
  });

  it('SKI-02: gives back a draft with its ski choice, and drops one whose discipline it does not know', () => {
    const draft = { version: 11, name: 'Snowy ridge', waypoints: [{ id: 'a', lat: 47, lng: 11, role: 'start' }] };
    const ski = { ...draft, tourType: 'ski', ski: { discipline: 'winter_hike', technique: null } };
    expect(draftFromText(text(ski))).toMatchObject({
      tourType: 'ski',
      ski: { discipline: 'winter_hike', technique: null },
    });
    expect(draftFromText(text({ ...ski, ski: { discipline: 'freeride', technique: null } }))).toBeNull();
    // A draft from before the label went keeps the rest of itself; the winter label is not read.
    expect(draftFromText(text({ ...draft, version: 10, winterActivity: 'snowshoe' }))).toMatchObject({
      name: 'Snowy ridge',
    });
  });

  it('RUN-01: gives back a draft with its run profile and pace, and drops one it cannot read', () => {
    const draft = { version: 10, name: 'River loop', waypoints: [{ id: 'a', lat: 48, lng: 11, role: 'start' }] };
    const run = { ...draft, tourType: 'run', runProfile: 'running', runPaceSecondsPerKm: 345 };
    expect(draftFromText(text(run))).toMatchObject({
      tourType: 'run',
      runProfile: 'running',
      runPaceSecondsPerKm: 345,
    });
    expect(draftFromText(text({ ...draft, runPaceSecondsPerKm: null }))).toMatchObject({ runPaceSecondsPerKm: null });
    expect(draftFromText(text({ ...draft, runProfile: 'sprint' }))).toBeNull();
    expect(draftFromText(text({ ...draft, runPaceSecondsPerKm: -5 }))).toBeNull();
  });

  it('reads the routing choices a draft was planned with, each one it lacks at its default', () => {
    const bare = draftFromText(text({ version: 11, name: 'Bare', waypoints: [] }));
    if (!bare) throw new Error('expected a draft');
    expect(draftChoices(bare)).toEqual({
      difficulty: 2,
      preferences: null,
      bikeProfile: 'touring',
      runProfile: 'running',
    });
    expect(
      draftChoices({
        ...bare,
        maxHikingDifficulty: 5,
        bikeProfile: 'mtb',
        runProfile: 'trail',
        hikingPreferences: null,
      })
    ).toEqual({ difficulty: 5, preferences: null, bikeProfile: 'mtb', runProfile: 'trail' });
  });
});
