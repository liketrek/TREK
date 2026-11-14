type Coordinate = number | string | null | undefined;

/** A number the map can use. Zero is one; an empty form field or a blank string is not. */
const isCoordinate = (value: Coordinate): boolean =>
  value != null && String(value).trim() !== '' && Number.isFinite(Number(value));

/**
 * Whether a place has an address but nothing to put it on the map with (#2837).
 *
 * The address field is plain text: a place saved with a typed address, and no pick from
 * the search, no pasted link and no point on the map, has no coordinates, so it gets no
 * marker, no route and no navigation, and nothing used to say why. The form, the place's
 * detail and the place lists say so. A place with neither is a note on purpose and is
 * left alone. Reads a saved place (numbers) and the form (strings) alike.
 */
export function addressWithoutCoordinates(place: {
  address?: string | null;
  lat?: Coordinate;
  lng?: Coordinate;
}): boolean {
  return !!place.address?.trim() && !(isCoordinate(place.lat) && isCoordinate(place.lng));
}
