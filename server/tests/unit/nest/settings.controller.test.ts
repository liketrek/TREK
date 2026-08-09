import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';

import { SettingsController } from '../../../src/nest/settings/settings.controller';
import type { SettingsService } from '../../../src/nest/settings/settings.service';
import type { User } from '../../../src/types';

const user = { id: 1, role: 'user', email: 'u@example.test' } as User;

function svc(o: Partial<SettingsService> = {}): SettingsService {
  return { getUserSettings: vi.fn(), upsertSetting: vi.fn(), bulkUpsertSettings: vi.fn(), deleteSetting: vi.fn(), ...o } as unknown as SettingsService;
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
    expect(new SettingsController(svc({ getUserSettings: vi.fn().mockReturnValue({ theme: 'dark' }) } as Partial<SettingsService>)).list(user)).toEqual({ settings: { theme: 'dark' } });
  });

  it('PUT / 400 without a key', () => {
    expect(thrown(() => new SettingsController(svc()).upsert(user, {}))).toEqual({ status: 400, body: { error: 'Key is required' } });
  });

  it('PUT / no-ops on the masked sentinel without writing', () => {
    const upsertSetting = vi.fn();
    const c = new SettingsController(svc({ upsertSetting } as Partial<SettingsService>));
    expect(c.upsert(user, { key: 'immich_api_key', value: '••••••••' })).toEqual({ success: true, key: 'immich_api_key', unchanged: true });
    expect(upsertSetting).not.toHaveBeenCalled();
  });

  it('PUT / writes a real value', () => {
    const upsertSetting = vi.fn();
    const c = new SettingsController(svc({ upsertSetting } as Partial<SettingsService>));
    expect(c.upsert(user, { key: 'theme', value: 'dark' })).toEqual({ success: true, key: 'theme', value: 'dark' });
    expect(upsertSetting).toHaveBeenCalledWith(1, 'theme', 'dark');
  });

  it('normalizes common currencies and rejects invalid lists with 400', () => {
    const upsertSetting = vi.fn();
    const c = new SettingsController(svc({ upsertSetting } as Partial<SettingsService>));
    expect(c.upsert(user, { key: 'common_currencies', value: ['usd'] })).toEqual({ success: true, key: 'common_currencies', value: ['USD'] });
    expect(upsertSetting).toHaveBeenCalledWith(1, 'common_currencies', ['USD']);
    expect(thrown(() => c.upsert(user, { key: 'common_currencies', value: ['ZZZ'] })).status).toBe(400);
  });

  it('DELETE only resets common currencies and returns the inherited value', () => {
    const deleteSetting = vi.fn().mockReturnValue(['EUR']);
    const c = new SettingsController(svc({ deleteSetting } as Partial<SettingsService>));
    expect(c.delete(user, 'common_currencies')).toEqual({ success: true, key: 'common_currencies', value: ['EUR'] });
    expect(deleteSetting).toHaveBeenCalledWith(1, 'common_currencies');
    expect(thrown(() => c.delete(user, 'theme')).status).toBe(400);
  });

  it('DELETE rejects an invalid effective list returned by the service', () => {
    const c = new SettingsController(
      svc({ deleteSetting: vi.fn().mockReturnValue(['ZZZ']) } as Partial<SettingsService>),
    );

    expect(() => c.delete(user, 'common_currencies')).toThrow();
  });

  it('POST /bulk 400 without an object, 500 on a write error, else returns the count', () => {
    expect(thrown(() => new SettingsController(svc()).bulk(user, {}))).toEqual({ status: 400, body: { error: 'Settings object is required' } });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(thrown(() => new SettingsController(svc({ bulkUpsertSettings: vi.fn(() => { throw new Error('db'); }) } as Partial<SettingsService>)).bulk(user, { settings: { a: 1 } }))).toEqual({ status: 500, body: { error: 'Error saving settings' } });
    expect(new SettingsController(svc({ bulkUpsertSettings: vi.fn().mockReturnValue(3) } as Partial<SettingsService>)).bulk(user, { settings: { a: 1, b: 2, c: 3 } })).toEqual({ success: true, updated: 3 });
  });
});
