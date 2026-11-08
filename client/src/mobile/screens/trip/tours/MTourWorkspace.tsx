import { List, Map as MapIcon } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import TourGpxDropZone from '../../../../components/Tours/TourGpxDropZone';
import TourWorkspaceRail from '../../../../components/Tours/TourWorkspaceRail';
import { TourPlannerToursRail } from '../../../../components/Tours/planner/TourPlannerPanels';
import { FloatingRailHeads } from '../../../../components/Tours/planner/railHead';
import { useIsSplit } from '../../../../hooks/sizeClass';
import { useTouchDragBridge } from '../../../../hooks/useTouchDragBridge';
import { LazyPanel } from '../../../../pages/tripPlanner/LazyPanel';
import { TourPlannerMapStage } from '../../../../pages/tripPlanner/TourPlannerMapStage';
import { useTripPlannerPageOf } from '../../../../pages/tripPlanner/useTripPlannerPage';
import MIconBtn from '../../../components/MIconBtn';
import MSegmented from '../../../components/MSegmented';
import type { MTripTabPanelProps } from '../MTripShell';
import { useTourHeadSlot } from './tourHeadSlot';

/** The pane's two halves: the trip's tours, or the editor with the tour open in it. */
type MTourPane = 'tours' | 'editor';

/** The editor's title for what is open in it, as the desktop rail heads it. */
const EDITOR_TITLE = {
  neutral: 'tours.planner.title',
  'new-draft': 'tours.planner.newTitle',
  'edit-saved': 'tours.planner.editTitle',
  'view-gpx': 'tours.planner.gpxTitle',
} as const;

/**
 * The tours tab on a large screen (wide and split; a phone has no such tab and
 * keeps its tours in the places browser). It is the desktop's tour editor, wired
 * over the shell's own planner through useTripPlannerPageOf, so the two cannot
 * drift apart: the same rails, the same map stage, the same GPX import.
 *
 * Split: the pane beside the map, with the trip's tours and the editor as its two
 * halves. Wide: one column, the pane or the map, switched at the pane's head and
 * from the map's corner. Opening a tour (from the list, the map or an import) turns
 * the pane to the editor, where it is then shown.
 *
 * The whole tab sits below the shell's floating top controls rather than under
 * them: that row spans the window and takes every press in its band, so a map
 * running beneath it would lose its search field to it.
 */
export default function MTourWorkspace({ planner }: Pick<MTripTabPanelProps, 'planner'>) {
  const page = useTripPlannerPageOf(planner);
  const { tourPlanner, wandererBrowser, tourGpxImport, tourMap, locationSearch, tourDetailActions } = page;
  const { canPlaceEdit, canDayEdit } = page.permissions;
  const split = useIsSplit();
  const [mapShown, setMapShown] = useState(false);
  // The waypoint list and the stage rail reorder by HTML5 drag, which a finger cannot start.
  useTouchDragBridge(true);

  const mode = tourPlanner.mode.type;
  const editing = mode !== 'neutral' || wandererBrowser.open;
  // Something opened in the editor is shown there, on whichever half was up; once
  // it is closed (discarded, or back to the tours) the list comes back. Only on a
  // change: a tap on the editor half with nothing open stays where it went. Set
  // while rendering, as React has it for state that follows a prop, not in an effect.
  const [pane, setPane] = useState<MTourPane>(editing ? 'editor' : 'tours');
  const opened = `${editing}:${mode}`;
  const [seen, setSeen] = useState(opened);
  if (seen !== opened) {
    setSeen(opened);
    setPane(editing ? 'editor' : 'tours');
  }

  const showPane = split || !mapShown;
  const showMap = split || mapShown;
  const { t } = planner;
  const headSlot = useTourHeadSlot();
  // In the shell's top row the switch also brings the pane back from the map.
  const pickPane = (next: MTourPane) => {
    setPane(next);
    setMapShown(false);
  };
  const head = (
    <>
      <MSegmented<MTourPane>
        className="min-w-0 flex-1"
        value={pane}
        onChange={pickPane}
        options={[
          { value: 'tours', label: t('tours.planner.tripTours') },
          { value: 'editor', label: t(EDITOR_TITLE[mode]) },
        ]}
      />
      {!split && (
        <MIconBtn
          ariaLabel={mapShown ? t('mobileTrip.listView') : t('mobileTrip.mapView')}
          onClick={() => setMapShown(!mapShown)}
          size={headSlot ? 38 : 36}
          className="pointer-events-auto backdrop-blur-[24px] backdrop-saturate-[1.7]"
        >
          {mapShown ? <List size={17} strokeWidth={2} /> : <MapIcon size={17} strokeWidth={2} />}
        </MIconBtn>
      )}
    </>
  );

  return (
    <TourGpxDropZone gpxImport={tourGpxImport} canEdit={canPlaceEdit} className="absolute inset-0">
      <div className="absolute inset-x-0 bottom-0 top-[calc(var(--m-safe-top,12px)+50px)] flex">
        {showPane && (
          <section
            aria-label={t('tours.planner.tripTours')}
            className="flex h-full min-w-0 flex-1 flex-col split:w-[var(--trip-pane-open)] split:flex-none split:border-e split:border-[color:var(--m-rowbr)]"
          >
            {!headSlot && <div className="flex items-center gap-2 px-4 pb-2 pt-1">{head}</div>}
            {/* Every rail head here is a rounded band like the cards under it. */}
            <FloatingRailHeads value>
              <div className="relative min-h-0 flex-1 overflow-hidden pb-[env(safe-area-inset-bottom,0px)]">
                {pane === 'tours' ? (
                  <LazyPanel id="m-tour-tours">
                    <TourPlannerToursRail
                      planner={tourPlanner}
                      canEdit={canPlaceEdit}
                      canAssign={canDayEdit}
                      tours={planner.tours}
                      days={planner.days}
                      loading={planner.toursLoading}
                      onAssignToDay={planner.handleAssignToDay}
                      onDeleteTour={planner.handleDeleteTour}
                      gpxImport={tourGpxImport}
                      onViewGpxTour={page.viewImportedTour}
                      onTakenOver={tourDetailActions.onTakenOver}
                    />
                  </LazyPanel>
                ) : (
                  <LazyPanel id="m-tour-editor">
                    <TourWorkspaceRail workspace={page} canEdit={canPlaceEdit} canAssign={canDayEdit} />
                  </LazyPanel>
                )}
              </div>
            </FloatingRailHeads>
          </section>
        )}
        {showMap && (
          <div className="relative h-full min-w-0 flex-1 overflow-hidden">
            <TourPlannerMapStage
              tripId={planner.tripId}
              mapTileUrl={planner.mapTileUrl}
              leftHidden={false}
              rightHidden={false}
              leftPanelPx={0}
              rightPanelPx={0}
              t={t}
              tourPlanner={tourPlanner}
              tourMap={tourMap}
              locationSearch={locationSearch}
              canPlaceEdit={canPlaceEdit}
              assistantRoutes={planner.assistantMap}
              onViewportChange={wandererBrowser.onViewportChange}
              paddleChecklist={page.paddleChecklist}
            />
            {!split && !headSlot && (
              <div className="absolute start-3 top-3 z-20">
                <MIconBtn
                  ariaLabel={t('mobileTrip.listView')}
                  onClick={() => setMapShown(false)}
                  className="backdrop-blur-[24px] backdrop-saturate-[1.7]"
                >
                  <List size={18} strokeWidth={2} />
                </MIconBtn>
              </div>
            )}
          </div>
        )}
      </div>
      {headSlot && createPortal(head, headSlot)}
    </TourGpxDropZone>
  );
}
