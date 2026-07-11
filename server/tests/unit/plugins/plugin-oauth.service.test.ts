/**
 * Host-brokered outbound OAuth (#plugins). Proves the security-critical broker logic
 * without a browser: PKCE challenge derivation, single-use + user-bound + TTL state,
 * https/SSRF guard on the endpoints, the code + refresh token exchanges (mocked fetch),
 * tokens encrypted at rest, and a stored refresh token that the plugin never sees.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../src/services/apiKeyCrypto', () => ({
  encrypt_api_key: (v: unknown) => (typeof v === 'string' ? `enc:${v}` : v),
  decrypt_api_key: (v: unknown) => (typeof v === 'string' && v.startsWith('enc:') ? v.slice(4) : v),
}));
vi.mock('../../../src/services/notifications', () => ({ getAppUrl: () => 'https://trek.example' }));

const { getDb } = vi.hoisted(() => ({ getDb: { current: null as unknown } }));
vi.mock('../../../src/db/database', () => ({ get db() { return getDb.current; } }));

// The token POST now runs through the SSRF guard (ssrfGuard.safeFetchLlm), which
// resolves the host before fetching. Stub DNS so the fake provider.example host
// resolves — to a public IP by default, or to a per-test address for the guard.
const { dnsState } = vi.hoisted(() => ({ dnsState: { address: '93.184.216.34', family: 4 } }));
vi.mock('node:dns/promises', () => {
  const lookup = async () => ({ address: dnsState.address, family: dnsState.family });
  return { default: { lookup }, lookup };
});

import Database from 'better-sqlite3';
import { PluginOAuthService } from '../../../src/nest/plugins/plugin-oauth.service';

const CFG = {
  oauth_authorize_url: 'https://provider.example/authorize',
  oauth_token_url: 'https://provider.example/token',
  oauth_scopes: 'read write',
  oauth_client_id: 'enc:client-123',       // stored encrypted
  oauth_client_secret: 'enc:secret-abc',
};

function freshDb(cfg: Record<string, unknown> = CFG) {
  const d = new Database(':memory:');
  d.exec(`
    CREATE TABLE plugins (id TEXT PRIMARY KEY, config TEXT, status TEXT);
    CREATE TABLE plugin_oauth_tokens (plugin_id TEXT, user_id INTEGER, access_token TEXT, refresh_token TEXT, expires_at INTEGER, scope TEXT, updated_at TEXT, PRIMARY KEY (plugin_id, user_id));
    CREATE TABLE plugin_oauth_state (state TEXT PRIMARY KEY, plugin_id TEXT, user_id INTEGER, verifier TEXT, created_at INTEGER);
  `);
  d.prepare("INSERT INTO plugins (id, config, status) VALUES ('p', ?, 'active')").run(JSON.stringify(cfg));
  return d;
}

const NOW = 1_700_000_000_000;

describe('PluginOAuthService', () => {
  let svc: PluginOAuthService;
  beforeEach(() => { getDb.current = freshDb(); svc = new PluginOAuthService(); vi.restoreAllMocks(); dnsState.address = '93.184.216.34'; dnsState.family = 4; });

  it('providerConfig returns null unless every piece is present, decrypting the secrets', () => {
    expect(svc.providerConfig('p')).toMatchObject({ clientId: 'client-123', clientSecret: 'secret-abc', scopes: 'read write' });
    getDb.current = freshDb({ ...CFG, oauth_client_secret: '' });
    expect(new PluginOAuthService().providerConfig('p')).toBeNull();
  });

  it('startConnect builds a PKCE authorize URL + persists a single fresh state per user', () => {
    const url = new URL(svc.startConnect('p', 42, NOW));
    expect(url.origin + url.pathname).toBe('https://provider.example/authorize');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('client_id')).toBe('client-123');
    expect(url.searchParams.get('redirect_uri')).toBe('https://trek.example/api/plugin-oauth/p/callback');
    expect(url.searchParams.get('code_challenge')).toBeTruthy();
    const state = url.searchParams.get('state')!;
    const rows = getDb.current as unknown as InstanceType<typeof Database>;
    const stored = rows.prepare('SELECT verifier, user_id FROM plugin_oauth_state WHERE state = ?').get(state) as { verifier: string; user_id: number };
    expect(stored.user_id).toBe(42);
    // a second connect replaces the first (one live state per user)
    svc.startConnect('p', 42, NOW);
    expect((rows.prepare('SELECT COUNT(*) c FROM plugin_oauth_state WHERE user_id = 42').get() as { c: number }).c).toBe(1);
  });

  it('rejects a non-https / loopback / metadata / internal authorize endpoint', () => {
    getDb.current = freshDb({ ...CFG, oauth_authorize_url: 'http://provider.example/authorize' });
    expect(() => new PluginOAuthService().startConnect('p', 42, NOW)).toThrow(/https/);
    getDb.current = freshDb({ ...CFG, oauth_token_url: 'https://127.0.0.1/token' });
    expect(() => new PluginOAuthService().startConnect('p', 42, NOW)).toThrow(/loopback|private/);
    // IPv6-literal loopback must not slip past the fast-fail
    getDb.current = freshDb({ ...CFG, oauth_token_url: 'https://[::1]/token' });
    expect(() => new PluginOAuthService().startConnect('p', 42, NOW)).toThrow(/loopback/);
    // cloud-metadata by literal is refused too
    getDb.current = freshDb({ ...CFG, oauth_token_url: 'https://169.254.169.254/token' });
    expect(() => new PluginOAuthService().startConnect('p', 42, NOW)).toThrow(/loopback|metadata/);
    // an internal name suffix is refused
    getDb.current = freshDb({ ...CFG, oauth_token_url: 'https://idp.internal/token' });
    expect(() => new PluginOAuthService().startConnect('p', 42, NOW)).toThrow(/local/);
  });

  it('completeCallback verifies state (single-use, user-bound, TTL), exchanges the code, encrypts tokens', async () => {
    const url = new URL(svc.startConnect('p', 42, NOW));
    const state = url.searchParams.get('state')!;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true, json: async () => ({ access_token: 'AT', refresh_token: 'RT', expires_in: 3600, scope: 'read' }),
    } as Response);

    await svc.completeCallback('p', 42, 'the-code', state, NOW + 1000);
    // the token exchange used PKCE (code_verifier) + client creds
    const body = (fetchMock.mock.calls[0][1] as { body: string }).body;
    expect(body).toContain('grant_type=authorization_code');
    expect(body).toContain('code_verifier=');
    expect(body).toContain('client_secret=secret-abc');

    const rows = getDb.current as unknown as InstanceType<typeof Database>;
    const tok = rows.prepare('SELECT access_token, refresh_token FROM plugin_oauth_tokens WHERE plugin_id = ? AND user_id = 42').get('p') as { access_token: string; refresh_token: string };
    expect(tok.access_token).toBe('enc:AT');   // encrypted at rest
    expect(tok.refresh_token).toBe('enc:RT');
    expect(svc.status('p', 42)).toMatchObject({ configured: true, connected: true });
    // state is single-use — replaying it fails
    await expect(svc.completeCallback('p', 42, 'the-code', state, NOW + 2000)).rejects.toThrow(/state/);
  });

  it('rejects a foreign or expired state', async () => {
    const state = new URL(svc.startConnect('p', 42, NOW)).searchParams.get('state')!;
    await expect(svc.completeCallback('p', 99, 'code', state, NOW + 1000)).rejects.toThrow(/state/); // wrong user
    const state2 = new URL(svc.startConnect('p', 42, NOW)).searchParams.get('state')!;
    await expect(svc.completeCallback('p', 42, 'code', state2, NOW + 20 * 60 * 1000)).rejects.toThrow(/state/); // > 10 min
  });

  it('getAccessToken returns the token, refreshes an expiring one, and hands the plugin only the access token', async () => {
    const rows = getDb.current as unknown as InstanceType<typeof Database>;
    // a live token → returned decrypted, no network
    rows.prepare('INSERT INTO plugin_oauth_tokens (plugin_id, user_id, access_token, refresh_token, expires_at) VALUES (?,?,?,?,?)').run('p', 42, 'enc:LIVE', 'enc:RT', NOW + 3600_000);
    expect(await svc.getAccessToken('p', 42, NOW)).toBe('LIVE');

    // an expired token → refreshed via the refresh_token grant
    rows.prepare('UPDATE plugin_oauth_tokens SET access_token = ?, expires_at = ? WHERE user_id = 42').run('enc:OLD', NOW - 1000);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ access_token: 'NEW', expires_in: 3600 }) } as Response);
    expect(await svc.getAccessToken('p', 42, NOW)).toBe('NEW');
    expect((fetchMock.mock.calls[0][1] as { body: string }).body).toContain('grant_type=refresh_token');
    // the provider omitted a new refresh_token → the old one is kept
    const tok = rows.prepare('SELECT refresh_token FROM plugin_oauth_tokens WHERE user_id = 42').get() as { refresh_token: string };
    expect(tok.refresh_token).toBe('enc:RT');

    // a user who never connected → null
    expect(await svc.getAccessToken('p', 7, NOW)).toBeNull();
  });

  it('routes the token exchange through the SSRF guard — a token_url resolving to cloud metadata is refused', async () => {
    const state = new URL(svc.startConnect('p', 42, NOW)).searchParams.get('state')!;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ access_token: 'AT' }) } as Response);
    // The provider's token_url now resolves to the cloud-metadata address.
    dnsState.address = '169.254.169.254';
    await expect(svc.completeCallback('p', 42, 'the-code', state, NOW + 1000)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled(); // blocked before any request left the host
  });

  it('disconnect drops the user\'s tokens', async () => {
    const rows = getDb.current as unknown as InstanceType<typeof Database>;
    rows.prepare('INSERT INTO plugin_oauth_tokens (plugin_id, user_id, access_token) VALUES (?,?,?)').run('p', 42, 'enc:X');
    svc.disconnect('p', 42);
    expect(svc.status('p', 42).connected).toBe(false);
  });
});
