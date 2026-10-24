import { useCallback, useMemo, useState } from 'react'
import type { BookingsKind, BookingsView, GroupBy, SortBy, StatusFilter } from './bookingsModel'
import type { TimelineZoom } from './BookingsTimeline'

// Storage can be blocked (private windows, strict settings); the view then just starts fresh.
function read<T>(store: Storage | undefined, key: string, fallback: T): T {
  try {
    const raw = store?.getItem(key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}
function write(store: Storage | undefined, key: string, value: unknown) {
  try { store?.setItem(key, JSON.stringify(value)) } catch { /* storage unavailable: the choice lasts until reload */ }
}
const local = () => (typeof window === 'undefined' ? undefined : window.localStorage)
const session = () => (typeof window === 'undefined' ? undefined : window.sessionStorage)

const DEFAULT_GROUP: Record<'cards' | 'list', GroupBy> = { cards: 'status', list: 'day' }

interface Filters { types: string[]; status: StatusFilter; travelers: number[] }

/**
 * How one of the two tabs is looked at, remembered per tab: the view, grouping
 * and sort in localStorage, the filters per trip in sessionStorage. The keys
 * carry the tab, so filtering Transports to flights no longer empties Bookings.
 */
export function useBookingsView(kind: BookingsKind, tripId: number) {
  const k = (name: string) => `trek:bookings-${kind}-${name}`
  const filterKey = `trek-bookings-filters-${kind}-${tripId}`

  const [view, setViewState] = useState<BookingsView>(() => read(local(), k('view'), 'cards'))
  const [groups, setGroups] = useState<Record<'cards' | 'list', GroupBy>>(() => read(local(), k('group'), DEFAULT_GROUP))
  const [sort, setSortState] = useState<{ by: SortBy; dir: 'asc' | 'desc' }>(() => read(local(), k('sort'), { by: 'date', dir: 'asc' }))
  const [timeline, setTimeline] = useState<{ zoom: TimelineZoom; byType: boolean; context: boolean }>(() => {
    const stored = read(local(), k('timeline'), { zoom: 'trip' as TimelineZoom, byType: true, context: true })
    // Anything but 'day' (an older build stored three steps) opens on the whole trip.
    return { ...stored, zoom: stored.zoom === 'day' ? 'day' : 'trip' }
  })
  // Cards only: whether transit journeys get their own section or sit among the confirmed entries.
  const [transitApartCards, setTransitApartCards] = useState<boolean>(() => read(local(), k('transitApart'), false))
  const [filters, setFiltersState] = useState<Filters>(() => read(session(), filterKey, { types: [], status: 'all', travelers: [] }))
  const [collapsedMap, setCollapsed] = useState<Record<string, boolean>>(() => read(local(), `${k('collapsed')}:${tripId}`, {}))
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const setView = (v: BookingsView) => { setViewState(v); write(local(), k('view'), v) }
  const group: GroupBy = view === 'timeline' ? 'none' : groups[view]
  const setGroup = (g: GroupBy) => {
    if (view === 'timeline') return
    const next = { ...groups, [view]: g }
    setGroups(next); write(local(), k('group'), next)
  }
  const setSort = (by: SortBy) => { const next = { by, dir: sort.by === by ? sort.dir : 'asc' as const }; setSortState(next); write(local(), k('sort'), next) }
  const flipSort = () => { const next = { ...sort, dir: sort.dir === 'asc' ? 'desc' as const : 'asc' as const }; setSortState(next); write(local(), k('sort'), next) }
  const patchTimeline = (patch: Partial<typeof timeline>) => { const next = { ...timeline, ...patch }; setTimeline(next); write(local(), k('timeline'), next) }
  const setFilters = (patch: Partial<Filters>) => { const next = { ...filters, ...patch }; setFiltersState(next); write(session(), filterKey, next) }
  const setTransitApart = (on: boolean) => { setTransitApartCards(on); write(local(), k('transitApart'), on) }

  const toggleType = (type: string) => setFilters({ types: filters.types.includes(type) ? filters.types.filter(x => x !== type) : [...filters.types, type] })
  const toggleTraveler = (id: number) => setFilters({ travelers: filters.travelers.includes(id) ? filters.travelers.filter(x => x !== id) : [...filters.travelers, id] })
  const resetFilters = () => { setFilters({ types: [], status: 'all', travelers: [] }); setQuery('') }

  const viewIsDefault = view === 'timeline'
    ? timeline.byType && timeline.context
    : groups[view] === DEFAULT_GROUP[view] && sort.by === 'date' && sort.dir === 'asc' && (view !== 'cards' || !transitApartCards)
  const resetView = () => {
    if (view === 'timeline') { patchTimeline({ byType: true, context: true }); return }
    if (view === 'cards') setTransitApart(false)
    setGroup(DEFAULT_GROUP[view])
    const next = { by: 'date' as const, dir: 'asc' as const }
    setSortState(next); write(local(), k('sort'), next)
  }

  const types = useMemo(() => new Set(filters.types), [filters.types])
  const travelers = useMemo(() => new Set(filters.travelers), [filters.travelers])

  const collapsed = useCallback((groupId: string) => !!collapsedMap[`${group}:${groupId}`], [collapsedMap, group])
  const toggleGroup = (groupId: string) => {
    const next = { ...collapsedMap, [`${group}:${groupId}`]: !collapsedMap[`${group}:${groupId}`] }
    setCollapsed(next); write(local(), `${k('collapsed')}:${tripId}`, next)
  }

  return {
    view, setView, group, setGroup, sort, setSort, flipSort,
    timeline, setZoom: (zoom: TimelineZoom) => patchTimeline({ zoom }),
    toggleByType: () => patchTimeline({ byType: !timeline.byType }),
    toggleContext: () => patchTimeline({ context: !timeline.context }),
    // The list and the timeline keep transit in its own section, as before.
    transitApart: view !== 'cards' || transitApartCards,
    toggleTransitApart: () => setTransitApart(!transitApartCards),
    types, status: filters.status, travelers,
    setStatus: (status: StatusFilter) => setFilters({ status }),
    toggleType, clearTypes: () => setFilters({ types: [] }),
    toggleTraveler, clearTravelers: () => setFilters({ travelers: [] }),
    query, setQuery, resetFilters,
    filtering: filters.types.length > 0 || filters.status !== 'all' || filters.travelers.length > 0 || query.trim() !== '',
    viewIsDefault, resetView,
    collapsed, toggleGroup,
    selectedId, setSelectedId,
  }
}
