import { useTranslation } from '../../i18n';
import DawarichDayDialog from './DawarichDayDialog';
import { JourneyDayImportActions, JourneyDayImportReview } from './JourneyDayImportReview';
import { useJourneyDayImport, type JourneyDayImportViewProps } from './useJourneyDayImport';

/**
 * Taking a recorded day with its stays into the journal (JRN-02), on the
 * desktop: the route, the stays and the day's entries in the body, the drafts
 * written only on the button that says how many.
 */
export default function JourneyDayImportDialog({
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
    <DawarichDayDialog
      journeyTitle={state.review?.journey.title ?? journeyTitle}
      date={date}
      sub={t('journey.dayImport.sub')}
      onClose={onClose}
      footer={<JourneyDayImportActions state={state} onCancel={onClose} />}
    >
      <JourneyDayImportReview state={state} dayColor={dayColor} prep={prep} />
    </DawarichDayDialog>
  );
}
