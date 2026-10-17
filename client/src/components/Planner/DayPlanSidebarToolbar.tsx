import { useState } from 'react'
import { ChevronsDownUp, ChevronsUpDown, Download, Undo2, ArrowUpDown, Route as RouteIcon } from 'lucide-react'
import { DayReorderPopup } from './DayReorderPopup'
import Tooltip from '../shared/Tooltip'
import { NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { BarButton, PANEL_BAR } from './planParts'
import { useToast } from '../shared/Toast'
import { TripExportModal } from './TripExportModal'
import { isRoutableReservation } from '../../utils/reservationRoutes'
import type { DayAddControls } from '../../utils/dayAdd'
import type { DayDeleteQuestion } from '../../utils/dayImpactLines'
import type { Trip, Day, Place, Category, AssignmentsMap, Reservation, DayNote } from '../../types'

interface DayPlanSidebarToolbarProps {
  tripId: number
  trip: Trip
  days: Day[]
  places: Place[]
  categories: Category[]
  assignments: AssignmentsMap
  reservations: Reservation[]
  allConnectionsShown?: boolean
  onToggleAllConnections?: () => void
  dayNotes: Record<string, DayNote[]>
  t: (key: string, params?: Record<string, any>) => string
  locale: string
  toast: ReturnType<typeof useToast>
  expandedDays: Set<number>
  setExpandedDays: (next: Set<number>) => void
  onUndo?: () => void
  canUndo: boolean
  undoHover: boolean
  setUndoHover: (v: boolean) => void
  lastActionLabel: string | null
  canEditDays?: boolean
  /**
   * Gates "Subscribe to calendar" in the export dialog only. Defaults to true so
   * a caller that has not wired the permission through keeps today's entries
   * rather than silently losing one.
   */
  canManageShare?: boolean
  onReorderDays?: (orderedIds: number[]) => void
  onAddDay?: (position?: number) => void
  /** The planner's add controls: on a trip with dates the dialog offers the next date as well. */
  dayAdd?: DayAddControls
  /** Asks to delete a day from the reorder dialog; without it the dialog has no delete buttons. */
  onDeleteDay?: (dayId: number) => void
  /** The open delete question; the dialog asks it in place of its day list. */
  deleteDayQuestion?: DayDeleteQuestion | null
}

export function DayPlanSidebarToolbar({
  tripId, trip, days, places, categories, assignments, reservations, dayNotes,
  allConnectionsShown = false, onToggleAllConnections,
  t, locale, toast,
  expandedDays, setExpandedDays, onUndo, canUndo, undoHover, setUndoHover, lastActionLabel,
  canEditDays, canManageShare = true, onReorderDays, onAddDay, dayAdd, onDeleteDay, deleteDayQuestion,
}: DayPlanSidebarToolbarProps) {
  const [reorderOpen, setReorderOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const allExpanded = days.length > 0 && days.every(d => expandedDays.has(d.id))
  const expandLabel = allExpanded ? t('dayplan.collapseAll') : t('dayplan.expandAll')
  const undoTip = canUndo && lastActionLabel ? t('undo.tooltip', { action: lastActionLabel }) : t('undo.button')
  const connectionsLabel = t(allConnectionsShown ? 'map.hideAllConnections' : 'map.showAllConnections')

  // The panel's head band: the export as its one labelled action, the tools as
  // quiet icons that rise like a filter tab when they are on.
  return (
    <div className={PANEL_BAR} style={{ background: NEUTRAL_TINT }}>
      {/* One export button instead of three: PDF, ICS and GPX each carried
          their own hover menu, and on a narrower sidebar the row ran out of
          width and pushed them off the edge. The dialog holds every option. */}
      <Tooltip label={t('dayplan.exportIntro')} placement="bottom">
        <button
          type="button"
          onClick={() => setExportOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={exportOpen}
          className="inline-flex h-8 flex-none items-center gap-1.5 rounded-[10px] bg-accent px-3 font-semibold text-accent-text hover:opacity-90"
          style={fs(12, 'body')}
        >
          <Download size={13} strokeWidth={2.2} />
          {t('dayplan.export')}
        </button>
      </Tooltip>
      <TripExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        tripId={tripId}
        trip={trip}
        days={days}
        places={places}
        categories={categories}
        assignments={assignments}
        reservations={reservations}
        dayNotes={dayNotes}
        t={t}
        locale={locale}
        toast={toast}
        canManageShare={canManageShare}
      />
      <span className="flex-1" />
      {onUndo && (
        <Tooltip label={undoTip} placement="bottom">
          <button type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label={t('undo.button')}
            onMouseEnter={() => setUndoHover(true)}
            onMouseLeave={() => setUndoHover(false)}
            className="grid h-8 w-8 flex-none place-items-center rounded-[10px] text-content-muted transition-colors enabled:hover:bg-surface-card enabled:hover:text-content disabled:cursor-default disabled:opacity-40"
          >
            <Undo2 size={15} strokeWidth={2} />
          </button>
        </Tooltip>
      )}
      <BarButton
        label={expandLabel}
        ariaPressed={allExpanded}
        onClick={() => {
          const next = allExpanded ? new Set<number>() : new Set(days.map(d => d.id))
          setExpandedDays(next)
          // Same store the sidebar reads on mount — a sessionStorage write
          // here left the persisted set behind after a reload.
          try { localStorage.setItem(`day-expanded-${tripId}`, JSON.stringify([...next])) } catch {}
        }}
      >
        {allExpanded ? <ChevronsDownUp size={15} strokeWidth={2} /> : <ChevronsUpDown size={15} strokeWidth={2} />}
      </BarButton>
      {canEditDays && onReorderDays && onAddDay && days.length > 0 && (
        <>
          <BarButton label={t('dayplan.reorderDays')} ariaPressed={reorderOpen} active={reorderOpen} onClick={() => setReorderOpen(v => !v)}>
            <ArrowUpDown size={15} strokeWidth={2} />
          </BarButton>
          <DayReorderPopup
            isOpen={reorderOpen}
            days={days}
            t={t}
            locale={locale}
            onReorder={onReorderDays}
            onAddDay={() => onAddDay()}
            dayAdd={dayAdd}
            onDeleteDay={onDeleteDay}
            deleteQuestion={deleteDayQuestion}
            onClose={() => setReorderOpen(false)}
          />
        </>
      )}
      {onToggleAllConnections && reservations.some(isRoutableReservation) && (
        <BarButton label={connectionsLabel} ariaPressed={allConnectionsShown} active={allConnectionsShown}
          className={allConnectionsShown ? 'text-info' : ''} onClick={onToggleAllConnections}>
          <RouteIcon size={15} strokeWidth={2} />
        </BarButton>
      )}
    </div>
  )
}
