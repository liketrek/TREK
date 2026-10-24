import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useJourneyStore } from '../../store/journeyStore'
import { useAuthStore } from '../../store/authStore'
import { journeyApi } from '../../api/client'
import { useToast } from '../../components/shared/Toast'
import { useTranslation } from '../../i18n'
import { computeJourneyLifecycle } from '../../utils/journeyLifecycle'
import { useServerPing } from '../../sync/useServerPing'

function dismissedSuggestionsKey(userId: number | undefined): string {
  return `trek:journey:dismissed-suggestions:v1:${userId ?? 'anonymous'}`
}

/** The trips this user put away, as stored here; anything unreadable reads as none. */
function readDismissedSuggestions(userId: number | undefined): Set<number> {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(dismissedSuggestionsKey(userId)) || '[]')
    return new Set(Array.isArray(value) ? value.filter((id): id is number => Number.isInteger(id)) : [])
  } catch {
    return new Set()
  }
}

function saveDismissedSuggestions(userId: number | undefined, dismissed: Set<number>): void {
  const key = dismissedSuggestionsKey(userId)
  if (dismissed.size === 0) {
    window.localStorage.removeItem(key)
    return
  }
  window.localStorage.setItem(key, JSON.stringify([...dismissed]))
}

/** The journey events after which the list reads itself again. */
const JOURNEY_LIST_EVENTS = ['journey:updated', 'journey:deleted', 'journey:contributor:changed'] as const

/**
 * A journey renamed, given other trips or deleted in another tab or through
 * MCP, or this user taken off one as a contributor: the list reads itself
 * again, once per burst. The spinner only shows over an empty list, so a
 * reread of a full one does not flash.
 */
function useJourneyListReread(loadJourneys: () => Promise<void>): void {
  useServerPing(JOURNEY_LIST_EVENTS, true, async () => {
    try {
      await loadJourneys()
    } catch {
      // A failed reread keeps the list on screen; the next event or visit reads it again.
    }
  })
}

/**
 * Journey list page logic — owns the journey store load, the create-journey
 * modal (title, available trips, selection), the search box, the trip
 * suggestion banner and the active/filtered journey derivations. JourneyPage
 * stays a wiring container around its hero/grid/modal JSX and JourneyCard.
 * Behaviour is identical to the previous in-component logic.
 */
export function useJourney() {
  const navigate = useNavigate()
  const toast = useToast()
  const { t } = useTranslation()
  const { journeys, loading, loadJourneys, createJourney } = useJourneyStore()
  const userId = useAuthStore(s => s.user?.id)

  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSubtitle, setNewSubtitle] = useState('')
  const [availableTrips, setAvailableTrips] = useState<any[]>([])
  const [selectedTripIds, setSelectedTripIds] = useState<Set<number>>(new Set())
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // suggestion
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<number>>(() => readDismissedSuggestions(userId))

  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    loadJourneys()
  }, [])
  useJourneyListReread(loadJourneys)

  useEffect(() => {
    let cancelled = false
    journeyApi.suggestions().then(d => {
      if (cancelled) return
      const trips = d.trips || []
      const suggestionIds = new Set<number>(trips.map((trip: { id: number }) => trip.id))
      const stored = readDismissedSuggestions(userId)
      const retained = new Set([...stored].filter(id => suggestionIds.has(id)))
      setSuggestions(trips)
      setDismissedSuggestions(retained)
      if (retained.size !== stored.size) {
        try {
          saveDismissedSuggestions(userId, retained)
        } catch {
          // Pruning is best effort; a failed write leaves the old IDs to retry later.
        }
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [userId])

  // The bottom-nav "+" opens the new-journey modal via ?create=1.
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      void openCreateModal()
      setSearchParams(p => { p.delete('create'); return p }, { replace: true })
    }
  }, [searchParams])

  const activeSuggestion = suggestions.find(s => !dismissedSuggestions.has(s.id))

  const dismissSuggestion = (tripId: number) => {
    const next = new Set(dismissedSuggestions)
    next.add(tripId)
    try {
      saveDismissedSuggestions(userId, next)
      setDismissedSuggestions(next)
    } catch {
      toast.error(t('journey.frontpage.dismissError'))
    }
  }

  // The frontpage always features one journey as the hero. A journey tied to a
  // currently-running trip wins; otherwise we fall back to the most recent one
  // (the list arrives sorted by updated_at DESC, so journeys[0] is the newest).
  // This guarantees there is always a hero header, and a freshly created or
  // updated journey — e.g. from an ongoing or more recent trip — takes over.
  const activeJourney = useMemo(() => {
    if (searchQuery.trim() || journeys.length === 0) return null
    const live = journeys.find(j => {
      const j2 = j as any
      return computeJourneyLifecycle(j.status, j2.trip_date_min, j2.trip_date_max, j.status_override) === 'live'
    })
    return live ?? journeys[0]
  }, [journeys, searchQuery])

  // Whether the hero is a live (currently-running) journey — drives the eyebrow
  // label ("Active Journey" vs "Latest Journey").
  const activeJourneyIsLive = useMemo(() => {
    if (!activeJourney) return false
    const j2 = activeJourney as any
    return computeJourneyLifecycle(activeJourney.status, j2.trip_date_min, j2.trip_date_max, activeJourney.status_override) === 'live'
  }, [activeJourney])

  const filteredJourneys = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return journeys.filter(j => j.id !== activeJourney?.id)
    return journeys.filter(j => {
      const inTitle = j.title.toLowerCase().includes(q)
      const inSubtitle = j.subtitle?.toLowerCase().includes(q) ?? false
      return inTitle || inSubtitle
    })
  }, [journeys, activeJourney, searchQuery])

  const openCreateModal = async (preSelectedTripId?: number) => {
    setShowCreate(true)
    setNewTitle('')
    setNewSubtitle('')
    const initial = new Set<number>()
    if (preSelectedTripId) initial.add(preSelectedTripId)
    setSelectedTripIds(initial)
    try {
      const data = await journeyApi.availableTrips()
      setAvailableTrips(data.trips || [])
    } catch {}
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    try {
      const j = await createJourney({
        title: newTitle.trim(),
        subtitle: newSubtitle.trim() || undefined,
        trip_ids: [...selectedTripIds],
      })
      setShowCreate(false)
      navigate(`/journey/${j.id}`)
    } catch {
      toast.error(t('journey.createError'))
    }
  }

  const totalPlaces = useMemo(() => {
    return availableTrips.filter(t => selectedTripIds.has(t.id)).reduce((sum: number, t: any) => sum + (t.place_count || 0), 0)
  }, [availableTrips, selectedTripIds])

  return {
    navigate, journeys, loading,
    showCreate, setShowCreate, newTitle, setNewTitle, newSubtitle, setNewSubtitle,
    availableTrips, selectedTripIds, setSelectedTripIds,
    searchOpen, setSearchOpen, searchQuery, setSearchQuery, searchInputRef,
    activeSuggestion, dismissSuggestion,
    activeJourney, activeJourneyIsLive, filteredJourneys,
    openCreateModal, handleCreate, totalPlaces,
  }
}
