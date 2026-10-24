import { logWarn } from '../../audit/audit-log.logger';
import type { TripCard } from '../assistant-context';
import {
  ASSISTANT_SERVER_WRITE_TOOLS,
  CORE_ARG_POLICY,
  CORE_UNDO_MAP,
  CORE_WRITE_TOOLS,
  type AssistantWriteTool,
} from '../assistant-tools.constants';
import { ATLAS_CARDS } from './atlas';
import { BOOK_CARDS } from './book';
import { BOOK_DESIGN_CARDS } from './book-design';
import { BOOKING_CARDS } from './booking';
import { BUDGET_CARDS } from './budget';
import type {
  AnswerInput,
  AppliedFrom,
  Described,
  DomainCards,
  PreviewContext,
  ToolArgs,
  ToolCards,
  ToolUndo,
  UndoCall,
  UndoSnapshot,
} from './card-types';
import { COLLAB_CARDS } from './collab';
import { COLLECTION_CARDS } from './collection';
import { HOME_CARDS } from './home';
import { JOURNEY_CARDS } from './journey';
import { PACKING_CARDS } from './packing';
import { ROADTRIP_CARDS } from './roadtrip';
import { TOUR_CARDS } from './tour';
import { VACAY_CARDS } from './vacay';
import { idSchema, MAX_CARD_CHARS, trekCardSchema, type AssistantChangePreview, type TrekCard } from '@trek/shared';

import type { ZodType } from 'zod';

/**
 * Every package's cards, merged by tool name, and the calls the assistant
 * makes on them. A package claims the fields of the tools it knows; two
 * packages claiming one field of one tool, a package taking over a core
 * table's entry, or a describer without a verb stop the server at load,
 * before a turn could pick one of them at random. Every hook a package hands
 * in is guarded: one that throws is logged and says nothing, never a broken
 * turn, decision or undo.
 */

/** The packages, in the order their prompt lines are told. */
export const DOMAINS: readonly DomainCards[] = [
  TOUR_CARDS,
  ROADTRIP_CARDS,
  BUDGET_CARDS,
  BOOKING_CARDS,
  COLLAB_CARDS,
  COLLECTION_CARDS,
  ATLAS_CARDS,
  VACAY_CARDS,
  JOURNEY_CARDS,
  PACKING_CARDS,
  BOOK_CARDS,
  BOOK_DESIGN_CARDS,
  HOME_CARDS,
];

/** Prompt lines one package may add. */
const MAX_PROMPT_LINES = 2;

type Undo = NonNullable<ToolCards['undo']>;
type UndoReads = ReadonlyArray<{ tool: string; args: ToolArgs }>;

/** The registry the assistant reads, merged from the packages. */
interface MergedCards {
  tools: Readonly<Record<string, ToolCards>>;
  writes: Readonly<Record<string, AssistantWriteTool>>;
  undo: Readonly<Record<string, ToolUndo>>;
  argPolicy: Readonly<Record<string, NonNullable<ToolCards['argPolicy']>>>;
  projections: Readonly<Record<string, (value: unknown) => unknown>>;
  promptLines: readonly string[];
  foreignIdGroups: ReadonlySet<string>;
  toolControllers: Readonly<Record<string, readonly string[]>>;
  heldReads: ReadonlySet<string>;
}

/** The core's own tables a package may not take an entry of. */
interface CoreTables {
  writes: Readonly<Record<string, unknown>>;
  undo: Readonly<Record<string, unknown>>;
  argPolicy: Readonly<Record<string, unknown>>;
  /** The changes the server proposes itself: their verb stays in the core, their words may come from a package. */
  serverWrites: Readonly<Record<string, unknown>>;
}

const CORE: CoreTables = {
  writes: { ...CORE_WRITE_TOOLS, ...ASSISTANT_SERVER_WRITE_TOOLS },
  undo: CORE_UNDO_MAP,
  argPolicy: CORE_ARG_POLICY,
  serverWrites: ASSISTANT_SERVER_WRITE_TOOLS,
};

/** One field of every tool that has it, by tool name. */
function fieldOf<T>(tools: Readonly<Record<string, ToolCards>>, read: (cards: ToolCards) => T | undefined) {
  const found: Record<string, T> = {};
  for (const [tool, cards] of Object.entries(tools)) {
    const value = read(cards);
    if (value !== undefined) found[tool] = value;
  }
  return found;
}

function reason(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** `run`, or `fallback` and a log line when it throws. */
function safely<T>(tool: string, what: string, fallback: T, run: () => T): T {
  try {
    return run();
  } catch (err) {
    logWarn(`[assistant] the ${what} of ${tool} failed: ${reason(err)}`);
    return fallback;
  }
}

function guardUndo(tool: string, undo: Undo): Undo {
  return {
    tool: undo.tool,
    args: (args: ToolArgs, result: unknown, preview: AssistantChangePreview | null) =>
      safely(tool, 'undo arguments', null, () => undo.args(args, result, preview)),
    ...(undo.reads
      ? {
          reads: (args: ToolArgs, result: unknown) =>
            safely<UndoReads>(tool, 'undo reads', [], () => undo.reads?.(args, result) ?? []),
        }
      : {}),
    unchanged: (result: unknown, snapshot: UndoSnapshot, call?: UndoCall) =>
      safely(tool, 'undo check', false, () => undo.unchanged(result, snapshot, call)),
  };
}

/**
 * A package's entry with the hooks a turn, a decision or an undo calls
 * outside the card guard wrapped: one that throws is logged and reads as
 * saying nothing (the answer as it came, no effect, no ids, no way back,
 * "changed since"), never a broken turn or a write left unrecorded. Ids that
 * are no row ids are left out. The describer has its own guard, `describedOf`,
 * since the generic card stands in for it.
 */
function guardTool(tool: string, cards: ToolCards): ToolCards {
  return {
    ...cards,
    ...(cards.project
      ? { project: (value: unknown) => safely(tool, 'projection', value, () => cards.project?.(value)) }
      : {}),
    ...(cards.effect
      ? {
          effect: (ctx: PreviewContext, args: ToolArgs, loaded: unknown) =>
            safely(tool, 'effect', null, () => cards.effect?.(ctx, args, loaded) ?? null),
        }
      : {}),
    ...(cards.appliedIds
      ? {
          appliedIds: (args: ToolArgs, result: unknown, from: AppliedFrom) =>
            safely<number[]>(tool, 'applied ids', [], () =>
              (cards.appliedIds?.(args, result, from) ?? []).filter((value) => idSchema.safeParse(value).success),
            ),
        }
      : {}),
    ...(cards.nameArg
      ? {
          nameArg: (key: string, value: number, card: TripCard) =>
            safely(tool, `name of ${key}`, null, () => cards.nameArg?.(key, value, card) ?? null),
        }
      : {}),
    ...(cards.undo ? { undo: guardUndo(tool, cards.undo) } : {}),
  };
}

/** Merges the packages' cards, refusing every overlap at load. */
export function mergeDomains(domains: readonly DomainCards[], core: CoreTables = CORE): MergedCards {
  const tools: Record<string, ToolCards> = {};
  const owners = new Map<string, string>();
  const ids = new Set<string>();
  for (const domain of domains) {
    if (ids.has(domain.id)) throw new Error(`Assistant cards: package "${domain.id}" is registered twice`);
    ids.add(domain.id);
    if ((domain.prompt ?? []).length > MAX_PROMPT_LINES) {
      throw new Error(`Assistant cards: package "${domain.id}" adds more than ${MAX_PROMPT_LINES} prompt lines`);
    }
    for (const [tool, cards] of Object.entries(domain.tools)) {
      for (const field of Object.keys(cards)) {
        const owner = owners.get(`${tool}.${field}`);
        if (owner) throw new Error(`Assistant cards: "${field}" of "${tool}" is claimed by ${owner} and ${domain.id}`);
        owners.set(`${tool}.${field}`, domain.id);
      }
      tools[tool] = { ...tools[tool], ...guardTool(tool, cards) };
    }
  }
  for (const [field, table] of [
    ['write', core.writes],
    ['undo', core.undo],
    ['argPolicy', core.argPolicy],
  ] as const) {
    refuseCoreOverlap(field, Object.keys(table), tools);
  }
  // A curated card is a verb with its words: one without the other is half a card. A change the
  // server proposes itself (a booking from a file) has its verb in the core and may take its words here.
  for (const [tool, cards] of Object.entries(tools)) {
    const verb = cards.write ?? core.serverWrites[tool];
    if (cards.describe ? verb === undefined : cards.write !== undefined) {
      throw new Error(`Assistant cards: "${tool}" needs both a write entry and a describer, or neither`);
    }
  }
  return {
    tools,
    writes: { ...CORE_WRITE_TOOLS, ...fieldOf(tools, (cards) => cards.write) },
    undo: { ...CORE_UNDO_MAP, ...fieldOf(tools, (cards): ToolUndo | undefined => cards.undo) },
    argPolicy: { ...CORE_ARG_POLICY, ...fieldOf(tools, (cards) => cards.argPolicy) },
    projections: fieldOf(tools, (cards) =>
      cards.project ? (value: unknown): unknown => cards.project?.(value) : undefined,
    ),
    promptLines: domains.flatMap((domain) => domain.prompt ?? []),
    foreignIdGroups: new Set(domains.flatMap((domain) => domain.foreignIdGroups ?? [])),
    toolControllers: controllersOf(domains),
    heldReads: new Set(domains.flatMap((domain) => domain.heldReads ?? [])),
  };
}

/** The controllers the packages add, by tool group; one controller in two places is refused. */
function controllersOf(domains: readonly DomainCards[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  const seen = new Set<string>();
  for (const domain of domains) {
    for (const [group, controllers] of Object.entries(domain.toolControllers ?? {})) {
      for (const controller of controllers) {
        if (seen.has(controller)) throw new Error(`Assistant cards: controller "${controller}" is listed twice`);
        seen.add(controller);
        (groups[group] ??= []).push(controller);
      }
    }
  }
  return groups;
}

/**
 * Refuses a package entry for `field` on a tool the core already covers with
 * its own table (`names`): the core describers and effects, projections and
 * the like, which live beside the files that read them.
 */
export function refuseCoreOverlap(
  field: keyof ToolCards,
  names: Iterable<string>,
  tools: Readonly<Record<string, ToolCards>> = TOOL_CARDS,
): void {
  for (const name of names) {
    if (tools[name]?.[field] !== undefined) {
      throw new Error(`Assistant cards: "${field}" of "${name}" is the core's own`);
    }
  }
}

const MERGED = mergeDomains(DOMAINS);

export const TOOL_CARDS = MERGED.tools;
/** Every writing tool with a card of its own: the core's and the packages'. */
export const ASSISTANT_WRITE_TOOLS = MERGED.writes;
export const ASSISTANT_UNDO_MAP = MERGED.undo;
export const ASSISTANT_ARG_POLICY = MERGED.argPolicy;
/** The packages' provider projections; the core's live in assistant-output.ts. */
export const PROJECTIONS = MERGED.projections;
/** The packages' lines for the standing instructions, in package order. */
export const CARD_PROMPT_LINES = MERGED.promptLines;
/** Tool groups whose place ids are no trip places. */
export const FOREIGN_ID_GROUPS = MERGED.foreignIdGroups;
/** The MCP controllers the packages add to the tool groups (assistant-tool-offer.ts merges them). */
export const PACKAGE_TOOL_CONTROLLERS = MERGED.toolControllers;
/** The packages' read-only tools that wait for the user like a change. */
export const PACKAGE_HELD_READS = MERGED.heldReads;

/** How a card is checked before it goes out: the union, and the most its JSON may weigh. */
export interface CardCheck {
  schema: ZodType<TrekCard>;
  maxChars: number;
}

const UNION_CHECK: CardCheck = { schema: trekCardSchema, maxChars: MAX_CARD_CHARS };

/** The card checked against the union and the size cap; null, and a log line, for anything wrong. */
function checked(tool: string, what: string, check: CardCheck, build: () => TrekCard | null): TrekCard | null {
  let card: TrekCard | null;
  try {
    card = build();
  } catch (err) {
    logWarn(`[assistant] the ${what} card of ${tool} failed: ${reason(err)}`);
    return null;
  }
  if (!card) return null;
  const parsed = check.schema.safeParse(card);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    logWarn(
      `[assistant] the ${what} card of ${tool} does not fit its kind: ${issue?.path.join('.')} ${issue?.message}`,
    );
    return null;
  }
  const size = JSON.stringify(parsed.data).length;
  if (size > check.maxChars) {
    logWarn(`[assistant] the ${what} card of ${tool} is too large (${size} characters)`);
    return null;
  }
  return parsed.data;
}

/** The guarded calls over one registry; a builder that throws or misbuilds gives no card, never a broken turn. */
export function guardedCards(tools: Readonly<Record<string, ToolCards>>, check: CardCheck = UNION_CHECK) {
  return {
    answerCardOf(tool: string, input: AnswerInput): TrekCard | null {
      const cards = tools[tool];
      return cards?.answer ? checked(tool, 'answer', check, () => cards.answer?.(input) ?? null) : null;
    },
    changeCardOf(tool: string, ctx: PreviewContext, args: ToolArgs, loaded: unknown): TrekCard | null {
      const cards = tools[tool];
      return cards?.change ? checked(tool, 'change', check, () => cards.change?.(ctx, args, loaded) ?? null) : null;
    },
    appliedCardOf(
      tool: string,
      input: { args: ToolArgs; result: unknown; preview: AssistantChangePreview | null },
    ): TrekCard | null {
      const cards = tools[tool];
      return cards?.applied ? checked(tool, 'applied', check, () => cards.applied?.(input) ?? null) : null;
    },
  };
}

const GUARDED = guardedCards(TOOL_CARDS);
export const answerCardOf = GUARDED.answerCardOf;
export const changeCardOf = GUARDED.changeCardOf;
export const appliedCardOf = GUARDED.appliedCardOf;

/** What a package calls an id argument the trip card cannot name; null when it has no name for it. */
export function nameArgOf(tool: string, key: string, value: number, card: TripCard): string | null {
  return TOOL_CARDS[tool]?.nameArg?.(key, value, card) ?? null;
}

/** The reads an undo of `tool` makes before its check; none when its package asks for none or fails to say. */
export function undoReadsOf(tool: string, args: ToolArgs, result: unknown): UndoReads {
  return TOOL_CARDS[tool]?.undo?.reads?.(args, result) ?? [];
}

/**
 * The words of a package's change card for `tool`; null when it has no
 * describer, or a log line and null when its describer throws, so the card
 * built from the arguments stands in.
 */
export function describedOf(tool: string, ctx: PreviewContext, args: ToolArgs, loaded: unknown): Described | null {
  const cards = TOOL_CARDS[tool];
  if (!cards?.describe) return null;
  return safely(tool, 'describer', null, () => cards.describe?.(ctx, args, loaded) ?? null);
}
