import { schoolHolidayBand } from '../../../components/Vacay/holidayVisual'
import { dayVisual, localDateStr, monthLead, type DayVisualContext } from './vacayDayModel'

interface MVacayMonthProps {
  year: number
  month: number
  /** mini = year-grid tile cells, full = single-month edit cells */
  variant: 'mini' | 'full'
  weekStart: number
  ctx: DayVisualContext
  tripDates: Set<string>
  tripDotColor: string
  onDayTap: (date: string) => void
}

/**
 * One month of day cells. The mini variant lives in the 2-column year grid
 * (6px radius, 8.5px digits), the full variant in the edit view's single
 * month card (8px radius, 12px digits). Cells are position:relative so the
 * trip-overlap dot can sit in the corner.
 */
export default function MVacayMonth({
  year, month, variant, weekStart, ctx, tripDates, tripDotColor, onDayTap,
}: MVacayMonthProps) {
  const lead = monthLead(year, month, weekStart)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const mini = variant === 'mini'

  return (
    <div className={`grid grid-cols-7 ${mini ? 'gap-[2px]' : 'gap-[3px]'}`}>
      {Array.from({ length: lead }, (_, i) => <span key={`lead-${i}`} />)}
      {Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1
        const dateStr = localDateStr(year, month, day)
        const dayOfWeek = new Date(year, month, day).getDay()
        const visual = dayVisual(dateStr, dayOfWeek, ctx)
        return (
          <button
            key={day}
            type="button"
            aria-label={dateStr}
            onClick={() => onDayTap(dateStr)}
            className={`relative flex aspect-square items-center justify-center font-geist font-bold ${
              mini ? 'rounded-[6px] text-[0.53125rem]' : 'rounded-lg text-[0.75rem]'
            }`}
            style={{ background: visual.background, color: visual.numColor, boxShadow: visual.boxShadow }}
          >
            {day}
            {tripDates.has(dateStr) && (
              <span
                aria-hidden
                className={`absolute rounded-full ${
                  mini ? 'right-[2px] top-[2px] h-[3px] w-[3px]' : 'right-[4px] top-[4px] h-[5px] w-[5px]'
                }`}
                style={{ background: tripDotColor }}
              />
            )}
            {visual.half && (
              <span
                aria-hidden
                className={`absolute rounded-full ${
                  mini ? 'right-[2px] bottom-[2px] h-[3px] w-[3px]' : 'right-[4px] bottom-[4px] h-[5px] w-[5px]'
                }`}
                style={{ background: '#f97316' }}
              />
            )}
            {visual.school && visual.school.length > 0 && (
              <span
                aria-hidden
                className={`absolute rounded-full ${
                  mini ? 'inset-x-[2px] bottom-[1.5px] h-[1.5px]' : 'inset-x-[4px] bottom-[3px] h-[2.5px]'
                }`}
                style={{ background: schoolHolidayBand(visual.school) }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
