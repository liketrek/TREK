/**
 * The account defaults, after the two routes moved off AdminController next to
 * SettingsService, which owns them. Same path, same audit action, same 400 envelope on
 * a rejected write — these cases came over with the routes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import { AdminDefaultUserSettingsController } from '../../../src/nest/settings/settings.controller';
import { SettingsModule } from '../../../src/nest/settings/settings.module';
import type { SettingsService } from '../../../src/nest/settings/settings.service';
import type { AuditService } from '../../../src/nest/audit/audit.service';
import type { User } from '../../../src/types';
import { expectRegisteredController } from '../../helpers/module-providers';
import type { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';

const user = { id: 1, role: 'admin' } as User;
const req = { headers: {}, socket: {} } as never;
const writeAudit = vi.fn();

function controller(over: Partial<SettingsService> = {}) {
  const settings = {
    getAdminUserDefaults: vi.fn(() => ({ theme: 'dark' })),
    setAdminUserDefaults: vi.fn(),
    ...over,
  } as unknown as SettingsService;
  return { c: new AdminDefaultUserSettingsController(settings, { writeAudit } as unknown as AuditService, { isManaged: () => false } as unknown as RuntimeEnvService), settings };
}

const thrown = (run: () => unknown) => {
  try {
    run();
    return null;
  } catch (e) {
    return e instanceof HttpException ? { status: e.getStatus(), body: e.getResponse() } : e;
  }
};

describe('AdminDefaultUserSettingsController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('DEFAULTS-001 GET returns the stored defaults verbatim', () => {
    expect(controller().c.get()).toEqual({ theme: 'dark' });
  });

  it('DEFAULTS-002 PUT writes, audits, and answers with the STORED defaults', () => {
    const { c, settings } = controller();
    // Not the request body: the service normalises and drops unknown keys, and the
    // admin panel renders straight from this response.
    expect(c.update(user, { theme: 'light' } as never, req)).toEqual({ theme: 'dark' });
    expect(settings.setAdminUserDefaults).toHaveBeenCalledWith({ theme: 'light' });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, action: 'admin.default_user_settings_update', details: { theme: 'light' } }),
    );
  });

  it('DEFAULTS-003 a rejected write is a 400 carrying the message, and is not audited', () => {
    const { c } = controller({
      setAdminUserDefaults: vi.fn(() => {
        throw new Error('unknown setting: nope');
      }),
    } as Partial<SettingsService>);
    expect(thrown(() => c.update(user, { nope: 1 } as never, req))).toEqual({
      status: 400,
      body: { error: 'unknown setting: nope' },
    });
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('DEFAULTS-004 a non-Error throw is stringified rather than swallowed', () => {
    const { c } = controller({
      setAdminUserDefaults: vi.fn(() => {
        throw 'plain string';
      }),
    } as Partial<SettingsService>);
    expect(thrown(() => c.update(user, {} as never, req))).toEqual({ status: 400, body: { error: 'plain string' } });
  });

  it('DEFAULTS-005 the class is listed in its module controllers', () => {
    expectRegisteredController(SettingsModule, AdminDefaultUserSettingsController);
  });
});
