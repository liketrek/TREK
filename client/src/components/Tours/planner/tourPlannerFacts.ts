import {
  hikingTimeMinutes,
  MAX_PLANNED_TOUR_DURATION_MINUTES,
  maxTourMinutesFor,
  plannableTourTypeSchema,
  runMinutesAtPace,
  skiOptionsForDiscipline,
  tourWebsiteSchema,
  type BikeProfile,
  type HikingPreferences,
  type PaddleBoatType,
  type PaddleLakeStyle,
  type PaddleWaterContext,
  type PlannableTourType,
  type RunProfile,
  type TourListItem,
  type TourMaxHikingDifficulty,
} from '@trek/shared';
import type { RouteGeometryAnalysis } from '../../../utils/routeGeometry';
import { runPaceInvalid } from '../run/runPace';
import { NO_SKI_CHOICE, skiChoiceMissing, skiChoiceOf, skiFieldsOf, type SkiChoice } from '../ski/skiChoice';
import { walkTimesOf, type WalkTimes } from './stationModel';

/** The editable fields of a saved tour as the planner opens them, each with its empty value. */
export function openedTourFields(tour: TourListItem) {
  return {
    name: tour.name,
    description: tour.description ?? '',
    website: tour.website ?? '',
    plannedDurationMinutes: tour.planned_duration_minutes ?? null,
    breakAdditionalMinutes: tour.break_additional_minutes ?? null,
    difficulty: tour.max_hiking_difficulty ?? 2,
    preferences: tour.hiking_preferences ?? null,
    // A type nobody can plan (an import of another kind) opens as a hike, as it always has.
    tourType: plannableTourTypeSchema.catch('hike').parse(tour.tour_type) as PlannableTourType,
    bikeProfile: (tour.bike_profile ?? 'touring') as BikeProfile,
    /** SKI-02: a ski tour's discipline and technique as saved; nothing chosen on any other tour. */
    ski: skiChoiceOf(tour.tour_type === 'ski' ? tour : {}),
    runProfile: (tour.run_profile ?? 'running') as RunProfile,
    runPaceSecondsPerKm: tour.run_pace_seconds_per_km ?? null,
  };
}

/** What the planner's facts are read from: the draft's fields and the route as last computed. */
export interface TourPlannerFactsInput {
  tourType: PlannableTourType;
  maxHikingDifficulty: TourMaxHikingDifficulty;
  /** MF-08: what the hike asks the router for besides its limit. */
  hikingPreferences: HikingPreferences | null;
  /** BIK-01: the profile a bike tour is routed for. */
  bikeProfile: BikeProfile;
  /** SKI-02: a ski tour's discipline and cross-country technique, nothing chosen until the traveller picks. */
  ski?: SkiChoice;
  /** The piste data build a ski tour's legs were planned on; null where the piste router planned none. */
  skiRouteBuild?: string | null;
  /** The ski tour's legs the piste router planned, by the index of the point each starts at; null if unknown. */
  skiPlannedLegs?: number[] | null;
  /** RUN-01: the profile a run is routed for, and the pace it is planned at (null while none is entered). */
  runProfile: RunProfile;
  runPaceSecondsPerKm: number | null;
  website: string;
  plannedDurationMinutes: number | null;
  breakAdditionalMinutes: number | null;
  paddle: {
    boatType: PaddleBoatType | null;
    waterContext: PaddleWaterContext | null;
    speedKmh: number | null;
    portageSpeedKmh: number | null;
    lakeStyle: PaddleLakeStyle | null;
  };
  paddleSpeedInvalid: boolean;
  /** A paddle tour's estimate on the water; null for a hike. */
  paddleEstimate: { waterMinutes: number | null; estimateMinutes: number | null } | null;
  routeAnalysis: RouteGeometryAnalysis | null;
  /**
   * CW-02: a city walk's stays as far as known, and of how many stations; null
   * for any other type, which takes its breaks.
   */
  stays?: Pick<WalkTimes, 'stayMinutes' | 'unknownStays' | 'stations' | 'ferryMinutes'> | null;
  /** The router's own time, seconds: a bike tour's riding time; stands in for a hike until the heights are in. */
  durationSeconds: number | null;
  /** MDT-01: the stages the tour is split into, one for a day tour; a day each is what the times may take. */
  stageCount?: number;
}

function invalidMinutes(value: number | null): boolean {
  return value !== null && (!Number.isInteger(value) || value < 0 || value > MAX_PLANNED_TOUR_DURATION_MINUTES);
}

/**
 * RUN-01: a run's time is its distance at the runner's pace and nothing else:
 * no climb, no descent and no difficulty go in. Without a pace, or before the
 * route is in, it is unknown; the router's walking time never stands in.
 */
function runMinutes({ runPaceSecondsPerKm: pace, routeAnalysis }: TourPlannerFactsInput): number | null {
  if (pace === null || runPaceInvalid(pace) || !routeAnalysis) return null;
  return runMinutesAtPace(routeAnalysis.distanceKm, pace);
}

/**
 * The time on the move: a paddle tour on the water at its speed, a run at its
 * pace, a bike tour by the router, which rides the profile at its speed and
 * weighs the climbs, a hike by the signposts' rule over distance, climb and
 * descent once the route has its heights, and by the router's own time before that.
 * A ride (HOR-01) has none: its pace is the horse's and the rider's, so nothing is made up.
 * A ski tour (SKI-02) has the piste router's, which it gives only when it planned every leg.
 */
function movingMinutes(input: TourPlannerFactsInput, routerMinutes: number | null): number | null {
  const { paddleEstimate, routeAnalysis } = input;
  if (input.tourType === 'horse') return null;
  if (input.tourType === 'ski') return routerMinutes;
  if (paddleEstimate) return paddleEstimate.waterMinutes === null ? null : paddleEstimate.estimateMinutes;
  if (input.tourType === 'run') return runMinutes(input);
  // A bike tour is timed by the router for its profile, a city walk by the router on foot.
  if (input.tourType === 'bike' || input.tourType === 'walk') return routerMinutes;
  return routeAnalysis?.gain != null && routeAnalysis.loss != null
    ? hikingTimeMinutes(routeAnalysis.distanceKm, routeAnalysis.gain, routeAnalysis.loss)
    : routerMinutes;
}

/**
 * CW-02: a city walk's times, the total its overview shows. Its stops are its
 * stays and it has no breaks on top, so nothing counts twice; the stays entered
 * count even while the walking time is not known. Null for any other type.
 */
function walkTimesFor(input: TourPlannerFactsInput, walkingMinutes: number | null): WalkTimes | null {
  if (input.tourType !== 'walk') return null;
  return walkTimesOf({ stayMinutes: 0, unknownStays: 0, stations: 0, ...input.stays, walkingMinutes });
}

/**
 * What the type adds to a save: a hike its routing limit, a bike tour its
 * profile, a run its profile and pace, a ski tour its discipline (and a
 * cross-country technique), a paddle tour its boat, water and speed.
 */
function typeFieldsOf(input: TourPlannerFactsInput) {
  const isBike = input.tourType === 'bike';
  const isRun = input.tourType === 'run';
  if (input.tourType === 'kayak') {
    const { boatType, waterContext, speedKmh, portageSpeedKmh, lakeStyle } = input.paddle;
    return {
      tour_type: input.tourType,
      max_hiking_difficulty: null,
      bike_profile: null,
      run_profile: null,
      run_pace_seconds_per_km: null,
      boat_type: boatType,
      water_context: waterContext,
      paddle_speed_kmh: speedKmh,
      portage_speed_kmh: portageSpeedKmh,
      paddle_lake_style: lakeStyle,
      hiking_preferences: null,
      ski_discipline: null,
      ski_technique: null,
    };
  }
  const isHike = input.tourType === 'hike';
  const ski = input.tourType === 'ski' && input.ski ? skiFieldsOf(input.ski) : null;
  return {
    tour_type: input.tourType,
    max_hiking_difficulty: isHike ? input.maxHikingDifficulty : null,
    bike_profile: isBike ? input.bikeProfile : null,
    run_profile: isRun ? input.runProfile : null,
    run_pace_seconds_per_km: isRun ? input.runPaceSecondsPerKm : null,
    boat_type: null,
    water_context: null,
    paddle_speed_kmh: null,
    portage_speed_kmh: null,
    paddle_lake_style: null,
    hiking_preferences: isHike ? input.hikingPreferences : null,
    ski_discipline: ski?.ski_discipline ?? null,
    ski_technique: ski?.ski_technique ?? null,
    // What the piste router was asked for and the data it planned on, so the tour reopens as it was planned.
    ski_options: ski ? skiOptionsForDiscipline(ski.ski_discipline, input.ski?.options ?? {}) : null,
    ski_route_build: ski ? (input.skiRouteBuild ?? null) : null,
    ski_planned_legs: ski ? (input.skiPlannedLegs ?? null) : null,
  };
}

/** The types whose time is not the router's: a paddle tour has only its speed, a run its pace, a ride and a ski tour none. */
const UNTIMED_BY_ROUTER: ReadonlySet<PlannableTourType> = new Set(['kayak', 'run', 'horse', 'ski']);

/** The moving time a save carries: the planner's own, else the router's time standing in for a hike without heights. */
function savedDurationSecondsOf(input: TourPlannerFactsInput, walkingDurationMinutes: number | null): number | null {
  if (walkingDurationMinutes !== null) return walkingDurationMinutes * 60;
  return UNTIMED_BY_ROUTER.has(input.tourType) ? null : input.durationSeconds;
}

/** SKI-02: a ski tour is saved with its discipline, a cross-country one with its technique too; null for any other type. */
function skiMissingOf(input: TourPlannerFactsInput) {
  return input.tourType === 'ski' ? skiChoiceMissing(input.ski ?? NO_SKI_CHOICE) : null;
}

/**
 * What the planner derives from its draft, worked out in one place: whether
 * the fields hold, the times, and the fields the tour type adds to a save.
 */
export function tourPlannerFacts(input: TourPlannerFactsInput) {
  const isPaddle = input.tourType === 'kayak';
  const isRun = input.tourType === 'run';
  const { durationSeconds, breakAdditionalMinutes, plannedDurationMinutes } = input;
  const routerMinutes = durationSeconds === null ? null : Math.round(durationSeconds / 60);
  const walkingDurationMinutes = movingMinutes(input, routerMinutes);
  const walk = walkTimesFor(input, walkingDurationMinutes);
  const withBreaks = walkingDurationMinutes === null ? null : walkingDurationMinutes + (breakAdditionalMinutes ?? 0);
  const automaticPlannedTotalMinutes = walk ? walk.totalMinutes : withBreaks;
  const { boatType, waterContext } = input.paddle;
  return {
    isPaddle,
    websiteInvalid: input.website.trim().length > 0 && !tourWebsiteSchema.safeParse(input.website).success,
    plannedDurationInvalid: invalidMinutes(plannedDurationMinutes),
    // A city walk sends no breaks (CW-02), so one left from another type cannot hold its save up.
    breakAdditionalInvalid: input.tourType !== 'walk' && invalidMinutes(breakAdditionalMinutes),
    paddleIncomplete: isPaddle && (boatType === null || waterContext === null),
    /** SKI-02: a ski tour is saved with its discipline, a cross-country one with its technique too. */
    skiMissing: skiMissingOf(input),
    /** RUN-01: a run is planned with a pace; without one Save waits, and a pace that is none is marked. */
    runPaceMissing: isRun && input.runPaceSecondsPerKm === null,
    runPaceInvalid: isRun && runPaceInvalid(input.runPaceSecondsPerKm),
    walkingDurationMinutes,
    /** CW-02: a city walk's walking time, stays and total; null for any other type. */
    stationStays: walk,
    automaticPlannedTotalMinutes,
    plannedTotalMinutes: plannedDurationMinutes ?? automaticPlannedTotalMinutes,
    plannedTotalInvalid:
      plannedDurationMinutes === null &&
      automaticPlannedTotalMinutes !== null &&
      automaticPlannedTotalMinutes > maxTourMinutesFor(input.stageCount ?? 1),
    // A city walk's stops are its stays: it saves no breaks, so a cafe never counts as a stay and a break at once.
    savedBreakAdditionalMinutes: input.tourType === 'walk' ? null : breakAdditionalMinutes,
    savedDurationSeconds: savedDurationSecondsOf(input, walkingDurationMinutes),
    typeFields: typeFieldsOf(input),
  };
}
