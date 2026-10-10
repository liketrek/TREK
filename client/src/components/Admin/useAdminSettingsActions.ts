import { adminApi, authApi } from '../../api/client';
import type { TranslationFn } from '../../types';
import { getApiErrorMessage } from '../../types';

type Flag = (value: boolean) => void;

interface OidcFields {
  issuer: string;
  client_id: string;
  client_secret: string;
  display_name: string;
  discovery_url: string;
}

interface SettingsActionsHost {
  toast: { success: (message: string) => void; error: (message: string) => void };
  oidcConfig: OidcFields;
  setSavingOidc: Flag;
  allowedFileTypes: string;
  setSavingFileTypes: Flag;
  setPlacesPhotosEnabledState: Flag;
  setPlacesPhotosEnabled: Flag;
  setPlacesAutocompleteEnabledState: Flag;
  setPlacesAutocompleteEnabled: Flag;
  setPlacesDetailsEnabledState: Flag;
  setPlacesDetailsEnabled: Flag;
  setPlacesEnrichEnabledState: Flag;
  setPlacesEnrichEnabled: Flag;
  setPlaceShadowEnabledState: Flag;
  setPlaceShadowEnabled: Flag;
}

/**
 * The saves behind the admin Settings tab and its phone twin: the OIDC provider, the
 * allowed file types and the place switches. The values live in the admin hook; this
 * only writes them, so both shells hand in the same admin bag.
 */
export function useAdminSettingsActions(admin: SettingsActionsHost, t: TranslationFn) {
  const { toast, oidcConfig, setSavingOidc, allowedFileTypes, setSavingFileTypes } = admin;

  const saveOidc = async () => {
    setSavingOidc(true);
    try {
      const payload: Record<string, unknown> = {
        issuer: oidcConfig.issuer,
        client_id: oidcConfig.client_id,
        display_name: oidcConfig.display_name,
        discovery_url: oidcConfig.discovery_url,
      };
      if (oidcConfig.client_secret) payload.client_secret = oidcConfig.client_secret;
      await adminApi.updateOidc(payload);
      toast.success(t('admin.oidcSaved'));
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setSavingOidc(false);
    }
  };

  const saveFileTypes = async () => {
    setSavingFileTypes(true);
    try {
      await authApi.updateAppSettings({ allowed_file_types: allowedFileTypes });
      toast.success(t('admin.fileTypesSaved'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSavingFileTypes(false);
    }
  };

  /**
   * A place switch shows the new value at once, in the tab and in the store the rest of
   * the app reads, and both flip back quietly when the save fails.
   */
  const placeSwitch = (setLocal: Flag, setStore: Flag, save: (enabled: boolean) => Promise<unknown>) => {
    return async (next: boolean) => {
      setLocal(next);
      setStore(next);
      try {
        await save(next);
      } catch {
        setLocal(!next);
        setStore(!next);
      }
    };
  };

  return {
    saveOidc,
    saveFileTypes,
    togglePlacesPhotos: placeSwitch(admin.setPlacesPhotosEnabledState, admin.setPlacesPhotosEnabled, (enabled) =>
      adminApi.updatePlacesPhotos(enabled)
    ),
    togglePlacesAutocomplete: placeSwitch(
      admin.setPlacesAutocompleteEnabledState,
      admin.setPlacesAutocompleteEnabled,
      (enabled) => adminApi.updatePlacesAutocomplete(enabled)
    ),
    togglePlacesDetails: placeSwitch(admin.setPlacesDetailsEnabledState, admin.setPlacesDetailsEnabled, (enabled) =>
      adminApi.updatePlacesDetails(enabled)
    ),
    togglePlacesEnrich: placeSwitch(admin.setPlacesEnrichEnabledState, admin.setPlacesEnrichEnabled, (enabled) =>
      adminApi.updatePlacesEnrich(enabled)
    ),
    togglePlaceShadow: placeSwitch(admin.setPlaceShadowEnabledState, admin.setPlaceShadowEnabled, (enabled) =>
      adminApi.updatePlaceShadow(enabled)
    ),
  };
}
