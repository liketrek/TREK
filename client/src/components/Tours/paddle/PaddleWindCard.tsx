import { compassPointOf, type PaddleLakeStyle, type WindForecastResponse, type WindHour } from '@trek/shared';
import { ChevronDown, RefreshCw, WifiOff, Wind } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../../../i18n';
import { formatDate } from '../../../utils/formatters';
import { SoftPill } from '../../Planner/planParts';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { RailCard, TourNotice } from '../tourParts';
import { FigureBadge } from './FigureBadge';
import { windForShore } from './lakeStyleAdvice';
import { useTourWind, type TourWind } from './useTourWind';

type Translate = (key: string, params?: Record<string, unknown>) => string;

/** The hours a day tour is out on the water, as the strip shows them. */
const FIRST_HOUR = 6;
const LAST_HOUR = 21;

/**
 * An arrow the way the wind blows: meteorological degrees name where it comes
 * from, so the arrow turns half round from them.
 */
function FlowArrow({ from, size }: { from: number; size: number }) {
  // Drawn about its own centre, so every hour's arrow turns in place at the same height.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-none"
      style={{ transform: `rotate(${from + 180}deg)` }}
      aria-hidden="true"
    >
      <path d="M12 20V4" />
      <path d="M6 10l6-6 6 6" />
    </svg>
  );
}

function directionName(degrees: number | null, t: Translate): string | null {
  return degrees === null ? null : t(`tours.paddle.wind.dir.${compassPointOf(degrees)}`);
}

/**
 * The day's hours as columns: the mean wind as a bar, the gusts as the paler
 * bar behind it, an arrow the way it blows on top. An hour the source left
 * out stays an empty column, never a calm one.
 */
function HourStrip({ hours, t }: { hours: readonly WindHour[]; t: Translate }) {
  const shown = hours.filter((hour) => hour.hour >= FIRST_HOUR && hour.hour <= LAST_HOUR);
  const top = Math.max(10, ...shown.map((hour) => hour.gusts_kmh ?? hour.speed_kmh ?? 0));
  const height = (value: number | null) => `${Math.max(4, ((value ?? 0) / top) * 100)}%`;
  return (
    <div data-testid="paddle-wind-hours" className="flex items-end gap-[3px]">
      {shown.map((hour) => {
        const from = hour.direction_deg;
        const known = hour.speed_kmh !== null;
        const label = known
          ? t('tours.paddle.wind.hourInfo', {
              hour: hour.hour,
              speed: hour.speed_kmh,
              gusts: hour.gusts_kmh ?? '–',
              direction: directionName(from, t) ?? '–',
            })
          : t('tours.paddle.wind.hourUnknown', { hour: hour.hour });
        return (
          <Tooltip key={hour.hour} label={label}>
            <span className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className="grid h-3.5 w-3.5 place-items-center text-content-secondary">
                {from !== null && <FlowArrow from={from} size={11} />}
              </span>
              <span
                className={`relative flex h-12 w-full items-end justify-center overflow-hidden rounded-[3px] ${known ? 'bg-surface-secondary' : 'border border-dashed border-edge'}`}
              >
                {hour.gusts_kmh !== null && (
                  <span
                    className="absolute inset-x-0 bottom-0 bg-info-soft"
                    style={{ height: height(hour.gusts_kmh) }}
                  />
                )}
                {known && (
                  <span
                    className="relative w-full rounded-t-[2px] bg-info"
                    style={{ height: height(hour.speed_kmh) }}
                  />
                )}
              </span>
              <span className="font-geist tabular-nums text-content-faint" style={fs(9.5)}>
                {hour.hour}
              </span>
            </span>
          </Tooltip>
        );
      })}
    </div>
  );
}

/** The forecast of the chosen day: its figures, its hours and where and when it was asked. */
function Forecast({ forecast, t, locale }: { forecast: WindForecastResponse; t: Translate; locale: string }) {
  const day = forecast.day;
  const from = day?.direction_dominant_deg ?? null;
  const fetched = new Date(forecast.fetched_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1">
        {from !== null && (
          <FigureBadge
            testId="paddle-wind-direction"
            value={directionName(from, t) ?? ''}
            icon={<FlowArrow from={from} size={11} />}
            info={t('tours.paddle.wind.fromInfo', { direction: directionName(from, t) ?? '' })}
          />
        )}
        <FigureBadge
          testId="paddle-wind-mean"
          label={t('tours.paddle.wind.mean')}
          value={day?.speed_max_kmh == null ? '–' : `${day.speed_max_kmh} km/h`}
          info={t('tours.paddle.wind.meanInfo')}
        />
        <FigureBadge
          testId="paddle-wind-gusts"
          label={t('tours.paddle.wind.gusts')}
          value={day?.gusts_max_kmh == null ? '–' : `${day.gusts_max_kmh} km/h`}
          info={t('tours.paddle.wind.gustsInfo')}
        />
      </div>
      <HourStrip hours={forecast.hours} t={t} />
      <div className="-mt-1 flex items-center gap-3 text-content-muted" style={fs(10.5, 'body')}>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-[2px] bg-info" />
          {t('tours.paddle.wind.legendMean')}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-[2px] bg-info-soft ring-1 ring-inset ring-edge-faint" />
          {t('tours.paddle.wind.legendGusts')}
        </span>
      </div>
      <p className="m-0 text-content-faint" style={fs(10.5, 'body')}>
        {t('tours.paddle.wind.source', { source: forecast.source, time: fetched })}
      </p>
    </div>
  );
}

/** Why there is no forecast to show, each case in its own words, with a way to ask again after a failure. */
function Unavailable({ wind, t, locale }: { wind: TourWind; t: Translate; locale: string }) {
  const { state } = wind;
  if (state.kind === 'loading')
    return <div data-testid="paddle-wind-loading" className="h-24 animate-pulse rounded-[10px] bg-surface-secondary" />;
  if (state.kind === 'error')
    return (
      <TourNotice tone="warning" icon={<RefreshCw size={13} strokeWidth={2} />}>
        <span className="flex flex-wrap items-center gap-x-2">
          {t('tours.paddle.wind.error')}
          <button type="button" onClick={wind.retry} className="font-semibold underline-offset-2 hover:underline">
            {t('tours.paddle.wind.retry')}
          </button>
        </span>
      </TourNotice>
    );
  if (state.kind === 'offline')
    return <TourNotice icon={<WifiOff size={13} strokeWidth={2} />}>{t('tours.paddle.wind.offline')}</TourNotice>;
  if (state.kind === 'ready' && state.forecast.status === 'beyond_horizon') {
    const from = new Date(Date.parse(state.forecast.date) - (state.forecast.horizon_days - 1) * 86_400_000);
    return (
      <TourNotice icon={<Wind size={13} strokeWidth={2} />}>
        {t('tours.paddle.wind.beyond', { date: formatDate(from.toISOString().slice(0, 10), locale) })}
      </TourNotice>
    );
  }
  // A day without a forecast to ask for: past, not on a day, a day without a date, a tour without a start.
  const notice = state.kind === 'ready' ? t('tours.paddle.wind.past') : t(`tours.paddle.wind.${state.kind}`);
  return <TourNotice icon={<Wind size={13} strokeWidth={2} />}>{notice}</TourNotice>;
}

/** What wind means for a paddler, in general terms; it rates no passage and clears nothing. */
function WindHints({ t }: { t: Translate }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-edge-faint pt-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-1.5 text-start font-semibold text-content-secondary hover:text-content"
        style={fs(11.5, 'body')}
      >
        <span className="min-w-0 flex-1 truncate">{t('tours.paddle.wind.hintsTitle')}</span>
        <ChevronDown
          size={13}
          strokeWidth={2.2}
          className={`flex-none transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul className="m-0 mt-2 flex list-disc flex-col gap-1.5 ps-4 text-content-muted" style={fs(11.5, 'body')}>
          {(['headwind', 'drift', 'crossing', 'gusts', 'local'] as const).map((hint) => (
            <li key={hint}>{t(`tours.paddle.wind.hint.${hint}`)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The lake style of the tour being edited, for the wind card to suggest the shore on a windy day. */
export interface LakeStyleChoice {
  value: PaddleLakeStyle;
  onChoose: (style: PaddleLakeStyle) => void;
}

/**
 * PAD-11: on a windy day, the offer to keep near the shores on the lakes,
 * with the wind that prompts it; once taken, it says the lakes are planned so.
 */
function ShoreAdvice({
  wind,
  lakes,
  t,
}: {
  wind: { meanKmh: number; gustsKmh: number };
  lakes: LakeStyleChoice;
  t: Translate;
}) {
  if (lakes.value === 'shore') {
    return (
      <TourNotice role="status" icon={<Wind size={13} strokeWidth={2} />}>
        {t('tours.paddle.wind.shoreTaken')}
      </TourNotice>
    );
  }
  return (
    <TourNotice tone="warning" icon={<Wind size={13} strokeWidth={2} />}>
      <span data-testid="paddle-wind-shore-advice" className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {t('tours.paddle.wind.shoreAdvice', { mean: wind.meanKmh, gusts: wind.gustsKmh })}
        <button
          type="button"
          onClick={() => lakes.onChoose('shore')}
          className="font-semibold underline-offset-2 hover:underline"
        >
          {t('tours.paddle.wind.shoreAdopt')}
        </button>
      </span>
    </TourNotice>
  );
}

/**
 * PAD-08: the wind on the day a paddle tour is planned for, at its start. The
 * mean, the gusts and the direction are figures of their own, with the source
 * and when it was asked; no value is turned into a verdict, and missing data
 * is never shown as calm.
 */
export function PaddleWindCard({ wind, lakes }: { wind: TourWind; lakes?: LakeStyleChoice }) {
  const { t, locale } = useTranslation();
  const ready = wind.state.kind === 'ready' && wind.state.forecast.status === 'forecast' ? wind.state.forecast : null;
  const shoreWind = ready && lakes ? windForShore(ready) : null;
  return (
    <RailCard
      icon={<Wind size={14} strokeWidth={2} />}
      title={t('tours.paddle.wind.title')}
      aside={
        wind.tourDays.length > 1 ? (
          <span className="flex flex-none items-center gap-1">
            {wind.tourDays.map(({ day, index }) => (
              <button
                key={day.id}
                type="button"
                aria-pressed={wind.day?.day.id === day.id}
                onClick={() => wind.chooseDay(day.id)}
                className={`rounded-full px-2 font-semibold leading-[20px] transition-colors ${wind.day?.day.id === day.id ? 'bg-accent text-accent-text' : 'bg-surface-card text-content-secondary ring-1 ring-inset ring-edge-faint hover:text-content'}`}
                style={fs(10.5)}
              >
                {t('dayplan.dayN', { n: index + 1 })}
              </button>
            ))}
          </span>
        ) : wind.day ? (
          <SoftPill>{formatDate(wind.day.day.date, locale) || t('dayplan.dayN', { n: wind.day.index + 1 })}</SoftPill>
        ) : null
      }
    >
      <div data-testid="paddle-wind-card" className="flex flex-col gap-3">
        {ready ? (
          <Forecast forecast={ready} t={t} locale={locale} />
        ) : (
          <Unavailable wind={wind} t={t} locale={locale} />
        )}
        {shoreWind && lakes && <ShoreAdvice wind={shoreWind} lakes={lakes} t={t} />}
        <WindHints t={t} />
      </div>
    </RailCard>
  );
}

/** The wind card for one tour: its days read from the trip, its start as the place the forecast is for. */
export function PaddleWindSection({
  placeId,
  start,
  lakes,
}: {
  placeId: number | null;
  start: { lat: number; lng: number } | null;
  /** Given while the tour is edited and its route crosses a lake: the card may suggest the shore. */
  lakes?: LakeStyleChoice;
}) {
  const wind = useTourWind(placeId, start);
  return <PaddleWindCard wind={wind} lakes={lakes} />;
}
