import { useState, useRef, useCallback, useMemo } from 'react'
import { mapsApi } from '../../api/client'
import type { Poi } from './poiCategories'

export interface Bbox { south: number; west: number; north: number; east: number }

/**
 * State for the map POI "explore" pill. Toggling a category fetches its OSM POIs
 * for the current viewport; panning/zooming does NOT auto-refetch — it just marks
 * the results stale (`moved`) so the pill can offer "search this area". This keeps
 * Overpass load (and visual churn) down.
 */
export function usePoiExplore() {
  const [active, setActive] = useState<Set<string>>(() => new Set())
  const [byCat, setByCat] = useState<Record<string, Poi[]>>({})
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(() => new Set())
  const [moved, setMoved] = useState(false)

  const bboxRef = useRef<Bbox | null>(null)
  // activeRef always mirrors the latest active set so async callbacks (fetch
  // completions) can check whether a category is still wanted.
  const activeRef = useRef(active)
  activeRef.current = active

  const setLoading = useCallback((key: string, on: boolean) => setLoadingKeys(prev => {
    const next = new Set(prev)
    if (on) next.add(key); else next.delete(key)
    return next
  }), [])

  const fetchCat = useCallback(async (key: string, bbox: Bbox) => {
    setLoading(key, true)
    try {
      const res = await mapsApi.pois(key, bbox)
      // Drop the result if the user toggled this category off while the (slow)
      // Overpass request was in flight — otherwise stale results re-appear.
      setByCat(prev => (activeRef.current.has(key) ? { ...prev, [key]: res.pois } : prev))
    } catch {
      setByCat(prev => (activeRef.current.has(key) ? { ...prev, [key]: [] } : prev))
    } finally {
      setLoading(key, false)
    }
  }, [setLoading])

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

  return { active, pois, loadingKeys, moved, toggle, searchArea, onViewportChange }
}
