import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { formatTime } from '../../utils/formatters';
import type { DepartureTransport } from './dashboardModel';

interface DepartureCountdownBoardProps {
  departure: DepartureTransport;
  onComplete: () => void;
}

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function countdownParts(remainingMs: number): CountdownParts {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

export default function DepartureCountdownBoard({
  departure,
  onComplete,
}: DepartureCountdownBoardProps): React.ReactElement | null {
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
        onComplete();
      }
    };
    const nowMs = Date.now();
    const firstDelay = Math.max(0, Math.min(departure.departureAt - nowMs, 1000 - (nowMs % 1000)));
    const timeoutId = window.setTimeout(() => {
      tick();
      if (Date.now() < departure.departureAt) intervalId = window.setInterval(tick, 1000);
    }, firstDelay);
    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [departure.departureAt, onComplete]);

  const remainingMs = departure.departureAt - now;
  if (remainingMs <= 0) return null;
  const parts = countdownParts(remainingMs);
  const units = [
    { key: 'days', value: parts.days > 99 ? '99+' : twoDigits(parts.days), label: t('dashboard.hero.dayUnitMany') },
    { key: 'hours', value: twoDigits(parts.hours), label: t('dashboard.hero.hourUnit') },
    { key: 'minutes', value: twoDigits(parts.minutes), label: t('dashboard.hero.minuteUnit') },
    { key: 'seconds', value: twoDigits(parts.seconds), label: t('dashboard.hero.secondUnit') },
  ];
  const departureTime = formatTime(departure.localTime, locale, timeFormat);

  return (
    <section
      className="departure-countdown-board"
      role="timer"
      aria-live="off"
      aria-atomic="false"
      data-testid="departure-countdown-board"
    >
      <header className="departure-countdown-head">
        <span className="departure-countdown-title">{t('dashboard.hero.departureIn')}</span>
        <span className="departure-countdown-transport" title={`${departure.title} · ${departureTime}`}>
          {departure.title} · {departureTime}
        </span>
      </header>
      <time className="departure-countdown-units" dateTime={new Date(departure.departureAt).toISOString()}>
        {units.map((unit) => (
          <span className="departure-countdown-unit" key={unit.key}>
            <span className="departure-countdown-number mono" data-countdown-unit={unit.key}>
              {unit.value}
            </span>
            <span className="departure-countdown-label">{unit.label}</span>
          </span>
        ))}
      </time>
    </section>
  );
}
