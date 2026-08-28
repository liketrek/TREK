/**
 * Unit tests for the DI-native PasskeyService — PASSKEY-SVC-001 through
 * PASSKEY-SVC-032. Written fresh with the DI fold: the legacy
 * services/passkeyService had no service-level suite, so these characterize
 * the relocated behavior (challenge store semantics, WebAuthn ceremony error
 * paths, clone detection, management CRUD) over a real in-memory SQLite DB;
 * 031–032 pin the post-fold `fix(server)` quirk fix (the transactional
 * dup-check → INSERT with its 409-vs-400 sentinel split).
 * The @simplewebauthn/server ceremony functions are mocked — the library's
 * crypto is not under test, the service's handling of its verdicts is.
 * Constructed directly (no TestingModule, repo convention).
 */
import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';
import { AuthService } from '../../../src/nest/auth/auth.service';
import { EphemeralTokenService } from '../../../src/nest/auth/ephemeral-token.service';
import { PasskeyService } from '../../../src/nest/auth/passkey.service';
import { UserCleanupService } from '../../../src/nest/auth/user-cleanup.service';
import { WebauthnConfigService } from '../../../src/nest/auth/webauthn-config.service';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { AllowedFileTypesService } from '../../../src/nest/files/allowed-file-types.service';
import { MailerService } from '../../../src/nest/notifications/mailer/mailer.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { TripMembershipService } from '../../../src/nest/trip-membership/trip-membership.service';
import { createUser } from '../../helpers/factories';
import { resetTestDb } from '../../helpers/test-db';

import jwtLib from 'jsonwebtoken';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup ──────────────────────────────────────────────────────────────────

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  // Passkeys are trip-free, so the trip-access helpers are inert stubs.
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => undefined,
    isOwner: () => false,
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  SESSION_DURATION_SECONDS: 86400,
  SESSION_DURATION_REMEMBER_SECONDS: 2592000,
  updateJwtSecret: () => {},
}));

// Construction insurance for the injected AuthService's import graph (same set
// as oidc.service.test.ts / auth.service.test.ts).
vi.mock('../../../src/nest/common/crypto/mfaCrypto', () => ({
  encryptMfaSecret: vi.fn((s) => `enc:${s}`),
  decryptMfaSecret: vi.fn((s: string) => s.replace('enc:', '')),
}));
vi.mock('../../../src/nest/common/crypto/apiKeyCrypto', () => ({
  decrypt_api_key: vi.fn((v) => v),
  maybe_encrypt_api_key: vi.fn((v) => v),
  mask_stored_api_key: vi.fn((v: string | null | undefined) => (v ? '••••••••' : null)),
  encrypt_api_key: vi.fn((v) => v),
}));
vi.mock('../../../src/nest/auth/ephemeral-tokens', () => ({ createEphemeralToken: vi.fn() }));
vi.mock('../../../src/mcp/sessionManager', () => ({ revokeUserSessions: vi.fn() }));

// The WebAuthn ceremony verdicts are the mock boundary — the service must
// persist ONLY what the verifier vouches for, so the tests hand it verdicts.
const { swMock } = vi.hoisted(() => ({
  swMock: {
    generateRegistrationOptions: vi.fn(),
    verifyRegistrationResponse: vi.fn(),
    generateAuthenticationOptions: vi.fn(),
    verifyAuthenticationResponse: vi.fn(),
  },
}));
vi.mock('@simplewebauthn/server', () => swMock);

// MailerService is injected since the notifications fold — a stub instead of a
// module mock. sendPasswordResetEmail is the only thing auth reaches for.
const mailerStub = { sendPasswordResetEmail: vi.fn() } as unknown as MailerService;

// The RP config resolver has its own suite (webauthn-config.service.test.ts);
// here it is a switch for the configured / not-configured branches, handed in
// as a stub now that PasskeyService injects it.
const resolveWebauthnConfigMock = vi.fn();
const webauthn = { resolve: resolveWebauthnConfigMock } as unknown as WebauthnConfigService;

// Positional, and previously shifted by one: an AtlasService sat in the
// membership slot, which AuthService no longer takes at all, so
// webauthn/userCleanup/mailer each landed one place too late and the
// EphemeralTokenService was missing entirely. Nothing failed, because the only
// thing PasskeyService asks AuthService for is generateToken, which reads the
// database and nothing else. The collaborators are real here rather than
// undefined so a future case that does reach one gets a working object; each
// takes only the DatabaseService. AuthService's own webauthn is the real
// resolver, separate from the `webauthn` switch PasskeyService is handed.
const auth = new AuthService(
  new DatabaseService(testDb),
  new PermissionsService(new DatabaseService(testDb)),
  new TripMembershipService(new DatabaseService(testDb)),
  new WebauthnConfigService(new DatabaseService(testDb)),
  new UserCleanupService(
    new DatabaseService(testDb),
    new BudgetService(
      new DatabaseService(testDb),
      new PermissionsService(new DatabaseService(testDb)),
      new ExchangeRatesService(new DatabaseService(testDb)),
      new RealtimeService(),
    ),
  ),
  mailerStub,
  new EphemeralTokenService(),
  new AllowedFileTypesService(new DatabaseService(testDb)),
);
const svc = new PasskeyService(new DatabaseService(testDb), auth, webauthn);

const CFG = { rpID: 'trek.example.com', rpName: 'TREK', origins: ['https://trek.example.com'] };
const NOT_CONFIGURED_ERROR = 'Passkey login is not configured for this server.';

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  vi.clearAllMocks();
  resolveWebauthnConfigMock.mockReturnValue(CFG);
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

// ── helpers ───────────────────────────────────────────────────────────────────

/** A response payload whose clientDataJSON echoes the given challenge. */
function ceremonyResponse(challenge: string, extra: Record<string, unknown> = {}) {
  return {
    response: { clientDataJSON: Buffer.from(JSON.stringify({ challenge }), 'utf8').toString('base64url') },
    ...extra,
  };
}

function seedChallenge(
  challenge: string,
  userId: number | null,
  type: 'registration' | 'authentication',
  expiresAt = Date.now() + 60_000,
) {
  testDb
    .prepare('INSERT INTO webauthn_challenges (challenge, user_id, type, expires_at) VALUES (?, ?, ?, ?)')
    .run(challenge, userId, type, expiresAt);
}

function challengeCount(): number {
  return (testDb.prepare('SELECT COUNT(*) AS n FROM webauthn_challenges').get() as { n: number }).n;
}

let _credSeq = 0;
function insertCredential(userId: number, overrides: Record<string, unknown> = {}) {
  _credSeq++;
  const row = {
    credential_id: `cred-${_credSeq}`,
    public_key: Buffer.from([1, 2, 3]),
    counter: 0,
    transports: null,
    device_type: 'singleDevice',
    backed_up: 0,
    name: `Passkey ${_credSeq}`,
    aaguid: null,
    ...overrides,
  };
  const result = testDb
    .prepare(
      `INSERT INTO webauthn_credentials
       (user_id, credential_id, public_key, counter, transports, device_type, backed_up, name, aaguid)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      userId,
      row.credential_id,
      row.public_key,
      row.counter,
      row.transports,
      row.device_type,
      row.backed_up,
      row.name,
      row.aaguid,
    );
  return { id: Number(result.lastInsertRowid), ...row };
}

function registrationVerdict(
  overrides: Record<string, unknown> = {},
  credentialOverrides: Record<string, unknown> = {},
) {
  return {
    verified: true,
    registrationInfo: {
      credential: {
        id: 'new-cred',
        publicKey: new Uint8Array([9, 9, 9]),
        counter: 0,
        transports: ['internal'],
        ...credentialOverrides,
      },
      credentialDeviceType: 'singleDevice',
      credentialBackedUp: false,
      aaguid: 'aaguid-1',
      ...overrides,
    },
  };
}

// ── passkeyRegisterOptions ────────────────────────────────────────────────────

describe('passkeyRegisterOptions', () => {
  it('PASSKEY-SVC-001: returns the not-configured 400 when no RP config resolves', async () => {
    resolveWebauthnConfigMock.mockReturnValue(null);
    expect(await svc.passkeyRegisterOptions(1, 'pw')).toEqual({ error: NOT_CONFIGURED_ERROR, status: 400 });
  });

  it('PASSKEY-SVC-002: 404s for an unknown user', async () => {
    expect(await svc.passkeyRegisterOptions(999_999, 'pw')).toEqual({ error: 'User not found', status: 404 });
  });

  it('PASSKEY-SVC-003: requires the current password (missing and wrong both 401)', async () => {
    const { user, password } = createUser(testDb);
    expect(await svc.passkeyRegisterOptions(user.id, undefined)).toEqual({ error: 'Incorrect password', status: 401 });
    expect(await svc.passkeyRegisterOptions(user.id, `${password}x`)).toEqual({
      error: 'Incorrect password',
      status: 401,
    });
  });

  it('PASSKEY-SVC-004: generates options excluding existing credentials and stores the challenge', async () => {
    const { user, password } = createUser(testDb);
    insertCredential(user.id, { credential_id: 'cred-a', transports: JSON.stringify(['usb', 'nfc']) });
    insertCredential(user.id, { credential_id: 'cred-b', transports: 'not-json' });
    seedChallenge('stale', user.id, 'registration', Date.now() - 1000); // purged on the way in
    swMock.generateRegistrationOptions.mockResolvedValue({ challenge: 'reg-chal' });

    const result = await svc.passkeyRegisterOptions(user.id, password);
    expect(result).toEqual({ options: { challenge: 'reg-chal' } });

    const call = swMock.generateRegistrationOptions.mock.calls[0][0];
    expect(call.rpID).toBe(CFG.rpID);
    expect(call.rpName).toBe(CFG.rpName);
    expect(call.userName).toBe(user.email);
    expect(call.attestationType).toBe('none');
    expect(call.supportedAlgorithmIDs).toEqual([-8, -7, -257]);
    expect(call.authenticatorSelection).toEqual({ residentKey: 'preferred', userVerification: 'required' });
    expect(call.excludeCredentials).toEqual([
      { id: 'cred-a', transports: ['usb', 'nfc'] },
      { id: 'cred-b', transports: undefined }, // unparseable transports degrade to undefined
    ]);

    const stored = testDb.prepare('SELECT * FROM webauthn_challenges').all() as Array<Record<string, unknown>>;
    expect(stored).toHaveLength(1); // the expired row was purged
    expect(stored[0]).toMatchObject({ challenge: 'reg-chal', user_id: user.id, type: 'registration' });
    expect(Number(stored[0].expires_at)).toBeGreaterThan(Date.now());
  });
});

// ── passkeyRegisterVerify ─────────────────────────────────────────────────────

describe('passkeyRegisterVerify', () => {
  it('PASSKEY-SVC-005: returns the not-configured 400 when no RP config resolves', async () => {
    resolveWebauthnConfigMock.mockReturnValue(null);
    expect(await svc.passkeyRegisterVerify(1, { attestationResponse: {} })).toEqual({
      error: NOT_CONFIGURED_ERROR,
      status: 400,
    });
  });

  it('PASSKEY-SVC-006: 400s on a missing or undecodable attestation response', async () => {
    expect(await svc.passkeyRegisterVerify(1, {})).toEqual({ error: 'Invalid registration response', status: 400 });
    expect(
      await svc.passkeyRegisterVerify(1, {
        attestationResponse: { response: { clientDataJSON: '!!!not-base64-json' } },
      }),
    ).toEqual({ error: 'Invalid registration response', status: 400 });
  });

  it('PASSKEY-SVC-007: 400s on an unknown or expired challenge', async () => {
    const { user } = createUser(testDb);
    expect(await svc.passkeyRegisterVerify(user.id, { attestationResponse: ceremonyResponse('never-stored') })).toEqual(
      { error: 'Registration challenge expired. Please try again.', status: 400 },
    );
    seedChallenge('expired', user.id, 'registration', Date.now() - 1);
    expect(await svc.passkeyRegisterVerify(user.id, { attestationResponse: ceremonyResponse('expired') })).toEqual({
      error: 'Registration challenge expired. Please try again.',
      status: 400,
    });
  });

  it('PASSKEY-SVC-008: a challenge claimed by a different user fails — and the claim is single-use', async () => {
    const { user: alice } = createUser(testDb);
    const { user: bob } = createUser(testDb);
    seedChallenge('cross', alice.id, 'registration');
    expect(await svc.passkeyRegisterVerify(bob.id, { attestationResponse: ceremonyResponse('cross') })).toEqual({
      error: 'Registration challenge expired. Please try again.',
      status: 400,
    });
    // The mismatched claim still consumed the row: the rightful owner can't use it either.
    expect(challengeCount()).toBe(0);
    expect(await svc.passkeyRegisterVerify(alice.id, { attestationResponse: ceremonyResponse('cross') })).toEqual({
      error: 'Registration challenge expired. Please try again.',
      status: 400,
    });
  });

  it('PASSKEY-SVC-009: maps a throwing or unverified verifier to the generic 400', async () => {
    const { user } = createUser(testDb);
    seedChallenge('c1', user.id, 'registration');
    swMock.verifyRegistrationResponse.mockRejectedValue(new Error('boom'));
    expect(await svc.passkeyRegisterVerify(user.id, { attestationResponse: ceremonyResponse('c1') })).toEqual({
      error: 'Could not register this passkey.',
      status: 400,
    });

    seedChallenge('c2', user.id, 'registration');
    swMock.verifyRegistrationResponse.mockResolvedValue({ verified: false });
    expect(await svc.passkeyRegisterVerify(user.id, { attestationResponse: ceremonyResponse('c2') })).toEqual({
      error: 'Could not register this passkey.',
      status: 400,
    });
  });

  it('PASSKEY-SVC-010: 409s when the credential id is already registered', async () => {
    const { user } = createUser(testDb);
    insertCredential(user.id, { credential_id: 'dup-cred' });
    seedChallenge('c3', user.id, 'registration');
    swMock.verifyRegistrationResponse.mockResolvedValue(registrationVerdict({}, { id: 'dup-cred' }));
    expect(await svc.passkeyRegisterVerify(user.id, { attestationResponse: ceremonyResponse('c3') })).toEqual({
      error: 'This passkey is already registered.',
      status: 409,
    });
  });

  it('PASSKEY-SVC-011: persists the verifier-vouched credential and returns it re-selected', async () => {
    const { user } = createUser(testDb);
    seedChallenge('c4', user.id, 'registration');
    swMock.verifyRegistrationResponse.mockResolvedValue(registrationVerdict({}, { counter: 7 }));

    const result = await svc.passkeyRegisterVerify(user.id, {
      attestationResponse: ceremonyResponse('c4'),
      name: '  My Key  ',
    });
    expect(result.success).toBe(true);
    expect(result.credential).toMatchObject({
      name: 'My Key',
      device_type: 'singleDevice',
      backed_up: false,
      last_used_at: null,
    });

    const row = testDb.prepare('SELECT * FROM webauthn_credentials WHERE credential_id = ?').get('new-cred') as Record<
      string,
      unknown
    >;
    expect(row).toMatchObject({
      user_id: user.id,
      counter: 7,
      transports: JSON.stringify(['internal']),
      backed_up: 0,
      aaguid: 'aaguid-1',
    });
    expect(Buffer.from(row.public_key as Buffer)).toEqual(Buffer.from([9, 9, 9]));
  });

  it('PASSKEY-SVC-012: defaults a blank name by device type and caps a long one at 60 chars', async () => {
    const { user } = createUser(testDb);

    seedChallenge('c5', user.id, 'registration');
    swMock.verifyRegistrationResponse.mockResolvedValue(
      registrationVerdict({ credentialDeviceType: 'multiDevice', credentialBackedUp: true }, { id: 'synced-cred' }),
    );
    const synced = await svc.passkeyRegisterVerify(user.id, {
      attestationResponse: ceremonyResponse('c5'),
      name: '   ',
    });
    expect(synced.credential).toMatchObject({ name: 'Passkey (synced)', backed_up: true });

    seedChallenge('c6', user.id, 'registration');
    swMock.verifyRegistrationResponse.mockResolvedValue(registrationVerdict({}, { id: 'named-cred' }));
    const long = await svc.passkeyRegisterVerify(user.id, {
      attestationResponse: ceremonyResponse('c6'),
      name: 'x'.repeat(80),
    });
    expect(long.credential).toMatchObject({ name: 'x'.repeat(60) });
  });

  it('PASSKEY-SVC-013: an INSERT failure maps to the generic 400 (FK violation stand-in)', async () => {
    swMock.verifyRegistrationResponse.mockResolvedValue(registrationVerdict());
    // Claim passes (the challenge belongs to the caller id we pass), but no
    // such user row exists — the credential INSERT's FK trips the catch path.
    testDb.exec('PRAGMA foreign_keys = OFF');
    seedChallenge('c7', 999_999, 'registration');
    testDb.exec('PRAGMA foreign_keys = ON');
    expect(await svc.passkeyRegisterVerify(999_999, { attestationResponse: ceremonyResponse('c7') })).toEqual({
      error: 'Could not register this passkey.',
      status: 400,
    });
  });

  // 031/032 pin the post-fold quirk fix: the dup check + INSERT run in one
  // transaction, keeping the 409-vs-400 split and rolling back cleanly.
  it('PASSKEY-SVC-031: a failed INSERT rolls back without partial credential state', async () => {
    swMock.verifyRegistrationResponse.mockResolvedValue(registrationVerdict());
    testDb.exec('PRAGMA foreign_keys = OFF');
    seedChallenge('c8', 999_999, 'registration');
    testDb.exec('PRAGMA foreign_keys = ON');
    await svc.passkeyRegisterVerify(999_999, { attestationResponse: ceremonyResponse('c8') });
    expect(testDb.prepare('SELECT COUNT(*) AS n FROM webauthn_credentials').get()).toEqual({ n: 0 });
    expect(challengeCount()).toBe(0); // the claim stays spent — the challenge is not resurrected
  });

  it('PASSKEY-SVC-032: the in-transaction duplicate 409 leaves the original row untouched', async () => {
    const { user } = createUser(testDb);
    insertCredential(user.id, { credential_id: 'dup-cred-2', name: 'Original' });
    seedChallenge('c9', user.id, 'registration');
    swMock.verifyRegistrationResponse.mockResolvedValue(registrationVerdict({}, { id: 'dup-cred-2' }));
    expect(
      await svc.passkeyRegisterVerify(user.id, { attestationResponse: ceremonyResponse('c9'), name: 'Impostor' }),
    ).toEqual({ error: 'This passkey is already registered.', status: 409 });
    const row = testDb
      .prepare('SELECT name, user_id FROM webauthn_credentials WHERE credential_id = ?')
      .get('dup-cred-2') as Record<string, unknown>;
    expect(row).toEqual({ name: 'Original', user_id: user.id });
    expect(testDb.prepare('SELECT COUNT(*) AS n FROM webauthn_credentials').get()).toEqual({ n: 1 });
  });
});

// ── passkeyLoginOptions ───────────────────────────────────────────────────────

describe('passkeyLoginOptions', () => {
  it('PASSKEY-SVC-014: returns the not-configured 400 when no RP config resolves', async () => {
    resolveWebauthnConfigMock.mockReturnValue(null);
    expect(await svc.passkeyLoginOptions()).toEqual({ error: NOT_CONFIGURED_ERROR, status: 400 });
  });

  it('PASSKEY-SVC-015: stores an anonymous authentication challenge (discoverable flow)', async () => {
    seedChallenge('stale', null, 'authentication', Date.now() - 1000);
    swMock.generateAuthenticationOptions.mockResolvedValue({ challenge: 'auth-chal' });

    expect(await svc.passkeyLoginOptions()).toEqual({ options: { challenge: 'auth-chal' } });
    // No allowCredentials → the endpoint can't enumerate accounts.
    expect(swMock.generateAuthenticationOptions.mock.calls[0][0]).toEqual({
      rpID: CFG.rpID,
      userVerification: 'required',
    });

    const stored = testDb.prepare('SELECT * FROM webauthn_challenges').all() as Array<Record<string, unknown>>;
    expect(stored).toHaveLength(1); // the expired row was purged
    expect(stored[0]).toMatchObject({ challenge: 'auth-chal', user_id: null, type: 'authentication' });
  });
});

// ── passkeyLoginVerify ────────────────────────────────────────────────────────

describe('passkeyLoginVerify', () => {
  it('PASSKEY-SVC-016: returns the not-configured 400, not the generic 401', async () => {
    resolveWebauthnConfigMock.mockReturnValue(null);
    expect(await svc.passkeyLoginVerify({ assertionResponse: {} })).toEqual({
      error: NOT_CONFIGURED_ERROR,
      status: 400,
    });
  });

  it('PASSKEY-SVC-017: every malformed-input path collapses into the uniform 401', async () => {
    expect(await svc.passkeyLoginVerify({})).toEqual({ error: 'Authentication failed', status: 401 });
    expect(await svc.passkeyLoginVerify({ assertionResponse: { response: { clientDataJSON: 42 } } })).toEqual({
      error: 'Authentication failed',
      status: 401,
    });
    // Unknown challenge
    expect(await svc.passkeyLoginVerify({ assertionResponse: ceremonyResponse('never-stored') })).toEqual({
      error: 'Authentication failed',
      status: 401,
    });
    // Claimed challenge but no usable credential id
    seedChallenge('a1', null, 'authentication');
    expect(await svc.passkeyLoginVerify({ assertionResponse: ceremonyResponse('a1', { id: 123 }) })).toEqual({
      error: 'Authentication failed',
      status: 401,
    });
  });

  it('PASSKEY-SVC-018: the challenge is spent on first use, even when verification fails', async () => {
    const { user } = createUser(testDb);
    insertCredential(user.id, { credential_id: 'known' });
    seedChallenge('a2', null, 'authentication');
    swMock.verifyAuthenticationResponse.mockRejectedValue(new Error('bad signature'));

    expect(await svc.passkeyLoginVerify({ assertionResponse: ceremonyResponse('a2', { id: 'known' }) })).toEqual({
      error: 'Authentication failed',
      status: 401,
    });
    expect(challengeCount()).toBe(0);
    // A double-submit of the same assertion cannot spend the challenge twice.
    expect(await svc.passkeyLoginVerify({ assertionResponse: ceremonyResponse('a2', { id: 'known' }) })).toEqual({
      error: 'Authentication failed',
      status: 401,
    });
    expect(swMock.verifyAuthenticationResponse).toHaveBeenCalledTimes(1);
  });

  it('PASSKEY-SVC-019: unknown credential and unverified assertion both yield the uniform 401', async () => {
    seedChallenge('a3', null, 'authentication');
    expect(await svc.passkeyLoginVerify({ assertionResponse: ceremonyResponse('a3', { id: 'no-such-cred' }) })).toEqual(
      { error: 'Authentication failed', status: 401 },
    );

    const { user } = createUser(testDb);
    insertCredential(user.id, { credential_id: 'known-2' });
    seedChallenge('a4', null, 'authentication');
    swMock.verifyAuthenticationResponse.mockResolvedValue({ verified: false });
    expect(await svc.passkeyLoginVerify({ assertionResponse: ceremonyResponse('a4', { id: 'known-2' }) })).toEqual({
      error: 'Authentication failed',
      status: 401,
    });
  });

  it('PASSKEY-SVC-020: falls back to rawId when id is absent', async () => {
    const { user } = createUser(testDb);
    insertCredential(user.id, { credential_id: 'raw-cred', counter: 0 });
    seedChallenge('a5', null, 'authentication');
    swMock.verifyAuthenticationResponse.mockResolvedValue({ verified: true, authenticationInfo: { newCounter: 0 } });

    const result = await svc.passkeyLoginVerify({ assertionResponse: ceremonyResponse('a5', { rawId: 'raw-cred' }) });
    expect(result.token).toBeTruthy();
  });

  it('PASSKEY-SVC-021: flags a counter regression as a suspected clone and audits it', async () => {
    const { user } = createUser(testDb);
    const cred = insertCredential(user.id, { credential_id: 'cloned', counter: 10 });
    seedChallenge('a6', null, 'authentication');
    swMock.verifyAuthenticationResponse.mockResolvedValue({ verified: true, authenticationInfo: { newCounter: 10 } });

    expect(await svc.passkeyLoginVerify({ assertionResponse: ceremonyResponse('a6', { id: 'cloned' }) })).toEqual({
      error: 'Authentication failed',
      status: 401,
      auditUserId: user.id,
      auditAction: 'user.passkey_clone_suspected',
    });
    // Rejects THIS assertion only — the credential is not disabled or touched.
    const row = testDb
      .prepare('SELECT counter, last_used_at FROM webauthn_credentials WHERE id = ?')
      .get(cred.id) as Record<string, unknown>;
    expect(row).toEqual({ counter: 10, last_used_at: null });
  });

  it('PASSKEY-SVC-022: never treats a synced passkey stuck at counter 0 as a clone', async () => {
    const { user } = createUser(testDb);
    insertCredential(user.id, { credential_id: 'synced', counter: 0, device_type: 'multiDevice' });
    seedChallenge('a7', null, 'authentication');
    swMock.verifyAuthenticationResponse.mockResolvedValue({ verified: true, authenticationInfo: { newCounter: 0 } });

    const result = await svc.passkeyLoginVerify({ assertionResponse: ceremonyResponse('a7', { id: 'synced' }) });
    expect(result.error).toBeUndefined();
    expect(result.token).toBeTruthy();
  });

  it('PASSKEY-SVC-023: a credential whose user row is gone yields the uniform 401', async () => {
    // Orphan credential (FK off for the seed only) — the user lookup misses.
    testDb.exec('PRAGMA foreign_keys = OFF');
    insertCredential(424_242, { credential_id: 'orphan' });
    testDb.exec('PRAGMA foreign_keys = ON');
    seedChallenge('a8', null, 'authentication');
    swMock.verifyAuthenticationResponse.mockResolvedValue({ verified: true, authenticationInfo: { newCounter: 1 } });

    expect(await svc.passkeyLoginVerify({ assertionResponse: ceremonyResponse('a8', { id: 'orphan' }) })).toEqual({
      error: 'Authentication failed',
      status: 401,
    });
  });

  it('PASSKEY-SVC-024: success mints a real session, strips the user and bumps the bookkeeping', async () => {
    const { user } = createUser(testDb);
    const cred = insertCredential(user.id, { credential_id: 'good', counter: 5 });
    seedChallenge('a9', null, 'authentication');
    swMock.verifyAuthenticationResponse.mockResolvedValue({ verified: true, authenticationInfo: { newCounter: 6 } });

    const result = await svc.passkeyLoginVerify({ assertionResponse: ceremonyResponse('a9', { id: 'good' }) });
    expect(result.auditUserId).toBe(user.id);
    expect(result.user).toMatchObject({ id: user.id, email: user.email });
    expect(result.user).toHaveProperty('avatar_url');
    expect(result.user).not.toHaveProperty('password_hash');
    // The token is the SAME session shape password login mints ({ id, pv }).
    const decoded = jwtLib.verify(result.token!, 'test-jwt-secret-for-trek-testing-only') as Record<string, unknown>;
    expect(decoded.id).toBe(user.id);
    expect(decoded).toHaveProperty('pv');

    const credRow = testDb
      .prepare('SELECT counter, last_used_at FROM webauthn_credentials WHERE id = ?')
      .get(cred.id) as Record<string, unknown>;
    expect(credRow.counter).toBe(6);
    expect(credRow.last_used_at).not.toBeNull();
    const userRow = testDb.prepare('SELECT last_login, login_count FROM users WHERE id = ?').get(user.id) as Record<
      string,
      unknown
    >;
    expect(userRow.last_login).not.toBeNull();
    expect(userRow.login_count).toBe(1);
  });
});

// ── listPasskeys ──────────────────────────────────────────────────────────────

describe('listPasskeys', () => {
  it('PASSKEY-SVC-025: lists newest-first with backed_up remapped to a boolean', () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    testDb
      .prepare(
        `INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter, backed_up, name, created_at)
       VALUES (?, 'old', x'01', 0, 0, 'Old', '2026-01-01 00:00:00'), (?, 'new', x'02', 0, 1, 'New', '2026-02-01 00:00:00')`,
      )
      .run(user.id, user.id);
    insertCredential(other.id);

    const list = svc.listPasskeys(user.id);
    expect(list.map((c) => c.name)).toEqual(['New', 'Old']);
    expect(list[0]).toEqual({
      id: expect.any(Number),
      name: 'New',
      device_type: null,
      backed_up: true,
      created_at: '2026-02-01 00:00:00',
      last_used_at: null,
    });
    expect(list[1].backed_up).toBe(false);
  });
});

// ── renamePasskey ─────────────────────────────────────────────────────────────

describe('renamePasskey', () => {
  it('PASSKEY-SVC-026: rejects a missing, non-string or whitespace-only name', () => {
    const { user } = createUser(testDb);
    const cred = insertCredential(user.id);
    expect(svc.renamePasskey(user.id, String(cred.id), undefined)).toEqual({ error: 'Name is required', status: 400 });
    expect(svc.renamePasskey(user.id, String(cred.id), 42)).toEqual({ error: 'Name is required', status: 400 });
    expect(svc.renamePasskey(user.id, String(cred.id), '   ')).toEqual({ error: 'Name is required', status: 400 });
  });

  it('PASSKEY-SVC-027: renames (trimmed, capped at 60) and 404s on foreign or unknown ids', () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const cred = insertCredential(user.id);

    expect(svc.renamePasskey(user.id, String(cred.id), `  ${'n'.repeat(80)}  `)).toEqual({ success: true });
    const row = testDb.prepare('SELECT name FROM webauthn_credentials WHERE id = ?').get(cred.id) as { name: string };
    expect(row.name).toBe('n'.repeat(60));

    expect(svc.renamePasskey(other.id, String(cred.id), 'Steal')).toEqual({ error: 'Passkey not found', status: 404 });
    expect(svc.renamePasskey(user.id, '999999', 'Ghost')).toEqual({ error: 'Passkey not found', status: 404 });
  });
});

// ── deletePasskey ─────────────────────────────────────────────────────────────

describe('deletePasskey', () => {
  it('PASSKEY-SVC-028: requires the current password (missing, wrong, or no hash all 401)', () => {
    const { user, password } = createUser(testDb);
    const cred = insertCredential(user.id);
    expect(svc.deletePasskey(user.id, String(cred.id), undefined)).toEqual({
      error: 'Incorrect password',
      status: 401,
    });
    expect(svc.deletePasskey(user.id, String(cred.id), `${password}x`)).toEqual({
      error: 'Incorrect password',
      status: 401,
    });
    testDb.prepare("UPDATE users SET password_hash = '' WHERE id = ?").run(user.id);
    expect(svc.deletePasskey(user.id, String(cred.id), password)).toEqual({ error: 'Incorrect password', status: 401 });
  });

  it('PASSKEY-SVC-029: deletes own credentials only — foreign ids 404 without leaking', () => {
    const { user, password } = createUser(testDb);
    const { user: other, password: otherPassword } = createUser(testDb);
    const cred = insertCredential(user.id);

    expect(svc.deletePasskey(other.id, String(cred.id), otherPassword)).toEqual({
      error: 'Passkey not found',
      status: 404,
    });
    expect(svc.deletePasskey(user.id, String(cred.id), password)).toEqual({ success: true });
    expect(testDb.prepare('SELECT COUNT(*) AS n FROM webauthn_credentials').get()).toEqual({ n: 0 });
  });
});

// ── adminResetPasskeys ────────────────────────────────────────────────────────

describe('adminResetPasskeys', () => {
  it('PASSKEY-SVC-030: 404s on an unknown user, else clears all credentials and reports the count', () => {
    expect(svc.adminResetPasskeys(999_999)).toEqual({ error: 'User not found', status: 404 });

    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    insertCredential(user.id);
    insertCredential(user.id);
    const kept = insertCredential(other.id);

    expect(svc.adminResetPasskeys(user.id)).toEqual({ success: true, deleted: 2, email: user.email });
    expect(svc.adminResetPasskeys(user.id)).toEqual({ success: true, deleted: 0, email: user.email });
    expect(testDb.prepare('SELECT id FROM webauthn_credentials').all()).toEqual([{ id: kept.id }]);
  });
});
