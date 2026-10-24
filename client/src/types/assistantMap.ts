import type { TrekCard } from '@trek/shared';

/**
 * What an assistant card asks the plan's map to draw, in the shapes the map
 * layers read. These sit below the views, so the store's map model and the
 * planner's map hooks share them with the cards' looks
 * (components/Assistant/cards/cardTypes.ts) without importing a view.
 */

/** Which lines of a card the plan's map draws: a waiting change, an answer to look at, the way it was before. */
export type RouteUse = 'pending' | 'look' | 'before';

/** A line a card asks the plan's map to draw beside the plan: points as `[lat, lng]`, colours as CSS values. */
export interface RouteLineSpec {
  id: string;
  lines: [number, number][][];
  color: string;
  casing?: string;
  dashed?: boolean;
  dim?: boolean;
  /** The named stops along it, dotted on the line while it is lit, each with its name. */
  stops?: { lat: number; lng: number; label: string }[];
  /** Stretches drawn over it in their own colour (the hard grades of a hike). */
  tints?: { line: [number, number][]; color: string }[];
}

/**
 * A line as the plan's map draws it beside the plan: the specs of every card
 * in the chat, laid out and lit by the store's route model. `ref` is the key
 * the chat and the map light it by (a change's call, `tour:<placeId>`), so
 * several lines of one card light together; `id` is the line's own. Colours
 * are CSS values here and resolved by the planner before the map draws them.
 */
export interface AssistantRouteLine {
  id: string;
  ref: string;
  lines: [number, number][][];
  color: string;
  casing: string;
  dashed?: boolean;
  dim?: boolean;
  /** Under the pointer, in the chat or on the map: drawn solid, on top, with its stops. */
  hot?: boolean;
  /** A filled disc at the start and a ring at the end; no end where the line closes on its start. */
  ends?: { start: [number, number]; end: [number, number] | null };
  stops?: { lat: number; lng: number; label: string }[];
  tints?: { line: [number, number][]; color: string }[];
}

/** A spot a card asks the plan's map to mark: a pin for a stop, a small point for a via. */
export interface GhostPoint {
  id: string;
  lat: number;
  lng: number;
  name: string;
  variant?: 'pin' | 'point';
}

/**
 * The map's side of every card's look, for the card in hand. A store may not
 * import a view, so the store's map model takes this as a parameter and the
 * planner's map hook hands it `CARD_MAP_LOOK` from the looks.
 */
export interface CardMapLook {
  lines(card: TrekCard, use: RouteUse): RouteLineSpec[];
  ghosts(card: TrekCard): GhostPoint[];
  hidesEffectGhost(card: TrekCard): boolean;
}
