import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import type { WeatherResult } from '@trek/shared';
import { getWeather, getDetailedWeather, startCacheCleanup, stopCacheCleanup } from './weather.impl';

/**
 * The weather domain's container face, and the owner of the cache sweep's
 * lifecycle.
 *
 * The Open-Meteo calls and the response shaping live in weather.impl.ts, which
 * also holds the process-wide cache. That cache stays module state on purpose:
 * the MCP weather tools call getWeather directly, from outside the container,
 * and a cache is only worth having if every caller sees the same one. Moving it
 * into this class would mean handing the registrar the container instance to
 * achieve exactly what a module singleton already gives.
 *
 * What did have to move is the sweep timer — see startCacheCleanup.
 */
@Injectable()
export class WeatherService implements OnModuleInit, OnModuleDestroy {
  onModuleInit(): void {
    startCacheCleanup();
  }

  onModuleDestroy(): void {
    stopCacheCleanup();
  }

  get(lat: string, lng: string, date: string | undefined, lang: string, time?: string): Promise<WeatherResult> {
    return getWeather(lat, lng, date, lang, time) as Promise<WeatherResult>;
  }

  getDetailed(lat: string, lng: string, date: string, lang: string): Promise<WeatherResult> {
    return getDetailedWeather(lat, lng, date, lang) as Promise<WeatherResult>;
  }
}
