import { pluginSuggestResultSchema, type PluginSearchHit } from '@trek/shared'
import { pluginSearchApi } from '../api/pluginSearch'
import { isEffectivelyOffline } from '../sync/networkMode'

/**
 * A plugin's row in the typed-ahead list. It carries the whole place, because a
 * plugin id means nothing to the details lookup a core row goes through on a pick:
 * the row already knows everything its plugin said about the place.
 */
export interface PluginPlaceSuggestion {
  placeId: string
  mainText: string
  secondaryText: string
  source: string
  lat: number
  lng: number
  place: PluginSearchHit
}

/**
 * How long the typed-ahead list waits for the plugin rows, in milliseconds.
 *
 * The host gives a provider 800 ms and this adds the round trip. It is a deadline on
 * the wait, kept here rather than as the request's timeout: a request that fails
 * without an answer goes through the api client's connectivity probe before it
 * rejects, and the core suggestions must not wait on that too.
 */
export const PLUGIN_SUGGEST_DEADLINE_MS = 1000

function withinDeadline<T>(work: Promise<T>, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const late = new Promise<T>(resolve => { timer = setTimeout(() => resolve(fallback), PLUGIN_SUGGEST_DEADLINE_MS) })
  return Promise.race([work, late]).finally(() => clearTimeout(timer))
}

/**
 * Plugin rows for the place search's typed-ahead list (#2221).
 *
 * Online only and never kept, like every plugin answer. Anything that goes wrong is
 * an empty list: offline, past the deadline, the next keystroke aborting this one, or
 * an answer the shared contract refuses. These rows sit under the core suggestions,
 * and the core list must not fail because an optional index did.
 */
export const pluginSearchRepo = {
  async suggest(
    query: string,
    lang: string,
    near: { lat: number; lng: number } | undefined,
    signal: AbortSignal,
  ): Promise<PluginPlaceSuggestion[]> {
    if (isEffectivelyOffline()) return []
    try {
      const answer = await withinDeadline(pluginSearchApi.suggest(query, lang, near, signal), null)
      if (!answer) return []
      const { places } = pluginSuggestResultSchema.parse(answer)
      return places.map(hit => ({
        placeId: hit.osm_id,
        mainText: hit.name,
        secondaryText: hit.address,
        source: hit.source,
        lat: hit.lat,
        lng: hit.lng,
        place: hit,
      }))
    } catch {
      return []
    }
  },
}
