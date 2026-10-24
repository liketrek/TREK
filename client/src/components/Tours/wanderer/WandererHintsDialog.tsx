import type { WandererSourceHintItem } from '@trek/shared';
import { ChevronRight } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from '../../../i18n';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogShell,
  DialogTile,
  FooterSpacer,
  fs,
  NEUTRAL_TINT,
} from '../../shared/DialogShell';
import { hintWhen } from './hintWhen';
import { SourceHintPills, SourceHintTile } from './sourceHintParts';
import WandererMark from './WandererMark';

/** One hint: the tour and its trip, what the watch found, when, and the way to the tour. */
function HintRow({ hint, onOpen }: { hint: WandererSourceHintItem; onOpen: (hint: WandererSourceHintItem) => void }) {
  const { t, locale } = useTranslation();
  const when = hintWhen(hint.checkedAt, locale);
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(hint)}
        data-testid={`wanderer-hint-${hint.placeId}`}
        className="group flex w-full items-center gap-3 rounded-[14px] border border-edge-faint bg-surface-card px-3 py-2.5 text-start transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <SourceHintTile state={hint.state} />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="min-w-0 truncate font-semibold text-content" style={fs(13, 'body')}>
              {hint.tourName}
            </span>
            <span className="min-w-0 truncate text-content-faint" style={fs(11.5)}>
              {hint.tripTitle}
            </span>
          </span>
          <span className="flex flex-wrap items-center gap-1.5">
            <SourceHintPills hint={hint} />
            {when && (
              <span className="text-content-faint" style={fs(11)}>
                {t('wanderer.watch.checkedAt', { date: when })}
              </span>
            )}
          </span>
        </span>
        <span className="sr-only">{t('wanderer.watch.openTour')}</span>
        <ChevronRight
          size={15}
          strokeWidth={2.2}
          aria-hidden="true"
          className="flex-none text-content-faint transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
        />
      </button>
    </li>
  );
}

/**
 * WAN-02: the open hints of the user's wanderer watch, each leading to its
 * tour, where the source check shows what really changed. Reading only: the
 * dialog changes nothing, and a hint goes once its source was checked.
 */
export default function WandererHintsDialog({
  open,
  hints,
  onClose,
  onOpenTour,
}: {
  open: boolean;
  hints: readonly WandererSourceHintItem[];
  onClose: () => void;
  onOpenTour: (hint: WandererSourceHintItem) => void;
}) {
  const { t } = useTranslation();
  const labelId = useId();
  return (
    <DialogShell
      open={open}
      onClose={onClose}
      labelledBy={labelId}
      width="detail"
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <WandererMark size={22} />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={t('wanderer.watch.dialogTitle')}
          sub={t('wanderer.watch.hintsCount', { count: hints.length })}
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.close')}</DialogButton>
        </DialogFooter>
      }
    >
      {hints.length === 0 ? (
        <p className="m-0 text-center text-content-muted" style={fs(12.5, 'body')}>
          {t('wanderer.watch.empty')}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {hints.map((hint) => (
            <HintRow key={hint.placeId} hint={hint} onOpen={onOpenTour} />
          ))}
        </ul>
      )}
    </DialogShell>
  );
}
