import type { RoadtripStopType } from '@trek/shared';
import { useCallback, useState } from 'react';

import type { RoadtripStopDraft } from './RoadtripStopPopup';
import { STOP_KIND_BY_KEY, STOP_KINDS } from './stopKinds';

/**
 * The kind and length a drafted stop opens with: an edit answers with what the stop
 * already says, a new one with what the hit brings along (a charge is not a fuel stop,
 * and each kind carries how long it usually takes), and half an hour of nothing in
 * particular otherwise.
 */
export function stopDraftDefaults(draft: RoadtripStopDraft | null | undefined): {
  stopType: RoadtripStopType | null;
  dwell: number;
} {
  const suggested = STOP_KINDS.find((k) => k.key === draft?.poi.category);
  return {
    stopType: draft?.editing ? draft.editing.stopType : (suggested?.key ?? null),
    dwell: draft?.editing?.dwellMinutes ?? suggested?.defaultMinutes ?? 30,
  };
}

/**
 * The two questions a stop found along the drive answers before it goes onto the trip,
 * what kind it is and how long it takes, behind the desktop stop popup and the phone's
 * draft sheet. `initialDraft` gives the first answers; both seed them again with
 * `seed` for every draft they are handed while they stay open.
 */
export function useStopDraftForm(initialDraft: RoadtripStopDraft | null) {
  const [stopType, setStopType] = useState<RoadtripStopType | null>(() => stopDraftDefaults(initialDraft).stopType);
  const [dwell, setDwell] = useState<number>(() => stopDraftDefaults(initialDraft).dwell);
  const [saving, setSaving] = useState(false);

  const kind = STOP_KINDS.find((k) => k.key === stopType);

  /**
   * Picking a kind also picks how long it takes, until the user says otherwise.
   * Picking the kind already chosen changes nothing, so a length set by hand survives it.
   */
  const pickKind = (key: RoadtripStopType) => {
    if (stopType === key) return;
    setStopType(key);
    setDwell(STOP_KIND_BY_KEY[key]?.defaultMinutes ?? dwell);
  };

  const seed = useCallback((draft: RoadtripStopDraft | null) => {
    const defaults = stopDraftDefaults(draft);
    setStopType(defaults.stopType);
    setDwell(defaults.dwell);
  }, []);

  return { stopType, dwell, setDwell, saving, setSaving, kind, pickKind, seed };
}
