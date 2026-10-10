/**
 * PluginOAuthController (#plugins): the host-brokered OAuth endpoints. Thin — the
 * broker logic is in PluginOAuthService (separately tested); here we prove the gates
 * (runtime off / no user / inactive plugin) and that the callback always redirects to
 * an in-app path with the right status, never leaking an error.
 */
import type { PluginsRepository } from '../../../src/db/repositories/Plugins.repository';
import { PluginOAuthController } from '../../../src/nest/plugins/oauth/plugin-oauth.controller';
import type { PluginOAuthService } from '../../../src/nest/plugins/oauth/plugin-oauth.service';

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { pluginsEnabled, getMock } = vi.hoisted(() => ({
  pluginsEnabled: vi.fn(() => true),
  getMock: vi.fn(() => ({ 1: 1 })), // plugin is active by default
}));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (id?: number) => ({ user: id === undefined ? undefined : { id } }) as any;
function fakeRes() {
  const res = {
    redirectedTo: '' as string,
    redirect(loc: string) {
      res.redirectedTo = loc;
      return res;
    },
  };
  return res;
}
function ctrl(over: Partial<PluginOAuthService> = {}) {
  const svc = {
    status: vi.fn(async () => ({ configured: true, connected: false })),
    startConnect: vi.fn(async () => 'https://provider.example/auth?state=s'),
    completeCallback: vi.fn(async () => undefined),
    disconnect: vi.fn(async () => undefined),
    ...over,
  } as unknown as PluginOAuthService;
  // POC1 (Plan 3j Task 5) — the active-plugin guard is now Plugins.repository.ts#existsActive.
  const plugins = { existsActive: vi.fn(async () => !!getMock()) } as unknown as PluginsRepository;
  return { c: new PluginOAuthController(svc, plugins), svc };
}

describe('PluginOAuthController', () => {
  beforeEach(() => {
    pluginsEnabled.mockReturnValue(true);
    getMock.mockReturnValue({ 1: 1 });
  });

  it('status is gated: runtime off / no user / inactive → not configured', async () => {
    expect(await ctrl().c.status('p', req(5))).toEqual({ configured: true, connected: false });
    pluginsEnabled.mockReturnValue(false);
    expect(await ctrl().c.status('p', req(5))).toEqual({ configured: false, connected: false });
    pluginsEnabled.mockReturnValue(true);
    expect(await ctrl().c.status('p', req(undefined))).toEqual({ configured: false, connected: false });
    getMock.mockReturnValue(undefined as never); // inactive
    expect(await ctrl().c.status('p', req(5))).toEqual({ configured: false, connected: false });
  });

  it('connect returns the authorize URL for a bound user', async () => {
    const { c, svc } = ctrl();
    expect(await c.connect('p', req(5))).toEqual({ authorizeUrl: 'https://provider.example/auth?state=s' });
    expect(svc.startConnect).toHaveBeenCalledWith('p', 5, expect.any(Number));
  });

  it('callback redirects with :connected on success and :failed on a thrown exchange', async () => {
    const okRes = fakeRes();
    await ctrl().c.callback('p', 'code', 'state', undefined, req(5), okRes as never);
    expect(okRes.redirectedTo).toBe('/settings?oauth=p:connected');

    const failRes = fakeRes();
    await ctrl({
      completeCallback: vi.fn(async () => {
        throw new Error('boom');
      }),
    }).c.callback('p', 'code', 'state', undefined, req(5), failRes as never);
    expect(failRes.redirectedTo).toBe('/settings?oauth=p:failed'); // never leaks the error

    const denyRes = fakeRes();
    await ctrl().c.callback('p', undefined, undefined, 'access_denied', req(5), denyRes as never);
    expect(denyRes.redirectedTo).toBe('/settings?oauth=p:denied');
  });

  it('disconnect delegates for a bound user', async () => {
    const { c, svc } = ctrl();
    expect(await c.disconnect('p', req(5))).toEqual({ connected: false });
    expect(svc.disconnect).toHaveBeenCalledWith('p', 5);
  });
});
