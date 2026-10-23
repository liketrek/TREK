import type { CardDay, CardMoney } from '@trek/shared';
import { useMemo } from 'react';

import { useTranslation } from '../../../../i18n';
import { useCardFormat } from '../parts/useCardFormat';

/**
 * How a booking card writes its days, clocks, durations and prices: the
 * user's language and 12 or 24 hour setting, as the planner's booking cards
 * do. A day reads as its date, a trip planned without dates as "Day 3".
 */
export function useBookingFormat() {
  const { t } = useTranslation();
  const format = useCardFormat();
  return useMemo(
    () => ({
      /** "Wed 3 Jun", or "Day 3" without a date; empty for no day. */
      day: (day: CardDay | null): string => {
        if (day?.date) return format.date(day.date);
        return day?.number != null ? t('dayplan.dayN', { n: day.number }) : '';
      },
      /** "Day 3" beside a date, only when the trip numbers its days and the date is shown too. */
      dayNumber: (day: CardDay | null): string =>
        day?.date && day.number != null ? t('dayplan.dayN', { n: day.number }) : '',
      clock: (value: string | null): string => (value ? format.clock(value) : ''),
      minutes: (value: number | null): string => (value ? format.minutes(value) : ''),
      money: (value: CardMoney): string => format.money(value),
    }),
    [format, t]
  );
}
