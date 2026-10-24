import { useTranslation } from '../../i18n';
import DawarichDayDialog from './DawarichDayDialog';
import { JourneyRecordingActions, JourneyRecordingReview } from './JourneyRecordingReview';
import { useJourneyRecordingDay, type JourneyRecordingViewProps } from './useJourneyRecordingDay';

/**
 * Taking one day's recorded route from Dawarich into the journey (JRN-01),
 * on the desktop: the journey and the day in the head band, the preview in the
 * body, keeping it only on the button that says so.
 */
export default function JourneyRecordingDialog({
  journeyTitle,
  date,
  stored,
  onClose,
  ...rest
}: JourneyRecordingViewProps) {
  const { t } = useTranslation();
  const day = useJourneyRecordingDay({ date, onClose, ...rest });

  return (
    <DawarichDayDialog
      journeyTitle={day.preview?.journey.title ?? journeyTitle}
      date={date}
      sub={t('journey.recording.sub')}
      onClose={onClose}
      footer={<JourneyRecordingActions day={day} stored={stored} onCancel={onClose} />}
    >
      <JourneyRecordingReview day={day} stored={stored} />
    </DawarichDayDialog>
  );
}
