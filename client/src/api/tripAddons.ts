import type { TripAddonsResponse, TripAddonUpdateRequest } from '@trek/shared';
import apiClient from './client';

/** The trip addons of one trip, each on or off for it: every member reads them, only the owner switches one. */
export const tripAddonsApi = {
  list: (tripId: number): Promise<TripAddonsResponse> => apiClient.get(`/trips/${tripId}/addons`).then((r) => r.data),
  /** `enabled: null` drops the trip's own choice, so the instance setting applies again. */
  update: (tripId: number, addonId: string, body: TripAddonUpdateRequest): Promise<TripAddonsResponse> =>
    apiClient.put(`/trips/${tripId}/addons/${encodeURIComponent(addonId)}`, body).then((r) => r.data),
};
