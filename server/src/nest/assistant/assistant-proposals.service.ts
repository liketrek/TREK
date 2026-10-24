import { AssistantMessages } from '../../db/entities/AssistantMessages.entity';
import { AssistantThreads } from '../../db/entities/AssistantThreads.entity';
import { AssistantToolCalls } from '../../db/entities/AssistantToolCalls.entity';
import {
  ASSISTANT_MESSAGE_PARTS_WRITE,
  ASSISTANT_TOOL_ARGS,
  ASSISTANT_TOOL_PREVIEW_WRITE,
} from '../../db/json-columns';
import type {
  AssistantMessageRow,
  AssistantMessagesRepository,
} from '../../db/repositories/AssistantMessages.repository';
import type { AssistantThreadsRepository } from '../../db/repositories/AssistantThreads.repository';
import type {
  AssistantToolCallRow,
  AssistantToolCallsRepository,
} from '../../db/repositories/AssistantToolCalls.repository';
import { dbNow } from '../../db/types';
import { encodeJson } from '../../utils/json-column';
import { aiRefusal } from '../ai-connections/ai-connections.constants';
import { RateLimitService } from '../common/rate-limit.service';
import { UnitOfWork } from '../database/unit-of-work';
import { buildTripCard, categoriesFrom, todayIn, type TripCard } from './assistant-context';
import { partsOf, toThreadMessages } from './assistant-history';
import { isSportPlan, SPORT_CREATES, sportTakeArgsOf, tourTypeWord } from './assistant-proposal-sports';
import { isWayProposal, WAY_CREATES, wayTakeArgsOf } from './assistant-proposal-ways';
import { AssistantStreamRegistry } from './assistant-stream.registry';
import { decisionCutoff, TAKE_PROPOSAL_TOOL, TURNS_PER_MINUTE } from './assistant-tools.constants';
import { AssistantToolsService, type ToolRun } from './assistant-tools.service';
import { AssistantCardContext } from './cards/card-context';
import { recordOf, type Row } from './cards/card-values';
import { argText } from './cards/tour/tour-card-values';
import { cityWalkCard, paddleCard, skiCard } from './cards/tour/tour-sport.cards';
import { describeToolCall } from './tool-call-preview.helpers';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type {
  AssistantAddFoundPlaceResponse,
  AssistantMessage,
  AssistantMessagePart,
  AssistantTakeProposalRequest,
  TourRouteCard,
} from '@trek/shared';

import { randomUUID } from 'node:crypto';

/**
 * The proposing read a walk is asked again with: the answer stored in the
 * thread is the copy the model saw (masked, its lists cut to fit), so the
 * stations to create are read whole from the tool itself.
 */
const WALK_READ = 'propose_city_walk';

/**
 * What a taken proposal reads: the trip's days and places, the category names
 * its card writes with, a walk or a paddle or ski plan again.
 */
const TRIP_READS: ReadonlySet<string> = new Set([
  'get_trip_summary',
  'list_places',
  'list_categories',
  WALK_READ,
  ...Object.keys(SPORT_CREATES),
]);

/** Message rows searched for the proposal; the history a turn sends the provider. */
const SEARCHED_ROWS = 40;
/** Message rows the answer holding the change is read back from; a thread is shown with as many. */
const THREAD_ROWS = 50;

/** The longest name a city walk is given from its stations, well inside a tour's name. */
const WALK_NAME_CHARS = 120;

/** A proposal an answer showed: the call that proposed it, what it answered, and the card drawn from it. */
interface StoredProposal {
  toolName: string;
  args: Row;
  result: Row;
  card: TourRouteCard;
}

/** The proposing reads a card can be taken from, and the tool each one is created through. */
const CREATES: Readonly<Record<string, string>> = {
  propose_hike: 'create_hike',
  propose_tour: 'create_tour',
  propose_city_walk: 'create_city_walk',
  ...SPORT_CREATES,
  ...WAY_CREATES,
};
const PROPOSING: ReadonlySet<string> = new Set(Object.keys(CREATES));

/** The proposal under `toolCallId` in the newest rows that hold it, with its stored card; null when there is none. */
export function storedProposal(rows: readonly AssistantMessageRow[], toolCallId: string): StoredProposal | null {
  for (const row of [...rows].reverse()) {
    const parts = partsOf(row);
    const call = parts.find(
      (part) => part.type === 'tool-call' && part.toolCallId === toolCallId && PROPOSING.has(part.toolName),
    );
    const drawn = parts.find((part) => part.type === 'data-trek-card' && part.data.toolCallId === toolCallId);
    const card = drawn?.type === 'data-trek-card' ? drawn.data.card : null;
    if (call?.type === 'tool-call' && card?.kind === 'tourRoute') {
      return { toolName: call.toolName, args: recordOf(call.args), result: recordOf(call.result), card };
    }
  }
  return null;
}

/** A walk's name from its first and last named stations ("Marienplatz → Englischer Garten"), else day and time. */
function walkName(stations: readonly Row[], result: Row): string {
  const names = stations
    .map((station) => (typeof station.name === 'string' ? station.name.replace(/\s+/g, ' ').trim() : ''))
    .filter((name) => name !== '');
  const ends = [...new Set([names[0], names.at(-1)])].filter((name): name is string => !!name);
  const frame = recordOf(result.frame);
  const fallback = [result.date, frame.start_time].filter((part) => typeof part === 'string').join(' ');
  const name = ends.length > 0 ? ends.join(' → ') : fallback;
  return name.length > WALK_NAME_CHARS ? `${name.slice(0, WALK_NAME_CHARS - 1)}…` : name;
}

/**
 * A paddle or ski plan asked again with the arguments it was planned with:
 * the stored answer is the model's shortened copy, and its legs' stretches
 * name the water or the areas the tour is called after. The card is drawn
 * again from the whole answer (the stored one when none can be drawn). Null
 * when the plan cannot be read now.
 */
async function planAgain(
  read: (name: string, args: Row) => Promise<ToolRun>,
  proposal: StoredProposal,
  trip: TripCard,
  today: string,
): Promise<StoredProposal | null> {
  const run = await read(proposal.toolName, proposal.args);
  if (!run.ok) return null;
  const input = { toolCallId: '', args: proposal.args, value: run.value, card: trip, today };
  const drawn = proposal.toolName === 'plan_ski_route' ? skiCard(input) : paddleCard(input);
  return { ...proposal, result: recordOf(run.value), card: drawn ?? proposal.card };
}

/**
 * A walk asked again with the arguments it was proposed with: the stations to
 * create from the tool's own answer, and the card drawn from that answer (the
 * stored one when none can be drawn). Null when the walk cannot be read now.
 */
async function walkAgain(
  read: (name: string, args: Row) => Promise<ToolRun>,
  proposal: StoredProposal,
  trip: TripCard,
  today: string,
): Promise<StoredProposal | null> {
  const run = await read(WALK_READ, proposal.args);
  if (!run.ok) return null;
  const drawn = cityWalkCard({ toolCallId: '', args: proposal.args, value: run.value, card: trip, today });
  return { ...proposal, result: recordOf(run.value), card: drawn ?? proposal.card };
}

/**
 * The card of the held change: the proposal's, waiting, under the name the
 * change saves and without a variant label; a day only where the change puts
 * the tour on that day (a walk is created on none, a hike asked by date alone
 * on none either).
 */
export function pendingCardOf(card: TourRouteCard, args: Row): TourRouteCard {
  const dayId = typeof args.day_id === 'number' ? args.day_id : null;
  const keepsDay = card.schedule?.dayId === dayId;
  const schedule = card.schedule && !keepsDay ? { ...card.schedule, dayId: null, dayNumber: null } : card.schedule;
  return { ...card, source: 'pending', name: argText(args.name, 120) ?? card.name, label: null, schedule };
}

/** The fields of a propose_hike create_hike takes as they are, and those of a propose_tour create_tour takes. */
const HIKE_FIELDS = [
  'name',
  'waypoints',
  'max_hiking_difficulty',
  'hiking_preferences',
  'round_trip',
  'day_id',
  'start_time',
] as const;
const TOUR_FIELDS = [
  'name',
  'activity',
  'bike_profile',
  'run_profile',
  'run_pace_seconds_per_km',
  'waypoints',
  'round_trip',
  'day_id',
  'start_time',
] as const;

/**
 * The change a taken proposal holds: create_hike (create_tour for a bike
 * tour or a run) with the proposal's own arguments for a way that was
 * planned, create_paddle_tour or create_ski_tour with a plan's points and
 * settings, create_city_walk with the
 * stations it answered for a walk that can be created. Null for a proposal
 * nothing can be created from.
 */
export function takeArgsOf(proposal: StoredProposal, fallbackName = ''): Row | null {
  if (isWayProposal(proposal.toolName)) {
    return wayTakeArgsOf(proposal.toolName, proposal.args, proposal.result, proposal.card);
  }
  const via = CREATES[proposal.toolName];
  if (via === 'create_hike' || via === 'create_tour') {
    if (!proposal.card.routed) return null;
    // A run is saved with the runner's pace only, as the planner saves one.
    if (via === 'create_tour' && proposal.args.activity === 'run' && proposal.args.run_pace_seconds_per_km == null) {
      return null;
    }
    const args: Row = { via };
    for (const key of via === 'create_hike' ? HIKE_FIELDS : TOUR_FIELDS) {
      if (proposal.args[key] !== undefined) args[key] = proposal.args[key];
    }
    return args;
  }
  if (isSportPlan(proposal.toolName))
    return sportTakeArgsOf(proposal.toolName, proposal.args, proposal.result, fallbackName);
  const stations = Array.isArray(proposal.result.stations_for_create) ? proposal.result.stations_for_create : [];
  if (proposal.result.can_create === false || stations.length < 2) return null;
  return { via, name: walkName(stations.map(recordOf), proposal.result), stations };
}

/**
 * "Plan this" on a hike or a city walk an answer proposed: the change that
 * creates it is held as a card, decided like one the model proposed, but
 * without a model turn and without counting against the daily limit. What is
 * created comes from the proposal stored in the thread, never from the
 * request: a hike from its own arguments under the card the answer showed, a
 * walk from the tool asked again with its own arguments, since the stored
 * answer is the model's shortened copy. Nothing is written to the trip here;
 * applying the card runs the tool with the user's own rights.
 */
@Injectable()
export class AssistantProposalsService {
  constructor(
    @InjectRepository(AssistantThreads) private readonly threads: AssistantThreadsRepository,
    @InjectRepository(AssistantMessages) private readonly messages: AssistantMessagesRepository,
    @InjectRepository(AssistantToolCalls) private readonly toolCalls: AssistantToolCallsRepository,
    private readonly tools: AssistantToolsService,
    private readonly rateLimit: RateLimitService,
    private readonly streams: AssistantStreamRegistry,
    private readonly uow: UnitOfWork,
    private readonly cardContext: AssistantCardContext,
  ) {}

  /**
   * Holds the change for the proposal in the user's thread and answers with
   * the answer that now holds it. Refused while a turn of the user runs
   * (`busy`), while the thread holds changes nobody decided on
   * (`decide_first`), past the per-minute limit, for a proposal the thread
   * does not hold (404) and for one nothing can be created from.
   */
  async take(
    userId: number,
    tripId: number,
    threadId: number,
    req: AssistantTakeProposalRequest,
  ): Promise<AssistantAddFoundPlaceResponse> {
    if (!(await this.threads.findOwned(threadId, userId, tripId))) {
      throw aiRefusal('not_found', 'Conversation not found');
    }
    if (!(await this.rateLimit.check('assistant', String(userId), TURNS_PER_MINUTE, 60_000, Date.now()))) {
      throw aiRefusal('too_many_requests', 'Too many requests, try again in a minute');
    }
    const controller = new AbortController();
    if (!(await this.streams.claim(userId, controller))) {
      throw aiRefusal('busy', 'The assistant is already answering in another window');
    }
    try {
      await this.hold(userId, tripId, threadId, req);
    } finally {
      await this.streams.release(userId, controller);
    }
    return { message: await this.answerOf(threadId) };
  }

  private async hold(userId: number, tripId: number, threadId: number, req: AssistantTakeProposalRequest) {
    if ((await this.toolCalls.listOpen(threadId, decisionCutoff())).length > 0) {
      throw aiRefusal('decide_first', 'Decide on the changes that are waiting first');
    }
    const stored = storedProposal(await this.messages.listLatest(threadId, SEARCHED_ROWS), req.toolCallId);
    if (!stored) throw aiRefusal('not_found', 'This proposal is not in the conversation');

    const id = randomUUID();
    const today = todayIn(req.timeZone, new Date());
    const { card, categories, proposal } = await this.tripOf(userId, tripId, stored, today);
    const fallback = isSportPlan(stored.toolName) ? await tourTypeWord(req.locale, stored.toolName) : '';
    const args = proposal ? takeArgsOf(proposal, fallback) : null;
    if (!proposal || !args) throw aiRefusal('generic', 'Nothing can be created from this proposal: ask for it again');
    const ctx = this.cardContext.contextOf(card, categories, req.locale, today);
    // The proposal it came from, so the thread tells which card was taken, whatever way it creates.
    const preview = {
      ...describeToolCall(TAKE_PROPOSAL_TOOL, id, args, ctx),
      card: pendingCardOf(proposal.card, args),
      takenFrom: req.toolCallId,
    };
    const parts: AssistantMessagePart[] = [
      { type: 'tool-call', toolCallId: id, toolName: TAKE_PROPOSAL_TOOL, args, approval: { id } },
      { type: 'data-trek-change', data: preview },
    ];
    const now = dbNow();
    await this.uow.transactional(async () => {
      const messageId = await this.messages.append({
        threadId,
        role: 'assistant',
        parts: encodeJson(ASSISTANT_MESSAGE_PARTS_WRITE, parts),
        providerState: null,
        status: 'awaiting_approval',
        model: null,
        createdAt: now,
      });
      await this.toolCalls.insertProposals([
        {
          id,
          threadId,
          messageId,
          providerCallId: `take_${id}`,
          toolName: TAKE_PROPOSAL_TOOL,
          args: encodeJson(ASSISTANT_TOOL_ARGS, args),
          preview: encodeJson(ASSISTANT_TOOL_PREVIEW_WRITE, preview),
          createdAt: now,
        },
      ]);
      await this.threads.touch(threadId, now);
    });
  }

  /**
   * The trip card, the category names and the proposal to take (a walk read
   * again, null when it cannot be), read through the tools with the user's rights.
   */
  private async tripOf(
    userId: number,
    tripId: number,
    stored: StoredProposal,
    today: string,
  ): Promise<{ card: TripCard; categories: ReadonlyMap<number, string>; proposal: StoredProposal | null }> {
    const session = await this.tools.open(userId, tripId, TRIP_READS);
    try {
      const summary = await session.read('get_trip_summary');
      const places = await session.read('list_places');
      const listed = await session.read('list_categories');
      const categories = categoriesFrom(listed.ok ? listed.value : null);
      const card = buildTripCard(
        tripId,
        userId,
        summary.ok ? summary.value : null,
        places.ok ? places.value : null,
        null,
      );
      const read = (name: string, args: Row) => session.read(name, args);
      return {
        card,
        categories: new Map(categories.map((category): [number, string] => [category.id, category.name])),
        proposal: await this.again(read, stored, card, today),
      };
    } finally {
      await session.close();
    }
  }

  /** The proposal as it is taken: a walk or a paddle or ski plan asked again, a hike or tour as it was stored. */
  private async again(
    read: (name: string, args: Row) => Promise<ToolRun>,
    stored: StoredProposal,
    card: TripCard,
    today: string,
  ): Promise<StoredProposal | null> {
    if (stored.toolName === WALK_READ) return await walkAgain(read, stored, card, today);
    return isSportPlan(stored.toolName) ? await planAgain(read, stored, card, today) : stored;
  }

  /** The newest answer of the thread as the client shows it, with what became of its changes. */
  private async answerOf(threadId: number): Promise<AssistantMessage> {
    const rows = await this.messages.listLatest(threadId, THREAD_ROWS);
    const held = rows.filter((row) => partsOf(row).some((part) => part.type === 'tool-call' && part.approval));
    const lists = await Promise.all(held.map((row) => this.toolCalls.listByMessage(row.id)));
    const calls = new Map(lists.flat().map((call): [string, AssistantToolCallRow] => [call.id, call]));
    const messages = toThreadMessages(rows, calls, new Date());
    return messages[messages.length - 1];
  }
}
