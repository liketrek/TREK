import type { JourneyEntryLook } from '@trek/shared';
import { CalendarDays, Globe, Images, MapPin, Play, Users } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { cardDateLabel, cardPlace } from '../../../Journey/journeyCard';
import { SoftPill, TimePill, WhiteBadge } from '../../../Planner/planParts';
import CountryFlag from '../../../shared/CountryFlag';
import { CardFacts } from '../parts/CardFacts';
import { titleSourceOf } from './journeyCardModel';
import { moodOf, weatherOf } from './journeyTones';

/**
 * The pieces a journal entry is drawn from in the chat, the same in an
 * answer, a change row and a receipt: its photo, the facts of when and where
 * as the planner's badges, the marks of how it reads (shared, draft, mood,
 * weather, more photos) and the start of its text. Every fact wraps, none is
 * cut.
 */

const THUMB_SIZE = { sm: 'size-11', md: 'size-16', lg: 'size-20' } as const;
const THUMB_BOX = 'relative flex-none';
const THUMB_IMG = 'size-full rounded-lg bg-surface-secondary object-cover';
const VIDEO_MARK = 'absolute bottom-1 end-1';
const ICON = 'flex-none text-content-faint';
const STORY = {
  compact: 'mt-1.5 line-clamp-2 text-caption text-content-secondary',
  roomy: 'mt-1.5 line-clamp-3 text-caption text-content-secondary',
} as const;

/** The entry's photo as a square, a clip marked as one; nothing without a photo. */
export function EntryThumb({ look, size }: { look: JourneyEntryLook; size: keyof typeof THUMB_SIZE }) {
  const { t } = useTranslation();
  if (look.photoId === null) return null;
  return (
    <span className={`${THUMB_BOX} ${THUMB_SIZE[size]}`}>
      <img src={`/api/photos/${look.photoId}/thumbnail`} alt="" loading="lazy" className={THUMB_IMG} />
      {look.video && (
        <SoftPill className={VIDEO_MARK} icon={<Play size={10} aria-hidden="true" />}>
          <span className="sr-only">{t('assistant.card.journey.video')}</span>
        </SoftPill>
      )}
    </span>
  );
}

/** When and where: the day, the time, the place with its flag. */
export function EntryWhen({ look }: { look: JourneyEntryLook }) {
  const { locale } = useTranslation();
  const place = cardPlace(titleSourceOf(look));
  return (
    <CardFacts>
      <WhiteBadge icon={<CalendarDays size={10} strokeWidth={2.2} aria-hidden="true" className={ICON} />}>
        {cardDateLabel(look.date, locale)}
      </WhiteBadge>
      {look.time && <TimePill>{look.time}</TimePill>}
      {(place || look.countryCode) && (
        <SoftPill icon={<MapPin size={10} strokeWidth={2.2} aria-hidden="true" className={ICON} />}>
          {look.countryCode && <CountryFlag code={look.countryCode} size={12} />}
          {place && <bdi className="truncate">{place}</bdi>}
        </SoftPill>
      )}
    </CardFacts>
  );
}

/** Shared or public; nothing for a private entry. */
function VisibilityMark({ visibility }: { visibility: JourneyEntryLook['visibility'] }) {
  const { t } = useTranslation();
  if (visibility === 'private') return null;
  const shared = visibility === 'shared';
  const Icon = shared ? Users : Globe;
  return (
    <SoftPill tone="info" icon={<Icon size={10} strokeWidth={2.2} aria-hidden="true" />}>
      {shared ? t('journey.visibility.shared') : t('journey.visibility.public')}
    </SoftPill>
  );
}

/** A mood the journal knows, in its own colour; nothing for any other. */
function MoodMark({ id }: { id: string | null }) {
  const { t } = useTranslation();
  const mood = moodOf(id);
  if (!mood) return null;
  return (
    // The mood's own colour, the theme's token the journal draws it in.
    <SoftPill icon={<mood.Icon size={10} strokeWidth={2.2} aria-hidden="true" style={{ color: mood.color }} />}>
      {t(mood.labelKey)}
    </SoftPill>
  );
}

/** The weather by the journal's name for it, or as the traveller wrote it. */
function WeatherMark({ weather }: { weather: string | null }) {
  const { t } = useTranslation();
  if (!weather) return null;
  const known = weatherOf(weather);
  return (
    <SoftPill icon={known && <known.Icon size={10} strokeWidth={2.2} aria-hidden="true" className={ICON} />}>
      <bdi className="truncate">{known ? t(known.labelKey) : weather}</bdi>
    </SoftPill>
  );
}

/** How the entry reads: shared or public, a draft, its mood and weather, its photos past the first. */
export function EntryMarks({ look }: { look: JourneyEntryLook }) {
  const { t } = useTranslation();
  const mood = moodOf(look.mood) !== null;
  if (look.visibility === 'private' && !look.draft && !mood && !look.weather && look.photoCount < 2) return null;
  return (
    <CardFacts>
      <VisibilityMark visibility={look.visibility} />
      {look.draft && <SoftPill tone="warning">{t('journey.entry.draft')}</SoftPill>}
      <MoodMark id={look.mood} />
      <WeatherMark weather={look.weather} />
      {look.photoCount > 1 && (
        <SoftPill icon={<Images size={10} strokeWidth={2.2} aria-hidden="true" className={ICON} />}>
          {t('assistant.card.journey.photos', { count: look.photoCount })}
        </SoftPill>
      )}
    </CardFacts>
  );
}

/** The start of the entry's text, two lines where room is short, three where there is room. */
export function EntryStory({ look, roomy }: { look: JourneyEntryLook; roomy: boolean }) {
  if (!look.story) return null;
  return <p className={roomy ? STORY.roomy : STORY.compact}>{look.story}</p>;
}
