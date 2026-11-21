import {
  CarFront,
  Compass,
  FileText,
  ListChecks,
  Mountain,
  Puzzle,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '../../i18n';
import { useTripAddons } from './useTripAddons';

/** The addons table's `icon` names of the trip addons; road trip was seeded as `Route`, the car says it better. */
const ICONS: Readonly<Record<string, LucideIcon>> = {
  ListChecks,
  Wallet,
  FileText,
  Users,
  Route: CarFront,
  Mountain,
  Compass,
};

/** One trip addon as the trip settings list it. */
interface TripAddonRow {
  id: string;
  name: string;
  description: string;
  Icon: LucideIcon;
  enabled: boolean;
  /** The owner chose this for the trip, so it differs from the instance. */
  ownChoice: boolean;
  busy: boolean;
  toggle: () => void;
}

/**
 * The rows of the trip settings' Addons area, the same on the desktop dialog and
 * the phone sheet. Flipping a switch back to what the instance says drops the
 * trip's own choice instead of storing a copy of it, so a later change by the
 * admin reaches the trip again and no reset button is needed.
 */
export function useTripAddonRows(tripId: number) {
  const { t } = useTranslation();
  const trip = useTripAddons(tripId);
  const [busy, setBusy] = useState<string | null>(null);

  const rows: TripAddonRow[] = trip.addons.map((addon) => {
    // Spelled out inside t() so the key check sees which catalog keys this reaches.
    const name = t(`admin.addons.catalog.${addon.id}.name`);
    const description = t(`admin.addons.catalog.${addon.id}.description`);
    return {
      id: addon.id,
      name: name === `admin.addons.catalog.${addon.id}.name` ? addon.name : name,
      description: description === `admin.addons.catalog.${addon.id}.description` ? '' : description,
      Icon: (addon.icon && ICONS[addon.icon]) || Puzzle,
      enabled: addon.enabled,
      ownChoice: addon.overridden,
      busy: busy === addon.id,
      toggle: () => {
        if (busy) return;
        const next = !addon.enabled;
        setBusy(addon.id);
        void trip.setOverride(addon.id, next === addon.instanceEnabled ? null : next).finally(() => setBusy(null));
      },
    };
  });

  return { rows, loading: trip.loading && rows.length === 0 };
}
