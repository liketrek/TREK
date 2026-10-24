import { useTranslation } from '../../../i18n';
import { Tooltip } from '../../shared/Tooltip';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { useWaypointPlaceNames } from '../planner/useWaypointPlaceNames';
import { InfoDot, TourSection } from '../tourParts';
import { showStage } from './stageActions';
import { stopNameOf } from './stageNames';
import { StageSummary } from './StageParts';
import type { TourStage } from './tourStages';

type StagesPlanner = Pick<
  TourPlannerController,
  'stages' | 'waypoints' | 'routeAnalysis' | 'setSelectedWaypointId' | 'setRouteProfileFocus'
>;

/**
 * MDT-01: the stages of a multi-day tour under the whole tour's facts, the
 * second view of the same route: each stage from the stop it starts at to the
 * one it ends at, with what it measures. A stage shows where it ends, on the
 * map, in the profile and in the list of points.
 */
export function TourStagesSection({ planner }: { planner: StagesPlanner }) {
  const { t } = useTranslation();
  const placeNames = useWaypointPlaceNames(planner.waypoints);
  const { stages } = planner.stages;
  if (stages.length < 2) return null;
  const nameOf = (id: string) => stopNameOf(planner.waypoints, placeNames, id, t);
  const show = (stage: TourStage) => showStage(planner, stage);
  return (
    <TourSection
      label={t('tours.stages.title')}
      action={<InfoDot label={t('tours.stages.title')} description={t('tours.stages.timeInfo')} />}
    >
      <ol data-testid="tour-stages" className="m-0 -mx-1.5 flex list-none flex-col gap-px p-0">
        {stages.map((stage) => (
          <li key={stage.number}>
            <Tooltip label={t('tours.stages.show')}>
              <button
                type="button"
                data-testid="tour-stage-row"
                onClick={() => show(stage)}
                className="flex w-full min-w-0 items-center gap-2.5 rounded-[10px] px-1.5 py-1.5 text-start transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <StageSummary
                  stage={stage}
                  night={stage.number < stages.length}
                  from={nameOf(stage.fromId)}
                  to={nameOf(stage.toId)}
                />
              </button>
            </Tooltip>
          </li>
        ))}
      </ol>
    </TourSection>
  );
}
