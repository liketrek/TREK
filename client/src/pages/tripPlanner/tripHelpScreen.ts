/**
 * Which help screen the trip page announces.
 *
 * The trip is a family of help screens: the frame, one per tab, on the plan
 * one per overlay that is open, and on the Tours tab one per kind of tour.
 * A screen that has no help yet falls back to the next one up, so the panel
 * never opens on "No guide for this screen".
 */

/** The tab ids are historical; the help screens carry the names the tabs show. */
const TRIP_TAB_HELP: Record<string, string> = {
  transports: 'transports',
  buchungen: 'bookings',
  listen: 'lists',
  finanzplan: 'costs',
  dateien: 'files',
  collab: 'collab',
  roadtrip: 'roadtrip',
  'tour-planner': 'tour-planner',
};

/** Hike and run share a screen: both are planned on foot with the trail details card. */
const TOUR_TYPE_HELP: Record<string, string> = {
  hike: 'trip-tour-hike',
  run: 'trip-tour-hike',
  walk: 'trip-tour-walk',
  bike: 'trip-tour-bike',
  kayak: 'trip-tour-paddle',
  horse: 'trip-tour-horse',
  ski: 'trip-tour-ski',
};

export interface TripHelpState {
  activeTab: string;
  roadtripActive: boolean;
  /** A tour's card is open (it is the selected place too, so it is asked first). */
  tourCardOpen: boolean;
  placeOpen: boolean;
  dayDetailOpen: boolean;
  /** The places column shows its Tours list. */
  toursList: boolean;
  /** What the Tours tab's planner holds. */
  plannerMode: 'neutral' | 'new-draft' | 'edit-saved' | 'view-gpx';
  plannerTourType: string;
}

export function tripHelpScreen(state: TripHelpState, known: (id: string) => boolean): string {
  const first = (...ids: string[]): string => ids.find(known) ?? 'trip';
  if (state.activeTab === 'plan') {
    if (state.roadtripActive) return first('trip-roadtrip');
    if (state.tourCardOpen) return first('trip-tour-detail', 'trip-tours');
    if (state.placeOpen) return first('trip-place');
    if (state.dayDetailOpen) return first('trip-day-detail');
    if (state.toursList) return first('trip-tours');
    return 'trip';
  }
  if (state.activeTab === 'tour-planner') {
    if (state.plannerMode === 'view-gpx') return first('trip-tour-import', 'trip-tour-planner');
    if (state.plannerMode === 'new-draft' || state.plannerMode === 'edit-saved') {
      return first(TOUR_TYPE_HELP[state.plannerTourType] ?? '', 'trip-tour-planner');
    }
    return first('trip-tour-planner');
  }
  return first(`trip-${TRIP_TAB_HELP[state.activeTab] ?? state.activeTab}`);
}
