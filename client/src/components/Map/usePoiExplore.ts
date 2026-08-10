import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { mapsApi, pluginsApi, type PluginPoiCategory, type PluginPoiProviderResult } from '../../api/client'
import { useTranslation } from '../../i18n'
import { POI_CATEGORIES, type Poi, type PoiCategory } from './poiCategories'

export interface Bbox { south: number; west: number; north: number; east: number }

interface PluginPoiCategoryMeta {
  key: string
  pluginId: string
  categoryId: string
  label: string
  iconName: string | null
  color: string
}

// A request we cancelled on purpose (newer search superseded it) — not a failure.
function isAbortError(err: unknown): boolean {
  const e = err as { name?: string; code?: string } | null
  return e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED' || e?.name === 'AbortError'
}

/**
 * State for the map POI "explore" pill. Toggling a category fetches its OSM POIs
 * for the current viewport; panning/zooming does NOT auto-refetch — it just marks
 * the results stale (`moved`) so the pill can offer "search this area". This keeps
 * Overpass load (and visual churn) down.
 */
export function usePoiExplore() {
  const { locale } = useTranslation()
  const [categories, setCategories] = useState<PoiCategory[]>(POI_CATEGORIES)
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
  const pluginCategoriesRef = useRef<Record<string, PluginPoiCategoryMeta>>({})

  const loadPluginCategories = useCallback(async () => {
    try {
      const res = await pluginsApi.poiCategories({ limit: 1 })
      const seen = new Set<string>()
      const pluginCats: PoiCategory[] = []
      const meta: Record<string, PluginPoiCategoryMeta> = {}
      for (const provider of res.providers) {
        for (const cat of provider.categories) {
          const key = `${provider.pluginId}:${cat.id}`
          if (seen.has(key)) continue
          seen.add(key)
          meta[key] = {
            key,
            pluginId: provider.pluginId,
            categoryId: cat.id,
            label: cat.name,
            iconName: cat.icon ?? 'MapPin',
            color: cat.color ?? '#6b7280',
          }
          pluginCats.push({
            key,
            label: cat.name,
            iconName: cat.icon ?? 'MapPin',
            color: cat.color ?? '#6b7280',
          })
        }
      }
      pluginCategoriesRef.current = meta
      setCategories([...POI_CATEGORIES, ...pluginCats])
    } catch {
      pluginCategoriesRef.current = {}
      setCategories(POI_CATEGORIES)
    }
  }, [])

  useEffect(() => { void loadPluginCategories() }, [loadPluginCategories])

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

  const mapPluginPoi = useCallback((provider: PluginPoiProviderResult | undefined, meta: PluginPoiCategoryMeta): Poi[] => {
    if (!provider) return []
    return provider.results
      .filter(r => r.categoryId === meta.categoryId)
      .map((r) => {
        const cat: PluginPoiCategory | undefined = provider.categories.find(c => c.id === meta.categoryId)
        return {
          osm_id: `plugin:${meta.pluginId}:${r.id}`,
          name: r.name,
          lat: r.lat,
          lng: r.lng,
          category: meta.key,
          poi_type: r.icon || meta.categoryId,
          address: r.address ?? null,
          website: r.url ?? null,
          phone: null,
          opening_hours: null,
          cuisine: null,
          source: 'plugin',
          description: r.description ?? null,
          category_label: meta.label,
          category_icon: r.icon ?? cat?.icon ?? meta.iconName,
          category_color: cat?.color ?? meta.color,
        } satisfies Poi
      })
  }, [])

  const fetchCat = useCallback(async (key: string, bbox: Bbox) => {
    abortRef.current[key]?.abort()
    const ctrl = new AbortController()
    abortRef.current[key] = ctrl
    setLoading(key, true)
    setError(key, false)
    try {
      const pluginMeta = pluginCategoriesRef.current[key]
      const res = pluginMeta
        ? await pluginsApi.poiCategories({ bbox, limit: 100 }, { signal: ctrl.signal })
        : await mapsApi.pois(key, bbox, locale, ctrl.signal)
      // Drop the result if the user toggled this category off while the (slow)
      // Overpass request was in flight — otherwise stale results re-appear.
      const pois = pluginMeta
        ? mapPluginPoi(res.providers.find(p => p.pluginId === pluginMeta.pluginId), pluginMeta)
        : res.pois
      setByCat(prev => (activeRef.current.has(key) ? { ...prev, [key]: pois } : prev))
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
  }, [setLoading, setError, locale, mapPluginPoi])

  const onViewportChange = useCallback((bbox: Bbox) => {
    bboxRef.current = bbox
    if (activeRef.current.size > 0) setMoved(true)
  }, [])

  // Single-select: clicking a category switches to it (dropping the previous one
  // and its markers immediately) and fetches it for the current viewport; clicking
  // the already-active category turns it off.
  const toggle = useCallback((key: string) => {
    const isOnlyActive = activeRef.current.has(key) && activeRef.current.size === 1
    setMoved(false)
    setErrorKeys(new Set())
    // Switching to another category (or turning off) — cancel any in-flight
    // fetches so their results can't land after the selection changed.
    Object.values(abortRef.current).forEach(c => c.abort())
    abortRef.current = {}
    if (isOnlyActive) {
      setActive(new Set())
      setByCat({})
      return
    }
    setActive(new Set([key]))
    setByCat({})
    if (bboxRef.current) fetchCat(key, bboxRef.current)
  }, [fetchCat])

  const searchArea = useCallback(() => {
    const bbox = bboxRef.current
    if (!bbox) return
    setMoved(false)
    activeRef.current.forEach(key => fetchCat(key, bbox))
  }, [fetchCat])

  const pois = useMemo(() => Object.values(byCat).flat(), [byCat])

  return { categories, active, pois, loadingKeys, errorKeys, moved, toggle, searchArea, onViewportChange }
}
