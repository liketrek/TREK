import type { BikeProfile, PaddleBoatType, RunProfile, SkiDiscipline } from '@trek/shared';

/** What GPX calls the activity in a track's <type>; a paddle tour says what it is paddled in. */
const PADDLE_ACTIVITY: Record<PaddleBoatType, string> = {
  kayak: 'kayaking',
  canoe: 'canoeing',
  sup: 'stand_up_paddling',
  other: 'paddling',
};

/** A bike tour says what it is ridden on, in the words Garmin and Strava read. */
const BIKE_ACTIVITY: Record<BikeProfile, string> = {
  touring: 'cycling',
  road: 'road_biking',
  gravel: 'gravel_cycling',
  mtb: 'mountain_biking',
};

/** RUN-01, RUN-02: a run says how it is run, in the same words. */
const RUN_ACTIVITY: Record<RunProfile, string> = {
  running: 'running',
  trail: 'trail_running',
};

/**
 * SKI-02: a ski tour says how it is done, in the same words: snowshoes make it
 * snowshoeing, and a winter hike is walked as any hike is. Without a known
 * discipline it is skiing.
 */
const SKI_ACTIVITY: Record<SkiDiscipline, string> = {
  alpine: 'alpine_skiing',
  snowboard: 'snowboarding',
  cross_country: 'cross_country_skiing',
  touring: 'backcountry_skiing',
  snowshoe: 'snowshoeing',
  winter_hike: 'hiking',
};

/** The activity a ride names in GPX (HOR-01), in the words Garmin reads. */
const HORSE_ACTIVITY = 'horseback_riding';

/**
 * The activity a tour's track names in GPX: a paddle tour its boat, a bike
 * tour and a run their profile, a ski tour its discipline (SKI-02), a ride
 * horseback riding (HOR-01) and a hike hiking; whatever is missing falls back
 * to the plainest.
 */
export function gpxActivityOf(tour: {
  tour_type: string;
  boat_type?: string | null;
  bike_profile?: string | null;
  run_profile?: string | null;
  ski_discipline?: string | null;
}): string {
  const { tour_type: type, boat_type: boat, bike_profile: bike } = tour;
  if (type === 'kayak') return PADDLE_ACTIVITY[(boat ?? 'other') as PaddleBoatType] ?? PADDLE_ACTIVITY.other;
  if (type === 'bike') return BIKE_ACTIVITY[(bike ?? 'touring') as BikeProfile] ?? BIKE_ACTIVITY.touring;
  if (type === 'run') return RUN_ACTIVITY[(tour.run_profile ?? 'running') as RunProfile] ?? RUN_ACTIVITY.running;
  if (type === 'ski') return SKI_ACTIVITY[tour.ski_discipline as SkiDiscipline] ?? 'skiing';
  if (type === 'horse') return HORSE_ACTIVITY;
  return type === 'hike' ? 'hiking' : type;
}
