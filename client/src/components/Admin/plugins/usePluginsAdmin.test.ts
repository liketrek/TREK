// FE-ADMIN-PLUGINS-HOOK-001 to -012: the plugin admin logic behind both admin shells.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { DragEvent } from 'react';

import { adminApi } from '../../../api/client';
import type { PluginRow, RegistryItem } from './pluginModel';
import { usePluginsAdmin } from './usePluginsAdmin';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const loadPlugins = vi.hoisted(() => vi.fn(async () => {}));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
  }),
}));
vi.mock('../../../store/pluginStore', () => ({ usePluginStore: { getState: () => ({ loadPlugins }) } }));

function row(over: Partial<PluginRow> = {}): PluginRow {
  return {
    id: 'alpha',
    name: 'Alpha',
    description: null,
    type: 'widget',
    icon: null,
    version: '1.0.0',
    status: 'active',
    enabled: 1,
    last_error: null,
    reviewed_at: null,
    source_repo: 'org/alpha',
    permissions: '[]',
    capabilities: '{}',
    ...over,
  };
}

function entry(over: Partial<RegistryItem> = {}): RegistryItem {
  return {
    id: 'alpha',
    name: 'Alpha',
    author: 'someone',
    description: 'does things',
    repo: 'org/alpha',
    type: 'widget',
    latest: '1.1.0',
    latestCompatible: '1.1.0',
    minTrekVersion: null,
    reviewedAt: null,
    screenshotUrl: null,
    ...over,
  };
}

function serve(plugins: PluginRow[], registry: RegistryItem[] = []) {
  vi.spyOn(adminApi, 'plugins').mockResolvedValue({ enabled: true, devLink: true, plugins });
  vi.spyOn(adminApi, 'pluginBrowse').mockResolvedValue(registry);
}

/** A promise this test controls the settling of. */
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

async function mounted() {
  const hook = renderHook(() => usePluginsAdmin());
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

function dragEvent(types: string[]): DragEvent {
  return { dataTransfer: { types, files: [] }, preventDefault: vi.fn() } as unknown as DragEvent;
}

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
  loadPlugins.mockClear();
});
afterEach(() => vi.restoreAllMocks());

describe('usePluginsAdmin', () => {
  it('FE-ADMIN-PLUGINS-HOOK-001: loads the plugins, syncs the app store and indexes the registry', async () => {
    serve([row()], [entry()]);
    const { result } = await mounted();
    expect(loadPlugins).toHaveBeenCalled();
    expect(result.current.runtimeOn).toBe(true);
    expect(result.current.devLink).toBe(true);
    expect(result.current.ready).toBe(true);
    await waitFor(() => expect(result.current.latest).toEqual({ alpha: '1.1.0' }));
    expect(result.current.regById.alpha?.name).toBe('Alpha');
    expect(result.current.updatable.map((p) => p.id)).toEqual(['alpha']);
  });

  it('FE-ADMIN-PLUGINS-HOOK-002: a failed load leaves the panel in its error state', async () => {
    vi.spyOn(adminApi, 'plugins').mockRejectedValue(new Error('down'));
    const { result } = await mounted();
    expect(result.current.error).toBe(true);
    expect(result.current.ready).toBe(false);
  });

  it('FE-ADMIN-PLUGINS-HOOK-003: switching tabs snaps a sort the tab cannot offer back to name', async () => {
    serve([row()]);
    const { result } = await mounted();
    act(() => result.current.setSort('updates'));
    act(() => result.current.setView('discover'));
    expect(result.current.sort).toBe('name');
    act(() => result.current.setSort('downloads'));
    act(() => result.current.setView('installed'));
    expect(result.current.sort).toBe('name');
  });

  it('FE-ADMIN-PLUGINS-HOOK-004: disabling a plugin deactivates it, says so and reloads the list', async () => {
    serve([row()]);
    vi.spyOn(adminApi, 'pluginDeactivate').mockResolvedValue({});
    const { result } = await mounted();
    await act(async () => {
      result.current.toggle(result.current.plugins[0]!);
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('admin.plugins.deactivated'));
    expect(adminApi.pluginDeactivate).toHaveBeenCalledWith('alpha');
    await waitFor(() => expect(adminApi.plugins).toHaveBeenCalledTimes(2));
  });

  it('FE-ADMIN-PLUGINS-HOOK-005: an activation needing consent queues it, and approving activates with consent', async () => {
    serve([row({ enabled: 0, signed: false })]);
    vi.spyOn(adminApi, 'pluginActivate')
      .mockRejectedValueOnce({
        response: { status: 409, data: { code: 'CONSENT_REQUIRED', newPermissions: ['db:own'], newEgress: [] } },
      })
      .mockResolvedValue({});
    const { result } = await mounted();
    await act(async () => {
      result.current.toggle(result.current.plugins[0]!);
    });
    await waitFor(() => expect(result.current.consentQueue).toHaveLength(1));
    expect(result.current.consentQueue[0]).toMatchObject({ version: '1.0.0', newPermissions: ['db:own'] });
    expect(result.current.consentUnsigned).toBe(true);
    await act(async () => {
      await result.current.approveConsent();
    });
    expect(adminApi.pluginActivate).toHaveBeenLastCalledWith('alpha', true);
    expect(result.current.consentQueue).toHaveLength(0);
  });

  it('FE-ADMIN-PLUGINS-HOOK-006: deferring consent drops it from the queue and says the plugin stays off', async () => {
    serve([row({ enabled: 0 })]);
    vi.spyOn(adminApi, 'pluginActivate').mockRejectedValue({
      response: { status: 409, data: { code: 'CONSENT_REQUIRED', newPermissions: [], newEgress: ['x.example'] } },
    });
    const { result } = await mounted();
    await act(async () => {
      result.current.toggle(result.current.plugins[0]!);
    });
    await waitFor(() => expect(result.current.consentQueue).toHaveLength(1));
    act(() => result.current.deferConsent());
    expect(result.current.consentQueue).toHaveLength(0);
    expect(toast.success).toHaveBeenCalledWith('admin.plugins.updateKeptOff');
  });

  it('FE-ADMIN-PLUGINS-HOOK-007: a signature refusal opens the dialog, named from the registry for a new install', async () => {
    serve([], [entry({ id: 'beta', name: 'Beta' })]);
    vi.spyOn(adminApi, 'pluginInstall').mockRejectedValue({
      response: { data: { code: 'SIGNATURE_INVALID', error: 'bad signature' } },
    });
    const { result } = await mounted();
    await act(async () => {
      result.current.openDiscover();
    });
    await waitFor(() => expect(result.current.regById.beta).toBeDefined());
    await act(async () => {
      result.current.install('beta');
    });
    await waitFor(() => expect(result.current.signatureBlock).not.toBeNull());
    expect(result.current.signatureBlock).toEqual({
      subject: { id: 'beta', name: 'Beta', keyFingerprint: null },
      code: 'SIGNATURE_INVALID',
      detail: 'bad signature',
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('FE-ADMIN-PLUGINS-HOOK-008: Update all runs the updates one after another', async () => {
    serve([row({ id: 'a', name: 'A' }), row({ id: 'b', name: 'B' })], [entry({ id: 'a' }), entry({ id: 'b' })]);
    const first = deferred<unknown>();
    const update = vi
      .spyOn(adminApi, 'pluginUpdate')
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue({ version: '1.1.0', activated: true, newPermissions: [], newEgress: [] });
    const { result } = await mounted();
    await waitFor(() => expect(result.current.updatable).toHaveLength(2));
    let done!: Promise<void>;
    act(() => {
      done = result.current.updateAll();
    });
    expect(update).toHaveBeenCalledTimes(1);
    await act(async () => {
      first.resolve({ version: '1.1.0', activated: true, newPermissions: [], newEgress: [] });
      await done;
    });
    expect(update).toHaveBeenCalledTimes(2);
  });

  it('FE-ADMIN-PLUGINS-HOOK-009: Update all starts only the first update, without a version', async () => {
    serve([row({ id: 'a', name: 'A' }), row({ id: 'b', name: 'B' })], [entry({ id: 'a' }), entry({ id: 'b' })]);
    const update = vi.spyOn(adminApi, 'pluginUpdate').mockReturnValue(new Promise(() => {}));
    const { result } = await mounted();
    await waitFor(() => expect(result.current.updatable).toHaveLength(2));
    act(() => {
      void result.current.updateAll();
    });
    expect(update.mock.calls).toEqual([['a', undefined]]);
  });

  it('FE-ADMIN-PLUGINS-HOOK-010: the drop overlay arms on a file drag and ignores an unmatched leave', async () => {
    serve([row()]);
    const { result } = await mounted();
    act(() => result.current.onDragLeave());
    expect(result.current.dragActive).toBe(false);
    act(() => result.current.onDragEnter(dragEvent(['text/plain'])));
    expect(result.current.dragActive).toBe(false);
    act(() => result.current.onDragEnter(dragEvent(['Files'])));
    act(() => result.current.onDragEnter(dragEvent(['Files'])));
    act(() => result.current.onDragLeave());
    expect(result.current.dragActive).toBe(true);
    act(() => result.current.onDragLeave());
    expect(result.current.dragActive).toBe(false);
  });

  it('FE-ADMIN-PLUGINS-HOOK-011: picking an older version asks first, and confirming installs that version', async () => {
    serve([row({ version: '2.0.0' })]);
    vi.spyOn(adminApi, 'pluginDetail').mockResolvedValue({ versions: [] });
    const update = vi
      .spyOn(adminApi, 'pluginUpdate')
      .mockResolvedValue({ version: '1.0.0', activated: true, newPermissions: [], newEgress: [] });
    const { result } = await mounted();
    act(() => result.current.openVersionPicker(result.current.plugins[0]!));
    await waitFor(() => expect(result.current.versionPicker?.versions).toEqual([]));
    act(() => result.current.pickVersion('1.0.0'));
    expect(result.current.versionPicker).toBeNull();
    expect(result.current.confirmDowngrade).toMatchObject({ version: '1.0.0' });
    await act(async () => {
      result.current.downgradeConfirmed();
    });
    expect(update).toHaveBeenCalledWith('alpha', '1.0.0');
    expect(result.current.confirmDowngrade).toBeNull();
  });

  it('FE-ADMIN-PLUGINS-HOOK-012: uninstall goes through the confirm, and the row menu names its plugin', async () => {
    serve([row()]);
    vi.spyOn(adminApi, 'pluginUninstall').mockResolvedValue({});
    const { result } = await mounted();
    act(() => result.current.setMenu('row:alpha'));
    expect(result.current.rowMenuPlugin?.id).toBe('alpha');
    act(() => result.current.askUninstall(result.current.plugins[0]!));
    expect(result.current.menu).toBeNull();
    expect(result.current.confirmUninstall?.id).toBe('alpha');
    await act(async () => {
      await result.current.uninstallConfirmed();
    });
    expect(adminApi.pluginUninstall).toHaveBeenCalledWith('alpha', true);
    expect(toast.success).toHaveBeenCalledWith('admin.plugins.uninstalled');
    expect(result.current.confirmUninstall).toBeNull();
  });
});
