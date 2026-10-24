import { pluginSuggestResultSchema, type PluginSuggestResult } from '@trek/shared'
import { apiClient, parseInDev } from './client'

/**
 * GET /api/plugin-search/suggest (#2221): what the plugins that answer as you type
 * found for the query so far. The place search reaches it through
 * repo/pluginSearchRepo.ts, which adds the offline guard and the strict check.
 */
export const pluginSearchApi = {
  suggest: (
    query: string,
    lang: string,
    near: { lat: number; lng: number } | undefined,
    signal: AbortSignal,
  ): Promise<PluginSuggestResult> =>
    apiClient
      .get('/plugin-search/suggest', { params: { q: query, lang, lat: near?.lat, lng: near?.lng }, signal })
      .then(r => parseInDev(pluginSuggestResultSchema, r.data, 'pluginSearch.suggest')),
}
