import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
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
  const [lightbox, setLightbox] = useState<{ photos: { id: string; src: string; caption?: string | null }[]; index: number } | null>(null)
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
  const sortedDates = useMemo(() => [...groupedEntries.keys()].sort(), [groupedEntries])
  const mapEntries = useMemo(
    () => timelineEntries.filter(e => e.location_lat && e.location_lng),
    [timelineEntries],
  )
  const allPhotos = gallery

  // Map entries with day color/label for colored markers.
  // dayIdx is derived from sortedDates (ALL timeline dates) so marker colors
  // stay in sync with the timeline day headers even when some days have no locations.
  const sidebarMapItems = useMemo(() => {
    const counters = new Map<string, number>()
    return mapEntries.map(e => {
      const dayIdx = sortedDates.indexOf(e.entry_date)
      const dayLabel = (counters.get(e.entry_date) ?? 0) + 1
      counters.set(e.entry_date, dayLabel)
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
    timelineEntries, groupedEntries, sortedDates, sidebarMapItems, allPhotos,
    desktopTwoColumn,
  }
}
