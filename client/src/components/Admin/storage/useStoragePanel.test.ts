// FE-ADMIN-STOR-PANEL-001 to -017: the storage panel logic behind both admin shells.
import { act, renderHook, waitFor } from '@testing-library/react';

import { STORAGE_CATEGORIES, type StorageAdminState, type StorageBackend, type StorageConfig } from '@trek/shared';

import { removeBackend, settingsDocumentOf } from './storageModel';
import type { StorageAdmin } from './useStorageAdmin';
import { migrationPromptLine, useStoragePanel } from './useStoragePanel';

const fake = vi.hoisted(() => ({ admin: null as unknown as StorageAdmin }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('./useStorageAdmin', () => ({ useStorageAdmin: () => fake.admin }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
  }),
}));

function baseState(): StorageAdminState {
  return {
    backends: [
      { name: 'uploads-local', type: 'local', source: 'built-in', options: { root: '/data' }, categories: [] },
      { name: 'off-box', type: 'local', source: 'settings', options: { root: '/mnt' }, categories: [] },
    ],
    categories: Object.fromEntries(
      STORAGE_CATEGORIES.map((category) => [category, { backend: 'uploads-local', source: 'default' }])
    ) as StorageAdminState['categories'],
    health: { replicaFailures: [] },
    seedFilePresent: false,
    usage: null,
    backfills: [],
    migrations: [],
    version: 3,
    configError: null,
  };
}

function makeAdmin(state: StorageAdminState | null, draft?: StorageConfig): StorageAdmin {
  return {
    state,
    storageBusy: vi.fn(() => false),
    draft: state ? { ...(draft ?? settingsDocumentOf(state)), version: state.version } : null,
    dirty: false,
    loading: false,
    loadError: null,
    saveError: null,
    saveConflict: false,
    saving: false,
    testResults: {},
    setDraft: vi.fn(),
    save: vi.fn(async () => true),
    test: vi.fn(async () => {}),
    testMirror: vi.fn(async () => {}),
    startBackfill: vi.fn(async () => null),
    cancelBackfill: vi.fn(async () => null),
    startMigration: vi.fn(async () => null),
    cancelMigration: vi.fn(async () => null),
    refreshStats: vi.fn(async () => null),
    refreshState: vi.fn(async () => {}),
    discardDraft: vi.fn(async () => {}),
  };
}

/** A draft that moves the given categories onto `off-box`. */
function movingDraft(...categories: string[]): StorageConfig {
  const state = baseState();
  return {
    ...settingsDocumentOf(state),
    categories: Object.fromEntries(categories.map((c) => [c, 'off-box'])) as StorageConfig['categories'],
  };
}

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
});

describe('useStoragePanel', () => {
  it('FE-ADMIN-STOR-PANEL-001: nothing is loaded until the state and the draft exist', () => {
    fake.admin = makeAdmin(null);
    const { result } = renderHook(() => useStoragePanel());
    expect(result.current.loaded).toBeNull();
  });

  it('FE-ADMIN-STOR-PANEL-002: a loaded panel folds the rows and lists every backend name', () => {
    fake.admin = makeAdmin(baseState());
    const { result } = renderHook(() => useStoragePanel());
    expect(result.current.loaded?.rows.map((r) => r.name)).toEqual(['uploads-local', 'off-box']);
    expect(result.current.loaded?.backendNames).toEqual(['uploads-local', 'off-box']);
    expect(result.current.loaded?.migrationCandidates).toEqual([]);
  });

  it('FE-ADMIN-STOR-PANEL-003: add and edit open the editor with the right mirror candidates', () => {
    fake.admin = makeAdmin(baseState());
    const { result } = renderHook(() => useStoragePanel());
    act(() => result.current.loaded!.startAdd());
    expect(result.current.editing).toMatchObject({ initial: null, originalName: null, mirror: { initialTargets: [] } });
    const row = result.current.loaded!.rows[1]!;
    act(() => result.current.loaded!.startEdit(row));
    expect(result.current.editing).toMatchObject({ initial: row.backend, originalName: 'off-box' });
  });

  it('FE-ADMIN-STOR-PANEL-004: a rename commits the renamed backend and closes the editor', () => {
    fake.admin = makeAdmin(baseState());
    const { result } = renderHook(() => useStoragePanel());
    act(() => result.current.loaded!.startEdit(result.current.loaded!.rows[1]!));
    const renamed: StorageBackend = { name: 'off-site', type: 'local', options: { root: '/mnt' } };
    act(() => result.current.loaded!.commitBackend(renamed));
    const next = vi.mocked(fake.admin.setDraft).mock.calls[0]![0];
    expect(next.backends.map((b) => b.name)).toEqual(['off-site']);
    expect(result.current.editing).toBeNull();
  });

  it('FE-ADMIN-STOR-PANEL-005: a category back on its default drops the override, any other sets it', () => {
    fake.admin = makeAdmin(baseState(), movingDraft('files'));
    const { result } = renderHook(() => useStoragePanel());
    act(() => result.current.loaded!.setCategory('files', 'uploads-local'));
    expect(vi.mocked(fake.admin.setDraft).mock.calls[0]![0].categories).toEqual({});
    act(() => result.current.loaded!.setCategory('covers', 'off-box'));
    expect(vi.mocked(fake.admin.setDraft).mock.calls[1]![0].categories).toEqual({
      files: 'off-box',
      covers: 'off-box',
    });
  });

  it('FE-ADMIN-STOR-PANEL-006: confirming a removal drops the backend and closes the confirm', () => {
    fake.admin = makeAdmin(baseState());
    const { result } = renderHook(() => useStoragePanel());
    act(() => result.current.setConfirmRemove({ name: 'off-box', degenerate: true }));
    expect(result.current.loaded!.removeMessage('off-box', true)).toBe('storage.remove.body {"name":"off-box"}');
    act(() => result.current.loaded!.confirmRemoval());
    expect(fake.admin.setDraft).toHaveBeenCalledWith(removeBackend(fake.admin.draft!, 'off-box'));
    expect(result.current.confirmRemove).toBeNull();
  });

  it('FE-ADMIN-STOR-PANEL-007: a save with nothing to move saves straight away and says so', async () => {
    fake.admin = makeAdmin(baseState());
    const { result } = renderHook(() => useStoragePanel());
    await act(async () => {
      await result.current.loaded!.save();
    });
    expect(fake.admin.save).toHaveBeenCalledWith();
    expect(toast.success).toHaveBeenCalledWith('storage.saved');
    expect(result.current.migratePrompt).toBeNull();
  });

  it('FE-ADMIN-STOR-PANEL-008: a save that moves a category asks first, then saves without it and queues the move', async () => {
    fake.admin = makeAdmin(baseState(), movingDraft('files'));
    const { result } = renderHook(() => useStoragePanel());
    await act(async () => {
      await result.current.loaded!.save();
    });
    expect(fake.admin.save).not.toHaveBeenCalled();
    expect(result.current.migratePrompt?.map((c) => c.category)).toEqual(['files']);
    await act(async () => {
      await result.current.loaded!.moveAndSave();
    });
    expect(vi.mocked(fake.admin.save).mock.calls[0]![0]!.categories).toEqual({});
    expect(result.current.migratePrompt).toBeNull();
    await waitFor(() => expect(fake.admin.startMigration).toHaveBeenCalledWith('files', 'off-box'));
    expect(toast.success).toHaveBeenCalledWith('storage.saved');
  });

  it('FE-ADMIN-STOR-PANEL-009: moveAndSave moves exactly the candidates a shell hands it', async () => {
    fake.admin = makeAdmin(baseState(), movingDraft('files', 'covers'));
    const { result } = renderHook(() => useStoragePanel());
    const [files] = result.current.loaded!.migrationCandidates;
    await act(async () => {
      await result.current.loaded!.moveAndSave([files!]);
    });
    expect(vi.mocked(fake.admin.save).mock.calls[0]![0]!.categories).toEqual({ covers: 'off-box' });
    await waitFor(() => expect(fake.admin.startMigration).toHaveBeenCalledTimes(1));
  });

  it('FE-ADMIN-STOR-PANEL-010: route only closes the prompt and saves the draft as it is', async () => {
    fake.admin = makeAdmin(baseState(), movingDraft('files'));
    const { result } = renderHook(() => useStoragePanel());
    await act(async () => {
      await result.current.loaded!.save();
    });
    await act(async () => {
      await result.current.loaded!.routeOnlySave();
    });
    expect(fake.admin.save).toHaveBeenCalledWith();
    expect(result.current.migratePrompt).toBeNull();
    act(() => result.current.closeMigratePrompt());
    expect(result.current.migratePrompt).toBeNull();
  });

  it('FE-ADMIN-STOR-PANEL-011: a failed migration start toasts, drops the rest of the queue, and refreshes', async () => {
    fake.admin = makeAdmin(baseState(), movingDraft('files', 'covers'));
    vi.mocked(fake.admin.startMigration).mockResolvedValueOnce('busy');
    const { result } = renderHook(() => useStoragePanel());
    await act(async () => {
      await result.current.loaded!.moveAndSave();
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('busy'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(2));
    expect(result.current.migrationQueue).toHaveLength(0);
    expect(fake.admin.refreshState).toHaveBeenCalled();
  });

  it('FE-ADMIN-STOR-PANEL-012: a failed start drops the rest, names it, and refreshes', async () => {
    fake.admin = makeAdmin(baseState(), movingDraft('files', 'covers'));
    vi.mocked(fake.admin.startMigration).mockResolvedValueOnce('busy');
    const { result } = renderHook(() => useStoragePanel());
    await act(async () => {
      await result.current.loaded!.moveAndSave();
    });
    await waitFor(() => expect(fake.admin.refreshState).toHaveBeenCalled());
    expect(toast.error).toHaveBeenNthCalledWith(1, 'busy');
    expect(toast.error).toHaveBeenNthCalledWith(
      2,
      'storage.migrate.queueDropped {"categories":"storage.category.covers"}'
    );
    expect(result.current.migrationQueue).toEqual([]);
    expect(fake.admin.startMigration).toHaveBeenCalledTimes(1);
  });

  it('FE-ADMIN-STOR-PANEL-017: testRow probes a plain row as it is and a mirrored row per draft target', () => {
    const state = baseState();
    const draft: StorageConfig = {
      ...settingsDocumentOf(state),
      backends: [
        ...settingsDocumentOf(state).backends,
        { name: 'off-box-mirror', type: 'mirror', options: { primary: 'off-box', replicas: ['uploads-local'] } },
      ],
    };
    fake.admin = makeAdmin(state, draft);
    const { result } = renderHook(() => useStoragePanel());
    const rows = result.current.loaded!.rows;
    void result.current.loaded!.testRow(rows.find((r) => r.name === 'uploads-local')!);
    expect(fake.admin.test).toHaveBeenCalledWith(expect.objectContaining({ name: 'uploads-local' }));
    void result.current.loaded!.testRow(rows.find((r) => r.name === 'off-box')!);
    expect(fake.admin.testMirror).toHaveBeenCalledWith('off-box-mirror', [
      expect.objectContaining({ name: 'off-box', type: 'local' }),
      expect.objectContaining({ name: 'uploads-local', type: 'local' }),
    ]);
  });

  it('FE-ADMIN-STOR-PANEL-013: backfill and stats actions toast the server error', async () => {
    fake.admin = makeAdmin(baseState());
    vi.mocked(fake.admin.refreshStats).mockResolvedValueOnce('scan failed');
    vi.mocked(fake.admin.startBackfill).mockResolvedValueOnce('no mirror');
    const { result } = renderHook(() => useStoragePanel());
    const row = result.current.loaded!.rows[0]!;
    await act(async () => {
      await result.current.handleRefreshStats();
      await result.current.handleStartBackfill(row);
      await result.current.handleStartBackfill({ ...row, mirrorName: 'm' });
    });
    expect(fake.admin.startBackfill).toHaveBeenCalledTimes(1);
    expect(fake.admin.startBackfill).toHaveBeenCalledWith('m');
    expect(toast.error.mock.calls).toEqual([['scan failed'], ['no mirror']]);
  });
});

describe('migrationPromptLine', () => {
  const t = (key: string, params?: Record<string, string | number>) =>
    params ? `${key} ${JSON.stringify(params)}` : key;

  it('FE-ADMIN-STOR-PANEL-014: a counted category names its object count and size', () => {
    expect(
      migrationPromptLine(t, { category: 'covers', from: 'a', to: 'b', toWire: 'b', objects: 3, bytes: 2048 })
    ).toBe(
      'storage.migrate.promptLine {"category":"storage.category.covers","count":3,"size":"2.0 KB","from":"a","to":"b"}'
    );
  });

  it('FE-ADMIN-STOR-PANEL-015: a counted category with unknown bytes reports zero bytes', () => {
    expect(
      migrationPromptLine(t, { category: 'covers', from: 'a', to: 'b', toWire: 'b', objects: 0, bytes: null })
    ).toBe(
      'storage.migrate.promptLine {"category":"storage.category.covers","count":0,"size":"0 B","from":"a","to":"b"}'
    );
  });

  it('FE-ADMIN-STOR-PANEL-016: an uncounted category gets the line without count and size', () => {
    expect(
      migrationPromptLine(t, { category: 'covers', from: 'a', to: 'b', toWire: 'b', objects: null, bytes: null })
    ).toBe('storage.migrate.promptLineUnknown {"category":"storage.category.covers","from":"a","to":"b"}');
  });
});
