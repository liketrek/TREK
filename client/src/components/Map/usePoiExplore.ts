import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { parsePluginPoiCategoryKey } from '@trek/shared'
import { mapsApi } from '../../api/client'
import { useTranslation } from '../../i18n'
import { pluginPoiRepo } from '../../repo/pluginPoiRepo'
import { usePluginStore } from '../../store/pluginStore'
import type { Poi } from './poiCategories'
import { findPoiCategory, usePoiCategories } from './usePoiCategories'

export interface Bbox { south: number; west: number; north: number; east: number }

// A request we cancelled on purpose (newer search superseded it) — not a failure.
function isAbortError(err: unknown): boolean {
  const e = err as { name?: string; code?: string } | null
  return e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED' || e?.name === 'AbortError'
}

function isNotFound(err: unknown): boolean {
  return (err as { response?: { status?: number } } | null)?.response?.status === 404
}

/**
 * State for the map POI "explore" pill. Toggling a category fetches its OSM POIs
 * for the current viewport; panning/zooming does NOT auto-refetch — it just marks
 * the results stale (`moved`) so the pill can offer "search this area". This keeps
 * Overpass load (and visual churn) down.
 *
 * A category a plugin added (#1781) is asked of that plugin instead, through the
 * plugin POI repo, with the same single selection, cancelling and retry. It also
 * carries the pill's chips, so the selection and the chips on offer come from the
 * same list.
 */
export function usePoiExplore() {
  const { locale, language } = useTranslation()
  const categories = usePoiCategories()
  const [active, setActive] = useState<Set<string>>(() => new Set())
  const [byCat, setByCat] = useState<Record<string, Poi[]>>({})
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(() => new Set())
  const [moved, setMoved] = useState(false)
  // Categories whose last fetch genuinely failed (all Overpass mirrors down), so
  // the pill can offer a retry instead of looking like "no places here".
  const [errorKeys, setErrorKeys] = useState<Set<string>>(() => new Set())

  const bboxRef = useRef<Bbox | null>(null)
  // activeRef always mirrors the latest active set so async callbacks (fetch
  // completions) can check whether a category is still wanted.
  const activeRef = useRef(active)
  activeRef.current = active
  // One in-flight AbortController per category, so re-toggling / re-searching
  // cancels the previous (possibly slow) Overpass request instead of racing it.
  const abortRef = useRef<Record<string, AbortController>>({})

  const setLoading = useCallback((key: string, on: boolean) => setLoadingKeys(prev => {
    const next = new Set(prev)
    if (on) next.add(key); else next.delete(key)
    return next
  }), [])

  const setError = useCallback((key: string, on: boolean) => setErrorKeys(prev => {
    if (on === prev.has(key)) return prev
    const next = new Set(prev)
    if (on) next.add(key); else next.delete(key)
    return next
  }), [])

  // A plugin key goes to its plugin, a core key to the core search; both answer in the
  // same row shape, so nothing after this line knows which one it was.
  const search = useCallback(async (key: string, bbox: Bbox, signal: AbortSignal): Promise<Poi[]> => {
    const plugin = parsePluginPoiCategoryKey(key)
    if (!plugin) return (await mapsApi.pois(key, bbox, locale, signal)).pois
    try {
      return (await pluginPoiRepo.search(plugin.pluginId, plugin.categoryId, bbox, language, signal)).pois
    } catch (err) {
      // The server no longer answers for this category: the plugin was switched off,
      // uninstalled or lost its grant since the feed was read. Reading the feed again
      // takes the chip away, and the selection with it (the effect below).
      if (isNotFound(err)) void usePluginStore.getState().loadPlugins()
      throw err
    }
  }, [locale, language])

  const fetchCat = useCallback(async (key: string, bbox: Bbox) => {
    abortRef.current[key]?.abort()
    const ctrl = new AbortController()
    abortRef.current[key] = ctrl
    setLoading(key, true)
    setError(key, false)
    try {
      const found = await search(key, bbox, ctrl.signal)
      // Drop the result if the user toggled this category off while the (slow)
      // Overpass request was in flight — otherwise stale results re-appear.
      setByCat(prev => (activeRef.current.has(key) ? { ...prev, [key]: found } : prev))
    } catch (err) {
      // A superseded request was aborted on purpose — leave its state untouched
      // so the newer request owns the spinner and results.
      if (isAbortError(err)) return
      // A real failure (every Overpass mirror down/timed out): surface it instead
      // of a silent empty so the user can retry rather than assume "no places".
      setByCat(prev => (activeRef.current.has(key) ? { ...prev, [key]: [] } : prev))
      if (activeRef.current.has(key)) setError(key, true)
    } finally {
      // Only the latest controller for this key clears the spinner; a superseded
      // one must not, or it would hide the newer request's in-flight state.
      if (abortRef.current[key] === ctrl) {
        setLoading(key, false)
        delete abortRef.current[key]
      } else if (!abortRef.current[key]) {
        // Cancelled with nothing taking over (toggle switched the category, or
        // turned it off) — no later request will clear this key, so do it here
        // instead of leaving the pill spinning forever.
        setLoading(key, false)
      }
    }
  }, [setLoading, setError, search])

  const onViewportChange = useCallback((bbox: Bbox) => {
    bboxRef.current = bbox
    if (activeRef.current.size > 0) setMoved(true)
  }, [])

  // Drops the results and cancels every in-flight fetch, so nothing lands after the
  // selection changed.
  const reset = useCallback(() => {
    setMoved(false)
    setErrorKeys(new Set())
    Object.values(abortRef.current).forEach(c => c.abort())
    abortRef.current = {}
    setByCat({})
  }, [])

  // Single-select: clicking a category switches to it (dropping the previous one
  // and its markers immediately) and fetches it for the current viewport; clicking
  // the already-active category turns it off.
  const toggle = useCallback((key: string) => {
    const isOnlyActive = activeRef.current.has(key) && activeRef.current.size === 1
    reset()
    if (isOnlyActive) {
      setActive(new Set())
      return
    }
    setActive(new Set([key]))
    if (bboxRef.current) fetchCat(key, bboxRef.current)
  }, [fetchCat, reset])

  // A plugin chip that stopped being offered (the plugin was switched off,
  // uninstalled or lost its grant, and the feed was read again) takes its selection
  // and its markers with it, rather than leaving pins on the map for a chip nobody
  // can press any more to hide them.
  useEffect(() => {
    const orphaned = Array.from(active).some(key => parsePluginPoiCategoryKey(key) !== null && !findPoiCategory(categories, key))
    if (!orphaned) return
    reset()
    setActive(new Set())
  }, [active, categories, reset])

  const searchArea = useCallback(() => {
    const bbox = bboxRef.current
    if (!bbox) return
    setMoved(false)
    activeRef.current.forEach(key => fetchCat(key, bbox))
  }, [fetchCat])

  const pois = useMemo(() => Object.values(byCat).flat(), [byCat])

  return { categories, active, pois, loadingKeys, errorKeys, moved, toggle, searchArea, onViewportChange }
}
