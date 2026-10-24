import { AlertTriangle, Bookmark, BookmarkPlus, Loader2, MapPin, WifiOff } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from '../../../i18n';
import { WhiteBadge } from '../../Planner/planParts';
import { EditorField, INPUT } from '../../shared/dialogParts';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogShell,
  DialogTile,
  FooterSpacer,
  fs,
  NEUTRAL_TINT,
} from '../../shared/DialogShell';
import { TourNotice } from '../tourParts';
import { ChoiceList, ChoiceRow } from './choiceParts';
import type { CollectionChoice, SaveTourToCollection } from './useSaveTourToCollection';

/** One list to keep the tour in: its colour, its name and how many places it holds. */
function ListRow({
  choice,
  selected,
  onChoose,
}: {
  choice: CollectionChoice;
  selected: boolean;
  onChoose: () => void;
}) {
  const { t } = useTranslation();
  const { collection, canAdd } = choice;
  return (
    <ChoiceRow
      selected={selected}
      disabled={!canAdd}
      disabledHint={t('tours.collection.readOnly')}
      onChoose={onChoose}
      testId={`keep-tour-list-${collection.id}`}
    >
      {/* The list's own colour, as the collections rail shows it. */}
      <span
        className="h-2.5 w-2.5 flex-none rounded-full"
        style={{ background: collection.color || 'var(--accent)' }}
      />
      <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(13, 'body')}>
        {collection.name}
      </span>
      {collection.place_count != null && (
        <WhiteBadge icon={<MapPin size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}>
          {collection.place_count}
        </WhiteBadge>
      )}
    </ChoiceRow>
  );
}

/** The lists, or what stands in their place: loading, offline, failed with a retry, none yet. */
function Lists({ keep }: { keep: SaveTourToCollection }) {
  const { t } = useTranslation();
  if (keep.status === 'loading')
    return (
      <p role="status" className="m-0 flex items-center justify-center py-6 text-content-faint">
        <Loader2 size={18} strokeWidth={2.2} className="animate-spin" />
        <span className="sr-only">{t('common.loading')}</span>
      </p>
    );
  if (keep.status === 'offline')
    return <TourNotice icon={<WifiOff size={13} strokeWidth={2} />}>{t('tours.collection.offline')}</TourNotice>;
  if (keep.status === 'error')
    return (
      <TourNotice tone="warning" icon={<AlertTriangle size={13} strokeWidth={2} />}>
        <span className="flex flex-wrap items-center gap-2">
          {t('tours.collection.listsFailed')}
          <button type="button" onClick={keep.retry} className="font-semibold underline underline-offset-2">
            {t('tours.planner.retry')}
          </button>
        </span>
      </TourNotice>
    );
  if (keep.choices.length === 0)
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-5 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-surface-secondary text-content-faint">
          <Bookmark size={20} strokeWidth={1.9} />
        </span>
        <p className="m-0 text-content-muted" style={fs(12.5, 'body')}>
          {t('tours.collection.noLists')}
        </p>
        <DialogButton onClick={keep.openCollections} icon={<Bookmark size={14} strokeWidth={2} />}>
          {t('tours.collection.openCollections')}
        </DialogButton>
      </div>
    );
  return (
    <ChoiceList label={t('tours.collection.list')} tall>
      {keep.choices.map((choice) => (
        <ListRow
          key={choice.collection.id}
          choice={choice}
          selected={keep.listId === choice.collection.id}
          onChoose={() => keep.choose(choice.collection.id)}
        />
      ))}
    </ChoiceList>
  );
}

/**
 * LIB-03: the dialog that keeps a saved tour in a collection. It names the
 * tour, lets the user pick a list they may add to and the name it is kept
 * under, and keeps it only through the button in its foot.
 */
export function SaveTourToCollectionDialog({ keep, tourName }: { keep: SaveTourToCollection; tourName: string }) {
  const { t } = useTranslation();
  const labelId = useId();
  const nameId = useId();
  if (!keep.open) return null;
  return (
    <DialogShell
      onClose={keep.close}
      labelledBy={labelId}
      width="narrow"
      blocked={keep.saving}
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <BookmarkPlus size={20} strokeWidth={1.9} className="text-content" />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={keep.close}
          eyebrow={t('tours.collection.save')}
          title={tourName}
          sub={t('tours.collection.saveSub')}
          subWraps
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={keep.close} disabled={keep.saving}>
            {t('common.cancel')}
          </DialogButton>
          <DialogButton
            variant="primary"
            data-testid="keep-tour-confirm"
            disabled={!keep.canConfirm}
            onClick={() => void keep.confirm()}
            icon={
              keep.saving ? (
                <Loader2 size={14} strokeWidth={2} className="animate-spin" />
              ) : (
                <BookmarkPlus size={14} strokeWidth={2} />
              )
            }
          >
            {t('tours.collection.keep')}
          </DialogButton>
        </DialogFooter>
      }
    >
      <DialogSection label={t('tours.collection.list')}>
        <Lists keep={keep} />
      </DialogSection>
      {keep.status === 'ready' && keep.choices.length > 0 && (
        <EditorField label={t('tours.collection.nameThere')} htmlFor={nameId}>
          <input
            id={nameId}
            className={INPUT}
            value={keep.name}
            maxLength={255}
            onChange={(event) => keep.setName(event.target.value)}
          />
        </EditorField>
      )}
    </DialogShell>
  );
}
