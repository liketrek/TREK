import type { AssistantMessage, AtlasCountryCard as CountryCard } from '@trek/shared';
import { Briefcase, MapPin, Radio } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { SoftPill, WhiteBadge } from '../../../Planner/planParts';
import CountryFlag from '../../../shared/CountryFlag';
import type { ChangeItem } from '../../assistantParts';
import type { CardEntry } from '../cardTypes';
import { CardFacts } from '../parts/CardFacts';
import CardFrame from '../parts/CardFrame';
import { CardOpenButton } from '../parts/CardOpen';
import { CardMore } from '../parts/CardRows';
import { CONTINENT_LABEL, continentOf, shortDay, STATUS_LOOK } from './atlasCardModel';
import { ATLAS_PAGE } from './atlasPage';
import { ChangeFlag, FlagTile, StatusFact } from './AtlasParts';
import { useAtlasCard } from './useAtlasCard';

/**
 * One country of the atlas the way the Atlas page's country sheet shows it:
 * the flag and the name with its standing, the continent and how many trips
 * and places put it there, the latest trips with their dates, the places as
 * badges, and whether a recording ticked it. In a change card the same
 * country is the row: its flag as the lead, its standing from now to after.
 */

type Translate = ReturnType<typeof useTranslation>['t'];

/** A trip's dates as "3 Apr 2024 to 14 Apr 2024", one day alone, or nothing. */
function tripDates(start: string | null, end: string | null, locale: string, t: Translate): string | null {
  if (start && end && start !== end) {
    return t('assistant.card.atlas.dates', { from: shortDay(start, locale), to: shortDay(end, locale) });
  }
  const day = start ?? end;
  return day ? shortDay(day, locale) : null;
}

function CountrySection({ card }: { card: CountryCard }) {
  const { t } = useTranslation();
  const { countryName, locale } = useAtlasCard();
  const status = STATUS_LOOK[card.status ?? 'none'];
  const trips = card.tripCount ?? 0;
  const places = card.placeCount ?? 0;
  return (
    <div>
      <div className="flex items-start gap-2.5">
        <FlagTile code={card.code} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <bdi className="min-w-0 flex-1 break-words text-body font-semibold leading-tight text-content">
              {countryName(card.code)}
            </bdi>
            <SoftPill tone={status.tone} icon={<status.Icon size={10} strokeWidth={2.2} aria-hidden="true" />}>
              {t(status.labelKey)}
            </SoftPill>
          </div>
          <CardFacts>
            <span className="me-0.5 text-caption text-content-faint">
              {t(CONTINENT_LABEL[continentOf(card.code)].labelKey)}
            </span>
            {trips > 0 && (
              <WhiteBadge icon={<Briefcase size={10} strokeWidth={2.2} aria-hidden="true" />}>
                {t('assistant.card.atlas.trips', { count: trips })}
              </WhiteBadge>
            )}
            {places > 0 && (
              <WhiteBadge icon={<MapPin size={10} strokeWidth={2.2} aria-hidden="true" />}>
                {t('assistant.card.atlas.places', { count: places })}
              </WhiteBadge>
            )}
          </CardFacts>
        </div>
      </div>
      {card.trips.length > 0 && (
        <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
          {card.trips.map((trip) => (
            <li key={trip.id} className="flex items-baseline gap-2 text-caption">
              <bdi title={trip.title} className="min-w-0 flex-1 truncate text-content-secondary">
                {trip.title}
              </bdi>
              <span className="flex-none tabular-nums text-content-faint">
                {tripDates(trip.startDate, trip.endDate, locale, t)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <CardMore count={card.moreTrips} target={ATLAS_PAGE} />
      {card.places.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {card.places.map((place) => (
            <WhiteBadge key={place} className="max-w-full">
              <bdi className="truncate">{place}</bdi>
            </WhiteBadge>
          ))}
          <CardMore count={card.morePlaces} target={ATLAS_PAGE} />
        </div>
      )}
      {card.markedBy === 'dawarich' && (
        <p className="m-0 mt-2 flex items-center gap-1 text-caption text-content-faint">
          <Radio size={12} aria-hidden="true" className="flex-none" />
          {t('assistant.card.atlas.fromRecordings')}
        </p>
      )}
    </div>
  );
}

/** The countries of an answer, one under the other in one frame. */
export default function AtlasCountryBlock({ cards }: { cards: readonly CardEntry[]; message: AssistantMessage }) {
  const { t } = useTranslation();
  const countries = cards.flatMap((entry) => (entry.card.kind === 'atlasCountry' ? [entry] : []));
  if (countries.length === 0) return null;
  return (
    <CardFrame label={t('assistant.domain.atlas')}>
      {countries.map((entry, index) => (
        <div key={entry.toolCallId} className={index > 0 ? 'mt-2 border-t border-edge-faint pt-2' : ''}>
          {entry.card.kind === 'atlasCountry' && <CountrySection card={entry.card} />}
        </div>
      ))}
      <div className="mt-1 flex justify-end">
        <CardOpenButton target={ATLAS_PAGE} labelKey="assistant.card.atlas.open" />
      </div>
    </CardFrame>
  );
}

/** A country change's lead: the flag with what the change does as a dot on its corner. */
export function AtlasCountryLead({ card, item }: { card: CountryCard; item: ChangeItem }) {
  return <ChangeFlag code={card.code} item={item} />;
}

/**
 * What a country change does: the country's standing from now to after (just
 * the new one for a country not on the map yet) and the trips that keep it
 * there; for a region, its country and the region's own standing.
 */
export function AtlasCountryFacts({ card }: { card: CountryCard; item: ChangeItem }) {
  const { t } = useTranslation();
  const { countryName } = useAtlasCard();
  const change = card.change;
  if (!change) return null;
  if (change.region) {
    return (
      <>
        <WhiteBadge icon={<CountryFlag code={card.code} size={10} />}>
          <bdi>{countryName(card.code)}</bdi>
        </WhiteBadge>
        <StatusFact before={change.region.before} after={change.region.after} />
      </>
    );
  }
  const trips = card.tripCount ?? 0;
  return (
    <>
      <StatusFact before={card.status} after={change.after} />
      {trips > 0 && (
        <WhiteBadge icon={<Briefcase size={10} strokeWidth={2.2} aria-hidden="true" />}>
          {t('assistant.card.atlas.trips', { count: trips })}
        </WhiteBadge>
      )}
    </>
  );
}
