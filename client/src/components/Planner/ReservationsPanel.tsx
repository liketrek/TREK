import { useCallback, useMemo, type CSSProperties } from 'react'
import { Download, Plane, Plus, SearchX } from 'lucide-react'
import { useTripStore } from '../../store/tripStore'
import { useCanDo } from '../../store/permissionsStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useTranslation } from '../../i18n'
import type { Reservation, Day, TripFile, AssignmentsMap, BudgetItem } from '../../types'
import { usePluginViewContributions } from '../Plugins/PluginContributions'
import EmptyState from '../shared/EmptyState'
import type { TripMember } from '../Budget/BudgetPanelMemberChips'
import {
  applyFilters, buildAssignmentLookup, costsFor, groupReservations, sortReservations, TYPE_ORDER, typeInfo,
  type BookingsKind,
} from './bookings/bookingsModel'
import { bookingFacts, formatDay, type BookingFacts } from './bookings/bookingFacts'
import { filesFor, SectionHead, fs } from './bookings/bookingParts'
import { useBookingsView } from './bookings/useBookingsView'
import BookingsHeader from './bookings/BookingsHeader'
import BookingCard from './bookings/BookingCard'
import BookingsList from './bookings/BookingsList'
import BookingsTimeline from './bookings/BookingsTimeline'
import BookingDetailHost from './bookings/BookingDetailHost'
import { useReservationDetailPlugins } from './bookings/useReservationDetailPlugins'
import { useBookingActions } from './bookings/useBookingActions'
import { bookingsCsv, bookingsFileName } from './bookings/bookingsExport'
import { downloadBlob } from '../../utils/fileDownload'

interface ReservationsPanelProps {
  tripId: number
  reservations: Reservation[]
  days: Day[]
  assignments: AssignmentsMap
  files?: TripFile[]
  onAdd: () => void
  onImport?: () => void
  bookingImportAvailable?: boolean
  onAirTrailImport?: () => void
  airTrailAvailable?: boolean
  onEdit: (reservation: Reservation) => void
  onDelete: (id: number) => void
  onNavigateToFiles: () => void
  titleKey?: string
  addManualKey?: string
  /** Which plugin view this panel represents — the transports tab is its own
   * contribution view, the bookings tab stays 'reservations'. */
  contributionView?: 'reservations' | 'transports'
  /** Trip members + guests, for the traveller filter (#1517). */
  tripMembers?: TripMember[]
  /** The other tab's bookings, shown dimmed on the timeline for orientation. */
  contextReservations?: Reservation[]
  /** Shows a booking on the plan map: its route for a transport, its place otherwise. */
  onShowOnMap?: (reservation: Reservation) => void
  isOnMap?: (reservation: Reservation) => boolean
  /** Opens the expense editor for an expense linked to a booking. */
  onEditExpense?: (item: BudgetItem) => void
  /** Re-enters the transit search for a public-transit journey, seeded with its route.
   *  Passed only to someone who may do that (day_edit, as on the plan); the tab adds no gate of its own. */
  onChangeRoute?: (reservation: Reservation) => void
}

// Cards take a quarter of the row at most, so a wide screen shows four and a narrow one fewer.
const CARD_GRID = 'grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(max(300px,calc((100%_-_42px)/4)),1fr))]'

/** The empty state's call-to-action buttons — same shape as the toolbar's. */
const CTA_STYLE: CSSProperties = {
  appearance: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '9px 14px', borderRadius: 10,
  fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500,
}

export default function ReservationsPanel({
  tripId, reservations, days, assignments, files = [], onAdd, onImport, bookingImportAvailable, onAirTrailImport,
  airTrailAvailable, onEdit, onDelete, onNavigateToFiles, titleKey = 'reservations.title', addManualKey = 'reservations.addManual',
  contributionView = 'reservations', tripMembers = [], contextReservations = [], onShowOnMap, isOnMap, onEditExpense, onChangeRoute,
}: ReservationsPanelProps) {
  const { t, locale } = useTranslation()
  const can = useCanDo()
  const trip = useTripStore(s => s.trip)
  const budgetItems = useTripStore(s => s.budgetItems)
  const timeFormat = useSettingsStore(s => s.settings.time_format) || '24h'
  const canEdit = can('reservation_edit', trip)
  const kind: BookingsKind = contributionView === 'transports' ? 'transports' : 'bookings'
  const v = useBookingsView(kind, tripId)
  const contribFor = usePluginViewContributions(contributionView, tripId)
  const detailPlugins = useReservationDetailPlugins()
  // The cards' and rows' own status switch and delete question; the detail brings its own.
  const actions = useBookingActions(tripId, onDelete, r => { if (v.selectedId === r.id) v.setSelectedId(null) })

  const labelOf = useCallback((type: string) => t(typeInfo(type).labelKey), [t])
  const assignmentLookup = useMemo(() => buildAssignmentLookup(days, assignments), [days, assignments])
  const tripCurrency = trip?.currency || 'EUR'

  const filtered = useMemo(
    () => applyFilters(reservations, { types: v.types, status: v.status, travelers: v.travelers, query: v.query }, labelOf),
    [reservations, v.types, v.status, v.travelers, v.query, labelOf],
  )
  const sorted = useMemo(() => sortReservations(filtered, days, v.sort.by, v.sort.dir, labelOf, v.transitApart), [filtered, days, v.sort.by, v.sort.dir, labelOf, v.transitApart])
  // What is on screen, in its order, as a spreadsheet (#1360).
  const exportCsv = () => {
    const csv = bookingsCsv(sorted, {
      type: labelOf,
      status: s => (s === 'confirmed' ? t('reservations.confirmed') : s === 'pending' ? t('reservations.pending') : s),
      headers: {
        type: t('reservations.export.type'), title: t('reservations.export.title'), status: t('reservations.status'),
        start: t('reservations.export.start'), end: t('reservations.export.end'), from: t('reservations.export.from'),
        to: t('reservations.export.to'), location: t('reservations.export.location'),
        confirmation: t('reservations.export.confirmation'), notes: t('reservations.export.notes'),
      },
    })
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), bookingsFileName(trip?.title, kind))
  }
  const groups = useMemo(() => groupReservations(sorted, v.group, days, trip?.start_date, trip?.end_date, {
    confirmed: t('reservations.confirmed'), pending: t('reservations.pending'), transit: t('transit.sectionTitle'),
    before: t('reservations.group.before'), after: t('reservations.group.after'), undated: t('reservations.group.undated'),
    dayN: n => t('dayplan.dayN', { n }), typeLabel: labelOf, dayDate: d => formatDay(d, locale),
  }, v.transitApart), [sorted, v.group, days, trip?.start_date, trip?.end_date, locale, t, labelOf, v.transitApart])

  const costsOf = useCallback((r: Reservation) => costsFor(r.id, budgetItems, tripCurrency), [budgetItems, tripCurrency])
  // Formatted once per booking object and setting; a changed booking is a new object and formats again.
  const factsOf = useMemo(() => {
    const cache = new WeakMap<Reservation, BookingFacts>()
    return (r: Reservation) => {
      let f = cache.get(r)
      if (!f) {
        f = bookingFacts(r, { t, locale, timeFormat, days, assignmentLookup, tripCurrency, hasLinkedCost: costsOf(r).length > 0 })
        cache.set(r, f)
      }
      return f
    }
  }, [t, locale, timeFormat, days, assignmentLookup, tripCurrency, costsOf])

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of reservations) counts.set(r.type, (counts.get(r.type) ?? 0) + 1)
    for (const type of v.types) if (!counts.has(type)) counts.set(type, 0)
    return [...counts.entries()].sort((a, b) => TYPE_ORDER.indexOf(a[0]) - TYPE_ORDER.indexOf(b[0])).map(([type, count]) => ({ type, count }))
  }, [reservations, v.types])
  const selected = v.selectedId != null ? reservations.find(r => r.id === v.selectedId) ?? null : null

  const select = (r: Reservation) => v.setSelectedId(v.selectedId === r.id ? null : r.id)
  // Whatever leaves the tab's own view closes the detail first: an editor, the map, an expense.
  const closeDetail = () => v.setSelectedId(null)
  const edit = (r: Reservation) => {
    closeDetail()
    onEdit(r)
  }
  const { toggleStatus, requestDelete } = actions

  const importAction = onImport && bookingImportAvailable ? onImport : undefined
  const airTrailAction = onAirTrailImport && airTrailAvailable ? onAirTrailImport : undefined

  const detail = selected && (
    <BookingDetailHost
      r={selected}
      tripId={tripId}
      days={days}
      assignments={assignments}
      files={files}
      canEdit={canEdit}
      contributions={contribFor(selected.id)}
      onClose={closeDetail}
      onEdit={canEdit ? onEdit : undefined}
      onDelete={onDelete}
      onShowOnMap={onShowOnMap}
      isOnMap={isOnMap}
      onEditExpense={onEditExpense}
      onChangeRoute={onChangeRoute}
      onNavigateToFiles={onNavigateToFiles}
    />
  )

  const content = (() => {
    if (reservations.length === 0) {
      return (
        <EmptyState
          scene={kind === 'transports' ? 'transport' : 'bookings'}
          title={t(kind === 'transports' ? 'transport.empty' : 'reservations.empty')}
          // On a fresh trip the toolbar controls sit far right above an empty
          // page, so the import in particular went unnoticed (#2007).
          action={canEdit ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button type="button" onClick={onAdd} className="bg-accent text-accent-text" style={CTA_STYLE}><Plus size={14} strokeWidth={2} />{t(addManualKey)}</button>
              {importAction && <button type="button" onClick={importAction} className="bg-surface-card text-content" style={{ ...CTA_STYLE, border: '1px solid var(--border-primary)' }}><Download size={14} strokeWidth={2} />{t('reservations.import.cta')}</button>}
              {airTrailAction && <button type="button" onClick={airTrailAction} className="bg-surface-secondary text-content" style={{ ...CTA_STYLE, border: '1px solid var(--border-primary)' }}><Plane size={14} strokeWidth={2} />{t('reservations.airtrail.cta')}</button>}
            </div>
          ) : undefined}
        />
      )
    }
    if (sorted.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-edge px-6 py-14 text-center text-content-muted">
          <SearchX size={22} strokeWidth={1.8} />
          <div className="font-semibold text-content" style={fs(14, 'body')}>{t('reservations.noMatches')}</div>
          <button type="button" onClick={v.resetFilters} className="rounded-full border border-edge-faint bg-surface-card px-3.5 py-1.5 font-medium text-content hover:bg-surface-hover" style={fs(12.5, 'body')}>
            {t('reservations.resetFilters')}
          </button>
        </div>
      )
    }
    if (v.view === 'timeline') {
      return (
        <BookingsTimeline
          items={sorted}
          context={contextReservations}
          contextLabel={t(kind === 'transports' ? 'reservations.timeline.contextBookings' : 'reservations.timeline.contextTransports')}
          days={days}
          zoom={v.timeline.zoom}
          onZoom={v.setZoom}
          factsOf={factsOf}
          byType={v.timeline.byType}
          showContext={v.timeline.context}
          selectedId={v.selectedId}
          onSelect={select}
        />
      )
    }
    if (v.view === 'list') {
      return (
        <BookingsList
          groups={groups}
          factsOf={factsOf}
          filesCount={r => filesFor(r, files).length}
          costsOf={costsOf}
          selectedId={v.selectedId}
          canEdit={canEdit}
          collapsed={v.collapsed}
          onToggleGroup={v.toggleGroup}
          onSelect={select}
          onEdit={edit}
          onDelete={requestDelete}
          onToggleStatus={toggleStatus}
        />
      )
    }
    return (
      <div className="flex flex-col gap-8">
        {groups.map(g => {
          const open = !v.collapsed(g.id)
          return (
            <div key={g.id}>
              {g.label && <SectionHead label={g.label} sub={g.sub} count={g.items.length} open={open} onToggle={() => v.toggleGroup(g.id)} />}
              {open && (
                <div className={CARD_GRID}>
                  {g.items.map(r => (
                    <BookingCard
                      key={r.id}
                      r={r}
                      facts={factsOf(r)}
                      files={filesFor(r, files)}
                      costs={costsOf(r)}
                      tripId={tripId}
                      canEdit={canEdit}
                      selected={v.selectedId === r.id}
                      onSelect={() => select(r)}
                      onEdit={() => edit(r)}
                      onDelete={() => requestDelete(r)}
                      onToggleStatus={() => toggleStatus(r)}
                      contributions={contribFor(r.id)}
                      detailPlugins={detailPlugins}
                      showFrames={v.selectedId !== r.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  })()

  return (
    <div className="flex h-full flex-col font-[family-name:var(--font-system)]">
      <div className="px-7 pt-6 max-md:px-4 max-md:pt-4">
        <BookingsHeader
          title={t(titleKey)}
          total={reservations.length}
          canEdit={canEdit}
          addLabel={t(addManualKey)}
          onAdd={onAdd}
          onImport={importAction}
          onAirTrail={airTrailAction}
          view={v.view}
          onView={v.setView}
          status={v.status}
          onStatus={v.setStatus}
          query={v.query}
          onQuery={v.setQuery}
          shown={sorted.length}
          filtering={v.filtering}
          onResetFilters={v.resetFilters}
          types={typeCounts}
          activeTypes={v.types}
          onToggleType={v.toggleType}
          onAllTypes={v.clearTypes}
          members={tripMembers}
          showTravelers={tripMembers.length > 1 && reservations.some(r => (r.travelers || []).length > 0)}
          activeTravelers={v.travelers}
          onToggleTraveler={v.toggleTraveler}
          onClearTravelers={v.clearTravelers}
          group={v.group}
          onGroup={v.setGroup}
          sort={v.sort.by}
          sortDir={v.sort.dir}
          onSort={v.setSort}
          onSortDir={v.flipSort}
          byType={v.timeline.byType}
          onByType={v.toggleByType}
          showContext={v.timeline.context}
          onShowContext={v.toggleContext}
          transitApart={v.transitApart}
          onTransitApart={v.view === 'cards' && v.group === 'status' && reservations.some(r => r.type === 'transit') ? v.toggleTransitApart : undefined}
          viewIsDefault={v.viewIsDefault}
          onResetView={v.resetView}
          onExport={exportCsv}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-20 pt-6 max-md:px-4">{content}</div>

      {detail}

      {actions.confirmDialog}
    </div>
  )
}
