import type {
  AssistantApplied,
  AssistantChangeVerbKey,
  AssistantMessage,
  TrekCard,
  TrekCardKind,
  TrekCardOf,
} from '@trek/shared';
import type { LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';

import type { TripTabId } from '../../../constants/tripTabs';
import type { GhostPoint, RouteLineSpec, RouteUse } from '../../../types/assistantMap';
import type { FollowUp } from '../assistantFollowUpRules';
import type { ChangeItem } from '../assistantParts';
import type { Tone } from './parts/assistantTones';

/**
 * The shapes every part of TREK fills to bring its cards into the chat. A
 * part writes a pure look (`<pkg>Look.ts`: verbs, tool names, steps, what an
 * applied change opens, follow-ups, map lines) and its views
 * (`<pkg>Views.tsx`: the components); `cardLooks.ts` and `cardViews.ts` merge
 * them, and a table that misses a kind, a verb or an entity fails to compile.
 */

/** How a kind of change looks: its icon, its tone and the name of what it does. */
export interface VerbLook {
  Icon: LucideIcon;
  tone: Tone;
  labelKey: string;
}

/** `liveKey` names the step with the place or query it is at, `param` is the word that fills it. */
export interface StepLook {
  stepKey: string;
  live?: { liveKey: string; param: 'place' | 'query' };
}

/** Where a card or an applied change takes the user: a spot on the plan's map, a tab of the trip, another page. */
export type EntityTarget =
  | { kind: 'map'; placeId: number | null; dayId: number | null }
  | { kind: 'tab'; tab: TripTabId; sub?: string; params?: Record<string, string> }
  | { kind: 'page'; path: string };

/** What an applied change touches, and where it can be seen afterwards. */
export interface EntityLook {
  Icon: LucideIcon;
  openLabelKey?: string;
  phoneOpenLabelKey?: string;
  onMap?(applied: AssistantApplied, card: TrekCard | null): { placeId: number | null; dayId: number | null } | null;
  open?(applied: AssistantApplied, card: TrekCard | null): EntityTarget | null;
  /** Where "Open" goes on the phone instead, where the tab `open` names may not exist; null shows none there. */
  phoneOpen?(applied: AssistantApplied, card: TrekCard | null): EntityTarget | null;
}

/** What a kind offers to ask next; `when` keeps it to the answers whose cards of the kind call for it. */
export interface CardFollowUp<K extends TrekCardKind> extends FollowUp {
  when?(card: TrekCardOf<K>): boolean;
}

/**
 * The pure side of one kind: what it touches, what to ask next, how an answer
 * lays it out, and what the map draws for it (see types/assistantMap.ts). Pure,
 * so the chat, the follow-ups, the share text and the map read one layout.
 */
export interface CardLook<K extends TrekCardKind> {
  entity?(card: TrekCardOf<K>): AssistantApplied['entity'];
  followUps?: readonly CardFollowUp<K>[];
  /** The group an answer card joins; the kind when left out. */
  group?(card: TrekCardOf<K>): string;
  /** Drops a lookup card next to the change it served. */
  yieldsToChange?(answer: TrekCardOf<K>, change: TrekCard): boolean;
  lines?(card: TrekCardOf<K>, use: RouteUse): RouteLineSpec[];
  ghosts?(card: TrekCardOf<K>): GhostPoint[];
  hidesEffectGhost?(card: TrekCardOf<K>): boolean;
  /**
   * Whether an answer holding this card leaves out the strip of places its
   * searches found: a planned tour searched only to find its start, and a
   * strip of hotels beside it would read as suggestions.
   */
  hidesFoundPlaces?: boolean;
}

/** One part of TREK's pure look, for the kinds `K` it owns. */
export interface PackLook<K extends TrekCardKind> {
  verbs: Partial<Record<AssistantChangeVerbKey, VerbLook>>;
  tools: Readonly<Record<string, { labelKey: string }>>;
  steps: Readonly<Record<string, StepLook>>;
  entities: Partial<Record<AssistantApplied['entity'], EntityLook>>;
  cards: { [P in K]: CardLook<P> };
}

/** One card of an answer, under the tool call it came from. */
export interface CardEntry {
  toolCallId: string;
  card: TrekCard;
}

/** What a change row's slot gets: the row's card and the row itself. */
interface CardSlotProps<K extends TrekCardKind> {
  card: TrekCardOf<K>;
  item: ChangeItem;
}

/** A run of change rows a view draws together. */
interface CardRunProps {
  items: readonly ChangeItem[];
  excluded: ReadonlySet<string>;
  /** The choices wait while the chat runs, as the change card's own do. */
  disabled: boolean;
  onToggle(id: string): void;
}

/**
 * How one kind draws. `Block` draws a group of answer cards (grouped by the
 * kind's look); the slots fill a change row (`Lead` in front, `Aside` at the
 * end of the subject line, `Facts` on the faint line, `Body` under it);
 * `Group` heads or closes a run of rows of the kind, `Run` replaces two or
 * more waiting rows that can be decided as one. Every member is optional: an
 * empty view draws nothing, and one that throws draws its fallback instead.
 */
export interface CardView<K extends TrekCardKind> {
  Block?: ComponentType<{ cards: readonly CardEntry[]; message: AssistantMessage }>;
  Lead?: ComponentType<CardSlotProps<K>>;
  Aside?: ComponentType<CardSlotProps<K>>;
  Facts?: ComponentType<CardSlotProps<K>>;
  Body?: ComponentType<CardSlotProps<K>>;
  ownsSubject?: boolean;
  /** The body runs the whole width of the change card instead of under the row's text (a tour's drawing). */
  wideBody?: boolean;
  Group?: ComponentType<CardRunProps & { place: 'head' | 'foot' }>;
  Run?: ComponentType<CardRunProps>;
  runnable?(card: TrekCardOf<K>): boolean;
  startsExcluded?(card: TrekCardOf<K>): boolean;
}
