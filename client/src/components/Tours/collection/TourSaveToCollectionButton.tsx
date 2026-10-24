import { BookmarkPlus } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAddonStore } from '../../../store/addonStore';
import { BarButton } from '../../Planner/planParts';
import { DialogButton } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { SaveTourToCollectionDialog } from './SaveTourToCollectionDialog';
import { useSaveTourToCollection, type TourSaveTarget } from './useSaveTourToCollection';

/** The footer button with its dialog, once the Collections addon is known to be on. */
function KeepButton({ target }: { target: TourSaveTarget }) {
  const { t } = useTranslation();
  const keep = useSaveTourToCollection(target);
  return (
    <>
      <Tooltip label={t('tours.collection.saveHint')}>
        <span className="inline-flex">
          <DialogButton
            onClick={keep.show}
            aria-label={t('tours.collection.save')}
            data-testid="tour-keep-in-collection"
            icon={<BookmarkPlus size={14} strokeWidth={2} />}
          >
            <span className="max-sm:hidden">{t('tours.collection.list')}</span>
          </DialogButton>
        </span>
      </Tooltip>
      <SaveTourToCollectionDialog keep={keep} tourName={target.name} />
    </>
  );
}

/** The head band button with its dialog, waiting for the save while the tour has unsaved changes. */
function KeepBarButton({ target, unsaved }: { target: TourSaveTarget; unsaved: boolean }) {
  const { t } = useTranslation();
  const keep = useSaveTourToCollection(target);
  return (
    <>
      <BarButton
        label={t(unsaved ? 'tours.collection.saveFirst' : 'tours.collection.save')}
        tooltip={unsaved ? undefined : t('tours.collection.saveHint')}
        onClick={keep.show}
        disabled={unsaved}
        testId="tour-bar-keep-in-collection"
      >
        <BookmarkPlus size={15} strokeWidth={2} />
      </BarButton>
      <SaveTourToCollectionDialog keep={keep} tourName={target.name} />
    </>
  );
}

/**
 * LIB-03 in a tour's footer: keeps the saved tour in a collection, its own
 * action beside the GPX export, only while the Collections addon is on. The
 * tooltip says that what is kept is an independent copy.
 */
export function TourSaveToCollectionButton({ target }: { target: TourSaveTarget }) {
  const enabled = useAddonStore((state) => state.isEnabled('collections'));
  return enabled ? <KeepButton target={target} /> : null;
}

/**
 * The same action in the planner's head. A tour with unsaved changes would
 * be kept without them, so the button waits for the save and says so.
 */
export function TourSaveToCollectionBarButton({ target, unsaved }: { target: TourSaveTarget; unsaved: boolean }) {
  const enabled = useAddonStore((state) => state.isEnabled('collections'));
  return enabled ? <KeepBarButton target={target} unsaved={unsaved} /> : null;
}
