import type { TourListItem } from '@trek/shared';
import { AlertTriangle } from 'lucide-react';
import { useId, useMemo } from 'react';

import type { Assignment } from '../../types';
import CustomTimePicker from '../shared/CustomTimePicker';
import { EditorField, GRID_2 } from '../shared/dialogParts';
import { fs } from '../shared/DialogShell';
import { TourEndHint } from '../Tours/TourDayTimeParts';
import { timeCollisions, type PlaceFormData } from './PlaceFormModal.helpers';

type Translate = (key: string, params?: Record<string, string | number>) => string;

const WARNING_BANNER = 'flex items-start gap-1.5 rounded-[10px] bg-warning-soft px-2.5 py-1.5 text-warning';

interface TimeSectionProps {
  form: PlaceFormData;
  handleChange: (field: string, value: string) => void;
  assignmentId: number | null;
  dayAssignments: Assignment[];
  hasTimeError: boolean;
  /** On a road trip the End is when the drive leaves, which the field says. In Days it
   *  stays the plain label it has always been: nothing is scheduled off it there. */
  endIsLeave: boolean;
  /** TIME-02: the tour this place is, whose end the time fields work out from its start. */
  tour?: TourListItem | null;
  t: Translate;
}

/** The place form's start and end time, with the warnings about them and a tour's worked-out end. */
export function TimeSection({
  form,
  handleChange,
  assignmentId,
  dayAssignments,
  hasTimeError,
  endIsLeave,
  tour,
  t,
}: TimeSectionProps) {
  const collisions = useMemo(
    () => timeCollisions(assignmentId, dayAssignments, form.place_time, form.end_time),
    [assignmentId, dayAssignments, form.place_time, form.end_time]
  );
  const errorId = useId();

  return (
    <div className="flex flex-col gap-2">
      <div className={GRID_2}>
        <EditorField label={t('places.startTime')}>
          <CustomTimePicker
            value={form.place_time}
            onChange={(v) => handleChange('place_time', v)}
            aria-label={t('places.startTime')}
          />
        </EditorField>
        <EditorField label={t('places.endTime')} hint={endIsLeave ? t('roadtrip.stop.endIsLeave') : undefined}>
          <CustomTimePicker
            value={form.end_time}
            onChange={(v) => handleChange('end_time', v)}
            aria-label={t('places.endTime')}
            aria-invalid={hasTimeError}
            aria-describedby={hasTimeError ? errorId : undefined}
          />
        </EditorField>
      </div>
      <TourEndHint
        start={form.place_time}
        end={form.end_time}
        assignment={dayAssignments.find((a) => a.id === assignmentId)}
        tour={tour}
      />
      {hasTimeError && (
        <div id={errorId} className={WARNING_BANNER} style={fs(12, 'body')}>
          <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          {t('places.endTimeBeforeStart')}
        </div>
      )}
      {collisions.length > 0 && (
        <div className={WARNING_BANNER} style={fs(12, 'body')}>
          <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            {t('places.timeCollision')}{' '}
            {collisions
              .map((a) => a.place?.name)
              .filter(Boolean)
              .join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}
