import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Eyebrow, FIELD_CLS } from './PlSheetChrome'
import type { Assignment } from '../../../../types'
import type { TripPlanner } from '../MTripShell'

interface PlTimeFieldsProps {
  planner: TripPlanner
  startTime: string
  endTime: string
  onChange: (field: 'place_time' | 'end_time', value: string) => void
  /** The assignment whose times are being edited (times live per assignment). */
  assignmentId: number
  dayAssignments: Assignment[]
  /** End ≤ start — computed by the sheet so it can also disable Save. */
  hasTimeError: boolean
}

const TIME_CLS = `${FIELD_CLS} font-semibold [font-variant-numeric:tabular-nums]`

const WARNING_CLS =
  'mt-2 flex items-start gap-[6px] rounded-[10px] bg-[rgba(232,161,58,.14)] px-[10px] py-[7px] font-geist text-[0.6875rem] leading-[1.4] text-[color:var(--m-st-pending)]'

/**
 * START/END times of the place form (edit-with-assignment only), including the
 * desktop form's warnings: end before start and overlap with other timed
 * places of the same day.
 */
export default function PlTimeFields({
  planner, startTime, endTime, onChange, assignmentId, dayAssignments, hasTimeError,
}: PlTimeFieldsProps) {
  const { t } = planner

  const collisions = useMemo(() => {
    if (!startTime || startTime.length < 5) return []
    const current = dayAssignments.find(a => a.id === assignmentId)
    if (!current) return []
    const myEnd = endTime && endTime.length >= 5 ? endTime : null
    return dayAssignments.filter(a => {
      if (a.id === assignmentId || a.day_id !== current.day_id) return false
      const otherStart = a.place?.place_time
      const otherEnd = a.place?.end_time
      if (!otherStart) return false
      const s1 = startTime
      const e1 = myEnd || startTime
      const s2 = otherStart
      const e2 = otherEnd || otherStart
      return s1 < (e2 || '23:59') && s2 < (e1 || '23:59') && s1 !== e2 && s2 !== e1
    })
  }, [assignmentId, dayAssignments, startTime, endTime])

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <Eyebrow className="mb-[5px] uppercase">{t('places.startTime')}</Eyebrow>
          <input
            type="time"
            value={startTime}
            onChange={e => onChange('place_time', e.target.value)}
            className={TIME_CLS}
          />
        </div>
        <div className="min-w-0 flex-1">
          <Eyebrow className="mb-[5px] uppercase">{t('places.endTime')}</Eyebrow>
          <input
            type="time"
            value={endTime}
            onChange={e => onChange('end_time', e.target.value)}
            className={TIME_CLS}
          />
        </div>
      </div>
      {hasTimeError && (
        <div className={WARNING_CLS}>
          <AlertTriangle size={13} strokeWidth={2} className="mt-px flex-none" />
          {t('places.endTimeBeforeStart')}
        </div>
      )}
      {collisions.length > 0 && (
        <div className={WARNING_CLS}>
          <AlertTriangle size={13} strokeWidth={2} className="mt-px flex-none" />
          <span>
            {t('places.timeCollision')} {collisions.map(a => a.place?.name).filter(Boolean).join(', ')}
          </span>
        </div>
      )}
    </div>
  )
}
