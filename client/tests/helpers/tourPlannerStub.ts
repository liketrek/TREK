import { vi } from 'vitest';

/**
 * What a stubbed tour planner needs beyond the fields a test sets: a hike, no
 * boat, no loop and the route tools as spies. Spread first, so a test's own
 * fields win.
 */
export function hikePlannerDefaults() {
  return {
    tourType: 'hike' as const,
    setTourType: vi.fn(),
    isPaddle: false,
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
    setWaypointShaping: vi.fn(),
    recomputeLeg: vi.fn(),
    routeDrawnLegsOnWater: vi.fn(),
    paddleRoute: null,
    routeCurrent: false,
    routeParts: null,
    mapOverlays: new Set<string>(),
    toggleMapOverlay: vi.fn(),
  };
}
