import { useState } from 'react'
import { localIsoDate } from '../../utils/localDate'
import { ArrowLeft, ChevronRight, Calendar } from 'lucide-react'
import { useTranslation } from '../../i18n'

/**
 * The header steps up a level on each click, days → months → years, and a
 * pick steps back down. Mirrors CustomDateTimePicker, so a person who has
 * learnt one calendar in TREK knows the other. Without it the only way to a
 * different year was one month at a time, which on a photo picker asked to
 * cover a trip three years back meant thirty-six clicks (#2318).
 */
type CalendarView = 'days' | 'months' | 'years'
const YEAR_PAGE_SIZE = 12

export function DatePicker({ value, onChange, tripDates }: {
  value: string
  onChange: (date: string) => void
  tripDates?: Set<string>
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<CalendarView>('days')
  const [yearPageStart, setYearPageStart] = useState(0)
  const [viewMonth, setViewMonth] = useState(() => {
    const d = value ? new Date(value + 'T00:00:00') : new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate()
  // Monday-first, matching CustomDateTimePicker / VacayCalendar (getDay() is Sunday=0).
  const firstDow = (new Date(viewMonth.year, viewMonth.month, 1).getDay() + 6) % 7
  const monthName = new Date(viewMonth.year, viewMonth.month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const prevMonth = () => {
    setViewMonth(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 })
  }
  const nextMonth = () => {
    setViewMonth(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 })
  }

  const handlePrev = () => {
    if (view === 'days') prevMonth()
    else if (view === 'months') setViewMonth(p => ({ ...p, year: p.year - 1 }))
    else setYearPageStart(s => s - YEAR_PAGE_SIZE)
  }
  const handleNext = () => {
    if (view === 'days') nextMonth()
    else if (view === 'months') setViewMonth(p => ({ ...p, year: p.year + 1 }))
    else setYearPageStart(s => s + YEAR_PAGE_SIZE)
  }
  const handleHeaderClick = () => {
    if (view === 'days') {
      setView('months')
    } else if (view === 'months') {
      setYearPageStart(Math.floor(viewMonth.year / YEAR_PAGE_SIZE) * YEAR_PAGE_SIZE)
      setView('years')
    }
  }
  const selectMonth = (month: number) => {
    setViewMonth(p => ({ ...p, month }))
    setView('days')
  }
  const selectYear = (year: number) => {
    setViewMonth(p => ({ ...p, year }))
    setView('months')
  }
  const toggleOpen = () => {
    // Reopening lands on the days again: a picker left on the year grid
    // would otherwise open there next time, one level away from a date.
    setView('days')
    setOpen(!open)
  }

  const prevLabel = view === 'days' ? t('common.datepicker.prevMonth')
    : view === 'months' ? t('common.datepicker.prevYear') : t('common.datepicker.prevYears')
  const nextLabel = view === 'days' ? t('common.datepicker.nextMonth')
    : view === 'months' ? t('common.datepicker.nextYear') : t('common.datepicker.nextYears')
  const headerLabel = view === 'days' ? monthName
    : view === 'months' ? String(viewMonth.year)
    : `${yearPageStart} – ${yearPageStart + YEAR_PAGE_SIZE - 1}`
  const headerAria = view === 'days' ? t('common.datepicker.selectMonth')
    : view === 'months' ? t('common.datepicker.selectYear') : undefined

  const pad = (n: number) => String(n).padStart(2, '0')

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(viewMonth.year, i).toLocaleDateString(undefined, { month: 'short' }))
  const years = Array.from({ length: YEAR_PAGE_SIZE }, (_, i) => yearPageStart + i)

  const formatted = value ? new Date(value + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null

  const navButton = 'w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500'
  const gridCell = (selected: boolean) => `h-9 rounded-lg text-[12px] font-medium flex items-center justify-center transition-colors ${
    selected
      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
  }`

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[13px] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-left flex items-center justify-between"
      >
        {formatted ? (
          <span>{formatted}</span>
        ) : (
          <span>
            <span className="hidden sm:inline">{t('journey.picker.selectDate')}</span>
            <span className="sm:hidden">{t('common.date')}</span>
          </span>
        )}
        <Calendar size={13} className="text-zinc-400" />
      </button>

      {open && (
        <>
          {/* Click-away catcher — no semantics of its own; the trigger button
              above closes the popover again from the keyboard. */}
          <div role="presentation" className="fixed inset-0 z-[10]" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-[20] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg p-3 w-[280px]">
            {/* Header: arrows step the current view, the label climbs to the next one up */}
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={handlePrev} aria-label={prevLabel} className={navButton}>
                <ArrowLeft size={14} />
              </button>
              <button
                type="button"
                onClick={handleHeaderClick}
                aria-label={headerAria}
                disabled={view === 'years'}
                className="px-2 py-1 rounded-lg text-[13px] font-semibold text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:hover:bg-transparent disabled:cursor-default"
              >
                {headerLabel}
              </button>
              <button type="button" onClick={handleNext} aria-label={nextLabel} className={navButton}>
                <ChevronRight size={14} />
              </button>
            </div>

            {view === 'months' && (
              <div className="grid grid-cols-3 gap-1">
                {monthNames.map((name, i) => (
                  <button key={name} type="button" onClick={() => selectMonth(i)} className={gridCell(i === viewMonth.month)}>
                    {name}
                  </button>
                ))}
              </div>
            )}

            {view === 'years' && (
              <div className="grid grid-cols-3 gap-1">
                {years.map(y => (
                  <button key={y} type="button" onClick={() => selectYear(y)} className={gridCell(y === viewMonth.year)}>
                    {y}
                  </button>
                ))}
              </div>
            )}

            {view === 'days' && (
              <>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-1">
                  {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-medium text-zinc-400 py-1">{d}</div>
                  ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7">
                  {cells.map((day, i) => {
                    if (day === null) return <div key={`e${i}`} />
                    const dateStr = `${viewMonth.year}-${pad(viewMonth.month + 1)}-${pad(day)}`
                    const isSelected = dateStr === value
                    const isTrip = tripDates?.has(dateStr)
                    const isToday = dateStr === localIsoDate()

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => { onChange(dateStr); setOpen(false) }}
                        className={`w-9 h-9 rounded-lg text-[12px] font-medium flex items-center justify-center relative transition-colors ${
                          isSelected
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                            : isToday
                              ? 'text-zinc-900 dark:text-white font-bold'
                              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {day}
                        {isTrip && !isSelected && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
