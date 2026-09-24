import React, { useEffect } from 'react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { StorageAdminState } from '@trek/shared';
import { server } from '../../../../tests/helpers/msw/server';
import { render, screen, waitFor } from '../../../../tests/helpers/render';
import { useStorageAdmin, type StorageAdmin } from './useStorageAdmin';

function baseState(overrides: Partial<StorageAdminState> = {}): StorageAdminState {
  return {
    backends: [
      { name: 'uploads-local', type: 'local', source: 'built-in', options: { root: '/data/uploads' }, categories: ['files'] },
    ],
    categories: { files: { backend: 'uploads-local', source: 'default' } } as StorageAdminState['categories'],
    health: { replicaFailures: [] },
    seedFilePresent: false,
    usage: null,
    backfills: [],
    migrations: [],
    version: 0,
    ...overrides,
  };
}

function runningState(): StorageAdminState {
  return baseState({
    migrations: [
      { category: 'files', from: 'uploads-local', to: 'off-box', status: 'running', done: 1, total: 3, copied: 1, skipped: 0, failed: 0, startedAt: 1 },
    ],
  });
}

/**
 * Exposes the hook to the test without a panel in the way — what the panels'
 * queue effect depends on is the hook's own timing, not any rendered output.
 */
function Probe({ onReady }: { onReady: (admin: StorageAdmin) => void }): React.ReactElement {
  const admin = useStorageAdmin('generic', 'conflict');
  // After every render, not during one: the test wants whatever the latest
  // render produced, and a render must stay free of side effects.
  useEffect(() => { onReady(admin); });
  return <div data-testid="ready">{admin.state ? 'loaded' : 'loading'}</div>;
}

describe('useStorageAdmin', () => {
  async function mount(): Promise<() => StorageAdmin> {
    let latest: StorageAdmin | null = null;
    render(<Probe onReady={(a) => { latest = a; }} />);
    await screen.findByText('loaded');
    return () => latest!;
  }

  it('FE-ADMIN-STOR-048: startMigration resolves only once storageBusy() already reports the started migration', async () => {
    let posted = false;
    server.use(
      http.get('/api/admin/storage', () => HttpResponse.json(posted ? runningState() : baseState())),
      http.post('/api/admin/storage/migrations', () => {
        posted = true;
        return HttpResponse.json({ started: true });
      }),
    );
    const admin = await mount();
    expect(admin().storageBusy()).toBe(false);

    // The queue effect releases its single-flight lock the moment this
    // resolves, so the world it then decides on must already be post-POST.
    expect(await admin().startMigration('files', 'off-box')).toBeNull();
    expect(admin().storageBusy()).toBe(true);
  });

  it('FE-ADMIN-STOR-049: storageBusy() is current at response time, before the render that shows it', async () => {
    server.use(http.get('/api/admin/storage', () => HttpResponse.json(runningState())));
    const admin = await mount();
    const before = admin();

    // No await on a render: refreshState resolving is the only synchronisation
    // point, and the ref must already carry the new world at that instant —
    // that is the whole point of it, since a deferred commit can run an effect
    // whose captured `state` is several responses behind.
    await before.refreshState();
    expect(before.storageBusy()).toBe(true);
    await waitFor(() => expect(admin().state!.migrations).toHaveLength(1));
  });

  it('FE-ADMIN-STOR-050: a failed refresh leaves storageBusy() on the last world that was actually applied', async () => {
    server.use(http.get('/api/admin/storage', () => HttpResponse.json(runningState())));
    const admin = await mount();
    expect(admin().storageBusy()).toBe(true);
    server.use(http.get('/api/admin/storage', () => HttpResponse.error()));

    // A transient GET failure must not read as "the server went idle" — that
    // is the one answer that would let a second migration start.
    await expect(admin().refreshState()).rejects.toThrow();
    expect(admin().storageBusy()).toBe(true);
  });
});
