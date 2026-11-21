import { ADDON_IDS } from '../../addons';
import type { PluginEventMeta } from '../../plugin-event-sink';
import type { AddonsService } from '../addons/addons.service';
import { withRequestContext } from '../database/request-context';
import type { MikroORM } from '@mikro-orm/core';

/**
 * The trip addon a core event belongs to, read from its family (the part of
 * the name before the first colon), or null for an event of the trip itself.
 * A trip that has the addon off sends a plugin none of that family's events,
 * as it shows none of their rows: costs, lists, files, collab, road trip and
 * tours stay between the trip's members while the owner keeps them off.
 */
const FAMILY_ADDON: Readonly<Record<string, string>> = {
  budget: ADDON_IDS.BUDGET,
  packing: ADDON_IDS.PACKING,
  todo: ADDON_IDS.PACKING,
  file: ADDON_IDS.DOCUMENTS,
  collab: ADDON_IDS.COLLAB,
  roadtripBoundary: ADDON_IDS.ROADTRIP,
  roadtripPreferences: ADDON_IDS.ROADTRIP,
  roadtripTrack: ADDON_IDS.ROADTRIP,
  roadtripVia: ADDON_IDS.ROADTRIP,
  tours: ADDON_IDS.TOURS,
};

export function tripAddonOfEvent(event: string): string | null {
  const family = event.split(':', 1)[0];
  return Object.prototype.hasOwnProperty.call(FAMILY_ADDON, family) ? FAMILY_ADDON[family] : null;
}

type Deliver = (tripId: number, event: string, meta?: PluginEventMeta) => void;

/**
 * The plugin event sink with the trip's addons in front of it: an event of a
 * trip addon's family is handed on only once the addon is read as on for the
 * trip, any other event at once. An addon that cannot be read sends nothing,
 * since events are best-effort and a family the owner switched off must not
 * leak through a failed read.
 */
export function tripEventSink(addons: AddonsService, orm: MikroORM | undefined, deliver: Deliver): Deliver {
  return (tripId, event, meta) => {
    const addonId = tripAddonOfEvent(event);
    if (!addonId) return deliver(tripId, event, meta);
    const ask = () => addons.isEnabledForTrip(tripId, addonId);
    void (orm ? withRequestContext(orm, ask) : ask()).then(
      (on) => on && deliver(tripId, event, meta),
      () => undefined,
    );
  };
}
