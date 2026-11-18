import type {
  TravelPlanCreateRequest,
  TravelPlanDraft,
  TravelPlanPace,
  TravelPlanRequest,
  TravelPlanTransport,
} from '@trek/shared';

/**
 * The traveller's editable brief. Everything is a string because that is what
 * the form fields hold; `briefToCreateRequest` is the one place that turns it
 * into the numbered, trimmed contract the server accepts.
 */
export interface TravelBrief {
  prompt: string;
  destination: string;
  origin: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  seniors: number;
  budgetCny: string;
  pace: TravelPlanPace;
  transport: TravelPlanTransport;
  /** Comma-separated in the form; split into the request's array. */
  interests: string;
  /** Comma-separated, same as interests. */
  constraints: string;
}

export const PACE_OPTIONS: readonly TravelPlanPace[] = ['relaxed', 'balanced', 'intensive'];

export const TRANSPORT_OPTIONS: readonly TravelPlanTransport[] = ['public_transit', 'driving', 'walking', 'mixed'];

export function emptyBrief(): TravelBrief {
  return {
    prompt: '',
    destination: '',
    origin: '',
    startDate: '',
    endDate: '',
    adults: 1,
    children: 0,
    seniors: 0,
    budgetCny: '',
    pace: 'balanced',
    transport: 'public_transit',
    interests: '',
    constraints: '',
  };
}

/** Puts the brief behind an existing plan back in the form, so it can be changed and regenerated. */
export function briefFromRequest(request: TravelPlanRequest): TravelBrief {
  return {
    prompt: request.prompt ?? '',
    destination: request.destination ?? '',
    origin: request.origin ?? '',
    startDate: request.startDate ?? '',
    endDate: request.endDate ?? '',
    adults: request.travelers.adults,
    children: request.travelers.children,
    seniors: request.travelers.seniors,
    budgetCny: request.budgetCny === undefined ? '' : String(request.budgetCny),
    pace: request.pace,
    transport: request.transport,
    interests: request.interests.join(', '),
    constraints: request.constraints.join(', '),
  };
}

/** Splits a comma-separated field into trimmed non-empty entries. */
export function splitList(value: string): string[] {
  return value
    .split(/[,，]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function briefToCreateRequest(brief: TravelBrief): TravelPlanCreateRequest {
  const request: TravelPlanCreateRequest = {
    travelers: {
      adults: brief.adults,
      children: brief.children,
      seniors: brief.seniors,
    },
    pace: brief.pace,
    transport: brief.transport,
    interests: splitList(brief.interests).slice(0, 20),
    constraints: splitList(brief.constraints).slice(0, 20),
  };
  const prompt = brief.prompt.trim();
  if (prompt) request.prompt = prompt;
  const destination = brief.destination.trim();
  if (destination) request.destination = destination;
  const origin = brief.origin.trim();
  if (origin) request.origin = origin;
  if (brief.startDate) request.startDate = brief.startDate;
  if (brief.endDate) request.endDate = brief.endDate;
  if (brief.budgetCny.trim() !== '') request.budgetCny = Number(brief.budgetCny);
  return request;
}

/** How many days the brief covers when both dates are set; null when it cannot be known yet. */
export function briefDayCount(brief: TravelBrief): number | null {
  if (!brief.startDate || !brief.endDate) return null;
  const start = Date.parse(`${brief.startDate}T00:00:00Z`);
  const end = Date.parse(`${brief.endDate}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.round((end - start) / 86_400_000) + 1;
}

export function countDraftPlaces(draft: TravelPlanDraft | null): number {
  return draft ? draft.days.reduce((total, day) => total + day.items.length, 0) : 0;
}

export type Translate = (key: string, params?: Record<string, string | number>) => string;

/** The brief's own guardrails, checked before a request is sent so the form can say what is wrong. */
export function validateBrief(brief: TravelBrief, t: Translate): string | null {
  if (!brief.prompt.trim() && !brief.destination.trim()) return t('planner.ai.promptRequired');
  const days = briefDayCount(brief);
  if (days !== null && days < 1) return t('planner.ai.dateRangeInvalid');
  if (days !== null && days > 14) return t('planner.ai.dateRangeTooLong');
  if (brief.budgetCny.trim() !== '') {
    const budget = Number(brief.budgetCny);
    if (!Number.isFinite(budget) || budget < 0 || budget > 1_000_000) return t('planner.ai.budgetInvalid');
  }
  if (brief.adults + brief.children + brief.seniors < 1) return t('planner.ai.travelersInvalid');
  return null;
}
