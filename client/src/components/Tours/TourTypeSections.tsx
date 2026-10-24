import type { TourListItem } from '@trek/shared';
import type { Assignment, AssignmentsMap, Day, Place } from '../../types';
import { BikeWaysView } from './bike/BikeWaysCard';
import { PaddleCheckSection } from './paddle/PaddleCheckSection';
import { PaddleWindSection } from './paddle/PaddleWindCard';
import { WalkStationsCard } from './walk/WalkStations';

/** Where a tour starts, the place its wind is asked for (PAD-08). */
function placeStart(place: Place): { lat: number; lng: number } | null {
  return place.lat != null && place.lng != null ? { lat: place.lat, lng: place.lng } : null;
}

interface TourTypeSectionsProps {
  tour: TourListItem;
  place: Place;
  assignment: Pick<Assignment, 'id' | 'day_id'> | null;
  canAssign: boolean;
  days: readonly Day[];
  assignments: AssignmentsMap;
  /** The measured line, or null while the tour has none to measure. */
  route: [number, number][] | null;
  /** Whether the line has been measured; the bike ways are only asked for then. */
  measured: boolean;
}

/**
 * The cards only one kind of tour has: a walk's stations, a bike tour's ways,
 * a paddle tour's check and wind. They live apart from the detail dialog so
 * the dialog stays a list of sections rather than a switch over tour types.
 */
export function TourTypeSections({
  tour,
  place,
  assignment,
  canAssign,
  days,
  assignments,
  route,
  measured,
}: TourTypeSectionsProps) {
  if (tour.tour_type === 'walk') {
    return (
      <WalkStationsCard
        tour={tour}
        tripId={place.trip_id}
        assignment={assignment}
        canMark={canAssign}
        days={days}
        assignments={assignments}
        route={route}
      />
    );
  }
  if (tour.tour_type === 'bike') {
    return <BikeWaysView tripId={place.trip_id} route={route} bikeProfile={tour.bike_profile} active={measured} />;
  }
  if (tour.tour_type === 'kayak') {
    return (
      <>
        <PaddleCheckSection tour={tour} />
        <PaddleWindSection placeId={place.id} start={placeStart(place)} />
      </>
    );
  }
  return null;
}
