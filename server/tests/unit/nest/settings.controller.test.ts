import type { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import type { SettingsWritesService } from '../../../src/nest/settings/settings-writes.service';
import { SettingsController } from '../../../src/nest/settings/settings.controller';
import type { SettingsService } from '../../../src/nest/settings/settings.service';
import type { User } from '../../../src/types';
import { HttpException } from '@nestjs/common';

import { describe, it, expect, vi, beforeEach } from 'vitest';

const user = { id: 1, role: 'user', email: 'u@example.test' } as User;

function svc(o: Partial<SettingsService> = {}): SettingsService {
  return {
    getUserSettings: vi.fn(),
    upsertSetting: vi.fn(),
    bulkUpsertSettings: vi.fn(),
    ...o,
  } as unknown as SettingsService;
}

async function thrown(fn: () => unknown): Promise<{ status: number; body: unknown }> {
  try {
    await fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

beforeEach(() => vi.clearAllMocks());

/**
 * SettingsWritesService over the stubbed service: the writes go through it, so
 * it hands each on and records the socket the route read. The settings:updated
 * it sends is held by tools-settings.test.ts and the broadcast parity suite.
 */
function writesFor(s: SettingsService) {
  return {
    saveOne: vi.fn((userId: number, key: string, value: unknown, _socketId: string | undefined) =>
      s.upsertSetting(userId, key, value),
    ),
    saveMany: vi.fn((userId: number, values: Record<string, unknown>, _socketId: string | undefined) =>
      s.bulkUpsertSettings(userId, values),
    ),
  };
}
let writes: ReturnType<typeof writesFor>;

function controller(s: SettingsService) {
  writes = writesFor(s);
  const env = { isManaged: () => false } as unknown as RuntimeEnvService;
  return new SettingsController(s, env, writes as unknown as SettingsWritesService);
}

describe('SettingsController', () => {
  it('GET / returns the settings', async () => {
    expect(
      await controller(
        svc({ getUserSettings: vi.fn().mockReturnValue({ theme: 'dark' }) } as Partial<SettingsService>),
      ).list(user),
    ).toEqual({ settings: { theme: 'dark' } });
  });

  // The 400-without-a-key path moved to the global ZodValidationPipe (via
  // SettingUpsertDto) — pinned by the settings e2e, not reachable here.

  it('PUT / no-ops on the masked sentinel without writing', async () => {
    const upsertSetting = vi.fn();
    const c = controller(svc({ upsertSetting } as Partial<SettingsService>));
    expect(await c.upsert(user, { key: 'immich_api_key', value: '••••••••' })).toEqual({
      success: true,
      key: 'immich_api_key',
      unchanged: true,
    });
    expect(upsertSetting).not.toHaveBeenCalled();
    expect(writes.saveOne).not.toHaveBeenCalled();
  });

  it('PUT / writes a real value', async () => {
    const upsertSetting = vi.fn();
    const c = controller(svc({ upsertSetting } as Partial<SettingsService>));
    expect(await c.upsert(user, { key: 'theme', value: 'dark' }, 'sock')).toEqual({
      success: true,
      key: 'theme',
      value: 'dark',
    });
    expect(upsertSetting).toHaveBeenCalledWith(1, 'theme', 'dark');
    // Through the writes, which tell the user's other tabs and leave out this one.
    expect(writes.saveOne).toHaveBeenCalledWith(1, 'theme', 'dark', 'sock');
  });

  it('POST /bulk 500 on a write error, else returns the count', async () => {
    // The 400-without-an-object path moved to the global ZodValidationPipe
    // (via SettingsBulkDto) — pinned by the settings e2e, not reachable here.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(
      await thrown(() =>
        controller(
          svc({
            bulkUpsertSettings: vi.fn(() => {
              throw new Error('db');
            }),
          } as Partial<SettingsService>),
        ).bulk(user, { settings: { a: 1 } }),
      ),
    ).toEqual({ status: 500, body: { error: 'Error saving settings' } });
    expect(
      await controller(svc({ bulkUpsertSettings: vi.fn().mockReturnValue(3) } as Partial<SettingsService>)).bulk(
        user,
        { settings: { a: 1, b: 2, c: 3 } },
        'sock',
      ),
    ).toEqual({ success: true, updated: 3 });
    expect(writes.saveMany).toHaveBeenCalledWith(1, { a: 1, b: 2, c: 3 }, 'sock');
  });
});
