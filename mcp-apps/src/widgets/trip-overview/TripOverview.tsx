import { tripOverviewOutputSchema, type TripOverviewOutput } from '@trek/shared/mcp-apps';
import { formatDateRange } from '../../lib/format';
import type { Translate } from '../../lib/i18n';
import { WidgetHeader } from '../../lib/WidgetState';
import './trip-overview.css';

type OverviewDay = TripOverviewOutput['days'][number];

export interface TripOverviewProps {
  data: unknown;
  appUrl: string | null;
  locale: string;
  t: Translate;
  onOpen: (url: string) => void;
  /** Ask about one day, in the user's words: the host sends it as if they had typed it. */
  onShowDay: (day: OverviewDay, reference: string) => void;
}

/** A day's name on the card: its title, else how dayReference names it. */
export function dayLabel(day: OverviewDay, locale: string): string {
  return day.title || dayReference(day, locale);
}

/**
 * How a question about a day names it: its date, else its number. Never its
 * title: a fellow traveller writes that, and the question goes out in the
 * user's own voice, so their text must not ride along as an instruction.
 */
export function dayReference(day: OverviewDay, locale: string): string {
  return formatDateRange(day.date, null, locale) ?? `#${day.day_number ?? day.id}`;
}

/** get_trip_overview's result: the trip, how much it holds, and its next days. */
export function TripOverview({ data, appUrl, locale, t, onOpen, onShowDay }: TripOverviewProps) {
  const parsed = tripOverviewOutputSchema.safeParse(data);
  if (!parsed.success) return <p className="trek-muted trek-state">{t('mcpApps.error')}</p>;
  const { trip, counts, days } = parsed.data;
  const stats: Array<[string, number]> = [
    [t('mcpApps.overview.days'), counts.days],
    [t('mcpApps.overview.places'), counts.places],
    [t('mcpApps.overview.bookings'), counts.reservations],
    [t('mcpApps.overview.members'), counts.members],
  ];
  return (
    <section className="trek-widget" aria-labelledby="overview-title">
      <WidgetHeader
        title={trip.title}
        subtitle={formatDateRange(trip.start_date, trip.end_date, locale) ?? t('mcpApps.noDates')}
        href={appUrl ? `${appUrl}/trips/${trip.id}` : null}
        openLabel={t('mcpApps.openInTrek')}
        onOpen={onOpen}
      />
      <dl className="overview__stats">
        {stats.map(([label, count]) => (
          <div key={label} className="overview__stat">
            <dt className="trek-muted">{label}</dt>
            <dd>{new Intl.NumberFormat(locale).format(count)}</dd>
          </div>
        ))}
      </dl>
      <h2 className="overview__heading">{t('mcpApps.overview.next')}</h2>
      {days.length === 0 ? (
        <p className="trek-muted">{t('mcpApps.overview.noDays')}</p>
      ) : (
        <ul className="trek-list overview__days">
          {days.map((day) => {
            const label = dayLabel(day, locale);
            return (
              <li key={day.id} className="overview__day">
                <span className="overview__day-name">{label}</span>
                <span className="overview__stops" title={t('mcpApps.overview.stops')}>
                  <span className="trek-visually-hidden">{t('mcpApps.overview.stops')}: </span>
                  {day.stops}
                </span>
                <button
                  type="button"
                  className="trek-button trek-hit"
                  onClick={() => onShowDay(day, dayReference(day, locale))}
                >
                  {t('mcpApps.overview.showDay')}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
