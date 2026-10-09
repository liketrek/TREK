// FE-COMP-PHOTOCONN-001 to -011: the photo provider connection logic both settings shells share.
import { act, renderHook, waitFor } from '@testing-library/react';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import apiClient from '../../api/client';
import { useAddonStore } from '../../store/addonStore';
import {
  getProviderConfig,
  getProviderFields,
  usePhotoProviderConnections,
  type PhotoProviderAddon,
} from './usePhotoProviderConnections';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (k: string, p?: Record<string, unknown>) => (p ? `${k}(${String(p.provider_name)})` : k),
  }),
}));

const PROVIDER: PhotoProviderAddon = {
  id: 'immich',
  name: 'Immich',
  type: 'photo_provider',
  enabled: true,
  config: {
    settings_get: '/addons/immich/settings',
    settings_put: '/addons/immich/settings',
    status_get: '/addons/immich/status',
    test_post: '/addons/immich/test',
  },
  fields: [
    {
      key: 'api_key',
      label: 'api_key',
      input_type: 'text',
      required: true,
      secret: true,
      settings_key: 'api_key',
      payload_key: 'api_key',
      sort_order: 1,
    },
    {
      key: 'url',
      label: 'url',
      input_type: 'text',
      required: true,
      secret: false,
      settings_key: 'url',
      payload_key: 'url',
      sort_order: 0,
    },
    {
      key: 'shared',
      label: 'shared',
      input_type: 'checkbox',
      required: false,
      secret: false,
      settings_key: 'include_shared',
      payload_key: null,
      sort_order: 2,
    },
  ],
};

type Resp = { data: Record<string, unknown> };

function seedProviders(providers: PhotoProviderAddon[], memories = true) {
  seedStore(useAddonStore, {
    addons: providers,
    isEnabled: (id: string) => memories && id === 'memories',
  });
}

/** Answers GETs by path, so the settings read and the status read can be told apart. */
function stubGets(byPath: Record<string, Resp | (() => Promise<Resp>)>) {
  return vi.spyOn(apiClient, 'get').mockImplementation((url: string) => {
    const hit = byPath[url];
    if (!hit) return Promise.reject(new Error(`unexpected GET ${url}`));
    return typeof hit === 'function' ? hit() : Promise.resolve(hit);
  });
}

function render() {
  return renderHook(() => usePhotoProviderConnections());
}

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
});
afterEach(() => vi.restoreAllMocks());

describe('photo provider helpers', () => {
  it('FE-COMP-PHOTOCONN-001: config keeps only string routes and fields come sorted', () => {
    expect(getProviderConfig({ ...PROVIDER, config: { settings_get: '/s', status_get: 5 } })).toEqual({
      settings_get: '/s',
      settings_put: undefined,
      status_get: undefined,
      test_get: undefined,
      test_post: undefined,
    });
    expect(getProviderFields(PROVIDER).map((f) => f.key)).toEqual(['url', 'api_key', 'shared']);
  });
});

describe('usePhotoProviderConnections', () => {
  it('FE-COMP-PHOTOCONN-002: only enabled photo providers count, and memories gates the section', () => {
    seedProviders(
      [PROVIDER, { ...PROVIDER, id: 'off', enabled: false }, { ...PROVIDER, id: 'x', type: 'other' }],
      false
    );
    stubGets({});
    const { result } = render();
    expect(result.current.memoriesEnabled).toBe(false);
    expect(result.current.activePhotoProviders.map((p) => p.id)).toEqual(['immich']);
  });

  it('FE-COMP-PHOTOCONN-003: hydrates the non secret fields, maps checkbox values and leaves the secret blank', async () => {
    seedProviders([PROVIDER]);
    stubGets({
      '/addons/immich/settings': { data: { url: 'https://p.example', api_key: 'secret', include_shared: true } },
      '/addons/immich/status': { data: { connected: true } },
    });
    const { result } = render();
    await waitFor(() => expect(result.current.providerValues.immich?.url).toBe('https://p.example'));
    expect(result.current.providerValues.immich).toEqual({ url: 'https://p.example', shared: 'true' });
    await waitFor(() => expect(result.current.providerConnected.immich).toBe(true));
  });

  it('FE-COMP-PHOTOCONN-004: the status route owns the badge, so a late settings read does not override it', async () => {
    seedProviders([PROVIDER]);
    let resolveSettings!: (r: Resp) => void;
    stubGets({
      '/addons/immich/settings': () => new Promise<Resp>((r) => (resolveSettings = r)),
      '/addons/immich/status': { data: { connected: true } },
    });
    const { result } = render();
    await waitFor(() => expect(result.current.providerConnected.immich).toBe(true));
    await act(async () => resolveSettings({ data: { url: 'u', connected: false } }));
    expect(result.current.providerValues.immich?.url).toBe('u');
    expect(result.current.providerConnected.immich).toBe(true);
  });

  it('FE-COMP-PHOTOCONN-005: a provider without a status route takes the badge from the settings read', async () => {
    seedProviders([{ ...PROVIDER, config: { settings_get: '/addons/immich/settings' } }]);
    stubGets({ '/addons/immich/settings': { data: { url: 'u', connected: true } } });
    const { result } = render();
    await waitFor(() => expect(result.current.providerConnected.immich).toBe(true));
  });

  it('FE-COMP-PHOTOCONN-006: save is blocked while a required field is blank', async () => {
    seedProviders([PROVIDER]);
    stubGets({ '/addons/immich/settings': { data: {} }, '/addons/immich/status': { data: {} } });
    const { result } = render();
    await waitFor(() => expect(result.current.providerValues.immich?.url).toBe(''));
    expect(result.current.isProviderSaveDisabled(PROVIDER)).toBe(true);
    act(() => result.current.handleProviderFieldChange('immich', 'url', 'https://a'));
    act(() => result.current.handleProviderFieldChange('immich', 'api_key', 'k'));
    expect(result.current.isProviderSaveDisabled(PROVIDER)).toBe(false);
  });

  it('FE-COMP-PHOTOCONN-007: save puts the payload without a blank secret, rechecks the status and toasts', async () => {
    seedProviders([PROVIDER]);
    const get = stubGets({
      '/addons/immich/settings': { data: { url: 'https://a' } },
      '/addons/immich/status': { data: { connected: false } },
    });
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue({ data: {} });
    const { result } = render();
    await waitFor(() => expect(result.current.providerValues.immich?.url).toBe('https://a'));
    act(() => result.current.handleProviderFieldChange('immich', 'url', ' https://b '));
    get.mockClear();
    await act(() => result.current.handleSaveProvider(PROVIDER));
    expect(put).toHaveBeenCalledWith('/addons/immich/settings', { url: 'https://b', include_shared: false });
    expect(get).toHaveBeenCalledWith('/addons/immich/status');
    expect(toast.success).toHaveBeenCalledWith('memories.saved(Immich)');
    expect(result.current.saving.immich).toBe(false);
  });

  it('FE-COMP-PHOTOCONN-008: a failed save toasts the error and a provider without a save route does nothing', async () => {
    seedProviders([PROVIDER]);
    stubGets({ '/addons/immich/settings': { data: {} }, '/addons/immich/status': { data: {} } });
    const put = vi.spyOn(apiClient, 'put').mockRejectedValue(new Error('x'));
    const { result } = render();
    await act(() => result.current.handleSaveProvider(PROVIDER));
    expect(toast.error).toHaveBeenCalledWith('memories.saveError(Immich)');
    put.mockClear();
    await act(() => result.current.handleSaveProvider({ ...PROVIDER, config: {} }));
    expect(put).not.toHaveBeenCalled();
  });

  it('FE-COMP-PHOTOCONN-009: a POST test sends the form, a GET test only probes the saved credentials', async () => {
    seedProviders([PROVIDER]);
    const get = stubGets({
      '/addons/immich/settings': { data: { url: 'https://a' } },
      '/addons/immich/status': { data: {} },
    });
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { connected: true } });
    const { result } = render();
    await waitFor(() => expect(result.current.providerValues.immich?.url).toBe('https://a'));
    await act(() => result.current.handleTestProvider(PROVIDER));
    expect(post).toHaveBeenCalledWith('/addons/immich/test', { url: 'https://a', include_shared: false });
    expect(result.current.providerConnected.immich).toBe(true);
    expect(toast.success).toHaveBeenCalledWith('memories.connectionSuccess(Immich)');
    get.mockClear();
    const getOnly = { ...PROVIDER, config: { status_get: '/addons/immich/status' } };
    await act(() => result.current.handleTestProvider(getOnly));
    expect(get).toHaveBeenCalledWith('/addons/immich/status');
    expect(result.current.providerTesting.immich).toBe(false);
  });

  it('FE-COMP-PHOTOCONN-010: a failed probe joins the server reason as ": reason" on both shells', async () => {
    seedProviders([PROVIDER]);
    stubGets({ '/addons/immich/settings': { data: {} }, '/addons/immich/status': { data: {} } });
    vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { connected: false, error: 'bad key' } });
    const phone = render();
    await act(() => phone.result.current.handleTestProvider(PROVIDER));
    expect(toast.error).toHaveBeenLastCalledWith('memories.connectionError(Immich): bad key');
    const desktop = render();
    await act(() => desktop.result.current.handleTestProvider(PROVIDER));
    expect(toast.error).toHaveBeenLastCalledWith('memories.connectionError(Immich): bad key');
    vi.mocked(apiClient.post).mockResolvedValue({ data: { connected: false } });
    await act(() => desktop.result.current.handleTestProvider(PROVIDER));
    expect(toast.error).toHaveBeenLastCalledWith('memories.connectionError(Immich)');
    vi.mocked(apiClient.post).mockRejectedValue(new Error('x'));
    await act(() => desktop.result.current.handleTestProvider(PROVIDER));
    expect(toast.error).toHaveBeenLastCalledWith('memories.connectionError(Immich)');
  });

  it('FE-COMP-PHOTOCONN-011: providerCard hands each card its fields, values, badge and working buttons', async () => {
    seedProviders([PROVIDER]);
    stubGets({
      '/addons/immich/settings': { data: { url: 'https://a' } },
      '/addons/immich/status': { data: { connected: true } },
    });
    const { result } = render();
    await waitFor(() => expect(result.current.providerCard(PROVIDER).connected).toBe(true));
    const card = result.current.providerCard(PROVIDER);
    expect(card.fields.map((f) => f.key)).toEqual(['url', 'api_key', 'shared']);
    expect(card.values).toEqual({ url: 'https://a', shared: 'false' });
    expect(card).toMatchObject({ testing: false, canSave: true, canTest: true });
    const bare = result.current.providerCard({ ...PROVIDER, id: 'other', config: {} });
    expect(bare).toMatchObject({ values: {}, connected: false, canSave: false, canTest: false });
  });
});
