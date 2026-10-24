/**
 * Places of some kinds near a line (PLN-02, CW-05), from the TREK index and
 * OpenStreetMap side by side.
 *
 * The kinds the index knows are asked in circles strung along the line, the way
 * the explore pill asks it for a viewport: one small request per kind and
 * circle, each inside the service's limits, a few at a time. An empty
 * circle is an answer, so those kinds never wait on Overpass while the index
 * answers. The kinds it does not know (a viewpoint, a tap, a hut) go to
 * Overpass at the same time, one query near each stretch of the whole line,
 * with a short deadline. A source that fails is logged and its kinds named in
 * `failed`, so the caller can say what could not be searched instead of
 * reporting nothing found. Once every Overpass endpoint failed, the next
 * searches for a few minutes name its kinds at once instead of waiting out the
 * deadline each time, while a stretch still cached keeps its places and one
 * probe in a while asks again; the answer says when asking again makes sense.
 *
 * MapsService.poisAlong delegates here and hands in whether the index is
 * switched on, which is a deployment property it owns.
 */
import { logWarn } from '../audit/audit-log.logger';
import { alongPlan, overpassStretches, type AlongPlan } from './maps-along.helpers';
import {
  indexKnowsCategory,
  indexPoiAnswer,
  indexPoiPlanAround,
  indexRequestsPerKind,
  ownedByAsked,
} from './maps-index.helpers';
import type { OverpassPoi } from './maps.helpers';
import { OsmClient, OverpassCoolingDown } from './providers/osm.client';
import { trekPlacesHighlights, trekPlacesNearby, type TrekHighlight, type TrekHighlights } from './trek-places.client';
import { Injectable } from '@nestjs/common';
import type { LatLng } from '@trek/shared/roadtrip';

/** How many index requests are in flight at once, so one search never floods the service. */
const PARALLEL_INDEX_REQUESTS = 8;

/** The most well known places one circle is asked for: the best known come first, so a few are plenty. */
const HIGHLIGHTS_PER_CIRCLE = 20;

/** How many stretches one source asks Overpass for at once, so the public mirrors are not flooded. */
const PARALLEL_OVERPASS_STRETCHES = 3;

/** What is searched for along which line: the kinds, how far from it, and each kind's budget per source. */
interface PoisAlongQuery {
  categories: string[];
  line: LatLng[];
  corridorM: number;
  lang?: string;
  limit: number;
}

export interface PoisAlongResult {
  pois: OverpassPoi[];
  /** The kinds no source could be asked for right now: their places are missing, not absent. */
  failed: string[];
  /** Some circles or stretches of the line could not be searched; the places of the others are there. */
  partial: boolean;
  /** A source had more places than it answered with. */
  truncated: boolean;
  /** The line was longer than one search covers; only its first part was searched. */
  capped: boolean;
  /** Seconds until Overpass is asked again, when kinds failed while it holds back; absent otherwise. */
  retryAfterS?: number;
}

/** What one request of a source brings back. */
interface Page {
  pois: OverpassPoi[];
  truncated: boolean;
}

interface Batched extends Page {
  /** How many of the source's requests answered, and how many failed. */
  answered: number;
  missed: number;
  /** Why requests failed, or null when every one answered. */
  error: string | null;
}

interface SourceAnswer extends Batched {
  /** The source was asked along the start of the line only. */
  capped: boolean;
}

const NOTHING: SourceAnswer = { pois: [], truncated: false, answered: 0, missed: 0, error: null, capped: false };

const reason = (err: unknown) => (err instanceof Error ? err.message : String(err));

/** Each place once, as the first circle or source that found it has it: neighbouring circles overlap. */
function oncePerPlace(pois: OverpassPoi[]): OverpassPoi[] {
  const seen = new Map<string, OverpassPoi>();
  for (const poi of pois) if (!seen.has(poi.osm_id)) seen.set(poi.osm_id, poi);
  return [...seen.values()];
}

/**
 * Requests a few at a time, each batch after the last, so no more than a
 * batch is ever in flight; a failed one leaves the others. A stretch refused
 * while Overpass cools down is missed like any other, but makes no error of
 * its own: the client logs the cooldown once, not with every search.
 */
async function inBatches(requests: Array<() => Promise<Page>>, parallel: number): Promise<Batched> {
  const batches = Array.from({ length: Math.ceil(requests.length / parallel) }, (_, index) =>
    requests.slice(index * parallel, (index + 1) * parallel),
  );
  const settled = await batches.reduce<Promise<PromiseSettledResult<Page>[]>>(
    async (done, batch) => [...(await done), ...(await Promise.allSettled(batch.map((ask) => ask())))],
    Promise.resolve([]),
  );
  const pages = settled.flatMap((entry) => (entry.status === 'fulfilled' ? [entry.value] : []));
  const misses = settled.flatMap((entry): unknown[] => (entry.status === 'rejected' ? [entry.reason] : []));
  const reported = misses.filter((miss) => !(miss instanceof OverpassCoolingDown));
  return {
    pois: pages.flatMap((page) => page.pois),
    truncated: pages.some((page) => page.truncated),
    answered: pages.length,
    missed: misses.length,
    error: reported.length ? `${misses.length} of ${settled.length} requests failed: ${reason(reported[0])}` : null,
  };
}

/** A source asked that answered none of its requests: its kinds could not be searched. */
const unanswered = (answer: SourceAnswer) => answer.missed > 0 && answer.answered === 0;

@Injectable()
export class PoisAlongResolver {
  constructor(private readonly osm: OsmClient) {}

  async search(query: PoisAlongQuery, indexEnabled: boolean): Promise<PoisAlongResult> {
    const plan = alongPlan(query.line, query.corridorM);
    const indexed = indexEnabled ? query.categories.filter(indexKnowsCategory) : [];
    const rest = query.categories.filter((key) => !indexed.includes(key));
    // Only an index that answered no circle at all hands its kinds to Overpass,
    // once, while the other kinds are still being asked there rather than after.
    const indexPart = this.askIndex(indexed, plan, query.limit).then(async (index) => ({
      index,
      fallback: indexed.length > 0 && index.answered === 0 ? await this.askOverpass(indexed, query) : NOTHING,
    }));
    const [{ index, fallback }, overpass] = await Promise.all([indexPart, this.askOverpass(rest, query)]);
    if (index.error) logWarn(`[Maps] TREK places index along a line: ${index.error}`);
    for (const answer of [overpass, fallback]) {
      if (answer.error) logWarn(`[Maps] OpenStreetMap along a line: ${answer.error}`);
    }
    const sources = [index, overpass, fallback];
    const failed = [...(unanswered(overpass) ? rest : []), ...(unanswered(fallback) ? indexed : [])];
    const retryAfterMs = failed.length ? this.osm.overpassAlongRetryAfterMs() : 0;
    return {
      pois: oncePerPlace([...index.pois, ...overpass.pois, ...fallback.pois]),
      failed,
      partial: sources.some((answer) => answer.answered > 0 && answer.missed > 0),
      truncated: sources.some((answer) => answer.truncated),
      // A source that answered nothing searched nothing: its kinds are failed or asked of Overpass instead.
      capped: sources.some((answer) => answer.answered > 0 && answer.capped),
      ...(retryAfterMs > 0 ? { retryAfterS: Math.ceil(retryAfterMs / 1000) } : {}),
    };
  }

  /**
   * The best known places near a line, from the index's OpenStreetMap layer in
   * the same circles the kinds are asked in, each place once. Highlights only
   * add to a search: an index switched off, down or without ranks answers
   * none, logged once, and never fails the search they were asked beside.
   */
  async highlights(
    line: LatLng[],
    corridorM: number,
    lang: string | undefined,
    indexEnabled: boolean,
  ): Promise<TrekHighlight[]> {
    if (!indexEnabled) return [];
    const plan = alongPlan(line, corridorM);
    const perCircle = { limit: HIGHLIGHTS_PER_CIRCLE, lang };
    const batches = Array.from({ length: Math.ceil(plan.beads.length / PARALLEL_INDEX_REQUESTS) }, (_, index) =>
      plan.beads.slice(index * PARALLEL_INDEX_REQUESTS, (index + 1) * PARALLEL_INDEX_REQUESTS),
    );
    // A few circles at a time, each batch after the last, as the kinds are asked.
    const settled = await batches.reduce<Promise<PromiseSettledResult<TrekHighlights>[]>>(
      async (done, batch) => [
        ...(await done),
        ...(await Promise.allSettled(
          batch.map((bead) => trekPlacesHighlights(bead.lat, bead.lng, { ...perCircle, radius: bead.radiusM })),
        )),
      ],
      Promise.resolve([]),
    );
    const found = new Map<string, TrekHighlight>();
    const failure = settled.find((entry): entry is PromiseRejectedResult => entry.status === 'rejected');
    for (const entry of settled) {
      if (entry.status === 'fulfilled') {
        for (const row of entry.value.highlights) {
          const key = `${row.osmType}:${row.osmId}`;
          if (!found.has(key)) found.set(key, row);
        }
      }
    }
    if (failure) logWarn(`[Maps] TREK places highlights along a line: ${reason(failure.reason)}`);
    return [...found.values()];
  }

  /** The index kinds in every circle, a few requests at a time; a failed request leaves the others. */
  private async askIndex(kinds: string[], plan: AlongPlan, limit: number): Promise<SourceAnswer> {
    // No kinds make no plan, and so no request.
    const requests = plan.beads.flatMap((bead) => {
      const circle = indexPoiPlanAround(kinds.join(','), bead, bead.radiusM, limit);
      return circle
        ? indexRequestsPerKind(circle).map((request) => async (): Promise<Page> => {
            const found = await trekPlacesNearby(circle.lat, circle.lng, {
              radius: circle.radius,
              limit: request.limit,
              category: request.category,
            });
            // A row goes to the kind that names its path most closely: a water park is no park.
            const own = found.filter((row) => ownedByAsked(row, kinds));
            const answer = indexPoiAnswer(own, circle, found.length >= request.limit);
            return { pois: answer.pois, truncated: answer.truncated };
          })
        : [];
    });
    return { ...(await inBatches(requests, PARALLEL_INDEX_REQUESTS)), capped: plan.capped };
  }

  /**
   * The other kinds near each stretch of the whole line, one Overpass query
   * per stretch; nothing to ask is nothing found. While the client cools down
   * after every Overpass endpoint failed, a stretch it holds no cached answer
   * for is refused at once, so its kinds are unavailable without the wait.
   */
  private async askOverpass(kinds: string[], query: PoisAlongQuery): Promise<SourceAnswer> {
    if (!kinds.length) return NOTHING;
    const along = overpassStretches(query.line);
    const asked = kinds.join(',');
    const requests = along.stretches.map(
      (stretch) => () => this.osm.searchOverpassPoisAlong(asked, stretch, query.corridorM, query.lang, query.limit),
    );
    const answer = await inBatches(requests, PARALLEL_OVERPASS_STRETCHES);
    return { ...answer, error: answer.error && `${kinds.join(', ')}: ${answer.error}`, capped: along.capped };
  }
}
