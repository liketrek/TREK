/** What a drawn tour writes onto its owning place; a city walk saved with its stations only has no line yet (CW-11). */
export interface TourPlaceWrite {
  name: string;
  lat: number;
  lng: number;
  route_geometry: string | null;
  description?: string | null;
  website?: string | null;
}

/** The text fields a route edit sends, leaving out the ones it did not touch. */
export function tourPlaceTextPatch(input: Pick<TourPlaceWrite, 'description' | 'website'>) {
  return {
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.website !== undefined ? { website: input.website } : {}),
  };
}
