import type { AssistantWeatherDay } from '@trek/shared';
import { Droplet } from 'lucide-react';
import { createElement } from 'react';

import { useTranslation } from '../../i18n';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useSettingsStore } from '../../store/settingsStore';
import { weatherIconFor } from '../Weather/weatherIcons';
import { Tooltip } from '../shared/Tooltip';
import { inUnit } from './assistantModel';
import { useAssistantView } from './assistantViewContext';

/** Rain this likely or more gets its drop. */
const RAIN_SHOWN_PCT = 30;

/** The weekday and the day of the month of a `YYYY-MM-DD` date, read as a calendar date wherever the user is. */
function dateParts(iso: string, locale: string): { weekday: string; day: string } {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  return { weekday: date.toLocaleDateString(locale, { weekday: 'short' }), day: String(date.getDate()) };
}

function WeatherChip({
  day,
  fahrenheit,
  focused,
  onPick,
}: {
  day: AssistantWeatherDay;
  fahrenheit: boolean;
  focused: boolean;
  onPick: ((dayId: number) => void) | null;
}) {
  const { t, locale } = useTranslation();
  const icon = weatherIconFor(day.main);
  const { weekday, day: dayOfMonth } = dateParts(day.date, locale);
  // A climate figure is an average for the date, not a forecast; it says so with "≈".
  const approx = day.kind === 'climate' ? '≈' : '';
  const max = `${approx}${inUnit(day.tempMax, fahrenheit)}°`;
  const min = day.tempMin === null ? null : `${inUnit(day.tempMin, fahrenheit)}°`;
  const rainy = day.rainPct !== null && day.rainPct >= RAIN_SHOWN_PCT;
  const dayId = day.dayId;

  const body = (
    <>
      <span className="text-caption text-content-muted">
        {weekday} {dayOfMonth}
      </span>
      {createElement(icon, { size: 16, strokeWidth: 1.8, 'aria-hidden': true, className: 'text-content-secondary' })}
      <span className="flex items-baseline gap-1 tabular-nums">
        <span className="text-body font-semibold text-content">{max}</span>
        {min && <span className="text-caption text-content-faint">{min}</span>}
      </span>
      {rainy && (
        <Tooltip label={t('assistant.weather.rain', { pct: day.rainPct ?? 0 })} placement="top">
          <span className="inline-flex items-center gap-0.5 text-caption tabular-nums text-content-muted">
            <Droplet size={10} aria-hidden="true" />
            {day.rainPct}%
          </span>
        </Tooltip>
      )}
    </>
  );
  const look = `flex min-w-14 flex-shrink-0 snap-start flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 ${
    focused ? 'border-edge bg-surface-card' : 'border-transparent bg-surface-secondary'
  }`;
  const label = `${weekday} ${dayOfMonth}, ${max}${min ? ` / ${min}` : ''}`;

  if (onPick && dayId !== null) {
    return (
      <li className="flex">
        <button
          type="button"
          onClick={() => onPick(dayId)}
          aria-label={label}
          aria-current={focused || undefined}
          className={`${look} transition-colors hover:bg-surface-hover`}
        >
          {body}
        </button>
      </li>
    );
  }
  return (
    <li aria-label={label} className={look}>
      {body}
    </li>
  );
}

/**
 * The weather the assistant looked up, one small chip per day: weekday and
 * date, the sky, the high in full and the low in quiet, a drop from 30 % rain
 * on. The day in focus is framed; a chip with a trip day selects that day in
 * the planner. More than a week scrolls sideways.
 */
export default function AssistantWeatherStrip({ days }: { days: AssistantWeatherDay[] }) {
  const { t } = useTranslation();
  const { tripId, onFocusDay } = useAssistantView();
  const fahrenheit = useSettingsStore((s) => s.settings.temperature_unit) === 'fahrenheit';
  const focusDayId = useAssistantStore((s) => chatOf(s, tripId).focus?.dayId ?? null);

  return (
    <ul
      aria-label={t('assistant.weather.strip', { count: days.length })}
      className="trek-assistant-strip -mx-4 flex snap-x scroll-px-4 gap-1.5 overflow-x-auto px-4"
    >
      {days.map((day) => (
        <WeatherChip
          key={day.date}
          day={day}
          fahrenheit={fahrenheit}
          focused={day.dayId !== null && day.dayId === focusDayId}
          onPick={onFocusDay ?? null}
        />
      ))}
    </ul>
  );
}
