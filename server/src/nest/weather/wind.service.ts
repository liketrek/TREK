import { readCappedJson } from '../../utils/cappedFetch';
import { logWarn } from '../audit/audit-log.logger';
import { DomainError } from '../common/domain-error';
import { Injectable } from '@nestjs/common';
import { WIND_FORECAST_DAYS, type WindForecastResponse, type WindForecastStatus, type WindQuery } from '@trek/shared';

import { z } from 'zod';

/** Open-Meteo on the request path: a deadline and a size cap, as the weather calls have. */
const WIND_TIMEOUT_MS = 8000;
const MAX_WIND_BYTES = 256 * 1024;
/** A forecast is rerun every few hours; half an hour keeps it fresh without asking for every pan. */
const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const DAY_MS = 24 * 60 * 60 * 1000;

const series = z.array(z.number().nullable());
/** The part of Open-Meteo's answer the wind is read from; anything else in it is ignored. */
const openMeteoWindSchema = z.object({
  timezone: z.string(),
  hourly: z.object({
    time: z.array(z.string()),
    wind_speed_10m: series,
    wind_gusts_10m: series.optional(),
    wind_direction_10m: series.optional(),
  }),
  daily: z.object({
    wind_speed_10m_max: series,
    wind_gusts_10m_max: series.optional(),
    wind_direction_10m_dominant: series.optional(),
  }),
});

export const WIND_UNAVAILABLE_MESSAGE = 'The wind forecast is not available right now';

/** Rounded to a whole km/h or degree; a missing value stays missing. */
function whole(value: number | null | undefined): number | null {
  return value === null || value === undefined || !Number.isFinite(value) ? null : Math.round(value);
}

/**
 * PAD-08: the wind for a place on one day, from the Open-Meteo forecast TREK's
 * weather already uses. Only the forecast is asked: a day in the past or
 * beyond the forecast's reach answers with its status and no figures, so a
 * climate value is never passed off as the day's wind. A failed request is a
 * 502 the client can tell from "no forecast yet", never an empty answer.
 */
@Injectable()
export class WindService {
  private readonly cache = new Map<string, { value: WindForecastResponse; expiresAt: number }>();
  private readonly pending = new Map<string, Promise<WindForecastResponse>>();

  async forecast(query: WindQuery, now: number = Date.now()): Promise<WindForecastResponse> {
    const status = statusOf(query.date, now);
    if (status !== 'forecast') return empty(query, status, now);
    const key = `${query.lat.toFixed(2)}_${query.lng.toFixed(2)}_${query.date}`;
    const hit = this.cache.get(key);
    if (hit && hit.expiresAt > now) return hit.value;
    const running = this.pending.get(key);
    if (running !== undefined) return running;
    const request = this.fetchDay(query, now)
      .then((value) => {
        this.remember(key, value, now);
        return value;
      })
      .finally(() => this.pending.delete(key));
    this.pending.set(key, request);
    return request;
  }

  private remember(key: string, value: WindForecastResponse, now: number): void {
    if (this.cache.size >= CACHE_MAX_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(key, { value, expiresAt: now + CACHE_TTL_MS });
  }

  private async fetchDay(query: WindQuery, now: number): Promise<WindForecastResponse> {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${query.lat}&longitude=${query.lng}` +
      '&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m' +
      '&daily=wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant' +
      `&timezone=auto&wind_speed_unit=kmh&start_date=${query.date}&end_date=${query.date}`;
    let parsed: z.infer<typeof openMeteoWindSchema>;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(WIND_TIMEOUT_MS) });
      if (!response.ok) {
        await response.body?.cancel().catch(() => undefined);
        throw new Error(`Open-Meteo ${response.status}`);
      }
      parsed = openMeteoWindSchema.parse(await readCappedJson<unknown>(response, MAX_WIND_BYTES));
    } catch (err) {
      logWarn(`[Wind] forecast for ${query.date} failed: ${err instanceof Error ? err.message : String(err)}`);
      throw new DomainError(502, WIND_UNAVAILABLE_MESSAGE, {
        code: 'wind_unavailable',
        details: { code: 'wind_unavailable' },
      });
    }
    const { hourly, daily } = parsed;
    return {
      status: 'forecast',
      date: query.date,
      lat: query.lat,
      lng: query.lng,
      timezone: parsed.timezone,
      source: 'Open-Meteo',
      fetched_at: new Date(now).toISOString(),
      horizon_days: WIND_FORECAST_DAYS,
      hours: hourly.time.slice(0, 24).map((time, index) => ({
        hour: Number(time.slice(11, 13)) || index,
        speed_kmh: whole(hourly.wind_speed_10m[index]),
        gusts_kmh: whole(hourly.wind_gusts_10m?.[index]),
        direction_deg: whole(hourly.wind_direction_10m?.[index]),
      })),
      day: {
        speed_max_kmh: whole(daily.wind_speed_10m_max[0]),
        gusts_max_kmh: whole(daily.wind_gusts_10m_max?.[0]),
        direction_dominant_deg: whole(daily.wind_direction_10m_dominant?.[0]),
      },
    };
  }
}

/** Past, within the forecast's reach, or beyond it, counted in whole days from today (UTC). */
function statusOf(date: string, now: number): WindForecastStatus {
  const today = Date.parse(new Date(now).toISOString().slice(0, 10));
  const days = Math.round((Date.parse(date) - today) / DAY_MS);
  if (!Number.isFinite(days) || days < 0) return 'past';
  return days >= WIND_FORECAST_DAYS ? 'beyond_horizon' : 'forecast';
}

function empty(query: WindQuery, status: WindForecastStatus, now: number): WindForecastResponse {
  return {
    status,
    date: query.date,
    lat: query.lat,
    lng: query.lng,
    timezone: null,
    source: 'Open-Meteo',
    fetched_at: new Date(now).toISOString(),
    horizon_days: WIND_FORECAST_DAYS,
    hours: [],
    day: null,
  };
}
