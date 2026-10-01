import { apiClient } from './client'

/** One hit of the full-text search over the bundled wiki (`GET /api/help/search`). */
export interface HelpSearchHit {
  slug: string
  title: string
  section: string
  anchor: string | null
  heading: string | null
  snippet: string
  score: number
}

/**
 * Search the docs. Online-only by nature: the pages live on the server, and a
 * help lookup is never queued for later. Pass a signal so a superseded query
 * can be dropped instead of racing the newer one.
 */
export function searchHelp(query: string, signal?: AbortSignal, limit = 8): Promise<HelpSearchHit[]> {
  return apiClient
    .get<{ hits: HelpSearchHit[] }>('/help/search', { params: { q: query, limit }, signal })
    .then(r => r.data.hits)
}
