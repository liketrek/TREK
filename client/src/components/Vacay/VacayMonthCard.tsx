import { useMemo } from 'react'
import { useTranslation } from '../../i18n'
import type { HolidaysMap, VacayEntry } from '../../types'
import { schoolHolidayBand, schoolHolidayWash } from './holidayVisual'

const WEEKDAY_KEYS = ['vacay.mon', 'vacay.tue', 'vacay.wed', 'vacay.thu', 'vacay.fri', 'vacay.sat', 'vacay.sun'] as const

interface VacayMonthCardProps {
  year: number
  month: number
  holidays: HolidaysMap
  companyHolidaySet: Set<string>
  companyHolidaysEnabled?: boolean
  entryMap: Record<string, VacayEntry[]>
  // Shared read-only calendars per date (#444/#667) — rendered as rings, not fills.
  sharedMap?: Record<string, { color: string }[]>
  onCellClick: (date: string) => void
  onCellHover?: (date: string | null, el: HTMLElement | null) => void
  companyMode: boolean
  blockWeekends: boolean
  weekendDays?: number[]
  tripDates?: Set<string>
  weekStart?: number
}

export default function VacayMonthCard({
  year, month, holidays, companyHolidaySet, companyHolidaysEnabled = true, entryMap, sharedMap,
  onCellClick, onCellHover, companyMode, blockWeekends, weekendDays = [0, 6], tripDates, weekStart = 1
}: VacayMonthCardProps) {
  const { t, locale } = useTranslation()

  const WEEKDAY_KEYS_SUNDAY = ['vacay.sun', 'vacay.mon', 'vacay.tue', 'vacay.wed', 'vacay.thu', 'vacay.fri', 'vacay.sat'] as const
  const orderedKeys = weekStart === 0 ? WEEKDAY_KEYS_SUNDAY : WEEKDAY_KEYS
  const weekdays = orderedKeys.map(k => t(k))
  const monthName = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(year, month, 1)), [locale, year, month])

  const weeks = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    let startDow = firstDay.getDay() - weekStart
    if (startDow < 0) startDow += 7
    const cells = []
    for (let i = 0; i < startDow; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    // Always pad to 6 full weeks (42 cells) so every month card is the same height,
    // regardless of how many week-rows the month actually spans.
    while (cells.length < 42) cells.push(null)
    const w = []
    for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7))
    return w
  }, [year, month, weekStart])

  const pad = (n: number) => String(n).padStart(2, '0')
  // Optimistic toggles synthesize an entry that can briefly lack person_color;
  // fall back to the default so the cell paints instantly instead of staying
  // transparent until the server refetch lands (mirrors the mobile calendar).
  const pc = (c?: string) => c || '#6366f1'
  // Soften the person colour a touch so the filled days don't look overly loud
  // against the light glass surface (the raw colour reads very saturated).
  const fill = (c?: string) => `color-mix(in srgb, ${pc(c)} 78%, transparent)`
  // Comp/Flex days (#1074) render as a diagonal hatch of the person colour (Version B),
  // so a comp segment reads as "reserved but free" — distinct from a solid vacation fill.
  const hatch = (c?: string) => `repeating-linear-gradient(45deg, ${fill(c)} 0 3px, transparent 3px 6px)`
  const segFill = (e: VacayEntry) => (e.kind === 'comp' ? hatch(e.person_color) : fill(e.person_color))

  const todayStr = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  return (
    <div className="vg-card rounded-[22px]" style={{ padding: '15px 16px 14px' }}>
      <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--vg-ink)', marginBottom: 9, paddingLeft: 2 }} className="capitalize">
        {monthName}
      </div>

      <div className="grid grid-cols-7" style={{ gap: 3, marginBottom: 6 }}>
        {weekdays.map((wd, i) => {
          // Map column index back to JS day (0=Sun..6=Sat) to fade the weekend columns.
          const jsDay = (i + weekStart) % 7
          const isWeekendCol = weekendDays.includes(jsDay)
          return (
            <span key={`${wd}-${i}`} style={{
              textAlign: 'center',
              fontFamily: 'var(--font-subtext)',
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: isWeekendCol ? 'color-mix(in srgb, var(--vg-ink3) 55%, transparent)' : 'var(--vg-ink3)',
            }}>
              {wd}
            </span>
          )
        })}
      </div>

      <div className="grid grid-cols-7" style={{ gap: 4 }}>
        {weeks.flat().map((day, di) => {
          if (day === null) return <div key={di} style={{ height: 28 }} />

          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
          const dayOfWeek = new Date(year, month, day).getDay()
          const weekend = weekendDays.includes(dayOfWeek)
          const rawHolidayMarkers = holidays[dateStr]
          const holidayMarkers = Array.isArray(rawHolidayMarkers) ? rawHolidayMarkers : rawHolidayMarkers ? [rawHolidayMarkers] : []
          const publicHoliday = holidayMarkers.find(h => (h.type ?? 'public_holiday') === 'public_holiday')
          const schoolHolidayMarkers = holidayMarkers.filter(h => h.type === 'school_holiday')
          const isCompany = companyHolidaysEnabled && companyHolidaySet.has(dateStr)
          const dayEntries = entryMap[dateStr] || []
          const hasEntries = dayEntries.length > 0
          // A blocked weekend day that still carries an entry (#1897) stays clickable —
          // the click clears the stranded day rather than logging a new one.
          const isBlocked = (weekend && blockWeekends && !hasEntries) || (isCompany && !companyMode)
          const isToday = dateStr === todayStr
          const plain = !hasEntries && holidayMarkers.length === 0 && !isCompany

          // The fill always shows WHO is off (person colour, split for several) — half
          // days keep that fill and get a small corner ½ badge instead, so a half day
          // never collides with the two-person diagonal split (#552).
          const anyHalf = dayEntries.some(e => (e.fraction ?? 1) === 0.5)

          // Shared calendars mark the day with an inset ring per person (capped at
          // two — the tooltip lists everyone), keeping them visually apart from the
          // filled member days.
          const sharedColors = [...new Set((sharedMap?.[dateStr] || []).map(m => m.color))].slice(0, 2)

          // Cell fill — people win, then company, then holiday (keeps each calendar's own colour).
          let background = 'transparent'
          if (dayEntries.length === 1) background = segFill(dayEntries[0])
          // 2 people render via the diagonal overlay below, so each half can be a solid
          // vacation fill or a hatched comp fill independently (#1074).
          else if (dayEntries.length === 0 && isCompany) background = 'rgba(245,158,11,0.22)'
          else if (dayEntries.length === 0 && publicHoliday) background = `color-mix(in srgb, ${publicHoliday.color} 22%, transparent)`
          // A plain school-break day gets a soft wash of its calendar colour so a run of
          // days reads as one gentle stretch; the rounded band below names the calendar.
          else if (dayEntries.length === 0 && schoolHolidayMarkers.length > 0) background = schoolHolidayWash(schoolHolidayMarkers[0].color)
          // Weekend / settings-blocked days read as inactive: subtle grey fill, like before the facelift.
          else if (weekend && blockWeekends) background = 'color-mix(in srgb, var(--vg-ink3) 7%, transparent)'

          // Rings — today's inset outline first, then one ring per shared calendar
          // nested inside it; the entry drop-shadow stays as an outer glow.
          const shadows: string[] = []
          if (isToday) shadows.push('inset 0 0 0 2px var(--vg-ink)')
          sharedColors.forEach((c, i) => shadows.push(`inset 0 0 0 ${(isToday ? 2 : 0) + (i + 1) * 2}px ${c}`))
          if (!isToday && hasEntries) shadows.push(`0 3px 8px -3px ${pc(dayEntries[0].person_color)}`)
          const boxShadow = shadows.length > 0 ? shadows.join(', ') : undefined

          let numColor = 'var(--vg-ink2)'
          if (hasEntries) numColor = '#fff'
          else if (publicHoliday) numColor = publicHoliday.color
          else if (weekend) numColor = 'var(--vg-ink3)'
          // An all-comp cell is hatched, so the card surface shows through between
          // the stripes and would swallow the white digit. A shadow carries the
          // contrast instead, which keeps every logged day's number white (#1074).
          // A mixed day still has a solid segment under the number and needs none.
          const numShadow = hasEntries && dayEntries.every(e => e.kind === 'comp')
            ? '0 1px 2px rgba(0,0,0,0.85), 0 0 3px rgba(0,0,0,0.5)'
            : undefined

          return (
            <div
              key={di}
              title={publicHoliday ? (publicHoliday.label ? `${publicHoliday.label}: ${publicHoliday.localName}` : publicHoliday.localName) : undefined}
              // Stays a div: the cell is a grid item that stacks the segment,
              // ring and marker overlays on top of itself.
              role="button"
              tabIndex={0}
              className="relative flex items-center justify-center transition-colors"
              style={{
                height: 28,
                borderRadius: 10,
                background,
                boxShadow,
                cursor: isBlocked ? 'default' : 'pointer',
              }}
              onClick={() => onCellClick(dateStr)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCellClick(dateStr) } }}
              onMouseEnter={e => {
                if (!isBlocked && plain) e.currentTarget.style.background = 'var(--vg-surf2)'
                if (hasEntries || sharedColors.length > 0 || schoolHolidayMarkers.length > 0) onCellHover?.(dateStr, e.currentTarget)
              }}
              onMouseLeave={e => {
                if (!isBlocked && plain) e.currentTarget.style.background = background
                if (hasEntries || sharedColors.length > 0 || schoolHolidayMarkers.length > 0) onCellHover?.(null, null)
              }}
            >
              {/* 2 people: diagonal split — each half solid (vacation) or hatched (comp) (#1074). */}
              {dayEntries.length === 2 && (
                <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 10 }}>
                  <div className="absolute inset-0" style={{ background: segFill(dayEntries[0]), clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
                  <div className="absolute inset-0" style={{ background: segFill(dayEntries[1]), clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />
                </div>
              )}
              {/* 3+ people: quadrant overlay (1 uses the cell background, 2 the diagonal above). */}
              {dayEntries.length === 3 && (
                <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 10 }}>
                  <div className="absolute top-0 left-0 w-1/2 h-full" style={{ background: segFill(dayEntries[0]) }} />
                  <div className="absolute top-0 right-0 w-1/2 h-1/2" style={{ background: segFill(dayEntries[1]) }} />
                  <div className="absolute bottom-0 right-0 w-1/2 h-1/2" style={{ background: segFill(dayEntries[2]) }} />
                </div>
              )}
              {dayEntries.length >= 4 && (
                <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 10 }}>
                  <div className="absolute top-0 left-0 w-1/2 h-1/2" style={{ background: segFill(dayEntries[0]) }} />
                  <div className="absolute top-0 right-0 w-1/2 h-1/2" style={{ background: segFill(dayEntries[1]) }} />
                  <div className="absolute bottom-0 left-0 w-1/2 h-1/2" style={{ background: segFill(dayEntries[2]) }} />
                  <div className="absolute bottom-0 right-0 w-1/2 h-1/2" style={{ background: segFill(dayEntries[3]) }} />
                </div>
              )}

              {tripDates?.has(dateStr) && (
                <span className="absolute top-1 right-1 w-[5px] h-[5px] rounded-full z-[2] bg-[#3b82f6]" style={{ boxShadow: '0 0 0 1.5px var(--vg-surf)' }} />
              )}

              {/* Half day (#552): a small orange corner dot, mirroring the blue trip dot.
                  The hover tooltip spells out who is on a half day. */}
              {anyHalf && (
                <span className="absolute bottom-1 right-1 w-[5px] h-[5px] rounded-full z-[3] bg-[#f97316]" style={{ boxShadow: '0 0 0 1.5px var(--vg-surf)' }} aria-hidden />
              )}

              {schoolHolidayMarkers.length > 0 && (
                <span
                  className="absolute rounded-full z-[2]"
                  style={{
                    left: 4,
                    right: 4,
                    bottom: 3,
                    height: 3,
                    background: schoolHolidayBand(schoolHolidayMarkers.map(h => h.color)),
                  }}
                  aria-hidden
                />
              )}

              <span className="relative z-[1]" style={{
                fontFamily: 'var(--font-subtext)',
                fontSize: 12,
                fontWeight: (hasEntries || isToday) ? 700 : 500,
                color: numColor,
                textShadow: numShadow,
              }}>
                {day}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
