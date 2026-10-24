import type { ThreadMessageLike } from '@assistant-ui/react';
import type { AiStatusResponse, AssistantErrorCode, AssistantMessage, AssistantMessagePart } from '@trek/shared';

import { STEP_LOOKS } from './cards/cardLooks';

/**
 * Pure helpers the assistant's views share, desktop window and phone screen
 * alike: the bridge from stored messages to @assistant-ui, what an error says
 * and offers, how a reading tool is named while it runs (the steps live in
 * the cards' look), and which questions the empty chat suggests. No React,
 * and only a type from @assistant-ui, so importing this keeps the chat
 * runtime out of the chunk.
 */

type LikePart = Exclude<ThreadMessageLike['content'], string>[number];

const STATUS: Partial<Record<AssistantMessage['status'], ThreadMessageLike['status']>> = {
  aborted: { type: 'incomplete', reason: 'cancelled' },
  error: { type: 'incomplete', reason: 'error' },
};

function toPart(part: AssistantMessagePart): LikePart | null {
  if (part.type === 'text') return part.text ? { type: 'text', text: part.text } : null;
  // An attached file is drawn from the stored message; the runtime takes it as one more data part.
  if (part.type === 'attachment') {
    return { type: 'data-trek-attachment', data: { name: part.name, mime: part.mime, size: part.size } };
  }
  if (part.type !== 'tool-call') return part;
  return {
    type: 'tool-call',
    toolCallId: part.toolCallId,
    toolName: part.toolName,
    args: part.args,
    ...(part.result !== undefined ? { result: part.result } : {}),
    ...(part.isError !== undefined ? { isError: part.isError } : {}),
    ...(part.approval ? { approval: part.approval } : {}),
  } as LikePart;
}

/**
 * A stored message as @assistant-ui reads it (the external store runtime's
 * `convertMessage`). Complete and waiting messages carry no status, so the
 * runtime derives it: running while the turn streams, waiting while a change
 * is undecided.
 */
export function toThreadMessage(message: AssistantMessage): ThreadMessageLike {
  const status = STATUS[message.status];
  return {
    id: message.id,
    role: message.role,
    createdAt: new Date(message.createdAt),
    content: message.parts.map(toPart).filter((p): p is LikePart => p !== null),
    ...(status ? { status } : {}),
  };
}

// ── Errors ──────────────────────────────────────────────────────────────────

/** What the one action under an error line does. */
export type AssistantErrorActionKind = 'retry' | 'continueHere' | 'continue' | 'openSettings' | 'openUsage';

interface AssistantErrorView {
  messageKey: string;
  action: { kind: AssistantErrorActionKind; labelKey: string } | null;
}

const ERRORS: Record<AssistantErrorCode, AssistantErrorView> = {
  not_connected: { messageKey: 'assistant.error.notConnected', action: null },
  busy: {
    messageKey: 'assistant.error.busy',
    action: { kind: 'continueHere', labelKey: 'assistant.errorAction.continueHere' },
  },
  daily_limit: {
    messageKey: 'assistant.error.dailyLimit',
    action: { kind: 'openSettings', labelKey: 'assistant.errorAction.connectOwn' },
  },
  rate_limited: { messageKey: 'assistant.error.rateLimited', action: null },
  needs_reauth: {
    messageKey: 'assistant.error.needsReauth',
    action: { kind: 'openSettings', labelKey: 'assistant.errorAction.signIn' },
  },
  usage_limit: {
    messageKey: 'assistant.error.usageLimit',
    action: { kind: 'openUsage', labelKey: 'assistant.errorAction.viewUsage' },
  },
  not_eligible: {
    messageKey: 'assistant.error.notEligible',
    action: { kind: 'openSettings', labelKey: 'assistant.errorAction.otherProvider' },
  },
  invalid_key: {
    messageKey: 'assistant.error.invalidKey',
    action: { kind: 'openSettings', labelKey: 'assistant.errorAction.replaceKey' },
  },
  provider_unavailable: {
    messageKey: 'assistant.error.providerDown',
    action: { kind: 'retry', labelKey: 'assistant.errorAction.retry' },
  },
  max_steps: {
    messageKey: 'assistant.error.maxSteps',
    action: { kind: 'continue', labelKey: 'assistant.errorAction.continue' },
  },
  empty_answer: {
    messageKey: 'assistant.error.emptyAnswer',
    action: { kind: 'continue', labelKey: 'assistant.errorAction.continue' },
  },
  offline: { messageKey: 'assistant.error.offline', action: null },
  decide_first: { messageKey: 'assistant.error.decideFirst', action: null },
  too_many_requests: { messageKey: 'assistant.error.rateLimited', action: null },
  no_bookings_found: { messageKey: 'assistant.error.noBookingsFound', action: null },
  no_tracks_found: { messageKey: 'assistant.error.noTracksFound', action: null },
  import_unavailable: { messageKey: 'assistant.error.importUnavailable', action: null },
  generic: {
    messageKey: 'assistant.error.generic',
    action: { kind: 'retry', labelKey: 'assistant.errorAction.retry' },
  },
};

/** The limits a provider sets; the line names the provider instead of guessing at its plan. */
const PROVIDER_LIMITS: ReadonlySet<AssistantErrorCode> = new Set(['rate_limited', 'usage_limit']);

/**
 * The line an error shows and its one action. The daily limit only offers
 * connecting an own provider where the policy allows one. A provider's limit
 * says whose it is when the provider is known (`provider` is its name, empty
 * when not), and keeps the general line otherwise.
 */
export function errorView(
  code: AssistantErrorCode,
  opts: { canConnectOwn: boolean; provider?: string }
): AssistantErrorView {
  const view = ERRORS[code];
  if (code === 'daily_limit' && !opts.canConnectOwn) return { ...view, action: null };
  if (PROVIDER_LIMITS.has(code) && opts.provider) return { ...view, messageKey: 'assistant.error.providerLimit' };
  return view;
}

/**
 * The error the user's own connection shows before anything is sent, once it
 * stopped working: a sign-in to renew or a key to replace. The window says so
 * right away instead of waiting for the next question to fail.
 */
export function connectionErrorOf(status: AiStatusResponse | null): AssistantErrorCode | null {
  if (!status?.own || status.effective?.source !== 'user') return null;
  if (status.own.status === 'needs_reauth') return 'needs_reauth';
  if (status.own.status === 'error') return 'invalid_key';
  return null;
}

// ── Tool steps ──────────────────────────────────────────────────────────────

const WORKING = { stepKey: 'assistant.step.working' };

/** How a reading tool is named while it runs: "Reading your plan", never the tool's name. */
export function toolStepKey(toolName: string): string {
  return STEP_LOOKS[toolName]?.stepKey ?? WORKING.stepKey;
}

/**
 * How a running step is named once it said where it looks: "Searching near
 * Trastevere", "Looking for gelato". The general name when it named nothing
 * or the step has no such line.
 */
export function liveStepText(toolName: string, label: string | null): { key: string; params?: Record<string, string> } {
  const live = STEP_LOOKS[toolName]?.live;
  if (!live || !label) return { key: toolStepKey(toolName) };
  return { key: live.liveKey, params: { [live.param]: label } };
}

// ── Weather ─────────────────────────────────────────────────────────────────

/** A temperature the server sends in °C, in the user's unit, rounded; never "-0". */
export function inUnit(celsius: number, fahrenheit: boolean): number {
  return Math.round(fahrenheit ? (celsius * 9) / 5 + 32 : celsius) || 0;
}

// ── Suggestions ─────────────────────────────────────────────────────────────

type TripPhase = 'empty' | 'upcoming' | 'running' | 'past';

/** Where the trip stands on `today` (YYYY-MM-DD, in the user's zone). Dates missing read as not started. */
export function tripPhase(trip: {
  startDate: string | null;
  endDate: string | null;
  hasPlaces: boolean;
  today: string;
}): TripPhase {
  const { startDate, endDate, today } = trip;
  if (endDate && endDate < today) return 'past';
  if (startDate && startDate <= today && (!endDate || today <= endDate)) return 'running';
  return trip.hasPlaces ? 'upcoming' : 'empty';
}

interface AssistantSuggestion {
  id: string;
  labelKey: string;
  params?: Record<string, string>;
  /** Asks the assistant to change the trip, so it is left out for someone who may only read. */
  writes?: boolean;
}

const PHASE_SUGGESTIONS: Record<TripPhase, AssistantSuggestion[]> = {
  empty: [
    { id: 'planFirstDays', labelKey: 'assistant.suggest.planFirstDays', writes: true },
    { id: 'mustSee', labelKey: 'assistant.suggest.mustSee' },
    { id: 'packingList', labelKey: 'assistant.suggest.packingList', writes: true },
    { id: 'weather', labelKey: 'assistant.suggest.weather' },
  ],
  upcoming: [
    { id: 'emptyDays', labelKey: 'assistant.suggest.emptyDays' },
    { id: 'packingList', labelKey: 'assistant.suggest.packingList', writes: true },
    { id: 'rainPlan', labelKey: 'assistant.suggest.rainPlan' },
    { id: 'weather', labelKey: 'assistant.suggest.weather' },
  ],
  running: [
    { id: 'today', labelKey: 'assistant.suggest.today' },
    { id: 'eatNearby', labelKey: 'assistant.suggest.eatNearby' },
    { id: 'weather', labelKey: 'assistant.suggest.weather' },
    { id: 'openTodos', labelKey: 'assistant.suggest.openTodos' },
  ],
  past: [
    { id: 'settleUp', labelKey: 'assistant.suggest.settleUp' },
    { id: 'recap', labelKey: 'assistant.suggest.recap' },
  ],
};

const MAX_SUGGESTIONS = 4;

/**
 * What the empty home chat offers, outside any one trip: questions across the
 * user's trips and about the parts of TREK that belong to none of them.
 */
export const HOME_SUGGESTIONS: readonly AssistantSuggestion[] = [
  { id: 'homeNext', labelKey: 'assistant.suggest.homeNext' },
  { id: 'homeCompare', labelKey: 'assistant.suggest.homeCompare' },
  { id: 'homeAtlas', labelKey: 'assistant.suggest.homeAtlas' },
  { id: 'homeVacay', labelKey: 'assistant.suggest.homeVacay' },
];

/**
 * The questions the empty chat offers: about the place or day in focus first,
 * then what fits the trip's phase. The label is also the prompt, so a tapped
 * suggestion reads in the chat exactly as it was offered.
 */
export function suggestionsFor(input: {
  phase: TripPhase;
  canEdit: boolean;
  /** The name of the place in focus. */
  place?: string | null;
  /** The label of the day in focus ("Fri 12 Jun"). */
  day?: string | null;
}): AssistantSuggestion[] {
  const focused: AssistantSuggestion[] = [];
  if (input.place) {
    focused.push(
      { id: 'nearPlace', labelKey: 'assistant.suggest.nearPlace', params: { place: input.place } },
      { id: 'placeTips', labelKey: 'assistant.suggest.placeTips', params: { place: input.place } }
    );
  }
  if (input.day) {
    focused.push(
      { id: 'planDay', labelKey: 'assistant.suggest.planDay', params: { day: input.day }, writes: true },
      { id: 'dayTooFull', labelKey: 'assistant.suggest.dayTooFull', params: { day: input.day } }
    );
  }
  const picked: AssistantSuggestion[] = [];
  for (const suggestion of [...focused, ...PHASE_SUGGESTIONS[input.phase]]) {
    if (suggestion.writes && !input.canEdit) continue;
    if (picked.some((p) => p.id === suggestion.id)) continue;
    picked.push(suggestion);
  }
  return picked.slice(0, MAX_SUGGESTIONS);
}
