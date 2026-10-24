import type { TourRouteCard, TourRouteStop, TourTypeKey } from '@trek/shared';

/**
 * The words of a tour card as literal tables, so each key is named where it
 * is read: what kind of tour a route is, what its SAC grades mean, what a
 * stop without a name is, what each warning says and how loud, why a route
 * is drawn straight, why a city walk's station is flagged.
 */

/** What kind of tour each activity is, as the Tours tab names it. */
export const TOUR_TYPE_WORDS: Readonly<Record<TourTypeKey, { labelKey: string }>> = {
  hike: { labelKey: 'tourTypes.hike' },
  bike: { labelKey: 'tourTypes.bike' },
  run: { labelKey: 'tourTypes.run' },
  ski: { labelKey: 'tourTypes.ski' },
  kayak: { labelKey: 'tourTypes.kayak' },
  walk: { labelKey: 'tourTypes.walk' },
  food: { labelKey: 'tourTypes.food' },
  horse: { labelKey: 'tourTypes.horse' },
};

/** What each SAC step means, T1 first, as the hike's own card says it. */
export const SAC_WORDS = [
  { labelKey: 'tours.hike.sac.t1' },
  { labelKey: 'tours.hike.sac.t2' },
  { labelKey: 'tours.hike.sac.t3' },
  { labelKey: 'tours.hike.sac.t4' },
  { labelKey: 'tours.hike.sac.t5' },
  { labelKey: 'tours.hike.sac.t6' },
] as const;

/** A route's name: its own, else the kind of tour it is (a city walk is proposed without one). */
export function routeName(card: Pick<TourRouteCard, 'name' | 'activity'>, t: (key: string) => string): string {
  return card.name ?? t(TOUR_TYPE_WORDS[card.activity].labelKey);
}

type StopWord = NonNullable<TourRouteStop['kind']> | 'start' | 'end';

/** The words for a stop without a name of its own, by its kind or its role. */
const STOP_WORDS: Readonly<Partial<Record<StopWord, { labelKey: string }>>> = {
  start: { labelKey: 'assistant.card.tour.stop.start' },
  end: { labelKey: 'assistant.card.tour.stop.end' },
  peak: { labelKey: 'assistant.card.tour.stop.peak' },
  highest: { labelKey: 'assistant.card.tour.stop.highest' },
  shelter: { labelKey: 'assistant.card.tour.stop.shelter' },
  drinking_water: { labelKey: 'assistant.card.tour.stop.drinking_water' },
  viewpoint: { labelKey: 'assistant.card.tour.stop.viewpoint' },
};

/** A stop's name: its own, else what it is, else where it is on the way. */
export function stopName(stop: TourRouteStop, t: (key: string) => string): string {
  if (stop.name) return stop.name;
  const role = stop.role === 'start' || stop.role === 'end' ? STOP_WORDS[stop.role] : undefined;
  const word = (stop.kind ? STOP_WORDS[stop.kind] : undefined) ?? role;
  return t(word?.labelKey ?? 'assistant.card.tour.stop.other');
}

type WarningKind = TourRouteCard['warnings'][number]['kind'];

/** What each warning says and how loud: the dark is danger, the rest a warning. */
export const WARNING_LOOK = {
  thunder: { labelKey: 'assistant.card.tour.warn.thunder', tone: 'warning' },
  rain: { labelKey: 'assistant.card.tour.warn.rain', tone: 'warning' },
  dark_end: { labelKey: 'assistant.card.tour.warn.dark_end', tone: 'danger' },
  dark_start: { labelKey: 'assistant.card.tour.warn.dark_start', tone: 'danger' },
  dusk: { labelKey: 'assistant.card.tour.warn.dusk', tone: 'warning' },
  legs_failed: { labelKey: 'assistant.card.tour.warn.legs_failed', tone: 'warning' },
} as const satisfies Record<WarningKind, { labelKey: string; tone: 'warning' | 'danger' }>;

/** Why a route is drawn straight, in words. */
export const PROBLEM_LOOK = {
  no_valhalla: { labelKey: 'assistant.card.tour.problem.no_valhalla' },
  router_unavailable: { labelKey: 'assistant.card.tour.problem.router_unavailable' },
  no_way: { labelKey: 'assistant.card.tour.problem.no_way' },
  point_off_the_way: { labelKey: 'assistant.card.tour.problem.point_off_the_way' },
  too_long: { labelKey: 'assistant.card.tour.problem.too_long' },
  ferry_only: { labelKey: 'assistant.card.tour.problem.ferry_only' },
  not_planned: { labelKey: 'assistant.card.tour.notPlanned' },
} as const satisfies Record<NonNullable<TourRouteCard['problem']>['why'], { labelKey: string }>;

/** Why a city walk's station is flagged, in words. */
export const FLAG_LOOK = {
  closed: { labelKey: 'assistant.card.tour.flag.closed' },
  late: { labelKey: 'assistant.card.tour.flag.late' },
  after_frame: { labelKey: 'assistant.card.tour.flag.after_frame' },
} as const satisfies Record<NonNullable<TourRouteStop['flag']>, { labelKey: string }>;

/** What a route's time is, by how it was reckoned, as the Tours tab names each. */
const TIME_WORDS = {
  din33466: { labelKey: 'tours.planner.walkingEstimatedInfo' },
  router: { labelKey: 'tours.scope.routed' },
  planned: { labelKey: 'tours.scope.planned' },
  stations: { labelKey: 'tours.scope.plannedWithStays' },
  piste: { labelKey: 'tours.ski.time' },
  pace: { labelKey: 'tours.run.timeEstimated' },
} as const satisfies Record<NonNullable<TourRouteCard['minutesBasis']>, { labelKey: string }>;

/** What each bike and run profile is called, as the Tours tab names it. */
export const PROFILE_WORDS = {
  touring: { labelKey: 'tours.bike.profile.touring' },
  road: { labelKey: 'tours.bike.profile.road' },
  gravel: { labelKey: 'tours.bike.profile.gravel' },
  mtb: { labelKey: 'tours.bike.profile.mtb' },
  running: { labelKey: 'tours.run.profile.running' },
  trail: { labelKey: 'tours.run.profile.trail' },
} as const satisfies Record<NonNullable<TourRouteCard['routingProfile']>, { labelKey: string }>;

/**
 * The name of a route's time: by how it was reckoned (a bike tour's router
 * time is its riding time), else a paddle's own, else a walking time.
 */
export function timeLabelKey(card: Pick<TourRouteCard, 'minutesBasis' | 'activity'>): string {
  if (card.minutesBasis === 'router' && card.activity === 'bike') return 'tours.bike.timeEstimated';
  if (card.minutesBasis) return TIME_WORDS[card.minutesBasis].labelKey;
  return card.activity === 'kayak' ? 'tours.paddle.timeEstimated' : 'tours.planner.walkingEstimated';
}
