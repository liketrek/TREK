/**
 * Amap's own routing, for a question that never leaves China.
 *
 * Why this exists: the TREK services' Valhalla is reached overseas, and from a
 * mainland network that leg is slow or refused outright (the deployment this was
 * written on answered 504), which leaves a Chinese trip with no drive times at
 * all. Amap's Web Service driving, walking and cycling endpoints answer from
 * inside the country, over the road network a Chinese user expects.
 *
 * The answer is rewritten into Valhalla's own shape — `trip.legs[].shape` as a
 * precision-6 polyline, `summary.length` in kilometres, `summary.time` in
 * seconds, `has_toll` / `has_highway` / `has_ferry` — so the planner's parser,
 * which knows nothing of this file, reads it unchanged.
 *
 * Datum: Amap speaks GCJ-02 on both sides of a request. Every coordinate goes
 * out through `toAmapLocation` and every vertex of a shape comes back through
 * `gcj02ToWgs84`; nothing downstream sees the shift.
 *
 * One route per pair of stops: Amap answers a chain with a single path and no
 * per-leg split, while the planner needs one summary per pair (a road trip day
 * builds its arrival times from them), so N points are asked as N-1 questions.
 */
import { readEnv } from '../../app-config';
import { discardBody, exceedsDeclaredLength, readCappedJson } from '../../utils/cappedFetch';
import { encodePolyline } from '../../utils/polyline';
import { safeFetchFollow } from '../../utils/ssrfGuard';
import { logWarn } from '../audit/audit-log.logger';
import { UA, amapUrl } from '../maps/maps.helpers.contract';
import { gcj02ToWgs84, toAmapLocation, type ValhallaCosting, type ValhallaRouteRequest } from '@trek/shared';

/** A direction answer is a few hundred steps; anything past this is not the endpoint we think it is. */
const MAX_RESPONSE_BYTES = 2_000_000;
/** One leg is a short question; a host that needs longer holds up the whole chain. */
const LEG_TIMEOUT_MS = 8_000;
/** A ceiling only: the pace below spaces the starts, so a few days at once stay in flight. */
const LEG_CONCURRENCY = 3;
/**
 * Amap's personal key answers about three questions a second, and the fourth in the
 * same second is refused with 10021. A whole chain is fifteen of them, so the starts
 * are spaced across the process: the key belongs to the installation, not to a day.
 */
const LEG_INTERVAL_MS = 350;
/** Waits before asking a 10021 leg again; a spent daily quota is not worth asking again. */
const RETRY_DELAYS_MS = [400, 800];
/** "CUQPS_HAS_EXCEEDED_THE_LIMIT": the key was asked too fast, rather than for too much. */
const TOO_FAST_INFOCODE = '10021';

/** When the next leg may start, shared by every route in this process (see LEG_INTERVAL_MS). */
let nextLegAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Waits for this leg's turn under the key's pace; false when the turn would outlast the question. */
async function paceLeg(deadline: number): Promise<boolean> {
  const at = Math.max(Date.now(), nextLegAt);
  nextLegAt = at + LEG_INTERVAL_MS;
  if (at >= deadline) return false;
  if (at > Date.now()) await sleep(at - Date.now());
  return Date.now() < deadline;
}

type AmapProfile = 'driving' | 'walking' | 'bicycling';

/** Which Amap endpoint answers a Valhalla costing. */
const PROFILE_OF: Record<ValhallaCosting, AmapProfile> = {
  auto: 'driving',
  pedestrian: 'walking',
  bicycle: 'bicycling',
};

/** What comes back for a whole chain: a Valhalla-shaped body, a way that does not exist, or a host that failed. */
export type AmapRouteAnswer = { kind: 'route'; body: unknown } | { kind: 'none' } | { kind: 'failed' };

// ── Amap's envelope ──────────────────────────────────────────────────────────

interface AmapStep {
  polyline?: unknown;
  road?: unknown;
  instruction?: unknown;
}

interface AmapPath {
  distance?: unknown;
  duration?: unknown;
  tolls?: unknown;
  steps?: AmapStep[];
}

/** The v3 envelope, which answers HTTP 200 for every failure and puts the verdict in `status`. */
interface AmapEnvelope {
  status?: string;
  info?: string;
  infocode?: string;
  route?: { paths?: AmapPath[] };
}

/** The v4 cycling envelope: `errcode` rather than `status`, and the paths one level down. */
interface AmapBicyclingEnvelope {
  errcode?: number;
  errmsg?: string;
  data?: { paths?: AmapPath[] };
}

/** Amap answers an empty *array* where a scalar has no value, so every optional field is coerced. */
function amapText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value) && value.length === 1) return amapText(value[0]);
  return '';
}

function amapNumber(value: unknown): number | null {
  const text = amapText(value);
  if (!text) return null;
  const n = Number.parseFloat(text);
  return Number.isFinite(n) ? n : null;
}

function asArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

// ── The question ─────────────────────────────────────────────────────────────

/** One leg as Amap described it, already in WGS-84 and in the planner's units. */
interface AmapLeg {
  coordinates: [number, number][];
  /** Metres. */
  distance: number;
  /** Seconds. */
  duration: number;
  tolls: number;
  hasHighway: boolean;
  hasFerry: boolean;
}

type LegOutcome = { kind: 'leg'; leg: AmapLeg } | { kind: 'none' } | { kind: 'failed' };
/** One attempt may also be refused for asking too fast, which is worth another try. */
type LegAttempt = LegOutcome | { kind: 'retry' };

/**
 * Amap's driving strategy for the weightings the planner sends.
 *
 * `use_tolls: 0` and `use_highways: 0` are Valhalla weightings; Amap only has
 * whole strategies, so the closest one is picked. Measured Shanghai → Suzhou:
 * strategy 1 answered 100.97 km with 0 tolls against 99.26 km and 35 元 for 0.
 */
function drivingStrategyFor(options: Record<string, number | string | boolean> | undefined): string {
  const noToll = options?.use_tolls === 0;
  const noHighway = options?.use_highways === 0;
  if (noToll && noHighway) return '7';
  if (noToll) return '1';
  if (noHighway) return '6';
  return '0';
}

/**
 * Ask Amap for the whole chain and hand back a Valhalla-shaped answer.
 *
 * `budgetMs` is what the relay was given for the question as a whole: once it
 * is spent the remaining legs are not asked, because an answer that arrives
 * after the planner gave up is no answer at all.
 */
export async function routeByAmap(
  body: ValhallaRouteRequest,
  apiKey: string,
  budgetMs: number,
): Promise<AmapRouteAnswer> {
  const profile = PROFILE_OF[body.costing];
  const strategy = profile === 'driving' ? drivingStrategyFor(body.costing_options?.auto) : undefined;
  const deadline = Date.now() + budgetMs;

  // Consecutive pairs, because one Amap answer is one leg's worth of summary.
  const pairs: { from: { lat: number; lon: number }; to: { lat: number; lon: number } }[] = [];
  for (let i = 1; i < body.locations.length; i++) {
    const from = body.locations[i - 1];
    const to = body.locations[i];
    if (!from || !to) return { kind: 'none' };
    pairs.push({ from, to });
  }

  const legs: AmapLeg[] = [];
  // Batches run one after another by recursion rather than a loop: the deadline is
  // shared, so they cannot go out all at once, and an await inside a loop is what
  // the lint forbids. A failed or unroutable pair ends the chain like it did before.
  const askBatch = async (start: number): Promise<AmapRouteAnswer | null> => {
    if (start >= pairs.length) return null;
    const batch = pairs
      .slice(start, start + LEG_CONCURRENCY)
      .map((pair) => askLeg(profile, pair.from, pair.to, strategy, apiKey, deadline));
    const outcomes = await Promise.all(batch);
    for (const outcome of outcomes) {
      if (outcome.kind === 'failed') return { kind: 'failed' };
      // One pair Amap cannot route is a question for the Valhalla behind this, not a failure.
      if (outcome.kind === 'none') return { kind: 'none' };
      legs.push(outcome.leg);
    }
    return askBatch(start + LEG_CONCURRENCY);
  };

  const stop = await askBatch(0);
  return stop ?? { kind: 'route', body: tripFrom(legs) };
}

async function askLeg(
  profile: AmapProfile,
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
  strategy: string | undefined,
  apiKey: string,
  deadline: number,
): Promise<LegOutcome> {
  // Retried by recursion rather than a loop, so the wait between tries is the plain kind.
  const askAgain = async (attempt: number): Promise<LegOutcome> => {
    if (!(await paceLeg(deadline))) return { kind: 'failed' };

    const outcome = await askLegOnce(profile, from, to, strategy, apiKey, deadline);
    if (outcome.kind !== 'retry') return outcome;

    const wait = RETRY_DELAYS_MS[attempt];
    // Out of tries, or the wait would outlast the question: this leg failed like any other.
    if (wait === undefined || Date.now() + wait >= deadline) return { kind: 'failed' };
    await sleep(wait);
    return askAgain(attempt + 1);
  };
  return askAgain(0);
}

async function askLegOnce(
  profile: AmapProfile,
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
  strategy: string | undefined,
  apiKey: string,
  deadline: number,
): Promise<LegAttempt> {
  const remaining = deadline - Date.now();
  if (remaining <= 0) return { kind: 'failed' };

  const params: Record<string, string> = {
    origin: toAmapLocation(from.lat, from.lon),
    destination: toAmapLocation(to.lat, to.lon),
  };
  if (profile === 'driving') {
    // extensions=all is what carries each step's polyline; without it there is no shape.
    params.extensions = 'all';
    params.strategy = strategy ?? '0';
  }

  const path = profile === 'bicycling' ? '/v4/direction/bicycling' : `/v3/direction/${profile}`;
  const url = amapUrl(readEnv().maps.amapApiBase || '', path, params, apiKey);

  try {
    const response = await safeFetchFollow(
      url,
      { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(Math.min(LEG_TIMEOUT_MS, remaining)) },
      { bypassInternalIpAllowed: true },
    );
    if (!response.ok || exceedsDeclaredLength(response, MAX_RESPONSE_BYTES)) {
      discardBody(response);
      return { kind: 'failed' };
    }
    const data = await readCappedJson<AmapEnvelope & AmapBicyclingEnvelope>(response, MAX_RESPONSE_BYTES);
    if (!data || typeof data !== 'object') return { kind: 'failed' };

    if (profile === 'bicycling') {
      if (data.errcode !== 0) {
        logWarn(`[Routing relay] amap bicycling refused: ${data.errcode} ${data.errmsg ?? ''}`);
        return { kind: 'failed' };
      }
      const path0 = asArray(data.data?.paths)[0];
      return path0 ? toLeg(path0, profile) : { kind: 'none' };
    }

    if (data.status !== '1') {
      logWarn(`[Routing relay] amap ${profile} refused: ${data.info ?? ''} (infocode ${data.infocode ?? 'none'})`);
      return data.infocode === TOO_FAST_INFOCODE ? { kind: 'retry' } : { kind: 'failed' };
    }
    const path0 = asArray(data.route?.paths)[0];
    return path0 ? toLeg(path0, profile) : { kind: 'none' };
  } catch (err) {
    logWarn(`[Routing relay] amap ${profile} did not answer: ${err instanceof Error ? err.message : String(err)}`);
    return { kind: 'failed' };
  }
}

// ── The answer ───────────────────────────────────────────────────────────────

/** One Amap path as a leg, or a reason it cannot be one. */
function toLeg(path: AmapPath, profile: AmapProfile): LegOutcome {
  const coordinates = lineOf(path.steps);
  const distance = amapNumber(path.distance);
  const duration = amapNumber(path.duration);
  if (coordinates.length < 2 || distance === null || duration === null) return { kind: 'none' };

  const text = asArray(path.steps)
    .map((step) => `${amapText(step.road)} ${amapText(step.instruction)}`)
    .join('\n');
  return {
    kind: 'leg',
    leg: {
      coordinates,
      distance,
      duration,
      // A walking or cycling answer carries no tolls at all.
      tolls: profile === 'driving' ? (amapNumber(path.tolls) ?? 0) : 0,
      // Amap has no road-class field; its step text names the road, and 高速 is the word it uses.
      hasHighway: profile === 'driving' && /高速/.test(text),
      hasFerry: /轮渡|乘船/.test(text),
    },
  };
}

/** Every step's polyline, joined and shifted back to WGS-84, consecutive duplicates dropped. */
function lineOf(steps: AmapStep[] | undefined): [number, number][] {
  const line: [number, number][] = [];
  for (const step of asArray(steps)) {
    for (const piece of amapText(step.polyline).split(';')) {
      const [lngText = '', latText = ''] = piece.split(',');
      const lng = Number.parseFloat(lngText);
      const lat = Number.parseFloat(latText);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const point = gcj02ToWgs84(lat, lng);
      const last = line[line.length - 1];
      if (last && last[0] === point.lat && last[1] === point.lng) continue;
      line.push([point.lat, point.lng]);
    }
  }
  return line;
}

/** One leg in Valhalla's `summary` words: kilometres and seconds, and what the road actually has. */
function summaryOf(leg: AmapLeg): {
  length: number;
  time: number;
  has_toll: boolean;
  has_highway: boolean;
  has_ferry: boolean;
} {
  return {
    length: leg.distance / 1000,
    time: leg.duration,
    has_toll: leg.tolls > 0,
    has_highway: leg.hasHighway,
    has_ferry: leg.hasFerry,
  };
}

/** The legs as the Valhalla trip the planner parses: one summary each, plus the whole of it. */
function tripFrom(legs: AmapLeg[]): unknown {
  const tripLegs = legs.map((leg) => ({
    // Precision 6 is what the planner decodes; its test pins a known vertex.
    shape: encodePolyline(leg.coordinates, 6),
    summary: summaryOf(leg),
  }));
  const whole = {
    length: tripLegs.reduce((sum, leg) => sum + leg.summary.length, 0),
    time: tripLegs.reduce((sum, leg) => sum + leg.summary.time, 0),
    has_toll: tripLegs.some((leg) => leg.summary.has_toll),
    has_highway: tripLegs.some((leg) => leg.summary.has_highway),
    has_ferry: tripLegs.some((leg) => leg.summary.has_ferry),
  };

  return {
    trip: {
      status: 0,
      units: 'kilometers',
      language: 'zh-CN',
      summary: whole,
      legs: tripLegs,
    },
  };
}
