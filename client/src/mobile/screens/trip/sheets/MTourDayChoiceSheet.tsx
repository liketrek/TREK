import { CalendarDays, CalendarRange } from 'lucide-react';
import { tourDayChoices, type TourDayHow, type TourDayQuestion } from '../../../../components/Tours/stages/stageSpread';
import { useTranslation } from '../../../../i18n';
import MConfirmSheet from '../../settings/MConfirmSheet';

interface MTourDayChoiceSheetProps {
  question: TourDayQuestion | null;
  onAnswer: (how: TourDayHow | null) => void;
}

/**
 * MDT-02 on the phone: how a multi-day tour goes on the day it was added to,
 * whole or a stage a day from it on, the same two ways the desktop offers.
 */
export default function MTourDayChoiceSheet({ question, onAnswer }: MTourDayChoiceSheetProps) {
  const { t } = useTranslation();
  const close = () => onAnswer(null);
  return (
    <MConfirmSheet
      open={question != null}
      onClose={close}
      title={question ? `${t('dayplan.dayN', { n: question.day })}: ${question.name}` : ''}
      message={question ? t('tours.stages.count', { count: question.count }) : ''}
      cancelLabel={t('common.cancel')}
    >
      <div className="mt-3 flex flex-col gap-2">
        {question &&
          tourDayChoices(question, t).map((choice) => (
            <button
              key={choice.how}
              type="button"
              disabled={choice.disabled}
              onClick={() => onAnswer(choice.how)}
              data-testid={`m-tour-day-choice-${choice.how}`}
              className="flex w-full items-center gap-3 rounded-[14px] border border-m-rowbr bg-m-ic px-3 py-[10px] text-start disabled:opacity-40"
            >
              <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-m-card text-m-muted">
                {choice.how === 'whole' ? (
                  <CalendarDays size={15} strokeWidth={2} aria-hidden="true" />
                ) : (
                  <CalendarRange size={15} strokeWidth={2} aria-hidden="true" />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-body font-semibold text-m-ink">{choice.title}</span>
                <span className="text-caption text-m-muted">{choice.hint}</span>
              </span>
            </button>
          ))}
      </div>
    </MConfirmSheet>
  );
}
