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
/** Ten hits are a few kB. */
const MAX_BYTES = 512_000;
const SEARCH_LIMIT = 10;
/**
 * How far the bias reaches. Nominatim is handed a box of a degree around the
 * point; zoom 10 is Photon's spelling of about that.
 */
const BIAS_ZOOM = 10;
const MISSES_BEFORE_PAUSE = 4;
const PAUSE_MS = 60_000;
/** The longest Retry-After followed; the first question after it finds out whether the allowance is back. */
const MAX_PAUSE_MS = 60 * 60_000;

interface PhotonSearchOptions {
  lang?: string;
  bias?: { lat: number; lng: number };
}

@Injectable()
export class PhotonClient {
  private misses = 0;
  private pausedUntil = 0;

  constructor(@Inject(servicesConfig.KEY) private readonly config: ConfigType<typeof servicesConfig>) {}

  /** Places matching the query, best first, or null when Nominatim has to answer. */
  search(query: string, opts: PhotonSearchOptions = {}): Promise<PhotonFeature[] | null> {
    const params = new URLSearchParams({ q: query, limit: String(SEARCH_LIMIT), lang: photonLang(opts.lang) });
    if (opts.bias && Number.isFinite(opts.bias.lat) && Number.isFinite(opts.bias.lng)) {
      params.set('lat', String(opts.bias.lat));
      params.set('lon', String(opts.bias.lng));
      params.set('zoom', String(BIAS_ZOOM));
    }
    return this.ask('api', params);
  }

  /**
   * What lies at a point, nearest first, or null when Nominatim has to answer.
   * A caller's own deadline leaves Nominatim at least half of it.
   */
  reverse(lat: number, lng: number, lang?: string, timeoutMs?: number): Promise<PhotonFeature[] | null> {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return Promise.resolve(null);
    const params = new URLSearchParams({ lat: String(lat), lon: String(lng), limit: '1', lang: photonLang(lang) });
    return this.ask('reverse', params, timeoutMs ? Math.min(TIMEOUT_MS, timeoutMs / 2) : TIMEOUT_MS);
  }

  private async ask(
    path: 'api' | 'reverse',
    params: URLSearchParams,
    timeoutMs = TIMEOUT_MS,
  ): Promise<PhotonFeature[] | null> {
    if (!this.mayAsk()) return null;
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
        signal: AbortSignal.timeout(timeoutMs),
      });
      identity.observe(url, res);
      const wait = res.status === 429 ? retryAfterMs(res.headers.get('retry-after')) : null;
      if (wait !== null) {
        await res.body?.cancel();
        this.pauseFor(wait);
        return null;
      }
      if (!res.ok) {
        await res.body?.cancel();
        throw new Error(`answered ${res.status}`);
      }
      const { features } = photonAnswerSchema.parse(await capResponse(res, MAX_BYTES).json());
      this.misses = 0;
      return features;
    } catch (err) {
      this.noteMiss(err);
      return null;
    }
  }

  /** Off with the services, beside an operator's own Nominatim, and during the pause. */
  private mayAsk(): boolean {
    if (this.config.mode === 'off' || readEnv().integrations.nominatimOwn) return false;
    return Date.now() >= this.pausedUntil;
  }

  private noteMiss(err: unknown): void {
    const reason = err instanceof Error ? err.message : String(err);
    this.misses += 1;
    if (this.misses < MISSES_BEFORE_PAUSE) {
      logDebug(`[Photon] ${reason}; asking Nominatim instead`);
      return;
    }
    this.pausedUntil = Date.now() + PAUSE_MS;
    // One more miss after the pause starts the next one.
    this.misses = MISSES_BEFORE_PAUSE - 1;
    logWarn(`[Photon] ${reason}; asking Nominatim alone for a minute`);
  }

  private pauseFor(ms: number): void {
    const wait = Math.min(ms, MAX_PAUSE_MS);
    this.pausedUntil = Date.now() + wait;
    this.misses = MISSES_BEFORE_PAUSE - 1;
    logWarn(`[Photon] allowance spent; asking Nominatim alone for ${Math.ceil(wait / 1000)} s`);
  }
}
