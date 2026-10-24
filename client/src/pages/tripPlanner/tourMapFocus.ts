import type { useMapLocationSearch } from './useMapLocationSearch';
import type { useTourWorkspace } from './useTourWorkspace';

// The planner page hook's pure helpers: what the Tours map draws and frames.
// They live apart so the page hook's one object-literal return stays its view model.

type Workspace = ReturnType<typeof useTourWorkspace>;
type TourPlanner = Workspace['tourPlanner'];

/** PAD-05B: the paddle line in view, a recorded paddle track's or the paddle tour's being planned; none for any other. */
export function paddleLineOf(tourPlanner: TourPlanner) {
  if (tourPlanner.mode.type === 'view-gpx') {
    return tourPlanner.mode.tour.tour_type === 'kayak'
      ? (tourPlanner.readOnlyGpxAnalysis?.routeCoordinates ?? null)
      : null;
  }
  return tourPlanner.isPaddle ? tourPlanner.route : null;
}

/**
 * RTE-02, RTE-03: the ways offered over the route being edited (a section's
 * ways being compared, else the round hikes), the one in focus, and the frame
 * round hikes ask the map for while they are looked for and shown.
 */
export function offeredWaysOf(tourPlanner: TourPlanner, offering: boolean) {
  const { comparison, focus: variantFocus } = tourPlanner.legVariants;
  const { view: rounds, focus: roundFocus, frame: roundFrame } = tourPlanner.roundHikes;
  return {
    ways: offering ? (comparison?.variants ?? rounds?.candidates ?? null) : null,
    focus: comparison ? variantFocus : roundFocus,
    frame: offering ? roundFrame : null,
  };
}

/** What frames the map: a picked wanderer trail itself, else round hikes being framed, else the planner. */
export function mapFocusKeyOf(
  wandererBrowser: Workspace['wandererBrowser'],
  frame: ReturnType<typeof offeredWaysOf>['frame'],
  plannerKey: ReturnType<typeof useMapLocationSearch>['mapFocusKey']
) {
  if (wandererBrowser.open && wandererBrowser.selected) return `wanderer:${wandererBrowser.selected.id}`;
  return frame?.key ?? plannerKey;
}
