import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAdminSettingsActions } from './useAdminSettingsActions';

// FE-HOOK-ADMSETACT-001 to FE-HOOK-ADMSETACT-008

const api = vi.hoisted(() => ({
  updateOidc: vi.fn(),
  updateAppSettings: vi.fn(),
  updatePlacesPhotos: vi.fn(),
  updatePlacesAutocomplete: vi.fn(),
  updatePlacesDetails: vi.fn(),
  updatePlacesEnrich: vi.fn(),
  updatePlaceShadow: vi.fn(),
}));
vi.mock('../../api/client', () => ({
  adminApi: {
    updateOidc: api.updateOidc,
    updatePlacesPhotos: api.updatePlacesPhotos,
    updatePlacesAutocomplete: api.updatePlacesAutocomplete,
    updatePlacesDetails: api.updatePlacesDetails,
    updatePlacesEnrich: api.updatePlacesEnrich,
    updatePlaceShadow: api.updatePlaceShadow,
  },
  authApi: { updateAppSettings: api.updateAppSettings },
}));

const t = (key: string) => key;

function host(over: Record<string, unknown> = {}) {
  return {
    toast: { success: vi.fn(), error: vi.fn() },
    oidcConfig: {
      issuer: 'https://idp',
      client_id: 'trek',
      client_secret: '',
      display_name: 'SSO',
      discovery_url: '',
    },
    setSavingOidc: vi.fn(),
    allowedFileTypes: 'jpg,pdf',
    setSavingFileTypes: vi.fn(),
    setPlacesPhotosEnabledState: vi.fn(),
    setPlacesPhotosEnabled: vi.fn(),
    setPlacesAutocompleteEnabledState: vi.fn(),
    setPlacesAutocompleteEnabled: vi.fn(),
    setPlacesDetailsEnabledState: vi.fn(),
    setPlacesDetailsEnabled: vi.fn(),
    setPlacesEnrichEnabledState: vi.fn(),
    setPlacesEnrichEnabled: vi.fn(),
    setPlaceShadowEnabledState: vi.fn(),
    setPlaceShadowEnabled: vi.fn(),
    ...over,
  };
}

function mount(admin = host()) {
  return { admin, actions: renderHook(() => useAdminSettingsActions(admin, t)).result.current };
}

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset().mockResolvedValue({});
});

describe('useAdminSettingsActions', () => {
  it('FE-HOOK-ADMSETACT-001: saving OIDC leaves an empty secret out and toasts', async () => {
    const { admin, actions } = mount();
    await act(() => actions.saveOidc());
    expect(api.updateOidc).toHaveBeenCalledWith({
      issuer: 'https://idp',
      client_id: 'trek',
      display_name: 'SSO',
      discovery_url: '',
    });
    expect(admin.toast.success).toHaveBeenCalledWith('admin.oidcSaved');
    expect(admin.setSavingOidc.mock.calls).toEqual([[true], [false]]);
  });

  it('FE-HOOK-ADMSETACT-002: a typed secret is sent along', async () => {
    const admin = host({
      oidcConfig: { issuer: 'i', client_id: 'c', client_secret: 's3cret', display_name: 'd', discovery_url: 'u' },
    });
    const { actions } = mount(admin);
    await act(() => actions.saveOidc());
    expect(api.updateOidc).toHaveBeenCalledWith(expect.objectContaining({ client_secret: 's3cret' }));
  });

  it('FE-HOOK-ADMSETACT-003: a failed OIDC save shows the server message and clears saving', async () => {
    api.updateOidc.mockRejectedValue({ response: { data: { error: 'Bad issuer' } } });
    const { admin, actions } = mount();
    await act(() => actions.saveOidc());
    expect(admin.toast.error).toHaveBeenCalledWith('Bad issuer');
    expect(admin.setSavingOidc).toHaveBeenLastCalledWith(false);
  });

  it('FE-HOOK-ADMSETACT-004: saving file types writes the list and toasts', async () => {
    const { admin, actions } = mount();
    await act(() => actions.saveFileTypes());
    expect(api.updateAppSettings).toHaveBeenCalledWith({ allowed_file_types: 'jpg,pdf' });
    expect(admin.toast.success).toHaveBeenCalledWith('admin.fileTypesSaved');
    expect(admin.setSavingFileTypes.mock.calls).toEqual([[true], [false]]);
  });

  it('FE-HOOK-ADMSETACT-005: a failed file type save shows the generic error', async () => {
    api.updateAppSettings.mockRejectedValue(new Error('x'));
    const { admin, actions } = mount();
    await act(() => actions.saveFileTypes());
    expect(admin.toast.error).toHaveBeenCalledWith('common.error');
    expect(admin.toast.success).not.toHaveBeenCalled();
    expect(admin.setSavingFileTypes).toHaveBeenLastCalledWith(false);
  });

  it('FE-HOOK-ADMSETACT-006: a place switch sets the tab and the store, then saves', async () => {
    const { admin, actions } = mount();
    await act(() => actions.togglePlacesPhotos(true));
    expect(admin.setPlacesPhotosEnabledState).toHaveBeenCalledWith(true);
    expect(admin.setPlacesPhotosEnabled).toHaveBeenCalledWith(true);
    expect(api.updatePlacesPhotos).toHaveBeenCalledWith(true);
  });

  it('FE-HOOK-ADMSETACT-007: a failed place switch flips both back without a toast', async () => {
    api.updatePlaceShadow.mockRejectedValue(new Error('x'));
    const { admin, actions } = mount();
    await act(() => actions.togglePlaceShadow(true));
    expect(admin.setPlaceShadowEnabledState.mock.calls).toEqual([[true], [false]]);
    expect(admin.setPlaceShadowEnabled.mock.calls).toEqual([[true], [false]]);
    expect(admin.toast.error).not.toHaveBeenCalled();
  });

  it('FE-HOOK-ADMSETACT-008: each place switch writes its own setting', async () => {
    const { admin, actions } = mount();
    await act(() => actions.togglePlacesAutocomplete(false));
    await act(() => actions.togglePlacesDetails(false));
    await act(() => actions.togglePlacesEnrich(false));
    expect(api.updatePlacesAutocomplete).toHaveBeenCalledWith(false);
    expect(api.updatePlacesDetails).toHaveBeenCalledWith(false);
    expect(api.updatePlacesEnrich).toHaveBeenCalledWith(false);
    expect(admin.setPlacesAutocompleteEnabled).toHaveBeenCalledWith(false);
    expect(admin.setPlacesDetailsEnabledState).toHaveBeenCalledWith(false);
    expect(admin.setPlacesEnrichEnabled).toHaveBeenCalledWith(false);
  });
});
