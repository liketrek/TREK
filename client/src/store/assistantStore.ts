import {
  ASSISTANT_ERROR_CODES,
  type AiStatusResponse,
  type AssistantActivity,
  type AssistantApplied,
  type AssistantDecision,
  type AssistantErrorCode,
  type AssistantFocus,
  type AssistantFoundPlace,
  type AssistantMapView,
  type AssistantMention,
  type AssistantMessage,
  type AssistantMessagePart,
  type AssistantPageRender,
  type AssistantThreadSummary,
  type UiStreamChunk,
} from '@trek/shared';
import { create, type StoreApi } from 'zustand';
import { AssistantRequestError } from '../api/assistant';
import { aiConnectionsRepo } from '../repo/aiConnectionsRepo';
import { assistantRepo } from '../repo/assistantRepo';
import { OnlineOnlyError } from '../repo/onlineOnly';
import type { Assignment } from '../types';
import { browserTimeZone } from '../utils/localDate';
import { randomId } from '../utils/randomId';
import type { RouteProfileFocus } from '../utils/routeGeometry';
import { assistantScopeOf, assistantTargetOf, type AssistantChatKey } from './assistantChatKey';
import {
  blockDays,
  blockKeyOf,
  changeEffects,
  dayPoints,
  snapshotDays,
  type LatLng,
  type WindowRect,
} from './assistantMapModel';
import { applyChunk, closeUndo, markDecisions } from './assistantMessages';
import { useSettingsStore } from './settingsStore';
import { useTripStore } from './tripStore';

/**
 * The assistant: whether it can run, whether its window is open, and one
 * conversation per trip and one per journey (the chat in TREK Studio), each
 * under its `AssistantChatKey`. The actions both kinds of chat have take that
 * key; the ones that only make sense on a trip (files, found places,
 * proposals, the before and after on the map) take a trip's id and do nothing
 * for a journey's key.
 *
 * Online-only like the repos it calls; nothing here reaches Dexie. Messages
 * are kept in the server's stored shape (`AssistantMessage`), and the stream
 * is folded into them by `applyChunk`, so a streamed answer and a reloaded
 * one are the same data. The view converts them for @assistant-ui; this file
 * does not import it.
 *
 * Streaming writes reach the store at most once per animation frame: a fast
 * model sends hundreds of deltas a second, and each set() re-renders the
 * thread.
 */

interface AssistantTripChat {
  /** The open thread; null for a new one the first message creates. */
  threadId: number | null;
  /** The user's latest threads in this trip; null until loaded. */
  threads: AssistantThreadSummary[] | null;
  messages: AssistantMessage[];
  isRunning: boolean;
  /** A thread is being loaded. */
  loading: boolean;
  error: AssistantErrorCode | null;
  /** What the next message is about: a place the user asked from, or the selected day. */
  focus: AssistantFocus | null;
  /** What is typed but not sent, kept while the phone screen hops to the map. */
  draft: string;
  /** The text of a message the server refused before answering, sent again by retry(). */
  unsent: string | null;
  /** Ends the running stream. */
  abort: AbortController | null;
  /** What the running step is doing (the place it searches near, the area); streamed only, never stored. */
  live: { activity: AssistantActivity | null };
  /** The applied changes taken back in this session, by call. */
  undone: Record<string, true>;
  /** "Before" and "after" of the last block of changes applied here; null when there is none to compare. */
  compare: AssistantCompare | null;
  /** The days, places and bookings named with @ in the draft. */
  mentions: AssistantMentionItem[];
  /** The way picked among the ways a block of cards offers, by block. */
  picks: Record<string, string>;
}

/** A mention as the composer picked it, with the label it wrote into the text. */
export type AssistantMentionItem = AssistantMention & { label: string };

/**
 * The plan of the days one applied block of changes touched, as it was just
 * before, so the map can show either side. Lives only in this session.
 */
interface AssistantCompare {
  /** The block it belongs to, `blockKeyOf` its calls. */
  blockKey: string;
  mode: 'before' | 'after';
  /** The affected days' stops before the block ran, by day. */
  snapshot: Record<number, Assignment[]>;
  /** The calls of the block that make a new place. */
  newPlaceCalls: string[];
  /** The places those calls made, hidden while "before" is on. */
  addedPlaceIds: number[];
}

/** Where a hover on a change came from: its row in the card, its pin on the map, a found place in the strip. */
type AssistantMapSource = 'card' | 'map' | 'strip';

type UndoOutcome = 'undone' | 'stale' | 'failed';

/** How taking back a whole block went, counted per change. */
interface UndoBlockResult {
  done: number;
  stale: number;
  failed: number;
}

interface AssistantState {
  /** What the assistant runs on for this user; null until loaded, and the assistant stays hidden until then. */
  status: AiStatusResponse | null;
  window: { open: boolean; minimized: boolean };
  /** The chats by `AssistantChatKey`: a trip's id, or a journey's key. */
  byTrip: Record<AssistantChatKey, AssistantTripChat>;
  /** The change applied last in a trip's chat, for the planner to jump to it. */
  lastApplied: { tripId: number; applied: AssistantApplied } | null;
  /**
   * The change under the pointer, shared by its card row and its pin on the
   * map, and the side the pointer is on. One planner is on screen at a time,
   * so this is global and names its trip.
   */
  mapLink: { tripId: number; hoveredId: string | null; source: AssistantMapSource } | null;
  /** The latest request to move the map; `seq` tells a new one from the same points asked again. */
  camera: {
    tripId: number;
    seq: number;
    points: LatLng[];
    mode: 'fit' | 'pan';
    why: 'user' | 'auto';
    /** When it was asked for, so a map that mounts right after (the chat switched to it) still moves. */
    at: number;
  } | null;
  /**
   * A spot a card points at (a found place, a row), drawn on the map until
   * the pointer leaves; a place of the trip pulses its own pin instead.
   */
  preview: { tripId: number; ref: string; lat: number; lng: number; name: string; placeId?: number } | null;
  /** The point of a route a card and the map both show, from the card's profile or from the line on the map. */
  routeFocus: { tripId: number; ref: string; focus: RouteProfileFocus; source: 'card' | 'map' } | null;
  /** A line a card asks the map to draw while the pointer rests on it (a day of a drive, a saved tour). */
  routePreview: { tripId: number; ref: string; lines: LatLng[][]; color: string } | null;
  /** A found place to open in the planner's place form, filled in; `seq` tells a new one from the same place asked again. */
  placeDraft: { tripId: number; seq: number; place: AssistantFoundPlace; dayId: number | null } | null;
  /** The route card the phone shows over the map. */
  routePeek: { tripId: number; toolCallId: string } | null;
  /** Where the floating window sits after its last move or resize, for the map to frame around it. */
  windowRect: WindowRect | null;
  /** The part of the planner's map on screen, sent with a question so "here" means it. */
  mapView: { tripId: number; view: AssistantMapView } | null;
  /** The TREK Studio hosting a journey's chat, by the chat's key, while that chat is open there. */
  studioHosts: Record<AssistantChatKey, AssistantStudioHost>;
  /** What the cards of a chat still send before its decisions go out (a book design's pages), by the chat's key. */
  decisionHolds: Partial<Record<AssistantChatKey, readonly AssistantDecisionHold[]>>;

  loadStatus: () => Promise<void>;
  ackPrivacy: () => Promise<void>;
  /** The user let the effective connection receive images of their Studio pages. */
  ackStudioImages: () => Promise<void>;
  /** Hosts a journey's chat in the Studio; the returned function ends it, unless another host took the key since. */
  hostStudio: (key: AssistantChatKey, host: AssistantStudioHost) => () => void;
  /** Makes the decisions of a chat wait for `settle` first; the returned function ends it. */
  holdDecisions: (key: AssistantChatKey, settle: AssistantDecisionHold) => () => void;

  open: () => void;
  close: () => void;
  toggle: () => void;
  setMinimized: (minimized: boolean) => void;
  /** Opens the window on a chat with a context chip ("Ask" on a place). */
  openWith: (key: AssistantChatKey, focus: AssistantFocus | null) => void;
  setFocus: (key: AssistantChatKey, focus: AssistantFocus | null) => void;
  setDraft: (key: AssistantChatKey, draft: string) => void;

  /** Loads the thread list and, when nothing is open yet, the latest thread. */
  resume: (key: AssistantChatKey) => Promise<void>;
  loadThreads: (key: AssistantChatKey) => Promise<void>;
  openThread: (key: AssistantChatKey, threadId: number) => Promise<void>;
  newThread: (key: AssistantChatKey) => void;
  deleteThread: (key: AssistantChatKey, threadId: number) => Promise<void>;

  send: (key: AssistantChatKey, text: string) => Promise<void>;
  /** Hands a booking file to a trip's chat, which proposes what it finds in it; does nothing under a journey key. */
  attach: (key: AssistantChatKey, file: File) => Promise<void>;
  decide: (key: AssistantChatKey, decisions: AssistantDecision[]) => Promise<void>;
  undo: (key: AssistantChatKey, toolCallId: string) => Promise<UndoOutcome>;
  cancel: (key: AssistantChatKey) => void;
  /** Sends the last question again: the refused message, or the one whose answer broke off. */
  retry: (key: AssistantChatKey) => Promise<void>;
  /** Stops the turn running in another window, then sends here. */
  continueHere: (key: AssistantChatKey) => Promise<void>;
  dismissError: (key: AssistantChatKey) => void;

  /** Takes back the applied changes of one block, the last one first. */
  undoBlock: (key: AssistantChatKey, toolCallIds: readonly string[]) => Promise<UndoBlockResult>;
  /** Shows the plan before or after the last applied block, on the map; a journey chat has none to show. */
  setCompare: (key: AssistantChatKey, mode: 'before' | 'after') => void;
  /** Suggests a found place for a day, held as a change to decide; skipped under a journey key. */
  addFoundPlace: (key: AssistantChatKey, ref: string, dayId: number) => Promise<void>;
  addMention: (key: AssistantChatKey, mention: AssistantMentionItem) => void;

  setMapHover: (tripId: number, hoveredId: string | null, source: AssistantMapSource) => void;
  requestCamera: (tripId: number, points: LatLng[], mode: 'fit' | 'pan', why: 'user' | 'auto') => void;
  /** Opens a found place in the planner's place form; the planner takes it with `takePlaceDraft`. */
  openPlaceDraft: (tripId: number, place: AssistantFoundPlace, dayId: number | null) => void;
  takePlaceDraft: (seq: number) => void;
  setPreviewPin: (preview: AssistantState['preview']) => void;
  setWindowRect: (rect: WindowRect | null) => void;
  setMapView: (mapView: AssistantState['mapView']) => void;

  setRouteFocus: (routeFocus: AssistantState['routeFocus']) => void;
  setRoutePreview: (routePreview: AssistantState['routePreview']) => void;
  setRoutePeek: (routePeek: AssistantState['routePeek']) => void;
  /** Picks one of the ways a block of cards offers. */
  pick: (key: AssistantChatKey, blockKey: string, toolCallId: string) => void;
  /**
   * Takes a proposal an answer showed as a card ("Plan this"); the server holds it as a change to decide.
   * Says what came of it: held, refused (the chat's error says why), or skipped while a turn ran or the
   * thread changed under it, and always skipped under a journey key.
   */
  takeProposal: (key: AssistantChatKey, toolCallId: string) => Promise<HoldOutcome>;
  /** Takes a found place into the saved tour open in the planner as a stop ("+ Tour"), held as a change to decide. */
  insertFoundPlace: (key: AssistantChatKey, ref: string, tourId: number) => Promise<HoldOutcome>;
}

/** What came of a change the server was asked to hold without a model turn. */
export type HoldOutcome = 'held' | 'refused' | 'skipped';

/**
 * What the TREK Studio holding a journey's chat does for its turns: it writes
 * the work still sitting in its autosave before a turn or an apply goes out,
 * so the assistant edits the book the user sees, and it draws the pages a
 * turn asks to look at (journey-studio.md 3.1). A chat with no host sends text only.
 */
export interface AssistantStudioHost {
  /** Draws the page a running turn asked for and uploads it; never throws, a page it cannot send stays text. */
  render: (request: AssistantPageRender, signal: AbortSignal) => void;
  /** Writes the local work of the book; false when it could not land (a conflict, a viewer, offline). */
  flush: () => Promise<boolean>;
}

/**
 * What a card sends before a decision of its chat goes out, a choice the
 * decision reads on the server (the pages a book design applies): it sends
 * what still waits and settles once that landed. A request already on its
 * way holds the chat by itself until it lands, past the card that sent it.
 */
type AssistantDecisionHold = () => Promise<unknown>;

/**
 * Asks every hold of the chat under `key` at once and settles when they did; a failed one lets the decision go on.
 * The holds are read once, before any is asked: one a hold adds while it sends is not asked, so a hold answers for
 * what it sends itself.
 */
async function settleHolds(ctx: Ctx, key: AssistantChatKey): Promise<void> {
  const holds = ctx.get().decisionHolds[key] ?? [];
  await Promise.allSettled(holds.map((settle) => settle()));
}

/** The Studio hosting the chat under `key`, if one does. */
const studioHostOf = (ctx: Ctx, key: AssistantChatKey): AssistantStudioHost | undefined => ctx.get().studioHosts[key];

/** A turn of a hosted chat writes the book first and says the Studio draws pages; any other turn opens as it is. */
async function hostedOpen<T>(ctx: Ctx, key: AssistantChatKey, open: (renders: { renders?: true }) => Promise<T>) {
  const host = studioHostOf(ctx, key);
  if (!host) return open({});
  try {
    await host.flush();
  } catch {
    // The Studio's save indicator shows its own failure; the turn goes on against the book the server holds.
  }
  return open({ renders: true });
}

const NO_LIVE: AssistantTripChat['live'] = { activity: null };

const EMPTY_CHAT: AssistantTripChat = {
  threadId: null,
  threads: null,
  messages: [],
  isRunning: false,
  loading: false,
  error: null,
  focus: null,
  draft: '',
  unsent: null,
  abort: null,
  live: NO_LIVE,
  undone: {},
  compare: null,
  mentions: [],
  picks: {},
};

/** What the map shows for the cards of a chat, cleared when the chat closes or changes. */
const NO_ROUTE = { routeFocus: null, routePreview: null, routePeek: null } as const;

/** A chat as the store holds it, or the empty one; stable, so a selector can return it. */
export function chatOf(state: Pick<AssistantState, 'byTrip'>, key: AssistantChatKey): AssistantTripChat {
  return state.byTrip[key] ?? EMPTY_CHAT;
}

function httpStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } } | null)?.response?.status;
}

const KNOWN_CODES: ReadonlySet<string> = new Set(ASSISTANT_ERROR_CODES);

/** The code a failure shows as: the one the server named in its body, else what the status says. */
function errorCodeOf(err: unknown): AssistantErrorCode {
  if (err instanceof AssistantRequestError) return err.code;
  if (err instanceof OnlineOnlyError) return 'offline';
  const named = (err as { response?: { data?: { code?: unknown } } } | null)?.response?.data?.code;
  if (typeof named === 'string' && KNOWN_CODES.has(named)) return named as AssistantErrorCode;
  const status = httpStatus(err);
  if (status === 429) return 'too_many_requests';
  if (status === 409) return 'busy';
  return 'generic';
}

/** The language to answer in, and the zone "today" is read in. */
function clientContext() {
  return {
    locale: useSettingsStore.getState().settings.language || 'en',
    timeZone: browserTimeZone() ?? 'UTC',
  };
}

/** Runs `fn` once in the next frame, however often it is asked for until then. */
function frameBatcher(fn: () => void) {
  const hasFrames = typeof requestAnimationFrame === 'function';
  let handle: ReturnType<typeof setTimeout> | number | null = null;
  const fire = () => {
    handle = null;
    fn();
  };
  return {
    schedule() {
      if (handle === null) handle = hasFrames ? requestAnimationFrame(fire) : setTimeout(fire, 16);
    },
    cancel() {
      if (handle === null) return;
      if (hasFrames) cancelAnimationFrame(handle as number);
      else clearTimeout(handle as ReturnType<typeof setTimeout>);
      handle = null;
    },
  };
}

interface Ctx {
  set: StoreApi<AssistantState>['setState'];
  get: StoreApi<AssistantState>['getState'];
}

const chat = (ctx: Ctx, tripId: number) => chatOf(ctx.get(), tripId);

function patch(ctx: Ctx, tripId: number, next: Partial<AssistantTripChat>) {
  ctx.set((s) => ({ byTrip: { ...s.byTrip, [tripId]: { ...chatOf(s, tripId), ...next } } }));
}

/** What the store takes from a chunk beside the messages; `signal` ends with the turn. */
function onChunk(ctx: Ctx, tripId: number, chunk: UiStreamChunk, signal: AbortSignal) {
  if (chunk.type === 'data-trek-thread') {
    const { threadId, title } = chunk.data;
    const threads = chat(ctx, tripId).threads;
    const summary: AssistantThreadSummary = { id: threadId, title, lastMessageAt: new Date().toISOString() };
    patch(ctx, tripId, { threadId, threads: threads ? [summary, ...threads.filter((t) => t.id !== threadId)] : null });
  } else if (chunk.type === 'data-trek-quota') {
    const status = ctx.get().status;
    if (status) ctx.set({ status: { ...status, quota: chunk.data } });
  } else if (chunk.type === 'data-trek-applied') {
    // The planner jumps to a trip's change; the Studio hears a book change through its broadcast.
    if (assistantScopeOf(tripId).kind === 'trip') {
      ctx.set({ lastApplied: { tripId, applied: chunk.data } });
      noteAddedPlace(ctx, tripId, chunk.data);
    }
    // A kept note lives in the user's settings; read them again so the notes dialog shows it.
    if (chunk.data.entity === 'memory') void useSettingsStore.getState().loadSettings();
  } else if (chunk.type === 'data-trek-activity') {
    patch(ctx, tripId, { live: { activity: chunk.data } });
  } else if (chunk.type === 'tool-output-available' || chunk.type === 'tool-output-error') {
    // The step the line spoke of is done; the next one says what it does itself.
    if (chat(ctx, tripId).live.activity) patch(ctx, tripId, { live: NO_LIVE });
  } else if (chunk.type === 'data-trek-render-request') {
    // The Studio holding this chat draws the page; without one the turn waits out its time and goes on as text.
    studioHostOf(ctx, tripId)?.render(chunk.data, signal);
  }
}

/** A place the compared block made, so "before" can leave it off the map. */
function noteAddedPlace(ctx: Ctx, tripId: number, applied: AssistantApplied) {
  const compare = chat(ctx, tripId).compare;
  const placeId = applied.ids[0];
  if (!compare || placeId === undefined || !compare.newPlaceCalls.includes(applied.toolCallId)) return;
  patch(ctx, tripId, { compare: { ...compare, addedPlaceIds: [...compare.addedPlaceIds, placeId] } });
}

interface Turn {
  /** The messages while the turn runs: with the new question, or with the decisions marked. */
  messages: AssistantMessage[];
  /** What they go back to when the server refuses before answering. */
  before: AssistantMessage[];
  /** The question's text, kept for retry() when the server refuses it. */
  unsent: string | null;
  open: (signal: AbortSignal) => Promise<AsyncGenerator<UiStreamChunk>>;
}

/** Opens a stream and folds it into the trip's chat until it ends. */
async function runTurn(ctx: Ctx, tripId: number, turn: Turn): Promise<void> {
  const abort = new AbortController();
  patch(ctx, tripId, { messages: turn.messages, isRunning: true, error: null, unsent: null, abort });
  // "New chat" replaces this turn's controller; from then on the turn writes nothing.
  const live = () => chat(ctx, tripId).abort === abort;
  let current = turn.messages;
  let error: AssistantErrorCode | null = null;
  const commit = frameBatcher(() => {
    if (live()) patch(ctx, tripId, { messages: current });
  });
  try {
    let stream: AsyncGenerator<UiStreamChunk>;
    try {
      stream = await turn.open(abort.signal);
    } catch (err) {
      // A question stays on screen to be sent again; held changes go back to undecided.
      current = turn.unsent === null ? turn.before : turn.messages;
      if (!abort.signal.aborted) {
        error = errorCodeOf(err);
        if (live()) patch(ctx, tripId, { unsent: turn.unsent });
      }
      return;
    }
    for await (const chunk of stream) {
      current = applyChunk(current, chunk);
      if (chunk.type === 'error') error = chunk.errorText;
      if (live()) onChunk(ctx, tripId, chunk, abort.signal);
      commit.schedule();
    }
  } catch (err) {
    // The stream broke off: stopped here, or the connection dropped.
    current = applyChunk(current, { type: 'abort' });
    if (!abort.signal.aborted) error = errorCodeOf(err);
  } finally {
    commit.cancel();
    if (live()) patch(ctx, tripId, { messages: current, isRunning: false, error, abort: null, live: NO_LIVE });
  }
}

/** The focus a question goes out with: the chip's, and the part of this trip's map on screen. */
function focusWithView(ctx: Ctx, tripId: number, focus: AssistantFocus | null): { focus?: AssistantFocus } {
  const mapView = ctx.get().mapView;
  const view = mapView?.tripId === tripId ? mapView.view : undefined;
  if (!focus && !view) return {};
  return { focus: { ...(focus ?? {}), ...(view ? { view } : {}) } };
}

async function sendMessage(ctx: Ctx, tripId: number, text: string): Promise<void> {
  const c = chat(ctx, tripId);
  const trimmed = text.trim();
  if (c.isRunning || !trimmed) return;
  const mentions = sentMentions(c.mentions, trimmed, c.focus);
  const parts: AssistantMessagePart[] = [{ type: 'text', text: trimmed }];
  if (mentions.length > 0) parts.push({ type: 'data-trek-mentions', data: { items: mentions } });
  const question: AssistantMessage = {
    id: `local-${randomId()}`,
    role: 'user',
    parts,
    status: 'complete',
    createdAt: new Date().toISOString(),
  };
  const body = {
    ...clientContext(),
    threadId: c.threadId,
    text: trimmed,
    ...focusWithView(ctx, tripId, c.focus),
    ...(mentions.length > 0 ? { mentions: mentions.map(({ kind, id }) => ({ kind, id })) } : {}),
  };
  // A new question looks at the plan as it is now.
  patch(ctx, tripId, { draft: '', mentions: [], compare: c.compare && { ...c.compare, mode: 'after' } });
  await runTurn(ctx, tripId, {
    messages: [...c.messages, question],
    before: c.messages,
    unsent: trimmed,
    open: (signal) =>
      hostedOpen(ctx, tripId, (renders) =>
        assistantRepo.send(assistantTargetOf(tripId), { ...body, ...renders }, signal)
      ),
  });
}

async function attachFile(ctx: Ctx, tripId: number, file: File): Promise<void> {
  const c = chat(ctx, tripId);
  // Files are read into a trip; a journey's chat has no route for them.
  if (c.isRunning || assistantScopeOf(tripId).kind !== 'trip') return;
  const question: AssistantMessage = {
    id: `local-${randomId()}`,
    role: 'user',
    parts: [{ type: 'attachment', name: file.name, mime: file.type || 'application/octet-stream', size: file.size }],
    status: 'complete',
    createdAt: new Date().toISOString(),
  };
  const fields = { ...clientContext(), threadId: c.threadId };
  await runTurn(ctx, tripId, {
    messages: [...c.messages, question],
    before: c.messages,
    unsent: null,
    open: (signal) => assistantRepo.attach(tripId, file, fields, signal),
  });
}

/** Mentions the server takes at most per message. */
const MAX_MENTIONS = 10;
const MAX_MENTION_LABEL = 120;

/**
 * The mentions a question carries: those whose `@label` is still in its text
 * (the text is the truth; deleting the words drops the mention), without the
 * day or places the focus already names.
 */
function sentMentions(
  mentions: readonly AssistantMentionItem[],
  text: string,
  focus: AssistantFocus | null
): AssistantMentionItem[] {
  return mentions
    .filter((m) => text.includes(`@${m.label}`))
    .filter((m) => !(m.kind === 'day' && focus?.dayId === m.id))
    .filter((m) => !(m.kind === 'place' && focus?.placeIds?.includes(m.id)))
    .slice(0, MAX_MENTIONS)
    .map((m) => ({ kind: m.kind, id: m.id, label: m.label.slice(0, MAX_MENTION_LABEL) }));
}

/** The text of the latest question in the chat. */
function lastQuestion(messages: readonly AssistantMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role !== 'user') continue;
    const part = m.parts.find((p) => p.type === 'text');
    return part?.type === 'text' ? part.text : null;
  }
  return null;
}

/** Every trip's comparison back on "after". */
function backToAfter(byTrip: Record<number, AssistantTripChat>): Record<number, AssistantTripChat> {
  const next: Record<number, AssistantTripChat> = {};
  for (const [id, c] of Object.entries(byTrip)) {
    next[Number(id)] = c.compare ? { ...c, compare: { ...c.compare, mode: 'after' } } : c;
  }
  return next;
}

function shellActions(ctx: Ctx) {
  return {
    loadStatus: async () => {
      try {
        ctx.set({ status: await aiConnectionsRepo.status() });
      } catch (err) {
        // Offline keeps the last answer; any other failure hides the assistant (fail closed).
        if (!(err instanceof OnlineOnlyError)) ctx.set({ status: null });
      }
    },
    ackPrivacy: async () => {
      const effective = ctx.get().status?.effective;
      if (!effective) return;
      await aiConnectionsRepo.ackPrivacy({ kind: effective.kind, host: effective.host });
      const status = ctx.get().status;
      if (status) ctx.set({ status: { ...status, privacyAcked: true } });
    },
    ackStudioImages: async () => {
      const effective = ctx.get().status?.effective;
      if (!effective) return;
      await aiConnectionsRepo.ackPrivacy({ kind: effective.kind, host: effective.host, scope: 'studio_images' });
      const status = ctx.get().status;
      if (status) ctx.set({ status: { ...status, studioImagesAcked: true } });
    },
    hostStudio: (key: AssistantChatKey, host: AssistantStudioHost) => {
      ctx.set((s) => ({ studioHosts: { ...s.studioHosts, [key]: host } }));
      return () => {
        if (ctx.get().studioHosts[key] !== host) return;
        ctx.set((s) => ({
          studioHosts: Object.fromEntries(Object.entries(s.studioHosts).filter(([k]) => Number(k) !== key)),
        }));
      };
    },
    holdDecisions: (key: AssistantChatKey, settle: AssistantDecisionHold) => {
      ctx.set((s) => ({ decisionHolds: { ...s.decisionHolds, [key]: [...(s.decisionHolds[key] ?? []), settle] } }));
      return () =>
        ctx.set((s) => ({
          decisionHolds: { ...s.decisionHolds, [key]: (s.decisionHolds[key] ?? []).filter((held) => held !== settle) },
        }));
    },
    open: () => ctx.set({ window: { open: true, minimized: false } }),
    // Closing leaves the map as the plan is now: "after", nothing hovered, no preview pin.
    close: () =>
      ctx.set((s) => ({
        window: { open: false, minimized: false },
        mapLink: null,
        preview: null,
        ...NO_ROUTE,
        byTrip: backToAfter(s.byTrip),
      })),
    // Closed or minimized opens it; open closes it.
    toggle: () => ctx.set((s) => ({ window: { open: !s.window.open || s.window.minimized, minimized: false } })),
    setMinimized: (minimized: boolean) => ctx.set((s) => ({ window: { ...s.window, minimized } })),
    openWith: (tripId: number, focus: AssistantFocus | null) => {
      patch(ctx, tripId, { focus });
      ctx.set({ window: { open: true, minimized: false } });
    },
    setFocus: (tripId: number, focus: AssistantFocus | null) => patch(ctx, tripId, { focus }),
    setDraft: (tripId: number, draft: string) => patch(ctx, tripId, { draft }),
  };
}

function threadActions(ctx: Ctx) {
  const loadThreads = async (tripId: number) => {
    try {
      patch(ctx, tripId, { threads: await assistantRepo.threads(assistantTargetOf(tripId)) });
    } catch (err) {
      patch(ctx, tripId, { error: errorCodeOf(err) });
    }
  };

  const openThread = async (tripId: number, threadId: number) => {
    if (chat(ctx, tripId).isRunning) return;
    ctx.set(NO_ROUTE);
    patch(ctx, tripId, { threadId, loading: true, error: null, unsent: null });
    try {
      const { messages } = await assistantRepo.thread(assistantTargetOf(tripId), threadId);
      // Another thread may have been opened while this one loaded.
      if (chat(ctx, tripId).threadId === threadId) patch(ctx, tripId, { messages, loading: false });
    } catch (err) {
      if (httpStatus(err) !== 404) {
        patch(ctx, tripId, { loading: false, error: errorCodeOf(err) });
        return;
      }
      // Deleted elsewhere: start fresh and forget it.
      const threads = chat(ctx, tripId).threads;
      patch(ctx, tripId, {
        threadId: null,
        messages: [],
        loading: false,
        threads: threads ? threads.filter((t) => t.id !== threadId) : null,
      });
    }
  };

  const newThread = (tripId: number) => {
    chat(ctx, tripId).abort?.abort();
    ctx.set(NO_ROUTE);
    // The block a comparison belonged to leaves the screen with its thread.
    patch(ctx, tripId, {
      threadId: null,
      messages: [],
      isRunning: false,
      error: null,
      unsent: null,
      abort: null,
      live: NO_LIVE,
      compare: null,
    });
  };

  return {
    loadThreads,
    openThread,
    newThread,
    resume: async (tripId: number) => {
      await loadThreads(tripId);
      const c = chat(ctx, tripId);
      const latest = c.threads?.[0];
      if (latest && c.threadId === null && c.messages.length === 0 && !c.isRunning) await openThread(tripId, latest.id);
    },
    deleteThread: async (tripId: number, threadId: number) => {
      await assistantRepo.deleteThread(assistantTargetOf(tripId), threadId);
      const c = chat(ctx, tripId);
      patch(ctx, tripId, { threads: c.threads ? c.threads.filter((t) => t.id !== threadId) : null });
      if (c.threadId === threadId) newThread(tripId);
    },
  };
}

async function undoOne(ctx: Ctx, tripId: number, toolCallId: string): Promise<UndoOutcome> {
  let outcome: UndoOutcome;
  try {
    await assistantRepo.undo(assistantTargetOf(tripId), toolCallId);
    outcome = 'undone';
  } catch (err) {
    const status = httpStatus(err);
    // Changed since, or the window closed: the button goes, the change stays.
    outcome = status === 409 || status === 410 ? 'stale' : 'failed';
  }
  if (outcome === 'failed') return outcome;
  const c = chat(ctx, tripId);
  patch(ctx, tripId, {
    messages: closeUndo(c.messages, toolCallId),
    ...(outcome === 'undone' ? { undone: { ...c.undone, [toolCallId]: true as const } } : {}),
  });
  return outcome;
}

/**
 * The comparison a decision sets up: the plan of every day the applied
 * changes touch, taken from the trip store just before they run. Only while
 * the planner holds this very trip, since the store holds one trip at a time.
 */
function compareFor(
  tripId: number,
  messages: readonly AssistantMessage[],
  decisions: readonly AssistantDecision[]
): AssistantCompare | null {
  const trip = useTripStore.getState();
  if (trip.trip?.id !== tripId) return null;
  const effects = changeEffects(messages);
  const applied = decisions.filter((d) => d.approved).map((d) => d.toolCallId);
  const touched = applied.flatMap((id) => {
    const effect = effects.get(id);
    return effect ? [effect] : [];
  });
  if (touched.length === 0) return null;
  return {
    blockKey: blockKeyOf(decisions.map((d) => d.toolCallId)),
    mode: 'after',
    snapshot: snapshotDays(trip.assignments, blockDays(touched)),
    newPlaceCalls: applied.filter((id) => effects.get(id)?.place != null),
    addedPlaceIds: [],
  };
}

function compareActions(ctx: Ctx) {
  return {
    undoBlock: async (tripId: number, toolCallIds: readonly string[]): Promise<UndoBlockResult> => {
      const result: UndoBlockResult = { done: 0, stale: 0, failed: 0 };
      // One after the other and the last first: a later change may stand on an
      // earlier one (a stop moved onto a day the block had just added it to).
      // A refusal stops the run, so no earlier change falls while a later one
      // that stands on it is still in place.
      for (const toolCallId of [...toolCallIds].reverse()) {
        const outcome = await undoOne(ctx, tripId, toolCallId);
        if (outcome === 'undone') result.done += 1;
        else if (outcome === 'stale') result.stale += 1;
        else {
          result.failed += 1;
          break;
        }
      }
      // The before/after switch stays while any of the block is still applied.
      if (result.failed === 0 && result.stale === 0) patch(ctx, tripId, { compare: null });
      return result;
    },
    setCompare: (tripId: number, mode: 'before' | 'after') => {
      const compare = chat(ctx, tripId).compare;
      if (!compare || compare.mode === mode) return;
      patch(ctx, tripId, { compare: { ...compare, mode } });
      // Switching is asking to see it: frame the block's days on both sides.
      const days = Object.keys(compare.snapshot).map(Number);
      const points = [...dayPoints(compare.snapshot, days), ...dayPoints(useTripStore.getState().assignments, days)];
      requestCameraOn(ctx, tripId, points, 'fit', 'user');
    },
    addFoundPlace: async (tripId: number, ref: string, dayId: number) => {
      await holdWithoutTurn(ctx, tripId, (threadId) =>
        assistantRepo.addFoundPlace(tripId, threadId, { ...clientContext(), ref, dayId })
      );
    },
    takeProposal: (tripId: number, toolCallId: string) =>
      holdWithoutTurn(ctx, tripId, (threadId) =>
        assistantRepo.takeProposal(tripId, threadId, { ...clientContext(), toolCallId })
      ),
    insertFoundPlace: (tripId: number, ref: string, tourId: number) =>
      holdWithoutTurn(ctx, tripId, (threadId) =>
        assistantRepo.insertFoundPlace(tripId, threadId, { ...clientContext(), ref, tourId })
      ),
  };
}

/**
 * A change the server holds without a model turn (a found place for a day, a
 * proposal a card showed), joined to the answer it belongs to. The server
 * sends back that whole answer under its id, so it replaces the message the
 * chat already holds.
 */
async function holdWithoutTurn(
  ctx: Ctx,
  tripId: number,
  hold: (threadId: number) => Promise<{ message: AssistantMessage }>
): Promise<HoldOutcome> {
  const threadId = chat(ctx, tripId).threadId;
  // Found places and proposals are held for a trip's days; a journey's chat has neither.
  if (assistantScopeOf(tripId).kind !== 'trip') return 'skipped';
  if (chat(ctx, tripId).isRunning || threadId === null) return 'skipped';
  try {
    const { message } = await hold(threadId);
    const c = chat(ctx, tripId);
    // The thread may have changed while the server answered.
    if (c.threadId !== threadId) return 'skipped';
    const known = c.messages.some((m) => m.id === message.id);
    const messages = known ? c.messages.map((m) => (m.id === message.id ? message : m)) : [...c.messages, message];
    patch(ctx, tripId, { messages, error: null });
    return 'held';
  } catch (err) {
    patch(ctx, tripId, { error: errorCodeOf(err) });
    return 'refused';
  }
}

function requestCameraOn(ctx: Ctx, tripId: number, points: LatLng[], mode: 'fit' | 'pan', why: 'user' | 'auto') {
  if (points.length === 0) return;
  const seq = (ctx.get().camera?.seq ?? 0) + 1;
  ctx.set({ camera: { tripId, seq, points, mode, why, at: Date.now() } });
}

function mapActions(ctx: Ctx) {
  return {
    addMention: (tripId: number, mention: AssistantMentionItem) => {
      const mentions = chat(ctx, tripId).mentions;
      if (mentions.some((m) => m.kind === mention.kind && m.id === mention.id)) return;
      patch(ctx, tripId, { mentions: [...mentions, mention] });
    },
    setMapHover: (tripId: number, hoveredId: string | null, source: AssistantMapSource) => {
      const link = ctx.get().mapLink;
      // Pointer moves repeat the same hover; only a change reaches the subscribers.
      if (link?.tripId === tripId && link.hoveredId === hoveredId && link.source === source) return;
      ctx.set({ mapLink: { tripId, hoveredId, source } });
    },
    requestCamera: (tripId: number, points: LatLng[], mode: 'fit' | 'pan', why: 'user' | 'auto') =>
      requestCameraOn(ctx, tripId, points, mode, why),
    openPlaceDraft: (tripId: number, place: AssistantFoundPlace, dayId: number | null) =>
      ctx.set({ placeDraft: { tripId, seq: (ctx.get().placeDraft?.seq ?? 0) + 1, place, dayId } }),
    takePlaceDraft: (seq: number) => {
      if (ctx.get().placeDraft?.seq === seq) ctx.set({ placeDraft: null });
    },
    setPreviewPin: (preview: AssistantState['preview']) => ctx.set({ preview }),
    setWindowRect: (rect: WindowRect | null) => ctx.set({ windowRect: rect }),
    setMapView: (mapView: AssistantState['mapView']) => ctx.set({ mapView }),
  };
}

/** Whether two route focuses point at the same spot of the same route from the same side. */
function sameFocus(a: AssistantState['routeFocus'], b: AssistantState['routeFocus']): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.tripId === b.tripId &&
    a.ref === b.ref &&
    a.source === b.source &&
    a.focus.sampleIndex === b.focus.sampleIndex &&
    a.focus.distanceMeters === b.focus.distanceMeters
  );
}

function routeActions(ctx: Ctx) {
  return {
    // Scrubbing repeats the same spot; only a change reaches the subscribers.
    setRouteFocus: (routeFocus: AssistantState['routeFocus']) => {
      if (!sameFocus(ctx.get().routeFocus, routeFocus)) ctx.set({ routeFocus });
    },
    setRoutePreview: (routePreview: AssistantState['routePreview']) => {
      const current = ctx.get().routePreview;
      if (current?.tripId === routePreview?.tripId && current?.ref === routePreview?.ref) return;
      ctx.set({ routePreview });
    },
    setRoutePeek: (routePeek: AssistantState['routePeek']) => ctx.set({ routePeek }),
    pick: (tripId: number, blockKey: string, toolCallId: string) =>
      patch(ctx, tripId, { picks: { ...chat(ctx, tripId).picks, [blockKey]: toolCallId } }),
  };
}

function turnActions(ctx: Ctx) {
  const retry = async (tripId: number) => {
    const c = chat(ctx, tripId);
    if (c.isRunning) return;
    if (c.unsent === null) {
      // The server has the question but the answer broke off: ask it again.
      const text = lastQuestion(c.messages);
      if (text) await sendMessage(ctx, tripId, text);
      return;
    }
    // The local copy of the refused question goes; sending puts it back.
    const last = c.messages[c.messages.length - 1];
    const refused = last?.role === 'user' && last.id.startsWith('local-');
    patch(ctx, tripId, { messages: refused ? c.messages.slice(0, -1) : c.messages, unsent: null, error: null });
    await sendMessage(ctx, tripId, c.unsent);
  };

  return {
    send: (tripId: number, text: string) => sendMessage(ctx, tripId, text),
    attach: (tripId: number, file: File) => attachFile(ctx, tripId, file),
    decide: async (tripId: number, decisions: AssistantDecision[]) => {
      const c = chat(ctx, tripId);
      const threadId = c.threadId;
      if (c.isRunning || threadId === null || decisions.length === 0) return;
      // Asked before anything re-renders: a card's choice still on its way lands first, so the decision reads it.
      const settled = settleHolds(ctx, tripId);
      const body = { ...clientContext(), decisions };
      patch(ctx, tripId, { compare: compareFor(tripId, c.messages, decisions) });
      await runTurn(ctx, tripId, {
        messages: markDecisions(c.messages, decisions),
        before: c.messages,
        unsent: null,
        open: async (signal) => {
          await settled;
          return hostedOpen(ctx, tripId, (renders) =>
            assistantRepo.decide(assistantTargetOf(tripId), threadId, { ...body, ...renders }, signal)
          );
        },
      });
      // Refused before anything ran: there is no "after" to compare with.
      if (chat(ctx, tripId).error) patch(ctx, tripId, { compare: null });
    },
    undo: (tripId: number, toolCallId: string) => undoOne(ctx, tripId, toolCallId),
    cancel: (tripId: number) => chat(ctx, tripId).abort?.abort(),
    retry,
    continueHere: async (tripId: number) => {
      try {
        await assistantRepo.stop(assistantTargetOf(tripId));
      } catch (err) {
        patch(ctx, tripId, { error: errorCodeOf(err) });
        return;
      }
      await retry(tripId);
    },
    dismissError: (tripId: number) => patch(ctx, tripId, { error: null }),
  };
}

export const useAssistantStore = create<AssistantState>((set, get) => {
  const ctx: Ctx = { set, get };
  return {
    status: null,
    window: { open: false, minimized: false },
    byTrip: {},
    lastApplied: null,
    mapLink: null,
    camera: null,
    preview: null,
    placeDraft: null,
    windowRect: null,
    mapView: null,
    studioHosts: {},
    decisionHolds: {},
    ...NO_ROUTE,
    ...shellActions(ctx),
    ...threadActions(ctx),
    ...turnActions(ctx),
    ...compareActions(ctx),
    ...mapActions(ctx),
    ...routeActions(ctx),
  };
});
