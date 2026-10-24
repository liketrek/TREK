import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../../../i18n';
import ConfirmDialog from '../../shared/ConfirmDialog';
import { LABEL, Segmented } from '../../shared/dialogParts';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { TourNotice } from '../tourParts';

type StageMode = 'single' | 'multi';

/**
 * MDT-01: a day tour or a multi-day tour, beside the tour's type. Choosing a
 * multi-day tour changes nothing yet: it says where the first stage end is
 * set. Back to a day tour every stage end goes, after a confirmation, as one
 * step undo brings back; the route stays as it is.
 */
export function TourStageModeField({ planner, locked }: { planner: TourPlannerController; locked: boolean }) {
  const { t } = useTranslation();
  const { stages } = planner;
  const [confirming, setConfirming] = useState(false);
  const choose = (mode: StageMode) => {
    if (mode === 'multi') stages.setMultiDay(true);
    else if (stages.endCount > 0) setConfirming(true);
    else stages.setMultiDay(false);
  };
  return (
    <div data-testid="tour-stage-mode" className="flex min-w-0 flex-col gap-2">
      <fieldset disabled={locked} className="m-0 min-w-0 border-0 p-0">
        <span className={LABEL}>{t('tours.stages.mode')}</span>
        <Segmented<StageMode>
          value={stages.multiDay ? 'multi' : 'single'}
          onChange={choose}
          label={t('tours.stages.mode')}
          fill
          options={[
            {
              value: 'single',
              label: t('tours.stages.mode.single'),
              icon: <Sun size={13} strokeWidth={2.2} aria-hidden="true" />,
            },
            {
              value: 'multi',
              label: t('tours.stages.mode.multi'),
              icon: <Moon size={13} strokeWidth={2.2} aria-hidden="true" />,
            },
          ]}
        />
      </fieldset>
      {stages.multiDay && stages.endCount === 0 && (
        <TourNotice tone="warning" role="status" icon={<Moon size={13} strokeWidth={2} />}>
          {t('tours.stages.emptyHint')}
        </TourNotice>
      )}
      <ConfirmDialog
        isOpen={confirming && !locked}
        onClose={() => setConfirming(false)}
        onConfirm={() => stages.setMultiDay(false)}
        title={t('tours.stages.toDayTitle')}
        message={t('tours.stages.toDayBody', { count: stages.endCount })}
        confirmLabel={t('tours.stages.toDayConfirm')}
      />
    </div>
  );
}
