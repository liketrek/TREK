import { Route } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { TourNotice } from '../tourParts';

/**
 * CW-11: said in the planner once a walk an assistant saved with its stops
 * only has its way planned here and not saved yet; not while the way is still
 * being planned, nor when planning it failed.
 */
export function WalkRoutePendingNotice({
  planner,
}: {
  planner: Pick<TourPlannerController, 'routePending' | 'hasUnsavedChanges' | 'status'>;
}) {
  const { t } = useTranslation();
  if (!planner.routePending || !planner.hasUnsavedChanges || planner.status !== 'ready') return null;
  return (
    <TourNotice role="status" icon={<Route size={13} strokeWidth={2} />}>
      {t('tours.walk.routePendingPlanner')}
    </TourNotice>
  );
}

/** CW-11: the detail of a walk saved with its stops only, whose way is still to be planned. */
export function WalkRoutePendingHint() {
  const { t } = useTranslation();
  return <TourNotice icon={<Route size={13} strokeWidth={2} />}>{t('tours.walk.routePending')}</TourNotice>;
}
