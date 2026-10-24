import type { HikingPreferences } from './tours.schema';

/**
 * Defensive fallback only. Normal planner calls pass the persisted/draft value.
 * TREK exposes 1..6 and never exposes Valhalla's internal 0.
 */
export const TOURS_MAX_HIKING_DIFFICULTY = 2;

/**
 * What a hike asks Valhalla's pedestrian costing for: its hiking limit, and
 * the weightings its preferences switch on. The planner in the browser and
 * the server's hike routing both build it here, so a hike is weighed alike
 * wherever it is planned.
 */
export type HikingCosting = Record<string, number> & { max_hiking_difficulty: number };

/**
 * MF-08, RTE-01: a hike's preferences as Valhalla's pedestrian costing
 * options. Each one was checked against the public instance before it was
 * offered, and is a weighting that gives way where there is no other path:
 * - avoid_climbs, `use_hills` 0.2: Freiburg Martinstor to the Schlossberg went
 *   from 1.64 km with a 37 % pitch and 30 m over 25 % to 1.73 km whose steepest
 *   stretch is 23 % (heights every 30 m). It weighs the grade, not the climb in
 *   sum: the same height is still gained. 0.1 and below sent Garmisch station
 *   to the Eckbauer round a 10 km detour with more steep metres, 0.25 and up
 *   left Freiburg as it was; 0.2 does neither.
 * - avoid_steps, `step_penalty` 600 s: Würzburg Altstadt to the Festung went
 *   from four flights of steps over 1.49 km to one over 2.67 km.
 * - avoid_ferries, `use_ferry` 0: Kiel Reventlou to Dietrichsdorf went from the
 *   Förde ferry (2.7 km) round the fjord on land (8.3 km); Hamburg
 *   Landungsbrücken to Steinwerder through the old Elbe tunnel instead of the ferry.
 * The router has no option for marked, paved or rough ways on foot.
 */
export function hikingCostingOptions(preferences: HikingPreferences | null | undefined): Record<string, number> {
  return {
    ...(preferences?.avoid_climbs ? { use_hills: 0.2 } : {}),
    ...(preferences?.avoid_steps ? { step_penalty: 600 } : {}),
    ...(preferences?.avoid_ferries ? { use_ferry: 0 } : {}),
  };
}

/**
 * Everything a hike asks the pedestrian costing for: its limit and its
 * preferences. One reading for the whole tour and for the ways offered for one
 * of its sections (RTE-02), so both are weighed by the same rules.
 */
export function hikingCosting(
  maxHikingDifficulty: number = TOURS_MAX_HIKING_DIFFICULTY,
  preferences: HikingPreferences | null = null,
): HikingCosting {
  return { max_hiking_difficulty: maxHikingDifficulty, ...hikingCostingOptions(preferences) };
}
