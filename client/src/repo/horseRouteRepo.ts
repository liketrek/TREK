import { horseRoutesResponseSchema, type HorseRoutesResponse } from '@trek/shared';
import { horseRoutesApi } from '../api/horseRoutes';
import { requireOnline } from './onlineOnly';

/**
 * HOR-01: the signposted horse routes in a map view, from OpenStreetMap
 * through the server. Online only on purpose: they are live map data asked
 * for by hand, not trip data, and a section the rider takes is kept with the
 * ride itself, so nothing here needs a copy on the device. Offline no request
 * is made at all; every answer is parsed against the shared contract rather
 * than cast, because its names and lines go on to be shown and saved.
 */
export const horseRouteRepo = {
  async list(tripId: number | string, bbox: string, signal: AbortSignal): Promise<HorseRoutesResponse> {
    requireOnline();
    return horseRoutesResponseSchema.parse(await horseRoutesApi.list(tripId, bbox, signal));
  },
};
