import { valhallaAlternates, valhallaRun } from '../../Map/valhallaRoute';
import type { RailLegRoute } from '../../Roadtrip/useRoadtripRoutes';
import { OTHER_WAY_KEYS, offeredVariants, withVariantHeights, type ComparedLeg, type LegVariant } from './legVariants';
import { enrichTourElevations } from './tourRouting';

/** What a comparison has found so far: the router's answer and the ways it offered, their heights as they come in. */
export interface OtherWaysAnswer {
  /** `failed`: the router did not answer; `none`: it knows no other way; `choose`: there are ways to choose from. */
  phase: 'failed' | 'none' | 'choose';
  variants: LegVariant[];
}

/**
 * RTE-02: the other ways between the two ends of a hike's section, asked
 * under the hike's own rules, then the heights of each, one after the other
 * (the router allows a question a second). `report` hears every step, so the
 * figures fill in as they arrive; nothing is reported once `signal` aborts.
 */
export async function askOtherWays(
  leg: ComparedLeg,
  current: LegVariant,
  signal: AbortSignal,
  report: (answer: OtherWaysAnswer) => void
): Promise<void> {
  const offers = await valhallaAlternates(leg.from, leg.to, 'walking', [], OTHER_WAY_KEYS.length, signal, leg.costing);
  if (signal.aborted) return;
  if (!offers) {
    report({ phase: 'failed', variants: [current] });
    return;
  }
  let variants = offeredVariants(current, offers);
  const phase = variants.length > 1 ? 'choose' : 'none';
  report({ phase, variants });
  for (const variant of variants) {
    if (variant.heights !== 'pending') continue;
    const heights = await enrichTourElevations(variant.coordinates, signal);
    if (signal.aborted) return;
    variants = variants.map((known) => (known.key === variant.key ? withVariantHeights(known, heights) : known));
    report({ phase, variants });
  }
}

/**
 * The section routed again through `pins` under its own rules, the way the
 * planner will route it once the pins are its shaping points. It is what a
 * choice is checked against before anything is written: a way the router
 * does not keep to with a few pins is no way the tour can hold.
 */
export async function routeSection(
  leg: ComparedLeg,
  pins: ReadonlyArray<{ lat: number; lng: number }>,
  signal: AbortSignal
): Promise<RailLegRoute> {
  const run = await valhallaRun([leg.from, ...pins, leg.to], 'walking', [], signal, leg.costing);
  if (!run) throw new Error('No route found');
  const { coordinates, distance, duration, hasFerry } = run.total;
  return { coordinates, distance, duration, hasFerry };
}
