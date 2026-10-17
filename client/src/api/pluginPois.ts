import { pluginPoiResponseSchema, type PluginPoiResponse } from '@trek/shared'
import { apiClient, parseInDev } from './client'

/** The map area a plugin POI search covers, as the explore pill reports it. */
export interface PluginPoiArea {
  south: number
  west: number
  north: number
  east: number
}

/**
 * The same ceiling as the core categories' GET /api/maps/pois. The server gives the
 * plugin 8 seconds and answers 502 after that, so this only ever cuts off a request
 * that got lost on the way.
 */
export const PLUGIN_POI_TIMEOUT_MS = 20_000

/**
 * GET /api/plugin-pois (#1781): the places of one plugin POI category inside a map
 * area. In a file of its own rather than in the `client.ts` god module, typed from the
 * shared contract. The explore pill reaches it through repo/pluginPoiRepo.ts, which
 * adds the offline guard and the strict check.
 */
export const pluginPoisApi = {
  search: (
    pluginId: string,
    category: string,
    bbox: PluginPoiArea,
    lang: string | undefined,
    signal?: AbortSignal,
  ): Promise<PluginPoiResponse> =>
    apiClient
      .get('/plugin-pois', { params: { pluginId, category, ...bbox, lang }, signal, timeout: PLUGIN_POI_TIMEOUT_MS })
      .then(r => parseInDev(pluginPoiResponseSchema, r.data, 'pluginPois.search')),
}
