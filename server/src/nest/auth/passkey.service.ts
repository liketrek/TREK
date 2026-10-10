import { Users } from '../../db/entities/Users.entity';
import { WebauthnChallenges } from '../../db/entities/WebauthnChallenges.entity';
import { WebauthnCredentials } from '../../db/entities/WebauthnCredentials.entity';
import type { UsersRepository, UserRow } from '../../db/repositories/Users.repository';
import type { WebauthnChallengesRepository } from '../../db/repositories/WebauthnChallenges.repository';
import type { WebauthnCredentialsRepository } from '../../db/repositories/WebauthnCredentials.repository';
import type { User } from '../../types';
import { avatarUrl } from '../common/avatarUrl';
import { DomainError } from '../common/domain-error';
import { toRowId } from '../common/row-id';
import { UnitOfWork } from '../database/unit-of-work';
import type { SessionClient } from '../sessions/sessions.service';
import { stripUserForClient } from './auth.helpers';
import { AuthService } from './auth.service';
import { WebauthnConfigService, originWithinRpScope, type WebauthnConfig } from './webauthn-config.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, Logger } from '@nestjs/common';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type AuthenticatorTransportFuture,
} from '@simplewebauthn/server';

import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Short single-use challenge lifetime — a ceremony is a few seconds of user
// interaction. Kept tight so a stray row can't be replayed and the table can't
// accumulate. Mirrors the spirit of the OIDC state TTL.
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

// Pinned COSE algorithms: EdDSA (-8), ES256 (-7), RS256 (-257). We never want a
// future library default to silently widen what we accept.
const SUPPORTED_ALGORITHM_IDS = [-8, -7, -257];

const NOT_CONFIGURED = { error: 'Passkey login is not configured for this server.', status: 400 } as const;
// One generic message for every authentication failure so the endpoint can't be
// used to tell "no such credential" apart from "bad signature" (CWE-203).
const AUTH_FAILED = { error: 'Authentication failed', status: 401 } as const;

/** One of the canned `{ error, status }` pairs above, raised. */
const refusal = (r: { error: string; status: number }) => new DomainError(r.status, r.error);

// Reference-compared sentinel (oidc invite_exhausted precedent): thrown inside
// the register transaction to keep the duplicate 409 distinct from the generic
// insert-failure 400 without string-matching SQLite errors.
const DUPLICATE_CREDENTIAL = new Error('duplicate credential');

function clientDataFromResponse(resp: unknown): { challenge?: unknown; origin?: unknown } | null {
  try {
    const cdj = (resp as { response?: { clientDataJSON?: unknown } })?.response?.clientDataJSON;
    if (typeof cdj !== 'string') return null;
    return JSON.parse(Buffer.from(cdj, 'base64url').toString('utf8')) as { challenge?: unknown; origin?: unknown };
  } catch {
    return null;
  }
}

function challengeFromResponse(resp: unknown): string | null {
  const challenge = clientDataFromResponse(resp)?.challenge;
  return typeof challenge === 'string' ? challenge : null;
}

/** The browser-asserted origin of the ceremony (clientDataJSON.origin). */
function originFromResponse(resp: unknown): string | null {
  const origin = clientDataFromResponse(resp)?.origin;
  return typeof origin === 'string' ? origin : null;
}

function parseTransports(raw: string | null): AuthenticatorTransportFuture[] | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AuthenticatorTransportFuture[]) : undefined;
  } catch {
    return undefined;
  }
}

function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().slice(0, 60);
  return trimmed || null;
}

function defaultCredentialName(deviceType: string | undefined): string {
  return deviceType === 'multiDevice' ? 'Passkey (synced)' : 'Passkey';
}

/**
 * `UsersRepository.findById` returns the repository's full-row shape
 * (`UserRow` — every `users` column, `role: string`, several `T | null`
 * columns); the client-payload helper `stripUserForClient` takes the
 * narrower `User` contract type (`role: 'admin' | 'user'`, those same
 * columns `T | undefined`). This is the one place in this file that reads a
 * user through the repository and hands it to that helper, so the mapping
 * lives here rather than widening `stripUserForClient`'s parameter for
 * every other caller (Plan 3b Task 3 review, F5).
 *
 * A spread, not a field-by-field reconstruction: the legacy raw-SQL
 * equivalent (`this.db.get<User>('SELECT * FROM users WHERE id = ?', ...)`,
 * `daef15be7:passkey.service.ts:417`) handed `stripUserForClient` the
 * *actual* full row at runtime despite its `User`-typed generic — every
 * column `SELECT *` returns, not just the ones `User` declares. Narrowing
 * to an explicit field list here would silently drop columns the legacy
 * response carried (parity is law); only the columns whose *type* actually
 * conflicts (`role`'s string vs. the union, and the `T | null` columns
 * `User` declares as `T | undefined`) are overridden below — every other
 * column passes through unchanged, exactly as it did before.
 */
function toClientUser(row: UserRow): User {
  return {
    ...row,
    role: row.role === 'admin' ? 'admin' : 'user',
    mfa_enabled: row.mfa_enabled ?? undefined,
    must_change_password: row.must_change_password ?? undefined,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
}

/**
 * WebAuthn (passkey) registration, discoverable-credential login and
 * credential management. No instance state — the challenge store is DB-backed
 * (single-use, TTL'd) precisely so it survives restarts and is shared across
 * processes.
 */
@Injectable()
export class PasskeyService {
  private readonly logger = new Logger(PasskeyService.name);

  constructor(
    private readonly auth: AuthService,
    private readonly webauthn: WebauthnConfigService,
    private readonly uow: UnitOfWork,
    @InjectRepository(WebauthnCredentials) private readonly webauthnCredentials: WebauthnCredentialsRepository,
    @InjectRepository(WebauthnChallenges) private readonly webauthnChallenges: WebauthnChallengesRepository,
    @InjectRepository(Users) private readonly users: UsersRepository,
  ) {}

  // -------------------------------------------------------------------------
  // Challenge store (DB-backed, single-use, TTL'd)
  // -------------------------------------------------------------------------

  private async purgeExpiredChallenges(now: number): Promise<void> {
    await this.webauthnChallenges.purgeExpired(now);
  }

  private async storeChallenge(
    challenge: string,
    userId: number | null,
    type: 'registration' | 'authentication',
    now: number,
  ): Promise<void> {
    await this.webauthnChallenges.insertChallenge({
      challenge,
      user_id: userId,
      type,
      expires_at: now + CHALLENGE_TTL_MS,
    });
  }

  /**
   * Atomically claim a challenge by its EXACT bytes + type. This is a single
   * DELETE ... RETURNING statement that runs BEFORE any async verification, so a
   * concurrent double-submit of the same assertion can never spend one challenge
   * twice (the replay window a SELECT→await→DELETE ordering would open).
   */
  private async claimChallenge(
    challenge: string,
    type: 'registration' | 'authentication',
    now: number,
  ): Promise<{ user_id: number | null } | null> {
    return this.webauthnChallenges.claimChallenge(challenge, type, now);
  }

  // -------------------------------------------------------------------------
  // Origin handling (#2147)
  // -------------------------------------------------------------------------

  /**
   * The origins handed to the verifier for this ceremony. An explicit operator
   * list is honored verbatim. A derived config (APP_URL fallback) often carries
   * the wrong scheme or port (TLS-terminating proxy, first ALLOWED_ORIGINS
   * entry), so the browser-asserted origin is added when it is the RP ID's own
   * host and only the scheme or port drifted.
   *
   * The HOST is never widened, even though the browser's rule would run a
   * ceremony from any subdomain of the RP ID: on an apex RP ID that exact-origin
   * list is the only thing between a taken-over sibling subdomain and an
   * assertion this server would accept, and the browser cannot supply it. A
   * deployment that really spans several hosts under one RP ID lists them in
   * webauthn_origins / WEBAUTHN_ORIGINS, which is honored verbatim above.
   */
  private expectedOrigins(cfg: WebauthnConfig, resp: unknown): string[] {
    if (cfg.explicitOrigins) return cfg.origins;
    const clientOrigin = originFromResponse(resp);
    if (!clientOrigin || cfg.origins.includes(clientOrigin) || !originWithinRpScope(clientOrigin, cfg.rpID)) {
      return cfg.origins;
    }
    // Parsing cannot throw here: originWithinRpScope only says yes on a URL it parsed.
    if (new URL(clientOrigin).hostname !== cfg.rpID) return cfg.origins;
    return [...cfg.origins, clientOrigin];
  }

  /**
   * Pre-ceremony check of the request's Origin header against the resolved RP
   * config. A browser on an origin the derived localhost fallback can never
   * verify (nothing configured, accessed remotely) gets the actionable
   * not-configured 400 BEFORE the ceremony instead of a cryptic verify failure
   * after it. Any other mismatch is only logged: proxies may rewrite the
   * Origin header while clientDataJSON still carries the real one, and an
   * explicit origins list is the operator's contract. Requests without a
   * parseable http(s) Origin (curl, 'null') skip the check entirely.
   */
  private originCannotVerify(cfg: WebauthnConfig, requestOrigin: string | undefined): boolean {
    if (!requestOrigin) return false;
    let origin: string;
    try {
      const url = new URL(requestOrigin);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
      origin = url.origin;
    } catch {
      return false;
    }
    if (cfg.origins.includes(origin) || originWithinRpScope(origin, cfg.rpID)) return false;
    this.logger.warn(
      `Passkey ceremony requested from origin ${origin}, but the RP config resolves to rpID=${cfg.rpID}, origins=[${cfg.origins.join(', ')}] — set APP_URL or the webauthn_rp_id/webauthn_origins settings.`,
    );
    return !cfg.explicitOrigins && cfg.rpID === 'localhost';
  }

  // -------------------------------------------------------------------------
  // Registration (authenticated — from Settings, password re-auth required)
  // -------------------------------------------------------------------------

  async passkeyRegisterOptions(
    userId: number,
    password: string | undefined,
    requestOrigin?: string,
  ): Promise<{ options?: Awaited<ReturnType<typeof generateRegistrationOptions>> }> {
    const cfg = await this.webauthn.resolve();
    if (!cfg) throw refusal(NOT_CONFIGURED);
    if (this.originCannotVerify(cfg, requestOrigin)) throw refusal(NOT_CONFIGURED);

    const user = await this.users.findById(userId);
    if (!user) throw new DomainError(404, 'User not found');

    // Re-authentication: a hijacked session must not be able to silently plant an
    // attacker-controlled passkey. Require the current password (parity with the
    // change-password / disable-MFA step-up).
    if (!password || !user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
      throw new DomainError(401, 'Incorrect password');
    }

    const existing = await this.webauthnCredentials.listExcludeCredentials(userId);

    const now = Date.now();
    await this.purgeExpiredChallenges(now);

    const options = await generateRegistrationOptions({
      rpName: cfg.rpName,
      rpID: cfg.rpID,
      userName: user.email,
      userDisplayName: user.username,
      userID: new TextEncoder().encode(String(user.id)),
      attestationType: 'none',
      // Stop the same authenticator from enrolling twice on this account.
      excludeCredentials: existing.map((c) => ({ id: c.credential_id, transports: parseTransports(c.transports) })),
      authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
      supportedAlgorithmIDs: SUPPORTED_ALGORITHM_IDS,
    });

    await this.storeChallenge(options.challenge, userId, 'registration', now);
    return { options };
  }

  async passkeyRegisterVerify(
    userId: number,
    body: { attestationResponse?: unknown; name?: unknown },
  ): Promise<{ success?: boolean; credential?: unknown }> {
    const cfg = await this.webauthn.resolve();
    if (!cfg) throw refusal(NOT_CONFIGURED);

    const resp = body?.attestationResponse;
    if (!resp) throw new DomainError(400, 'Invalid registration response');

    const challenge = challengeFromResponse(resp);
    if (!challenge) throw new DomainError(400, 'Invalid registration response');

    const now = Date.now();
    const claimed = await this.claimChallenge(challenge, 'registration', now);
    if (!claimed || claimed.user_id !== userId) {
      throw new DomainError(400, 'Registration challenge expired. Please try again.');
    }

    const expectedOrigin = this.expectedOrigins(cfg, resp);
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: resp as Parameters<typeof verifyRegistrationResponse>[0]['response'],
        expectedChallenge: challenge,
        expectedOrigin,
        expectedRPID: cfg.rpID,
        requireUserVerification: true,
      });
    } catch (err) {
      // Body stays the generic 400 (parity), but the operator gets to see WHY —
      // origin/RP mismatches used to be swallowed entirely.
      this.logger.warn(
        `Passkey registration rejected (expectedRPID=${cfg.rpID}, expectedOrigin=[${expectedOrigin.join(', ')}]): ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new DomainError(400, 'Could not register this passkey.');
    }

    if (!verification.verified || !verification.registrationInfo) {
      throw new DomainError(400, 'Could not register this passkey.');
    }

    // Persist ONLY the values the verifier vouches for — never anything parsed
    // from the raw client payload.
    const { credential, credentialDeviceType, credentialBackedUp, aaguid } = verification.registrationInfo;

    const name = sanitizeName(body?.name) || defaultCredentialName(credentialDeviceType);
    // Duplicate check + INSERT in one transaction so the UNIQUE race can't slip
    // between them; the sentinel keeps the legacy 409-vs-400 split intact.
    try {
      await this.uow.transactional(async () => {
        if (await this.webauthnCredentials.existsByCredentialId(credential.id)) {
          throw DUPLICATE_CREDENTIAL;
        }
        await this.webauthnCredentials.insertCredential({
          user_id: userId,
          credential_id: credential.id,
          public_key: Buffer.from(credential.publicKey),
          counter: credential.counter ?? 0,
          transports: credential.transports ? JSON.stringify(credential.transports) : null,
          device_type: credentialDeviceType ?? null,
          backed_up: credentialBackedUp ? 1 : 0,
          name,
          aaguid: aaguid ?? null,
        });
      });
    } catch (err) {
      if (err === DUPLICATE_CREDENTIAL) {
        throw new DomainError(409, 'This passkey is already registered.');
      }
      throw new DomainError(400, 'Could not register this passkey.');
    }

    const created = (await this.webauthnCredentials.findCreatedCredential(credential.id))!;
    return { success: true, credential: { ...created, backed_up: created.backed_up === 1 } };
  }

  // -------------------------------------------------------------------------
  // Authentication (public — primary, discoverable-credential login)
  // -------------------------------------------------------------------------

  async passkeyLoginOptions(requestOrigin?: string): Promise<{
    options?: Awaited<ReturnType<typeof generateAuthenticationOptions>>;
  }> {
    const cfg = await this.webauthn.resolve();
    if (!cfg) throw refusal(NOT_CONFIGURED);
    if (this.originCannotVerify(cfg, requestOrigin)) throw refusal(NOT_CONFIGURED);

    const now = Date.now();
    await this.purgeExpiredChallenges(now);

    const options = await generateAuthenticationOptions({
      rpID: cfg.rpID,
      userVerification: 'required',
      // Empty allowCredentials → discoverable flow. The server never echoes which
      // accounts have passkeys, so the endpoint can't be used to enumerate users.
    });

    await this.storeChallenge(options.challenge, null, 'authentication', now);
    return { options };
  }

  async passkeyLoginVerify(
    body: { assertionResponse?: unknown },
    client?: SessionClient,
  ): Promise<{
    error?: string;
    status?: number;
    token?: string;
    user?: Record<string, unknown>;
    auditUserId?: number | null;
    auditAction?: string;
  }> {
    const cfg = await this.webauthn.resolve();
    if (!cfg) return { ...NOT_CONFIGURED };

    const resp = body?.assertionResponse;
    if (!resp) return { ...AUTH_FAILED };

    const challenge = challengeFromResponse(resp);
    if (!challenge) return { ...AUTH_FAILED };

    // Claim the challenge (single-use) BEFORE looking anything up or verifying.
    const now = Date.now();
    if (!(await this.claimChallenge(challenge, 'authentication', now))) return { ...AUTH_FAILED };

    const credId = (resp as { id?: unknown; rawId?: unknown }).id ?? (resp as { rawId?: unknown }).rawId;
    if (typeof credId !== 'string') return { ...AUTH_FAILED };

    const cred = await this.webauthnCredentials.findByCredentialId(credId);
    if (!cred) return { ...AUTH_FAILED };

    const expectedOrigin = this.expectedOrigins(cfg, resp);
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: resp as Parameters<typeof verifyAuthenticationResponse>[0]['response'],
        expectedChallenge: challenge,
        expectedOrigin,
        expectedRPID: cfg.rpID,
        requireUserVerification: true,
        credential: {
          id: cred.credential_id,
          publicKey: new Uint8Array(cred.public_key),
          counter: cred.counter,
          transports: parseTransports(cred.transports),
        },
      });
    } catch (err) {
      this.logger.warn(
        `Passkey login rejected (expectedRPID=${cfg.rpID}, expectedOrigin=[${expectedOrigin.join(', ')}]): ${err instanceof Error ? err.message : String(err)}`,
      );
      return { ...AUTH_FAILED };
    }

    if (!verification.verified) return { ...AUTH_FAILED };

    const { newCounter } = verification.authenticationInfo;
    // Clone detection only makes sense for authenticators that actually increment.
    // Synced passkeys legitimately report a counter that stays 0 — never treat
    // that as a clone. A regression from a previously NON-ZERO counter rejects
    // THIS assertion (and is audited) but does not disable the credential.
    if (cred.counter > 0 && newCounter <= cred.counter) {
      return { ...AUTH_FAILED, auditUserId: cred.user_id, auditAction: 'user.passkey_clone_suspected' };
    }

    const user = await this.users.findById(cred.user_id);
    if (!user) return { ...AUTH_FAILED };

    // Persist the new counter + last-used and bump login bookkeeping atomically.
    await this.uow.transactional(async () => {
      await this.webauthnCredentials.updateCounterAndLastUsed(cred.id, newCounter);
      await this.users.touchLastLogin(user.id);
    });

    // A user-verified passkey is phishing-resistant and inherently two-factor
    // (device possession + biometric/PIN), so it mints the real session directly
    // — the SAME path as password and OIDC login (no new token shape).
    const token = await this.auth.generateToken(user, undefined, client);
    const userSafe = stripUserForClient(toClientUser(user)) as Record<string, unknown>;
    return { token, user: { ...userSafe, avatar_url: avatarUrl(user) }, auditUserId: Number(user.id) };
  }

  // -------------------------------------------------------------------------
  // Management (authenticated, owner-scoped)
  // -------------------------------------------------------------------------

  async listPasskeys(userId: number): Promise<Array<Record<string, unknown>>> {
    const rows = await this.webauthnCredentials.listForPanel(userId);
    return rows.map((r) => ({ ...r, backed_up: r.backed_up === 1 }));
  }

  async renamePasskey(userId: number, id: string, name: unknown): Promise<{ success?: boolean }> {
    const cleanName = sanitizeName(name);
    if (!cleanName) throw new DomainError(400, 'Name is required');
    // Convert, VALIDATE, and answer the legacy not-found before the
    // repository call (program rule 15): the legacy `UPDATE ... WHERE id = ?
    // AND user_id = ?` bound `Number(id)` as a plain parameter — a
    // non-numeric route id produced `NaN`, which SQLite compared against the
    // INTEGER `id` column and never matched (`NaN` is never `=` to
    // anything), so `changes === 0` and this returned its ordinary 404. A
    // typed MikroORM filter has no such leniency: it renders a JS `NaN` as
    // the bare, unquoted token `NaN`, which SQLite parses as a column
    // reference and throws — a 500 where the legacy 404'd (Plan 3b Task 3
    // review, F1).
    const rowId = toRowId(id);
    if (rowId === null) throw new DomainError(404, 'Passkey not found');
    // Ownership enforced in SQL (404 on miss, never a 403 that leaks existence).
    const changes = await this.webauthnCredentials.renameOwned(rowId, userId, cleanName);
    if (changes === 0) throw new DomainError(404, 'Passkey not found');
    return { success: true };
  }

  async deletePasskey(userId: number, id: string, password: string | undefined): Promise<{ success?: boolean }> {
    // Re-auth before removing a credential (a hijacked session must not be able to
    // strip the victim's passkeys). Deleting is always allowed because every
    // account keeps a usable password as recovery fallback — losing all passkeys
    // can never lock anyone out.
    const passwordHash = await this.users.getPasswordHash(userId);
    if (!passwordHash || !password || !bcrypt.compareSync(password, passwordHash)) {
      throw new DomainError(401, 'Incorrect password');
    }
    // Same guard as `renamePasskey` (F1) — placed after the password check
    // to match the legacy statement order exactly (a wrong password still
    // answers 401 before a bad id is ever considered).
    const rowId = toRowId(id);
    if (rowId === null) throw new DomainError(404, 'Passkey not found');
    const changes = await this.webauthnCredentials.deleteOwned(rowId, userId);
    if (changes === 0) throw new DomainError(404, 'Passkey not found');
    return { success: true };
  }

  /** Admin: clear all of a user's passkeys (e.g. on suspected compromise). */
  async adminResetPasskeys(targetUserId: number): Promise<{ success?: boolean; deleted?: number; email?: string }> {
    // `AdminService.resetUserPasskeys` converts the route param with a bare
    // `Number(id)` before calling in — a non-numeric id arrives here as
    // `NaN`, still typed `number` at the JS level. Same F1 guard: validate
    // before the repository call and answer the legacy 404 (the raw
    // `SELECT id, email FROM users WHERE id = ?` bound `Number(id)` too and
    // simply matched no row).
    const rowId = toRowId(targetUserId);
    if (rowId === null) throw new DomainError(404, 'User not found');
    const target = await this.users.findIdAndEmail(rowId);
    if (!target) throw new DomainError(404, 'User not found');
    const deleted = await this.webauthnCredentials.deleteAllForUser(rowId);
    return { success: true, deleted, email: target.email };
  }
}
