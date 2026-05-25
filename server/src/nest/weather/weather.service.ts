import { Injectable } from '@nestjs/common';
import type { WeatherResult } from '@trek/shared';
import { getWeather, getDetailedWeather } from '../../services/weatherService';

/**
 * Thin Nest wrapper around the existing weather service. It delegates to the
 * exact same `getWeather` / `getDetailedWeather` functions the legacy route and
 * the MCP tools use, so behaviour — including the shared in-memory cache and the
 * Open-Meteo calls — is identical. No logic is duplicated; the upstream service
 * stays the single source of truth (still consumed by the MCP weather tools).
 */
@Injectable()
export class WeatherService {
  get(lat: string, lng: string, date: string | undefined, lang: string): Promise<WeatherResult> {
    return getWeather(lat, lng, date, lang) as Promise<WeatherResult>;
  }

  getDetailed(lat: string, lng: string, date: string, lang: string): Promise<WeatherResult> {
    return getDetailedWeather(lat, lng, date, lang) as Promise<WeatherResult>;
  }
}
