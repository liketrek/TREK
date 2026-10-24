import { Backpack, Link2, ListChecks, Loader2, Unlink } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
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
import { Tooltip } from '../../shared/Tooltip';
import { ChoiceList, ChoiceRow } from '../collection/choiceParts';
import { CategoryDot, CountBadge, DimmedLink } from './packingLinkParts';
import type { TourPackingLinkController } from './useTourPackingLink';

/** One thing to point at: its mark, its name and how many items it holds. */
function Choice({
  selected,
  onChoose,
  testId,
  mark,
  name,
  count,
}: {
  selected: boolean;
  onChoose: () => void;
  testId: string;
  mark: ReactNode;
  name: string;
  count: number;
}) {
  return (
    <ChoiceRow selected={selected} disabled={false} disabledHint="" onChoose={onChoose} testId={testId}>
      {mark}
      <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(13, 'body')}>
        {name}
      </span>
      <CountBadge count={count} />
    </ChoiceRow>
  );
}

/** Everything the tour can point at: the whole list first, then each category. */
function Choices({ packing }: { packing: TourPackingLinkController }) {
  const { t } = useTranslation();
  return (
    <DialogSection label={t('tours.packing.choose')}>
      <ChoiceList label={t('tours.packing.choose')} tall>
        <Choice
          selected={packing.choice === null}
          onChoose={() => packing.choose(null)}
          testId="tour-packing-choice-whole"
          mark={
            <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-surface-card text-content-muted shadow-sm">
              <ListChecks size={13} strokeWidth={2.2} />
            </span>
          }
          name={t('tours.packing.whole')}
          count={packing.wholeCount}
        />
        {packing.categories.map((category) => (
          <Choice
            key={category.name}
            selected={packing.choice === category.name}
            onChoose={() => packing.choose(category.name)}
            testId={`tour-packing-choice-${category.name}`}
            mark={
              <span className="grid h-6 w-6 flex-none place-items-center">
                <CategoryDot color={category.color} />
              </span>
            }
            name={category.name}
            count={category.count}
          />
        ))}
      </ChoiceList>
    </DialogSection>
  );
}

/**
 * P2D-XD-01: the dialog that points a tour at its trip's packing list, as a
 * whole or at one of its categories, each with its colour and how many items
 * it holds. It writes only through the button in its foot; letting go of a
 * link is offered there too, and neither touches the list itself. With Packing
 * off there is nothing to choose and a link cannot be made again, so it shows
 * only the dimmed link and asks before letting go of it.
 */
export function TourPackingLinkDialog({ packing, tourName }: { packing: TourPackingLinkController; tourName: string }) {
  const { t } = useTranslation();
  const labelId = useId();
  if (!packing.open) return null;
  const linkOnly = !packing.packingEnabled;
  return (
    <DialogShell
      onClose={packing.close}
      labelledBy={labelId}
      width="narrow"
      blocked={packing.saving}
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <Backpack size={20} strokeWidth={1.9} className="text-content" />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={packing.close}
          eyebrow={linkOnly ? t('tours.packing.unlink') : t('tours.packing.link')}
          title={tourName}
          sub={t('tours.packing.dialogSub')}
          subWraps
        />
      }
      footer={
        <DialogFooter>
          {packing.link && (
            <Tooltip label={t('tours.packing.unlinkHint')}>
              <span className="inline-flex">
                <DialogButton
                  onClick={() => void packing.unlink()}
                  disabled={packing.saving}
                  data-testid="tour-packing-unlink"
                  icon={<Unlink size={14} strokeWidth={2} />}
                >
                  {t('tours.packing.unlink')}
                </DialogButton>
              </span>
            </Tooltip>
          )}
          <FooterSpacer />
          <DialogButton onClick={packing.close} disabled={packing.saving}>
            {t('common.cancel')}
          </DialogButton>
          {!linkOnly && (
            <DialogButton
              variant="primary"
              data-testid="tour-packing-confirm"
              disabled={!packing.canConfirm}
              onClick={() => void packing.confirm()}
              icon={
                packing.saving ? (
                  <Loader2 size={14} strokeWidth={2} className="animate-spin" />
                ) : (
                  <Link2 size={14} strokeWidth={2} />
                )
              }
            >
              {t('tours.packing.confirm')}
            </DialogButton>
          )}
        </DialogFooter>
      }
    >
      {linkOnly && packing.link ? <DimmedLink link={packing.link} /> : <Choices packing={packing} />}
    </DialogShell>
  );
}
