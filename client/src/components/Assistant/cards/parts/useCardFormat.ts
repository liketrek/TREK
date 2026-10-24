import type { CardMoney } from '@trek/shared';
import { useMemo } from 'react';

import { useTranslation } from '../../../../i18n';
import { useSettingsStore } from '../../../../store/settingsStore';
import { formatClockTime, formatDate, formatMoney } from '../../../../utils/formatters';
import { formatDistance, formatElevation } from '../../../../utils/units';
import { formatRunPace, runPaceUnitText } from '../../../Tours/run/runPace';

/**
 * How a card writes its numbers, the way the rest of TREK does for this
 * user: dates in their language, clock times in their 12 or 24 hour setting,
 * money in its currency's own convention, distances and heights in their
 * units. A card hands these to its words as `{value}`, never a raw number.
 */
export function useCardFormat() {
  const { locale, t } = useTranslation();
  const twelveHour = useSettingsStore((s) => s.settings.time_format === '12h');
  const unit = useSettingsStore((s) => s.settings.distance_unit ?? 'metric');
  return useMemo(() => {
    const number = new Intl.NumberFormat(locale);
    const hours = new Intl.NumberFormat(locale, { style: 'unit', unit: 'hour', unitDisplay: 'narrow' });
    const mins = new Intl.NumberFormat(locale, { style: 'unit', unit: 'minute', unitDisplay: 'narrow' });
    return {
      /** "Sat 12 Oct" from `YYYY-MM-DD`, the year only when it is not this one. */
      date: (value: string) => formatDate(value, locale) ?? value,
      /** "14:30" or "2:30 PM" from `HH:MM`. */
      clock: (value: string) => formatClockTime(value, twelveHour),
      money: (value: CardMoney) => formatMoney(value.amount, value.currency, locale),
      distance: (km: number) => formatDistance(km, unit),
      elevation: (meters: number) => formatElevation(meters, unit),
      /** "2h 15min" from minutes, the hours left out below one. */
      minutes: (value: number) => {
        const total = Math.max(0, Math.round(value));
        const h = Math.floor(total / 60);
        const m = total % 60;
        if (h === 0) return mins.format(m);
        return m === 0 ? hours.format(h) : `${hours.format(h)} ${mins.format(m)}`;
      },
      count: (value: number) => number.format(value),
      /** "5:30 min/km" from seconds per kilometre, per mile with distances in miles. */
      pace: (secondsPerKm: number) => `${formatRunPace(secondsPerKm, unit)} ${runPaceUnitText(unit, t)}`,
    };
  }, [locale, twelveHour, unit, t]);
}
