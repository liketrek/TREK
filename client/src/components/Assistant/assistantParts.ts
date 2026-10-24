import {
  ASSISTANT_FOLLOW_UPS_TOOL,
  type AssistantApplied,
  type AssistantChangeEffect,
  type AssistantChangeLabelKey,
  type AssistantChangePreview,
  type AssistantFoundPlace,
  type AssistantMessage,
  type AssistantMessagePart,
  type AssistantPlaces,
  type AssistantSources,
  type AssistantWeatherDay,
  type TrekCard,
} from '@trek/shared';

import { CARD_RULES } from './cards/cardLooks';
import type { CardEntry } from './cards/cardTypes';

/**
 * How an answer is laid out: its stored parts read as blocks. Text stays
 * text; the reading tools of a run sit together as one row of steps; the
 * changes the model proposes in one go sit together as one card, each with
 * its preview and, once applied, its receipt. The places a search found sit
 * as one strip, the newest search's, and the weather the steps looked up as
 * one row of days. The cards of reading tools sit as blocks of their group; a
 * write's card rides on its change. Pure, so the window and the phone screen
 * lay an answer out the same way and a test can pin it.
 */

/** Where the settings card for the user's own AI connection lives. */
export const AI_SETTINGS_PATH = '/settings?tab=integrations';

type ToolCallPart = Extract<AssistantMessagePart, { type: 'tool-call' }>;

/** One reading tool the assistant ran or runs. */
export interface ToolStep {
  toolCallId: string;
  toolName: string;
  /** Still waiting for its result while the answer is being written. */
  running: boolean;
}

/**
 * Where a proposed change stands: waiting for the user, being applied,
 * applied, failed, discarded, or closed without a decision (expired, or the
 * turn was stopped).
 */
export type ChangeState = 'pending' | 'applying' | 'applied' | 'failed' | 'discarded' | 'expired';

export interface ChangeItem {
  toolCallId: string;
  /** What the card says about it; null until the preview arrived. */
  preview: AssistantChangePreview | null;
  /** The receipt of an applied change. */
  applied: AssistantApplied | null;
  state: ChangeState;
  /** What the change does as a card: the applied one once it came, else the preview's; null without one. */
  card: TrekCard | null;
}

/** The answer cards of one group, side by side. */
export type CardsBlock = { kind: 'cards'; key: string; group: string; entries: CardEntry[] };

export type MessageBlock =
  | { kind: 'text'; key: string; text: string }
  | { kind: 'steps'; key: string; steps: ToolStep[] }
  | { kind: 'change'; key: string; items: ChangeItem[] }
  | { kind: 'places'; key: string; found: AssistantPlaces }
  | { kind: 'weather'; key: string; days: AssistantWeatherDay[] }
  // A note the model kept in the trip notes on its own, as a quiet line.
  | { kind: 'remembered'; key: string; note: string }
  // The pages the answer cites from the provider's web search, under its text.
  | { kind: 'sources'; key: string; sources: AssistantSources['sources'] }
  | CardsBlock;

/** How cards are laid out: the group each joins, and which ones give way to a change they served. */
export interface CardRules {
  group(card: TrekCard): string;
  yieldsToChange(answer: TrekCard, change: TrekCard): boolean;
  /** Whether an answer holding the card leaves out its found places. */
  hidesFoundPlaces?(card: TrekCard): boolean;
}

/** The change "+ Day 3" on a found place makes; the server holds it without a model turn. */
const FOUND_PLACE_TOOL = 'add_found_place';

/** Two points this close (about ten metres) are the same place. */
const SAME_SPOT_DEG = 1e-4;

/** A found place one of the answer's own changes already proposes, so its card would say the same twice. */
function proposed(place: AssistantFoundPlace, effects: readonly AssistantChangeEffect[]): boolean {
  return effects.some((effect) => {
    if (effect.placeId !== null && effect.placeId === place.inTripPlaceId) return true;
    const spot = effect.place;
    return (
      spot !== null && Math.abs(spot.lat - place.lat) < SAME_SPOT_DEG && Math.abs(spot.lng - place.lng) < SAME_SPOT_DEG
    );
  });
}

/** A name as it is compared with the answer's words: lower case, without accents or marks. */
function folded(text: string): string {
  return text.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase();
}

/**
 * The found places the answer names, first, then the rest; null when the
 * answer is written and names none of them. A search the answer does not
 * draw on is the model's own groundwork and shows no strip.
 */
function namedFirst(places: readonly AssistantFoundPlace[], text: string): AssistantFoundPlace[] | null {
  if (text.trim() === '') return [...places];
  const words = folded(text);
  const named = places.filter((place) => {
    const name = folded(place.name).trim();
    return name.length >= 3 && words.includes(name);
  });
  if (named.length === 0) return null;
  return [...named, ...places.filter((place) => !named.includes(place))];
}

/**
 * The tools that plan or save a tour. An answer that ran one is about the
 * tour, planned or not: the places its searches went through to find the
 * points are the model's groundwork, not suggestions, and show no strip.
 */
const TOUR_PLANNING_TOOLS: ReadonlySet<string> = new Set([
  'propose_hike',
  'create_hike',
  'propose_tour',
  'create_tour',
  'create_paddle_tour',
  'create_ski_tour',
  'update_tour',
  'propose_city_walk',
  'create_city_walk',
  'plan_paddle_route',
  'plan_ski_route',
  'prepare_tour_change',
  'save_tour_change',
  'propose_round_hike',
  'propose_hike_leg_way',
  'import_wanderer_trail',
]);

/** The tool that keeps a note in the trip notes; kept at once, without a card. */
const REMEMBER_TOOL = 'remember_for_trip';

/** The note a call kept, once it is kept; null for any other call, one still running or one refused. */
function rememberedNote(part: Extract<AssistantMessagePart, { type: 'tool-call' }>): string | null {
  if (part.toolName !== REMEMBER_TOOL || part.approval || part.result === undefined || part.isError) return null;
  const note = (part.args as { note?: unknown }).note;
  return typeof note === 'string' && note.trim() !== '' ? note.trim() : null;
}

/** The strip of the answer's found places, named ones first; null when it names none or none is left. */
function placesBlock(
  message: AssistantMessage,
  effects: readonly AssistantChangeEffect[],
  index: number
): MessageBlock | null {
  const found = allFound(message.parts);
  const text = message.parts.map((p) => (p.type === 'text' ? p.text : '')).join(' ');
  const places = namedFirst(
    found.places.filter((place) => !proposed(place, effects)),
    text
  );
  if (!places || places.length === 0) return null;
  return { kind: 'places', key: `places-${index}`, found: { ...found, places } };
}

/** Every day the answer's weather steps looked up, one entry per date (the later look wins), by date. */
function weatherDays(parts: readonly AssistantMessagePart[]): AssistantWeatherDay[] {
  const byDate = new Map<string, AssistantWeatherDay>();
  for (const part of parts) {
    if (part.type === 'data-trek-weather') for (const day of part.data.days) byDate.set(day.date, day);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** The handles one place goes by: its ids, and its name at its spot (to about 100 m). */
function placeKeys(place: AssistantFoundPlace): string[] {
  const ids = [place.googlePlaceId && `g:${place.googlePlaceId}`, place.osmId && `o:${place.osmId}`];
  const spot = `n:${place.name.trim().toLowerCase()}@${place.lat.toFixed(3)},${place.lng.toFixed(3)}`;
  return [...ids.filter((key): key is string => !!key), spot];
}

/**
 * The places all searches of an answer found, in the order they came, each
 * once (also when two searches name it by different ids, as long as name and
 * spot agree), with what the searches left out counted together.
 */
function allFound(parts: AssistantMessage['parts']): AssistantPlaces {
  const seen = new Set<string>();
  const places: AssistantFoundPlace[] = [];
  let more = 0;
  let toolCallId = '';
  for (const part of parts) {
    if (part.type !== 'data-trek-places') continue;
    toolCallId = part.data.toolCallId;
    more += part.data.more;
    for (const place of part.data.places) {
      const keys = placeKeys(place);
      if (keys.some((key) => seen.has(key))) continue;
      keys.forEach((key) => seen.add(key));
      places.push(place);
    }
  }
  return { toolCallId, places, more };
}

/**
 * Adds a change to the change block before it, or starts one. A suggestion
 * from the strip is a block of its own, decided apart from the changes before
 * and after it, even where the answer joins them.
 */
function pushChange(blocks: MessageBlock[], item: ChangeItem, fromStrip: ReadonlySet<string>): void {
  const last = blocks[blocks.length - 1];
  const lastId = last?.kind === 'change' ? last.items[last.items.length - 1]?.toolCallId : undefined;
  const apart = fromStrip.has(item.toolCallId) || (lastId !== undefined && fromStrip.has(lastId));
  if (last?.kind === 'change' && !apart) last.items.push(item);
  else blocks.push({ kind: 'change', key: `change-${item.toolCallId}`, items: [item] });
}

/** The steps block a new step joins: the last one, past any strip or cards shown after it. */
function openSteps(blocks: readonly MessageBlock[]): Extract<MessageBlock, { kind: 'steps' }> | null {
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    if (block?.kind === 'steps') return block;
    if (block?.kind !== 'places' && block?.kind !== 'weather' && block?.kind !== 'cards') return null;
  }
  return null;
}

/** Adds an answer card to the last cards block of its group when only steps lie between them, or starts one. */
function pushCard(blocks: MessageBlock[], entry: CardEntry, group: string): void {
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    if (block?.kind === 'steps') continue;
    if (block?.kind === 'cards' && block.group === group) {
      block.entries.push(entry);
      return;
    }
    break;
  }
  blocks.push({ kind: 'cards', key: `cards-${entry.toolCallId}`, group, entries: [entry] });
}

/** The blocks without the answer cards that give way to one of the message's changes, and without emptied ones. */
function withoutYielded(blocks: MessageBlock[], rules: CardRules): MessageBlock[] {
  const changes = blocks.flatMap((b) => (b.kind === 'change' ? b.items.flatMap((i) => (i.card ? [i.card] : [])) : []));
  if (changes.length === 0) return blocks;
  return blocks.flatMap((block): MessageBlock[] => {
    if (block.kind !== 'cards') return [block];
    const entries = block.entries.filter((e) => !changes.some((change) => rules.yieldsToChange(e.card, change)));
    return entries.length > 0 ? [{ ...block, entries }] : [];
  });
}

/** The change a call holds, with its preview, receipt and card; null for a reading step. */
function changeItemOf(
  part: ToolCallPart,
  preview: AssistantChangePreview | null,
  receipts: ReadonlyMap<string, AssistantApplied>,
  cards: ReadonlyMap<string, TrekCard>
): ChangeItem | null {
  if (!part.approval && !preview) return null;
  const applied = receipts.get(part.toolCallId) ?? null;
  return {
    toolCallId: part.toolCallId,
    preview,
    applied,
    state: changeState(part, applied),
    card: cards.get(part.toolCallId) ?? preview?.card ?? null,
  };
}

function changeState(part: ToolCallPart, applied: AssistantApplied | null): ChangeState {
  const approval = part.approval;
  if (approval?.resolution) return 'expired';
  if (approval?.approved === false) return 'discarded';
  if (approval?.approved === true) {
    if (part.isError) return 'failed';
    return applied || part.result !== undefined ? 'applied' : 'applying';
  }
  return 'pending';
}

/**
 * The blocks of a message, in the order its parts came. `writing` says the
 * message is still being streamed, so a step without a result is running and
 * not merely unanswered.
 *
 * The places of all its searches join into one strip where the newest search
 * sat, each place once, without the ones a change the model proposed in the
 * answer already holds; the weather of all steps joins
 * into one row where the first look sat. A strip does not split the steps
 * around it: a step after it joins the row of steps before it.
 *
 * A reading tool's card joins the cards block of its group (by `rules`, the
 * kinds' looks unless a test hands others) when only steps lie between them;
 * a card under a change's id is that change's and forms no block. Last,
 * answer cards that give way to one of the message's changes are left out.
 */
export function messageBlocks(
  message: AssistantMessage,
  writing: boolean,
  rules: CardRules = CARD_RULES
): MessageBlock[] {
  const previews = new Map<string, AssistantChangePreview>();
  const receipts = new Map<string, AssistantApplied>();
  const cards = new Map<string, TrekCard>();
  const changeIds = new Set<string>();
  const effects: AssistantChangeEffect[] = [];
  // A place the user suggested from the strip stays on it, marked as suggested.
  const fromStrip = new Set(
    message.parts.flatMap((p) => (p.type === 'tool-call' && p.toolName === FOUND_PLACE_TOOL ? [p.toolCallId] : []))
  );
  let lastPlaces = -1;
  let firstWeather = -1;
  message.parts.forEach((part, index) => {
    if (part.type === 'data-trek-change') {
      previews.set(part.data.toolCallId, part.data);
      if (part.data.effect && !fromStrip.has(part.data.toolCallId)) effects.push(part.data.effect);
      changeIds.add(part.data.toolCallId);
    } else if (part.type === 'data-trek-applied') receipts.set(part.data.toolCallId, part.data);
    else if (part.type === 'data-trek-places') lastPlaces = index;
    else if (part.type === 'data-trek-weather' && firstWeather < 0) firstWeather = index;
    else if (part.type === 'data-trek-card' && part.data.card) cards.set(part.data.toolCallId, part.data.card);
    else if (part.type === 'tool-call' && part.approval) changeIds.add(part.toolCallId);
  });

  // An answer about a tour shows the tour, not the places its searches went through to find it.
  const changeCards = message.parts.flatMap((p) => (p.type === 'data-trek-change' && p.data.card ? [p.data.card] : []));
  const placesHidden =
    [...cards.values(), ...changeCards].some((card) => rules.hidesFoundPlaces?.(card) === true) ||
    message.parts.some((p) => p.type === 'tool-call' && TOUR_PLANNING_TOOLS.has(p.toolName));
  const blocks: MessageBlock[] = [];
  message.parts.forEach((part, index) => {
    if (part.type === 'text') {
      if (part.text.trim()) blocks.push({ kind: 'text', key: `text-${index}`, text: part.text });
      return;
    }
    if (part.type === 'data-trek-places' && index === lastPlaces && !placesHidden) {
      const strip = placesBlock(message, effects, index);
      if (strip) blocks.push(strip);
      return;
    }
    if (part.type === 'data-trek-sources') {
      blocks.push({ kind: 'sources', key: `sources-${index}`, sources: part.data.sources });
      return;
    }
    if (part.type === 'data-trek-weather' && index === firstWeather) {
      blocks.push({ kind: 'weather', key: `weather-${index}`, days: weatherDays(message.parts) });
      return;
    }
    if (part.type === 'data-trek-card') {
      const { toolCallId, card } = part.data;
      // A card under a change's id is that change's; it rides on its row.
      if (card && !changeIds.has(toolCallId)) pushCard(blocks, { toolCallId, card }, rules.group(card));
      return;
    }
    // The follow-ups the model offered are chips under the answer, never a step.
    if (part.type !== 'tool-call' || part.toolName === ASSISTANT_FOLLOW_UPS_TOOL) return;
    const item = changeItemOf(part, previews.get(part.toolCallId) ?? null, receipts, cards);
    if (item) {
      pushChange(blocks, item, fromStrip);
      return;
    }
    const note = rememberedNote(part);
    if (note !== null) {
      blocks.push({ kind: 'remembered', key: `remembered-${part.toolCallId}`, note });
      return;
    }
    const step: ToolStep = {
      toolCallId: part.toolCallId,
      toolName: part.toolName,
      running: writing && part.result === undefined,
    };
    const steps = openSteps(blocks);
    if (steps) steps.steps.push(step);
    else blocks.push({ kind: 'steps', key: `steps-${part.toolCallId}`, steps: [step] });
  });
  return withoutYielded(blocks, rules);
}

/**
 * Whether "+ Day" was already pressed on this found place in the answer: a
 * suggestion from the strip names the trip's place by its id, a new one by
 * the spot the search found it at.
 */
export function suggestedFromStrip(message: AssistantMessage, place: AssistantFoundPlace): boolean {
  return message.parts.some((part) => {
    if (part.type !== 'tool-call' || part.toolName !== FOUND_PLACE_TOOL) return false;
    const args = part.args as { placeId?: unknown; lat?: unknown; lng?: unknown };
    if (place.inTripPlaceId !== null && args.placeId === place.inTripPlaceId) return true;
    return (
      typeof args.lat === 'number' &&
      typeof args.lng === 'number' &&
      Math.abs(args.lat - place.lat) < SAME_SPOT_DEG &&
      Math.abs(args.lng - place.lng) < SAME_SPOT_DEG
    );
  });
}

/** Whether a change somewhere in the chat still waits for the user; nothing new can be suggested until then. */
export function hasUndecided(messages: readonly AssistantMessage[]): boolean {
  return messages.some((m) =>
    m.parts.some(
      (p) => p.type === 'tool-call' && !!p.approval && p.approval.approved === undefined && !p.approval.resolution
    )
  );
}

/** How long an applied change can still be undone, in ms; 0 once it cannot. */
export function undoLeftMs(applied: AssistantApplied | null, now: number): number {
  if (!applied?.undoUntil) return 0;
  return Math.max(0, Date.parse(applied.undoUntil) - now);
}

/** The label of each field a change row can show. A table, so every key is named where it is read. */
export const CHANGE_LABELS: Record<AssistantChangeLabelKey, { labelKey: string }> = {
  // A tool's own argument: the row names it in `field`, this is only its fallback.
  field: { labelKey: 'assistant.change.label.field' },
  order: { labelKey: 'assistant.change.label.order' },
  name: { labelKey: 'assistant.change.label.name' },
  description: { labelKey: 'assistant.change.label.description' },
  address: { labelKey: 'assistant.change.label.address' },
  coordinates: { labelKey: 'assistant.change.label.coordinates' },
  category: { labelKey: 'assistant.change.label.category' },
  day: { labelKey: 'assistant.change.label.day' },
  time: { labelKey: 'assistant.change.label.time' },
  endTime: { labelKey: 'assistant.change.label.endTime' },
  notes: { labelKey: 'assistant.change.label.notes' },
  website: { labelKey: 'assistant.change.label.website' },
  phone: { labelKey: 'assistant.change.label.phone' },
  email: { labelKey: 'assistant.change.label.email' },
  openingHours: { labelKey: 'assistant.change.label.openingHours' },
  price: { labelKey: 'assistant.change.label.price' },
  currency: { labelKey: 'assistant.change.label.currency' },
  stopType: { labelKey: 'assistant.change.label.stopType' },
  text: { labelKey: 'assistant.change.label.text' },
  icon: { labelKey: 'assistant.change.label.icon' },
  color: { labelKey: 'assistant.change.label.color' },
  position: { labelKey: 'assistant.change.label.position' },
  quantity: { labelKey: 'assistant.change.label.quantity' },
  weight: { labelKey: 'assistant.change.label.weight' },
  bag: { labelKey: 'assistant.change.label.bag' },
  packed: { labelKey: 'assistant.change.label.packed' },
  dueDate: { labelKey: 'assistant.change.label.dueDate' },
  priority: { labelKey: 'assistant.change.label.priority' },
  assignee: { labelKey: 'assistant.change.label.assignee' },
  type: { labelKey: 'assistant.change.label.type' },
  location: { labelKey: 'assistant.change.label.location' },
  link: { labelKey: 'assistant.change.label.link' },
  confirmation: { labelKey: 'assistant.change.label.confirmation' },
  checkIn: { labelKey: 'assistant.change.label.checkIn' },
  checkOut: { labelKey: 'assistant.change.label.checkOut' },
  stay: { labelKey: 'assistant.change.label.stay' },
  members: { labelKey: 'assistant.change.label.members' },
  route: { labelKey: 'assistant.change.label.route' },
  difficulty: { labelKey: 'assistant.change.label.difficulty' },
  track: { labelKey: 'assistant.change.label.track' },
  packing: { labelKey: 'assistant.change.label.packing' },
  breaks: { labelKey: 'assistant.change.label.breaks' },
};

/**
 * Where an answer's closing words and changes begin: the block after its last
 * step, strip or card. That end is what the thread brings into view once the
 * answer is written.
 */
export function tailStart(blocks: MessageBlock[]): number {
  let i = blocks.length;
  while (i > 0 && (blocks[i - 1].kind === 'text' || blocks[i - 1].kind === 'change')) i -= 1;
  return i;
}
