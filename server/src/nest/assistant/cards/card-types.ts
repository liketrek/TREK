import type { TripCard } from '../assistant-context';
import type { AssistantWriteTool } from '../assistant-tools.constants';
import type { ToolHint } from '../assistant-tools.service';
import type { Rows } from './preview-format';
import type { AssistantChangeEffect, AssistantChangePreview, AssistantChangeVerbKey, TrekCard } from '@trek/shared';

/**
 * What a part of TREK hands the assistant for its tools: one `ToolCards`
 * entry per tool, gathered per package in `cards/<pkg>/index.ts` and merged
 * by `registry.ts`. Types only, so any file may import them.
 */

export type ToolArgs = Record<string, unknown>;

/** The packages that bring cards of their own, one folder each. */
type CardPackageId =
  | 'tour'
  | 'roadtrip'
  | 'budget'
  | 'booking'
  | 'collab'
  | 'collection'
  | 'atlas'
  | 'vacay'
  | 'journey'
  | 'packing'
  | 'book'
  | 'bookDesign';

/**
 * A read a card may make while a change is described: unaudited, made once
 * per turn for the same tool and arguments, null on any failure.
 */
export type CardReader = (tool: string, args?: ToolArgs) => Promise<unknown>;

/** An airport as a card names it, by its IATA code. */
export interface CardAirport {
  city: string;
  lat: number;
  lng: number;
  tz: string;
}

/** What a change card is written with. */
export interface PreviewContext {
  card: TripCard;
  categories: ReadonlyMap<number, string>;
  locale: string;
  /** Today in the user's time zone (`YYYY-MM-DD`). */
  today: string;
  /** What a tool without a card of its own says about itself, for the card built from its arguments. */
  hintOf?: (tool: string) => ToolHint | null;
  airport: (code: string) => CardAirport | null;
}

/**
 * A change described in plain words. `verbKey`, `tool` and `domain` override
 * what the tool's `write` entry and the generic card would say: a verb that
 * depends on the arguments, the tool's own label, the part of TREK it works in.
 */
export interface Described {
  subject: string;
  rows: Rows;
  dayId: number | null;
  placeIds: number[];
  verbKey?: AssistantChangeVerbKey;
  tool?: string;
  domain?: string;
  /**
   * False when the package already sees that this held call has no way back,
   * though its tool has one (a toggle that would clear a day); the card is
   * then not offered as undoable. Left out, the tool's undo decides.
   */
  undoable?: boolean;
}

/** What an answer card is built from: a read that ran, with its raw value (never the redacted one). */
export interface AnswerInput {
  toolCallId: string;
  args: ToolArgs;
  value: unknown;
  card: TripCard;
  today: string;
}

/**
 * What an undo is checked against: the trip as `get_trip_summary` and
 * `list_places` answer it, and the reads the change's `undo.reads` asked for,
 * by `readKey(tool, args)` (null for one that failed).
 */
export interface UndoSnapshot {
  summary: unknown;
  places: unknown;
  reads: ReadonlyMap<string, unknown>;
}

/** What a receipt is read with beyond the call: the stored preview, and the trip the conversation is on. */
export interface AppliedFrom {
  preview: AssistantChangePreview | null;
  /** Null in a Studio conversation, which is about a journey. */
  tripId: number | null;
}

/** What an undo is checked with beyond the answer and the reads: the call's arguments and its stored preview. */
export interface UndoCall {
  args: ToolArgs;
  preview: AssistantChangePreview | null;
}

/** The way back from an applied change: the removing tool and its arguments, null when there is none. */
export interface ToolUndo {
  tool: string;
  args(args: ToolArgs, result: unknown, preview: AssistantChangePreview | null): ToolArgs | null;
}

/**
 * Everything a package says about one tool. Every member is optional and
 * written as a method, so a `ToolCards<X>` fits where a `ToolCards` is asked.
 * A builder that throws, returns a card the union refuses or one past
 * MAX_CARD_CHARS gives no card (logged), never a broken turn; any other
 * member that throws is logged and read as saying nothing (registry.ts).
 */
export interface ToolCards<L = unknown> {
  /** A curated change card: its verb and what the applied change touches. */
  write?: AssistantWriteTool;
  /** Arguments the model never chooses: `forced` ones are set, `stripped` ones taken away. */
  argPolicy?: { forced?: ToolArgs; stripped?: readonly string[] };
  /** The answer as the provider gets it, before redaction and fitting. */
  project?(value: unknown): unknown;
  /** The card a read shows beside the answer; only for a read that ran well. */
  answer?(input: AnswerInput): TrekCard | null;
  /** What describing a held call needs beyond the trip card: at most four reads, null on failure. */
  load?(args: ToolArgs, read: CardReader): Promise<L | null>;
  /** The change card's words; must give a valid card for `{}` arguments too. */
  describe?(ctx: PreviewContext, args: ToolArgs, loaded: L | null): Described;
  /** What the change does to the day plan, for the map and the day's timeline. */
  effect?(ctx: PreviewContext, args: ToolArgs, loaded: L | null): AssistantChangeEffect | null;
  /** The card a held call shows inside its change card. */
  change?(ctx: PreviewContext, args: ToolArgs, loaded: L | null): TrekCard | null;
  /** The card of the applied change, from the stored preview card and the tool's raw answer. */
  applied?(input: { args: ToolArgs; result: unknown; preview: AssistantChangePreview | null }): TrekCard | null;
  /** The ids the receipt names, when the answer does not name them under the usual keys. */
  appliedIds?(args: ToolArgs, result: unknown, from: AppliedFrom): number[];
  /** The way back, with what it reads first and how it tells that nothing changed since. */
  undo?: ToolUndo & {
    /**
     * Reads the undo makes before it checks; every tool named here must be
     * registered. The boot check asks with empty arguments and result, so the
     * tools it names may not depend on them (their arguments may).
     */
    reads?(args: ToolArgs, result: unknown): ReadonlyArray<{ tool: string; args: ToolArgs }>;
    /**
     * Whether what the change did is still as it left it. `call` names what
     * the answer may not (a date, a person); the undo always hands it in, and
     * a check that needs it reads its absence as changed since.
     */
    unchanged(result: unknown, snapshot: UndoSnapshot, call?: UndoCall): boolean;
  };
  /** The name of an id argument the trip card cannot name, for the generic card. */
  nameArg?(key: string, value: number, card: TripCard): string | null;
}

/** One package's cards. */
export interface DomainCards {
  readonly id: CardPackageId;
  readonly tools: Readonly<Record<string, ToolCards>>;
  /** At most two lines for the standing instructions, added once at load so the prompt cache stays stable. */
  readonly prompt?: readonly string[];
  /** Tool groups whose `placeId` arguments are no trip places (collections, atlas). */
  readonly foreignIdGroups?: readonly string[];
  /**
   * MCP controllers the package added, by the tool group they load with (a
   * key of ASSISTANT_TOOL_GROUPS); a controller listed nowhere is offered on
   * every step as part of the core.
   */
  readonly toolControllers?: Readonly<Record<string, readonly string[]>>;
  /** Read-only tools that still wait for the user: they fetch an address that came from the web or a message. */
  readonly heldReads?: readonly string[];
}
