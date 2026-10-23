import type { DomainCards } from '../card-types';
import { idIn, recordOf } from '../card-values';
import {
  describeAddVia,
  describeAddVias,
  describeDayEnd,
  describeImportRoute,
  describeMoveVia,
  describeRemoveVia,
  describeRepinVias,
  describeSettings,
  describeTransit,
} from './roadtrip-describe';
import { roadtripAnswerCard } from './roadtrip-drive';
import {
  chargingAnswerCard,
  corridorAnswerCard,
  googleRouteCard,
  transitAnswerCard,
  transitChangeCard,
} from './roadtrip-reads';
import {
  addViaCard,
  addViasCard,
  importRouteCard,
  loadDayVias,
  moveViaCard,
  removeViaCard,
  repinViasCard,
} from './roadtrip-route';
import { dayEndCard, loadSavedSettings, settingsCard } from './roadtrip-rules';
import { REMOVE_ADDED_VIA } from './roadtrip-undo';

/** The ids of the day's stops a Google Maps route import created (`assignment_ids`), the entity its receipt names. */
function importedAssignmentIds(_args: unknown, result: unknown): number[] {
  const ids = recordOf(result).assignment_ids;
  return Array.isArray(ids) ? ids.filter((id): id is number => typeof id === 'number') : [];
}

/**
 * The road trip in the assistant chat: the drive calculate_roadtrip worked
 * out, drawn as the planner's rail; what a corridor search found along a
 * day; a charger as one look found it; transit connections; and a card for
 * every change that bends a drive, changes its settings, ends a day or takes
 * in a Google Maps route. The day endings and the Google Maps route tools
 * load with the road trip's own tools.
 */
export const ROADTRIP_CARDS: DomainCards = {
  id: 'roadtrip',
  tools: {
    // The geometry is the card's, never the model's: the redaction drops every key holding it.
    calculate_roadtrip: { argPolicy: { forced: { includeGeometry: true } }, answer: roadtripAnswerCard },
    search_roadtrip_corridor: { answer: corridorAnswerCard },
    get_roadtrip_charging_info: { answer: chargingAnswerCard },
    lookup_roadtrip_charging_info: { answer: chargingAnswerCard },
    search_transit_routes: { answer: transitAnswerCard },
    // A held read: its card is the receipt's, once the user let it fetch the link.
    preview_google_maps_route: { applied: ({ result }) => googleRouteCard(result) },
    add_route_via: {
      write: { verbKey: 'addRouteVia', entity: 'roadtrip' },
      describe: describeAddVia,
      change: addViaCard,
      appliedIds: (_args, result) => {
        const viaId = idIn(result, 'via');
        return viaId === null ? [] : [viaId];
      },
      undo: REMOVE_ADDED_VIA,
    },
    add_route_vias: {
      write: { verbKey: 'shapeRoute', entity: 'roadtrip' },
      load: loadDayVias,
      describe: describeAddVias,
      change: addViasCard,
    },
    update_route_via: {
      write: { verbKey: 'moveRouteVia', entity: 'roadtrip' },
      load: loadDayVias,
      describe: describeMoveVia,
      change: moveViaCard,
    },
    remove_route_via: {
      write: { verbKey: 'removeRouteVia', entity: 'roadtrip' },
      load: loadDayVias,
      describe: describeRemoveVia,
      change: removeViaCard,
    },
    reanchor_route_vias: {
      write: { verbKey: 'repinRouteVias', entity: 'roadtrip' },
      load: loadDayVias,
      describe: describeRepinVias,
      change: repinViasCard,
    },
    update_roadtrip_settings: {
      write: { verbKey: 'updateDriveSettings', entity: 'roadtrip' },
      load: loadSavedSettings,
      describe: describeSettings,
      change: settingsCard,
    },
    set_day_boundary: {
      write: { verbKey: 'setDayBoundary', entity: 'roadtrip' },
      describe: describeDayEnd,
      change: dayEndCard,
    },
    import_google_maps_route: {
      write: { verbKey: 'importRoute', entity: 'assignment' },
      describe: describeImportRoute,
      change: importRouteCard,
      appliedIds: importedAssignmentIds,
    },
    create_transit_journey: {
      write: { verbKey: 'addTransit', entity: 'reservation' },
      describe: describeTransit,
      change: (_ctx, args) => transitChangeCard(args),
    },
  },
  prompt: [
    'The app draws calculate_roadtrip, corridor searches, charger checks, transit searches and road trip changes as ' +
      'cards; sum them up in a sentence and name the warnings, never list their days, stops or connections again.',
  ],
  toolControllers: { roadtrip: ['DayBoundariesMcp', 'GoogleRouteMcp'] },
};
