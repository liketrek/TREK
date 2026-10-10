// FE-DOCSYNC-SCOPE-001 to FE-DOCSYNC-SCOPE-008: picking the container a trip syncs with,
// behind the desktop scope dialog and the phone sheet's scope step.
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DocSyncScope, useDocSync } from './useDocSync';
import { NEW_SCOPE, useScopePicker } from './useScopePicker';

const FOLDER: DocSyncScope = { scopeKey: 'f1', label: 'Japan', remoteRootId: 'r1', remoteRootPath: '/Japan' };

function fakeSync(over: Record<string, unknown> = {}) {
  return {
    loadScopes: vi.fn(async () => ({ scopes: [FOLDER] as DocSyncScope[], error: undefined as string | undefined })),
    createScope: vi.fn(async (_id: number, name: string) => ({ ...FOLDER, scopeKey: 'new', label: name })),
    createLink: vi.fn(async () => true),
    ...over,
  } as unknown as ReturnType<typeof useDocSync>;
}

function setup(sync = fakeSync(), connectionId = 4) {
  const onBound = vi.fn();
  const hook = renderHook(
    (props: { connectionId: number }) =>
      useScopePicker({ connectionId: props.connectionId, suggestedName: 'japan-1', sync, onBound }),
    {
      initialProps: { connectionId },
    }
  );
  return { ...hook, sync, onBound };
}

describe('useScopePicker', () => {
  it('FE-DOCSYNC-SCOPE-001: starts with the suggested name and lists the containers', async () => {
    const { result, sync } = setup();
    expect(result.current.name).toBe('japan-1');
    expect(result.current.scopes).toBeNull();
    await waitFor(() => expect(result.current.scopes).toEqual([FOLDER]));
    expect(sync.loadScopes).toHaveBeenCalledWith(4);
    expect(result.current.error).toBeNull();
    expect(result.current.working).toBeNull();
  });

  it('FE-DOCSYNC-SCOPE-002: a listing the store refused shows its error', async () => {
    const sync = fakeSync({ loadScopes: vi.fn(async () => ({ scopes: [], error: 'unreachable' })) });
    const { result } = setup(sync);
    await waitFor(() => expect(result.current.error).toBe('unreachable'));
    expect(result.current.scopes).toEqual([]);
  });

  it('FE-DOCSYNC-SCOPE-003: a listing for a connection left behind is dropped', async () => {
    let resolveFirst: (v: { scopes: DocSyncScope[] }) => void = () => {};
    const other: DocSyncScope = { ...FOLDER, scopeKey: 'f2', label: 'Other' };
    const loadScopes = vi
      .fn()
      .mockReturnValueOnce(new Promise((r) => (resolveFirst = r)))
      .mockResolvedValueOnce({ scopes: [other] });
    const { result, rerender } = setup(fakeSync({ loadScopes }), 4);
    rerender({ connectionId: 5 });
    await waitFor(() => expect(result.current.scopes).toEqual([other]));
    await act(async () => {
      resolveFirst({ scopes: [FOLDER] });
    });
    expect(result.current.scopes).toEqual([other]);
  });

  it('FE-DOCSYNC-SCOPE-004: binding a container links it two way and hands over', async () => {
    const { result, sync, onBound } = setup();
    await act(async () => {
      await result.current.bind(FOLDER);
    });
    expect(sync.createLink).toHaveBeenCalledWith({
      connectionId: 4,
      scopeKey: 'f1',
      remoteRootId: 'r1',
      remoteRootPath: '/Japan',
      remoteLabel: 'Japan',
      direction: 'both',
      deletePolicy: 'unlink',
      conflictPolicy: 'manual',
      syncEnabled: true,
    });
    expect(onBound).toHaveBeenCalledTimes(1);
    expect(result.current.working).toBeNull();
  });

  it('FE-DOCSYNC-SCOPE-005: a refused link stays on the picker', async () => {
    const { result, onBound } = setup(fakeSync({ createLink: vi.fn(async () => false) }));
    await act(async () => {
      await result.current.bind(FOLDER);
    });
    expect(onBound).not.toHaveBeenCalled();
    expect(result.current.working).toBeNull();
  });

  it('FE-DOCSYNC-SCOPE-006: a new container is made under the trimmed name and bound', async () => {
    let resolveCreate: (v: DocSyncScope) => void = () => {};
    const createScope = vi.fn(() => new Promise<DocSyncScope>((r) => (resolveCreate = r)));
    const { result, sync, onBound } = setup(fakeSync({ createScope }));
    act(() => result.current.setName('  Kyoto  '));

    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.createAndBind();
    });
    expect(result.current.working).toBe(NEW_SCOPE);
    await act(async () => {
      resolveCreate({ ...FOLDER, scopeKey: 'new', label: 'Kyoto' });
      await pending;
    });
    expect(createScope).toHaveBeenCalledWith(4, 'Kyoto');
    expect(sync.createLink).toHaveBeenCalledWith(expect.objectContaining({ scopeKey: 'new', remoteLabel: 'Kyoto' }));
    expect(onBound).toHaveBeenCalledTimes(1);
    expect(result.current.working).toBeNull();
  });

  it('FE-DOCSYNC-SCOPE-007: a blank name makes nothing', async () => {
    const { result, sync } = setup();
    act(() => result.current.setName('   '));
    await act(async () => {
      await result.current.createAndBind();
    });
    expect(sync.createScope).not.toHaveBeenCalled();
    expect(result.current.working).toBeNull();
  });

  it('FE-DOCSYNC-SCOPE-008: a refused create binds nothing and clears the marker', async () => {
    const { result, sync, onBound } = setup(fakeSync({ createScope: vi.fn(async () => null) }));
    await act(async () => {
      await result.current.createAndBind();
    });
    expect(sync.createLink).not.toHaveBeenCalled();
    expect(onBound).not.toHaveBeenCalled();
    expect(result.current.working).toBeNull();
  });
});
