import { windForecastResponseSchema, type WindForecastResponse } from '@trek/shared';
import apiClient from './client';

/** PAD-08: the wind forecast for one place and one day. */
export const windApi = {
  forecast: (lat: number, lng: number, date: string, signal?: AbortSignal): Promise<WindForecastResponse> =>
    apiClient
      .get('/weather/wind', { params: { lat, lng, date }, signal })
      .then((r) => windForecastResponseSchema.parse(r.data)),
};
