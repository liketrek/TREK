import type { AdminFeatureToggleResponse } from '@trek/shared';
import { Bike, Footprints, MountainSnow } from 'lucide-react';
import { useEffect, useEffectEvent, useState } from 'react';

import { adminApi } from '../../../api/client';
import { cycleMapAdminApi, hikingMapAdminApi, skiRoutingAdminApi } from '../../../api/tourBaseMaps';
import { wandererAdminApi } from '../../../api/wanderer';
import { useTranslation } from '../../../i18n';
import { useAddonStore } from '../../../store/addonStore';
import { useToast } from '../../shared/Toast';
import { type Addon, type ProviderOption, isPhotosAddon } from './addonModel';
import { aiAddonsOf, isAiAddon } from './aiAddons';

/** A switch under Tours as the server keeps it, read into `set`; `onError` tells the admin it could not be read. */
function loadToursFlag(
  api: { get: () => Promise<AdminFeatureToggleResponse> },
  set: (enabled: boolean) => void,
  onError: () => void
) {
  api
    .get()
    .then((flag) => set(flag.enabled))
    .catch(onError);
}

/**
 * The addon switches behind both admin shells: the addon list loaded on mount, an
 * optimistic toggle with a per row rollback, and the lists each shell groups its tiles
 * and provider shelves from. The desktop columns and the phone cards render their own
 * markup over it.
 */
export function useAddonManager() {
  const { t } = useTranslation();
  const toast = useToast();
  const refreshGlobalAddons = useAddonStore((s) => s.loadAddons);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [toursWanderer, setToursWanderer] = useState(false);
  const [toursHikingMap, setToursHikingMap] = useState(false);
  const [toursCycleMap, setToursCycleMap] = useState(false);
  const [toursSkiRouting, setToursSkiRouting] = useState(false);

  const loadAddons = async () => {
    try {
      const data = await adminApi.addons();
      setAddons(data.addons);
    } catch {
      toast.error(t('admin.addons.toast.error'));
    }
  };

  const loadOnMount = useEffectEvent(() => {
    void loadAddons().finally(() => setLoading(false));
    const unreadable = () => toast.error(t('admin.addons.toast.error'));
    loadToursFlag(wandererAdminApi, setToursWanderer, unreadable);
    loadToursFlag(hikingMapAdminApi, setToursHikingMap, unreadable);
    loadToursFlag(cycleMapAdminApi, setToursCycleMap, unreadable);
    loadToursFlag(skiRoutingAdminApi, setToursSkiRouting, unreadable);
  });
  useEffect(() => {
    loadOnMount();
  }, []);

  /** Optimistic flip, per-row rollback on failure. Rolling the whole addons
   *  snapshot back instead would undo a toggle the user hit in parallel. */
  const handleToggle = async (addon: Addon) => {
    const newEnabled = !addon.enabled;
    setAddons((prev) => prev.map((a) => (a.id === addon.id ? { ...a, enabled: newEnabled } : a)));
    try {
      await adminApi.updateAddon(addon.id, { enabled: newEnabled });
    } catch {
      setAddons((prev) => prev.map((a) => (a.id === addon.id ? { ...a, enabled: !newEnabled } : a)));
      toast.error(t('admin.addons.toast.error'));
      return;
    }
    refreshGlobalAddons();
    // Journey off disables every photo provider with it, and the response carries
    // only Journey. Without re-reading, switching Journey back on brings the shelf
    // up with providers the database has long since turned off.
    // Same for Documents: switching it off disables every document provider in
    // the database, and the response carries only the addon itself.
    if (addon.id === 'journey' || addon.id === 'documents') await loadAddons();
    toast.success(t('admin.addons.toast.updated'));
  };

  /** A switch under Tours (wanderer, OpenHikingMap, CyclOSM): flipped at once, put back when the save fails. */
  const flipToursSwitch = async (
    current: boolean,
    set: (enabled: boolean) => void,
    save: (enabled: boolean) => Promise<unknown>
  ) => {
    const next = !current;
    set(next);
    try {
      await save(next);
    } catch {
      set(!next);
      toast.error(t('admin.addons.toast.error'));
      return;
    }
    void refreshGlobalAddons();
    toast.success(t('admin.addons.toast.updated'));
  };
  const toggleToursWanderer = () => flipToursSwitch(toursWanderer, setToursWanderer, wandererAdminApi.update);
  /** The maps and the piste router Tours offers on their operators' terms, one switch each (MAP-01, BIK-06, SKI-02). */
  const mapSwitches = [
    {
      key: 'hiking',
      Icon: Footprints,
      titleKey: 'admin.toursHikingMap.title',
      subtitleKey: 'admin.toursHikingMap.subtitle',
      enabled: toursHikingMap,
      toggle: () => flipToursSwitch(toursHikingMap, setToursHikingMap, hikingMapAdminApi.update),
    },
    {
      key: 'cycle',
      Icon: Bike,
      titleKey: 'admin.toursCycleMap.title',
      subtitleKey: 'admin.toursCycleMap.subtitle',
      enabled: toursCycleMap,
      toggle: () => flipToursSwitch(toursCycleMap, setToursCycleMap, cycleMapAdminApi.update),
    },
    {
      key: 'ski',
      Icon: MountainSnow,
      titleKey: 'admin.toursSkiRouting.title',
      subtitleKey: 'admin.toursSkiRouting.subtitle',
      enabled: toursSkiRouting,
      toggle: () => flipToursSwitch(toursSkiRouting, setToursSkiRouting, skiRoutingAdminApi.update),
    },
  ] as const;

  const asOption = (provider: Addon): ProviderOption => ({
    key: provider.id,
    label: provider.name,
    description: provider.description,
    enabled: provider.enabled,
    toggle: () => handleToggle(provider),
  });

  const tripAddons = addons.filter((a) => a.type === 'trip' && !isPhotosAddon(a));
  const globalAddons = addons.filter((a) => a.type === 'global');
  // The AI addons leave the list to sit together on one tile at its head.
  const integrationAddons = addons.filter((a) => a.type === 'integration' && !isAiAddon(a));
  const aiAddons = aiAddonsOf(addons);
  const providerOptions = addons.filter((a) => a.type === 'photo_provider').map(asOption);
  // No credential form under these, unlike the photo providers: a document connection
  // belongs to a trip and is entered there. The admin only decides whether a provider
  // may be offered at all.
  const documentProviderOptions = addons.filter((a) => a.type === 'document_provider').map(asOption);

  return {
    addons,
    loading,
    handleToggle,
    tripAddons,
    globalAddons,
    integrationAddons,
    aiAddons,
    providerOptions,
    documentProviderOptions,
    toursWanderer,
    toggleToursWanderer,
    mapSwitches,
  };
}
