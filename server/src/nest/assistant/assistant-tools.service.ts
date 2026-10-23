import { createLocalMcpServer, McpRegistryService, type McpRegistryListing } from '../../nest-mcp';
import type { AiToolSpec } from '../ai-connections/ai-chat-client.interface';
import { AuditService } from '../audit/audit.service';
import { traceEntry } from '../audit/entry-trace.logger';
import { withRequestContext } from '../database/request-context';
import { FOLLOW_UPS_SPEC } from './assistant-follow-ups';
import { REMEMBER_SPEC } from './assistant-memory';
import {
  ASSISTANT_TOOL_GROUPS,
  checkDenylist,
  checkStudioTools,
  groupOf,
  HELD_READS,
  isOfferedInJourney,
  isOfferedTool,
  isStudioController,
  JOURNEY_PINNED_ARG,
  keptInJourney,
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
}

/**
 * A trip turn's session offers every tool (the core first, the rest by group);
 * a journey turn's offers the Studio's tools at once and nothing else; an
 * undo's holds its one target.
 */
type SessionMode = 'turn' | 'journey' | 'undo';

/** The argument every pinned tool runs with, and its value: the conversation's trip or journey. */
interface SessionPin {
  arg: string;
  id: number;
}

/** The registered tools by name, as the registry lists them. */
type ToolCatalog = ReadonlyMap<string, McpRegistryListing>;

/** Which registered tools a session attaches, and which of those it keeps once they are listed. */
interface SessionOffer {
  catalog: ToolCatalog;
  include: (name: string) => boolean;
  keep: (tool: ListedTool) => boolean;
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
    if (!tools.has(name) && !ASSISTANT_SERVER_TOOLS.has(name)) {
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
  for (const name of [...ASSISTANT_SERVER_TOOLS, USE_TOOLS_TOOL, PREVIEW_BOOK_PAGE_TOOL, ASSISTANT_FOLLOW_UPS_TOOL]) {
    if (tools.has(name)) problems.push(`"${name}" is the server's own step`);
  }
  return [...problems, ...checkDenylist(tools), ...checkStudioTools(listing)];
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

function hiddenArgs(name: string, pinArg: string = PINNED_ARG): Set<string> {
  const policy = ASSISTANT_ARG_POLICY[name];
  return new Set([pinArg, ...Object.keys(policy?.forced ?? {}), ...(policy?.stripped ?? [])]);
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
 * Studio conversation pins its journey the same way, through `journeyId`.
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

  /**
   * The tools as the model is offered them: the core and the groups it
   * loaded, the trip notes, and the step that loads the other groups. A
   * journey's session offers all it holds and no more.
   */
  specs(): AiToolSpec[] {
    const listed = [...this.tools.values()]
      .filter((tool) => this.mode !== 'turn' || tool.hint.group === null || this.loaded.has(tool.hint.group))
      .map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: modelSchema(tool.name, tool.inputSchema, this.pinArg),
      }));
    if (this.mode === 'undo') return listed;
    if (this.mode !== 'turn') return [...listed, FOLLOW_UPS_SPEC];
    const more = Object.keys(ASSISTANT_TOOL_GROUPS).some((group) => !this.loaded.has(group));
    return [...listed, REMEMBER_SPEC, ...(more ? [USE_TOOLS_SPEC] : []), FOLLOW_UPS_SPEC];
  }

  kindOf(name: string): AssistantToolKind | null {
    if (name === REMEMBER_TOOL) return this.mode === 'turn' ? 'write' : null;
    // The follow-ups change nothing; the agent loop answers them itself in every turn.
    if (name === ASSISTANT_FOLLOW_UPS_TOOL) return this.mode === 'undo' ? null : 'read';
    if (name === USE_TOOLS_TOOL) return this.mode === 'turn' ? 'read' : null;
    return this.tools.get(name)?.kind ?? null;
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
    const given = args[this.pinArg];
    if (given !== undefined && Number(given) !== this.pinnedId) {
      const about = this.pinArg === PINNED_ARG ? 'trip' : 'journey';
      return { error: `This conversation is about one ${about}; its id is set by the app and cannot be changed.` };
    }
    const hidden = hiddenArgs(name, this.pinArg);
    return { args: Object.fromEntries(Object.entries(args).filter(([key]) => !hidden.has(key))) };
  }

  /** Runs a tool on the user's behalf (a read the model asked for, an applied change, an undo), audited. */
  async call(name: string, args: ToolArgs): Promise<ToolRun> {
    if (name === USE_TOOLS_TOOL) return this.load(args);
    const final = name === TRANSIT_CREATE_TOOL ? await this.withFoundItinerary(args) : args;
    const run = await this.invoke(name, final);
    this.audit(name);
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
    const final = { ...args, ...(tool.pinned ? { [this.pinArg]: this.pinnedId } : {}), ...forced };
    try {
      return readResult(await this.client.callTool({ name, arguments: final }));
    } catch (err) {
      return { ok: false, value: err instanceof Error ? err.message : String(err) };
    }
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
   * A session for one user and journey, the Studio's: for a turn the book
   * tools and the journey's reads, each on this journey, with the book's
   * writes only for someone who may change it (`canWrite`); for an undo only
   * the named targets.
   */
  async openJourney(userId: number, journeyId: number, canWrite: boolean, undoTargets?: ReadonlySet<string>) {
    const catalog = this.catalog();
    const classOf = (name: string) => catalog.get(name)?.className;
    const include = (name: string) => (undoTargets ? undoTargets.has(name) : isOfferedInJourney(name, classOf(name)));
    const keep = (tool: ListedTool) =>
      !!undoTargets || keptInJourney(classOf(tool.name), tool.kind, tool.pinned, canWrite);
    const mode: SessionMode = undoTargets ? 'undo' : 'journey';
    return this.session(userId, { arg: JOURNEY_PINNED_ARG, id: journeyId }, mode, { catalog, include, keep });
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
        pinned: pin.arg in properties,
        hint: {
          destructive: annotations.destructiveHint === true,
          creates: annotations.idempotentHint === false,
          group: entry ? groupOf(entry) : null,
        },
      };
      if (offer.keep(listed)) tools.set(tool.name, listed);
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
