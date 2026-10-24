import { logInfo, logWarn } from '../audit/audit-log.logger';
import {
  trekPlacesMiss,
  trekPlacesRoutes,
  trekPlacesWays,
  type TrekPlacesMiss,
  type TrekPlacesRoutes,
  type TrekPlacesRouteType,
  type TrekWaysAnswer,
} from './trek-places.client';
import { Injectable } from '@nestjs/common';

/** What one of the layers answered, or why it gave nothing and the caller has to ask elsewhere. */
type TrekPlacesLayerRead<T> = { ok: true; value: T } | { ok: false; miss: TrekPlacesMiss };

type Layer = 'ways' | 'routes';

const WHY: Record<TrekPlacesMiss, string> = {
  off: 'the TREK Places API is switched off on this instance',
  not_built: 'the service has not built this layer yet',
  failed: 'the service did not answer',
};

/**
 * The TREK Places service's OpenStreetMap layers for the domains that used to
 * ask the public Overpass mirrors themselves: the tags of the ways under a tour
 * (BIK-05, MAP-03, MAP-04, RUN-02) and the horse routes around a map view
 * (HOR-01). A call never throws: it says what the layer answered, or why it
 * did not, and the caller goes on to Overpass.
 *
 * Why a layer is not used is logged once, not on every request: a service that
 * has not built a layer yet answers 404 for weeks, and a map being panned asks
 * every few seconds. The line comes again when the reason changes, and after
 * the layer has answered in between.
 */
@Injectable()
export class TrekPlacesLayersService {
  private readonly told = new Map<Layer, TrekPlacesMiss>();

  /**
   * An answer that stopped part way is still an answer: the caller keeps what
   * came and asks elsewhere for the rest. Why it stopped is said like a miss.
   */
  wayTags(ids: readonly number[]): Promise<TrekPlacesLayerRead<TrekWaysAnswer>> {
    return this.read(
      'ways',
      () => trekPlacesWays(ids),
      (answer) => (answer.complete === false ? { failure: answer.failure } : null),
    );
  }

  routes(
    bbox: { south: number; west: number; north: number; east: number },
    type: TrekPlacesRouteType,
    limits: { relations: number; ways: number },
  ): Promise<TrekPlacesLayerRead<TrekPlacesRoutes>> {
    return this.read('routes', () => trekPlacesRoutes(bbox, type, limits));
  }

  private async read<T>(
    layer: Layer,
    ask: () => Promise<T>,
    shortOf: (value: T) => { failure: unknown } | null = () => null,
  ): Promise<TrekPlacesLayerRead<T>> {
    try {
      const value = await ask();
      const short = shortOf(value);
      if (short) this.tell(layer, trekPlacesMiss(short.failure), short.failure);
      else this.told.delete(layer);
      return { ok: true, value };
    } catch (err: unknown) {
      const miss = trekPlacesMiss(err);
      this.tell(layer, miss, err);
      return { ok: false, miss };
    }
  }

  private tell(layer: Layer, miss: TrekPlacesMiss, err: unknown): void {
    if (this.told.get(layer) === miss) return;
    this.told.set(layer, miss);
    const detail = miss === 'failed' ? ` (${err instanceof Error ? err.message : String(err)})` : '';
    const line = `[TrekPlaces] /v1/${layer}: ${WHY[miss]}${detail}; asking the Overpass mirrors instead`;
    if (miss === 'failed') logWarn(line);
    else logInfo(line);
  }
}
