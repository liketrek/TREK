import { createLocalMcpServer, McpRegistryService, type McpRegistryListing } from '../../nest-mcp';
import type { AiToolSpec } from '../ai-connections/ai-chat-client.interface';
import { AuditService } from '../audit/audit.service';
import { traceEntry } from '../audit/entry-trace.logger';
import { withRequestContext } from '../database/request-context';
import { FOLLOW_UPS_SPEC } from './assistant-follow-ups';
import { OPEN_TRIP_CHAT_SPEC, OPEN_TRIP_CHAT_TOOL, openTripChat } from './assistant-home';
import {
  OPEN_JOURNEY_CHAT_READ,
  OPEN_JOURNEY_CHAT_SPEC,
  OPEN_JOURNEY_CHAT_TOOL,
  openJourneyChat,
} from './assistant-home-journeys';
import {
  checkJournalTools,
  heldInJourney,
  isHeldInJourney,
  JOURNEY_PART_ARGS,
  JOURNEY_PART_READ,
  JOURNEY_PIN_ARGS,
  offeredInJourney,
  type JourneyOffer,
} from './assistant-journey-offer';
import { REMEMBER_SPEC } from './assistant-memory';
import {
  ASSISTANT_TOOL_GROUPS,
  checkDenylist,
  checkStudioTools,
  groupOf,
  HELD_READS,
  HOME_USE_TOOLS_SPEC,
  isOfferedTool,
  isStudioController,
  JOURNEY_PINNED_ARG,
  keptAtHome,
  USE_TOOLS_SPEC,
  USE_TOOLS_TOOL,
} from './assistant-tool-offer';
import {
  ASSISTANT_SCOPES,
  ASSISTANT_SERVER_TOOLS,
  PINNED_ARG,
  PREVIEW_BOOK_PAGE_TOOL,
  REMEMBER_TOOL,
} from './assistant-tools.constants';
import type { ToolCards } from './cards/card-types';
import {
  ASSISTANT_ARG_POLICY,
  ASSISTANT_UNDO_MAP,
  ASSISTANT_WRITE_TOOLS,
  PACKAGE_HELD_READS,
  TOOL_CARDS,
} from './cards/registry';
import {
  ItineraryShelves,
  KeptItineraries,
  restoreItinerary,
  searchAgainArgs,
  TRANSIT_CREATE_TOOL,
  TRANSIT_SEARCH_TOOL,
} from './cards/roadtrip/transit-restore';
import { argsFitSchema } from './tool-args-fit';
import { MikroORM } from '@mikro-orm/core';
import { Client } from '@modelcontextprotocol/sdk/client/index';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { ASSISTANT_FOLLOW_UPS_TOOL } from '@trek/shared';

type ToolArgs = Record<string, unknown>;

/** What a tool call came back with: its JSON parsed where it was JSON, its text otherwise. */
export interface ToolRun {
  ok: boolean;
  value: unknown;
}

/** Whether a tool runs at once or waits for the user. */
export type AssistantToolKind = 'read' | 'write';

/** What a card for a tool without one of its own goes by: what the tool says it does, and where it works. */
export interface ToolHint {
  destructive: boolean;
  creates: boolean;
  group: string | null;
}

interface ListedTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  kind: AssistantToolKind;
  pinned: boolean;
  hint: ToolHint;
  /** Shown to the model on this page; a held tool that is not still runs a decision made on the other page. */
  offered: boolean;
}

/**
 * A trip turn's session offers every tool (the core first, the rest by group);
 * a journey turn's offers the Studio's tools at once and nothing else; a home
 * turn's offers the reads and the writes that belong to no trip, by group like
 * a trip's; an undo's holds its one target.
 */
type SessionMode = 'turn' | 'journey' | 'home' | 'undo';

/** The argument every pinned tool runs with, and its value: the conversation's trip or journey. */
interface SessionPin {
  arg: string;
  id: number;
}

/** What the home chat pins: nothing, so a trip's read runs on the trip the model names. */
const NO_PIN: SessionPin = { arg: '', id: 0 };

/** The registered tools by name, as the registry lists them. */
type ToolCatalog = ReadonlyMap<string, McpRegistryListing>;

/** Which registered tools a session attaches, which of those it keeps once they are listed, and which it offers. */
interface SessionOffer {
  catalog: ToolCatalog;
  include: (name: string) => boolean;
  keep: (tool: ListedTool) => boolean;
  /** Left out, every kept tool is offered. */
  offered?: (tool: ListedTool) => boolean;
}

/**
 * The tools the packages' undo checks read. A package's `reads` names its
 * tools whatever the arguments, so asking with none shows which they are.
 */
function undoReadTools(cards: Readonly<Record<string, ToolCards>>): string[] {
  return Object.values(cards).flatMap((entry) => {
    try {
      return (entry.undo?.reads?.({}, {}) ?? []).map((read) => read.tool);
    } catch {
      return [];
    }
  });
}

/**
 * What is wrong with the tool catalog the assistant relies on, given what the
 * registry holds: a tool with a card of its own, a package's cards for a tool,
 * an undo target, an undo read or a package's held read that no longer
 * exists, a sharing tool the denylist missed, a book tool not listed as the
 * Studio's, or a tool named like one of the server's own steps. Empty when
 * all is well.
 */
export function checkToolCatalog(
  listing: readonly McpRegistryListing[],
  cards: Readonly<Record<string, ToolCards>> = TOOL_CARDS,
  heldReads: Iterable<string> = PACKAGE_HELD_READS,
): string[] {
  const tools = new Set(listing.filter((entry) => entry.kind === 'tool').map((entry) => entry.name));
  const problems: string[] = [];
  for (const name of Object.keys(ASSISTANT_WRITE_TOOLS)) {
    if (!tools.has(name)) problems.push(`tool "${name}" with a card of its own is not registered`);
  }
  for (const name of Object.keys(cards)) {
    const serverStep = name === OPEN_TRIP_CHAT_TOOL || name === OPEN_JOURNEY_CHAT_TOOL;
    if (!tools.has(name) && !ASSISTANT_SERVER_TOOLS.has(name) && !serverStep) {
      problems.push(`tool "${name}" with cards of a package is neither registered nor the server's own`);
    }
  }
  for (const undo of Object.values(ASSISTANT_UNDO_MAP)) {
    if (!tools.has(undo.tool)) problems.push(`undo tool "${undo.tool}" is not registered`);
  }
  for (const name of undoReadTools(cards)) {
    if (!tools.has(name)) problems.push(`undo read "${name}" is not registered`);
  }
  for (const name of heldReads) {
    if (!tools.has(name)) problems.push(`held read "${name}" of a package is not registered`);
  }
  // The server's own steps and tools are told apart from the registry's by name alone.
  for (const name of [
    ...ASSISTANT_SERVER_TOOLS,
    USE_TOOLS_TOOL,
    PREVIEW_BOOK_PAGE_TOOL,
    ASSISTANT_FOLLOW_UPS_TOOL,
    OPEN_TRIP_CHAT_TOOL,
    OPEN_JOURNEY_CHAT_TOOL,
  ]) {
    if (tools.has(name)) problems.push(`"${name}" is the server's own step`);
  }
  return [...problems, ...checkDenylist(tools), ...checkStudioTools(listing), ...checkJournalTools(tools)];
}

/**
 * How a listed tool is treated: a read runs at once, everything else waits
 * for the user. A tool counts as a read only when its own annotation says so
 * and it fetches nothing a message could have planted, so a tool whose
 * annotation is missing or wrong costs an extra card, never a silent write.
 */
function kindOf(name: string, readOnly: boolean): AssistantToolKind {
  return readOnly && !HELD_READS.has(name) ? 'read' : 'write';
}

/** The arguments a session pins: a trip's `tripId`, a journey's `journeyId` with its aliases, none at home. */
function pinNamesOf(pinArg: string): readonly string[] {
  if (pinArg === JOURNEY_PINNED_ARG) return JOURNEY_PIN_ARGS;
  return pinArg ? [pinArg] : [];
}

function hiddenArgs(name: string, pinArg: string = PINNED_ARG): Set<string> {
  const policy = ASSISTANT_ARG_POLICY[name];
  return new Set([...pinNamesOf(pinArg), ...Object.keys(policy?.forced ?? {}), ...(policy?.stripped ?? [])]);
}

/** The tool's JSON Schema without the arguments the server sets or takes away. */
function modelSchema(name: string, schema: Record<string, unknown>, pinArg: string): Record<string, unknown> {
  const hidden = hiddenArgs(name, pinArg);
  const properties = { ...((schema.properties as Record<string, unknown> | undefined) ?? {}) };
  for (const key of hidden) delete properties[key];
  const required = Array.isArray(schema.required)
    ? (schema.required as unknown[]).filter((key) => typeof key === 'string' && !hidden.has(key))
    : [];
  const { required: _required, ...rest } = schema;
  return { ...rest, properties, ...(required.length > 0 ? { required } : {}) };
}

function readResult(result: unknown): ToolRun {
  const record = (result ?? {}) as { content?: unknown; isError?: unknown };
  const text = Array.isArray(record.content)
    ? record.content
        .filter(
          (item): item is { type: 'text'; text: string } => item?.type === 'text' && typeof item.text === 'string',
        )
        .map((item) => item.text)
        .join('\n')
    : '';
  let value: unknown = text;
  try {
    value = JSON.parse(text);
  } catch {
    // Plain text: a refusal or a message, kept as it was written.
  }
  return { ok: record.isError !== true, value };
}

/**
 * One turn's view of the MCP tools: a server holding only the tools the turn
 * may use, attached for the user with the assistant's scopes and connected to
 * a client over an in-memory transport. The tools run exactly as they do for
 * an MCP client, with the user's own rights and the registry's demo gate, and
 * broadcast their changes the same way.
 *
 * Every tool that takes a trip runs on the conversation's trip: the model
 * never sees that argument, and one it sends anyway must name this trip. A
 * Studio conversation pins its journey the same way, through `journeyId`. The
 * home chat pins nothing (`pinArg` empty): a trip's read runs on the trip the
 * model names, and only for a user who may read it.
 */
export class AssistantToolSession {
  constructor(
    private readonly client: InstanceType<typeof Client>,
    private readonly server: ReturnType<typeof createLocalMcpServer>,
    private readonly tools: ReadonlyMap<string, ListedTool>,
    /** The conversation's trip, or its journey when `pinArg` is `journeyId`. */
    private readonly pinnedId: number,
    private readonly audit: (toolName: string) => void,
    private readonly mode: SessionMode,
    /** The itineraries the user's transit searches on this trip answered with, kept across turns. */
    private readonly itineraries: KeptItineraries = new KeptItineraries(),
    private readonly pinArg: string = PINNED_ARG,
  ) {}

  /** The groups this turn loaded; the core is always there. */
  private readonly loaded = new Set<string>();

  /** Reads the model called before their group was loaded in this turn, by name, with that group; told once. */
  private readonly calledBlind = new Map<string, string>();

  /** Groups a blind call loaded whose schemas no step has been offered yet. */
  private readonly unoffered = new Set<string>();

  /** Whether the session offers its tools by group: a trip's turn and a home turn do. */
  private get grouped(): boolean {
    return this.mode === 'turn' || this.mode === 'home';
  }

  /**
   * The tools as the model is offered them: the core and the groups it
   * loaded, the trip notes, and the step that loads the other groups. A
   * journey's session offers all it holds and no more.
   */
  specs(): AiToolSpec[] {
    // The step these specs go to sees every loaded group's schema.
    this.unoffered.clear();
    const listed = [...this.tools.values()]
      .filter((tool) => tool.offered)
      .filter((tool) => !this.grouped || tool.hint.group === null || this.loaded.has(tool.hint.group))
      .map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: modelSchema(tool.name, tool.inputSchema, this.pinArg),
      }));
    if (this.mode === 'undo') return listed;
    if (!this.grouped) return [...listed, FOLLOW_UPS_SPEC];
    const more = Object.keys(ASSISTANT_TOOL_GROUPS).some((group) => !this.loaded.has(group));
    if (this.mode === 'home') {
      const journals = this.offersJournalChat ? [OPEN_JOURNEY_CHAT_SPEC] : [];
      return [...listed, OPEN_TRIP_CHAT_SPEC, ...journals, ...(more ? [HOME_USE_TOOLS_SPEC] : []), FOLLOW_UPS_SPEC];
    }
    return [...listed, REMEMBER_SPEC, ...(more ? [USE_TOOLS_SPEC] : []), FOLLOW_UPS_SPEC];
  }

  kindOf(name: string): AssistantToolKind | null {
    if (name === REMEMBER_TOOL) return this.mode === 'turn' ? 'write' : null;
    // The follow-ups change nothing; the agent loop answers them itself in every turn.
    if (name === ASSISTANT_FOLLOW_UPS_TOOL) return this.mode === 'undo' ? null : 'read';
    if (name === USE_TOOLS_TOOL) return this.grouped ? 'read' : null;
    // Offering a trip's chat changes nothing; the user decides on the card.
    if (name === OPEN_TRIP_CHAT_TOOL) return this.mode === 'home' ? 'read' : null;
    if (name === OPEN_JOURNEY_CHAT_TOOL) return this.offersJournalChat ? 'read' : null;
    const tool = this.tools.get(name);
    return tool?.offered ? tool.kind : null;
  }

  /** The group of a tool this grouped session holds but has not loaded in this turn; null otherwise. */
  private unloadedGroupOf(name: string): string | null {
    const group = this.tools.get(name)?.hint.group;
    if (!this.grouped || !group || this.loaded.has(group)) return null;
    return group;
  }

  /** The home chat offers a journal's page while the user's journals can be listed (the journal addon is on). */
  private get offersJournalChat(): boolean {
    return this.mode === 'home' && this.tools.has(OPEN_JOURNEY_CHAT_READ);
  }

  /** What a card for this tool goes by; null for a tool this session does not hold. */
  hintOf(name: string): ToolHint | null {
    return this.tools.get(name)?.hint ?? null;
  }

  /**
   * The model's arguments as they are shown and stored: the trip, the forced
   * and the stripped arguments taken out. A trip id other than this
   * conversation's is refused.
   */
  pinArgs(name: string, args: ToolArgs): { args: ToolArgs } | { error: string } {
    const unloaded = this.unloadedGroupOf(name);
    if (unloaded) {
      // The model called a tool it was not offered in this turn (it knows the
      // name from an earlier turn), so it wrote the arguments without the
      // schema (#2967). Its group is loaded here, so the next step offers the
      // schema.
      this.loaded.add(unloaded);
      this.unoffered.add(unloaded);
    }
    const group = this.tools.get(name)?.hint.group;
    if (group && this.unoffered.has(group)) {
      // A change is never run in the turn but held as a card, and the turn
      // ends there: arguments written without the schema would only fail once
      // the user applies it, with the model long gone. Such a call is sent back
      // for the next step; one whose arguments already fit is held as always.
      const tool = this.tools.get(name);
      if (tool?.kind === 'write' && !argsFitSchema(args, modelSchema(name, tool.inputSchema, this.pinArg))) {
        return {
          error: `${name} belongs to the "${group}" tools, which were not loaded in this turn, so it did not run. They are loaded now: send the call again with the arguments exactly as its schema describes them.`,
        };
      }
      // A read runs at once; a refusal of its arguments says why (see call()).
      this.calledBlind.set(name, group);
    } else {
      // A blind read refused before it ran (another trip, an unknown place) must not hint a later call.
      this.calledBlind.delete(name);
    }
    const given = pinNamesOf(this.pinArg).filter((key) => args[key] !== undefined);
    if (given.some((key) => Number(args[key]) !== this.pinnedId)) {
      const about = this.pinArg === PINNED_ARG ? 'trip' : 'journey';
      return { error: `This conversation is about one ${about}; its id is set by the app and cannot be changed.` };
    }
    const hidden = hiddenArgs(name, this.pinArg);
    return { args: Object.fromEntries(Object.entries(args).filter(([key]) => !hidden.has(key))) };
  }

  /** Runs a tool on the user's behalf (a read the model asked for, an applied change, an undo), audited. */
  async call(name: string, args: ToolArgs): Promise<ToolRun> {
    if (name === USE_TOOLS_TOOL) return this.load(args);
    if (name === OPEN_TRIP_CHAT_TOOL && this.mode === 'home') return this.offerTripChat(args);
    if (name === OPEN_JOURNEY_CHAT_TOOL && this.offersJournalChat) {
      return openJourneyChat(args, await this.invoke(OPEN_JOURNEY_CHAT_READ, {}));
    }
    const final = name === TRANSIT_CREATE_TOOL ? await this.withFoundItinerary(args) : args;
    const run = await this.invoke(name, final);
    this.audit(name);
    // Only the blind call itself is told about the schema: a later failure of the
    // same tool, written with the schema in hand, has another reason.
    const blind = this.calledBlind.get(name);
    this.calledBlind.delete(name);
    if (!run.ok && blind) {
      const hint = `${name} was called before the "${blind}" tools were loaded in this turn, so its arguments were written without its schema. They are loaded now and the schema is in your tools: send the call again with the arguments exactly as it describes them.`;
      return {
        ok: false,
        value: `${typeof run.value === 'string' ? run.value : JSON.stringify(run.value)}
${hint}`,
      };
    }
    if (name === TRANSIT_SEARCH_TOOL && run.ok) this.itineraries.keep(run.value);
    return run;
  }

  /**
   * The model never saw a connection's line; the search it took the
   * connection from did. The held call keeps the model's copy (the thread
   * never stores a line), and the search's own itinerary goes in only now.
   * One no longer kept is searched for again, as a read for the server's use.
   */
  private async withFoundItinerary(args: ToolArgs): Promise<ToolArgs> {
    const restored = restoreItinerary(this.itineraries, args);
    const again = searchAgainArgs(args);
    if (restored !== args || !again || !this.tools.has(TRANSIT_SEARCH_TOOL)) return restored;
    const run = await this.invoke(TRANSIT_SEARCH_TOOL, again);
    if (run.ok) this.itineraries.keep(run.value);
    return restoreItinerary(this.itineraries, args);
  }

  /**
   * The way into a trip's own chat: the trip the model names, read from the
   * user's own trips, so a card never names a trip the user cannot open.
   */
  private async offerTripChat(args: ToolArgs): Promise<ToolRun> {
    // Today in UTC: a day's difference at midnight moves no trip between under way and next that matters here.
    return openTripChat(args, await this.invoke('list_trips', {}), new Date().toISOString().slice(0, 10));
  }

  /** Reads for the server's own use (the trip card, the undo check), not audited as the user's calls. */
  read(name: string, args: ToolArgs = {}): Promise<ToolRun> {
    return this.invoke(name, args);
  }

  /** Loads tool groups for the rest of the turn, and says which tools came with them. */
  private load(args: ToolArgs): ToolRun {
    const asked = Array.isArray(args.groups) ? args.groups.filter((g): g is string => typeof g === 'string') : [];
    const groups = asked.filter((group) => group in ASSISTANT_TOOL_GROUPS);
    if (groups.length === 0)
      return { ok: false, value: `Name one of: ${Object.keys(ASSISTANT_TOOL_GROUPS).join(', ')}` };
    for (const group of groups) this.loaded.add(group);
    const tools = [...this.tools.values()].filter((tool) => tool.hint.group && groups.includes(tool.hint.group));
    return { ok: true, value: { loaded: groups, tools: tools.map((tool) => tool.name) } };
  }

  async close(): Promise<void> {
    await this.client.close().catch(() => undefined);
    await this.server.close().catch(() => undefined);
  }

  private async invoke(name: string, args: ToolArgs): Promise<ToolRun> {
    const tool = this.tools.get(name);
    if (!tool) return { ok: false, value: `Unknown tool: ${name}` };
    const forced = ASSISTANT_ARG_POLICY[name]?.forced ?? {};
    const properties = (tool.inputSchema.properties as Record<string, unknown> | undefined) ?? {};
    const pin = Object.fromEntries(
      pinNamesOf(this.pinArg)
        .filter((key) => key in properties)
        .map((key) => [key, this.pinnedId]),
    );
    const final = { ...args, ...pin, ...forced };
    const outside = await this.outsideJourney(final);
    if (outside) return { ok: false, value: outside };
    return this.callTool(name, final);
  }

  private async callTool(name: string, args: ToolArgs): Promise<ToolRun> {
    try {
      return readResult(await this.client.callTool({ name, arguments: args }));
    } catch (err) {
      return { ok: false, value: err instanceof Error ? err.message : String(err) };
    }
  }

  /**
   * A journey's conversation stays on its journey also where a tool names
   * only a part of it: an entry an argument names must be one of this
   * journey's, read with the user's rights. Null when nothing is outside.
   */
  private async outsideJourney(args: ToolArgs): Promise<string | null> {
    if (this.pinArg !== JOURNEY_PINNED_ARG) return null;
    const named = JOURNEY_PART_ARGS.filter((key) => args[key] !== undefined);
    const runs = await Promise.all(named.map((key) => this.callTool(JOURNEY_PART_READ, { entryId: args[key] })));
    const outside = runs.some((run) => {
      const journey = (run.value as { journey?: { id?: unknown } } | null)?.journey;
      return !run.ok || Number(journey?.id) !== this.pinnedId;
    });
    return outside ? 'This conversation is about one journey; that entry is not one of its entries.' : null;
  }
}

/**
 * Builds the assistant's tool sessions over the container's MCP registry, and
 * checks at boot that every tool the assistant names still exists.
 */
@Injectable()
export class AssistantToolsService implements OnApplicationBootstrap {
  constructor(
    private readonly registry: McpRegistryService,
    private readonly orm: MikroORM,
    private readonly auditLog: AuditService,
  ) {}

  /** The itineraries transit searches found, per user and trip, for the applied change that adds one of them. */
  private readonly itineraries = new ItineraryShelves();

  onApplicationBootstrap(): void {
    const problems = checkToolCatalog(this.registry.list());
    if (problems.length > 0) throw new Error(`Assistant tool catalog is out of date: ${problems.join('; ')}`);
  }

  /**
   * A session for one user and trip: for a turn every tool the assistant is
   * offered but the book's own (left out by name and by controller), for an
   * undo only the named targets. No plugin tools are ever attached: the
   * assistant passes no dynamic tool source.
   */
  async open(userId: number, tripId: number, undoTargets?: ReadonlySet<string>) {
    const catalog = this.catalog();
    const include = (name: string) =>
      undoTargets ? undoTargets.has(name) : isOfferedTool(name) && !isStudioController(catalog.get(name)?.className);
    const mode: SessionMode = undoTargets ? 'undo' : 'turn';
    const kept = this.itineraries.of(userId, tripId);
    return this.session(userId, { arg: PINNED_ARG, id: tripId }, mode, { catalog, include, keep: () => true }, kept);
  }

  /**
   * A session for one user and journey: for a turn what either of its pages
   * offers (assistant-journey-offer.ts), each tool on this journey, with only
   * the asking page's offered to the model; for an undo only the named
   * targets, and the read that checks an entry is this journey's.
   */
  async openJourney(userId: number, journeyId: number, offer: JourneyOffer, undoTargets?: ReadonlySet<string>) {
    const catalog = this.catalog();
    const classOf = (name: string) => catalog.get(name)?.className;
    const include = (name: string) =>
      undoTargets ? undoTargets.has(name) || name === JOURNEY_PART_READ : isHeldInJourney(name, classOf(name));
    const listedOf = (tool: ListedTool) => ({
      name: tool.name,
      className: classOf(tool.name),
      kind: tool.kind,
      pinned: tool.pinned,
      onPart: JOURNEY_PART_ARGS.some((key) => key in ((tool.inputSchema.properties as object | undefined) ?? {})),
    });
    const keep = (tool: ListedTool) => !!undoTargets || heldInJourney(listedOf(tool), offer.role);
    const offered = (tool: ListedTool) => !undoTargets || undoTargets.has(tool.name);
    const shown = (tool: ListedTool) => (undoTargets ? offered(tool) : offeredInJourney(listedOf(tool), offer));
    const mode: SessionMode = undoTargets ? 'undo' : 'journey';
    const pin = { arg: JOURNEY_PINNED_ARG, id: journeyId };
    return this.session(userId, pin, mode, { catalog, include, keep, offered: shown });
  }

  /**
   * A session for the home chat, about no one trip or journey: for a turn
   * every read the assistant is offered and the writes that take neither a
   * trip nor a journey (keptAtHome), nothing pinned; for an undo only the
   * named targets. The book's own tools stay out, as in a trip chat.
   */
  async openHome(userId: number, undoTargets?: ReadonlySet<string>) {
    const catalog = this.catalog();
    const include = (name: string) =>
      undoTargets ? undoTargets.has(name) : isOfferedTool(name) && !isStudioController(catalog.get(name)?.className);
    const keep = (tool: ListedTool) =>
      !!undoTargets ||
      keptAtHome(
        tool.kind,
        Object.keys((tool.inputSchema.properties as object | undefined) ?? {}),
        catalog.get(tool.name)?.className,
        tool.name,
      );
    const mode: SessionMode = undoTargets ? 'undo' : 'home';
    return this.session(userId, NO_PIN, mode, { catalog, include, keep });
  }

  /** The registered tools by name, read once per session. */
  private catalog(): ToolCatalog {
    return new Map(
      this.registry
        .list()
        .filter((entry) => entry.kind === 'tool')
        .map((entry) => [entry.name, entry] as const),
    );
  }

  private async session(
    userId: number,
    pin: SessionPin,
    mode: SessionMode,
    offer: SessionOffer,
    kept?: KeptItineraries,
  ): Promise<AssistantToolSession> {
    const server = createLocalMcpServer('TREK assistant');
    const around = (info: { kind: string; name: string }, call: () => unknown): unknown =>
      traceEntry('mcp', `${info.kind} ${info.name} user=${userId} client=assistant`, () =>
        withRequestContext(this.orm, call),
      );
    await withRequestContext(this.orm, () =>
      this.registry.attach(
        server,
        { userId, scopes: [...ASSISTANT_SCOPES], isStaticToken: false },
        { include: (kind, name) => kind === 'tool' && offer.include(name), around },
      ),
    );
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'trek-assistant', version: '1.0.0' });
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const tools = new Map<string, ListedTool>();
    for (const tool of (await client.listTools()).tools) {
      const annotations = tool.annotations ?? {};
      const kind = mode === 'undo' ? 'write' : kindOf(tool.name, annotations.readOnlyHint === true);
      const inputSchema = tool.inputSchema as Record<string, unknown>;
      const properties = (inputSchema.properties as Record<string, unknown> | undefined) ?? {};
      const entry = offer.catalog.get(tool.name);
      const listed: ListedTool = {
        name: tool.name,
        description: tool.description ?? '',
        inputSchema,
        kind,
        pinned: pinNamesOf(pin.arg).some((key) => key in properties),
        hint: {
          destructive: annotations.destructiveHint === true,
          creates: annotations.idempotentHint === false,
          group: entry ? groupOf(entry) : null,
        },
        offered: true,
      };
      if (offer.keep(listed)) tools.set(tool.name, { ...listed, offered: offer.offered?.(listed) ?? true });
    }
    const audit = (name: string) => this.audit(userId, name);
    return new AssistantToolSession(client, server, tools, pin.id, audit, mode, kept, pin.arg);
  }

  /** The audit row an MCP client's call writes, marked as the assistant's. A failed write never fails the call. */
  private audit(userId: number, toolName: string): void {
    void withRequestContext(this.orm, () =>
      this.auditLog.writeAudit({
        userId,
        action: 'mcp.tool_call',
        resource: toolName,
        details: { clientId: 'assistant' },
      }),
    ).catch(() => undefined);
  }
}
