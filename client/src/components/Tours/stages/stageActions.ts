import { Moon } from 'lucide-react';
import type { useTranslation } from '../../../i18n';
import { focusRouteProfileAtDistance } from '../../../utils/routeGeometry';
import type { useContextMenu } from '../../shared/ContextMenu';
import type { TourPlannerController } from '../planner/useTourPlanner';
import type { TourStage } from './tourStages';
import type { TourStagesController } from './useTourStages';

type Translate = ReturnType<typeof useTranslation>['t'];
type MenuItems = Parameters<ReturnType<typeof useContextMenu>['open']>[1];

/**
 * Shows a stage of the tour open in the planner: its last stop selected, the
 * profile at the spot it ends once the route has measured it (MDT-02 opens a
 * stage from the list this way too).
 */
export function showStage(
  planner: Pick<TourPlannerController, 'routeAnalysis' | 'setSelectedWaypointId' | 'setRouteProfileFocus'>,
  stage: TourStage
) {
  planner.setSelectedWaypointId(stage.toId);
  const samples = planner.routeAnalysis?.distanceIndexedProfileSamples ?? [];
  planner.setRouteProfileFocus(stage.toM === null ? null : focusRouteProfileAtDistance(samples, stage.toM));
}

/** The stage tool of a stop's menu: end a stage here, or let the stage go on; none where no stage can end. */
export function stageMenuItems(stages: TourStagesController, point: { id: string; stageEnd?: boolean }, t: Translate) {
  if (!stages.canEnd(point.id)) return [] as MenuItems;
  const items: MenuItems = [
    { divider: true },
    {
      label: t(point.stageEnd ? 'tours.stages.removeEnd' : 'tours.stages.endHere'),
      icon: Moon,
      onClick: () => stages.toggleStageEnd(point.id),
    },
  ];
  return items;
}
