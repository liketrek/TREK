import { useEffect, useRef, useState } from 'react';

import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { formatTime } from '../../utils/formatters';
import type { DepartureTransport } from './dashboardModel';

export default function DepartureCountdownBoard({
  departure,
  compact = false,
}: {
  departure: DepartureTransport;
  compact?: boolean;
}): React.ReactElement | null {
  const { t, locale } = useTranslation();
  const timeFormat = useSettingsStore((state) => state.settings.time_format);
  const [now, setNow] = useState(() => Date.now());
  const completedTarget = useRef<number | null>(null);

  useEffect(() => {
    completedTarget.current = null;
    setNow(Date.now());
    let intervalId: number | undefined;
    const tick = () => {
      const next = Date.now();
      setNow(next);
      if (next >= departure.departureAt && completedTarget.current !== departure.departureAt) {
        completedTarget.current = departure.departureAt;
        if (intervalId !== undefined) window.clearInterval(intervalId);
      }
    };
    const nowMs = Date.now();
    const timeoutId = window.setTimeout(
      () => {
        tick();
        if (Date.now() < departure.departureAt) intervalId = window.setInterval(tick, 1000);
      },
      Math.max(0, Math.min(departure.departureAt - nowMs, 1000 - (nowMs % 1000)))
    );
    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [departure.departureAt]);

  const totalSeconds = Math.max(0, Math.ceil((departure.departureAt - now) / 1000));
  if (totalSeconds <= 0) return null;
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number): string => String(value).padStart(2, '0');
  const departureTime = formatTime(departure.localTime, locale, timeFormat);
  const values = [days > 99 ? '99+' : pad(days), pad(hours), pad(minutes), pad(seconds)];
  const labels = [
    t('dashboard.hero.dayUnitMany'),
    t('dashboard.hero.hourUnit'),
    t('dashboard.hero.minuteUnit'),
    t('dashboard.hero.secondUnit'),
  ];

  return (
    <section
      role="timer"
      aria-live="off"
      data-testid="departure-countdown-board"
      className={
        compact ? 'mt-2 rounded-xl bg-black/25 px-3 py-2 text-white backdrop-blur-md' : 'departure-countdown-board'
      }
    >
      <div
        className={
          compact ? 'mb-1 flex items-center justify-between gap-2 text-[0.625rem]' : 'departure-countdown-head'
        }
      >
        <span className={compact ? 'font-bold uppercase tracking-wider' : 'departure-countdown-title'}>
          {t('dashboard.hero.departureIn')}
        </span>
        <span className="truncate opacity-80">
          {departure.title} · {departureTime}
        </span>
      </div>
      <time
        dateTime={new Date(departure.departureAt).toISOString()}
        className={compact ? 'grid grid-cols-4 gap-1 text-center' : 'departure-countdown-units'}
      >
        {values.map((value, index) => (
          <span key={labels[index]} className={compact ? 'flex flex-col' : 'departure-countdown-unit'}>
            <span className={compact ? 'font-mono text-base font-bold' : 'departure-countdown-number mono'}>
              {value}
            </span>
            <span className={compact ? 'text-[0.5rem] uppercase opacity-70' : 'departure-countdown-label'}>
              {labels[index]}
            </span>
          </span>
        ))}
      </time>
    </section>
  );
}
