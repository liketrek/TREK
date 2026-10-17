import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Eyebrow } from './PlSheetChrome'
import CustomTimePicker from '../../../../components/shared/CustomTimePicker'
import { timeCollisions } from '../../../../components/Planner/PlaceFormModal.helpers'
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
  // Opened from the road trip tab, where the End of a visit is when the drive leaves it.
  // The plan tab reads the day as Days does, and there End stays a plain label.
  const endIsLeave = planner.activeTab === 'roadtrip'

  // The other visits of the same day whose times overlap this one's, as the desktop form warns.
  const collisions = useMemo(
    () => timeCollisions(assignmentId, dayAssignments, startTime, endTime),
    [assignmentId, dayAssignments, startTime, endTime],
  )

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
          {endIsLeave && (
            <div className="mt-[5px] font-geist text-[0.65625rem] leading-snug text-m-faint">{t('roadtrip.stop.endIsLeave')}</div>
          )}
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
