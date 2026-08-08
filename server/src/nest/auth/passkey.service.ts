import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import { WebauthnConfigService } from './webauthn-config.service';
import { avatarUrl } from '../common/avatarUrl';
import { stripUserForClient } from './auth.helpers';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import type { User } from '../../types';

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

// Reference-compared sentinel (oidc invite_exhausted precedent): thrown inside
// the register transaction to keep the duplicate 409 distinct from the generic
// insert-failure 400 without string-matching SQLite errors.
const DUPLICATE_CREDENTIAL = new Error('duplicate credential');

interface CredentialRow {
  id: number;
  user_id: number;
  credential_id: string;
  public_key: Buffer;
  counter: number;
  transports: string | null;
  device_type: string | null;
  backed_up: number;
  name: string | null;
  aaguid: string | null;
  created_at: string;
  last_used_at: string | null;
}

function challengeFromResponse(resp: unknown): string | null {
  try {
    const cdj = (resp as { response?: { clientDataJSON?: unknown } })?.response?.clientDataJSON;
    if (typeof cdj !== 'string') return null;
    const parsed = JSON.parse(Buffer.from(cdj, 'base64url').toString('utf8')) as { challenge?: unknown };
    return typeof parsed.challenge === 'string' ? parsed.challenge : null;
  } catch {
    return null;
  }
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
 * WebAuthn (passkey) registration, discoverable-credential login and
 * credential management. No instance state — the challenge store is DB-backed
 * (single-use, TTL'd) precisely so it survives restarts and is shared across
 * processes.
 */
@Injectable()
export class PasskeyService {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: AuthService,
    private readonly webauthn: WebauthnConfigService,
  ) {}

  // -------------------------------------------------------------------------
  // Challenge store (DB-backed, single-use, TTL'd)
  // -------------------------------------------------------------------------

  private purgeExpiredChallenges(now: number): void {
    this.db.run('DELETE FROM webauthn_challenges WHERE expires_at < ?', now);
  }

  private storeChallenge(challenge: string, userId: number | null, type: 'registration' | 'authentication', now: number): void {
    this.db.run(
      'INSERT INTO webauthn_challenges (challenge, user_id, type, expires_at) VALUES (?, ?, ?, ?)',
      challenge, userId, type, now + CHALLENGE_TTL_MS,
    );
  }

  /**
   * Atomically claim a challenge by its EXACT bytes + type. This is a single
   * DELETE ... RETURNING statement that runs BEFORE any async verification, so a
   * concurrent double-submit of the same assertion can never spend one challenge
   * twice (the replay window a SELECT→await→DELETE ordering would open).
   */
  private claimChallenge(challenge: string, type: 'registration' | 'authentication', now: number): { user_id: number | null } | null {
    const row = this.db.get<{ user_id: number | null }>(
      'DELETE FROM webauthn_challenges WHERE challenge = ? AND type = ? AND expires_at > ? RETURNING user_id',
      challenge, type, now,
    );
    return row ?? null;
  }

  // -------------------------------------------------------------------------
  // Registration (authenticated — from Settings, password re-auth required)
  // -------------------------------------------------------------------------

  async passkeyRegisterOptions(
    userId: number,
    password: string | undefined,
  ): Promise<{ error?: string; status?: number; options?: Awaited<ReturnType<typeof generateRegistrationOptions>> }> {
    const cfg = this.webauthn.resolve();
    if (!cfg) return { ...NOT_CONFIGURED };

    const user = this.db.get<User>('SELECT * FROM users WHERE id = ?', userId);
    if (!user) return { error: 'User not found', status: 404 };

    // Re-authentication: a hijacked session must not be able to silently plant an
    // attacker-controlled passkey. Require the current password (parity with the
    // change-password / disable-MFA step-up).
    if (!password || !user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
      return { error: 'Incorrect password', status: 401 };
    }

    const existing = this.db.all<{ credential_id: string; transports: string | null }>(
      'SELECT credential_id, transports FROM webauthn_credentials WHERE user_id = ?', userId,
    );

    const now = Date.now();
    this.purgeExpiredChallenges(now);

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

    this.storeChallenge(options.challenge, userId, 'registration', now);
    return { options };
  }

  async passkeyRegisterVerify(
    userId: number,
    body: { attestationResponse?: unknown; name?: unknown },
  ): Promise<{ error?: string; status?: number; success?: boolean; credential?: unknown }> {
    const cfg = this.webauthn.resolve();
    if (!cfg) return { ...NOT_CONFIGURED };

    const resp = body?.attestationResponse;
    if (!resp) return { error: 'Invalid registration response', status: 400 };

    const challenge = challengeFromResponse(resp);
    if (!challenge) return { error: 'Invalid registration response', status: 400 };

    const now = Date.now();
    const claimed = this.claimChallenge(challenge, 'registration', now);
    if (!claimed || claimed.user_id !== userId) {
      return { error: 'Registration challenge expired. Please try again.', status: 400 };
    }

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: resp as Parameters<typeof verifyRegistrationResponse>[0]['response'],
        expectedChallenge: challenge,
        expectedOrigin: cfg.origins,
        expectedRPID: cfg.rpID,
        requireUserVerification: true,
      });
    } catch {
      return { error: 'Could not register this passkey.', status: 400 };
    }

    if (!verification.verified || !verification.registrationInfo) {
      return { error: 'Could not register this passkey.', status: 400 };
    }

    // Persist ONLY the values the verifier vouches for — never anything parsed
    // from the raw client payload.
    const { credential, credentialDeviceType, credentialBackedUp, aaguid } = verification.registrationInfo;

    const name = sanitizeName(body?.name) || defaultCredentialName(credentialDeviceType);
    // Duplicate check + INSERT in one transaction so the UNIQUE race can't slip
    // between them; the sentinel keeps the legacy 409-vs-400 split intact.
    try {
      this.db.transaction((conn) => {
        if (conn.prepare('SELECT id FROM webauthn_credentials WHERE credential_id = ?').get(credential.id)) {
          throw DUPLICATE_CREDENTIAL;
        }
        conn.prepare(
          `INSERT INTO webauthn_credentials
             (user_id, credential_id, public_key, counter, transports, device_type, backed_up, name, aaguid, last_used_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        ).run(
          userId,
          credential.id,
          Buffer.from(credential.publicKey),
          credential.counter ?? 0,
          credential.transports ? JSON.stringify(credential.transports) : null,
          credentialDeviceType ?? null,
          credentialBackedUp ? 1 : 0,
          name,
          aaguid ?? null,
        );
      });
    } catch (err) {
      if (err === DUPLICATE_CREDENTIAL) {
        return { error: 'This passkey is already registered.', status: 409 };
      }
      return { error: 'Could not register this passkey.', status: 400 };
    }

    const created = this.db.get<{ backed_up: number } & Record<string, unknown>>(
      'SELECT id, name, device_type, backed_up, created_at, last_used_at FROM webauthn_credentials WHERE credential_id = ?',
      credential.id,
    ) as { backed_up: number } & Record<string, unknown>;
    return { success: true, credential: { ...created, backed_up: created.backed_up === 1 } };
  }

  // -------------------------------------------------------------------------
  // Authentication (public — primary, discoverable-credential login)
  // -------------------------------------------------------------------------

  async passkeyLoginOptions(): Promise<{
    error?: string;
    status?: number;
    options?: Awaited<ReturnType<typeof generateAuthenticationOptions>>;
  }> {
    const cfg = this.webauthn.resolve();
    if (!cfg) return { ...NOT_CONFIGURED };

    const now = Date.now();
    this.purgeExpiredChallenges(now);

    const options = await generateAuthenticationOptions({
      rpID: cfg.rpID,
      userVerification: 'required',
      // Empty allowCredentials → discoverable flow. The server never echoes which
      // accounts have passkeys, so the endpoint can't be used to enumerate users.
    });

    this.storeChallenge(options.challenge, null, 'authentication', now);
    return { options };
  }

  async passkeyLoginVerify(body: { assertionResponse?: unknown }): Promise<{
    error?: string;
    status?: number;
    token?: string;
    user?: Record<string, unknown>;
    auditUserId?: number | null;
    auditAction?: string;
  }> {
    const cfg = this.webauthn.resolve();
    if (!cfg) return { ...NOT_CONFIGURED };

    const resp = body?.assertionResponse;
    if (!resp) return { ...AUTH_FAILED };

    const challenge = challengeFromResponse(resp);
    if (!challenge) return { ...AUTH_FAILED };

    // Claim the challenge (single-use) BEFORE looking anything up or verifying.
    const now = Date.now();
    if (!this.claimChallenge(challenge, 'authentication', now)) return { ...AUTH_FAILED };

    const credId = (resp as { id?: unknown; rawId?: unknown }).id ?? (resp as { rawId?: unknown }).rawId;
    if (typeof credId !== 'string') return { ...AUTH_FAILED };

    const cred = this.db.get<CredentialRow>('SELECT * FROM webauthn_credentials WHERE credential_id = ?', credId);
    if (!cred) return { ...AUTH_FAILED };

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: resp as Parameters<typeof verifyAuthenticationResponse>[0]['response'],
        expectedChallenge: challenge,
        expectedOrigin: cfg.origins,
        expectedRPID: cfg.rpID,
        requireUserVerification: true,
        credential: {
          id: cred.credential_id,
          publicKey: new Uint8Array(cred.public_key),
          counter: cred.counter,
          transports: parseTransports(cred.transports),
        },
      });
    } catch {
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

    const user = this.db.get<User>('SELECT * FROM users WHERE id = ?', cred.user_id);
    if (!user) return { ...AUTH_FAILED };

    // Persist the new counter + last-used and bump login bookkeeping atomically.
    this.db.transaction((conn) => {
      conn.prepare('UPDATE webauthn_credentials SET counter = ?, last_used_at = CURRENT_TIMESTAMP WHERE id = ?').run(newCounter, cred.id);
      conn.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = ?').run(user.id);
    });

    // A user-verified passkey is phishing-resistant and inherently two-factor
    // (device possession + biometric/PIN), so it mints the real session directly
    // — the SAME path as password and OIDC login (no new token shape).
    const token = this.auth.generateToken(user);
    const userSafe = stripUserForClient(user) as Record<string, unknown>;
    return { token, user: { ...userSafe, avatar_url: avatarUrl(user) }, auditUserId: Number(user.id) };
  }

  // -------------------------------------------------------------------------
  // Management (authenticated, owner-scoped)
  // -------------------------------------------------------------------------

  listPasskeys(userId: number): Array<Record<string, unknown>> {
    const rows = this.db.all<{ backed_up: number } & Record<string, unknown>>(
      'SELECT id, name, device_type, backed_up, created_at, last_used_at FROM webauthn_credentials WHERE user_id = ? ORDER BY created_at DESC',
      userId,
    );
    return rows.map((r) => ({ ...r, backed_up: r.backed_up === 1 }));
  }

  renamePasskey(userId: number, id: string, name: unknown): { error?: string; status?: number; success?: boolean } {
    const cleanName = sanitizeName(name);
    if (!cleanName) return { error: 'Name is required', status: 400 };
    // Ownership enforced in SQL (404 on miss, never a 403 that leaks existence).
    const result = this.db.run('UPDATE webauthn_credentials SET name = ? WHERE id = ? AND user_id = ?', cleanName, Number(id), userId);
    if (result.changes === 0) return { error: 'Passkey not found', status: 404 };
    return { success: true };
  }

  deletePasskey(
    userId: number,
    id: string,
    password: string | undefined,
  ): { error?: string; status?: number; success?: boolean } {
    // Re-auth before removing a credential (a hijacked session must not be able to
    // strip the victim's passkeys). Deleting is always allowed because every
    // account keeps a usable password as recovery fallback — losing all passkeys
    // can never lock anyone out.
    const user = this.db.get<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = ?', userId);
    if (!user || !user.password_hash || !password || !bcrypt.compareSync(password, user.password_hash)) {
      return { error: 'Incorrect password', status: 401 };
    }
    const result = this.db.run('DELETE FROM webauthn_credentials WHERE id = ? AND user_id = ?', Number(id), userId);
    if (result.changes === 0) return { error: 'Passkey not found', status: 404 };
    return { success: true };
  }

  /** Admin: clear all of a user's passkeys (e.g. on suspected compromise). */
  adminResetPasskeys(targetUserId: number): { error?: string; status?: number; success?: boolean; deleted?: number; email?: string } {
    const target = this.db.get<{ id: number; email: string }>('SELECT id, email FROM users WHERE id = ?', targetUserId);
    if (!target) return { error: 'User not found', status: 404 };
    const result = this.db.run('DELETE FROM webauthn_credentials WHERE user_id = ?', targetUserId);
    return { success: true, deleted: result.changes, email: target.email };
  }
}
