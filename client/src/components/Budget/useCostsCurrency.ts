import { useMemo, useState } from 'react';

import { useSettingsStore } from '../../store/settingsStore';
import type { Trip } from '../../types';
import { currencyOptions } from './costsModel';

const storageKey = (tripId: number) => `trek:costs-currency:${tripId}`;

/** The currency picked for one trip's Costs in this browser, or null for the usual one. */
function readPicked(tripId: number): string | null {
  try {
    return localStorage.getItem(storageKey(tripId));
  } catch {
    return null;
  }
}

function writePicked(tripId: number, currency: string | null) {
  try {
    if (currency) localStorage.setItem(storageKey(tripId), currency);
    else localStorage.removeItem(storageKey(tripId));
  } catch {
    /* storage unavailable: the choice lasts until reload */
  }
}

/**
 * The currency Costs shows a trip in (#1683). Usually the user's display currency
 * from Settings, else the trip's own; a trip can be read in another one, say the
 * currency of the country the travellers go on to, without touching Settings or
 * anything stored. The pick is per trip and kept in this browser, like the
 * list or table view: it is how this person reads the trip, not part of it. The
 * server converts the settlement into whatever base it is asked for.
 */
export function useCostsCurrency(tripId: number, trip: Trip | null | undefined) {
  const displayCurrency = useSettingsStore((s) => s.settings.default_currency);
  const usual = (displayCurrency || trip?.currency || 'EUR').toUpperCase();
  const stored = useMemo(() => readPicked(tripId), [tripId]);
  const [pickedByTrip, setPickedByTrip] = useState<Record<number, string | null>>({});
  const picked = tripId in pickedByTrip ? pickedByTrip[tripId] : stored;
  const base = (picked || usual).toUpperCase();

  // Picking the usual currency drops the pick, so a later change in Settings applies again.
  const setBase = (next: string) => {
    const currency = next.toUpperCase() === usual ? null : next.toUpperCase();
    writePicked(tripId, currency);
    setPickedByTrip((prev) => ({ ...prev, [tripId]: currency }));
  };

  // The usual currency and the trip's own lead the list, the two most read in.
  const baseOptions = currencyOptions(base, [usual, (trip?.currency || usual).toUpperCase()]);

  return { base, usual, setBase, baseOptions };
}
