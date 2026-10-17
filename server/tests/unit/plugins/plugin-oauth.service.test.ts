/**
 * Host-brokered outbound OAuth (#plugins). Proves the security-critical broker logic
 * without a browser: PKCE challenge derivation, single-use + user-bound + TTL state,
 * https/SSRF guard on the endpoints, the code + refresh token exchanges (mocked fetch),
 * tokens encrypted at rest, and a stored refresh token that the plugin never sees.
 */
import { PluginOauthState } from '../../../src/db/entities/PluginOauthState.entity';
import { PluginOauthTokens } from '../../../src/db/entities/PluginOauthTokens.entity';
import { PluginSettingsFields } from '../../../src/db/entities/PluginSettingsFields.entity';
import { Plugins } from '../../../src/db/entities/Plugins.entity';
import { UnitOfWork } from '../../../src/nest/database/unit-of-work';
import { PluginOAuthService } from '../../../src/nest/plugins/oauth/plugin-oauth.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { countRows, findRow, findRows, insertRow, updateRows } from '../../helpers/factories/rows';
import { sharedTestOrm } from '../../helpers/test-uow';

import Database from 'better-sqlite3';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../src/nest/common/crypto/apiKeyCrypto', () => ({
  encrypt_api_key: (v: unknown) => (typeof v === 'string' ? `enc:${v}` : v),
  decrypt_api_key: (v: unknown) => (typeof v === 'string' && v.startsWith('enc:') ? v.slice(4) : v),
}));
vi.mock('../../../src/app-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/app-config')>();
  return { ...actual, getAppUrl: () => 'https://trek.example' };
});

const { getDb } = vi.hoisted(() => ({ getDb: { current: null as unknown } }));
// The mock stays even though nothing in this file imports `db` directly any more
// (the service dropped its last raw-connection use) — a transitive importer of
// `src/db/database` elsewhere in the module graph would otherwise try to open a
// real connection at import time.
vi.mock('../../../src/db/database', () => ({
  get db() {
    return getDb.current;
  },
}));

// The token POST now runs through the SSRF guard (ssrfGuard.safeFetchLlm), which
// resolves the host before fetching. Stub DNS so the fake provider.example host
// resolves — to a public IP by default, or to a per-test address for the guard.
const { dnsState } = vi.hoisted(() => ({ dnsState: { address: '93.184.216.34', family: 4 } }));
vi.mock('node:dns/promises', () => {
  const lookup = async () => ({ address: dnsState.address, family: dnsState.family });
  return { default: { lookup }, lookup };
});

const CFG = {
  oauth_authorize_url: 'https://provider.example/authorize',
  oauth_token_url: 'https://provider.example/token',
  oauth_scopes: 'read write',
  oauth_client_id: 'enc:client-123', // stored encrypted
  oauth_client_secret: 'enc:secret-abc',
};

async function freshDb(cfg: Record<string, unknown> = CFG) {
  const d = createSnapshotTestDb();
  await insertRow(await sharedTestOrm(d), Plugins, {
    id: 'p',
    name: 'p',
    config: JSON.stringify(cfg),
    status: 'active',
  });
  return d;
}

/** The ORM over whichever fresh db the current case set (memoised per handle). */
function currentOrm() {
  return sharedTestOrm(getDb.current as Database.Database);
}

/** The pending OAuth state row, or null once it has been consumed. */
async function stateRow(state: string) {
  return findRow(await currentOrm(), PluginOauthState, { state });
}

const NOW = 1_700_000_000_000;

/**
 * `PluginOAuthService`, built with real repositories over whichever fresh
 * `getDb.current` the caller just set — `sharedTestOrm` is memoized per db HANDLE,
 * and every test below assigns a brand-new `:memory:` db, so each call here gets
 * its own ORM, matching the pattern `plugin-user-settings.test.ts` established.
 */
async function makeOauthService(): Promise<PluginOAuthService> {
  const orm = await sharedTestOrm(getDb.current as Database.Database);
  return new PluginOAuthService(
    orm.repo(Plugins),
    orm.repo(PluginOauthTokens),
    orm.repo(PluginOauthState),
    orm.repo(PluginSettingsFields),
    new UnitOfWork(orm.em),
  );
}

describe('PluginOAuthService', () => {
  let svc: PluginOAuthService;
  beforeEach(async () => {
    getDb.current = await freshDb();
    svc = await makeOauthService();
    vi.restoreAllMocks();
    dnsState.address = '93.184.216.34';
    dnsState.family = 4;
  });

  it('providerConfig returns null unless every piece is present, decrypting the secrets', async () => {
    expect(await svc.providerConfig('p')).toMatchObject({
      clientId: 'client-123',
      clientSecret: 'secret-abc',
      scopes: 'read write',
    });
    getDb.current = await freshDb({ ...CFG, oauth_client_secret: '' });
    expect(await (await makeOauthService()).providerConfig('p')).toBeNull();
  });

  it('providerConfig falls back to the manifest defaults for the endpoints the admin left unset', async () => {
    // A provider plugin ships its authorize/token URLs as defaults; the admin only ever
    // types the client id/secret. Those two are secrets and can never carry a default.
    const { oauth_authorize_url: _a, oauth_token_url: _t, oauth_scopes: _s, ...stored } = CFG;
    getDb.current = await freshDb(stored);
    const orm = await currentOrm();
    const declareDefault = (key: string, value: string) =>
      insertRow(orm, PluginSettingsFields, {
        plugin_id: 'p',
        field_key: key,
        scope: 'instance',
        secret: 0,
        default_value: JSON.stringify(value),
      });
    await declareDefault('oauth_authorize_url', 'https://provider.example/authorize');
    await declareDefault('oauth_token_url', 'https://provider.example/token');
    await declareDefault('oauth_scopes', 'read');
    svc = await makeOauthService();
    expect(await svc.providerConfig('p')).toEqual({
      authorizeUrl: 'https://provider.example/authorize',
      tokenUrl: 'https://provider.example/token',
      scopes: 'read',
      clientId: 'client-123',
      clientSecret: 'secret-abc',
    });
  });

  it('startConnect builds a PKCE authorize URL + persists a single fresh state per user', async () => {
    const url = new URL(await svc.startConnect('p', 42, NOW));
    expect(url.origin + url.pathname).toBe('https://provider.example/authorize');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('client_id')).toBe('client-123');
    expect(url.searchParams.get('redirect_uri')).toBe('https://trek.example/api/plugin-oauth/p/callback');
    expect(url.searchParams.get('code_challenge')).toBeTruthy();
    const state = url.searchParams.get('state')!;
    const stored = (await stateRow(state))!;
    expect(stored.user_id).toBe(42);
    // a second connect replaces the first (one live state per user)
    await svc.startConnect('p', 42, NOW);
    expect(await countRows(await currentOrm(), PluginOauthState, { user_id: 42 })).toBe(1);
  });

  it('startConnect drops the old state and stores the new one together: a failed store keeps the old one', async () => {
    const first = new URL(await svc.startConnect('p', 42, NOW)).searchParams.get('state')!;
    const orm = await sharedTestOrm(getDb.current as Database.Database);
    vi.spyOn(orm.repo(PluginOauthState), 'insertState').mockRejectedValueOnce(new Error('disk full'));
    await expect(svc.startConnect('p', 42, NOW)).rejects.toThrow('disk full');
    const rows = await findRows(orm, PluginOauthState, { user_id: 42 });
    expect(rows.map(({ state }) => ({ state }))).toEqual([{ state: first }]);
  });

  it('rejects a non-https / loopback / metadata / internal authorize endpoint', async () => {
    getDb.current = await freshDb({ ...CFG, oauth_authorize_url: 'http://provider.example/authorize' });
    await expect((await makeOauthService()).startConnect('p', 42, NOW)).rejects.toThrow(/https/);
    getDb.current = await freshDb({ ...CFG, oauth_token_url: 'https://127.0.0.1/token' });
    await expect((await makeOauthService()).startConnect('p', 42, NOW)).rejects.toThrow(/loopback|private/);
    // IPv6-literal loopback must not slip past the fast-fail
    getDb.current = await freshDb({ ...CFG, oauth_token_url: 'https://[::1]/token' });
    await expect((await makeOauthService()).startConnect('p', 42, NOW)).rejects.toThrow(/loopback/);
    // cloud-metadata by literal is refused too
    getDb.current = await freshDb({ ...CFG, oauth_token_url: 'https://169.254.169.254/token' });
    await expect((await makeOauthService()).startConnect('p', 42, NOW)).rejects.toThrow(/loopback|metadata/);
    // an internal name suffix is refused
    getDb.current = await freshDb({ ...CFG, oauth_token_url: 'https://idp.internal/token' });
    await expect((await makeOauthService()).startConnect('p', 42, NOW)).rejects.toThrow(/local/);
  });

  it('completeCallback verifies state (single-use, user-bound, TTL), exchanges the code, encrypts tokens', async () => {
    const url = new URL(await svc.startConnect('p', 42, NOW));
    const state = url.searchParams.get('state')!;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'AT', refresh_token: 'RT', expires_in: 3600, scope: 'read' }),
    } as Response);

    await svc.completeCallback('p', 42, 'the-code', state, NOW + 1000);
    // the token exchange used PKCE (code_verifier) + client creds
    const body = (fetchMock.mock.calls[0][1] as { body: string }).body;
    expect(body).toContain('grant_type=authorization_code');
    expect(body).toContain('code_verifier=');
    expect(body).toContain('client_secret=secret-abc');

    const tok = (await findRow(await currentOrm(), PluginOauthTokens, { plugin_id: 'p', user_id: 42 }))!;
    expect(tok.access_token).toBe('enc:AT'); // encrypted at rest
    expect(tok.refresh_token).toBe('enc:RT');
    expect(await svc.status('p', 42)).toMatchObject({ configured: true, connected: true });
    // state is single-use — replaying it fails
    await expect(svc.completeCallback('p', 42, 'the-code', state, NOW + 2000)).rejects.toThrow(/state/);
  });

  it('rejects a foreign or expired state', async () => {
    const state = new URL(await svc.startConnect('p', 42, NOW)).searchParams.get('state')!;
    await expect(svc.completeCallback('p', 99, 'code', state, NOW + 1000)).rejects.toThrow(/state/); // wrong user
    const state2 = new URL(await svc.startConnect('p', 42, NOW)).searchParams.get('state')!;
    await expect(svc.completeCallback('p', 42, 'code', state2, NOW + 20 * 60 * 1000)).rejects.toThrow(/state/); // > 10 min
  });

  it('getAccessToken returns the token, refreshes an expiring one, and hands the plugin only the access token', async () => {
    const orm = await currentOrm();
    // a live token → returned decrypted, no network
    await insertRow(orm, PluginOauthTokens, {
      plugin_id: 'p',
      user_id: 42,
      access_token: 'enc:LIVE',
      refresh_token: 'enc:RT',
      expires_at: NOW + 3600_000,
    });
    expect(await svc.getAccessToken('p', 42, NOW)).toBe('LIVE');

    // an expired token → refreshed via the refresh_token grant
    await updateRows(orm, PluginOauthTokens, { user_id: 42 }, { access_token: 'enc:OLD', expires_at: NOW - 1000 });
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, json: async () => ({ access_token: 'NEW', expires_in: 3600 }) } as Response);
    expect(await svc.getAccessToken('p', 42, NOW)).toBe('NEW');
    expect((fetchMock.mock.calls[0][1] as { body: string }).body).toContain('grant_type=refresh_token');
    // the provider omitted a new refresh_token → the old one is kept
    const tok = (await findRow(orm, PluginOauthTokens, { user_id: 42 }))!;
    expect(tok.refresh_token).toBe('enc:RT');

    // a user who never connected → null
    expect(await svc.getAccessToken('p', 7, NOW)).toBeNull();
  });

  it('routes the token exchange through the SSRF guard — a token_url resolving to cloud metadata is refused', async () => {
    const state = new URL(await svc.startConnect('p', 42, NOW)).searchParams.get('state')!;
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, json: async () => ({ access_token: 'AT' }) } as Response);
    // The provider's token_url now resolves to the cloud-metadata address.
    dnsState.address = '169.254.169.254';
    await expect(svc.completeCallback('p', 42, 'the-code', state, NOW + 1000)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled(); // blocked before any request left the host
  });

  it("disconnect drops the user's tokens", async () => {
    await insertRow(await currentOrm(), PluginOauthTokens, { plugin_id: 'p', user_id: 42, access_token: 'enc:X' });
    await svc.disconnect('p', 42);
    expect((await svc.status('p', 42)).connected).toBe(false);
  });

  /**
   * PO5+PO6+PO7 — single-use is enforced by `consumeByState`'s ONE atomic
   * delete, on EVERY path out of `completeCallback`: the expired/foreign-state
   * refusal and the success path both leave the row gone, not just the
   * success one.
   */
  it('single-use: the state row is gone after EITHER the refused path or the success path', async () => {
    // Refused path: wrong user — the row is still consumed.
    const stateA = new URL(await svc.startConnect('p', 42, NOW)).searchParams.get('state')!;
    expect(await stateRow(stateA)).toBeTruthy();
    await expect(svc.completeCallback('p', 99, 'code', stateA, NOW + 1000)).rejects.toThrow(/state/);
    expect(await stateRow(stateA)).toBeNull();

    // Success path.
    const stateB = new URL(await svc.startConnect('p', 42, NOW)).searchParams.get('state')!;
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'AT' }),
    } as Response);
    await svc.completeCallback('p', 42, 'code', stateB, NOW + 1000);
    expect(await stateRow(stateB)).toBeNull();
  });

  /**
   * R-oauth-upsert's TRAP: the state consume is a check-then-act primitive.
   * `consumeByState`'s atomic `DELETE ... RETURNING` (PluginOauthState.repository.ts)
   * exists specifically so two concurrent `completeCallback` calls for the SAME
   * state cannot both see a live row — racing them here is the proof, matching
   * the legacy synchronous-JS outcome (exactly one consumer wins, the token
   * exchange fires exactly once).
   */
  it('the state consume race: two concurrent completeCallback calls for the SAME state — exactly one wins', async () => {
    const state = new URL(await svc.startConnect('p', 42, NOW)).searchParams.get('state')!;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'AT', refresh_token: 'RT', expires_in: 3600 }),
    } as Response);

    const results = await Promise.allSettled([
      svc.completeCallback('p', 42, 'code', state, NOW + 1000),
      svc.completeCallback('p', 42, 'code', state, NOW + 1000),
    ]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1); // exactly one consumer wins the state
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason as Error).toMatchObject({
      message: expect.stringMatching(/state/),
    });
    // The token exchange fired exactly once — the loser never reached it.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await stateRow(state)).toBeNull();
  });
});
