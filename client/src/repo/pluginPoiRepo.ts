import { pluginPoiResponseSchema, type PluginPoi } from '@trek/shared'
import { pluginPoisApi, type PluginPoiArea } from '../api/pluginPois'
import type { Poi } from '../components/Map/poiCategories'
import { isEffectivelyOffline } from '../sync/networkMode'

// The contract row as the map's Poi. The nullable fields are spelled out because the
// client compiles without strict mode, where zod types them as optional.
function toPoi(row: PluginPoi): Poi {
  return { ...row, address: row.address ?? null, website: row.website ?? null, phone: row.phone ?? null }
}

/**
 * The places of a plugin POI category (#1781) for the explore pill.
 *
 * Online only, like the core categories: the answer comes from the plugin, live, and
 * is never kept. Offline the request is not made at all and the chip shows its error
 * dot instead. The answer is checked strictly on top of the api module's development
 * warning, because a plugin POI's colour and icon go on to be drawn into marker
 * markup, and only a row the shared contract accepts may get that far.
 */
export const pluginPoiRepo = {
  async search(pluginId: string, categoryId: string, bbox: PluginPoiArea, lang: string, signal: AbortSignal) {
    if (isEffectivelyOffline()) throw new Error('Plugin POI search requires a connection')
    const reply = pluginPoiResponseSchema.parse(await pluginPoisApi.search(pluginId, categoryId, bbox, lang, signal))
    return { ...reply, pois: reply.pois.map(toPoi) }
  },
}
