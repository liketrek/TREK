import {
  MAX_SKI_ROUTE_LEGS,
  type SkiColourScheme,
  type SkiDiscipline,
  type SkiRouteLeg,
  type SkiRouteOptionsInput,
  type SkiRoutePoint,
  type SkiRouteResponse,
  type SkiTechnique,
} from '@trek/shared';
import { skiRouteApi } from '../api/skiRoute';
import { isEffectivelyOffline } from '../sync/networkMode';

/** What the legs of a ski tour are planned for: the discipline, a cross-country technique and the options. */
export interface SkiRouteAsk {
  discipline: SkiDiscipline;
  technique: SkiTechnique | null;
  options: SkiRouteOptionsInput;
}

/** A leg the piste router could not be asked for: offline. */
export type SkiLegAnswer = SkiRouteLeg | { status: 'failed'; code: 'offline'; at: null; hint: null; detail: null };

export interface SkiPlanAnswer {
  legs: SkiLegAnswer[];
  build: string | null;
  stale: boolean;
  areaNames: string[];
  colourScheme: SkiColourScheme;
  /** The credit of the piste and terrain data the legs were planned on; null where nothing was asked. */
  attribution: string | null;
}

const OFFLINE: SkiLegAnswer = { status: 'failed', code: 'offline', at: null, hint: null, detail: null };

/** How many planned requests stay remembered, so an undo or a redo plans nothing again. */
const REMEMBERED = 200;
const remembered = new Map<string, SkiPlanAnswer>();

/**
 * Answers that may change by asking again a moment later are not remembered:
 * an area still downloading, a busy or slow router, the piste data out of
 * reach, no connection, or piste routing switched off by the admin.
 */
const PASSING: ReadonlySet<string> = new Set([
  'loading',
  'busy',
  'timeout',
  'places_unavailable',
  'offline',
  'disabled',
]);

function keyOf(
  tripId: number | string,
  legs: ReadonlyArray<{ from: SkiRoutePoint; to: SkiRoutePoint }>,
  ask: SkiRouteAsk
): string {
  const points = legs.map(({ from, to }) => [from.lat, from.lng, to.lat, to.lng].map((v) => v.toFixed(6)).join(','));
  return [tripId, ask.discipline, ask.technique ?? '', JSON.stringify(ask.options), ...points].join('|');
}

function remember(key: string, answer: SkiPlanAnswer): void {
  // A plan on an older kept copy of the piste data is asked again once the current one is in reach.
  if (answer.stale) return;
  if (answer.legs.some((leg) => leg.status === 'failed' && PASSING.has(leg.code))) return;
  remembered.delete(key);
  remembered.set(key, answer);
  if (remembered.size > REMEMBERED) remembered.delete(remembered.keys().next().value as string);
}

function merged(answers: SkiRouteResponse[]): SkiPlanAnswer {
  return {
    legs: answers.flatMap((answer) => answer.legs),
    build: answers.find((answer) => answer.build)?.build ?? null,
    stale: answers.some((answer) => answer.stale),
    areaNames: [...new Set(answers.flatMap((answer) => answer.area_names))],
    colourScheme: answers[0]?.colour_scheme ?? 'europe',
    attribution: answers.find((answer) => answer.attribution)?.attribution ?? null,
  };
}

/**
 * Legs of a ski tour planned on the piste data, online only on purpose: the
 * area graphs live on the server, and no clicked point goes further than it.
 * The legs of a tour go in one request, each going on from the one before; a
 * request asked before comes from memory, so an undo plans nothing again.
 * Offline every leg comes back failed as `offline`, and the planner keeps the
 * stretch visibly unrouted.
 */
export const skiRouteRepo = {
  async plan(
    tripId: number | string,
    legs: ReadonlyArray<{ from: SkiRoutePoint; to: SkiRoutePoint }>,
    ask: SkiRouteAsk,
    signal?: AbortSignal
  ): Promise<SkiPlanAnswer> {
    const key = keyOf(tripId, legs, ask);
    const known = remembered.get(key);
    if (known) return known;
    if (isEffectivelyOffline()) {
      return {
        legs: legs.map(() => OFFLINE),
        build: null,
        stale: false,
        areaNames: [],
        colourScheme: 'europe',
        attribution: null,
      };
    }
    const batches: Array<Array<{ from: SkiRoutePoint; to: SkiRoutePoint }>> = [];
    for (let start = 0; start < legs.length; start += MAX_SKI_ROUTE_LEGS) {
      batches.push(legs.slice(start, start + MAX_SKI_ROUTE_LEGS));
    }
    const answers = await Promise.all(
      batches.map((batch) =>
        skiRouteApi.plan(
          tripId,
          { legs: batch, discipline: ask.discipline, technique: ask.technique, options: ask.options },
          signal
        )
      )
    );
    const answer = merged(answers);
    remember(key, answer);
    return answer;
  },
};
