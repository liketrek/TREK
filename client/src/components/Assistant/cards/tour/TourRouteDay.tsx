import type { TourRouteCard, TourRouteSchedule } from '@trek/shared';
import { Clock, Droplet, Sunrise, Sunset } from 'lucide-react';
import { createElement } from 'react';

import { useTranslation } from '../../../../i18n';
import { SoftPill } from '../../../Planner/planParts';
import { Tooltip } from '../../../shared/Tooltip';
import { weatherIconFor } from '../../../Weather/weatherIcons';
import { useCardFormat } from '../parts/useCardFormat';
import { type BarSpan, dayBarOf, forecastHours, RAIN_SHOWN_PCT } from './tourRouteDayModel';

/**
 * A tour's day in its card: one bar with the daylight and the walk on it
 * (the walk in the dark, before sunrise or after sunset, in red), sunrise and
 * sunset at its ends, the latest start when no start is set, and the
 * forecast hour by hour for the walk near its highest point. A day only a
 * climate is known for says so and shows no hours, since those are last
 * year's.
 */

/** A stretch of the bar, placed along the reading direction. */
function Span({ span, className }: { span: BarSpan; className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute inset-y-0 ${className}`}
      style={{ insetInlineStart: `${span.start}%`, width: `${span.size}%` }}
    />
  );
}

/** One hour of the forecast: the hour, the sky, the temperature, and the rain when it is likely. */
function HourCell({ hour }: { hour: TourRouteSchedule['hours'][number] }) {
  const icon = weatherIconFor(hour.main);
  const rain = hour.rainPct !== null && hour.rainPct >= RAIN_SHOWN_PCT ? hour.rainPct : null;
  return (
    <li className="flex w-9 flex-col items-center gap-0.5 text-caption tabular-nums text-content-secondary">
      <span className="text-content-faint">{String(hour.hour).padStart(2, '0')}</span>
      {createElement(icon, { size: 14, strokeWidth: 2, 'aria-hidden': true })}
      <span>{`${hour.tempC}°`}</span>
      {rain !== null && (
        <span className="inline-flex items-center text-info">
          <Droplet size={9} strokeWidth={2.4} aria-hidden="true" />
          {`${rain} %`}
        </span>
      )}
    </li>
  );
}

export default function TourRouteDay({ card }: { card: TourRouteCard }) {
  const { t } = useTranslation();
  const format = useCardFormat();
  const schedule = card.schedule;
  if (!schedule) return null;
  const bar = dayBarOf(schedule);
  const hours = forecastHours(schedule);
  const arrive = schedule.arrive ? format.clock(schedule.arrive) : null;
  const walk =
    schedule.start && arrive
      ? t('assistant.card.tour.walkTime', {
          start: format.clock(schedule.start),
          end: schedule.nextDay ? `${arrive} (${t('assistant.card.tour.nextDay')})` : arrive,
        })
      : null;
  const sunrise = schedule.sunrise ? t('assistant.card.tour.sunrise', { time: format.clock(schedule.sunrise) }) : null;
  const sunset = schedule.sunset ? t('assistant.card.tour.sunset', { time: format.clock(schedule.sunset) }) : null;
  const barLabel = `${t('assistant.card.tour.daylight')}: ${[sunrise, walk, sunset].filter(Boolean).join(', ')}`;
  const end = 'inline-flex flex-none items-center gap-1 text-caption tabular-nums text-content-muted';
  return (
    <div className="mt-2" data-testid="tour-day">
      {bar && (
        <div className="flex items-center gap-2" role="img" aria-label={barLabel}>
          {schedule.sunrise && (
            <span className={end}>
              <Sunrise size={12} strokeWidth={2} aria-hidden="true" />
              {format.clock(schedule.sunrise)}
            </span>
          )}
          <span className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-tertiary">
            {bar.daylight && <Span span={bar.daylight} className="bg-warning-soft" />}
            {bar.walk && <Span span={bar.walk} className="bg-accent" />}
            {bar.dark.map((span) => (
              <Span key={span.start} span={span} className="bg-danger" />
            ))}
          </span>
          {schedule.sunset && (
            <span className={end}>
              {format.clock(schedule.sunset)}
              <Sunset size={12} strokeWidth={2} aria-hidden="true" />
            </span>
          )}
        </div>
      )}
      {!schedule.start && schedule.latestStart && (
        <div className="mt-1 flex">
          <Tooltip label={t('assistant.card.tour.latestStart', { time: format.clock(schedule.latestStart) })}>
            <span className="inline-flex">
              <SoftPill icon={<Clock size={10} strokeWidth={2.2} aria-hidden="true" />}>
                {t('assistant.card.tour.latestStartShort', { time: format.clock(schedule.latestStart) })}
              </SoftPill>
            </span>
          </Tooltip>
        </div>
      )}
      {schedule.weather === 'climate' && (
        <p className="m-0 mt-1 text-caption text-content-faint">{t('assistant.card.tour.climate')}</p>
      )}
      {hours.length > 0 && (
        <ul
          aria-label={t('assistant.card.tour.weatherNear')}
          className="m-0 mt-1.5 flex list-none flex-wrap gap-x-0.5 gap-y-1 p-0"
        >
          {hours.map((hour) => (
            <HourCell key={hour.hour} hour={hour} />
          ))}
        </ul>
      )}
    </div>
  );
}
