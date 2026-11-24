import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Eyebrow, FIELD_CLS } from './PlSheetChrome'
import CustomTimePicker from '../../../../components/shared/CustomTimePicker'
import { VisitStayInput } from '../../../../components/Planner/VisitStayInput'
import { timeCollisions } from '../../../../components/Planner/PlaceFormModal.helpers'
import type { Assignment } from '../../../../types'
import { TourEndHint } from '../../../../components/Tours/TourDayTimeParts'
import type { TripPlanner } from '../MTripShell'

interface PlTimeFieldsProps {
  planner: TripPlanner
  startTime: string
  endTime: string
  stay?: string
  onChange: (field: 'place_time' | 'end_time' | 'assignment_stay', value: string) => void
  /** The assignment whose times are being edited (times live per assignment). */
  assignmentId: number
  dayAssignments: Assignment[]
  /** End ≤ start — computed by the sheet so it can also disable Save. */
  hasTimeError: boolean
}

const WARNING_CLS =
  'mt-2 flex items-start gap-[6px] rounded-[10px] bg-[rgba(232,161,58,.14)] px-[10px] py-[7px] font-geist text-[0.6875rem] leading-[1.4] text-[color:var(--m-st-pending)]'

/**
 * START/END times of the place form (edit-with-assignment only), including the
 * desktop form's warnings: end before start and overlap with other timed
 * places of the same day.
 */
export default function PlTimeFields({
  planner, startTime, endTime, stay, onChange, assignmentId, dayAssignments, hasTimeError,
}: PlTimeFieldsProps) {
  const { t } = planner
  // Opened from the road trip tab, where the End of a visit is when the drive leaves it.
  // The plan tab reads the day as Days does, and there End stays a plain label.
  const endIsLeave = planner.activeTab === 'roadtrip'

  // The other visits of the same day whose times overlap this one's, as the desktop form warns.
  const collisions = useMemo(
    () => timeCollisions(assignmentId, dayAssignments, startTime, endTime),
    [assignmentId, dayAssignments, startTime, endTime],
  )
  // TIME-02: a tour's end follows from its start and its time while none is typed.
  const assignment = dayAssignments.find(a => a.id === assignmentId)
  const stayLabel = `${t('roadtrip.stop.stayShort')} (${t('roadtrip.limit.minutes')})`
  const tour = assignment ? planner.tours.find(item => item.place_id === assignment.place_id) : undefined

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <Eyebrow className="mb-[5px] uppercase">{t('places.startTime')}</Eyebrow>
          <CustomTimePicker value={startTime} onChange={v => onChange('place_time', v)} />
        </div>
        <div className="min-w-0 flex-1">
          <Eyebrow className="mb-[5px] uppercase">{t('places.endTime')}</Eyebrow>
          <CustomTimePicker value={endTime} onChange={v => onChange('end_time', v)} />
          {(endIsLeave || !tour) && (
            <div className="mt-[5px] font-geist text-[0.65625rem] leading-snug text-m-faint">{t(endIsLeave ? 'roadtrip.stop.endIsLeave' : 'timing.fixedEndHint')}</div>
          )}
        </div>
      </div>
      {assignment && (
        <div className="mt-2">
          <Eyebrow className="mb-[5px] uppercase">{stayLabel}</Eyebrow>
          <VisitStayInput
            assignment={assignment}
            label={stayLabel}
            value={stay}
            onChange={value => onChange('assignment_stay', value)}
            className={FIELD_CLS}
          />
        </div>
      )}
      <TourEndHint start={startTime} end={endTime} assignment={assignment} tour={tour} mobile />
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
