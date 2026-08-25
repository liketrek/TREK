import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router'
import { useJourneyStore } from '../../store/journeyStore'
import { useTranslation } from '../../i18n'
import { addListener, removeListener } from '../../api/websocket'
import { journeyApi } from '../../api/client'
import type { JourneyTrack } from '@trek/shared'
import { DAY_COLORS } from '../../components/Journey/dayColors'
import type { JourneyMapAutoHandle as JourneyMapHandle } from '../../components/Journey/JourneyMapAuto'
import { useToast } from '../../components/shared/Toast'
import { useIsMobile } from '../../hooks/useIsMobile'
import { lockBodyScroll } from '../../utils/bodyScrollLock'
import type { JourneyEntry } from '../../store/journeyStore'
import { createDraftJourneyEntry } from './JourneyDetailPage.helpers'

/**
 * Journey detail page logic — owns the journey load + WebSocket live sync, the
 * timeline/gallery view state, the entry editor/viewer/delete/lightbox dialogs,
 * the scroll-synced sticky map (marker click + located-entry tracking) and the
 * map/trip-date derivations. JourneyDetailPage stays a wiring container around
 * its large two-pane JSX and many presentational sub-components.
 * Behaviour is identical to the previous in-component logic.
 */
export function useJourneyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { t, locale } = useTranslation()
  const { current, loading, notFound, loadJourney, updateEntry, deleteEntry, reorderEntries, uploadPhotos, deletePhoto } = useJourneyStore()
  const mapRef = useRef<JourneyMapHandle>(null)
  const fullMapRef = useRef<JourneyMapHandle>(null)
  /** The gallery hands its file picker up here, so the hero button can open it. */
  const galleryUploadRef = useRef<(() => void) | null>(null)
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null)

  const isMobile = useIsMobile()
  // Role-based permissions (server-provided via my_role). Fall back to
  // "owner" when the field isn't present yet (legacy responses) so behavior
  // matches the pre-permissions era.
  const myRole = (current as any)?.my_role ?? 'owner'
  const canEditEntries = myRole === 'owner' || myRole === 'editor'
  const canEditJourney = myRole === 'owner'
  const [view, setView] = useState<'timeline' | 'gallery'>('timeline')
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const [viewingEntry, setViewingEntry] = useState<JourneyEntry | null>(null)
  const [editingEntry, setEditingEntry] = useState<JourneyEntry | null>(null)
  const [lightbox, setLightbox] = useState<{ photos: { id: number; src: string; caption?: string | null; provider?: string; asset_id?: string | null; owner_id?: number | null; mediaType?: string | null }[]; index: number } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<JourneyEntry | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [showAddTrip, setShowAddTrip] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  // The bottom-nav "+" starts a new entry via ?create=entry.
  useEffect(() => {
    if (searchParams.get('create') === 'entry' && current && canEditEntries) {
      setEditingEntry(createDraftJourneyEntry(current.id))
      setSearchParams(p => { p.delete('create'); return p }, { replace: true })
    }
  }, [searchParams, current, canEditEntries])
  const [unlinkTrip, setUnlinkTrip] = useState<{ trip_id: number; title: string } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [hideSkeletons, setHideSkeletons] = useState(false)

  useEffect(() => {
    if (id) loadJourney(Number(id)).catch(() => {})
  }, [id])

  // GPX tracks of the trips behind this journey (#1260). Loaded separately from the
  // journey itself: a journey without tracks is the common case, and a failed lookup
  // should cost the map its lines, not the whole page.
  const [tracks, setTracks] = useState<JourneyTrack[]>([])
  useEffect(() => {
    if (!id) return
    let cancelled = false
    journeyApi.listTracks(Number(id))
      .then(res => { if (!cancelled) setTracks(res.tracks ?? []) })
      .catch(() => { if (!cancelled) setTracks([]) })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (current?.hide_skeletons !== undefined) setHideSkeletons(current.hide_skeletons)
  }, [current?.hide_skeletons])

  useEffect(() => {
    if (notFound) {
      toast.error(t('journey.notFound'))
      navigate('/journey')
    }
  }, [notFound])

  // WebSocket real-time updates
  useEffect(() => {
    if (!id) return
    const journeyId = Number(id)
    const handler = (event: Record<string, unknown>) => {
      const type = event.type as string
      if (!type?.startsWith('journey:')) return
      if (event.journeyId !== journeyId) return
      // reload journey data on any change from other contributors
      loadJourney(journeyId)
    }
    addListener(handler)
    return () => removeListener(handler)
  }, [id])

  // scroll sync with map — the sticky map on the right follows whichever
  // entry the user is currently reading in the feed on the left. We use
  // scroll position (not IntersectionObserver) because short text-only
  // entries pass through any IO band too quickly to reliably register.
  const rafRef = useRef<number | null>(null)
  const scrollCleanupRef = useRef<(() => void) | null>(null)
  // Suppress scroll-sync updates while a programmatic smooth-scroll is
  // running (triggered by a marker click). The scroll-progress reference
  // line doesn't align with `scrollIntoView({ block: 'center' })`, so the
  // sync would otherwise pick random entries as the scroll animates past
  // them and end up nowhere near the clicked marker.
  const suppressScrollSyncRef = useRef(false)
  const suppressTimerRef = useRef<number | null>(null)
  const setupScrollSync = useCallback(() => {
    scrollCleanupRef.current?.()
    const feed = feedRef.current
    if (!feed) return

    const commitWinner = () => {
      if (suppressScrollSyncRef.current) return
      const nodes = document.querySelectorAll('[data-entry-id]')
      if (nodes.length === 0) return
      const feedRect = feed.getBoundingClientRect()
      // Reference line tracks scroll progress — at the top of the feed
      // it sits at the top edge; at the bottom it sits at the bottom
      // edge. This keeps every entry passing through the line exactly
      // once even when they're too short to cross a static line before
      // the feed runs out of scroll.
      const maxScroll = feed.scrollHeight - feed.clientHeight
      const progress = maxScroll > 0 ? feed.scrollTop / maxScroll : 0
      const referenceY = feedRect.top + feedRect.height * progress
      let lastPast: { id: string; top: number } | null = null
      let firstAhead: { id: string; top: number } | null = null
      nodes.forEach(el => {
        const entryId = el.getAttribute('data-entry-id')
        if (!entryId) return
        const top = el.getBoundingClientRect().top
        if (top <= referenceY) {
          if (!lastPast || top > lastPast.top) lastPast = { id: entryId, top }
        } else {
          if (!firstAhead || top < firstAhead.top) firstAhead = { id: entryId, top }
        }
      })
      const winner = lastPast || firstAhead
      if (winner) {
        setActiveEntryId(winner.id)
        if (locatedEntryIdsRef.current.has(winner.id)) {
          mapRef.current?.highlightMarker(winner.id)
        }
      }
    }
    const onScroll = () => {
      if (rafRef.current != null) return
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null
        commitWinner()
      })
    }

    feed.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    // prime once so the map syncs on initial load
    commitWinner()
    scrollCleanupRef.current = () => {
      feed.removeEventListener('scroll', onScroll)
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (current?.entries?.length) {
      const t = window.setTimeout(setupScrollSync, 300)
      return () => {
        window.clearTimeout(t)
        scrollCleanupRef.current?.()
      }
    }
    return () => scrollCleanupRef.current?.()
  }, [current?.entries, setupScrollSync])

  // ── Jump to top / to the last entry (#1088) ───────────────────────────────
  // A long journal is a long scroll: everything that adds to it — the entry
  // button, the gallery upload — sits at the top, and where you were reading
  // sits at the bottom. Two buttons beat two trips of the scroll wheel.
  const [feedEdge, setFeedEdge] = useState<{ atTop: boolean; atBottom: boolean }>({ atTop: true, atBottom: true })

  useEffect(() => {
    const feed = feedRef.current
    if (!feed) return
    // 400px of travel before either button is worth offering; below that the
    // scroll is short enough that a button is just clutter.
    const THRESHOLD = 400
    let frame: number | null = null
    let pending = false
    const measure = () => {
      pending = false
      const el = feedRef.current
      if (!el) return
      const scrolled = el.scrollTop
      const remaining = el.scrollHeight - el.clientHeight - scrolled
      setFeedEdge(prev => {
        const next = { atTop: scrolled <= THRESHOLD, atBottom: remaining <= THRESHOLD }
        return prev.atTop === next.atTop && prev.atBottom === next.atBottom ? prev : next
      })
    }
    // The "already scheduled" flag is its own variable rather than the frame id:
    // the id is only assigned once requestAnimationFrame returns, which is after
    // the callback has already run whenever rAF fires synchronously.
    const onScroll = () => {
      if (pending) return
      pending = true
      frame = window.requestAnimationFrame(measure)
    }
    feed.addEventListener('scroll', onScroll, { passive: true })
    measure()
    // Entries load in batches, so the scrollable height grows after mount.
    const ro = new ResizeObserver(measure)
    ro.observe(feed)
    if (feed.firstElementChild) ro.observe(feed.firstElementChild)
    return () => {
      feed.removeEventListener('scroll', onScroll)
      ro.disconnect()
      if (frame != null) window.cancelAnimationFrame(frame)
    }
  }, [current?.id, view])

  const scrollFeedTo = useCallback((edge: 'top' | 'bottom') => {
    const el = feedRef.current
    if (!el) return
    el.scrollTo({ top: edge === 'top' ? 0 : el.scrollHeight, behavior: 'smooth' })
  }, [])

  const handleMarkerClick = useCallback((entryId: string) => {
    const el = document.querySelector(`[data-entry-id="${entryId}"]`)
    if (!el) return
    // Commit the choice immediately so the highlighted marker stays pinned
    // to the clicked entry even while smooth-scroll passes over others.
    suppressScrollSyncRef.current = true
    setActiveEntryId(entryId)
    mapRef.current?.highlightMarker(entryId)
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (suppressTimerRef.current != null) window.clearTimeout(suppressTimerRef.current)
    // Smooth scroll typically finishes within ~500ms; 750ms gives a safety
    // buffer so the sync doesn't snap back to the wrong entry on the very
    // last frame.
    suppressTimerRef.current = window.setTimeout(() => {
      suppressScrollSyncRef.current = false
      suppressTimerRef.current = null
    }, 750)
  }, [])

  useEffect(() => () => {
    if (suppressTimerRef.current != null) window.clearTimeout(suppressTimerRef.current)
  }, [])

  const handleLocationClick = useCallback((id: string) => {
    setActiveLocationId(id)
  }, [])

  useEffect(() => {
    // give the sidebar map a chance to recalc its size when the view switches
    // (feed column width can shift slightly if the gallery vs timeline
    // renders with a different scrollbar state).
    requestAnimationFrame(() => mapRef.current?.invalidateSize())
  }, [view])

  // On desktop we run a two-pane layout where only the feed column scrolls;
  // the body must not scroll underneath it. Goes through the shared counter so a
  // modal opening on top of it cannot hand the page back early (#1809).
  useEffect(() => {
    if (isMobile) return
    return lockBodyScroll()
  }, [isMobile])

  // Map only shows real journal entries — skeletons are trip-derived
  // suggestions, not something the user actually journaled at that spot.
  const mapEntries = useMemo(
    () => (current?.entries || []).filter(e =>
      e.location_lat && e.location_lng &&
      e.title !== 'Gallery' &&
      e.title !== '[Trip Photos]' &&
      e.type !== 'skeleton'
    ),
    [current?.entries]
  )

  const sidebarMapItems = useMemo(() => {
    const allDates = [...new Set(
      (current?.entries || [])
        .filter(e => e.title !== 'Gallery' && e.title !== '[Trip Photos]')
        .map(e => e.entry_date)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    )]
    const sorted = [...mapEntries].sort((a, b) => a.entry_date.localeCompare(b.entry_date))
    const dayCounters = new Map<string, number>()
    return sorted.map(e => {
      const dayIdx = allDates.indexOf(e.entry_date)
      const dayLabel = (dayCounters.get(e.entry_date) ?? 0) + 1
      dayCounters.set(e.entry_date, dayLabel)
      return {
        id: String(e.id),
        lat: e.location_lat!,
        lng: e.location_lng!,
        title: e.title || '',
        location_name: e.location_name || '',
        mood: e.mood,
        created_at: e.entry_date,
        entry_date: e.entry_date,
        dayColor: DAY_COLORS[dayIdx % DAY_COLORS.length],
        dayLabel,
      }
    })
  }, [mapEntries, current?.entries])

  const locatedEntryIdsRef = useRef(new Set<string>())
  useEffect(() => {
    locatedEntryIdsRef.current = new Set(sidebarMapItems.map(m => m.id))
  }, [sidebarMapItems])

  const tripDates = useMemo(() => {
    const dates = new Set<string>()
    if (!current?.trips) return dates
    // The days are walked in local time, so the key has to be built from the local parts —
    // toISOString() would shift the whole range by a day in every timezone east of UTC.
    const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    for (const trip of current.trips) {
      if (!trip.start_date || !trip.end_date) continue
      const start = new Date(trip.start_date + 'T00:00:00')
      const end = new Date(trip.end_date + 'T00:00:00')
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.add(dateKey(d))
      }
    }
    return dates
  }, [current?.trips])

  /** Studio's margin to the window on all four sides — see `.st-root` in studio.css. */
  const STUDIO_INSET = 16

  /**
   * Open TREK Studio.
   *
   * The button's own rect travels along in the navigation state so the panel can
   * grow out of the button instead of appearing from nowhere. The origin is
   * expressed inside the panel's box, which starts 16px in from the left and
   * `--nav-h + 16px` down from the top (see studio.css).
   */
  const openStudio = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    navigate(`/journey/${id}/studio`, {
      state: {
        studioOrigin: {
          x: Math.round(r.left + r.width / 2 - STUDIO_INSET),
          y: Math.round(r.top + r.height / 2 - STUDIO_INSET),
        },
      },
    })
  }, [navigate, id])

  /** Warm the Studio chunk on hover so the click is not spent downloading it. */
  const prefetchStudio = useCallback(() => {
    void import('../JourneyStudioPage')
  }, [])

  return {
    id, navigate, toast, t, locale,
    openStudio, prefetchStudio,
    current, loading,
    canEditEntries, canEditJourney, myRole,
    view, setView, activeEntryId, setActiveEntryId, feedRef,
    viewingEntry, setViewingEntry, editingEntry, setEditingEntry,
    lightbox, setLightbox, deleteTarget, setDeleteTarget,
    showInvite, setShowInvite, showAddTrip, setShowAddTrip,
    unlinkTrip, setUnlinkTrip, showSettings, setShowSettings,
    hideSkeletons, setHideSkeletons,
    mapRef, fullMapRef, galleryUploadRef, activeLocationId, handleMarkerClick, handleLocationClick,
    mapEntries, sidebarMapItems, tripDates, isMobile, tracks,
    feedEdge, scrollFeedTo,
    loadJourney, updateEntry, deleteEntry, reorderEntries, uploadPhotos, deletePhoto,
  }
}
