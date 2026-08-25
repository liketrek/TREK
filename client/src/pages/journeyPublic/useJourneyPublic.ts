import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useParams } from 'react-router'
import { journeyApi } from '../../api/client'
import { useSettingsStore } from '../../store/settingsStore'
import type { JourneyMapHandle } from '../../components/Journey/JourneyMap'
import { useIsMobile } from '../../hooks/useIsMobile'
import { DAY_COLORS } from '../../components/Journey/dayColors'
import { groupByDate, type PublicEntry, type PublicGalleryPhoto } from './journeyPublicModel'

/**
 * Public-journey (read-only share) data hook — owns the token fetch, the
 * loading/error state, the view state (timeline/gallery/map, lightbox, language
 * picker, active + viewing entry) and all the timeline/map derivations.
 * JourneyPublicPage stays a wiring container: it keeps the presentational
 * helpers (photoUrl, formatDate, mood/weather config) and the render functions
 * next to the JSX, and computes the t()-dependent `availableViews` itself.
 * Behaviour is identical to the previous in-component logic.
 */
export function useJourneyPublic() {
  const { token } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const isMobile = useIsMobile()
  const [view, setView] = useState<'timeline' | 'gallery' | 'map'>('timeline')
  const [lightbox, setLightbox] = useState<{ photos: { id: string; src: string; caption?: string | null; mediaType?: string | null }[]; index: number } | null>(null)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const locale = useSettingsStore(s => s.settings.language) || 'en'
  const mapRef = useRef<JourneyMapHandle>(null)
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)
  const [viewingEntry, setViewingEntry] = useState<PublicEntry | null>(null)

  const handleMarkerClick = useCallback((entryId: string) => {
    setActiveEntryId(entryId)
    mapRef.current?.highlightMarker(entryId)
    document.querySelector(`[data-entry-id="${entryId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  useEffect(() => {
    if (!token) return
    journeyApi.getPublicJourney(token)
      .then(d => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [token])

  const entries = (data?.entries || []) as PublicEntry[]
  const gallery = (data?.gallery || []) as PublicGalleryPhoto[]
  const perms = data?.permissions || {}
  const journey = data?.journey || {}
  const stats = data?.stats || {}

  const timelineEntries = useMemo(() => entries, [entries])
  const groupedEntries = useMemo(() => groupByDate(timelineEntries), [timelineEntries])
  // Chronological throughout: this is what the day colours and the stop numbers are
  // derived from, so flipping the reading order must not renumber the trip.
  const sortedDates = useMemo(() => [...groupedEntries.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)), [groupedEntries])
  const mapEntries = useMemo(
    () => timelineEntries.filter(e => e.location_lat && e.location_lng),
    [timelineEntries],
  )
  const allPhotos = gallery

  // Map entries with day color/label for colored markers.
  // dayIdx is derived from sortedDates (ALL timeline dates) so marker colors
  // stay in sync with the timeline day headers even when some days have no locations.
  // The marker number used to be the stop's position *within* its day, while the
  // timeline heading showed the day number — two different numbers in the same
  // colour, and on mobile the heading is not rendered at all, so the key was
  // missing entirely (#1962). It is now the stop's place in the whole journey, so
  // every number appears exactly once and the colour still groups the day.
  const sidebarMapItems = useMemo(() => {
    let stop = 0
    return mapEntries.map(e => {
      const dayIdx = sortedDates.indexOf(e.entry_date)
      const dayLabel = ++stop
      return {
        id: String(e.id),
        lat: e.location_lat!,
        lng: e.location_lng!,
        title: e.title || '',
        mood: e.mood,
        created_at: e.entry_date,
        entry_date: e.entry_date,
        dayColor: DAY_COLORS[dayIdx % DAY_COLORS.length],
        dayLabel,
      }
    })
  }, [mapEntries, sortedDates])

  // The same number the marker carries, so the timeline is the key to the map
  // rather than a second, unrelated numbering.
  const stopNumberById = useMemo(() => {
    const m = new Map<string, number>()
    sidebarMapItems.forEach(i => m.set(i.id, i.dayLabel))
    return m
  }, [sidebarMapItems])

  // Photos that know where they were taken. Only meaningful when the map is shared —
  // the server nulls the coordinates otherwise, so this comes out empty by itself.
  const mapPhotos = useMemo(
    () => gallery
      .filter(p => typeof p.lat === 'number' && typeof p.lng === 'number')
      .map(p => ({ id: String(p.id), lat: p.lat!, lng: p.lng!, photoId: p.photo_id })),
    [gallery],
  )

  // A journey shared while the trip is still running reads like a blog, so the owner
  // can publish it newest-first (#1614). The reader may flip it either way; only the
  // display order changes, never the numbering.
  const [newestFirst, setNewestFirst] = useState<boolean | null>(null)
  const effectiveNewestFirst = newestFirst ?? !!perms.newest_first
  const displayDates = useMemo(
    () => (effectiveNewestFirst ? [...sortedDates].reverse() : sortedDates),
    [sortedDates, effectiveNewestFirst],
  )

  // Two-column desktop layout: timeline feed left + sticky map right
  const desktopTwoColumn = !isMobile && perms.share_timeline && perms.share_map

  // Set default view based on permissions
  useEffect(() => {
    if (!perms.share_timeline && perms.share_gallery) setView('gallery')
    else if (!perms.share_timeline && !perms.share_gallery && perms.share_map) setView('map')
  }, [perms])

  // When switching to desktop two-column, 'map' standalone tab no longer exists
  useEffect(() => {
    if (desktopTwoColumn && view === 'map') setView('timeline')
  }, [desktopTwoColumn, view])

  return {
    token, data, loading, error, isMobile, locale,
    view, setView, lightbox, setLightbox, showLangPicker, setShowLangPicker,
    mapRef, activeEntryId, setActiveEntryId, viewingEntry, setViewingEntry, handleMarkerClick,
    perms, journey, stats,
    timelineEntries, groupedEntries, sortedDates, displayDates, sidebarMapItems, allPhotos, stopNumberById, mapPhotos,
    newestFirst: effectiveNewestFirst, setNewestFirst,
    desktopTwoColumn,
  }
}
