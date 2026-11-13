import { MailIngestAddresses } from '../../db/entities/MailIngestAddresses.entity';
import type {
  MailIngestAddressesRepository,
  MailIngestAddressRow,
} from '../../db/repositories/MailIngestAddresses.repository';
import { dbNow, utcSuffix } from '../../db/types';
import { decrypt_api_key, encrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { DomainError } from '../common/domain-error';
import { UnitOfWork } from '../database/unit-of-work';
import { MailIngestSettingsService } from './mail-ingest-settings.service';
import { MailIngestTripsService } from './mail-ingest-trips.service';
import { TOKEN_LENGTH } from './mail-ingest.constants';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { MailIngestAddress } from '@trek/shared';

import { createHash, randomBytes } from 'node:crypto';

/** RFC 4648 base32, lower case: a mail's local part keeps it as it is. */
const BASE32 = 'abcdefghijklmnopqrstuvwxyz234567';

/**
 * The forwarding addresses. A person has one of their own and may make one
 * per trip they can add bookings to; each address is a random token behind
 * the admin's catch-all, stored as its sha256 for the lookup and encrypted
 * so its owner can see it again. Renewing replaces the token at once.
 *
 * A trip address belongs to the member who made it, and stops working the
 * moment they can no longer add bookings to the trip: every mail and every
 * write checks that again.
 */
@Injectable()
export class MailIngestAddressService {
  constructor(
    @InjectRepository(MailIngestAddresses) private readonly addresses: MailIngestAddressesRepository,
    private readonly settings: MailIngestSettingsService,
    private readonly trips: MailIngestTripsService,
    private readonly uow: UnitOfWork,
  ) {}

  /** The person's own address; null until they asked for one or while no address template is set. */
  async ownAddress(userId: number): Promise<MailIngestAddress | null> {
    return this.view(await this.addresses.findLive(userId, null));
  }

  /** A new own address for the person, the old one stops working. */
  async renewOwn(userId: number): Promise<MailIngestAddress | null> {
    await this.requireTemplate();
    return this.view(await this.rotate(userId, null));
  }

  /** The person's address for the trip, if they made one and may still add bookings there. */
  async tripAddress(userId: number, tripId: number): Promise<MailIngestAddress | null> {
    await this.requireTripEdit(userId, tripId);
    return this.view(await this.addresses.findLive(userId, tripId));
  }

  /** A new address for the trip, for a person who may add bookings to it; an old one stops working. */
  async renewTripAddress(userId: number, tripId: number): Promise<MailIngestAddress | null> {
    await this.requireTripEdit(userId, tripId);
    await this.requireTemplate();
    return this.view(await this.rotate(userId, tripId));
  }

  /** The person's address for the trip stops working. */
  async revokeTripAddress(userId: number, tripId: number): Promise<void> {
    await this.addresses.revokeLive(userId, tripId, dbNow());
  }

  /**
   * Every live address a mail was sent to, each once: a confirmation two
   * co-travellers forward together reaches both. A token nobody holds, a
   * revoked one, a person who switched the import off, and a trip address
   * whose owner may no longer add bookings to the trip are left out.
   */
  async resolveAll(recipients: readonly string[]): Promise<MailIngestAddressRow[]> {
    const template = await this.settings.addressTemplate();
    const tokens = new Set(
      recipients.map((recipient) => tokenOf(recipient, template)).filter((token): token is string => token !== null),
    );
    const found = await Promise.all([...tokens].map((token) => this.addresses.findByTokenHash(hashToken(token))));
    const rows = found.filter((row): row is MailIngestAddressRow => row !== null);
    const live = await Promise.all(rows.map((row) => this.isLive(row)));
    return rows.filter((_, i) => live[i]);
  }

  /** The person's own live address, made now when they have none: an uploaded mail goes through it. */
  async ensureOwn(userId: number): Promise<MailIngestAddressRow> {
    return (await this.addresses.findLive(userId, null)) ?? (await this.rotate(userId, null));
  }

  /** Whether an address takes mail: not revoked, its person's import on, a trip address's owner still an editor. */
  async isLive(address: MailIngestAddressRow): Promise<boolean> {
    if (address.revoked_at) return false;
    if (!(await this.settings.prefsOf(address.user_id)).enabled) return false;
    const person = await this.trips.person(address.user_id);
    if (person === null) return false;
    return address.trip_id === null || (await this.trips.editableTrip(person, address.trip_id)) !== null;
  }

  async findById(id: number): Promise<MailIngestAddressRow | null> {
    return this.addresses.findById(id);
  }

  /** Notes that a mail came in on the address. */
  async touch(addressId: number): Promise<void> {
    await this.addresses.touchUsed(addressId, dbNow());
  }

  private async rotate(userId: number, tripId: number | null): Promise<MailIngestAddressRow> {
    const token = newToken();
    const id = await this.uow.transactional(async () => {
      const now = dbNow();
      await this.addresses.revokeLive(userId, tripId, now);
      return this.addresses.insertAddress({
        userId,
        tripId,
        tokenHash: hashToken(token),
        tokenEnc: encrypt_api_key(token),
        createdAt: now,
      });
    });
    const row = await this.addresses.findById(id);
    if (!row) throw new Error(`mail address ${id} vanished after its insert`);
    return row;
  }

  private async view(row: MailIngestAddressRow | null): Promise<MailIngestAddress | null> {
    if (!row) return null;
    const template = await this.settings.addressTemplate();
    const token = decrypt_api_key(row.token_enc);
    if (!template || !token) return null;
    return {
      id: row.id,
      address: template.replace('{token}', token),
      trip_id: row.trip_id,
      created_at: utcSuffix(row.created_at) ?? row.created_at,
      last_used_at: utcSuffix(row.last_used_at),
    };
  }

  private async requireTemplate(): Promise<void> {
    if (!(await this.settings.addressTemplate())) {
      throw new DomainError(409, 'No forwarding address is set up on this server');
    }
  }

  private async requireTripEdit(userId: number, tripId: number): Promise<void> {
    const person = await this.trips.person(userId);
    if (!person || !(await this.trips.editableTrip(person, tripId))) {
      throw new DomainError(404, 'Trip not found');
    }
  }
}

/** A random token of {@link TOKEN_LENGTH} base32 characters, from the system's cryptographic source. */
export function newToken(): string {
  const bytes = randomBytes(TOKEN_LENGTH);
  return [...bytes].map((byte) => BASE32[byte % 32]).join('');
}

/** The sha256 a token is looked up by; tokens are case-insensitive, as a mail's local part is in practice. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token.toLowerCase()).digest('hex');
}

/**
 * The token a recipient address carries: what stands where `{token}` stands
 * in the template, or, for a box with sub-addressing, what follows the `+`.
 * Null for an address that holds none.
 */
export function tokenOf(recipient: string, template: string | null): string | null {
  const address = recipient.replace(/^.*</, '').replace(/>.*$/, '').trim().toLowerCase();
  const local = address.split('@')[0] ?? '';
  if (template) {
    const [prefix, suffix] = template.toLowerCase().split('@')[0].split('{token}');
    if (suffix !== undefined && local.startsWith(prefix) && local.endsWith(suffix)) {
      const token = local.slice(prefix.length, local.length - suffix.length);
      if (isToken(token)) return token;
    }
  }
  const plus = local.split('+')[1];
  return plus && isToken(plus) ? plus : null;
}

function isToken(value: string): boolean {
  return value.length >= 20 && /^[a-z2-7]+$/.test(value);
}
