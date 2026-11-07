import { placeSearchCardSchema, searchPlaceOutputSchema, type PlaceSearchCard } from '@trek/shared/mcp-apps';
import type { Translate } from '../../lib/i18n';
import './place-results.css';

export interface PlaceResultsProps {
  data: unknown;
  locale: string;
  t: Translate;
  /** Ask the assistant to add the place, by its id: the host sends it as the user's message. */
  onAdd: (placeId: string) => void;
  /** Tell the assistant which place the user means, without sending a message. */
  onSelect: (place: PlaceSearchCard, placeId: string) => void;
}

/** An index id as OpenStreetMap and Google spell them; anything else is not sent in the user's name. */
const PLACE_ID = /^[\w:.-]{1,200}$/;

/** The id a place goes by in TREK: OpenStreetMap's or Google's, whichever index found it. */
export function placeIdOf(place: PlaceSearchCard): string | null {
  const id = place.osm_id || place.google_place_id || null;
  return id && PLACE_ID.test(id) ? id : null;
}

/** search_place's result as a row of cards: what was found, where, and two ways to act on it. */
export function PlaceResults({ data, locale, t, onAdd, onSelect }: PlaceResultsProps) {
  const parsed = searchPlaceOutputSchema.safeParse(data);
  if (!parsed.success) return <p className="trek-muted trek-state">{t('mcpApps.error')}</p>;
  const places = parsed.data.places.flatMap((row) => {
    const card = placeSearchCardSchema.safeParse(row);
    const id = card.success ? placeIdOf(card.data) : null;
    return card.success && id ? [{ place: card.data, id }] : [];
  });
  const rating = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return (
    <section className="trek-widget" aria-labelledby="places-title">
      <h1 id="places-title" className="trek-header__title places__title">
        {t('mcpApps.places.title')}
      </h1>
      {places.length === 0 ? (
        <p className="trek-muted">{t('mcpApps.places.empty')}</p>
      ) : (
        <ul className="trek-list places__track">
          {places.map(({ place, id }) => (
            <li key={id} className="places__card">
              <h2 className="places__name">{place.name}</h2>
              {place.address ? <p className="trek-muted">{place.address}</p> : null}
              {place.rating ? (
                <p className="trek-muted">
                  {t('mcpApps.places.rating')}: {rating.format(place.rating)}
                </p>
              ) : null}
              <div className="places__actions">
                <button type="button" className="trek-button trek-hit" onClick={() => onSelect(place, id)}>
                  {t('mcpApps.places.select')}
                </button>
                <button type="button" className="trek-button trek-button--primary trek-hit" onClick={() => onAdd(id)}>
                  {t('mcpApps.places.add')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
