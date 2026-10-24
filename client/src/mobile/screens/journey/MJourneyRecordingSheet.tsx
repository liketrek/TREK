import { JourneyRecordingActions, JourneyRecordingReview } from '../../../components/Journey/JourneyRecordingReview';
import {
  useJourneyRecordingDay,
  type JourneyRecordingViewProps,
} from '../../../components/Journey/useJourneyRecordingDay';
import { useTranslation } from '../../../i18n';
import MDawarichDaySheet from './MDawarichDaySheet';

/**
 * Taking one day's recorded route from Dawarich into the journey (JRN-01), on
 * the phone: the same preview and the same buttons as the desktop dialog, in a
 * bottom sheet, for the day of the card the journey is showing.
 */
export default function MJourneyRecordingSheet({
  journeyTitle,
  date,
  stored,
  onClose,
  ...rest
}: JourneyRecordingViewProps) {
  const { t } = useTranslation();
  const day = useJourneyRecordingDay({ date, onClose, ...rest });

  return (
    <MDawarichDaySheet
      journeyTitle={day.preview?.journey.title ?? journeyTitle}
      date={date}
      sub={t('journey.recording.sub')}
      ariaLabel={t('journey.recording.takeOver')}
      onClose={onClose}
      footer={<JourneyRecordingActions day={day} stored={stored} onCancel={onClose} />}
    >
      <JourneyRecordingReview day={day} stored={stored} />
    </MDawarichDaySheet>
  );
}
