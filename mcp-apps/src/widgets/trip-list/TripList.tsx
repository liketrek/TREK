import { listTripsOutputSchema, type ListTripsOutput } from '@trek/shared/mcp-apps';
import { formatDateRange } from '../../lib/format';
import type { Translate } from '../../lib/i18n';
import './trip-list.css';

type Trip = ListTripsOutput['trips'][number];

export interface TripListProps {
  /** The `structuredContent` of a list_trips result, as the host handed it over. */
  data: unknown;
  /** The TREK address to link into, or null when the result carried none. */
  appUrl: string | null;
  locale: string;
  t: Translate;
  onOpen: (url: string) => void;
  onSelect: (trip: Trip) => void;
}

/** The trips list_trips answered with, as a row of cards to scroll through. */
export function TripList({ data, appUrl, locale, t, onOpen, onSelect }: TripListProps) {
  const parsed = listTripsOutputSchema.safeParse(data);
  if (!parsed.success) return <p className="trek-muted trek-state">{t('mcpApps.error')}</p>;
  const { trips } = parsed.data;
  return (
    <section className="trip-list" aria-labelledby="trip-list-title">
      <h1 id="trip-list-title" className="trip-list__title">
        {t('mcpApps.tripList.title')}
      </h1>
      {trips.length === 0 ? (
        <p className="trek-muted trek-state">{t('mcpApps.tripList.empty')}</p>
      ) : (
        <ul className="trip-list__track">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              appUrl={appUrl}
              locale={locale}
              t={t}
              onOpen={onOpen}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

interface TripCardProps extends Omit<TripListProps, 'data'> {
  trip: Trip;
}

function TripCard({ trip, appUrl, locale, t, onOpen, onSelect }: TripCardProps) {
  const dates = formatDateRange(trip.start_date, trip.end_date, locale);
  return (
    <li className="trip-card">
      <div className="trip-card__head">
        <h2 className="trip-card__name">{trip.title}</h2>
        {trip.is_archived ? <span className="trip-card__badge">{t('mcpApps.tripList.archived')}</span> : null}
      </div>
      <p className="trek-muted">{dates ?? t('mcpApps.noDates')}</p>
      <div className="trip-card__actions">
        <button type="button" className="trek-button" onClick={() => onSelect(trip)}>
          {t('mcpApps.tripList.select')}
        </button>
        {appUrl ? (
          <button
            type="button"
            className="trek-button trek-button--primary"
            onClick={() => onOpen(`${appUrl}/trips/${trip.id}`)}
          >
            {t('mcpApps.openInTrek')}
          </button>
        ) : null}
      </div>
    </li>
  );
}
