/**
 * The production wiring that connects a plugin's capability host to the real
 * privileged modules (#plugins, M1). Verifies the per-plugin data db is cached,
 * a granted db:own call works through the wired host, and trip broadcasts are
 * force-namespaced to plugin:{id}:{event}.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const { broadcast, broadcastToUser } = vi.hoisted(() => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));
vi.mock('../../../src/db/database', () => ({
  db: { prepare: () => ({ all: () => [], get: () => null }) },
  canAccessTrip: (tripId: number, userId: number) => (tripId === 1 && userId === 5 ? { id: 1 } : undefined),
}));
vi.mock('../../../src/websocket', () => ({ broadcast, broadcastToUser }));

import { createRealRpcHost, getPluginDataDb, closePluginDataDb } from '../../../src/nest/plugins/host/create-rpc-host';

let tmp: string;
beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trekplug-crh-'));
  process.env.TREK_PLUGINS_DATA_DIR = tmp;
});
afterAll(() => {
  closePluginDataDb('wired');
  delete process.env.TREK_PLUGINS_DATA_DIR;
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('create-rpc-host wiring', () => {
  it('caches one data db per plugin id', () => {
    const a = getPluginDataDb('wired');
    const b = getPluginDataDb('wired');
    expect(a).toBe(b);
  });

  it('a granted db:own call runs against the plugin db, and a trip broadcast is namespaced', async () => {
    const host = createRealRpcHost('wired', new Set(['db:own', 'ws:broadcast:trip']));
    const migrated = await host.dispatch({ k: 'req', id: '1', method: 'db.migrate', params: { id: '001', sql: 'CREATE TABLE t (v TEXT)' } });
    expect(migrated.ok).toBe(true);

    // acting user 5 is a member of trip 1 (mocked canAccessTrip) → broadcast allowed + namespaced
    await host.dispatch({ k: 'req', id: '2', method: 'ws.broadcastToTrip', params: { tripId: 1, event: 'ping', data: { a: 1 } } }, 5);
    expect(broadcast).toHaveBeenCalledWith(1, 'plugin:wired:ping', { a: 1 });

    const bcastUser = createRealRpcHost('wired', new Set(['ws:broadcast:user']));
    // a per-user broadcast may only target the acting user themselves
    await bcastUser.dispatch({ k: 'req', id: '3', method: 'ws.broadcastToUser', params: { userId: 5, event: 'hi', data: {} } }, 5);
    expect(broadcastToUser).toHaveBeenCalledWith(5, { type: 'plugin:wired', event: 'hi' });
  });

  it('closePluginDataDb closes and drops the cached handle', () => {
    getPluginDataDb('transient');
    closePluginDataDb('transient');
    // a fresh get after close returns a NEW instance (cache was cleared)
    const a = getPluginDataDb('transient');
    closePluginDataDb('transient');
    const b = getPluginDataDb('transient');
    expect(a).not.toBe(b);
    closePluginDataDb('transient');
  });
});
