import { WandererConnections } from '../../db/entities/WandererConnections.entity';
import type { WandererConnectionsRepository } from '../../db/repositories/WandererConnections.repository';
import { decodePolyline, thinLine } from '../../utils/polyline';
import { checkSsrf } from '../../utils/ssrfGuard';
import { AuditService } from '../audit/audit.service';
import { decrypt_api_key, maybe_encrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { DomainError } from '../common/domain-error';
import {
  difficultyOf,
  instanceOrigin,
  WandererClient,
  WandererError,
  type WandererCreds,
  type WandererSearchHit,
  type WandererTrailRecord,
} from './wanderer.client';
import { sameHost } from './wanderer.helpers';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  WANDERER_SEARCH_PAGE_SIZE,
  WANDERER_TOKEN_MASK,
  type WandererConnection,
  type WandererErrorCode,
  type WandererSaveResponse,
  type WandererSearchRequest,
  type WandererSettingsRequest,
  type WandererTestRequest,
  type WandererTestResponse,
  type WandererTrailSummary,
} from '@trek/shared';

/** A list row's line: enough points to read the shape, few enough to send twenty of them. */
const SUMMARY_LINE_POINTS = 120;

/** A trail as found, before the trip says which of them it already holds. */
export type WandererTrailFound = Omit<WandererTrailSummary, 'importedAs'>;

/** What a trip-side caller needs to import a trail: where it is, the record and its GPX. */
export interface WandererTrailDownload {
  instance: string;
  trail: WandererTrailRecord;
  gpx: string;
}

/**
 * WAN-02: a trail as the background watch sees it, from its small record
 * alone: its texts and its change time, or `gone` when it was deleted, is
 * refused or is no longer the user's own.
 */
export type WandererTrailLook =
  { kind: 'record'; name: string; description: string | null; updated: string | null } | { kind: 'gone' };

/**
 * WAN-02: what one look of the watch read: a look per trail, or why the
 * instance itself could not be asked, for the watch to back off from.
 */
export type WandererWatchLooks =
  { ok: true; looks: Map<string, WandererTrailLook> } | { ok: false; code: WandererErrorCode };

/** WAN-02: the background watch of one user's connection. */
interface WandererWatchState {
  connected: boolean;
  enabled: boolean;
  lastRunAt: string | null;
  failures: number;
  pausedUntil: string | null;
  /** wanderer refused the token; the watch asks nothing until a test passes or a new token is saved. */
  blocked: boolean;
}

/** An upstream failure as the API answers it: never a 401, which the app reads as its own session ending. */
function refusalOf(err: WandererError): DomainError {
  const status = err.code === 'not_found' ? 404 : err.code === 'forbidden' || err.code === 'not_own_trail' ? 403 : 502;
  return new DomainError(status, err.message, { code: `wanderer_${err.code}`, details: { code: err.code } });
}

/**
 * The wanderer connection of one user: their instance address and API token,
 * the test, and the reads a trip's import builds on. The token is encrypted at
 * rest and leaves only in the Authorization header of a call to the instance
 * it was saved for.
 */
@Injectable()
export class WandererService {
  constructor(
    @InjectRepository(WandererConnections) private readonly connections: WandererConnectionsRepository,
    private readonly client: WandererClient,
    private readonly audit: AuditService,
  ) {}

  async getConnection(userId: number): Promise<WandererConnection> {
    const row = await this.connections.findRow(userId);
    return {
      url: row?.url ?? '',
      tokenMasked: row?.token ? WANDERER_TOKEN_MASK : '',
      allowInsecureTls: !!row?.allow_insecure_tls,
      connected: !!(row?.url && row.token),
      lastCheckedAt: row?.last_checked_at ?? null,
      lastCheckOk: row?.last_check_ok == null ? null : row.last_check_ok === 1,
      lastCheckError: (row?.last_check_error as WandererErrorCode | null | undefined) ?? null,
    };
  }

  /**
   * Save the address and, when a new one was typed, the token. A token belongs
   * to the server it was minted on, so pointing the connection at another host
   * without a new token drops the stored one rather than sending it there.
   * A private address is saved with a warning: a home-network instance is the
   * common case, not an attack.
   */
  async save(userId: number, input: WandererSettingsRequest, clientIp: string | null): Promise<WandererSaveResponse> {
    const url = instanceOrigin(input.url);
    const ssrf = await checkSsrf(url);
    if (!ssrf.allowed && !ssrf.isPrivate) {
      throw new DomainError(400, ssrf.error ?? 'Invalid wanderer URL', {
        code: 'wanderer_invalid_url',
        details: { code: 'invalid_url' },
      });
    }
    const previous = await this.connections.findRow(userId);
    const typed = input.token && input.token !== WANDERER_TOKEN_MASK ? input.token : undefined;
    const hostChanged = !!previous && !sameHost(previous.url, url);
    const token = typed !== undefined ? maybe_encrypt_api_key(typed) : hostChanged ? null : undefined;
    await this.connections.save(userId, { url, allowInsecureTls: input.allowInsecureTls, token, hostChanged });
    await this.audit.writeAudit({
      userId,
      action: previous ? 'wanderer.updated' : 'wanderer.connected',
      ip: clientIp,
      details: { url, token_changed: typed !== undefined, ...(ssrf.isPrivate ? { resolved_ip: ssrf.resolvedIp } : {}) },
    });
    return ssrf.isPrivate ? { success: true, warning: 'private_ip' } : { success: true };
  }

  /** Forget the connection. Tours imported through it stay: they are the trip's own. */
  async disconnect(userId: number, clientIp: string | null): Promise<void> {
    await this.connections.remove(userId);
    await this.audit.writeAudit({ userId, action: 'wanderer.disconnected', ip: clientIp, details: {} });
  }

  /**
   * Test what the form holds, each field falling back to the saved one, and
   * remember the outcome when it tested the saved connection itself.
   */
  async test(userId: number, input: WandererTestRequest): Promise<WandererTestResponse> {
    const saved = await this.connections.findRow(userId);
    const url = input.url ? instanceOrigin(input.url) : saved?.url;
    const typed = input.token && input.token !== WANDERER_TOKEN_MASK ? input.token : undefined;
    const token =
      typed ?? (saved?.token && (!input.url || sameHost(saved.url, url ?? '')) ? decrypt_api_key(saved.token) : null);
    if (!url || !token) return { ok: false, code: 'not_connected' };
    const ssrf = await checkSsrf(url);
    if (!ssrf.allowed) return { ok: false, code: ssrf.isPrivate ? 'blocked_address' : 'invalid_url' };
    const testsSaved = !!saved && typed === undefined && sameHost(saved.url, url);
    try {
      const { trailCount } = await this.client.check({
        baseUrl: url,
        token,
        allowInsecureTls: input.allowInsecureTls ?? !!saved?.allow_insecure_tls,
      });
      if (testsSaved) await this.noteCheck(userId, true, null);
      return { ok: true, trailCount };
    } catch (err: unknown) {
      if (!(err instanceof WandererError)) throw err;
      if (testsSaved) await this.noteCheck(userId, false, err.code);
      return { ok: false, code: err.code };
    }
  }

  /** The saved connection ready for a call; a refusal the client can act on when there is none. */
  private async credentials(userId: number): Promise<WandererCreds> {
    const row = await this.connections.findRow(userId);
    const token = row?.token ? decrypt_api_key(row.token) : null;
    if (!row?.url || !token) throw notConnected();
    return { baseUrl: row.url, token, allowInsecureTls: !!row.allow_insecure_tls };
  }

  /**
   * Note on the connection what the instance last said, for its settings card.
   * @txStandalone a status note that stands on its own: it is true whatever the call around it does next
   */
  private async noteCheck(userId: number, ok: boolean, code: WandererErrorCode | null): Promise<void> {
    await this.connections.recordCheck(userId, ok, code);
  }

  /** A failed call, with a rejected token noted on the connection so its card says so. */
  private async failed(userId: number, err: unknown): Promise<never> {
    if (!(err instanceof WandererError)) throw err;
    if (err.code === 'unauthorized') await this.noteCheck(userId, false, err.code);
    throw refusalOf(err);
  }

  /** The instance this user's connection points at, as the key a snapshot records. */
  async instanceOf(userId: number): Promise<string> {
    return instanceOrigin((await this.credentials(userId)).baseUrl);
  }

  async search(
    userId: number,
    request: Required<Pick<WandererSearchRequest, 'q' | 'page'>> & Pick<WandererSearchRequest, 'bbox'>,
  ): Promise<{ instance: string; trails: WandererTrailFound[]; total: number; pageSize: number }> {
    const creds = await this.credentials(userId);
    const instance = instanceOrigin(creds.baseUrl);
    try {
      const authors = await this.client.ownActors(creds);
      const { hits, total } = await this.client.search(
        creds,
        { q: request.q, page: request.page, bbox: request.bbox },
        authors,
      );
      return {
        instance,
        trails: hits.map((hit) => summaryOf(instance, hit)),
        total,
        pageSize: WANDERER_SEARCH_PAGE_SIZE,
      };
    } catch (err: unknown) {
      return await this.failed(userId, err);
    }
  }

  /** One trail and its original GPX, for the import to measure and copy. */
  async download(userId: number, trailId: string): Promise<WandererTrailDownload> {
    const creds = await this.credentials(userId);
    const instance = instanceOrigin(creds.baseUrl);
    try {
      const authors = await this.client.ownActors(creds);
      const trail = await this.client.trail(creds, trailId);
      // Only the connected account's own trails come in, whatever else its token can read.
      if (!trail.author || !authors.includes(trail.author)) {
        throw new WandererError('not_own_trail', 'Only your own wanderer trails can be imported');
      }
      const gpx = await this.client.gpx(creds, trail);
      return { instance, trail, gpx };
    } catch (err: unknown) {
      return await this.failed(userId, err);
    }
  }

  /** WAN-02: whether the user's connection is watched in the background, and how its last run went. */
  async watchState(userId: number): Promise<WandererWatchState> {
    const row = await this.connections.findRow(userId);
    const watch = await this.connections.findWatch(userId);
    return {
      connected: !!(row?.url && row.token),
      enabled: watch?.watch_enabled === 1,
      lastRunAt: watch?.watch_last_run_at ?? null,
      failures: watch?.watch_failures ?? 0,
      pausedUntil: watch?.watch_paused_until ?? null,
      blocked: row?.last_check_ok === 0 && row.last_check_error === 'unauthorized',
    };
  }

  /**
   * WAN-02: switch the background watch on or off. It only ever acts on the
   * user's own connection, so there has to be one to switch it on for.
   */
  async setWatch(userId: number, enabled: boolean, clientIp: string | null): Promise<void> {
    if (enabled && !(await this.watchState(userId)).connected) throw notConnected();
    await this.connections.setWatch(userId, enabled);
    await this.audit.writeAudit({
      userId,
      action: enabled ? 'wanderer.watch_enabled' : 'wanderer.watch_disabled',
      ip: clientIp,
      details: {},
    });
  }

  /** WAN-02: the users whose connection the watch may ask now, longest waiting first. */
  async watchableUserIds(now: string, limit: number): Promise<number[]> {
    return await this.connections.listWatchable(now, limit);
  }

  /**
   * WAN-02: note how a run of the watch went on the connection.
   * @txStandalone the run's bookkeeping stands on its own: it is true whatever the hints written beside it say
   */
  async noteWatchRun(
    userId: number,
    run: { lastRunAt: string; failures: number; pausedUntil: string | null },
  ): Promise<void> {
    await this.connections.recordWatchRun(userId, run);
  }

  /**
   * WAN-02: the records of the given trails, for the background watch. One
   * small read per trail, one after another, and never its GPX: the change
   * time and the texts are what a look can afford. A trail that is gone,
   * refused or someone else's reads as `gone`; a failure of the instance
   * itself (unreachable, an error, a refused token, which is noted on the
   * connection) ends the whole look with its reason.
   */
  async lookAtTrails(userId: number, trailIds: readonly string[]): Promise<WandererWatchLooks> {
    const creds = await this.credentials(userId);
    const looks = new Map<string, WandererTrailLook>();
    try {
      const authors = await this.client.ownActors(creds);
      await [...new Set(trailIds)].reduce(async (previous, id) => {
        await previous;
        looks.set(id, await this.lookAt(creds, id, authors));
      }, Promise.resolve());
    } catch (err: unknown) {
      if (!(err instanceof WandererError)) throw err;
      if (err.code === 'unauthorized') await this.noteCheck(userId, false, err.code);
      return { ok: false, code: err.code };
    }
    return { ok: true, looks };
  }

  private async lookAt(creds: WandererCreds, id: string, authors: readonly string[]): Promise<WandererTrailLook> {
    try {
      const trail = await this.client.trail(creds, id);
      if (!trail.author || !authors.includes(trail.author)) return { kind: 'gone' };
      return {
        kind: 'record',
        name: trail.name,
        description: trail.description ?? null,
        updated: trail.updated ?? null,
      };
    } catch (err: unknown) {
      // Deleted or refused: the trail is out of reach, not the instance.
      if (err instanceof WandererError && (err.code === 'not_found' || err.code === 'forbidden')) {
        return { kind: 'gone' };
      }
      throw err;
    }
  }

  /** The list row of a trail by its id, as the search would show it. */
  async findTrail(userId: number, trailId: string): Promise<WandererTrailFound | null> {
    const creds = await this.credentials(userId);
    const instance = instanceOrigin(creds.baseUrl);
    try {
      const hit = await this.client.searchById(creds, trailId, await this.client.ownActors(creds));
      return hit ? summaryOf(instance, hit) : null;
    } catch (err: unknown) {
      return await this.failed(userId, err);
    }
  }
}

function notConnected(): DomainError {
  return new DomainError(409, 'wanderer is not connected', {
    code: 'wanderer_not_connected',
    details: { code: 'not_connected' },
  });
}

function summaryOf(instance: string, hit: WandererSearchHit): WandererTrailFound {
  const author = hit.author_name ? (hit.domain ? `${hit.author_name}@${hit.domain}` : hit.author_name) : null;
  return {
    id: hit.id,
    name: hit.name,
    description: hit.description || null,
    location: hit.location || null,
    distanceM: hit.distance ?? null,
    durationS: hit.duration || null,
    elevationGainM: hit.elevation_gain ?? null,
    elevationLossM: hit.elevation_loss ?? null,
    difficulty: difficultyOf(hit.difficulty),
    public: !!hit.public,
    author,
    line: hit.polyline ? thinLine(decodePolyline(hit.polyline, 5), SUMMARY_LINE_POINTS) : [],
    externalUrl: `${instance}/trail/view/@${encodeURIComponent(author ?? '')}/${encodeURIComponent(hit.id)}`,
  };
}
