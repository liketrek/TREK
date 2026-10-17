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
    if (!row?.url || !token) {
      throw new DomainError(409, 'wanderer is not connected', {
        code: 'wanderer_not_connected',
        details: { code: 'not_connected' },
      });
    }
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
