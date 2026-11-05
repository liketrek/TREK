import type { PlaceClientOrigin } from '@trek/shared';
import { useEffect, useMemo, useState } from 'react';
import { placeDetailsRepo } from '../../repo/placeDetailsRepo';
import type { Place } from '../../types';
import type { PlaceFormData } from './PlaceFormModal.helpers';
import { resultOrigin } from './placeFieldOrigins';
import { refreshCandidates, type RefreshCandidate } from './placeRefresh';

/**
 * The id the details lookup takes for a saved place: its Google id, else its
 * OSM or index id. A place picked anew in the search box brings its own ids
 * into the form, and those win, so the details compared are the picked place's.
 */
function detailIdOf(place: Place | null | undefined, form: PlaceFormData): string | null {
  if (!place) return null;
  return form.google_place_id || form.osm_id || place.google_place_id || place.osm_id || null;
}

/**
 * Fresh details for a place being edited, and the fields where they differ
 * from the form. Asked once per opened place and language; a place without a
 * provider id, and a new place, have nothing to refresh from.
 */
export function usePlaceRefresh({
  place,
  form,
  language,
}: {
  place: Place | null | undefined;
  form: PlaceFormData;
  language: string;
}): { candidates: RefreshCandidate[]; origin: PlaceClientOrigin } {
  const detailId = detailIdOf(place, form);
  // Keyed by what was asked, so a stale answer for another place is never read.
  const [fresh, setFresh] = useState<{ key: string; details: Record<string, unknown> } | null>(null);
  const key = detailId ? `${detailId}|${language}` : null;

  useEffect(() => {
    if (!detailId || !key) return;
    let live = true;
    placeDetailsRepo.details(detailId, language).then(
      (details) => {
        if (live && details) setFresh({ key, details });
      },
      () => undefined
    );
    return () => {
      live = false;
    };
  }, [detailId, key, language]);

  const details = fresh && fresh.key === key ? fresh.details : null;
  const candidates = useMemo(() => refreshCandidates(form, details), [form, details]);
  return { candidates, origin: details ? resultOrigin(details) : 'enrichment' };
}
