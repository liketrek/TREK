import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpException, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';

vi.mock('../../../src/services/auditLog', () => ({ writeAudit: vi.fn(), getClientIp: vi.fn(() => '1.2.3.4'), logInfo: vi.fn() }));
vi.mock('../../../src/services/notificationService', () => ({ send: vi.fn().mockResolvedValue(undefined) }));

import { AdminController } from '../../../src/nest/admin/admin.controller';
import type { AdminService } from '../../../src/nest/admin/admin.service';
import type { PluginRuntimeService } from '../../../src/nest/plugins/plugin-runtime.service';
import { writeAudit } from '../../../src/services/auditLog';
import { send as sendNotification } from '../../../src/services/notificationService';
import type { User } from '../../../src/types';

const user = { id: 1, role: 'admin', email: 'admin@example.test' } as User;
const req = { headers: {} } as Request;

function svc(o: Partial<AdminService> = {}): AdminService {
  return { invalidateMcpSessions: vi.fn(), ...o } as unknown as AdminService;
}
function thrown(fn: () => unknown): { status: number; body: unknown } {
  try { fn(); } catch (err) {
    if (err instanceof NotFoundException) return { status: 404, body: err.getResponse() };
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => { delete process.env.NODE_ENV; });

describe('AdminController users', () => {
  it('lists, creates (201 + audit), maps an error', () => {
    expect(new AdminController(svc({ listUsers: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<AdminService>)).listUsers()).toEqual({ users: [{ id: 1 }] });
    expect(thrown(() => new AdminController(svc({ createUser: vi.fn().mockReturnValue({ error: 'Email taken', status: 409 }) } as Partial<AdminService>)).createUser(user, {}, req))).toEqual({ status: 409, body: { error: 'Email taken' } });
    const c = new AdminController(svc({ createUser: vi.fn().mockReturnValue({ user: { id: 2 }, insertedId: 2, auditDetails: {} }) } as Partial<AdminService>));
    expect(c.createUser(user, { email: 'a@b.c' }, req)).toEqual({ user: { id: 2 } });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'admin.user_create' }));
  });

  it('update + delete audit and map errors', () => {
    expect(new AdminController(svc({ updateUser: vi.fn().mockReturnValue({ user: { id: 2 }, previousEmail: 'a@b.c', changed: ['role'] }) } as Partial<AdminService>)).updateUser(user, '2', {}, req)).toEqual({ user: { id: 2 } });
    expect(thrown(() => new AdminController(svc({ deleteUser: vi.fn().mockReturnValue({ error: 'Cannot delete self', status: 400 }) } as Partial<AdminService>)).deleteUser(user, '1', req))).toEqual({ status: 400, body: { error: 'Cannot delete self' } });
    expect(new AdminController(svc({ deleteUser: vi.fn().mockReturnValue({ email: 'a@b.c' }) } as Partial<AdminService>)).deleteUser(user, '2', req)).toEqual({ success: true });
  });
});

describe('AdminController permissions + oidc + misc', () => {
  it('permissions: 400 without an object, else saves + audits', () => {
    expect(thrown(() => new AdminController(svc()).savePermissions(user, {}, req))).toEqual({ status: 400, body: { error: 'permissions object required' } });
    const c = new AdminController(svc({ savePermissions: vi.fn().mockReturnValue({ permissions: { x: 1 }, skipped: [] }) } as Partial<AdminService>));
    expect(c.savePermissions(user, { permissions: { x: 1 } }, req)).toEqual({ success: true, permissions: { x: 1 } });
  });

  it('permissions: includes skipped when present', () => {
    const c = new AdminController(svc({ savePermissions: vi.fn().mockReturnValue({ permissions: {}, skipped: ['bad'] }) } as Partial<AdminService>));
    expect(c.savePermissions(user, { permissions: {} }, req)).toEqual({ success: true, permissions: {}, skipped: ['bad'] });
  });

  it('oidc update maps error, else audits', () => {
    expect(thrown(() => new AdminController(svc({ updateOidcSettings: vi.fn().mockReturnValue({ error: 'bad issuer', status: 400 }) } as Partial<AdminService>)).updateOidc(user, {}, req))).toEqual({ status: 400, body: { error: 'bad issuer' } });
    expect(new AdminController(svc({ updateOidcSettings: vi.fn().mockReturnValue({}) } as Partial<AdminService>)).updateOidc(user, { issuer: 'https://idp' }, req)).toEqual({ success: true });
  });

  it('save-demo-baseline maps error, else returns message', () => {
    expect(thrown(() => new AdminController(svc({ saveDemoBaseline: vi.fn().mockReturnValue({ error: 'not demo', status: 400 }) } as Partial<AdminService>)).saveDemoBaseline(user, req))).toEqual({ status: 400, body: { error: 'not demo' } });
    expect(new AdminController(svc({ saveDemoBaseline: vi.fn().mockReturnValue({ message: 'saved' }) } as Partial<AdminService>)).saveDemoBaseline(user, req)).toEqual({ success: true, message: 'saved' });
  });
});

describe('AdminController invites + feature toggles', () => {
  it('invites: create 201 + audit, delete maps error', () => {
    const c = new AdminController(svc({ createInvite: vi.fn().mockReturnValue({ invite: { id: 5 }, inviteId: 5, uses: 1, expiresInDays: 7 }) } as Partial<AdminService>));
    expect(c.createInvite(user, {}, req)).toEqual({ invite: { id: 5 } });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'admin.invite_create' }));
    expect(thrown(() => new AdminController(svc({ deleteInvite: vi.fn().mockReturnValue({ error: 'not found', status: 404 }) } as Partial<AdminService>)).deleteInvite(user, '5', req))).toEqual({ status: 404, body: { error: 'not found' } });
  });

  it('places-photos: 400 on a non-boolean, else updates + audits', () => {
    expect(thrown(() => new AdminController(svc()).updatePlacesPhotos(user, { enabled: 'yes' }, req))).toEqual({ status: 400, body: { error: 'enabled must be a boolean' } });
    expect(new AdminController(svc({ updatePlacesPhotos: vi.fn().mockReturnValue({ enabled: true }) } as Partial<AdminService>)).updatePlacesPhotos(user, { enabled: true }, req)).toEqual({ enabled: true });
  });

  it('collab-features update invalidates MCP sessions only when a flag actually flipped (#1414)', () => {
    const invalidateMcpSessions = vi.fn();
    const c = new AdminController(svc({ updateCollabFeatures: vi.fn().mockReturnValue({ features: { chat: true }, changed: true }), invalidateMcpSessions } as Partial<AdminService>));
    expect(c.updateCollabFeatures(user, { chat: true }, req)).toEqual({ chat: true });
    expect(invalidateMcpSessions).toHaveBeenCalled();

    const noopInvalidate = vi.fn();
    const noop = new AdminController(svc({ updateCollabFeatures: vi.fn().mockReturnValue({ features: { chat: true }, changed: false }), invalidateMcpSessions: noopInvalidate } as Partial<AdminService>));
    expect(noop.updateCollabFeatures(user, { chat: true }, req)).toEqual({ chat: true });
    expect(noopInvalidate).not.toHaveBeenCalled();
  });
});

describe('AdminController packing templates', () => {
  it('get 404, create 201, delete audits', () => {
    expect(thrown(() => new AdminController(svc({ getPackingTemplate: vi.fn().mockReturnValue({ error: 'not found', status: 404 }) } as Partial<AdminService>)).getPackingTemplate('9'))).toEqual({ status: 404, body: { error: 'not found' } });
    expect(new AdminController(svc({ createPackingTemplate: vi.fn().mockReturnValue({ id: 3, name: 'Beach' }) } as Partial<AdminService>)).createPackingTemplate(user, { name: 'Beach' })).toEqual({ id: 3, name: 'Beach' });
    expect(new AdminController(svc({ deletePackingTemplate: vi.fn().mockReturnValue({ name: 'Beach' }) } as Partial<AdminService>)).deletePackingTemplate(user, '3', req)).toEqual({ success: true });
    expect(new AdminController(svc({ createTemplateItem: vi.fn().mockReturnValue({ id: 7 }) } as Partial<AdminService>)).createTemplateItem('3', '4', { name: 'Towel' })).toEqual({ id: 7 });
  });
});

describe('AdminController addons + sessions + jwt + defaults', () => {
  it('addon update audits + invalidates MCP sessions only when the MCP surface changed (#1414)', async () => {
    const invalidateMcpSessions = vi.fn();
    const runtime = { deactivateForDisabledAddon: vi.fn() } as unknown as PluginRuntimeService;
    const c = new AdminController(svc({ updateAddon: vi.fn().mockReturnValue({ addon: { id: 'mcp', enabled: true }, mcpAffected: true, auditDetails: {} }), invalidateMcpSessions } as Partial<AdminService>), runtime);
    expect(await c.updateAddon(user, 'mcp', { enabled: true }, req)).toEqual({ addon: { id: 'mcp', enabled: true } });
    expect(invalidateMcpSessions).toHaveBeenCalled();
    expect(runtime.deactivateForDisabledAddon).not.toHaveBeenCalled();

    // Config-only saves / MCP-irrelevant addons keep live sessions alive.
    const noopInvalidate = vi.fn();
    const noop = new AdminController(svc({ updateAddon: vi.fn().mockReturnValue({ addon: { id: 'llm_parsing', enabled: true }, mcpAffected: false, auditDetails: {} }), invalidateMcpSessions: noopInvalidate } as Partial<AdminService>), runtime);
    expect(await noop.updateAddon(user, 'llm_parsing', { config: { model: 'x' } }, req)).toEqual({ addon: { id: 'llm_parsing', enabled: true } });
    expect(noopInvalidate).not.toHaveBeenCalled();

    // Disabling an addon cascades to the plugin runtime.
    const runtime2 = { deactivateForDisabledAddon: vi.fn().mockResolvedValue(['p1']) } as unknown as PluginRuntimeService;
    const disable = new AdminController(svc({ updateAddon: vi.fn().mockReturnValue({ addon: { id: 'budget', enabled: false }, mcpAffected: true, auditDetails: {} }), invalidateMcpSessions: vi.fn() } as Partial<AdminService>), runtime2);
    await disable.updateAddon(user, 'budget', { enabled: false }, req);
    expect(runtime2.deactivateForDisabledAddon).toHaveBeenCalledWith('budget');
  });

  it('oauth-sessions revoke audits; rotate-jwt maps error', () => {
    expect(new AdminController(svc({ revokeOAuthSession: vi.fn().mockReturnValue({}) } as Partial<AdminService>)).revokeOAuthSession(user, '3', req)).toEqual({ success: true });
    expect(thrown(() => new AdminController(svc({ rotateJwtSecret: vi.fn().mockReturnValue({ error: 'locked', status: 409 }) } as Partial<AdminService>)).rotateJwtSecret(user, req))).toEqual({ status: 409, body: { error: 'locked' } });
    expect(new AdminController(svc({ rotateJwtSecret: vi.fn().mockReturnValue({}) } as Partial<AdminService>)).rotateJwtSecret(user, req)).toEqual({ success: true });
  });

  it('default-user-settings: 400 on a non-object, else sets + audits', () => {
    expect(thrown(() => new AdminController(svc()).setDefaultUserSettings(user, [], req))).toEqual({ status: 400, body: { error: 'Object body required' } });
    const setAdminUserDefaults = vi.fn();
    const c = new AdminController(svc({ setAdminUserDefaults, getAdminUserDefaults: vi.fn().mockReturnValue({ theme: 'dark' }) } as Partial<AdminService>));
    expect(c.setDefaultUserSettings(user, { theme: 'dark' }, req)).toEqual({ theme: 'dark' });
    expect(setAdminUserDefaults).toHaveBeenCalled();
  });
});

describe('AdminController error envelope fallbacks', () => {
  it('ok() defaults to 400 when the error envelope omits a status', () => {
    expect(thrown(() => new AdminController(svc({ createUser: vi.fn().mockReturnValue({ error: 'boom' }) } as Partial<AdminService>)).createUser(user, {}, req))).toEqual({ status: 400, body: { error: 'boom' } });
  });

  it('updateOidc defaults to 400 when the service error omits a status', () => {
    expect(thrown(() => new AdminController(svc({ updateOidcSettings: vi.fn().mockReturnValue({ error: 'nope' }) } as Partial<AdminService>)).updateOidc(user, {}, req))).toEqual({ status: 400, body: { error: 'nope' } });
  });

  it('updateOidc audits issuer_set=false when no issuer is supplied', () => {
    expect(new AdminController(svc({ updateOidcSettings: vi.fn().mockReturnValue({}) } as Partial<AdminService>)).updateOidc(user, {}, req)).toEqual({ success: true });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'admin.oidc_update', details: { issuer_set: false } }));
  });
});

describe('AdminController read-only getters', () => {
  it('return service values verbatim', () => {
    expect(new AdminController(svc({ resetUserPasskeys: vi.fn().mockReturnValue({ email: 'a@b.c', deleted: 2 }) } as Partial<AdminService>)).resetUserPasskeys(user, '4', req)).toEqual({ success: true, deleted: 2 });
    expect(new AdminController(svc({ getStats: vi.fn().mockReturnValue({ users: 3 }) } as Partial<AdminService>)).stats()).toEqual({ users: 3 });
    expect(new AdminController(svc({ getPermissions: vi.fn().mockReturnValue({ a: 1 }) } as Partial<AdminService>)).permissions()).toEqual({ a: 1 });
    expect(new AdminController(svc({ getAuditLog: vi.fn().mockReturnValue({ entries: [] }) } as Partial<AdminService>)).auditLog({})).toEqual({ entries: [] });
    expect(new AdminController(svc({ getOidcSettings: vi.fn().mockReturnValue({ issuer: 'x' }) } as Partial<AdminService>)).getOidc()).toEqual({ issuer: 'x' });
    expect(new AdminController(svc({ checkVersion: vi.fn().mockResolvedValue({ current: '1' }) } as Partial<AdminService>)).versionCheck()).resolves.toEqual({ current: '1' });
    expect(new AdminController(svc({ getPreferencesMatrix: vi.fn().mockReturnValue({ rows: [] }) } as Partial<AdminService>)).getNotificationPrefs(user)).toEqual({ rows: [] });
    expect(new AdminController(svc({ listInvites: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<AdminService>)).listInvites()).toEqual({ invites: [{ id: 1 }] });
    expect(new AdminController(svc({ getBagTracking: vi.fn().mockReturnValue({ enabled: false }) } as Partial<AdminService>)).getBagTracking()).toEqual({ enabled: false });
    expect(new AdminController(svc({ getPlacesPhotos: vi.fn().mockReturnValue({ enabled: true }) } as Partial<AdminService>)).getPlacesPhotos()).toEqual({ enabled: true });
    expect(new AdminController(svc({ getPlacesAutocomplete: vi.fn().mockReturnValue({ enabled: true }) } as Partial<AdminService>)).getPlacesAutocomplete()).toEqual({ enabled: true });
    expect(new AdminController(svc({ getPlacesDetails: vi.fn().mockReturnValue({ enabled: true }) } as Partial<AdminService>)).getPlacesDetails()).toEqual({ enabled: true });
    expect(new AdminController(svc({ getCollabFeatures: vi.fn().mockReturnValue({ chat: false }) } as Partial<AdminService>)).getCollabFeatures()).toEqual({ chat: false });
    expect(new AdminController(svc({ listPackingTemplates: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<AdminService>)).listPackingTemplates()).toEqual({ templates: [{ id: 1 }] });
    expect(new AdminController(svc({ listAddons: vi.fn().mockReturnValue([{ id: 'mcp' }]) } as Partial<AdminService>)).listAddons()).toEqual({ addons: [{ id: 'mcp' }] });
    expect(new AdminController(svc({ listMcpTokens: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<AdminService>)).listMcpTokens()).toEqual({ tokens: [{ id: 1 }] });
    expect(new AdminController(svc({ listOAuthSessions: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<AdminService>)).listOAuthSessions()).toEqual({ sessions: [{ id: 1 }] });
    expect(new AdminController(svc({ getAdminUserDefaults: vi.fn().mockReturnValue({ theme: 'dark' }) } as Partial<AdminService>)).getDefaultUserSettings()).toEqual({ theme: 'dark' });
  });

  it('setNotificationPrefs persists then returns the refreshed matrix', () => {
    const setAdminPreferences = vi.fn();
    const c = new AdminController(svc({ setAdminPreferences, getPreferencesMatrix: vi.fn().mockReturnValue({ rows: [1] }) } as Partial<AdminService>));
    expect(c.setNotificationPrefs(user, { x: 1 })).toEqual({ rows: [1] });
    expect(setAdminPreferences).toHaveBeenCalledWith(user.id, { x: 1 });
  });

  it('githubReleases falls back to default paging when no query is given', async () => {
    const getGithubReleases = vi.fn().mockResolvedValue([{ tag: 'v1' }]);
    const c = new AdminController(svc({ getGithubReleases } as Partial<AdminService>));
    await expect(c.githubReleases()).resolves.toEqual([{ tag: 'v1' }]);
    expect(getGithubReleases).toHaveBeenCalledWith('10', '1');
    await c.githubReleases('5', '2');
    expect(getGithubReleases).toHaveBeenLastCalledWith('5', '2');
  });
});

describe('AdminController feature toggles + audit', () => {
  it('bag-tracking updates and audits', () => {
    const c = new AdminController(svc({ updateBagTracking: vi.fn().mockReturnValue({ enabled: true }) } as Partial<AdminService>));
    expect(c.updateBagTracking(user, { enabled: true }, req)).toEqual({ enabled: true });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'admin.bag_tracking' }));
  });

  it('places-autocomplete: 400 on a non-boolean, else updates + audits', () => {
    expect(thrown(() => new AdminController(svc()).updatePlacesAutocomplete(user, { enabled: 'yes' }, req))).toEqual({ status: 400, body: { error: 'enabled must be a boolean' } });
    expect(new AdminController(svc({ updatePlacesAutocomplete: vi.fn().mockReturnValue({ enabled: false }) } as Partial<AdminService>)).updatePlacesAutocomplete(user, { enabled: false }, req)).toEqual({ enabled: false });
  });

  it('places-details: 400 on a non-boolean, else updates + audits', () => {
    expect(thrown(() => new AdminController(svc()).updatePlacesDetails(user, { enabled: 1 }, req))).toEqual({ status: 400, body: { error: 'enabled must be a boolean' } });
    expect(new AdminController(svc({ updatePlacesDetails: vi.fn().mockReturnValue({ enabled: true }) } as Partial<AdminService>)).updatePlacesDetails(user, { enabled: true }, req)).toEqual({ enabled: true });
  });
});

describe('AdminController packing template sub-routes', () => {
  it('update/delete templates, categories and items map errors + return success', () => {
    expect(new AdminController(svc({ updatePackingTemplate: vi.fn().mockReturnValue({ id: 3 }) } as Partial<AdminService>)).updatePackingTemplate('3', {})).toEqual({ id: 3 });
    expect(new AdminController(svc({ createTemplateCategory: vi.fn().mockReturnValue({ id: 4 }) } as Partial<AdminService>)).createTemplateCategory('3', { name: 'Tops' })).toEqual({ id: 4 });
    expect(new AdminController(svc({ updateTemplateCategory: vi.fn().mockReturnValue({ id: 4 }) } as Partial<AdminService>)).updateTemplateCategory('3', '4', {})).toEqual({ id: 4 });
    expect(new AdminController(svc({ deleteTemplateCategory: vi.fn().mockReturnValue({}) } as Partial<AdminService>)).deleteTemplateCategory('3', '4')).toEqual({ success: true });
    expect(new AdminController(svc({ updateTemplateItem: vi.fn().mockReturnValue({ id: 7 }) } as Partial<AdminService>)).updateTemplateItem('7', {})).toEqual({ id: 7 });
    expect(new AdminController(svc({ deleteTemplateItem: vi.fn().mockReturnValue({}) } as Partial<AdminService>)).deleteTemplateItem('7')).toEqual({ success: true });
    expect(thrown(() => new AdminController(svc({ deleteTemplateItem: vi.fn().mockReturnValue({ error: 'gone', status: 404 }) } as Partial<AdminService>)).deleteTemplateItem('9'))).toEqual({ status: 404, body: { error: 'gone' } });
  });
});

describe('AdminController tokens + sessions', () => {
  it('mcp token + oauth session deletes return success and map errors', () => {
    expect(new AdminController(svc({ deleteMcpToken: vi.fn().mockReturnValue({}) } as Partial<AdminService>)).deleteMcpToken('2')).toEqual({ success: true });
    expect(thrown(() => new AdminController(svc({ deleteMcpToken: vi.fn().mockReturnValue({ error: 'no token', status: 404 }) } as Partial<AdminService>)).deleteMcpToken('9'))).toEqual({ status: 404, body: { error: 'no token' } });
    expect(thrown(() => new AdminController(svc({ revokeOAuthSession: vi.fn().mockReturnValue({ error: 'no session', status: 404 }) } as Partial<AdminService>)).revokeOAuthSession(user, '9', req))).toEqual({ status: 404, body: { error: 'no session' } });
  });
});

describe('AdminController default-user-settings error path', () => {
  it('400 with an Error message when setAdminUserDefaults throws an Error', () => {
    const c = new AdminController(svc({ setAdminUserDefaults: vi.fn(() => { throw new Error('bad default'); }) } as Partial<AdminService>));
    expect(thrown(() => c.setDefaultUserSettings(user, { theme: 'x' }, req))).toEqual({ status: 400, body: { error: 'bad default' } });
  });

  it('400 stringifies a non-Error throw', () => {
    const c = new AdminController(svc({ setAdminUserDefaults: vi.fn(() => { throw 'plain string'; }) } as Partial<AdminService>));
    expect(thrown(() => c.setDefaultUserSettings(user, { theme: 'x' }, req))).toEqual({ status: 400, body: { error: 'plain string' } });
  });

  it('400 when the body is null', () => {
    expect(thrown(() => new AdminController(svc()).setDefaultUserSettings(user, null, req))).toEqual({ status: 400, body: { error: 'Object body required' } });
  });
});

describe('AdminController dev test-notification', () => {
  it('404 outside development', async () => {
    delete process.env.NODE_ENV;
    await expect(new AdminController(svc()).devTestNotification(user, {})).rejects.toBeInstanceOf(NotFoundException);
  });

  it('sends in development', async () => {
    process.env.NODE_ENV = 'development';
    const res = await new AdminController(svc()).devTestNotification(user, { event: 'trip_reminder' });
    expect(res).toEqual({ success: true });
  });

  it('applies notification defaults when the body is empty', async () => {
    process.env.NODE_ENV = 'development';
    const res = await new AdminController(svc()).devTestNotification(user, {});
    expect(res).toEqual({ success: true });
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ event: 'trip_reminder', scope: 'user', targetId: user.id }));
  });

  it('maps an Error from the notification service to 400', async () => {
    process.env.NODE_ENV = 'development';
    (sendNotification as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('send failed'));
    await expect(new AdminController(svc()).devTestNotification(user, { event: 'trip_reminder' })).rejects.toMatchObject({ response: { error: 'send failed' } });
  });

  it('stringifies a non-Error notification failure to 400', async () => {
    process.env.NODE_ENV = 'development';
    (sendNotification as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce('weird');
    await expect(new AdminController(svc()).devTestNotification(user, { event: 'trip_reminder' })).rejects.toMatchObject({ response: { error: 'weird' } });
  });
});
