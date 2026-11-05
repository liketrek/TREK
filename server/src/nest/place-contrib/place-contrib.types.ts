import type { PlaceContribField } from '@trek/shared';

/** One field of a place whose current value the user typed, as the origin tracking hands it over. */
export interface ContribValue {
  field: PlaceContribField;
  /** The column's value: the place's own text, the hours' JSON, the uploaded picture's URL. */
  value: string;
}

/**
 * A place write the origin tracking saw, for the contribution queue: what names
 * the place, the user-typed values it now holds, and the fields that are no
 * longer the user's (cleared, or set by someone else), whose queued values go.
 */
export interface ContribWrite {
  placeId: number;
  /** `osm_id` of the place; only a `gers:` or OpenStreetMap id makes it contributable. */
  osmId: string | null;
  name: string;
  lat: number | null;
  lng: number | null;
  country: string | null;
  values: ContribValue[];
  dropped: PlaceContribField[];
}
