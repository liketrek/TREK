import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';

import { SettingsController } from '../../../src/nest/settings/settings.controller';
import type { SettingsService } from '../../../src/nest/settings/settings.service';
import type { User } from '../../../src/types';
import type { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';

const user = { id: 1, role: 'user', email: 'u@example.test' } as User;

function svc(o: Partial<SettingsService> = {}): SettingsService {
  return { getUserSettings: vi.fn(), upsertSetting: vi.fn(), bulkUpsertSettings: vi.fn(), ...o } as unknown as SettingsService;
}

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try { fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

beforeEach(() => vi.clearAllMocks());

describe('SettingsController', () => {
  it('GET / returns the settings', () => {
    expect(new SettingsController(svc({ getUserSettings: vi.fn().mockReturnValue({ theme: 'dark' }) } as Partial<SettingsService>), { isManaged: () => false } as unknown as RuntimeEnvService).list(user)).toEqual({ settings: { theme: 'dark' } });
  });

  // The 400-without-a-key path moved to the global ZodValidationPipe (via
  // SettingUpsertDto) — pinned by the settings e2e, not reachable here.

  it('PUT / no-ops on the masked sentinel without writing', () => {
    const upsertSetting = vi.fn();
    const c = new SettingsController(svc({ upsertSetting } as Partial<SettingsService>), { isManaged: () => false } as unknown as RuntimeEnvService);
    expect(c.upsert(user, { key: 'immich_api_key', value: '••••••••' })).toEqual({ success: true, key: 'immich_api_key', unchanged: true });
    expect(upsertSetting).not.toHaveBeenCalled();
  });

  it('PUT / writes a real value', () => {
    const upsertSetting = vi.fn();
    const c = new SettingsController(svc({ upsertSetting } as Partial<SettingsService>), { isManaged: () => false } as unknown as RuntimeEnvService);
    expect(c.upsert(user, { key: 'theme', value: 'dark' })).toEqual({ success: true, key: 'theme', value: 'dark' });
    expect(upsertSetting).toHaveBeenCalledWith(1, 'theme', 'dark');
  });

  it('POST /bulk 500 on a write error, else returns the count', () => {
    // The 400-without-an-object path moved to the global ZodValidationPipe
    // (via SettingsBulkDto) — pinned by the settings e2e, not reachable here.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(thrown(() => new SettingsController(svc({ bulkUpsertSettings: vi.fn(() => { throw new Error('db'); }) } as Partial<SettingsService>), { isManaged: () => false } as unknown as RuntimeEnvService).bulk(user, { settings: { a: 1 } }))).toEqual({ status: 500, body: { error: 'Error saving settings' } });
    expect(new SettingsController(svc({ bulkUpsertSettings: vi.fn().mockReturnValue(3) } as Partial<SettingsService>), { isManaged: () => false } as unknown as RuntimeEnvService).bulk(user, { settings: { a: 1, b: 2, c: 3 } })).toEqual({ success: true, updated: 3 });
  });
});
