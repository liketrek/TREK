import type { AssistantApplied, AssistantChangeVerbKey, TrekCard, TrekCardKind } from '@trek/shared';
import {
  CalendarArrowUp,
  CalendarDays,
  CalendarMinus,
  CalendarPlus,
  Circle,
  ListTodo,
  Luggage,
  MapPin,
  MapPinPlus,
  NotebookPen,
  PencilLine,
  Plus,
  StickyNote,
  Ticket,
  Trash2,
  Wallet,
} from 'lucide-react';

import type { CardMapLook } from '../../../types/assistantMap';
import type { CardRules } from '../assistantParts';
import { ATLAS_LOOK } from './atlas/atlasLook';
import { BOOK_LOOK } from './book/bookLook';
import { BOOK_DESIGN_LOOK } from './bookDesign/bookDesignLook';
import { BOOKING_LOOK } from './booking/bookingLook';
import { BUDGET_LOOK } from './budget/budgetLook';
import type { CardLook, EntityLook, StepLook, VerbLook } from './cardTypes';
import { COLLAB_LOOK } from './collab/collabLook';
import { COLLECTION_LOOK } from './collection/collectionLook';
import { HOME_LOOK } from './home/homeLook';
import { JOURNEY_LOOK } from './journey/journeyLook';
import { PACKING_LOOK } from './packing/packingLook';
import { ROADTRIP_LOOK } from './roadtrip/roadtripLook';
import { TOUR_LOOK } from './tour/tourLook';
import { VACAY_LOOK } from './vacay/vacayLook';

/**
 * The chat's whole pure look: the core rows (the trip plan's verbs, the tools
 * TREK names an action for, the reading steps, what an applied change opens)
 * with every part of TREK's own look merged in. No components here, so the
 * step names, the share text and the map read it without pulling in a card.
 *
 * Every label is a literal key, so the i18n check sees each one where it is
 * named instead of guessing at a template.
 */

/** What each kind of change looks like. A table, so a new verb fails to compile until it has a look. */
export const VERB_LOOK: Readonly<Record<AssistantChangeVerbKey, VerbLook>> = {
  addPlace: { Icon: MapPinPlus, tone: 'success', labelKey: 'assistant.change.verb.addPlace' },
  addPlaceToDay: { Icon: CalendarPlus, tone: 'success', labelKey: 'assistant.change.verb.addPlaceToDay' },
  updatePlace: { Icon: PencilLine, tone: 'info', labelKey: 'assistant.change.verb.updatePlace' },
  assignPlace: { Icon: CalendarPlus, tone: 'success', labelKey: 'assistant.change.verb.assignPlace' },
  moveAssignment: { Icon: CalendarArrowUp, tone: 'warning', labelKey: 'assistant.change.verb.moveAssignment' },
  removeFromDay: { Icon: CalendarMinus, tone: 'danger', labelKey: 'assistant.change.verb.removeFromDay' },
  addDayNote: { Icon: StickyNote, tone: 'success', labelKey: 'assistant.change.verb.addDayNote' },
  updateDayNote: { Icon: StickyNote, tone: 'info', labelKey: 'assistant.change.verb.updateDayNote' },
  addPackingItem: { Icon: Luggage, tone: 'success', labelKey: 'assistant.change.verb.addPackingItem' },
  updatePackingItem: { Icon: Luggage, tone: 'info', labelKey: 'assistant.change.verb.updatePackingItem' },
  addTodo: { Icon: ListTodo, tone: 'success', labelKey: 'assistant.change.verb.addTodo' },
  addBudgetItem: { Icon: Wallet, tone: 'success', labelKey: 'assistant.change.verb.addBudgetItem' },
  updateBudgetItem: { Icon: Wallet, tone: 'info', labelKey: 'assistant.change.verb.updateBudgetItem' },
  addReservation: { Icon: Ticket, tone: 'success', labelKey: 'assistant.change.verb.addReservation' },
  importBooking: { Icon: Ticket, tone: 'success', labelKey: 'assistant.change.verb.importBooking' },
  rememberNote: { Icon: NotebookPen, tone: 'info', labelKey: 'assistant.change.verb.rememberNote' },
  importTour: { Icon: Plus, tone: 'success', labelKey: 'assistant.change.verb.importTour' },
  genericCreate: { Icon: Plus, tone: 'success', labelKey: 'assistant.change.verb.genericCreate' },
  genericUpdate: { Icon: PencilLine, tone: 'info', labelKey: 'assistant.change.verb.genericUpdate' },
  genericRemove: { Icon: Trash2, tone: 'danger', labelKey: 'assistant.change.verb.genericRemove' },
  ...TOUR_LOOK.verbs,
  ...ROADTRIP_LOOK.verbs,
  ...BUDGET_LOOK.verbs,
  ...BOOKING_LOOK.verbs,
  ...COLLAB_LOOK.verbs,
  ...COLLECTION_LOOK.verbs,
  ...ATLAS_LOOK.verbs,
  ...VACAY_LOOK.verbs,
  ...JOURNEY_LOOK.verbs,
  ...PACKING_LOOK.verbs,
  ...BOOK_LOOK.verbs,
  ...BOOK_DESIGN_LOOK.verbs,
};

/** The tools TREK names an action of their own for; a change by any other tool is named by its verb. */
export const TOOL_LABELS: Readonly<Partial<Record<string, { labelKey: string }>>> = {
  reorder_day_assignments: { labelKey: 'assistant.tool.reorder_day_assignments' },
  update_assignment_time: { labelKey: 'assistant.tool.update_assignment_time' },
  update_assignment_notes: { labelKey: 'assistant.tool.update_assignment_notes' },
  set_leg_transport_mode: { labelKey: 'assistant.tool.set_leg_transport_mode' },
  set_assignment_end_day: { labelKey: 'assistant.tool.set_assignment_end_day' },
  clear_day_assignments: { labelKey: 'assistant.tool.clear_day_assignments' },
  set_assignment_participants: { labelKey: 'assistant.tool.set_assignment_participants' },
  create_day: { labelKey: 'assistant.tool.create_day' },
  update_day: { labelKey: 'assistant.tool.update_day' },
  delete_day: { labelKey: 'assistant.tool.delete_day' },
  reorder_days: { labelKey: 'assistant.tool.reorder_days' },
  delete_place: { labelKey: 'assistant.tool.delete_place' },
  rate_place: { labelKey: 'assistant.tool.rate_place' },
  bulk_update_places: { labelKey: 'assistant.tool.bulk_update_places' },
  delete_day_note: { labelKey: 'assistant.tool.delete_day_note' },
  toggle_packing_item: { labelKey: 'assistant.tool.toggle_packing_item' },
  delete_packing_item: { labelKey: 'assistant.tool.delete_packing_item' },
  update_todo: { labelKey: 'assistant.tool.update_todo' },
  toggle_todo: { labelKey: 'assistant.tool.toggle_todo' },
  delete_todo: { labelKey: 'assistant.tool.delete_todo' },
  delete_budget_item: { labelKey: 'assistant.tool.delete_budget_item' },
  update_reservation: { labelKey: 'assistant.tool.update_reservation' },
  delete_reservation: { labelKey: 'assistant.tool.delete_reservation' },
  create_accommodation: { labelKey: 'assistant.tool.create_accommodation' },
  create_transport: { labelKey: 'assistant.tool.create_transport' },
  mark_country_visited: { labelKey: 'assistant.tool.mark_country_visited' },
  confirm_bucket_list_visits: { labelKey: 'assistant.tool.confirm_bucket_list_visits' },
  clear_bucket_list_visit: { labelKey: 'assistant.tool.clear_bucket_list_visit' },
  accept_atlas_countries: { labelKey: 'assistant.tool.accept_atlas_countries' },
  send_collab_message: { labelKey: 'assistant.tool.send_collab_message' },
  ...TOUR_LOOK.tools,
  ...ROADTRIP_LOOK.tools,
  ...BUDGET_LOOK.tools,
  ...BOOKING_LOOK.tools,
  ...COLLAB_LOOK.tools,
  ...COLLECTION_LOOK.tools,
  ...ATLAS_LOOK.tools,
  ...VACAY_LOOK.tools,
  ...JOURNEY_LOOK.tools,
  ...PACKING_LOOK.tools,
  ...BOOK_LOOK.tools,
  ...BOOK_DESIGN_LOOK.tools,
};

/** How each reading tool is named while it runs; a tool not listed reads "Working on it". */
export const STEP_LOOKS: Readonly<Partial<Record<string, StepLook>>> = {
  get_trip_summary: { stepKey: 'assistant.step.reading' },
  // The provider's own web search, told as a step of its own (ASSISTANT_WEB_SEARCH_STEP).
  web_search: { stepKey: 'assistant.step.webSearch', live: { liveKey: 'assistant.step.webSearchFor', param: 'query' } },
  list_places: { stepKey: 'assistant.step.reading' },
  search_place: {
    stepKey: 'assistant.step.searching',
    live: { liveKey: 'assistant.step.searchingFor', param: 'query' },
  },
  search_pois: { stepKey: 'assistant.step.searching', live: { liveKey: 'assistant.step.nearbyAt', param: 'place' } },
  get_place_details: { stepKey: 'assistant.step.details' },
  search_nearby_places: {
    stepKey: 'assistant.step.nearby',
    live: { liveKey: 'assistant.step.nearbyAt', param: 'place' },
  },
  list_categories: { stepKey: 'assistant.step.categories' },
  get_weather: { stepKey: 'assistant.step.weather', live: { liveKey: 'assistant.step.weatherAt', param: 'place' } },
  list_todos: { stepKey: 'assistant.step.todos' },
  get_settlement_summary: { stepKey: 'assistant.step.costs' },
  list_budget_items: { stepKey: 'assistant.step.expenses' },
  get_budget_per_person: { stepKey: 'assistant.step.shares' },
  get_wind_forecast: { stepKey: 'assistant.step.wind' },
  get_journey_tracks: { stepKey: 'assistant.step.tracks' },
  scan_bucket_list_visits: { stepKey: 'assistant.step.bucketScan' },
  suggest_atlas_countries: { stepKey: 'assistant.step.atlasCountries' },
  propose_hike: {
    stepKey: 'assistant.step.planningHike',
    live: { liveKey: 'assistant.step.planningHikeTo', param: 'place' },
  },
  search_help: { stepKey: 'assistant.step.help' },
  read_booking_file: { stepKey: 'assistant.step.readingBooking' },
  ...TOUR_LOOK.steps,
  ...ROADTRIP_LOOK.steps,
  ...BUDGET_LOOK.steps,
  ...BOOKING_LOOK.steps,
  ...COLLAB_LOOK.steps,
  ...COLLECTION_LOOK.steps,
  ...ATLAS_LOOK.steps,
  ...VACAY_LOOK.steps,
  ...JOURNEY_LOOK.steps,
  ...PACKING_LOOK.steps,
  ...BOOK_LOOK.steps,
  ...BOOK_DESIGN_LOOK.steps,
  ...HOME_LOOK.steps,
};

/** Shown on the map by its day: a stop or a note lives on one. */
const BY_DAY: EntityLook['onMap'] = (applied) => ({ placeId: null, dayId: applied.dayId });

/**
 * What an applied change touches and where it can be seen. A place shows
 * itself, a stop or a note its day; a kept note and the rest have no place on
 * the map. A table, so a new entity fails to compile until it has a row.
 */
export const ENTITY_LOOK: Readonly<Record<AssistantApplied['entity'], EntityLook>> = {
  place: {
    Icon: MapPin,
    onMap: (applied) => {
      const placeId = applied.ids[0] ?? null;
      return { placeId, dayId: placeId === null ? applied.dayId : null };
    },
  },
  assignment: { Icon: CalendarDays, onMap: BY_DAY },
  day_note: { Icon: StickyNote, onMap: BY_DAY },
  memory: { Icon: NotebookPen },
  other: { Icon: Circle },
  ...TOUR_LOOK.entities,
  ...ROADTRIP_LOOK.entities,
  ...BUDGET_LOOK.entities,
  ...BOOKING_LOOK.entities,
  ...COLLAB_LOOK.entities,
  ...COLLECTION_LOOK.entities,
  ...ATLAS_LOOK.entities,
  ...VACAY_LOOK.entities,
  ...JOURNEY_LOOK.entities,
  ...PACKING_LOOK.entities,
  ...BOOK_LOOK.entities,
  ...BOOK_DESIGN_LOOK.entities,
};

/**
 * The look of a verb or an entity as a stored or streamed change names it. A
 * newer server may name one this build has no row for (the shared schema
 * reads it as `genericUpdate` or `other`, but an older one did not), so an
 * unknown name looks like a plain update or a thing with nothing to open.
 */
export function verbLookOf(verbKey: AssistantChangeVerbKey): VerbLook {
  return VERB_LOOK[verbKey] ?? VERB_LOOK.genericUpdate;
}

export function entityLookOf(entity: AssistantApplied['entity']): EntityLook {
  return ENTITY_LOOK[entity] ?? ENTITY_LOOK.other;
}

/** The pure look of every kind of card. */
export const CARD_LOOKS: { readonly [K in TrekCardKind]: CardLook<K> } = {
  ...TOUR_LOOK.cards,
  ...ROADTRIP_LOOK.cards,
  ...BUDGET_LOOK.cards,
  ...BOOKING_LOOK.cards,
  ...COLLAB_LOOK.cards,
  ...COLLECTION_LOOK.cards,
  ...ATLAS_LOOK.cards,
  ...VACAY_LOOK.cards,
  ...JOURNEY_LOOK.cards,
  ...PACKING_LOOK.cards,
  ...BOOK_LOOK.cards,
  ...BOOK_DESIGN_LOOK.cards,
  ...HOME_LOOK.cards,
};

/** The look of the card in hand, typed for any kind. */
function lookOf(card: TrekCard): CardLook<TrekCardKind> {
  return CARD_LOOKS[card.kind] as CardLook<TrekCardKind>;
}

/**
 * How an answer lays its cards out: the group each joins, and which ones give
 * way to a change they served. The chat, the phone, the follow-ups and the
 * share text all read these, so none of them groups a card differently.
 */
export const CARD_RULES: CardRules = {
  group: (card) => lookOf(card).group?.(card) ?? card.kind,
  yieldsToChange: (answer, change) => lookOf(answer).yieldsToChange?.(answer, change) ?? false,
  hidesFoundPlaces: (card) => lookOf(card).hidesFoundPlaces === true,
};

/** What the plan's map draws for a card through its kind's look; nothing for a kind that draws nothing. */
export const CARD_MAP_LOOK: CardMapLook = {
  lines: (card, use) => lookOf(card).lines?.(card, use) ?? [],
  ghosts: (card) => lookOf(card).ghosts?.(card) ?? [],
  hidesEffectGhost: (card) => lookOf(card).hidesEffectGhost?.(card) ?? false,
};
