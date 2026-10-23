/**
 * SettingsWritesService: the save goes through SettingsService, and the user's
 * other tabs hear which keys changed. Keys only, never a value, and a masked
 * secret echoed back by a settings form is named in no event, because nothing
 * about it changed.
 *
 * Replaced: SettingsService (its writes have their own suite) and the realtime
 * transport, which the test module fakes.
 */
import { SettingsWritesService } from '../../../../src/nest/settings/settings-writes.service';
import { SettingsService } from '../../../../src/nest/settings/settings.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MASKED_SETTING_VALUE } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let writes: SettingsWritesService;

const settings = {
  upsertSetting: vi.fn(async (_userId: number, _key: string, _value: unknown) => undefined),
  bulkUpsertSettings: vi.fn(async (_userId: number, values: Record<string, unknown>) => {
    return Object.values(values).filter((value) => value !== MASKED_SETTING_VALUE).length;
  }),
};

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [],
    providers: [SettingsWritesService, { provide: SettingsService, useValue: settings }],
  });
  writes = t.get(SettingsWritesService);
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterAll(async () => {
  await t.close();
});

describe('SettingsWritesService', () => {
  it('SET-WR-001: saveOne writes the key and names it to the other tabs, leaving the asking one out', async () => {
    await writes.saveOne(7, 'temperature_unit', 'celsius', 'sock-1');

    expect(settings.upsertSetting).toHaveBeenCalledWith(7, 'temperature_unit', 'celsius');
    expect(t.realtime.broadcastToUserMock).toHaveBeenCalledTimes(1);
    expect(t.realtime.broadcastToUserMock).toHaveBeenCalledWith(
      7,
      { type: 'settings:updated', keys: ['temperature_unit'] },
      'sock-1',
    );
  });

  it('SET-WR-002: saveMany leaves a masked secret out of the keys and never sends a value', async () => {
    const written = await writes.saveMany(7, { maps_api_key: MASKED_SETTING_VALUE, week_start: 'monday' }, 'sock-2');

    expect(written).toBe(1);
    expect(t.realtime.broadcastToUserMock).toHaveBeenCalledTimes(1);
    expect(t.realtime.broadcastToUserMock).toHaveBeenCalledWith(
      7,
      { type: 'settings:updated', keys: ['week_start'] },
      'sock-2',
    );
  });

  it('SET-WR-003: saveMany with nothing but masked secrets sends no event at all', async () => {
    const written = await writes.saveMany(7, { maps_api_key: MASKED_SETTING_VALUE }, undefined);

    expect(written).toBe(0);
    expect(settings.bulkUpsertSettings).toHaveBeenCalledTimes(1);
    expect(t.realtime.broadcastToUserMock).not.toHaveBeenCalled();
  });

  it('SET-WR-004: without a socket (the MCP path) every tab of the user hears it', async () => {
    await writes.saveMany(7, { week_start: 'sunday' }, undefined);

    expect(t.realtime.broadcastToUserMock).toHaveBeenCalledWith(
      7,
      { type: 'settings:updated', keys: ['week_start'] },
      undefined,
    );
  });
});
