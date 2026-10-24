import { readEnv } from '../../app-config';
import {
  trekPlacesHeldBack,
  trekPlacesWinterArea,
  trekPlacesWinterIndex,
  trekPlacesWinterMeta,
  type TrekPlacesWinterBody,
  type TrekPlacesWinterIndex,
} from './trek-places.client';
import { Injectable } from '@nestjs/common';
import type { WinterMeta } from '@trek/shared';

/**
 * The winter layer of the TREK Places host (`/v1/winter/*`) as a provider:
 * which build it serves, its index of ski areas, and one area's graph. Every
 * request goes through the same client as the place search, so the operator's
 * opt-out, the size caps, the timeouts and the circuit breaker hold for it
 * too. No request carries a coordinate. It holds no state of its own, so
 * the piste router's module provides it without importing the maps module.
 */
@Injectable()
export class TrekPlacesWinterService {
  /** Whether the operator lets anything go to TREK Places at all. */
  enabled(): boolean {
    return readEnv().maps.trekPlacesEnabled;
  }

  /** Whether the circuit breaker holds requests back after the host failed several times. */
  heldBack(): boolean {
    return trekPlacesHeldBack();
  }

  meta(): Promise<WinterMeta> {
    return trekPlacesWinterMeta();
  }

  index(etag: string | null): Promise<TrekPlacesWinterIndex> {
    return trekPlacesWinterIndex(etag);
  }

  area(id: string, etag: string | null): Promise<TrekPlacesWinterBody> {
    return trekPlacesWinterArea(id, etag);
  }
}
