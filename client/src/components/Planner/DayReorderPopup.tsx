import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { GripVertical, ArrowUp, ArrowDown, Trash2, AlertTriangle } from 'lucide-react'
import Modal from '../shared/Modal'
import Tooltip from '../shared/Tooltip'
import DayImpactList from '../shared/DayImpactList'
import { DayAddFooter, FOOTER_BTN, SECONDARY_BTN } from './DayAddFooter'
import { useNetworkMode } from '../../hooks/useNetworkMode'
import { dayLabel } from '../../utils/dayLabel'
import { deleteDayBlockedReason } from '../../utils/dayDeleteImpact'
import type { DayAddControls } from '../../utils/dayAdd'
import type { DayDeleteQuestion } from '../../utils/dayImpactLines'
import type { Day } from '../../types'

interface DayReorderPopupProps {
  isOpen: boolean
  days: Day[]
  t: (key: string, params?: Record<string, any>) => string
  locale: string
  onReorder: (orderedIds: number[]) => void
  onAddDay: () => void
  /**
   * The planner's add controls. On a trip with dates they add a second button for
   * the next calendar day; without them the footer keeps its single "Add day".
   */
  dayAdd?: DayAddControls
  /** Asks to delete a day; the planner opens the question. Without it rows have no delete button. */
  onDeleteDay?: (dayId: number) => void
  /** The open delete question, asked in place of the day list until it is answered. */
  deleteQuestion?: DayDeleteQuestion | null
  onClose: () => void
}

/** Where the list stood when the question opened, to come back to it. */
interface ListSpot {
  dayId: number
  index: number
  scrollTop: number
}

const ICON_BTN =
  'grid h-7 w-7 flex-shrink-0 place-items-center rounded-md border border-edge-faint text-content-muted transition-colors hover:bg-surface-hover hover:text-content disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-content-muted'
const DELETE_BTN =
  'grid h-7 w-7 place-items-center rounded-md text-content-faint transition-colors hover:bg-danger-soft hover:text-danger focus-visible:bg-danger-soft focus-visible:text-danger disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-content-faint'

/**
 * Modal for moving whole days around: drag a row by its grip or use the up/down
 * arrows, add a day, or delete one. Day headers stay untouched, so this is the
 * single surface for ordering. Reorders are applied optimistically by the store,
 * so the list reflects each move immediately.
 *
 * A delete only asks, and it asks right here: the dialog swaps its list for the
 * question, what goes with the day and the two ways out, at the same width. The
 * dialog hangs from a fixed top edge, so the swap only moves its bottom edge,
 * and the question takes the height it needs. Cancel and Escape bring the list
 * back where it was.
 */
export function DayReorderPopup({ isOpen, days, t, locale, onReorder, onAddDay, dayAdd, onDeleteDay, deleteQuestion, onClose }: DayReorderPopupProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const { offline } = useNetworkMode()
  const bodyRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const spot = useRef<ListSpot | null>(null)
  const titleId = useId()
  const bodyId = useId()

  const ordered = [...days].sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
  const deleteBlocked = deleteDayBlockedReason(ordered.length, offline, t)
  // A question about a day that is gone (deleted elsewhere) is no question.
  const asking = isOpen && deleteQuestion && ordered.some(d => d.id === deleteQuestion.dayId) ? deleteQuestion : null

  const move = (from: number, to: number) => {
    if (to < 0 || to >= ordered.length || from === to) return
    const ids = ordered.map(d => d.id)
    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved)
    onReorder(ids)
  }

  const ask = (dayId: number, index: number) => {
    spot.current = { dayId, index, scrollTop: bodyRef.current?.parentElement?.scrollTop ?? 0 }
    onDeleteDay?.(dayId)
  }

  // Closing the dialog also drops a question left open in it; so does the
  // dialog going away with the sidebar that holds it.
  const questionRef = useRef(deleteQuestion)
  questionRef.current = deleteQuestion
  const close = () => { questionRef.current?.onCancel(); onClose() }
  useEffect(() => { if (!isOpen) questionRef.current?.onCancel() }, [isOpen])
  useEffect(() => () => questionRef.current?.onCancel(), [])

  // Escape takes back the question, not the dialog. Captured and stopped
  // before the dialog's own listener, which would close everything.
  useEffect(() => {
    if (!asking) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      asking.onCancel()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [asking])

  // The question opens at its top with the focus on Cancel. Back at the list,
  // the scroll position and the focus return to the row asked about.
  const askedDayId = asking?.dayId ?? null
  const shownDayId = useRef<number | null>(null)
  useLayoutEffect(() => {
    const body = bodyRef.current
    // Closed with the question open: the next opening starts at the list, fresh.
    if (!body) { shownDayId.current = null; spot.current = null; return }
    if (shownDayId.current === askedDayId) return
    shownDayId.current = askedDayId
    const scroller = body.parentElement
    if (askedDayId != null) {
      if (scroller) scroller.scrollTop = 0
      cancelRef.current?.focus()
      return
    }
    const from = spot.current
    if (!from) return
    spot.current = null
    if (scroller) scroller.scrollTop = from.scrollTop
    const buttons = body.querySelectorAll<HTMLButtonElement>('[data-delete-day]')
    const again = body.querySelector<HTMLButtonElement>(`[data-delete-day="${from.dayId}"]`)
      ?? buttons[Math.min(from.index, buttons.length - 1)]
    again?.focus()
  }, [askedDayId])

  const footer = asking ? (
    <div className="flex items-center justify-end gap-2">
      <button ref={cancelRef} type="button" onClick={asking.onCancel} className={SECONDARY_BTN}>
        {t('common.cancel')}
      </button>
      <button type="button" onClick={asking.onConfirm} className={`${FOOTER_BTN} bg-danger font-semibold text-white hover:opacity-90`}>
        <Trash2 size={15} strokeWidth={2} aria-hidden="true" />
        {t('dayplan.deleteDay')}
      </button>
    </div>
  ) : (
    <DayAddFooter dayAdd={dayAdd} onAddDay={onAddDay} onClose={close} t={t} locale={locale} />
  )

  return (
    <Modal isOpen={isOpen} onClose={close} title={t('dayplan.reorderTitle')} size="lg" align="top" footer={footer}>
      <div ref={bodyRef}>
        {asking ? (
          <section aria-labelledby={titleId} aria-describedby={bodyId} className="trek-page-enter">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
                <AlertTriangle size={16} strokeWidth={2} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 id={titleId} className="text-subtitle font-semibold leading-snug text-content">{asking.title}</h3>
                <p id={bodyId} className="mt-0.5 text-caption text-content-muted">{t('dayplan.deleteDayBody')}</p>
              </div>
            </div>
            <DayImpactList lines={asking.lines} label={asking.title} />
          </section>
        ) : (
          <>
            <p className="mb-3 text-caption text-content-muted">{t('dayplan.reorderHint')}</p>

            {/* The popup is a modal, so it portals out of the planner and has to opt
                into the long-press drag itself (#1616). Without this a finger only
                selects the row text. */}
            <div data-touch-drag className="flex flex-col gap-1">
              {ordered.map((day, index) => {
                const dropTarget = overIndex === index && dragIndex !== null && dragIndex !== index
                return (
                  <div
                    key={day.id}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragEnd={() => { setDragIndex(null); setOverIndex(null) }}
                    onDragOver={e => { e.preventDefault(); if (overIndex !== index) setOverIndex(index) }}
                    onDrop={e => {
                      e.preventDefault()
                      if (dragIndex !== null && dragIndex !== index) move(dragIndex, index)
                      setDragIndex(null); setOverIndex(null)
                    }}
                    className={`flex items-center gap-2.5 rounded-lg border border-edge-faint px-2.5 py-1.5 ${
                      dropTarget ? 'bg-surface-hover outline-dashed outline-2 -outline-offset-2 outline-edge' : 'bg-surface-card'
                    } ${dragIndex === index ? 'opacity-50' : ''}`}
                  >
                    <GripVertical size={15} strokeWidth={1.8} className="flex-shrink-0 cursor-grab text-content-faint" />
                    <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-surface-hover text-caption font-semibold text-content-muted">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-body font-medium text-content">
                      {dayLabel(day, index, t, locale)}
                    </span>
                    <button
                      type="button"
                      onClick={() => move(index, index - 1)}
                      disabled={index === 0}
                      aria-label={t('dayplan.moveUp')}
                      className={ICON_BTN}
                    >
                      <ArrowUp size={14} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, index + 1)}
                      disabled={index === ordered.length - 1}
                      aria-label={t('dayplan.moveDown')}
                      className={ICON_BTN}
                    >
                      <ArrowDown size={14} strokeWidth={2} />
                    </button>
                    {onDeleteDay && (
                      <>
                        <span aria-hidden="true" className="h-5 w-px flex-shrink-0 bg-edge-faint" />
                        <Tooltip label={deleteBlocked ?? t('dayplan.deleteDay')} placement="left">
                          <span className="inline-flex flex-shrink-0">
                            <button
                              type="button"
                              data-delete-day={day.id}
                              onClick={() => ask(day.id, index)}
                              disabled={!!deleteBlocked}
                              aria-label={t('dayplan.deleteDay')}
                              className={DELETE_BTN}
                            >
                              <Trash2 size={15} strokeWidth={2} />
                            </button>
                          </span>
                        </Tooltip>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
