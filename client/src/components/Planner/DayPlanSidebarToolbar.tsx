import { useState } from 'react'
import { ChevronsDownUp, ChevronsUpDown, FileDown, Undo2, ArrowUpDown } from 'lucide-react'
import { downloadTripPDF } from '../PDF/TripPDF'
import { DayReorderPopup } from './DayReorderPopup'
import Tooltip from '../shared/Tooltip'
import { useToast } from '../shared/Toast'
import type { Trip, Day, Place, Category, AssignmentsMap, Reservation, DayNote } from '../../types'

interface DayPlanSidebarToolbarProps {
  tripId: number
  trip: Trip
  days: Day[]
  places: Place[]
  categories: Category[]
  assignments: AssignmentsMap
  reservations: Reservation[]
  dayNotes: Record<string, DayNote[]>
  t: (key: string, params?: Record<string, any>) => string
  locale: string
  toast: ReturnType<typeof useToast>
  pdfHover: boolean
  setPdfHover: (v: boolean) => void
  icsHover: boolean
  setIcsHover: (v: boolean) => void
  expandedDays: Set<number>
  setExpandedDays: (next: Set<number>) => void
  onUndo?: () => void
  canUndo: boolean
  undoHover: boolean
  setUndoHover: (v: boolean) => void
  lastActionLabel: string | null
  canEditDays?: boolean
  onReorderDays?: (orderedIds: number[]) => void
  onAddDay?: (position?: number) => void
}

export function DayPlanSidebarToolbar({
  tripId, trip, days, places, categories, assignments, reservations, dayNotes,
  t, locale, toast, pdfHover, setPdfHover, icsHover, setIcsHover,
  expandedDays, setExpandedDays, onUndo, canUndo, undoHover, setUndoHover, lastActionLabel,
  canEditDays, onReorderDays, onAddDay,
}: DayPlanSidebarToolbarProps) {
  const [reorderOpen, setReorderOpen] = useState(false)
  return (
    <div className="border-b border-edge-faint" style={{ padding: '12px 16px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={async () => {
              const flatNotes = Object.entries(dayNotes).flatMap(([dayId, notes]) =>
                notes.map(n => ({ ...n, day_id: Number(dayId) }))
              )
              try {
                await downloadTripPDF({ trip, days, places, assignments, categories, dayNotes: flatNotes, reservations, t, locale })
              } catch (e) {
                console.error('PDF error:', e)
                toast.error(t('dayplan.pdfError') + ': ' + (e?.message || String(e)))
              }
            }}
            onMouseEnter={() => setPdfHover(true)}
            onMouseLeave={() => setPdfHover(false)}
            className="bg-accent text-accent-text"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 8, border: 'none',
              fontSize: 11, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <FileDown size={13} strokeWidth={2} />
            {t('dayplan.pdf')}
          </button>
          {pdfHover && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 200,
              background: 'var(--bg-card, white)', color: 'var(--text-primary, #111827)',
              fontSize: 11, fontWeight: 500, padding: '5px 10px',
              borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid var(--border-faint, #e5e7eb)',
            }}>
              {t('dayplan.pdfTooltip')}
            </div>
          )}
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={async () => {
              try {
                const res = await fetch(`/api/trips/${tripId}/export.ics`, {
                  credentials: 'include',
                })
                if (!res.ok) throw new Error()
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${trip?.title || 'trip'}.ics`
                a.click()
                URL.revokeObjectURL(url)
              } catch { toast.error(t('planner.icsExportFailed')) }
            }}
            onMouseEnter={() => setIcsHover(true)}
            onMouseLeave={() => setIcsHover(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 8,
              border: '1px solid var(--border-primary)', background: 'none',
              color: 'var(--text-muted)', fontSize: 11, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <FileDown size={13} strokeWidth={2} />
            ICS
          </button>
          {icsHover && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 200,
              background: 'var(--bg-card, white)', color: 'var(--text-primary, #111827)',
              fontSize: 11, fontWeight: 500, padding: '5px 10px',
              borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid var(--border-faint, #e5e7eb)',
            }}>
              {t('dayplan.icsTooltip')}
            </div>
          )}
        </div>
        {(() => {
          const allExpanded = days.length > 0 && days.every(d => expandedDays.has(d.id))
          const label = allExpanded ? t('dayplan.collapseAll') : t('dayplan.expandAll')
          return (
            <Tooltip label={label} placement="bottom">
              <button
                onClick={() => {
                  const next = allExpanded ? new Set<number>() : new Set(days.map(d => d.id))
                  setExpandedDays(next)
                  try { sessionStorage.setItem(`day-expanded-${tripId}`, JSON.stringify([...next])) } catch {}
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
            <button
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
                fontSize: 11, fontWeight: 500, padding: '5px 10px',
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
              <button
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
      </div>
    </div>
  )
}
