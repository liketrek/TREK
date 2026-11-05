import type { RouteAvoidClass, RouteEngine } from '../../types';

/** One way of driving a leg, as a router offers it. */
export interface RouteAlternative {
  coordinates: [number, number][];
  distance: number;
  duration: number;
  /** Where this route differs most from the first one — the point that would pin it. */
  divergence: { lat: number; lng: number } | null;
  /** Set when this way exists because a road class was left out of it. */
  avoids?: RouteAvoidClass;
  /**
   * Which engine priced this route. Absent means OSRM, which answers every route of a
   * trip that avoids nothing where Valhalla does not route the days, except the
   * avoidance offer.
   *
   * It exists because the engines do not agree on speed: measured over twelve European
   * legs the per-leg drive times run from 14.7 % under OSRM's to 13.2 % over, and the
   * sign depends on the region: Valhalla is faster on Spanish autovía and slower through
   * a city. So a figure from one of them subtracted from a figure from the other is not a
   * difference in driving time, it is the gap between two speed models, and the reader
   * has no way of telling the two apart.
   */
  engine?: RouteEngine;
  /** Whether the way crosses by ferry, where the engine that drew it says so. */
  hasFerry?: boolean;
}

/** What two routes are compared by: their line, and their figures where there is none. */
export type RoadLine = Pick<RouteAlternative, 'coordinates' | 'distance' | 'duration'>;
