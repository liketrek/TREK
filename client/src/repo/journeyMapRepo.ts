import {
  journeyMapLayersResponseSchema,
  journeyPublicMapLayersResponseSchema,
  type JourneyMapLayersResponse,
  type JourneyPublicMapLayersResponse,
} from '@trek/shared';
import { journeyMapApi } from '../api/journeyMap';
import { requireOnline } from './onlineOnly';

/**
 * JRN-04, online only like the journey itself. Answers are parsed against the
 * shared contract, so a server that answered something else fails here and
 * the map says the layer could not be loaded instead of drawing nonsense.
 */
export const journeyMapRepo = {
  async layers(journeyId: number, signal?: AbortSignal): Promise<JourneyMapLayersResponse> {
    requireOnline();
    return journeyMapLayersResponseSchema.parse(await journeyMapApi.layers(journeyId, signal));
  },

  async publicLayers(token: string, signal?: AbortSignal): Promise<JourneyPublicMapLayersResponse> {
    requireOnline();
    return journeyPublicMapLayersResponseSchema.parse(await journeyMapApi.publicLayers(token, signal));
  },
};
