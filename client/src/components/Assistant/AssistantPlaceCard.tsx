import type { AssistantFoundPlace } from '@trek/shared';
import { Check, MapPin, Plus, Route, Star } from 'lucide-react';
import { createElement, type ReactNode, useRef } from 'react';

import { useTranslation } from '../../i18n';
import { getCategoryIcon } from '../shared/categoryIcons';
import { Tooltip } from '../shared/Tooltip';
import { useAssistantView } from './assistantViewContext';
import type { useAssistantPlaceStrip } from './useAssistantPlaceStrip';
import { useFoundPlacePhoto } from './useFoundPlacePhoto';

type Strip = ReturnType<typeof useAssistantPlaceStrip>;

const ACTION =
  'inline-flex items-center gap-1 rounded-lg bg-surface-secondary text-caption font-medium text-content transition-colors hover:bg-surface-hover disabled:cursor-default disabled:opacity-50 disabled:hover:bg-surface-secondary';

/** "Add to trip": opens the planner's place form filled in with the place, its details loading beside it. */
function AddButton({ place, strip, tall }: { place: AssistantFoundPlace; strip: Strip; tall: boolean }) {
  const { t } = useTranslation();
  return (
    <button type="button" onClick={() => strip.open(place)} className={`${ACTION} ${tall ? 'h-10' : 'h-7'} px-2`}>
      <Plus size={12} aria-hidden="true" />
      <span className="truncate">{t('assistant.place.add')}</span>
    </button>
  );
}

/** "+ Tour": takes the place into the saved tour open in the planner as a stop, held as a change in the chat. */
function TourButton({ place, strip, tall }: { place: AssistantFoundPlace; strip: Strip; tall: boolean }) {
  const { t } = useTranslation();
  if (!strip.tour) return null;
  return (
    <Tooltip label={t('assistant.place.addToTourHint', { name: strip.tour.name })} placement="top">
      <button
        type="button"
        onClick={() => strip.addToTour(place)}
        className={`${ACTION} ${tall ? 'h-10' : 'h-7'} min-w-0 px-2`}
      >
        <Route size={12} aria-hidden="true" className="flex-shrink-0" />
        <span className="truncate">{t('assistant.place.addToTour')}</span>
      </button>
    </Tooltip>
  );
}

type Category = ReturnType<Strip['categoryOf']>;

/** The picture, or the category's icon on its colour, with the category and whether it is open on it. */
function PlaceMedia({
  place,
  photo,
  category,
}: {
  place: AssistantFoundPlace;
  photo: string | null;
  category: Category;
}) {
  const { t } = useTranslation();
  const icon = category ? getCategoryIcon(category.icon) : MapPin;
  return (
    <span
      className="relative block h-24 w-full overflow-hidden bg-surface-secondary"
      // Without a picture the category's own colour washes the space, data from the trip.
      style={
        photo || !category
          ? undefined
          : { background: `color-mix(in srgb, ${category.color} 16%, var(--bg-secondary))` }
      }
    >
      {photo ? (
        <img
          src={photo}
          alt=""
          decoding="async"
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-[1.04]"
        />
      ) : (
        <span className="grid h-full w-full place-items-center">
          {createElement(icon, {
            size: 30,
            'aria-hidden': true,
            style: { color: category?.color ?? 'var(--text-faint)' },
          })}
        </span>
      )}
      {category && photo && (
        <span className="absolute start-2 top-2 inline-flex max-w-[75%] items-center gap-1 rounded-full bg-surface-card px-2 py-0.5 text-caption font-medium text-content shadow-sm">
          {createElement(icon, {
            size: 11,
            'aria-hidden': true,
            className: 'flex-shrink-0',
            style: { color: category.color },
          })}
          <bdi className="truncate">{category.name}</bdi>
        </span>
      )}
      {place.openNow !== null && (
        <span className="absolute bottom-2 end-2 inline-flex items-center gap-1 rounded-full bg-surface-card px-2 py-0.5 text-caption font-medium text-content-muted shadow-sm">
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${place.openNow ? 'bg-success' : 'bg-[color:var(--text-faint)]'}`}
          />
          {t(place.openNow ? 'assistant.place.openNow' : 'assistant.place.closed')}
        </span>
      )}
    </span>
  );
}

/** The card's one way on: "On map" for a place the trip has, "Suggested" once it is, else "+ Day 3". */
function PlaceAction({
  place,
  strip,
  suggested,
  tall,
}: {
  place: AssistantFoundPlace;
  strip: Strip;
  suggested: boolean;
  tall: boolean;
}): ReactNode {
  const { t } = useTranslation();
  if (place.inTripPlaceId !== null) {
    return (
      <Tooltip label={t('assistant.place.inTrip')} placement="top">
        <button type="button" onClick={() => strip.show(place)} className={`${ACTION} ${tall ? 'h-10' : 'h-7'} px-2`}>
          <MapPin size={12} aria-hidden="true" />
          {t('assistant.place.showOnMap')}
        </button>
      </Tooltip>
    );
  }
  if (suggested) {
    return (
      <span className="inline-flex h-7 items-center gap-1 text-caption text-content-muted">
        <Check size={12} aria-hidden="true" className="text-success" />
        {t('assistant.place.suggested')}
      </span>
    );
  }
  return strip.canAdd ? <AddButton place={place} strip={strip} tall={tall} /> : null;
}

/**
 * One place a search found, as a card: its picture from TREK's photo proxy
 * with the category it most likely belongs in on it (or that category's icon
 * on its colour), its name, address and rating, whether it is open now while
 * the trip runs, how far it is from the last stop of the day in focus, and one
 * way on: "Add to trip" for a new place, "On map" for one the trip has. A click
 * on a new place opens the place form filled in with it (one the trip has, or
 * any where nothing can be added, shows on the map), and resting the pointer on
 * it pins it there for a moment.
 */
export default function AssistantPlaceCard({
  place,
  strip,
  suggested,
}: {
  place: AssistantFoundPlace;
  strip: Strip;
  suggested: boolean;
}) {
  const { t } = useTranslation();
  const { variant, density } = useAssistantView();
  const ref = useRef<HTMLLIElement>(null);
  const photo = useFoundPlacePhoto(place, ref);
  const category = strip.categoryOf(place);
  const distance = strip.distanceOf(place);
  const tall = variant === 'fullscreen';

  return (
    <li
      ref={ref}
      className={`group/card flex flex-shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-edge-faint bg-surface-card shadow-sm transition-shadow hover:shadow-md ${
        density === 'compact' ? 'w-[188px]' : 'w-[220px]'
      }`}
      onMouseEnter={() => strip.hover(place)}
      onMouseLeave={() => strip.hover(null)}
    >
      <button
        type="button"
        onClick={() => (place.inTripPlaceId === null && strip.canAdd ? strip.open(place) : strip.show(place))}
        onFocus={() => strip.hover(place)}
        onBlur={() => strip.hover(null)}
        className="flex flex-col text-start outline-none focus-visible:bg-surface-hover"
      >
        <PlaceMedia place={place} photo={photo} category={category} />
        <span className="flex min-w-0 flex-col gap-1 px-3 pt-2.5">
          <bdi className="line-clamp-2 text-body font-semibold leading-snug text-content">{place.name}</bdi>
          {category && !photo && <bdi className="truncate text-caption text-content-muted">{category.name}</bdi>}
          {place.address && <bdi className="truncate text-caption text-content-muted">{place.address}</bdi>}
          {(place.rating !== null || distance) && (
            <span className="flex min-w-0 items-center gap-2 text-caption text-content-faint">
              {place.rating !== null && (
                <span className="inline-flex flex-shrink-0 items-center gap-0.5 font-medium text-content-muted">
                  <Star size={11} aria-hidden="true" className="fill-current text-warning" />
                  {place.rating.toFixed(1)}
                </span>
              )}
              {distance && <span className="truncate">{t('assistant.place.fromPrev', { distance })}</span>}
            </span>
          )}
        </span>
      </button>
      <div className="mt-auto flex min-w-0 gap-1.5 px-3 pb-3 pt-2.5">
        <PlaceAction place={place} strip={strip} suggested={suggested} tall={tall} />
        <TourButton place={place} strip={strip} tall={tall} />
      </div>
    </li>
  );
}
