import type { BikeProfile, RunProfile } from './tours.schema';

/**
 * What a bike tour and a run ask Valhalla for, by their profile: the
 * bicycle costing of a bike tour and the pedestrian costing of a run. The
 * planner in the browser and the server's tour routing both read them here,
 * so a ride or a run is weighed alike wherever it is planned. A hike's own
 * costing is `hikingCosting`.
 */
export type TourCostingOptions = Readonly<Record<string, number | string>>;

/**
 * BIK-01 to BIK-04: what each bike profile asks Valhalla's bicycle costing for.
 * Every one was checked against the public instance with trace_attributes over
 * the routes it gave, before it was offered (shares of the length):
 * - touring, Hybrid with bad surfaces avoided: Garmisch station to the Eckbauer
 *   92 % asphalt and no gravel, where gravel took 18 % gravel on farm tracks.
 * - road, Road at full surface avoidance: Herrsching to Andechs 100 % asphalt
 *   over 6.2 km, where touring took 4.98 km with 7 % dirt and 10 % compacted.
 * - gravel, Cross with surfaces barely avoided: Munich Marienplatz to the
 *   Englischer Garten 39 % compacted paths along the Isar, touring 9 %.
 * - mtb, Mountain with no surface avoidance and roads least wanted: Garmisch
 *   to the Eckbauer 63 % tracks and 38 % gravel.
 * `use_roads` and the bicycle type also set the router's riding speed, so the
 * time it gives is the profile's. None of it says a way is rideable or safe.
 */
export const BIKE_COSTING: Readonly<Record<BikeProfile, TourCostingOptions>> = {
  touring: { bicycle_type: 'Hybrid', use_roads: 0.2, avoid_bad_surfaces: 1 },
  road: { bicycle_type: 'Road', use_roads: 0.5, avoid_bad_surfaces: 1 },
  gravel: { bicycle_type: 'Cross', use_roads: 0.1, avoid_bad_surfaces: 0.25 },
  mtb: { bicycle_type: 'Mountain', use_roads: 0, avoid_bad_surfaces: 0 },
};

/**
 * RUN-01, RUN-02: what each run profile asks Valhalla's pedestrian costing
 * for. A run is run, so a ferry only where no way on land exists
 * (`use_ferry` 0). Checked with trace_attributes against the public instance
 * on 20.10.2026 (shares of the length):
 * - running keeps to runnable, mostly paved ways: farm and forest tracks only
 *   where there is no other way (`use_tracks` 0), and no hiking limit, so the
 *   router keeps to the ways it takes for walking anyway (T1). Berlin S
 *   Grunewald into the forest went from 95 % tracks with 3 % paved to 67 %
 *   smooth paved paths over 3.58 km instead of 3.50 km; Munich Großhesseloher
 *   Brücke to Pullach from 79 % to 88 % smooth asphalt and no track left;
 *   Marienplatz to the Englischer Garten stayed as it was.
 * - trail takes tracks wherever they serve (`use_tracks` 1) and admits
 *   mountain paths up to T2 (`max_hiking_difficulty` 2), never T3 and above.
 *   Above Freiburg Günterstal up to the Schauinsland it went from 82 % roads
 *   and 83 % paved (running) to 78 % forest tracks and 81 % compacted, gravel
 *   and dirt over 9.57 km instead of 10.15 km; Rathen to the Bastei took 28 % of T2
 *   path that running leaves out; Heidelberg's old town, all streets, stayed
 *   as it was. Leaning on footways (`walkway_factor`) was tried and left out:
 *   along the Isar it moved the run onto paved footways, from 33 % to 18 %
 *   unpaved.
 * The router's own time is a walker's and is never used: a run's time is its
 * distance at the runner's pace, whatever the profile. Nothing here says a
 * way can be run.
 */
export const RUN_COSTING: Readonly<Record<RunProfile, TourCostingOptions>> = {
  running: { use_tracks: 0, use_ferry: 0 },
  trail: { use_tracks: 1, use_ferry: 0, max_hiking_difficulty: 2 },
};

/** The bicycle costing of a bike tour of this profile. */
export function bikeCosting(profile: BikeProfile): TourCostingOptions {
  return BIKE_COSTING[profile];
}

/** The pedestrian costing of a run of this profile. */
export function runCosting(profile: RunProfile): TourCostingOptions {
  return RUN_COSTING[profile];
}
