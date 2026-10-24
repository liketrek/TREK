import { useEffect } from 'react';

import { useAssistantStore } from '../../store/assistantStore';
import type { PlaceFormOpeners } from './usePlaceFormOpeners';

/**
 * A place the assistant found, opened in the place form when its card is
 * clicked: filled in with what the search knew, the details column reading
 * the rest (photos, hours, description) by its Google id. The form is the
 * planner's own, so the place is saved as any other, on the day in focus.
 */
export function useAssistantPlaceDraft(tripId: number, openAddPlaceFromPoi: PlaceFormOpeners['openAddPlaceFromPoi']) {
  const draft = useAssistantStore((s) => (s.placeDraft?.tripId === tripId ? s.placeDraft : null));
  const takePlaceDraft = useAssistantStore((s) => s.takePlaceDraft);

  useEffect(() => {
    if (!draft) return;
    takePlaceDraft(draft.seq);
    const { place } = draft;
    openAddPlaceFromPoi(
      {
        lat: place.lat,
        lng: place.lng,
        name: place.name,
        address: place.address,
        website: null,
        phone: null,
        osm_id: place.osmId ?? '',
        google_place_id: place.googlePlaceId,
        poi_type: place.kind,
      },
      draft.dayId
    );
  }, [draft, openAddPlaceFromPoi, takePlaceDraft]);
}
