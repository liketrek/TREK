import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpException, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';

vi.mock('../../../src/services/auditLog', () => ({ writeAudit: vi.fn(), getClientIp: vi.fn(() => '1.2.3.4'), logInfo: vi.fn() }));
vi.mock('../../../src/services/notificationService', () => ({ send: vi.fn().mockResolvedValue(undefined) }));

import { AdminController } from '../../../src/nest/admin/admin.controller';
import type { AdminService } from '../../../src/nest/admin/admin.service';
import { writeAudit } from '../../../src/services/auditLog';
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

  it('collab-features update invalidates MCP sessions + audits', () => {
    const invalidateMcpSessions = vi.fn();
    const c = new AdminController(svc({ updateCollabFeatures: vi.fn().mockReturnValue({ chat: true }), invalidateMcpSessions } as Partial<AdminService>));
    expect(c.updateCollabFeatures(user, { chat: true }, req)).toEqual({ chat: true });
    expect(invalidateMcpSessions).toHaveBeenCalled();
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
  it('addon update audits + invalidates MCP sessions', () => {
    const invalidateMcpSessions = vi.fn();
    const c = new AdminController(svc({ updateAddon: vi.fn().mockReturnValue({ addon: { id: 'mcp', enabled: true }, auditDetails: {} }), invalidateMcpSessions } as Partial<AdminService>));
    expect(c.updateAddon(user, 'mcp', { enabled: true }, req)).toEqual({ addon: { id: 'mcp', enabled: true } });
    expect(invalidateMcpSessions).toHaveBeenCalled();
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
});
