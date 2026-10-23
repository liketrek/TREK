import type { AiProviderState } from '../../db/json-columns';
import {
  AiProviderError,
  isImageRefusal,
  type AiChatClient,
  type AiChatMessage,
  type AiImage,
  type AiToolCall,
  type AiToolSpec,
} from '../ai-connections/ai-chat-client.interface';
import { activityOf, foundPlacesOf, googleIdsOf, weatherDayOf, weatherOf } from './assistant-cards.helpers';
import type { TripCard } from './assistant-context';
import { FOLLOW_UPS_ANSWER, followUpsOf } from './assistant-follow-ups';
import { outputText } from './assistant-history';
import { toolOutputForProvider } from './assistant-output';
import { MAX_CARDS_PER_STEP, MAX_READS_PER_STEP, MAX_STEPS, MAX_WRITES_PER_STEP } from './assistant-tools.constants';
import type { AssistantToolKind, ToolRun } from './assistant-tools.service';
import type { AnswerInput } from './cards/card-types';
import { answerCardOf } from './cards/registry';
import type { UiStreamWriter } from './ui-stream.writer';
import {
  ASSISTANT_FOLLOW_UPS_TOOL,
  ASSISTANT_PAGE_IMAGE,
  type AssistantChangePreview,
  type AssistantErrorCode,
  type AssistantMessagePart,
  type AssistantPageView,
  type AssistantWeatherDay,
  type TrekCard,
} from '@trek/shared';

type ToolArgs = Record<string, unknown>;

/**
 * What a tool call came back with; a look at a Studio page also brings the
 * page image for the model (in memory for this turn only) and what the
 * message keeps of the look.
 */
export interface AgentToolRun extends ToolRun {
  images?: AiImage[];
  view?: AssistantPageView;
}

/** The tools of the turn, as the loop uses them (an AssistantToolSession, in the Studio with its page preview). */
export interface AgentToolPort {
  specs(): AiToolSpec[];
  kindOf(name: string): AssistantToolKind | null;
  pinArgs(name: string, args: ToolArgs): { args: ToolArgs } | { error: string };
  call(name: string, args: ToolArgs): Promise<AgentToolRun>;
}

/** A Studio turn's page images, as the loop uses them (assistant-vision.ts). */
export interface AgentVision {
  /** The provider refused an image: the rest of the turn, and later turns on this model, go without. */
  refused(): void;
  /** The history a turn starts from, with views of the pages the changes just applied left. */
  afterApply(history: readonly AiChatMessage[]): Promise<AiChatMessage[]>;
}

/** What one step leaves in its message row. */
export interface StepRecord {
  parts: AssistantMessagePart[];
  providerState: AiProviderState | null;
}

/** A change the step proposes, held for the user under its own id. */
export interface HeldCall {
  id: string;
  providerCallId: string;
  toolName: string;
  args: ToolArgs;
  preview: AssistantChangePreview;
}

/** Where the loop keeps its steps: one message row each. */
export interface AgentStore {
  /** The row the next step writes into. */
  openStep(): Promise<number>;
  saveStep(rowId: number, step: StepRecord, status: 'complete' | 'aborted' | 'error'): Promise<void>;
  /** Saves a step that ends waiting for the user, together with the changes it holds. */
  holdStep(rowId: number, step: StepRecord, held: HeldCall[]): Promise<void>;
}

export interface AgentDeps {
  client: AiChatClient;
  tools: AgentToolPort;
  store: AgentStore;
  describe(toolName: string, toolCallId: string, args: ToolArgs): Promise<AssistantChangePreview>;
  newId(): string;
  /** The day's turns on the instance's connection, sent before the turn ends; null when the user pays. */
  quota: { used: number; limit: number } | null;
  /** The trip as the turn read it, for the cards an answer shows beside its text. */
  card: TripCard;
  /** Today in the user's time zone (`YYYY-MM-DD`). */
  today: string;
  /** The card a read's answer shows; the registry's (`answerCardOf`) unless a test hands in its own. */
  answerCard?: (tool: string, input: AnswerInput) => TrekCard | null;
  /**
   * Why a proposed change goes back to the model as its call's error instead
   * of to the user (a Studio turn's book check); null holds it as usual.
   */
  refusalOf?: (tool: string, args: ToolArgs) => Promise<string | null>;
  /** A Studio turn's page images; without it no image ever goes to the model. */
  vision?: AgentVision | null;
}

export interface AgentInput {
  system: string;
  context: string;
  cacheKey: string;
  history: AiChatMessage[];
  /** The provider call ids the thread used already; a repeated one is replaced. */
  usedCallIds: Set<string>;
}

interface AgentOutcome {
  end: 'stop' | 'awaiting' | 'max_steps' | 'aborted' | 'failed';
  /** What failed (a provider refusal, the step limit), null for a turn that ended well or was stopped. */
  code: AssistantErrorCode | null;
  inputTokens: number;
  /** The part of inputTokens the provider read from its prompt cache. */
  cachedInputTokens: number;
  outputTokens: number;
}

const TOO_MANY_CHANGES = `Too many changes in one step: propose at most ${MAX_WRITES_PER_STEP} at once.`;
const TOO_MANY_LOOKUPS = `Too many lookups in one step: make at most ${MAX_READS_PER_STEP} at once.`;

/** What a step collects while its calls run: its parts, and the weather its lookups found. */
interface StepParts {
  parts: AssistantMessagePart[];
  weather: AssistantWeatherDay[];
  /** The google place ids the turn has seen so far; a search adds what it found. */
  knownPlaceIds: Set<string>;
  /** The answer cards the step has shown; past MAX_CARDS_PER_STEP a read shows none. */
  cards: number;
  /** The page images of the step's reads, by call id, for the model's next request only. */
  images: Map<string, AiImage[]>;
}

/** The longest call id a card is kept under; a read under a longer one shows no card. */
const MAX_CARD_CALL_ID = 64;

const UNKNOWN_PLACE_ID =
  'Unknown place id. Use a google place id from the trip card or from a search result of this turn; ' +
  'if you have none, call search_place first.';

/**
 * Models make up Google place ids (the example from Google's own docs is a
 * favourite), and the lookup then fails in a way that reads like TREK's
 * fault. So a details lookup only runs for an id the turn has seen: one of
 * the trip's places, or one a search of this turn answered with.
 */
function placeIdRefusal(name: string, args: ToolArgs, known: ReadonlySet<string>): string | null {
  if (name !== 'get_place_details') return null;
  return typeof args.placeId === 'string' && known.has(args.placeId) ? null : UNKNOWN_PLACE_ID;
}

/**
 * A first answer that ends on a colon or an ellipsis announced lookups it did
 * not make ("Let me check the weather:"). It gets one push to make them.
 */
const ANNOUNCED = /(?::|…|\.\.\.)$/;
const MAKE_THE_CALLS = 'Go on: make those tool calls now, in this reply, instead of announcing them.';

/**
 * A step that came back with nothing, or was cut off before a call was whole.
 * Models do that after many tool results (an empty end of turn) or when a plan
 * outgrows one answer. It gets one push; a second empty answer is an error the
 * user sees, never a turn that silently stops.
 */
const GO_ON =
  'Your last reply came back empty or was cut off. Carry on from where you were: answer, or make the calls now. ' +
  'If the plan is large, propose part of it now; after the user decided you continue with the rest.';

/**
 * Runs a read at once and records it: where it looks (streamed only), its
 * call and answer, and the cards its answer makes (its package's card first,
 * then the places strip). The cards are built from the tool's own answer, the
 * parts the provider sees from the redacted one.
 */
async function runRead(
  deps: AgentDeps,
  call: { id: string; name: string; args: ToolArgs },
  w: UiStreamWriter,
  step: StepParts,
): Promise<void> {
  const { id, name, args } = call;
  const activity = activityOf(name, id, args, deps.card);
  if (activity) w.activity(activity);
  w.toolInput(id, name, args);
  const run = await deps.tools.call(name, args);
  const output = toolOutputForProvider(name, run.value);
  if (run.ok) w.toolOutput(id, output);
  else w.toolError(id, outputText(output));
  step.parts.push({
    type: 'tool-call',
    toolCallId: id,
    toolName: name,
    args,
    result: output,
    ...(run.ok ? {} : { isError: true }),
  });
  if (!run.ok) return;
  // A look at a Studio page: the message keeps what was looked at, the model gets one image of it.
  if (run.view) {
    w.pageView(run.view);
    step.parts.push({ type: 'data-trek-page-view', data: run.view });
  }
  if (run.images?.length) step.images.set(id, run.images.slice(0, 1));
  const input = { toolCallId: id, args, value: run.value, card: deps.card, today: deps.today };
  const card = id.length <= MAX_CARD_CALL_ID ? (deps.answerCard ?? answerCardOf)(name, input) : null;
  if (card && step.cards++ < MAX_CARDS_PER_STEP) {
    w.card({ toolCallId: id, card });
    step.parts.push({ type: 'data-trek-card', data: { toolCallId: id, card } });
  }
  for (const placeId of googleIdsOf(name, run.value)) step.knownPlaceIds.add(placeId);
  const places = foundPlacesOf(name, id, run.value, deps.card, deps.today);
  if (places) {
    w.places(places);
    step.parts.push({ type: 'data-trek-places', data: places });
  }
  const day = weatherDayOf(name, args, run.value, deps.card);
  if (day) step.weather.push(day);
}

function uniqueCallId(call: AiToolCall, used: Set<string>, newId: () => string): string {
  const id = call.id && !used.has(call.id) ? call.id : `call_${newId()}`;
  used.add(id);
  return id;
}

/** What every step of one turn shares. */
interface Turn {
  deps: AgentDeps;
  input: AgentInput;
  w: UiStreamWriter;
  signal: AbortSignal;
  history: AiChatMessage[];
  usage: { inputTokens: number; cachedInputTokens: number; outputTokens: number };
  knownPlaceIds: Set<string>;
  /** Whether the turn used its one push (an empty, cut-off or announcing answer). */
  nudged: boolean;
}

function outcomeOf(turn: Turn, end: AgentOutcome['end'], code: AssistantErrorCode | null = null): AgentOutcome {
  return { end, code, ...turn.usage };
}

function finishTurn(turn: Turn, reason: 'stop' | 'tool-calls' | 'error'): void {
  if (turn.deps.quota) turn.w.quota(turn.deps.quota.used, turn.deps.quota.limit);
  turn.w.finish(reason);
}

/** What the model answered in one step. */
interface StepAnswer {
  text: string;
  received: AiToolCall[];
  providerState: AiProviderState | null;
  cutOff: boolean;
}

/**
 * The history as one model request carries it: the page images of the
 * newest `max` messages that have any, one image each; older messages go as
 * their text alone, which holds the page's description.
 */
function limitImages(history: readonly AiChatMessage[], max: number): AiChatMessage[] {
  let kept = 0;
  return history
    .slice()
    .reverse()
    .map((message) => {
      if (message.role === 'assistant' || !message.images?.length) return message;
      return { ...message, images: kept++ < max ? message.images.slice(0, 1) : undefined };
    })
    .reverse();
}

/**
 * A provider that refused the request over its images (a model that reads
 * none after all): the turn's history loses its images, the vision remembers
 * the model as text only, and the step is asked again, once. False for any
 * other failure, or when there was no image to drop.
 */
function dropImagesAfter(turn: Turn, err: unknown): boolean {
  const withImages = turn.history.some((message) => message.role !== 'assistant' && !!message.images?.length);
  if (!turn.deps.vision || !withImages || !isImageRefusal(err)) return false;
  turn.deps.vision.refused();
  turn.history.forEach((message, index) => {
    if (message.role !== 'assistant' && message.images) turn.history[index] = { ...message, images: undefined };
  });
  return true;
}

/** Streams one answer of the model; a failure or a stop ends the turn here, saved as far as it got. */
async function streamAnswer(turn: Turn, rowId: number): Promise<StepAnswer | AgentOutcome> {
  const { deps, input, w, signal } = turn;
  const answer: StepAnswer = { text: '', received: [], providerState: null, cutOff: false };
  try {
    const events = deps.client.stream(
      {
        system: input.system,
        context: input.context,
        messages: limitImages(turn.history, ASSISTANT_PAGE_IMAGE.perRequest),
        tools: deps.tools.specs(),
        cacheKey: input.cacheKey,
      },
      signal,
    );
    for await (const event of events) {
      if (event.type === 'text-delta') {
        answer.text += event.delta;
        w.text(event.delta);
      } else if (event.type === 'tool-call') answer.received.push(event.call);
      else if (event.type === 'usage') {
        turn.usage.inputTokens += event.inputTokens;
        turn.usage.cachedInputTokens += event.cachedInputTokens;
        turn.usage.outputTokens += event.outputTokens;
      } else if (event.type === 'provider-state') answer.providerState = event.state;
      else if (event.type === 'finish') answer.cutOff = event.reason === 'length';
    }
    return answer;
  } catch (err) {
    if (!signal.aborted && !answer.text && answer.received.length === 0 && dropImagesAfter(turn, err)) {
      return streamAnswer(turn, rowId);
    }
    const partial: StepRecord = {
      parts: answer.text ? [{ type: 'text', text: answer.text }] : [],
      providerState: null,
    };
    if (signal.aborted) {
      await deps.store.saveStep(rowId, partial, 'aborted');
      w.abort();
      return outcomeOf(turn, 'aborted');
    }
    const code = err instanceof AiProviderError ? err.code : 'generic';
    await deps.store.saveStep(rowId, partial, 'error');
    w.error(code);
    finishTurn(turn, 'error');
    return outcomeOf(turn, 'failed', code);
  }
}

/**
 * Runs the calls of one step in the order the model made them: a read at once,
 * a change described and held, a refused call answered with why.
 */
async function runCalls(turn: Turn, calls: AiToolCall[], collected: StepParts): Promise<HeldCall[]> {
  const { deps, w, signal } = turn;
  const writes = calls.filter((call) => deps.tools.kindOf(call.name) === 'write').length;
  const held: HeldCall[] = [];
  let reads = 0;
  const runOne = async (call: AiToolCall): Promise<void> => {
    if (signal.aborted) return;
    const kind = deps.tools.kindOf(call.name);
    let prepared = kind ? deps.tools.pinArgs(call.name, call.args) : { error: `Unknown tool: ${call.name}` };
    const unknownPlace = 'error' in prepared ? null : placeIdRefusal(call.name, prepared.args, turn.knownPlaceIds);
    if (unknownPlace) prepared = { error: unknownPlace };
    if (kind === 'write' && !('error' in prepared)) {
      const refused = await deps.refusalOf?.(call.name, prepared.args);
      if (refused) prepared = { error: refused };
    }
    if (kind === 'read' && !('error' in prepared)) reads += 1;
    const overCap = kind === 'write' ? writes > MAX_WRITES_PER_STEP : reads > MAX_READS_PER_STEP;
    if ('error' in prepared || overCap) {
      let refusal = kind === 'write' ? TOO_MANY_CHANGES : TOO_MANY_LOOKUPS;
      if ('error' in prepared) refusal = prepared.error;
      w.toolInput(call.id, call.name, call.args);
      w.toolError(call.id, refusal);
      collected.parts.push({
        type: 'tool-call',
        toolCallId: call.id,
        toolName: call.name,
        args: call.args,
        result: refusal,
        isError: true,
      });
      return;
    }
    if (kind === 'read') {
      await runRead(deps, { id: call.id, name: call.name, args: prepared.args }, w, collected);
      return;
    }
    const id = deps.newId();
    const preview = await deps.describe(call.name, id, prepared.args);
    held.push({ id, providerCallId: call.id, toolName: call.name, args: prepared.args, preview });
  };
  // One after another: the stream tells each call before the next one starts.
  await calls.reduce<Promise<void>>(async (previous, call) => {
    await previous;
    await runOne(call);
  }, Promise.resolve());
  return held;
}

/** Saves a step whose changes wait for the user and announces them; the turn ends there. */
async function holdChanges(turn: Turn, rowId: number, step: StepRecord, held: HeldCall[]): Promise<AgentOutcome> {
  const { w } = turn;
  for (const change of held) {
    const { id, toolName, args } = change;
    step.parts.push({ type: 'tool-call', toolCallId: id, toolName, args, approval: { id } });
  }
  step.parts.push(...held.map((change): AssistantMessagePart => ({ type: 'data-trek-change', data: change.preview })));
  await turn.deps.store.holdStep(rowId, step, held);
  for (const change of held) {
    w.toolInput(change.id, change.toolName, change.args);
    w.approvalRequest(change.id);
    w.change(change.preview);
  }
  w.finishStep();
  finishTurn(turn, 'tool-calls');
  return outcomeOf(turn, 'awaiting');
}

/**
 * Records a step that ran its reads, and hands their answers back for the
 * next one, a page image beside the answer of the look that brought it.
 */
async function carryOn(
  turn: Turn,
  rowId: number,
  step: StepRecord,
  answer: { text: string; calls: AiToolCall[]; images: ReadonlyMap<string, AiImage[]> },
): Promise<void> {
  await turn.deps.store.saveStep(rowId, step, 'complete');
  turn.w.finishStep();
  const { text, calls, images } = answer;
  turn.history.push({ role: 'assistant', text, toolCalls: calls, providerState: step.providerState });
  for (const part of step.parts) {
    if (part.type !== 'tool-call') continue;
    const seen = images.get(part.toolCallId);
    turn.history.push({
      role: 'tool',
      toolCallId: part.toolCallId,
      name: part.toolName,
      output: outputText(part.result),
      ...(part.isError ? { isError: true } : {}),
      ...(seen ? { images: seen } : {}),
    });
  }
}

/** A follow-up call as the step keeps it: answered by the server, never run. */
function answeredAsk(call: AiToolCall): AssistantMessagePart {
  return { type: 'tool-call', toolCallId: call.id, toolName: call.name, args: call.args, result: FOLLOW_UPS_ANSWER };
}

/** One step of the turn: the outcome when the turn ends with it, null when the model is asked again. */
async function runStep(turn: Turn, step: number): Promise<AgentOutcome | null> {
  const { deps, input, w, signal, history } = turn;
  const rowId = await deps.store.openStep();
  w.startStep();
  const answer = await streamAnswer(turn, rowId);
  if ('end' in answer) return answer;
  const { text, providerState, cutOff } = answer;
  const all = answer.received.map((call) => ({ ...call, id: uniqueCallId(call, input.usedCallIds, deps.newId) }));
  // The follow-ups the model offers are the server's to answer: they never run, and alone they end the turn.
  const asks = all.filter((call) => call.name === ASSISTANT_FOLLOW_UPS_TOOL);
  const received = all.filter((call) => call.name !== ASSISTANT_FOLLOW_UPS_TOOL);

  const parts: AssistantMessagePart[] = text ? [{ type: 'text', text }] : [];
  const empty = received.length === 0 && !text.trim();
  // An answer that offered follow-ups is finished, however it ends.
  const settled = asks.length > 0 && !empty;
  const announced = !settled && received.length === 0 && step === 0 && ANNOUNCED.test(text.trimEnd());
  const push = empty || (!settled && received.length === 0 && cutOff) ? GO_ON : announced ? MAKE_THE_CALLS : null;
  if (push && !turn.nudged) {
    turn.nudged = true;
    await deps.store.saveStep(rowId, { parts, providerState }, 'complete');
    w.finishStep();
    // An empty assistant message is one the providers refuse; only the push goes back.
    if (!empty) history.push({ role: 'assistant', text, toolCalls: [], providerState });
    history.push({ role: 'user', text: push });
    return null;
  }
  if (empty) {
    await deps.store.saveStep(rowId, { parts, providerState }, 'error');
    w.error('empty_answer');
    finishTurn(turn, 'error');
    return outcomeOf(turn, 'failed', 'empty_answer');
  }
  // Every call is answered, so the provider's own record of the step stays whole when it is replayed.
  parts.push(...asks.map((call) => answeredAsk(call)));
  if (received.length === 0) {
    const followUps = asks.length > 0 ? followUpsOf(asks[asks.length - 1].args) : null;
    if (followUps) {
      parts.push({ type: 'data-trek-follow-ups', data: followUps });
      w.followUps(followUps);
    }
    await deps.store.saveStep(rowId, { parts, providerState }, 'complete');
    w.finishStep();
    finishTurn(turn, 'stop');
    return outcomeOf(turn, 'stop');
  }

  const calls = [...received, ...asks];
  const collected: StepParts = { parts, weather: [], knownPlaceIds: turn.knownPlaceIds, cards: 0, images: new Map() };
  const held = await runCalls(turn, received, collected);
  // One weather strip per step, whatever the step held: it is told before the changes.
  const weather = weatherOf(collected.weather);
  if (weather) {
    w.weather(weather);
    parts.push({ type: 'data-trek-weather', data: weather });
  }

  // A stopped step keeps what ran; the changes it was about to propose are dropped, never held.
  if (signal.aborted) {
    await deps.store.saveStep(rowId, { parts, providerState }, 'aborted');
    w.abort();
    return outcomeOf(turn, 'aborted');
  }
  if (held.length > 0) return holdChanges(turn, rowId, { parts, providerState }, held);
  await carryOn(turn, rowId, { parts, providerState }, { text, calls, images: collected.images });
  return null;
}

/** The steps from `step` on, each after the one before, until one ends the turn or the limit does. */
async function stepsFrom(turn: Turn, step: number): Promise<AgentOutcome> {
  if (step >= MAX_STEPS) {
    turn.w.error('max_steps');
    finishTurn(turn, 'error');
    return outcomeOf(turn, 'max_steps', 'max_steps');
  }
  return (await runStep(turn, step)) ?? stepsFrom(turn, step + 1);
}

/**
 * One assistant turn: the model is asked, the reads it calls are run and
 * answered, and it is asked again, until it answers without calling a tool,
 * proposes changes, fails, is stopped, or has taken MAX_STEPS steps.
 *
 * Changes are never run here. A step that proposes some is saved with them
 * held, each with its change card, and the turn ends; the user's decision
 * starts the next turn with their results in the history. Each step is saved
 * before its held changes are announced, so a card the client shows always
 * exists on the server.
 */
export async function runAgentLoop(
  deps: AgentDeps,
  input: AgentInput,
  w: UiStreamWriter,
  signal: AbortSignal,
): Promise<AgentOutcome> {
  const history = deps.vision ? await deps.vision.afterApply(input.history) : [...input.history];
  const knownPlaceIds = new Set(
    [...deps.card.places.values()].flatMap((place) => (place.googlePlaceId ? [place.googlePlaceId] : [])),
  );
  const turn: Turn = {
    deps,
    input,
    w,
    signal,
    history,
    usage: { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0 },
    knownPlaceIds,
    nudged: false,
  };
  return stepsFrom(turn, 0);
}
