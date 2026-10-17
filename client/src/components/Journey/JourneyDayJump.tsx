import { useEffect, useRef, useState, type RefObject } from 'react'
import { CalendarDays, ChevronDown, ChevronRight } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { Tooltip } from '../shared/Tooltip'

export interface JumpDay {
  date: string
  color: string
  entries: { id: number; title: string }[]
}

/** Scrolls the feed to a day header or an entry card, by the marks the timeline puts on them. */
function scrollFeedTo(feed: HTMLElement | null, selector: string) {
  feed?.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/**
 * Where the desktop journal is, and a way to anywhere else in it (#1243): a pill
 * among the jump buttons that opens every day, each day opening onto its entries.
 * Picking one scrolls the feed there, so a long journey no longer means scrolling
 * past every photo to reach the day being written up.
 */
export default function JourneyDayJump({ days, feedRef }: { days: JumpDay[]; feedRef: RefObject<HTMLDivElement | null> }) {
  const { t, locale } = useTranslation()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  if (days.length < 2) return null
  const dateLabel = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })

  const goDay = (date: string) => { setOpen(false); scrollFeedTo(feedRef.current, `[data-day="${date}"]`) }
  const goEntry = (id: number) => { setOpen(false); scrollFeedTo(feedRef.current, `[data-entry-id="${id}"]`) }

  return (
    <div ref={boxRef} className="relative">
      <Tooltip label={t('journey.detail.dayJump')} placement="top" disabled={open}>
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={t('journey.detail.dayJump')}
          className="h-8 rounded-full px-3 inline-flex items-center gap-1.5 shadow-md text-[12px] font-semibold"
          style={{ background: 'var(--vg-surf)', border: '1px solid var(--vg-line)', color: 'var(--vg-ink)' }}>
          <CalendarDays size={14} strokeWidth={2.2} />
          {t('journey.detail.dayJumpCount', { count: days.length })}
        </button>
      </Tooltip>
      {open && (
        <div role="menu" className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[300px] max-h-[60vh] overflow-y-auto rounded-2xl p-1.5 shadow-xl"
          style={{ background: 'var(--vg-surf)', border: '1px solid var(--vg-line)' }}>
          {days.map((day, i) => {
            const isOpen = expanded === day.date
            return (
              <div key={day.date}>
                <div className="flex items-center gap-1">
                  <button type="button" role="menuitem" onClick={() => goDay(day.date)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-1.5 text-start hover:bg-[color:var(--vg-surf2)]">
                    <span className="grid h-6 w-6 flex-none place-items-center rounded-lg text-[11px] font-bold text-white" style={{ background: day.color }}>{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold" style={{ color: 'var(--vg-ink)' }}>{dateLabel(day.date)}</span>
                    <span className="flex-none rounded-full px-1.5 text-[10px] font-bold tabular-nums" style={{ background: 'var(--vg-surf2)', color: 'var(--vg-ink3)' }}>{day.entries.length}</span>
                  </button>
                  {day.entries.length > 0 && (
                    <button type="button" onClick={() => setExpanded(isOpen ? null : day.date)} aria-expanded={isOpen}
                      aria-label={isOpen ? t('common.collapse') : t('common.expand')}
                      className="grid h-7 w-7 flex-none place-items-center rounded-full hover:bg-[color:var(--vg-surf2)]" style={{ color: 'var(--vg-ink3)' }}>
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                </div>
                {isOpen && day.entries.map(entry => (
                  <button key={entry.id} type="button" role="menuitem" onClick={() => goEntry(entry.id)}
                    className="flex w-full items-center gap-2 rounded-lg py-1 ps-11 pe-2 text-start text-[12px] hover:bg-[color:var(--vg-surf2)]" style={{ color: 'var(--vg-ink2)' }}>
                    <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: day.color }} />
                    <span className="min-w-0 truncate">{entry.title}</span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
