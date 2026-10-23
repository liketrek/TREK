import { type AssistantApplied, type AssistantMessage, haversineMetres, type TrekCard } from '@trek/shared';

import type { AssistantRouteLine, CardMapLook, GhostPoint, RouteLineSpec, RouteUse } from '../types/assistantMap';
import { receiptsOf } from './assistantMapModel';

/**
 * Which routes of the chat's cards the plan's map draws, and how. Three
 * kinds of card stand on the map: a change still to be decided (or applied,
 * until the trip holds what it made), with the way it replaces faint beside
 * it; and the cards of the latest answer that drew any, the ways of one
 * proposal each in its letter's colour, the chosen one solid. Pure and
 * React-free: the store holds the chat, the planner hands in the cards'
 * map looks (`CardMapLook`), and the tests need neither.
 */

/** A card of the chat under the call it came from. */
export interface RouteCardEntry {
  toolCallId: string;
  card: TrekCard;
}

/** The letters the ways of one answer go by, in the order the answer gave them. */
type RouteWayKey = 'a' | 'b' | 'c';
const WAY_KEYS: readonly RouteWayKey[] = ['a', 'b', 'c'];

/** The colour each way is drawn in, the planner's own for the ways of a section (styles/hike.css). */
const WAY_PAINT: Readonly<Record<RouteWayKey, string>> = {
  a: 'var(--hike-variant-a)',
  b: 'var(--hike-variant-b)',
  c: 'var(--hike-variant-c)',
};

/** The rim a line gets when its card names none. */
const DEFAULT_CASING = 'var(--bg-card)';

/** A line whose ends lie closer than this is a loop: one disc at its start, no ring at its end. */
const LOOP_M = 60;

/**
 * A card the map draws, in the part it plays: `pending` a change, `before`
 * the way that change replaces, `look` a card of an answer. `way` is its
 * letter among the ways of one answer, `picked` whether it is the chosen one.
 */
export interface RouteRef {
  toolCallId: string;
  card: TrekCard;
  use: RouteUse;
  way: RouteWayKey | null;
  picked: boolean;
}

/**
 * How an answer lays out its cards, as the chat does: the groups that show
 * as one card. A group of several is a choice between ways.
 */
export type AnswerLayout = (entries: readonly RouteCardEntry[]) => readonly (readonly RouteCardEntry[])[];

/** Every card on its own, for a planner that knows no groups. */
const ALONE: AnswerLayout = (entries) => entries.map((entry) => [entry]);

type ToolCallPart = Extract<AssistantMessage['parts'][number], { type: 'tool-call' }>;

/** What an applied change made that becomes a place of the trip, and so arrives on the map by itself. */
const BECOMES_A_PLACE: ReadonlySet<AssistantApplied['entity']> = new Set(['tour', 'place']);

/** The card of each change of the thread (its applied card once there, else its preview's), and every change's call. */
function changeCards(messages: readonly AssistantMessage[]): { cards: Map<string, TrekCard>; changeIds: Set<string> } {
  const previews = new Map<string, TrekCard>();
  const posted = new Map<string, TrekCard>();
  const changeIds = new Set<string>();
  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type === 'data-trek-change') {
        changeIds.add(part.data.toolCallId);
        if (part.data.card) previews.set(part.data.toolCallId, part.data.card);
      } else if (part.type === 'tool-call' && part.approval) changeIds.add(part.toolCallId);
      else if (part.type === 'data-trek-card' && part.data.card) posted.set(part.data.toolCallId, part.data.card);
    }
  }
  const cards = new Map(previews);
  for (const [toolCallId, card] of posted) if (changeIds.has(toolCallId)) cards.set(toolCallId, card);
  return { cards, changeIds };
}

/**
 * Whether a change still stands on the map: undecided, or applied and not
 * answered yet, or applied with a place the trip does not hold yet (the
 * place comes with the broadcast, and its real line takes over then). A
 * change that was discarded, expired or failed does not.
 */
function standsOnMap(part: ToolCallPart, receipt: AssistantApplied | undefined, known: ReadonlySet<number>): boolean {
  const approval = part.approval;
  if (!approval || approval.resolution || approval.approved === false) return false;
  if (approval.approved === undefined) return true;
  if (part.isError) return false;
  if (!receipt) return part.result === undefined;
  const placeId = receipt.ids[0];
  return BECOMES_A_PLACE.has(receipt.entity) && placeId !== undefined && !known.has(placeId);
}

/**
 * The cards of the latest answer that draws any, laid out as the chat lays
 * them out: a group of several is a choice of ways, each with its letter, the
 * chosen one (by `picks`, else the first) picked. Older answers drop.
 */
function lookRefs(
  messages: readonly AssistantMessage[],
  changeIds: ReadonlySet<string>,
  picks: Readonly<Record<string, string>>,
  look: CardMapLook,
  layout: AnswerLayout
): RouteRef[] {
  const chosenIds = new Set(Object.values(picks));
  for (let index = messages.length - 1; index >= 0; index--) {
    const answers = (messages[index]?.parts ?? []).flatMap((part): RouteCardEntry[] =>
      part.type === 'data-trek-card' && part.data.card && !changeIds.has(part.data.toolCallId)
        ? [{ toolCallId: part.data.toolCallId, card: part.data.card }]
        : []
    );
    const lined = answers.filter((entry) => look.lines(entry.card, 'look').length > 0);
    const drawn = new Set(lined.map((entry) => entry.toolCallId));
    if (drawn.size === 0) continue;
    return layout(answers).flatMap((group) => {
      const ways = group.length >= 2;
      const chosen = group.find((entry) => chosenIds.has(entry.toolCallId)) ?? group[0];
      return group.flatMap((entry, position): RouteRef[] => {
        if (!drawn.has(entry.toolCallId)) return [];
        const way = ways ? (WAY_KEYS[position] ?? null) : null;
        return [{ ...entry, use: 'look', way, picked: ways && entry === chosen }];
      });
    });
  }
  return [];
}

/**
 * Every card of the chat the map draws now, in the part it plays: the
 * changes that still stand on the map (each with the way it replaces), then
 * the cards of the latest answer that draws any.
 */
export function routeRefs(
  messages: readonly AssistantMessage[],
  picks: Readonly<Record<string, string>>,
  knownPlaceIds: ReadonlySet<number>,
  look: CardMapLook,
  layout: AnswerLayout = ALONE
): RouteRef[] {
  const { cards, changeIds } = changeCards(messages);
  const receipts = receiptsOf(messages);
  const refs: RouteRef[] = [];
  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type !== 'tool-call') continue;
      const card = cards.get(part.toolCallId);
      if (!card || !standsOnMap(part, receipts.get(part.toolCallId), knownPlaceIds)) continue;
      refs.push({ toolCallId: part.toolCallId, card, use: 'before', way: null, picked: false });
      refs.push({ toolCallId: part.toolCallId, card, use: 'pending', way: null, picked: false });
    }
  }
  return [...refs, ...lookRefs(messages, changeIds, picks, look, layout)];
}

/** Where a route starts and ends; a loop has no end of its own. */
function endsOf(lines: readonly [number, number][][]): AssistantRouteLine['ends'] | null {
  const first = lines[0]?.[0];
  const lastLine = lines[lines.length - 1];
  const last = lastLine?.[lastLine.length - 1];
  if (!first || !last) return null;
  const loop = haversineMetres(first[0], first[1], last[0], last[1]) <= LOOP_M;
  return { start: first, end: loop ? null : last };
}

/**
 * One spec of a card as the map draws it. A way not chosen is dashed until
 * it is pointed at; a line straight between its stops stays dashed. Only a
 * route the card gives a rim to has ends (a via's move is a hint, not a
 * route), and only a faint line leaves them out.
 */
function lineOf(
  ref: RouteRef,
  spec: RouteLineSpec,
  hoveredId: string | null
): { line: AssistantRouteLine; rank: number } {
  const hot = ref.toolCallId === hoveredId;
  const unchosen = ref.way !== null && !ref.picked;
  const line: AssistantRouteLine = {
    id: `${ref.toolCallId}:${ref.use}:${spec.id}`,
    ref: ref.toolCallId,
    lines: spec.lines,
    color: ref.way ? WAY_PAINT[ref.way] : spec.color,
    casing: spec.casing ?? DEFAULT_CASING,
    ...extrasOf(spec, unchosen),
  };
  if (spec.dashed || (unchosen && !hot)) line.dashed = true;
  if (spec.dim) line.dim = true;
  if (hot) line.hot = true;
  return { line, rank: rankOf(ref, hot) };
}

/** A route's ends, named stops and hard grades, as far as its spec has them; a way not chosen shows no grades. */
function extrasOf(spec: RouteLineSpec, unchosen: boolean): Pick<AssistantRouteLine, 'ends' | 'stops' | 'tints'> {
  const extras: Pick<AssistantRouteLine, 'ends' | 'stops' | 'tints'> = {};
  const ends = spec.casing && !spec.dim ? endsOf(spec.lines) : null;
  if (ends) extras.ends = ends;
  if (spec.stops && spec.stops.length > 0) extras.stops = spec.stops;
  if (spec.tints && spec.tints.length > 0 && !unchosen) extras.tints = spec.tints;
  return extras;
}

/** Where a line lies among the others: the replaced way at the bottom, the chosen way high, the lit one on top. */
function rankOf(ref: RouteRef, hot: boolean): number {
  if (hot) return 3;
  if (ref.use === 'before') return 0;
  return ref.picked ? 2 : 1;
}

/**
 * The lines to draw, bottom first: the ways changes replace, then the
 * others, the chosen way, and last the one under the pointer, so it lies on
 * top where lines share a path.
 */
export function routeLines(
  refs: readonly RouteRef[],
  look: CardMapLook,
  hoveredId: string | null
): AssistantRouteLine[] {
  const drawn = refs.flatMap((ref) => look.lines(ref.card, ref.use).map((spec) => lineOf(ref, spec, hoveredId)));
  return drawn
    .map((entry, order) => ({ ...entry, order }))
    .sort((a, b) => a.rank - b.rank || a.order - b.order)
    .map((entry) => entry.line);
}

/** A spot a waiting change marks on the map, lit with its row by the change's call (`ref`). */
interface CardGhost extends GhostPoint {
  ref: string;
}

/** The spots the waiting changes' cards mark (a road trip's new stops and vias), each under its own id. */
export function cardGhosts(refs: readonly RouteRef[], look: CardMapLook): CardGhost[] {
  return refs.flatMap((ref) =>
    ref.use === 'pending'
      ? look.ghosts(ref.card).map((ghost) => ({ ...ghost, id: `${ref.toolCallId}:${ghost.id}`, ref: ref.toolCallId }))
      : []
  );
}

/** The changes whose card draws them itself, so the pin of the place they add would only cover its start. */
export function cardHiddenGhosts(refs: readonly RouteRef[], look: CardMapLook): Set<string> {
  const hiding = refs.filter((ref) => ref.use === 'pending' && look.hidesEffectGhost(ref.card));
  return new Set(hiding.map((ref) => ref.toolCallId));
}

/** The points of every line an answer draws, to frame the map on them. */
export function lookPoints(refs: readonly RouteRef[], look: CardMapLook): [number, number][] {
  return refs.flatMap((ref) =>
    ref.use === 'look' ? look.lines(ref.card, 'look').flatMap((spec) => spec.lines.flat()) : []
  );
}
