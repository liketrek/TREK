import { ADDON_IDS, type AddonId } from '../../addons';
import type { AddonRow } from '../../db/repositories/Addons.repository';

/**
 * The word that leads `<Label> addon is not enabled`, the 404 a switched-off
 * addon answers with, as the REST routes have always spelled it.
 */
const ADDON_LABELS: Readonly<Record<AddonId, string>> = {
  [ADDON_IDS.MCP]: 'MCP',
  [ADDON_IDS.PACKING]: 'Packing',
  [ADDON_IDS.BUDGET]: 'Costs',
  [ADDON_IDS.DOCUMENTS]: 'Documents',
  [ADDON_IDS.VACAY]: 'Vacay',
  [ADDON_IDS.ATLAS]: 'Atlas',
  [ADDON_IDS.COLLAB]: 'Collab',
  [ADDON_IDS.JOURNEY]: 'Journey',
  [ADDON_IDS.AIRTRAIL]: 'AirTrail',
  [ADDON_IDS.DAWARICH]: 'Dawarich',
  [ADDON_IDS.LLM_PARSING]: 'AI parsing',
  [ADDON_IDS.COLLECTIONS]: 'Collections',
  [ADDON_IDS.ROADTRIP]: 'Road trip',
  [ADDON_IDS.TOURS]: 'Tours',
  [ADDON_IDS.AI_ASSISTANT]: 'AI assistant',
};

/**
 * The addons a trip can switch for itself. The seeder gives them type `trip`;
 * this is the same set spelled out for the places that gate a surface before
 * any row is read (the MCP tool gate, the plugin event fan-out).
 */
export const TRIP_ADDON_IDS: ReadonlySet<string> = new Set<string>([
  ADDON_IDS.PACKING,
  ADDON_IDS.BUDGET,
  ADDON_IDS.DOCUMENTS,
  ADDON_IDS.COLLAB,
  ADDON_IDS.ROADTRIP,
  ADDON_IDS.TOURS,
]);

/** `<Label> addon is not enabled` for one addon id; an id without a label leads with the id. */
export function addonOffMessage(addonId: string): string {
  const label = (ADDON_LABELS as Readonly<Record<string, string>>)[addonId] ?? addonId;
  return `${label} addon is not enabled`;
}

/**
 * The photo addon an old migration seeded as a trip addon. It stands for the
 * photo providers, is never switched on as such and has no trip surface, so
 * it is no addon a trip can switch.
 */
const LEGACY_PHOTO_ADDON = 'memories';

type TripAddonRow = AddonRow & { id: string };

/** A row a trip can switch for itself: a trip addon, the legacy photo row aside. */
export function isTripAddonRow(row: AddonRow | null): row is TripAddonRow {
  return !!row?.id && row.type === 'trip' && row.id !== LEGACY_PHOTO_ADDON;
}
