import type { AdminFeatureToggleResponse } from '@trek/shared';
import apiClient from './client';

/** An admin's switch for a map or a service the Tours planner offers on its operator's terms. */
function tourBaseMapAdminApi(path: string) {
  return {
    get: (): Promise<AdminFeatureToggleResponse> => apiClient.get(path).then((r) => r.data),
    update: (enabled: boolean): Promise<AdminFeatureToggleResponse> =>
      apiClient.put(path, { enabled }).then((r) => r.data),
  };
}

/** MAP-01: OpenHikingMap for a hike. */
export const hikingMapAdminApi = tourBaseMapAdminApi('/admin/tours-hiking-map');
/** BIK-06: CyclOSM for a bike tour. */
export const cycleMapAdminApi = tourBaseMapAdminApi('/admin/tours-cycle-map');
/** SKI-02: the piste router, which plans ski tours on the Places host's piste data. */
export const skiRoutingAdminApi = tourBaseMapAdminApi('/admin/tours-ski-routing');
