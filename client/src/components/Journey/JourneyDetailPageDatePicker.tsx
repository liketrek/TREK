import { useState } from 'react'
import { ArrowLeft, ChevronRight, Calendar } from 'lucide-react'
import { useTranslation } from '../../i18n'

export function DatePicker({ value, onChange, tripDates }: {
  value: string
  onChange: (date: string) => void
  tripDates?: Set<string>
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
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

  const pad = (n: number) => String(n).padStart(2, '0')

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const formatted = value ? new Date(value + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
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
          <div className="fixed inset-0 z-[10]" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-[20] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg p-3 w-[280px]">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={prevMonth} className="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500">
                <ArrowLeft size={14} />
              </button>
              <span className="text-[13px] font-semibold text-zinc-900 dark:text-white">{monthName}</span>
              <button type="button" onClick={nextMonth} className="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500">
                <ChevronRight size={14} />
              </button>
            </div>

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
                const isToday = dateStr === new Date().toISOString().split('T')[0]

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
          </div>
        </>
      )}
    </div>
  )
}
