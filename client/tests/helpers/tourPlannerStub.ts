import { vi } from 'vitest';

/**
 * What a stubbed tour planner needs beyond the fields a test sets: a hike, no
 * boat, no loop and the route tools as spies. Spread first, so a test's own
 * fields win.
 */
export function hikePlannerDefaults() {
  return {
    tourType: 'hike' as const,
    alpineAcknowledged: false,
    acknowledgeAlpine: vi.fn(),
    setTourType: vi.fn(),
    isPaddle: false,
    isBike: false,
    isHorse: false,
    bikeProfile: 'touring' as const,
    setBikeProfile: vi.fn(),
    // SKI-02: no ski tour, so no discipline chosen nor asked for.
    isSki: false,
    ski: { choice: { discipline: null, technique: null }, change: vi.fn(), setOption: vi.fn(), load: vi.fn() },
    skiRoute: null,
    skiMissing: null,
    // RUN-01: no run, so no pace asked for.
    isRun: false,
    runProfile: 'running' as const,
    setRunProfile: vi.fn(),
    runPace: { paceSecondsPerKm: null, setPace: vi.fn(), load: vi.fn() },
    runPaceMissing: false,
    runPaceInvalid: false,
    unreachable: null,
    paddle: {
      boatType: null,
      waterContext: null,
      speedKmh: null,
      portageSpeedKmh: null,
      lakeStyle: 'direct' as const,
      recommendedSpeedKmh: null,
      effectiveSpeedKmh: null,
      setBoatType: vi.fn(),
      setWaterContext: vi.fn(),
      setSpeedKmh: vi.fn(),
      setPortageSpeedKmh: vi.fn(),
      setLakeStyle: vi.fn(),
      adoptRecommendedSpeed: vi.fn(),
      load: vi.fn(),
    },
    paddleSpeedInvalid: false,
    paddleIncomplete: false,
    paddleEstimate: null,
    editPaddlePoints: vi.fn(),
    amendWaypoints: vi.fn(),
    isLoop: false,
    reverse: vi.fn(),
    returnToStart: vi.fn(),
    toggleWaypointFreeLeg: vi.fn(),
    insertShapingPoint: vi.fn(() => null),
    insertShapingPoints: vi.fn(() => null),
    setWaypointShaping: vi.fn(),
    recomputeLeg: vi.fn(),
    routeDrawnLegsOnWater: vi.fn(),
    legVariants: idleLegVariants(),
    roundHikes: idleRoundHikes(),
    paddleRoute: null,
    routeCurrent: false,
    routeParts: null,
    mapOverlays: new Set<string>(),
    mapOverlaysOff: new Set<string>(),
    toggleMapOverlay: vi.fn(),
    tripId: 1,
    editWaypoints: vi.fn(),
    // CW-07: a draft planned in TREK, not read from a Google Maps walk.
    draftSource: null,
    // MDT-01: a day tour, no stage set and none that may be.
    stages: {
      multiDay: false,
      stages: [],
      endCount: 0,
      lost: 0,
      setMultiDay: vi.fn(),
      toggleStageEnd: vi.fn(),
      canEnd: vi.fn(() => false),
    },
    // CW-12: a walk with no crossing by boat and no leg it cannot join.
    walkFerries: {
      crossings: [],
      pending: [],
      blocksSave: false,
      gap: null,
      acceptable: vi.fn(() => true),
      accept: vi.fn(),
      release: vi.fn(),
      show: vi.fn(),
    },
    // P2C-03: a tour opened at its first revision, with nothing known about others.
    revision: {
      base: null,
      baseRef: { current: null },
      conflict: null,
      remote: null,
      adopt: vi.fn(),
      notice: vi.fn(() => false),
      refuse: vi.fn(() => false),
      takeOver: vi.fn(),
      dismissConflict: vi.fn(),
      dismissRemote: vi.fn(),
    },
  };
}

/** RTE-02: a planner comparing no section, with its actions as spies. */
export function idleLegVariants() {
  return {
    comparison: null,
    focus: null,
    canCompare: vi.fn(() => false),
    compare: vi.fn(),
    select: vi.fn(),
    hover: vi.fn(),
    apply: vi.fn(),
    close: vi.fn(),
    appliedHint: { shown: false, key: null, undo: vi.fn(), hold: vi.fn() },
  };
}

/** RTE-03: a planner offering no round hike, with its actions as spies. */
export function idleRoundHikes() {
  return {
    view: null,
    focus: null,
    frame: null,
    canStart: vi.fn(() => false),
    open: vi.fn(),
    find: vi.fn(),
    back: vi.fn(),
    select: vi.fn(),
    hover: vi.fn(),
    apply: vi.fn(),
    confirm: vi.fn(),
    cancelConfirm: vi.fn(),
    close: vi.fn(),
    appliedHint: { shown: false, key: null, undo: vi.fn(), hold: vi.fn() },
  };
}
