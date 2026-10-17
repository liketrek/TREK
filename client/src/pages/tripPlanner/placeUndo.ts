import { useTripStore, type TripStoreState } from '../../store/tripStore';
import type { Accommodation, Assignment, AssignmentsMap, BudgetItem, Place, Reservation, TripFile } from '../../types';

/** What the server takes down along with a place, as far as the planner has it loaded. */
export interface PlaceDependents {
  places: Place[];
  tripAccommodations: Accommodation[];
  reservations: Reservation[];
  budgetItems: BudgetItem[];
  files: TripFile[];
  userId: number | null | undefined;
}

/**
 * Whether deleting these places takes something with them that an undo cannot put back.
 *
 * An undo writes the place again under a new id. The server deletes a booked night with
 * its place, the booking made for it and the expense written against either, unlinks
 * any other booking and every file, drops the votes, and removes an uploaded picture
 * once nothing else shows it. Writing the place again brings none of that back, so a
 * delete that touched any of it is not offered for undo rather than reported as undone
 * while half of it stays lost. The traveller's own vote is the exception: it is theirs
 * to cast again, and the undo does.
 */
export function deleteLosesDependents(placeIds: number[], dependents: PlaceDependents): boolean {
  const ids = new Set(placeIds);
  const at = (id: number | null | undefined) => id != null && ids.has(Number(id));
  return (
    dependents.tripAccommodations.some((stay) => at(stay.place_id)) ||
    dependents.reservations.some((r) => at(r.place_id) || at(r.accommodation_place_id)) ||
    dependents.budgetItems.some((item) => at(item.place_id)) ||
    dependents.files.some((file) => at(file.place_id) || (file.linked_place_ids ?? []).some(at)) ||
    dependents.places.some(
      (place) =>
        ids.has(place.id) &&
        (isUploadedImage(place.image_url) || (place.ratings ?? []).some((vote) => vote.user_id !== dependents.userId))
    )
  );
}

/** A picture uploaded for the place, which the server deletes from disk along with it. */
function isUploadedImage(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.startsWith('/uploads/places/');
}

/** Every field the place was created with, for writing it again. */
function placeRestorePayload(place: Place): Partial<Place> & { name: string } {
  return {
    name: place.name,
    description: place.description,
    lat: place.lat,
    lng: place.lng,
    address: place.address,
    category_id: place.category_id,
    price: place.price,
    currency: place.currency,
    place_time: place.place_time,
    end_time: place.end_time,
    duration_minutes: place.duration_minutes,
    notes: place.notes,
    image_url: place.image_url,
    google_place_id: place.google_place_id,
    google_ftid: place.google_ftid,
    osm_id: place.osm_id,
    amap_poi_id: place.amap_poi_id,
    website: place.website,
    phone: place.phone,
    email: place.email,
    opening_hours: place.opening_hours,
    transport_mode: place.transport_mode,
    // An undone track has to come back as a track, not a bare point.
    route_geometry: place.route_geometry,
    route_color: place.route_color,
    stop_type: place.stop_type,
    fill_percent: place.fill_percent,
    // The create route takes the tags as ids.
    tags: (place.tags ?? []).map((tag) => tag.id).filter((id): id is number => id != null) as unknown as Place['tags'],
  };
}

/** One day the place was planned on, with what that visit carried. */
export interface PlaceVisit {
  dayId: number;
  placeId: number;
  orderIndex: number;
  time: string | null;
  endTime: string | null;
  notes: string | null;
  endDay: boolean;
  routeExcluded: boolean;
  legMode: string | null;
  incomingLegMode: string | null;
  participantIds: number[];
}

/** What one visit carried, for planning it again after it was taken off its day. */
export function visitOf(dayId: number, a: Assignment): PlaceVisit {
  return {
    dayId,
    placeId: a.place.id,
    orderIndex: a.order_index,
    time: a.assignment_time ?? null,
    endTime: a.assignment_end_time ?? null,
    notes: a.notes ?? null,
    endDay: a.end_day === true,
    routeExcluded: a.route_excluded === true,
    legMode: a.leg_transport_mode ?? null,
    incomingLegMode: a.incoming_leg_transport_mode ?? null,
    participantIds: (a.participants ?? []).map((p) => p.user_id),
  };
}

export function capturePlaceVisits(assignments: AssignmentsMap, placeIds: number[]): PlaceVisit[] {
  return Object.entries(assignments).flatMap(([dayId, items]) =>
    items.filter((a) => a.place?.id != null && placeIds.includes(a.place.id)).map((a) => visitOf(Number(dayId), a))
  );
}

export type RestoreActions = Pick<
  TripStoreState,
  | 'addPlace'
  | 'assignPlaceToDay'
  | 'setAssignmentTimes'
  | 'setAssignmentNotes'
  | 'setAssignmentEndDay'
  | 'setAssignmentRouteExcluded'
  | 'setAssignmentParticipants'
  | 'setAssignmentLegMode'
  | 'ratePlace'
>;

/**
 * Writes a deleted place again with everything it had, plans it on the days it was on
 * that still exist, each visit with its times, note, travellers and legs, and casts the
 * traveller's own vote on it again. Resolves to the new place.
 */
export async function restorePlace(
  tripId: number | string,
  actions: RestoreActions,
  place: Place,
  visits: PlaceVisit[],
  userId: number | null | undefined
): Promise<Place> {
  const restored = await actions.addPlace(tripId, placeRestorePayload(place));
  const live = new Set(useTripStore.getState().days.map((d) => d.id));
  for (const visit of visits) {
    if (visit.placeId !== place.id || !live.has(visit.dayId)) continue;
    const assignment = await actions.assignPlaceToDay(tripId, visit.dayId, restored.id, visit.orderIndex);
    if (assignment?.id) await restoreVisit(tripId, actions, visit, assignment.id);
  }
  const ownVote = (place.ratings ?? []).find((vote) => vote.user_id === userId);
  if (ownVote) await actions.ratePlace(tripId, restored.id, ownVote.rating);
  return restored;
}

/** Gives a visit planned again the times, note, end of day, travellers and legs it had. */
export async function restoreVisit(
  tripId: number | string,
  actions: Omit<RestoreActions, 'addPlace' | 'assignPlaceToDay' | 'ratePlace'>,
  visit: PlaceVisit,
  assignmentId: number
) {
  const { dayId } = visit;
  if (visit.time || visit.endTime) {
    await actions.setAssignmentTimes(tripId, dayId, assignmentId, { place_time: visit.time, end_time: visit.endTime });
  }
  if (visit.notes) await actions.setAssignmentNotes(tripId, dayId, assignmentId, visit.notes);
  if (visit.endDay) await actions.setAssignmentEndDay(tripId, dayId, assignmentId, true);
  if (visit.routeExcluded) await actions.setAssignmentRouteExcluded(tripId, dayId, assignmentId, true);
  if (visit.participantIds.length > 0)
    await actions.setAssignmentParticipants(tripId, dayId, assignmentId, visit.participantIds);
  if (visit.legMode) await actions.setAssignmentLegMode(tripId, dayId, assignmentId, visit.legMode);
  if (visit.incomingLegMode)
    await actions.setAssignmentLegMode(tripId, dayId, assignmentId, visit.incomingLegMode, 'incoming');
}
