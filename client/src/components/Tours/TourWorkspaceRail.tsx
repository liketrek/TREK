import type { GpxConversion } from './conversion/useGpxConversion';
import type { PaddleChecklist } from './paddle/usePaddleChecklist';
import type { TrackPaddlePlan } from './paddle/useTrackPaddlePlan';
import { TourPlannerRail } from './planner/TourPlannerPanels';
import type { TourPlannerController } from './planner/useTourPlanner';
import type { SkiClassification } from './ski/useSkiClassification';
import type { RecordedTrack } from './useRecordedTrack';
import WandererBrowserRail from './wanderer/WandererBrowserRail';
import type { WandererBrowser } from './wanderer/useWandererBrowser';

/** What the tours workspace hands its left rail: the parts of the planner page's state, by their names there. */
export interface TourWorkspaceRailParts {
  tourPlanner: TourPlannerController;
  wandererBrowser: WandererBrowser;
  tourConversion: GpxConversion;
  recordedTrack: RecordedTrack;
  /** The portages and locks of a recorded paddle track in view. */
  trackPaddlePlan?: TrackPaddlePlan;
  /** The obstacle checklist of the paddle tour open in the planner (PAD-06). */
  paddleChecklist?: PaddleChecklist;
  /** The classification of the ski track in view (SKI-02). */
  skiClassification?: SkiClassification;
  /**
   * The trip's tours, never offered as a stop of another tour (PR1-10). Required,
   * so a workspace that forgets to hand them on does not offer every tour as a stop.
   */
  tourPlaceIds: ReadonlySet<number>;
}

/** The tours workspace's left rail: the tour editor, or the wanderer trails while those are browsed. */
export default function TourWorkspaceRail({
  workspace,
  canEdit,
  canAssign,
}: {
  workspace: TourWorkspaceRailParts;
  canEdit: boolean;
  canAssign: boolean;
}) {
  const {
    tourPlanner,
    wandererBrowser: wanderer,
    tourConversion,
    recordedTrack,
    trackPaddlePlan,
    paddleChecklist,
    skiClassification,
    tourPlaceIds,
  } = workspace;
  return wanderer.open ? (
    <WandererBrowserRail browser={wanderer} />
  ) : (
    <TourPlannerRail
      planner={tourPlanner}
      canEdit={canEdit}
      canAssign={canAssign}
      conversion={tourConversion}
      recordedTrack={recordedTrack}
      trackPaddlePlan={trackPaddlePlan}
      paddleChecklist={paddleChecklist}
      skiClassification={skiClassification}
      tourPlaceIds={tourPlaceIds}
      onOpenWanderer={wanderer.enabled ? wanderer.openBrowser : undefined}
    />
  );
}
