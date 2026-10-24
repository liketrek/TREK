import { AirportsService } from '../../airports/airports.service';
import { logWarn } from '../../audit/audit-log.logger';
import { categoriesFrom, type TripCard } from '../assistant-context';
import { writeToolOf } from '../assistant-tools.constants';
import { AssistantToolsService, type AssistantToolSession } from '../assistant-tools.service';
import { describeToolCall } from '../tool-call-preview.helpers';
import type { UiStreamWriter } from '../ui-stream.writer';
import { receiptCard } from './applied-cards';
import type { CardAirport, CardReader, PreviewContext, ToolArgs, ToolCards } from './card-types';
import { readKey } from './card-values';
import { appliedCardOf, TOOL_CARDS } from './registry';
import { Injectable } from '@nestjs/common';
import type { AssistantChangePreview, AssistantMessagePart, TrekCard } from '@trek/shared';

/** Reads one held change's lookup may make; the ones past it read as null. */
export const MAX_CARD_READS = 4;

/** What the turn's reads go through: the session, unaudited. */
type ReadSession = Pick<AssistantToolSession, 'read'>;

/** A change the server proposes itself, before its card is written. */
interface ProposedCall {
  id: string;
  toolName: string;
  args: ToolArgs;
}

/** A turn's describer of held calls, as the agent loop asks for it. */
interface TurnCards {
  describe(tool: string, toolCallId: string, args: ToolArgs): Promise<AssistantChangePreview>;
}

/**
 * Reads through the session, each tool and set of arguments once per turn:
 * the second card that asks for the same read gets the first one's answer.
 * A read that failed reads as null.
 */
export function memoisedReader(session: ReadSession): (tool: string, args?: ToolArgs) => Promise<unknown> {
  const memo = new Map<string, Promise<unknown>>();
  return (tool, args = {}) => {
    const key = readKey(tool, args);
    const kept = memo.get(key);
    if (kept !== undefined) return kept;
    const read = session.read(tool, args).then(
      (run) => (run.ok ? run.value : null),
      () => null,
    );
    memo.set(key, read);
    return read;
  };
}

/**
 * The reader one held change's lookup gets: the turn's, cut off after
 * MAX_CARD_READS reads. A read the memo answers counts too, so a lookup asks
 * at most that often whatever the turn read before it.
 */
function cappedReader(read: CardReader, tool: string): CardReader {
  let left = MAX_CARD_READS;
  return (name, args) => {
    if (left <= 0) {
      logWarn(`[assistant] the lookup of ${tool} asked for more than ${MAX_CARD_READS} reads`);
      return Promise.resolve(null);
    }
    left -= 1;
    return read(name, args);
  };
}

/** What a package's lookup found for a held call, or null when it has none or it failed. */
export async function loadFor(
  tool: string,
  args: ToolArgs,
  read: CardReader,
  registry: Readonly<Record<string, ToolCards>> = TOOL_CARDS,
): Promise<unknown> {
  const cards = registry[tool];
  if (!cards?.load) return null;
  try {
    return (await cards.load(args, cappedReader(read, tool))) ?? null;
  } catch (err) {
    logWarn(`[assistant] the lookup of ${tool} failed: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/**
 * What the assistant makes its cards with beyond the tool's own answer: the
 * context a change card is written in (the trip card, the categories, the
 * user's locale and day, the airports), the lookups a package's card makes
 * before it is shown, and the card of an applied change.
 */
@Injectable()
export class AssistantCardContext {
  constructor(
    private readonly airports: AirportsService,
    private readonly tools: AssistantToolsService,
  ) {}

  /**
   * The describer of one turn's held calls. The categories are read once,
   * when the first change needs them; a package's lookup reads through the
   * turn's memo, at most MAX_CARD_READS reads per change.
   */
  forTurn(session: ReadSession & Pick<AssistantToolSession, 'hintOf'>, card: TripCard, locale: string, today: string) {
    const read = memoisedReader(session);
    const hintOf = (name: string) => session.hintOf(name);
    let categories: Promise<ReadonlyMap<number, string>> | null = null;
    const turn: TurnCards = {
      describe: async (tool, toolCallId, args) => {
        categories ??= read('list_categories').then(
          (value) => new Map(categoriesFrom(value).map((category): [number, string] => [category.id, category.name])),
        );
        const ctx = this.contextOf(card, await categories, locale, today, hintOf);
        const loaded = await loadFor(writeToolOf(tool, args), args, read);
        return describeToolCall(tool, toolCallId, args, ctx, loaded);
      },
    };
    return turn;
  }

  /** The context a change card is written in, for a change the server proposes without a turn. */
  contextOf(
    card: TripCard,
    categories: ReadonlyMap<number, string>,
    locale: string,
    today: string,
    hintOf?: PreviewContext['hintOf'],
  ): PreviewContext {
    return { card, categories, locale, today, ...(hintOf ? { hintOf } : {}), airport: (code) => this.airport(code) };
  }

  /**
   * The change cards of changes the server proposes without a turn (a booking
   * from a file, a found place), each with what its package looked up. A
   * session for the lookups is opened only when one of the tools has a lookup.
   */
  async describeProposed<C extends ProposedCall>(
    userId: number,
    tripId: number,
    ctx: PreviewContext,
    calls: readonly C[],
    registry: Readonly<Record<string, ToolCards>> = TOOL_CARDS,
  ): Promise<Array<C & { preview: AssistantChangePreview }>> {
    const looksUp = calls.some((call) => !!registry[writeToolOf(call.toolName, call.args)]?.load);
    const session = looksUp ? await this.tools.open(userId, tripId) : null;
    try {
      const read: CardReader = session ? memoisedReader(session) : () => Promise.resolve(null);
      return await Promise.all(
        calls.map(async (call) => {
          const loaded = await loadFor(writeToolOf(call.toolName, call.args), call.args, read, registry);
          return { ...call, preview: describeToolCall(call.toolName, call.id, call.args, ctx, loaded) };
        }),
      );
    } finally {
      await session?.close();
    }
  }

  /** The card of an applied change beside its receipt, streamed and kept on the proposing message. */
  receipt(
    w: Pick<UiStreamWriter, 'card'>,
    receipts: AssistantMessagePart[],
    call: { id: string; tool_name: string },
    args: ToolArgs,
    result: unknown,
    preview: AssistantChangePreview | null,
  ): void {
    receiptCard(w, receipts, call, args, result, preview, (tool, input) => this.appliedCard(tool, input));
  }

  /** The guarded applied card of `tool`; the e2e suite stubs it here. */
  appliedCard(tool: string, input: Parameters<typeof appliedCardOf>[1]): TrekCard | null {
    return appliedCardOf(tool, input);
  }

  private airport(code: string): CardAirport | null {
    const found = /^[A-Za-z]{3}$/.test(code) ? this.airports.findByIata(code.toUpperCase()) : null;
    return found ? { city: found.city || found.name, lat: found.lat, lng: found.lng, tz: found.tz } : null;
  }
}
