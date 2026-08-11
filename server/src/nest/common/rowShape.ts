import type { AssignmentRow, Tag, Participant } from '../../types';
import type { PlaceRatingRow } from '../query-helpers/query-helpers.service';

/**
 * Pure reshaping over rows the query helpers load. Neither function touches the
 * database, so neither became a provider — they shipped in
 * services/queryHelpers.ts next to the loaders only because the loaders were
 * free functions too.
 */

/** Reshape a flat assignment+place DB row into the nested API response shape with embedded place, tags, and participants. */
export function formatAssignmentWithPlace(a: AssignmentRow, tags: Partial<Tag>[], participants: Participant[]) {
  return {
    id: a.id,
    day_id: a.day_id,
    place_id: a.place_id,
    order_index: a.order_index,
    notes: a.notes,
    assignment_time: a.assignment_time ?? null,
    assignment_end_time: a.assignment_end_time ?? null,
    leg_transport_mode: a.leg_transport_mode ?? null,
    incoming_leg_transport_mode: a.incoming_leg_transport_mode ?? null,
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
      website: a.website,
      phone: a.phone,
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
