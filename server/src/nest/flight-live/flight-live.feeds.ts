import { readCappedJson } from '../../utils/cappedFetch';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { logWarn } from '../audit/audit-log.logger';
import { FeedBudget } from './flight-live.budget';
import type { FeedAircraft } from './flight-live.derive';
import { Injectable } from '@nestjs/common';
import type { FlightLiveSource } from '@trek/shared';

import { z } from 'zod';

/**
 * The two keyless ADS-B feeds TREK reads live flights from. adsb.lol first;
 * adsb.fi only when this is not a managed install, because adsb.fi's terms
 * rule out commercial use. Only the callsign goes out, never a user, a trip
 * or a route. Both answer the readsb "v2" shape.
 */

const FEED_TIMEOUT_MS = 8000;
/** A callsign's answer is one or two aircraft, a few hundred bytes each. */
const MAX_FEED_BYTES = 256 * 1024;
/** Failures in a row before a source is paused like a 429. */
const FAILURES_BEFORE_PAUSE = 3;

export const FEED_ATTRIBUTION: Record<FlightLiveSource, string> = {
  'adsb.lol': 'Live positions: adsb.lol (ODbL)',
  'adsb.fi': 'Live positions: adsb.fi',
};

const FEED_URL: Record<FlightLiveSource, (callsign: string) => string> = {
  'adsb.lol': (callsign) => `https://api.adsb.lol/v2/callsign/${callsign}`,
  'adsb.fi': (callsign) => `https://opendata.adsb.fi/api/v2/callsign/${callsign}`,
};

const num = z.number().nullish();
const str = z.string().nullish();

/** The fields of one aircraft TREK reads; everything else in the answer is dropped. */
const aircraftSchema = z.object({
  hex: z.string(),
  flight: str,
  r: str,
  t: str,
  alt_baro: z.union([z.number(), z.literal('ground')]).nullish(),
  alt_geom: num,
  gs: num,
  track: num,
  baro_rate: num,
  geom_rate: num,
  lat: num,
  lon: num,
  seen: num,
  seen_pos: num,
});

const feedAnswerSchema = z.object({
  ac: z.array(aircraftSchema).max(50).nullish(),
  now: z.number(),
});

const CALLSIGN_RE = /^[A-Z0-9]{3,8}$/;

export type FeedLookup =
  | { ok: true; source: FlightLiveSource; now: number; aircraft: FeedAircraft[] }
  | { ok: false; reason: 'budget' | 'unavailable' };

type SourceAnswer =
  { ok: true; now: number; aircraft: FeedAircraft[] } | { ok: false; status: number | null; reason: string };

function toAircraft(ac: z.infer<typeof aircraftSchema>): FeedAircraft {
  return {
    hex: ac.hex,
    flight: ac.flight?.trim() || null,
    registration: ac.r?.trim() || null,
    type: ac.t?.trim() || null,
    alt_baro: ac.alt_baro ?? null,
    alt_geom: ac.alt_geom ?? null,
    gs: ac.gs ?? null,
    track: ac.track ?? null,
    baro_rate: ac.baro_rate ?? null,
    geom_rate: ac.geom_rate ?? null,
    lat: ac.lat ?? null,
    lon: ac.lon ?? null,
    seen: ac.seen ?? null,
    seen_pos: ac.seen_pos ?? null,
  };
}

@Injectable()
export class FlightLiveFeedService {
  private readonly budget = new FeedBudget();
  private readonly failures = new Map<FlightLiveSource, number>();
  /** Waits out the spacing before a fallback request; a test hands in one that does not. */
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  constructor(private readonly env: RuntimeEnvService) {}

  /** The sources this install may ask, in order. */
  sources(): FlightLiveSource[] {
    return this.env.isManaged() ? ['adsb.lol'] : ['adsb.lol', 'adsb.fi'];
  }

  /** The credit line of the first source this install asks. */
  attribution(): string {
    return FEED_ATTRIBUTION[this.sources()[0]];
  }

  /** Whether one more request fits in the budget right now. */
  canAsk(now: number = Date.now()): boolean {
    return this.budget.waitMs(now) === 0 && !this.budget.exhausted(now);
  }

  /** How long until the spacing lets the next request go. */
  waitMs(now: number = Date.now()): number {
    return this.budget.waitMs(now);
  }

  /**
   * The aircraft flying under a callsign, from the first source that answers.
   * Each request spends the budget; a source that answered 429, or failed
   * three times in a row, is paused for a quarter of an hour.
   */
  async lookup(callsign: string, now: () => number = Date.now): Promise<FeedLookup> {
    if (!CALLSIGN_RE.test(callsign)) return { ok: false, reason: 'unavailable' };
    return await this.lookupFrom(this.sources(), callsign, now, false);
  }

  /** The first of the sources that answers, one after the other; `asked` says whether one was asked already. */
  private async lookupFrom(
    sources: readonly FlightLiveSource[],
    callsign: string,
    now: () => number,
    asked: boolean,
  ): Promise<FeedLookup> {
    const [source, ...rest] = sources;
    if (source === undefined) return { ok: false, reason: asked ? 'unavailable' : 'budget' };
    if (this.budget.isPaused(source, now())) return await this.lookupFrom(rest, callsign, now, asked);
    const wait = this.budget.waitMs(now());
    if (wait > 0) await this.sleep(wait);
    if (!this.budget.tryTake(now())) return { ok: false, reason: asked ? 'unavailable' : 'budget' };
    const answer = await this.ask(source, callsign);
    if (answer.ok) {
      this.failures.set(source, 0);
      return { ok: true, source, now: answer.now, aircraft: answer.aircraft };
    }
    // Spelled out: the server builds without strictNullChecks, where `ok` alone does not narrow the union.
    const failure = answer as Extract<SourceAnswer, { ok: false }>;
    const count = (this.failures.get(source) ?? 0) + 1;
    this.failures.set(source, count);
    if (failure.status === 429 || count >= FAILURES_BEFORE_PAUSE) {
      this.budget.pause(source, now());
      this.failures.set(source, 0);
    }
    logWarn(`[flight-live] ${source} for ${callsign}: ${failure.reason}`);
    return await this.lookupFrom(rest, callsign, now, true);
  }

  private async ask(source: FlightLiveSource, callsign: string): Promise<SourceAnswer> {
    let response: Response;
    try {
      response = await fetch(FEED_URL[source](encodeURIComponent(callsign)), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
      });
    } catch (err) {
      return { ok: false, status: null, reason: err instanceof Error ? err.message : String(err) };
    }
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      return { ok: false, status: response.status, reason: `HTTP ${response.status}` };
    }
    let body: unknown;
    try {
      body = await readCappedJson<unknown>(response, MAX_FEED_BYTES);
    } catch (err) {
      return { ok: false, status: null, reason: err instanceof Error ? err.message : String(err) };
    }
    if (body === undefined) return { ok: false, status: null, reason: 'unreadable or oversized answer' };
    const parsed = feedAnswerSchema.safeParse(body);
    if (!parsed.success) return { ok: false, status: null, reason: 'unexpected answer shape' };
    const wanted = callsign.toUpperCase();
    const aircraft = (parsed.data.ac ?? [])
      .map(toAircraft)
      .filter((ac) => ac.flight === null || ac.flight.toUpperCase() === wanted);
    return { ok: true, now: parsed.data.now, aircraft };
  }
}
