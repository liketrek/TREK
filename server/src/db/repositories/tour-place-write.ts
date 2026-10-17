/** What a drawn tour writes onto its owning place. */
export interface TourPlaceWrite {
  name: string;
  lat: number;
  lng: number;
  route_geometry: string;
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
