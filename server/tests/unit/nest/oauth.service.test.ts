import { describe, it, expect, vi, beforeEach } from 'vitest';

// The Nest service is a thin wrapper that forwards to the legacy oauthService
// plus the addon/notification helpers. Mock those and assert the delegation.
const { oauth } = vi.hoisted(() => ({
  oauth: {
    consumeAuthCode: vi.fn(),
    authenticateClient: vi.fn(),
    verifyPKCE: vi.fn(),
    issueTokens: vi.fn(),
    issueClientCredentialsToken: vi.fn(),
    refreshTokens: vi.fn(),
    revokeToken: vi.fn(),
    getUserByAccessToken: vi.fn(),
    validateAuthorizeRequest: vi.fn(),
    saveConsent: vi.fn(),
    createAuthCode: vi.fn(),
    listOAuthClients: vi.fn(),
    createOAuthClient: vi.fn(),
    rotateOAuthClientSecret: vi.fn(),
    deleteOAuthClient: vi.fn(),
    listOAuthSessions: vi.fn(),
    revokeSession: vi.fn(),
  },
}));
vi.mock('../../../src/services/oauthService', () => oauth);

const { isAddonEnabled } = vi.hoisted(() => ({ isAddonEnabled: vi.fn() }));
vi.mock('../../../src/services/adminService', () => ({ isAddonEnabled }));

const { getMcpSafeUrl } = vi.hoisted(() => ({ getMcpSafeUrl: vi.fn() }));
vi.mock('../../../src/services/notifications', () => ({ getMcpSafeUrl }));

import { OauthService } from '../../../src/nest/oauth/oauth.service';
import { ADDON_IDS } from '../../../src/addons';

function svc() { return new OauthService(); }

beforeEach(() => vi.clearAllMocks());

describe('OauthService', () => {
  it('mcpEnabled checks the MCP addon flag', () => {
    isAddonEnabled.mockReturnValue(true);
    expect(svc().mcpEnabled()).toBe(true);
    expect(isAddonEnabled).toHaveBeenCalledWith(ADDON_IDS.MCP);
    isAddonEnabled.mockReturnValue(false);
    expect(svc().mcpEnabled()).toBe(false);
  });

  it('mcpSafeUrl forwards to the notifications helper', () => {
    getMcpSafeUrl.mockReturnValue('https://safe');
    expect(svc().mcpSafeUrl()).toBe('https://safe');
    expect(getMcpSafeUrl).toHaveBeenCalled();
  });

  it('consumeAuthCode delegates', () => {
    oauth.consumeAuthCode.mockReturnValue({ clientId: 'c' });
    expect(svc().consumeAuthCode('code')).toEqual({ clientId: 'c' });
    expect(oauth.consumeAuthCode).toHaveBeenCalledWith('code');
  });

  it('authenticateClient delegates with both args', () => {
    oauth.authenticateClient.mockReturnValue({ id: 'c' });
    expect(svc().authenticateClient('c', 'secret')).toEqual({ id: 'c' });
    expect(oauth.authenticateClient).toHaveBeenCalledWith('c', 'secret');
  });

  it('verifyPKCE delegates', () => {
    oauth.verifyPKCE.mockReturnValue(true);
    expect(svc().verifyPKCE('v', 'ch')).toBe(true);
    expect(oauth.verifyPKCE).toHaveBeenCalledWith('v', 'ch');
  });

  it('issueTokens forwards the full argument list', () => {
    oauth.issueTokens.mockReturnValue({ access_token: 'at' });
    expect(svc().issueTokens('c', 1, ['s'], null, 'aud')).toEqual({ access_token: 'at' });
    expect(oauth.issueTokens).toHaveBeenCalledWith('c', 1, ['s'], null, 'aud');
  });

  it('issueClientCredentialsToken forwards the full argument list', () => {
    oauth.issueClientCredentialsToken.mockReturnValue({ access_token: 'cc' });
    expect(svc().issueClientCredentialsToken('c', 1, ['s'], 'aud')).toEqual({ access_token: 'cc' });
    expect(oauth.issueClientCredentialsToken).toHaveBeenCalledWith('c', 1, ['s'], 'aud');
  });

  it('refreshTokens forwards the full argument list', () => {
    oauth.refreshTokens.mockReturnValue({ tokens: { access_token: 'new' } });
    expect(svc().refreshTokens('rt', 'c', 's', '1.2.3.4')).toEqual({ tokens: { access_token: 'new' } });
    expect(oauth.refreshTokens).toHaveBeenCalledWith('rt', 'c', 's', '1.2.3.4');
  });

  it('revokeToken forwards the full argument list', () => {
    svc().revokeToken('t', 'c', undefined, '1.2.3.4');
    expect(oauth.revokeToken).toHaveBeenCalledWith('t', 'c', undefined, '1.2.3.4');
  });

  it('getUserByAccessToken delegates', () => {
    oauth.getUserByAccessToken.mockReturnValue({ user: { id: 1 } });
    expect(svc().getUserByAccessToken('tok')).toEqual({ user: { id: 1 } });
    expect(oauth.getUserByAccessToken).toHaveBeenCalledWith('tok');
  });

  it('validateAuthorizeRequest delegates with the user id', () => {
    oauth.validateAuthorizeRequest.mockReturnValue({ valid: true });
    const params = { response_type: 'code' } as never;
    expect(svc().validateAuthorizeRequest(params, 5)).toEqual({ valid: true });
    expect(oauth.validateAuthorizeRequest).toHaveBeenCalledWith(params, 5);
  });

  it('saveConsent forwards the full argument list', () => {
    svc().saveConsent('c', 1, ['s'], '1.2.3.4');
    expect(oauth.saveConsent).toHaveBeenCalledWith('c', 1, ['s'], '1.2.3.4');
  });

  it('createAuthCode forwards the params object', () => {
    oauth.createAuthCode.mockReturnValue('the_code');
    const p = { clientId: 'c', userId: 1, redirectUri: 'u', scopes: ['s'], resource: null, codeChallenge: 'cc', codeChallengeMethod: 'S256' } as const;
    expect(svc().createAuthCode(p)).toBe('the_code');
    expect(oauth.createAuthCode).toHaveBeenCalledWith(p);
  });

  it('listOAuthClients delegates', () => {
    oauth.listOAuthClients.mockReturnValue([{ id: 'c1' }]);
    expect(svc().listOAuthClients(1)).toEqual([{ id: 'c1' }]);
    expect(oauth.listOAuthClients).toHaveBeenCalledWith(1);
  });

  it('createOAuthClient forwards the full argument list', () => {
    oauth.createOAuthClient.mockReturnValue({ client_id: 'c1' });
    expect(svc().createOAuthClient(1, 'CLI', ['https://cb'], ['a'], '1.2.3.4', { allowsClientCredentials: true })).toEqual({ client_id: 'c1' });
    expect(oauth.createOAuthClient).toHaveBeenCalledWith(1, 'CLI', ['https://cb'], ['a'], '1.2.3.4', { allowsClientCredentials: true });
  });

  it('rotateOAuthClientSecret delegates', () => {
    oauth.rotateOAuthClientSecret.mockReturnValue({ client_secret: 'new' });
    expect(svc().rotateOAuthClientSecret(1, 'c1', '1.2.3.4')).toEqual({ client_secret: 'new' });
    expect(oauth.rotateOAuthClientSecret).toHaveBeenCalledWith(1, 'c1', '1.2.3.4');
  });

  it('deleteOAuthClient delegates', () => {
    oauth.deleteOAuthClient.mockReturnValue({});
    expect(svc().deleteOAuthClient(1, 'c1', '1.2.3.4')).toEqual({});
    expect(oauth.deleteOAuthClient).toHaveBeenCalledWith(1, 'c1', '1.2.3.4');
  });

  it('listOAuthSessions delegates', () => {
    oauth.listOAuthSessions.mockReturnValue([{ id: 1 }]);
    expect(svc().listOAuthSessions(1)).toEqual([{ id: 1 }]);
    expect(oauth.listOAuthSessions).toHaveBeenCalledWith(1);
  });

  it('revokeSession delegates', () => {
    oauth.revokeSession.mockReturnValue({});
    expect(svc().revokeSession(1, 7, '1.2.3.4')).toEqual({});
    expect(oauth.revokeSession).toHaveBeenCalledWith(1, 7, '1.2.3.4');
  });
});

describe('OauthModule', () => {
  it('wires the public + api controllers and the providers', async () => {
    const { OauthModule } = await import('../../../src/nest/oauth/oauth.module');
    const { OauthPublicController } = await import('../../../src/nest/oauth/oauth-public.controller');
    const { OauthApiController } = await import('../../../src/nest/oauth/oauth-api.controller');
    const { OauthService: Svc } = await import('../../../src/nest/oauth/oauth.service');
    const { RateLimitService } = await import('../../../src/nest/auth/rate-limit.service');

    const controllers = Reflect.getMetadata('controllers', OauthModule);
    const providers = Reflect.getMetadata('providers', OauthModule);
    expect(controllers).toEqual([OauthPublicController, OauthApiController]);
    expect(providers).toEqual([Svc, RateLimitService]);
  });
});
