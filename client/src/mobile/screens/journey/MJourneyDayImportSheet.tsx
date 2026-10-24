import { JourneyDayImportActions, JourneyDayImportReview } from '../../../components/Journey/JourneyDayImportReview';
import { useJourneyDayImport, type JourneyDayImportViewProps } from '../../../components/Journey/useJourneyDayImport';
import { useTranslation } from '../../../i18n';
import MDawarichDaySheet from './MDawarichDaySheet';

/**
 * Taking a recorded day with its stays into the journal (JRN-02), on the
 * phone: the same review and the same buttons as the desktop dialog, in a
 * bottom sheet, for the day of the card the journey is showing.
 */
export default function MJourneyDayImportSheet({
  journeyTitle,
  date,
  dayColor,
  onClose,
  prep,
  ...rest
}: JourneyDayImportViewProps) {
  const { t } = useTranslation();
  const state = useJourneyDayImport({ date, dayColor, onClose, ...rest });

  return (
    <MDawarichDaySheet
      journeyTitle={state.review?.journey.title ?? journeyTitle}
      date={date}
      sub={t('journey.dayImport.sub')}
      ariaLabel={t('journey.dayImport.open')}
      onClose={onClose}
      footer={<JourneyDayImportActions state={state} onCancel={onClose} />}
    >
      <JourneyDayImportReview state={state} dayColor={dayColor} prep={prep} />
    </MDawarichDaySheet>
  );
}
