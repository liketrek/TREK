import { CalendarDays, CalendarRange } from 'lucide-react';
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
import { tourDayChoices, type TourDayHow, type TourDayQuestion } from './stageSpread';

interface TourDayChoiceDialogProps {
  question: TourDayQuestion | null;
  onAnswer: (how: TourDayHow | null) => void;
}

/**
 * MDT-02: how a multi-day tour goes on a day that it was dragged onto or
 * added to from somewhere without a day menu: whole, or a stage a day from it
 * on, each saying what it does. Nothing is written before one is chosen, and
 * closing leaves the plan as it was.
 */
export function TourDayChoiceDialog({ question, onAnswer }: TourDayChoiceDialogProps) {
  const { t } = useTranslation();
  const labelId = useId();
  if (!question) return null;
  const close = () => onAnswer(null);
  return (
    <DialogShell
      onClose={close}
      labelledBy={labelId}
      width="narrow"
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <CalendarRange size={20} strokeWidth={1.9} className="text-content" />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={close}
          eyebrow={t('dayplan.dayN', { n: question.day })}
          title={question.name}
          sub={t('tours.stages.count', { count: question.count })}
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={close}>{t('common.cancel')}</DialogButton>
        </DialogFooter>
      }
    >
      <div className="flex flex-col gap-2">
        {tourDayChoices(question, t).map((choice) => (
          <button
            key={choice.how}
            type="button"
            disabled={choice.disabled}
            onClick={() => onAnswer(choice.how)}
            data-testid={`tour-day-choice-${choice.how}`}
            className="flex w-full min-w-0 items-center gap-3 rounded-[12px] border border-edge-faint bg-surface-secondary px-3 py-2.5 text-start transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent enabled:hover:bg-surface-card disabled:cursor-default disabled:opacity-50"
          >
            <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-edge text-content-secondary">
              {choice.how === 'whole' ? (
                <CalendarDays size={15} strokeWidth={2} aria-hidden="true" />
              ) : (
                <CalendarRange size={15} strokeWidth={2} aria-hidden="true" />
              )}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-semibold text-content" style={fs(13, 'body')}>
                {choice.title}
              </span>
              <span className="text-content-muted" style={fs(12, 'body')}>
                {choice.hint}
              </span>
            </span>
          </button>
        ))}
      </div>
    </DialogShell>
  );
}
