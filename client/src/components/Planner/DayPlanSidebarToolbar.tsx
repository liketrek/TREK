import { useState } from 'react'
import { ChevronsDownUp, ChevronsUpDown, Download, Undo2, ArrowUpDown, Route as RouteIcon } from 'lucide-react'
import { DayReorderPopup } from './DayReorderPopup'
import Tooltip from '../shared/Tooltip'
import { useToast } from '../shared/Toast'
import { TripExportModal } from './TripExportModal'
import { isRoutableReservation } from '../../utils/reservationRoutes'
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
}

export function DayPlanSidebarToolbar({
  tripId, trip, days, places, categories, assignments, reservations, dayNotes,
  allConnectionsShown = false, onToggleAllConnections,
  t, locale, toast,
  expandedDays, setExpandedDays, onUndo, canUndo, undoHover, setUndoHover, lastActionLabel,
  canEditDays, canManageShare = true, onReorderDays, onAddDay,
}: DayPlanSidebarToolbarProps) {
  const [reorderOpen, setReorderOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  return (
    <div className="border-b border-edge-faint" style={{ padding: '12px 16px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        {/* One export button instead of three: PDF, ICS and GPX each carried
            their own hover menu, and on a narrower sidebar the row ran out of
            width and pushed them off the edge. The dialog holds every option. */}
        <Tooltip label={t('dayplan.exportIntro')} placement="bottom">
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={exportOpen}
            className="bg-accent text-accent-text"
            style={{
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              padding: '5px 10px', borderRadius: 8, border: 'none',
              fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Download size={13} strokeWidth={2} />
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
        {(() => {
          const allExpanded = days.length > 0 && days.every(d => expandedDays.has(d.id))
          const label = allExpanded ? t('dayplan.collapseAll') : t('dayplan.expandAll')
          return (
            <Tooltip label={label} placement="bottom">
              <button type="button"
                onClick={() => {
                  const next = allExpanded ? new Set<number>() : new Set(days.map(d => d.id))
                  setExpandedDays(next)
                  // Same store the sidebar reads on mount — a sessionStorage write
                  // here left the persisted set behind after a reload.
                  try { localStorage.setItem(`day-expanded-${tripId}`, JSON.stringify([...next])) } catch {}
                }}
                aria-label={label}
                aria-pressed={allExpanded}
                style={{
                  position: 'relative', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 30, borderRadius: 8,
                  border: '1px solid var(--border-primary)', background: 'none',
                  color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                  transition: 'color 0.15s, border-color 0.15s, background 0.15s',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'opacity 0.2s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  opacity: allExpanded ? 0 : 1,
                  transform: allExpanded ? 'translateY(-8px) scale(0.6)' : 'translateY(0) scale(1)',
                }}>
                  <ChevronsUpDown size={14} strokeWidth={2} />
                </span>
                <span style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'opacity 0.2s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  opacity: allExpanded ? 1 : 0,
                  transform: allExpanded ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.6)',
                }}>
                  <ChevronsDownUp size={14} strokeWidth={2} />
                </span>
              </button>
            </Tooltip>
          )
        })()}
        {onUndo && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button type="button"
              onClick={onUndo}
              disabled={!canUndo}
              aria-label={t('undo.button')}
              onMouseEnter={() => setUndoHover(true)}
              onMouseLeave={() => setUndoHover(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: 8,
                border: '1px solid var(--border-primary)', background: 'none',
                color: canUndo ? 'var(--text-primary)' : 'var(--border-primary)',
                cursor: canUndo ? 'pointer' : 'default', fontFamily: 'inherit',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              <Undo2 size={14} strokeWidth={2} />
            </button>
            {undoHover && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 200,
                background: 'var(--bg-card, white)', color: 'var(--text-primary, #111827)',
                fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500, padding: '5px 10px',
                borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid var(--border-faint, #e5e7eb)',
              }}>
                {canUndo && lastActionLabel ? t('undo.tooltip', { action: lastActionLabel }) : t('undo.button')}
              </div>
            )}
          </div>
        )}
        {canEditDays && onReorderDays && onAddDay && days.length > 0 && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Tooltip label={t('dayplan.reorderDays')} placement="bottom">
              <button type="button"
                onClick={() => setReorderOpen(v => !v)}
                aria-label={t('dayplan.reorderDays')}
                aria-pressed={reorderOpen}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 30, borderRadius: 8,
                  border: '1px solid var(--border-primary)',
                  background: reorderOpen ? 'var(--bg-hover)' : 'none',
                  color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                  transition: 'color 0.15s, border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { if (!reorderOpen) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { if (!reorderOpen) e.currentTarget.style.background = 'transparent' }}
              >
                <ArrowUpDown size={14} strokeWidth={2} />
              </button>
            </Tooltip>
            <DayReorderPopup
              isOpen={reorderOpen}
              days={days}
              t={t}
              locale={locale}
              onReorder={onReorderDays}
              onAddDay={() => onAddDay()}
              onClose={() => setReorderOpen(false)}
            />
          </div>
        )}
        {onToggleAllConnections && reservations.some(isRoutableReservation) && (() => {
          const label = t(allConnectionsShown ? 'map.hideAllConnections' : 'map.showAllConnections')
          return (
            <Tooltip label={label} placement="bottom">
              <button
                type="button"
                onClick={onToggleAllConnections}
                aria-label={label}
                aria-pressed={allConnectionsShown}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 30, borderRadius: 8,
                  border: allConnectionsShown ? 'none' : '1px solid var(--border-primary)',
                  background: allConnectionsShown ? '#3b82f6' : 'none',
                  color: allConnectionsShown ? '#fff' : 'var(--text-primary)',
                  cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                  transition: 'color 0.15s, border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { if (!allConnectionsShown) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { if (!allConnectionsShown) e.currentTarget.style.background = 'transparent' }}
              >
                <RouteIcon size={14} strokeWidth={2} />
              </button>
            </Tooltip>
          )
        })()}
      </div>
    </div>
  )
}
