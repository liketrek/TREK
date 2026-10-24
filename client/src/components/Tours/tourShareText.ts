import type { TourListItem } from '@trek/shared';
import type { DistanceUnit } from '../../types';
import { formatDistance, formatElevation } from '../../utils/units';
import type { Translate } from './tourDayTimeHint';
import { heightsUnknown } from './tourFacts';
import { formatPlannedTourDuration, tourPlannedTimes } from './tourPresentation';

/**
 * What a tour's short share text says about it, as the card's head shows it:
 * the type, the distance, the ascent and the time. Unknown values are null and
 * left out of the text.
 */
export interface TourShareFacts {
  tourType: TourListItem['tour_type'];
  distanceKm: number | null;
  gain: number | null;
  minutes: number | null;
}

/** The facts of a saved tour, measured from its line where there is one, like the card's head. */
export function tourShareFactsOf(
  tour: TourListItem,
  analysis: { distanceKm: number; gain: number | null } | null
): TourShareFacts {
  const times = tourPlannedTimes(tour);
  const gain = analysis ? analysis.gain : tour.elevation_gain;
  return {
    tourType: tour.tour_type,
    distanceKm: analysis?.distanceKm ?? tour.distance,
    // A paddle tour's heights are read off the banks, not the water: they stay unknown.
    gain: heightsUnknown(tour) ? null : gain,
    minutes: times.plannedTotalMinutes ?? times.walkingMinutes,
  };
}

/** What the planner knows of the tour it edits, measured from its line as it is now. */
interface PlannerShareSource {
  tourType: TourShareFacts['tourType'];
  isPaddle: boolean;
  routeAnalysis: { distanceKm: number; gain: number | null } | null;
  plannedTotalMinutes: number | null;
  walkingDurationMinutes: number | null;
}

/** The facts of the tour open in the planner, like its rail shows them. */
export function plannerShareFacts(planner: PlannerShareSource): TourShareFacts {
  return {
    tourType: planner.tourType,
    distanceKm: planner.routeAnalysis?.distanceKm ?? null,
    // A paddle tour's heights stay unknown here too.
    gain: planner.isPaddle ? null : (planner.routeAnalysis?.gain ?? null),
    minutes: planner.plannedTotalMinutes ?? planner.walkingDurationMinutes,
  };
}

/** What the share text is made of: the tour's name, its facts where known, the trip's name. */
interface TourShareTextInput {
  name: string;
  facts: TourShareFacts | null;
  tripName: string | null;
}

/**
 * The tour as a few lines of plain text, for a browser that cannot hand the GPX
 * file on: its name, type, distance, ascent, time and the trip it belongs to.
 */
export function tourShareText({ name, facts, tripName }: TourShareTextInput, t: Translate, unit: DistanceUnit): string {
  const lines = [name.trim() || null];
  if (facts) {
    lines.push(t(`tourTypes.${facts.tourType}`));
    if (facts.distanceKm != null) {
      lines.push(`${t('tours.detail.distance')}: ${formatDistance(facts.distanceKm, unit)}`);
    }
    if (facts.gain != null) lines.push(`${t('tours.detail.ascent')}: ${formatElevation(facts.gain, unit)}`);
    if (facts.minutes != null) {
      lines.push(t('tours.gpxExport.shareDuration', { time: formatPlannedTourDuration(facts.minutes) }));
    }
  }
  const trip = tripName?.trim();
  if (trip) lines.push(t('tours.gpxExport.shareTrip', { name: trip }));
  return lines.filter((line): line is string => !!line).join('\n');
}
