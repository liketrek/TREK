/**
 * Photon, the address search of the TREK services, asked before Nominatim.
 *
 * It answers the forward search and the reverse lookup for an installation
 * that holds a key for the TREK services and has not set NOMINATIM_URL: an
 * operator who runs a geocoder of their own keeps it. Photon has no shared
 * pool, so without a key it is not asked at all.
 *
 * Every miss is null and the caller asks Nominatim instead: a refused key, a
 * spent allowance, a timeout, an error or an answer that is not Photon's all
 * read to the traveller as the search they had before. After a few misses in
 * a row it stops asking for a minute, as the Places client does, so an
 * installation that cannot reach it does not pay the deadline on every search.
 * A spent allowance says itself how long to wait (Retry-After), and that wait
 * is kept instead.
 *
 * The suggestions asked on every keystroke keep a tally of their own. They
 * come far more often than a search, under a shorter deadline, and many are
 * dropped unanswered once the next keystroke is in, so their misses and their
 * spent allowance pause only the suggestions. A pause of the search holds the
 * suggestions back too: a host the search cannot reach is not asked per letter.
 *
 * The key comes from serviceIdentitySlot, as it does for the Places request
 * (trek-places.fetch.ts), so the maps domain reads the installation identity
 * one way and needs no import of ServiceIdentityModule; the slot holds the
 * port that module resolved.
 *
 * Never imports MapsService: providers sit below the orchestrator.
 */
import { readEnv } from '../../../app-config';
import { capResponse } from '../../../utils/ssrfGuard';
import { servicesConfig } from '../../app-config/tokens';
import { logDebug, logWarn } from '../../audit/audit-log.logger';
import { serviceIdentitySlot } from '../../service-identity/service-identity.interface';
import { retryAfterMs } from '../overpass-hedge.helpers';
import { photonAnswerSchema, photonLang, type PhotonFeature } from './photon.mapping';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

/** Short, because Nominatim still has to fit behind it inside the browser's wait. */
const TIMEOUT_MS = 2500;
/** The suggestion list is waiting on the index beside it, and the next keystroke is near. */
const SUGGEST_TIMEOUT_MS = 1500;
/** Ten hits are a few kB. */
const MAX_BYTES = 512_000;
const SEARCH_LIMIT = 10;
/**
 * How narrow the bias is. Asked from a city view ("Hauptbahnhof" from
 * Hamburg, "Starbucks" from Tokyo), zoom 10 put the right place first 59 % of
 * the time, 12 82 %, 13 91 % and 14 86 %. A wide decay lifts a namesake 50 km
 * off above the real place; a narrow one leaves far places in Photon's own
 * order of importance.
 */
const BIAS_ZOOM = 13;
const MISSES_BEFORE_PAUSE = 4;
const PAUSE_MS = 60_000;
/** The longest Retry-After followed; the first question after it finds out whether the allowance is back. */
const MAX_PAUSE_MS = 60 * 60_000;

interface PhotonSearchOptions {
  lang?: string;
  bias?: { lat: number; lng: number };
  /** Only hits inside [west, south, east, north]. */
  bbox?: [number, number, number, number];
  limit?: number;
}

/** The misses in a row and the pause of one kind of question. */
interface Tally {
  /** What answers instead while Photon does not. */
  fallback: string;
  misses: number;
  pausedUntil: number;
}

@Injectable()
export class PhotonClient {
  private readonly lookups: Tally = { fallback: 'asking Nominatim', misses: 0, pausedUntil: 0 };
  private readonly suggestions: Tally = { fallback: 'suggesting from the index', misses: 0, pausedUntil: 0 };

  constructor(@Inject(servicesConfig.KEY) private readonly config: ConfigType<typeof servicesConfig>) {}

  /** Places matching the query, best first, or null when Nominatim has to answer. */
  search(query: string, opts: PhotonSearchOptions = {}): Promise<PhotonFeature[] | null> {
    return this.ask('api', searchParams(query, opts), this.lookups);
  }

  /**
   * Places for the suggestion list, or null when it goes without them. A caller
   * that stops waiting aborts `signal`, and that counts as no miss.
   */
  suggest(query: string, opts: PhotonSearchOptions & { signal?: AbortSignal } = {}): Promise<PhotonFeature[] | null> {
    if (Date.now() < this.lookups.pausedUntil) return Promise.resolve(null);
    return this.ask('api', searchParams(query, opts), this.suggestions, SUGGEST_TIMEOUT_MS, opts.signal);
  }

  /**
   * What lies at a point, nearest first, or null when Nominatim has to answer.
   * A caller's own deadline leaves Nominatim at least half of it. `radius` is
   * Photon's search radius in km; its default finds nothing in open country,
   * where Nominatim names the nearest object at any distance.
   */
  reverse(
    lat: number,
    lng: number,
    lang?: string,
    timeoutMs?: number,
    opts: { limit?: number; radius?: number } = {},
  ): Promise<PhotonFeature[] | null> {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return Promise.resolve(null);
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      limit: String(opts.limit ?? 1),
      lang: photonLang(lang),
    });
    if (opts.radius) params.set('radius', String(opts.radius));
    const deadline = timeoutMs ? Math.min(TIMEOUT_MS, timeoutMs / 2) : TIMEOUT_MS;
    return this.ask('reverse', params, this.lookups, deadline);
  }

  /**
   * Whether Photon is this installation's geocoder: the services are on, no
   * operator's own Nominatim stands beside it, and there is a key to send. A
   * question it then misses is a miss, not a reason to ask Nominatim.
   */
  inUse(): boolean {
    if (this.config.mode === 'off' || readEnv().integrations.nominatimOwn) return false;
    const url = new URL(this.config.photonUrl);
    return !!serviceIdentitySlot.get().headersFor(url).Authorization;
  }

  private async ask(
    path: 'api' | 'reverse',
    params: URLSearchParams,
    tally: Tally,
    timeoutMs = TIMEOUT_MS,
    signal?: AbortSignal,
  ): Promise<PhotonFeature[] | null> {
    if (!this.mayAsk(tally)) return null;
    const url = new URL(`${this.config.photonUrl}/${path}`);
    url.search = params.toString();
    const identity = serviceIdentitySlot.get();
    const headers = identity.headersFor(url);
    if (!headers.Authorization) return null;
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', ...headers },
        // The key goes to this host alone, never on to wherever it points.
        redirect: 'error',
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs),
      });
      identity.observe(url, res);
      const wait = res.status === 429 ? retryAfterMs(res.headers.get('retry-after')) : null;
      if (wait !== null) {
        await res.body?.cancel();
        this.pauseFor(tally, wait);
        return null;
      }
      if (!res.ok) {
        await res.body?.cancel();
        throw new Error(`answered ${res.status}`);
      }
      const { features } = photonAnswerSchema.parse(await capResponse(res, MAX_BYTES).json());
      tally.misses = 0;
      return features;
    } catch (err) {
      if (!signal?.aborted) this.noteMiss(tally, err);
      return null;
    }
  }

  /** Off with the services, beside an operator's own Nominatim, and during the pause. */
  private mayAsk(tally: Tally): boolean {
    if (this.config.mode === 'off' || readEnv().integrations.nominatimOwn) return false;
    return Date.now() >= tally.pausedUntil;
  }

  private noteMiss(tally: Tally, err: unknown): void {
    const reason = err instanceof Error ? err.message : String(err);
    tally.misses += 1;
    if (tally.misses < MISSES_BEFORE_PAUSE) {
      logDebug(`[Photon] ${reason}; ${tally.fallback} instead`);
      return;
    }
    tally.pausedUntil = Date.now() + PAUSE_MS;
    // One more miss after the pause starts the next one.
    tally.misses = MISSES_BEFORE_PAUSE - 1;
    logWarn(`[Photon] ${reason}; ${tally.fallback} alone for a minute`);
  }

  private pauseFor(tally: Tally, ms: number): void {
    const wait = Math.min(ms, MAX_PAUSE_MS);
    tally.pausedUntil = Date.now() + wait;
    tally.misses = MISSES_BEFORE_PAUSE - 1;
    logWarn(`[Photon] allowance spent; ${tally.fallback} alone for ${Math.ceil(wait / 1000)} s`);
  }
}

function searchParams(query: string, opts: PhotonSearchOptions): URLSearchParams {
  const params = new URLSearchParams({
    q: query,
    limit: String(opts.limit ?? SEARCH_LIMIT),
    lang: photonLang(opts.lang),
  });
  if (opts.bbox) params.set('bbox', opts.bbox.join(','));
  if (opts.bias && Number.isFinite(opts.bias.lat) && Number.isFinite(opts.bias.lng)) {
    params.set('lat', String(opts.bias.lat));
    params.set('lon', String(opts.bias.lng));
    params.set('zoom', String(BIAS_ZOOM));
  }
  return params;
}
