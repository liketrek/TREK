import { AlertTriangle, Undo2 } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { CardAction, TourNotice } from '../tourParts';

type LossPlanner = Pick<TourPlannerController, 'stages' | 'undo' | 'canUndo'>;

/**
 * MDT-01: a change that could not keep a stage end (its stop was removed, or
 * moved to where no stage can end) says so at once, with the one step back,
 * rather than letting the stages it joined pass unnoticed. It goes with the
 * next change of the points.
 */
export function TourStageLossNotice({ planner }: { planner: LossPlanner }) {
  const { t } = useTranslation();
  const { lost } = planner.stages;
  if (lost === 0) return null;
  return (
    <div data-testid="tour-stage-loss">
      <TourNotice tone="warning" role="status" icon={<AlertTriangle size={13} strokeWidth={2} />}>
        <span className="flex flex-col items-start gap-2">
          <span>{t('tours.stages.lost', { count: lost })}</span>
          {planner.canUndo && (
            <CardAction icon={<Undo2 size={12} strokeWidth={2} />} onClick={planner.undo}>
              {t('undo.button')}
            </CardAction>
          )}
        </span>
      </TourNotice>
    </div>
  );
}
