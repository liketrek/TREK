import type { Tag, Participant } from '../../types';
import type { AssignmentWithPlaceRow } from '../../db/repositories/DayAssignments.repository';
import type { PlaceRatingRow } from '../query-helpers/query-helpers.service';

/**
 * Pure reshaping over rows the query helpers load. Neither function touches the
 * database, so neither became a provider — they shipped in
 * services/queryHelpers.ts next to the loaders only because the loaders were
 * free functions too.
 */

/**
 * Reshape a flat assignment+place DB row into the nested API response shape with
 * embedded place, tags, and participants.
 *
 * Typed on `AssignmentWithPlaceRow` (`DayAssignmentsRepository`'s own DY1/DY3/
 * AS1/AS3 projection row) — Plan 3c Task 2 review, "For Task 3" §6.3: the
 * legacy `types.ts#AssignmentRow` narrows several columns to non-null that
 * the physical projection genuinely returns nullable (rule 16), and Task 2
 * bridged the gap with a documented `as unknown as AssignmentRow` cast at
 * its one call site rather than widen the type. Every real call site
 * (`DaysService.list`, `AssignmentsService.getAssignmentWithPlace`/
 * `listDayAssignments`) passes this same repository row, so typing the
 * parameter on it directly removes all three casts in one change instead of
 * adding a fourth.
 */
export function formatAssignmentWithPlace(a: AssignmentWithPlaceRow, tags: Partial<Tag>[], participants: Participant[]) {
  return {
    id: a.id,
    day_id: a.day_id,
    place_id: a.place_id,
    order_index: a.order_index,
    notes: a.notes,
    assignment_time: a.assignment_time ?? null,
    assignment_end_time: a.assignment_end_time ?? null,
    end_day: a.end_day === 1,
    leg_transport_mode: a.leg_transport_mode ?? null,
    incoming_leg_transport_mode: a.incoming_leg_transport_mode ?? null,
    // Kept on the day but not driven to (#2532).
    route_excluded: a.route_excluded === 1,
    // Which booking put this stop here, if a booking did. The day list has nothing
    // else to tell it from a place the traveller added, and it must not draw the
    // hotel a second time under the overnight block that already names it.
    accommodation_id: a.accommodation_id ?? null,
    participants: participants || [],
    created_at: a.created_at,
    place: {
      id: a.place_id,
      name: a.place_name,
      description: a.place_description,
      lat: a.lat,
      lng: a.lng,
      address: a.address,
      category_id: a.category_id,
      price: a.price,
      currency: a.place_currency,
      place_time: a.place_time,
      end_time: a.end_time,
      duration_minutes: a.duration_minutes,
      notes: a.place_notes,
      image_url: a.image_url,
      transport_mode: a.transport_mode,
      google_place_id: a.google_place_id,
      google_ftid: a.google_ftid,
      osm_id: a.osm_id,
      amap_poi_id: a.amap_poi_id,
      website: a.website,
      phone: a.phone,
      // The rail marks a fuel stop as one; without it here every stop would need
      // its own place request to find out what kind it is.
      stop_type: a.stop_type ?? null,
      // Same reason: the rail resets a range budget here and has to know how far this
      // stop fills, not how far the traveller's default one does.
      fill_percent: a.fill_percent ?? null,
      category: a.category_id ? {
        id: a.category_id,
        name: a.category_name,
        color: a.category_color,
        icon: a.category_icon,
      } : null,
      tags: tags || [],
    }
  };
}

/** avg/count aggregate for a place's rating rows. */
export function ratingAggregate(ratings: PlaceRatingRow[] | undefined) {
  const rows = ratings || [];
  return {
    rating_avg: rows.length > 0 ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : null,
    rating_count: rows.length,
  };
}
