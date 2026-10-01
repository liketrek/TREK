import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { GripVertical, ArrowUp, ArrowDown, ArrowUpDown, Trash2, AlertTriangle } from 'lucide-react'
import { DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import Tooltip from '../shared/Tooltip'
import DayImpactList from '../shared/DayImpactList'
import { DayAddFooter } from './DayAddFooter'
import { useNetworkMode } from '../../hooks/useNetworkMode'
import { dayLabel } from '../../utils/dayLabel'
import { deleteDayBlockedReason } from '../../utils/dayDeleteImpact'
import type { DayAddControls } from '../../utils/dayAdd'
import type { DayDeleteQuestion } from '../../utils/dayImpactLines'
import type { Day } from '../../types'

interface DayReorderPopupProps {
  isOpen: boolean
  days: Day[]
  t: (key: string, params?: Record<string, string | number>) => string
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
  'grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-content-muted transition-colors hover:bg-surface-hover hover:text-content disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-content-muted'
const DELETE_BTN =
  'grid h-7 w-7 place-items-center rounded-full text-content-faint transition-colors hover:bg-danger-soft hover:text-danger focus-visible:bg-danger-soft focus-visible:text-danger disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-content-faint'
/** The question's answers, in the footer buttons' size. */
const CANCEL_BTN = 'inline-flex items-center gap-1.5 rounded-[10px] bg-surface-tertiary px-3.5 py-2 font-medium text-content hover:bg-surface-hover'
const DANGER_BTN = 'inline-flex items-center gap-1.5 rounded-[10px] bg-danger px-4 py-2 font-semibold text-white hover:opacity-90' // theme-lint-disable: white on the danger fill, as ConfirmDialog draws it

/**
 * Dialog for moving whole days around: drag a row by its grip or use the up/down
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
  const dialogTitleId = useId()
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

  // Escape takes back the question, not the dialog: the dialog is blocked
  // while it asks, and the key is caught before anything under it sees it.
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

  const header = (
    <DialogHeader
      tile={<DialogTile><ArrowUpDown size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
      tint={NEUTRAL_TINT}
      labelId={dialogTitleId}
      onClose={close}
      title={t('dayplan.reorderTitle')}
    />
  )

  const footer = asking ? (
    <DialogFooter>
      <FooterSpacer />
      <button ref={cancelRef} type="button" onClick={asking.onCancel} className={CANCEL_BTN} style={fs(13, 'body')}>
        {t('common.cancel')}
      </button>
      <button type="button" onClick={asking.onConfirm} className={DANGER_BTN} style={fs(13, 'body')}>
        <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
        {t('dayplan.deleteDay')}
      </button>
    </DialogFooter>
  ) : (
    <DayAddFooter dayAdd={dayAdd} onAddDay={onAddDay} onClose={close} t={t} locale={locale} />
  )

  return (
    <DialogShell open={isOpen} onClose={close} labelledBy={dialogTitleId} width="narrow" align="top" blocked={!!asking} header={header} footer={footer}>
      <div ref={bodyRef}>
        {asking ? (
          <section aria-labelledby={titleId} aria-describedby={bodyId} className="trek-page-enter">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-danger-soft text-danger">
                <AlertTriangle size={16} strokeWidth={2} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 id={titleId} className="m-0 font-bold leading-snug text-content" style={fs(15, 'subtitle')}>{asking.title}</h3>
                <p id={bodyId} className="m-0 mt-0.5 text-content-muted" style={fs(12.5, 'body')}>{t('dayplan.deleteDayBody')}</p>
              </div>
            </div>
            <DayImpactList lines={asking.lines} label={asking.title} />
          </section>
        ) : (
          <>
            <p className="m-0 mb-3 text-content-muted" style={fs(12.5, 'body')}>{t('dayplan.reorderHint')}</p>

            {/* The dialog portals out of the planner, so it has to opt into the
                long-press drag itself (#1616). Without this a finger only
                selects the row text. */}
            <div data-touch-drag className="flex flex-col gap-1.5">
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
                    className={`flex items-center gap-2.5 rounded-[14px] border border-edge-faint py-2 pl-2.5 pr-2 ${
                      dropTarget ? 'bg-surface-hover outline-dashed outline-2 -outline-offset-2 outline-edge' : 'bg-surface-card'
                    } ${dragIndex === index ? 'opacity-50' : ''}`}
                  >
                    <GripVertical size={15} strokeWidth={1.8} className="flex-shrink-0 cursor-grab text-content-faint" />
                    <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-surface-tertiary font-geist font-bold tabular-nums text-content-muted" style={fs(11)}>
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(13.5, 'body')}>
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
    </DialogShell>
  )
}
