import { readCapped } from '../../utils/cappedFetch';
import { safeFetchAdminConfigured } from '../../utils/ssrfGuard';
import { servicesConfig } from '../app-config/tokens';
import { logWarn } from '../audit/audit-log.logger';
import { DomainError } from '../common/domain-error';
import { RateLimitService } from '../common/rate-limit.service';
import { ReservationsReadService } from '../reservations/reservations-read.service';
import { buildWalletPassRequest, type WalletPassEndpoint } from './wallet-pass.builder';
import { loadWalletWords } from './wallet-pass.words';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

/** Per user and minute: a pass is one tap, this only stops a loop. */
const PASSES_PER_MINUTE = 20;
const RATE_WINDOW_MS = 60_000;
const TIMEOUT_MS = 10_000;
/** A pass is its texts plus TREK's icon and wordmark: some 25 KB. */
const MAX_PASS_BYTES = 512 * 1024;
const PKPASS = 'application/vnd.apple.pkpass';
/** Every ZIP, and so every .pkpass, starts with a local file header. */
const ZIP_LOCAL_HEADER = 0x04034b50;

export interface WalletPass {
  bytes: Buffer;
  filename: string;
}

/**
 * A booking's Apple Wallet pass. Only liketrek holds the Pass Type ID
 * certificate, so the pass's texts go to the TREK services' signer
 * (TREK_WALLET_PASS_URL) once per tap and come back as a signed .pkpass; the
 * signer stores nothing. Off with the other TREK services (TREK_SERVICES=off).
 */
@Injectable()
export class WalletPassService {
  constructor(
    @Inject(servicesConfig.KEY) private readonly config: ConfigType<typeof servicesConfig>,
    private readonly reservations: ReservationsReadService,
    private readonly rateLimit: RateLimitService,
  ) {}

  /** Whether this server makes Wallet passes at all. */
  enabled(): boolean {
    return this.config.mode === 'auto';
  }

  async passFor(userId: number, tripId: number, reservationId: number, language: string): Promise<WalletPass> {
    if (!this.enabled()) throw new DomainError(404, 'Wallet passes are off on this server');
    const allowed = await this.rateLimit.check(
      'wallet-pass',
      String(userId),
      PASSES_PER_MINUTE,
      RATE_WINDOW_MS,
      Date.now(),
    );
    if (!allowed) throw new DomainError(429, 'Too many Wallet passes, try again in a minute');

    const row = await this.reservations.getReservationWithJoins(reservationId);
    // The trip guard checked the trip; the booking must belong to it as well.
    if (!row || Number(row.trip_id) !== tripId) throw new DomainError(404, 'Reservation not found');

    // The trip's title and where the booking is, read by the reservations domain itself.
    const context = await this.reservations.passContext(reservationId, tripId);
    const request = buildWalletPassRequest(
      {
        reservation: {
          id: row.id,
          trip_id: row.trip_id,
          title: row.title,
          type: row.type,
          reservation_time: stringOrNull(row.reservation_time),
          reservation_end_time: stringOrNull(row.reservation_end_time),
          confirmation_number: stringOrNull(row.confirmation_number),
          location: stringOrNull(row.location),
          created_at: stringOrNull(row.created_at),
          metadata: parseMetadata(row.metadata),
        },
        endpoints: (row.endpoints ?? []) as WalletPassEndpoint[],
        tripTitle: context?.trip_title ?? null,
        place:
          typeof context?.place_lat === 'number' && typeof context.place_lng === 'number'
            ? { lat: context.place_lat, lng: context.place_lng, name: context.place_name ?? null }
            : null,
      },
      await loadWalletWords(language),
    );
    if (!request) throw new DomainError(422, 'A booking needs a date for a Wallet pass');

    return { bytes: await this.sign(request), filename: `${filenameOf(row.title)}.pkpass` };
  }

  private async sign(request: object): Promise<Buffer> {
    let response: Response;
    try {
      response = await safeFetchAdminConfigured(
        this.config.walletPassUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: PKPASS },
          body: JSON.stringify(request),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
        0,
        undefined,
        MAX_PASS_BYTES,
      );
    } catch (err) {
      logWarn(`[Wallet pass] signer unreachable: ${err instanceof Error ? err.message : String(err)}`);
      throw new DomainError(502, 'The Wallet pass service did not answer');
    }
    if (response.status === 429) throw new DomainError(429, 'Too many Wallet passes, try again in a minute');
    if (response.status !== 200 || !(response.headers.get('content-type') ?? '').startsWith(PKPASS)) {
      const reason = await readCapped(response, 2048).then(
        ({ bytes }) => bytes.toString('utf8').slice(0, 300),
        () => '',
      );
      logWarn(`[Wallet pass] signer answered ${response.status}: ${reason}`);
      throw new DomainError(502, 'The Wallet pass service could not make this pass');
    }
    const { bytes, truncated } = await readCapped(response, MAX_PASS_BYTES);
    // A .pkpass is a ZIP: anything else is not handed to the app as one.
    if (truncated || bytes.length < 4 || bytes.readUInt32LE(0) !== ZIP_LOCAL_HEADER) {
      throw new DomainError(502, 'The Wallet pass service sent something that is not a pass');
    }
    return bytes;
  }
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function parseMetadata(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw !== 'string' || !raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** A file name from the booking's title: letters, digits and dashes. */
export function filenameOf(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || 'booking';
}
