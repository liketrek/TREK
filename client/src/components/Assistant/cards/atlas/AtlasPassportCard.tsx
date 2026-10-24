import type { AssistantMessage, AtlasPassportCard } from '@trek/shared';
import { CalendarClock, Flame, Globe2, Plane } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { SoftPill, WhiteBadge } from '../../../Planner/planParts';
import CountryFlag from '../../../shared/CountryFlag';
import { Tooltip } from '../../../shared/Tooltip';
import type { CardEntry } from '../cardTypes';
import CardFrame from '../parts/CardFrame';
import CardHeader from '../parts/CardHeader';
import { CardOpenButton } from '../parts/CardOpen';
import { CardMore } from '../parts/CardRows';
import { useCardFormat } from '../parts/useCardFormat';
import { CONTINENT_LABEL, STATUS_LOOK } from './atlasCardModel';
import { ATLAS_PAGE } from './atlasPage';
import { useAtlasCard } from './useAtlasCard';

/**
 * The user's atlas as the Atlas page shows it: the visited countries as the
 * big number with the planned ones beside it, the strip of travel figures
 * (trips, days, cities, the distance flown), the flags latest first with the
 * planned ones faded, the continents, the next trip and the streak. A user
 * without trips gets the number and the flags.
 */

/** One figure of the strip, the way the Atlas page's stats read: the number big, its name small under it. */
function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-col-reverse items-center px-1">
      <dt className="mt-1 max-w-full truncate text-caption font-semibold uppercase tracking-wide text-content-faint">
        {label}
      </dt>
      <dd className="m-0 text-body font-black tabular-nums leading-none text-content">{value}</dd>
    </div>
  );
}

function Passport({ card }: { card: AtlasPassportCard }) {
  const { t } = useTranslation();
  const format = useCardFormat();
  const { countryName, limits } = useAtlasCard();
  const { countries, totals } = card;
  const flags = card.flags.slice(0, limits.flags);
  const moreFlags = card.flags.length - flags.length + card.moreFlags;
  const hasTrips = totals.trips > 0;
  const figures = [
    { key: 'trips', value: format.count(totals.trips), label: t('atlas.trips', { count: totals.trips }) },
    { key: 'days', value: format.count(totals.days), label: t('atlas.days', { count: totals.days }) },
    { key: 'cities', value: format.count(totals.cities), label: t('atlas.cities', { count: totals.cities }) },
    ...(totals.flownKm === null
      ? []
      : [{ key: 'flown', value: format.distance(totals.flownKm), label: t('assistant.card.atlas.factFlown') }]),
  ];
  const continents = card.continents.filter((continent) => continent.visited > 0);
  const next = card.nextTrip;
  const nextLine =
    next && next.daysUntil !== null
      ? next.daysUntil === 0
        ? t('assistant.card.atlas.nextTripToday', { title: next.title })
        : t('assistant.card.atlas.nextTrip', { title: next.title, count: next.daysUntil })
      : null;
  const streak = card.streakYears !== null && card.streakYears >= 2 ? card.streakYears : null;
  return (
    <CardFrame label={t('assistant.card.atlas.passportTitle')}>
      <CardHeader
        icon={Globe2}
        tone="info"
        title={t('assistant.card.atlas.passportTitle')}
        actions={<CardOpenButton target={ATLAS_PAGE} labelKey="assistant.card.atlas.open" />}
      />
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex items-baseline gap-1.5">
          <span className="text-title font-black tabular-nums leading-none text-content">
            {format.count(countries.visited)}
          </span>
          <span className="text-caption font-medium text-content-muted">
            {t('atlas.countries', { count: countries.visited })}
          </span>
        </span>
        {countries.planned > 0 && (
          <SoftPill tone="info" icon={<CalendarClock size={10} strokeWidth={2.2} aria-hidden="true" />}>
            {t('assistant.card.atlas.planned', { count: countries.planned })}
          </SoftPill>
        )}
      </div>
      {hasTrips && (
        <dl
          className={`m-0 mt-2.5 grid gap-1 rounded-lg bg-surface-secondary px-1 py-2 ${
            figures.length === 4 ? 'grid-cols-4' : 'grid-cols-3'
          }`}
        >
          {figures.map((figure) => (
            <Figure key={figure.key} value={figure.value} label={figure.label} />
          ))}
        </dl>
      )}
      {flags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {flags.map((flag) => {
            const label = `${countryName(flag.code)}, ${t(STATUS_LOOK[flag.status].labelKey)}`;
            return (
              <Tooltip key={flag.code} label={label} placement="top">
                <span role="img" aria-label={label} className={flag.status === 'planned' ? 'opacity-60' : ''}>
                  <CountryFlag code={flag.code} size={18} />
                </span>
              </Tooltip>
            );
          })}
          <CardMore count={moreFlags} target={ATLAS_PAGE} />
        </div>
      )}
      {continents.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {continents.map((continent) => (
            <WhiteBadge key={continent.name}>
              {t(CONTINENT_LABEL[continent.name].labelKey)}
              <span className="font-semibold text-content">{format.count(continent.visited)}</span>
            </WhiteBadge>
          ))}
        </div>
      )}
      {(nextLine || streak !== null) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-content-faint">
          {nextLine && (
            <span className="flex min-w-0 items-center gap-1">
              <Plane size={12} aria-hidden="true" className="flex-none rtl:-scale-x-100" />
              <bdi className="break-words">{nextLine}</bdi>
            </span>
          )}
          {streak !== null && (
            <span className="flex items-center gap-1">
              <Flame size={12} aria-hidden="true" className="flex-none" />
              {t('assistant.card.atlas.streak', { count: streak })}
            </span>
          )}
        </div>
      )}
    </CardFrame>
  );
}

/** The passport of an answer; a second read in the same answer shows the newer figures only. */
export default function AtlasPassportBlock({ cards }: { cards: readonly CardEntry[]; message: AssistantMessage }) {
  const passports = cards.flatMap((entry) => (entry.card.kind === 'atlasPassport' ? [entry.card] : []));
  const latest = passports[passports.length - 1];
  return latest ? <Passport card={latest} /> : null;
}
