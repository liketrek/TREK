import type { TourListItem } from '@trek/shared';
import { useTranslation } from '../../../i18n';
import { BOX } from '../../Planner/bookings/bookingParts';
import { DialogSection } from '../../shared/DialogShell';
import { PaddleCheckDataLine, PaddleCheckPill } from './PaddleCheckBadges';
import { PaddleSafetyRow } from './PaddleSafety';

/**
 * The checklist of a paddle tour in its detail (PAD-09): the check bench as
 * the day plan shows it and how current its data is, then the safety note.
 * A tour without a bench yet shows the safety note alone.
 */
export function PaddleCheckSection({ tour }: { tour: TourListItem }) {
  const { t } = useTranslation();
  const check = tour.paddle_check ?? null;
  if (!check) {
    return (
      <div className="flex-none">
        <PaddleSafetyRow />
      </div>
    );
  }
  return (
    <DialogSection className="flex-none" label={t('tours.paddle.check.title')}>
      <div className="flex flex-col gap-2">
        <div data-testid="paddle-check-summary" className={`${BOX} flex flex-col gap-2 px-3 py-2.5`}>
          <div className="flex flex-wrap items-center gap-1">
            <PaddleCheckPill check={check} />
          </div>
          <PaddleCheckDataLine check={check} />
        </div>
        <PaddleSafetyRow />
      </div>
    </DialogSection>
  );
}
