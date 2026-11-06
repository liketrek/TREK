import { weatherOutputSchema } from '@trek/shared/mcp-apps';
import { formatDateRange } from '../../lib/format';
import type { Translate } from '../../lib/i18n';
import './weather.css';

export interface WeatherProps {
  data: unknown;
  /** The arguments get_weather was called with: the date the card is for. */
  input: Record<string, unknown> | null;
  locale: string;
  t: Translate;
}

/** A clock time from the forecast ("06:42" or an ISO timestamp), as the host's locale writes it. */
export function formatClock(value: string | null | undefined, locale: string): string | null {
  if (!value) return null;
  const match = /T?(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const date = new Date(Date.UTC(2000, 0, 1, Number(match[1]), Number(match[2])));
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(date);
}

/** get_weather's forecast, or the climate average when the day is too far out, as one card. */
export function Weather({ data, input, locale, t }: WeatherProps) {
  const parsed = weatherOutputSchema.safeParse(data);
  if (!parsed.success) return <p className="trek-muted trek-state">{t('mcpApps.error')}</p>;
  const { weather } = parsed.data;
  if (weather.error) return <p className="trek-muted trek-state">{t('mcpApps.weather.unavailable')}</p>;
  const degrees = (value: number) => `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)}°`;
  const date = typeof input?.date === 'string' ? formatDateRange(input.date, null, locale) : null;
  const facts: Array<[string, string | null]> = [
    [
      t('mcpApps.weather.precipitation'),
      weather.precipitation_probability_max == null
        ? null
        : new Intl.NumberFormat(locale, { style: 'percent' }).format(weather.precipitation_probability_max / 100),
    ],
    [t('mcpApps.weather.wind'), weather.wind_max == null ? null : `${Math.round(weather.wind_max)} km/h`],
    [t('mcpApps.weather.sunrise'), formatClock(weather.sunrise, locale)],
    [t('mcpApps.weather.sunset'), formatClock(weather.sunset, locale)],
  ];
  return (
    <section className="trek-widget weather" aria-labelledby="weather-title">
      <h1 id="weather-title" className="weather__title">
        {t('mcpApps.weather.title')}
        {date ? <span className="trek-muted"> · {date}</span> : null}
      </h1>
      <div className="weather__now">
        <span className="weather__temp">{degrees(weather.temp)}</span>
        <div>
          <p className="weather__description">{weather.description || weather.main}</p>
          {weather.temp_min != null && weather.temp_max != null ? (
            <p className="trek-muted">
              {degrees(weather.temp_min)} – {degrees(weather.temp_max)}
            </p>
          ) : null}
          {weather.type === 'climate' ? <p className="trek-muted">{t('mcpApps.weather.climate')}</p> : null}
        </div>
      </div>
      <dl className="weather__facts">
        {facts
          .filter((fact): fact is [string, string] => fact[1] !== null)
          .map(([label, value]) => (
            <div key={label}>
              <dt className="trek-muted">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
    </section>
  );
}
