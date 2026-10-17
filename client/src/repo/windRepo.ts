import type { WindForecastResponse } from '@trek/shared';
import { windApi } from '../api/wind';
import { isEffectivelyOffline } from '../sync/networkMode';

/** Thrown instead of asking while the app is offline, so the view can say so rather than show a failure. */
export class WindOfflineError extends Error {
  constructor() {
    super('Wind forecast needs a connection');
    this.name = 'WindOfflineError';
  }
}

/**
 * PAD-08: the wind forecast, online only on purpose. A forecast kept on the
 * device would be read later as the current one; it is asked again every time
 * and never cached here, and offline nothing is asked at all.
 */
export const windRepo = {
  async forecast(lat: number, lng: number, date: string, signal?: AbortSignal): Promise<WindForecastResponse> {
    if (isEffectivelyOffline()) throw new WindOfflineError();
    return windApi.forecast(lat, lng, date, signal);
  },
};
