import { DomainError } from '../common/domain-error';
import { TrekPlacesLayersService } from '../maps/trek-places-layers.service';
import { OverpassElementsClient } from '../overpass/overpass-elements.service';
import {
  buildHorseRoutesQuery,
  HORSE_ROUTE_WAYS_CAP,
  horseRouteBboxKey,
  snapHorseRouteBbox,
  toHorseRoutes,
} from './tour-horse-routes.helpers';
import { Injectable } from '@nestjs/common';
import {
  HORSE_ROUTES_ATTRIBUTION,
  HORSE_ROUTES_RESULT_CAP,
  HORSE_ROUTES_UNAVAILABLE_CODE,
  type FerrataBbox,
  type HorseRoutesResponse,
} from '@trek/shared';

/** How long an answer is kept: signposted routes change on the scale of seasons, and the sources are shared. */
export const HORSE_ROUTES_KEPT_MS = 12 * 60 * 60 * 1000;

/** The most answers kept at once; the one kept longest goes first. */
export const HORSE_ROUTES_KEPT_MAX = 64;

/**
 * The most section points kept across all answers. One dense view can carry
 * hundreds of thousands, and a point held as a JS tuple costs some sixty bytes,
 * so this keeps the whole store near thirty megabytes however the map is panned.
 */
export const HORSE_ROUTES_KEPT_POINTS_MAX = 500_000;

export const HORSE_ROUTES_UNAVAILABLE_MESSAGE = 'Horse route data is unavailable right now';

type Answer = Omit<HorseRoutesResponse, 'source' | 'attribution'>;

/**
 * HOR-01: the signposted horse routes around a map view, from OpenStreetMap:
 * the TREK Places routes layer first, and the operator's Overpass mirrors only
 * when that cannot answer (switched off, not built yet, or failing). Both
 * answer in the same element form and are read the same way. The view is
 * grown to the 0.05 degree grid, so nearby views share one answer, and an
 * answer is kept for HORSE_ROUTES_KEPT_MS in memory, within a budget of
 * answers and of section points so a busy map cannot grow the store without
 * end; two requests for the same box at once share one query. Read only:
 * nothing is stored, and nothing about the trip is sent.
 *
 * When neither the layer nor any mirror answers, the client gets a 502
 * `{ error, code }` it can show, and whatever it had loaded before stays as it
 * was.
 */
@Injectable()
export class TourHorseRoutesService {
  private readonly kept = new Map<string, { at: number; answer: Answer; points: number }>();
  /** The section points of every answer in `kept`, against HORSE_ROUTES_KEPT_POINTS_MAX. */
  private keptPoints = 0;
  private readonly pending = new Map<string, Promise<Answer>>();

  constructor(
    private readonly layers: TrekPlacesLayersService,
    private readonly overpass: OverpassElementsClient,
  ) {}

  async list(bbox: FerrataBbox, now: number = Date.now()): Promise<HorseRoutesResponse> {
    const box = snapHorseRouteBbox(bbox);
    const key = horseRouteBboxKey(box);
    const known = this.kept.get(key);
    const answer = known && now - known.at < HORSE_ROUTES_KEPT_MS ? known.answer : await this.fetch(key, box, now);
    return { ...answer, source: 'openstreetmap', attribution: HORSE_ROUTES_ATTRIBUTION };
  }

  /** One query for the box, shared with every request for it until it settles. */
  private fetch(key: string, box: FerrataBbox, now: number): Promise<Answer> {
    const running = this.pending.get(key);
    if (running !== undefined) return running;
    const run = this.query(box).then((answer) => {
      this.keep(key, answer, now);
      return answer;
    });
    this.pending.set(key, run);
    const settle = () => this.pending.delete(key);
    void run.then(settle, settle);
    return run;
  }

  private async query(box: FerrataBbox): Promise<Answer> {
    const layer = await this.layers.routes(box, 'horse', {
      relations: HORSE_ROUTES_RESULT_CAP,
      ways: HORSE_ROUTE_WAYS_CAP,
    });
    if (layer.ok) {
      const read = toHorseRoutes(layer.value.elements);
      // The layer stops at the same caps the Overpass query asks one past, and says so itself.
      return { routes: read.routes, truncated: read.truncated || layer.value.truncated };
    }
    let elements: unknown[];
    try {
      elements = await this.overpass.query(buildHorseRoutesQuery(box), 'HorseRoutes');
    } catch {
      // The client already logged why each mirror failed.
      throw new DomainError(502, HORSE_ROUTES_UNAVAILABLE_MESSAGE, {
        code: HORSE_ROUTES_UNAVAILABLE_CODE,
        details: { code: HORSE_ROUTES_UNAVAILABLE_CODE },
      });
    }
    return toHorseRoutes(elements);
  }

  private keep(key: string, answer: Answer, at: number): void {
    this.drop(key);
    const points = sectionPoints(answer);
    this.kept.set(key, { at, answer, points });
    this.keptPoints += points;
    // A map keeps its insertion order: the first key is the one kept longest.
    // The answer just kept stays even when it alone is past the budget.
    while (
      this.kept.size > 1 &&
      (this.kept.size > HORSE_ROUTES_KEPT_MAX || this.keptPoints > HORSE_ROUTES_KEPT_POINTS_MAX)
    ) {
      this.drop(this.kept.keys().next().value as string);
    }
  }

  private drop(key: string): void {
    const known = this.kept.get(key);
    if (!known) return;
    this.kept.delete(key);
    this.keptPoints -= known.points;
  }
}

function sectionPoints(answer: Answer): number {
  return answer.routes.reduce(
    (sum, route) => sum + route.sections.reduce((inRoute, section) => inRoute + section.geometry.length, 0),
    0,
  );
}
