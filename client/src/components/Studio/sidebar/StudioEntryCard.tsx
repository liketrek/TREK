import type { BookElement } from '@trek/shared';
import { bookCoordValue, formatBookCoords, formatBookDate } from '@trek/shared';
import { Camera } from 'lucide-react';

import { MOOD_CONFIG, WEATHER_CONFIG } from '../../../pages/journeyDetail/JourneyDetailPage.constants';
import { formatDate } from '../../../utils/formatters';
import type { JourneySource } from '../StudioSidebar';
import { markDrop, prosConsDrop, textDrop, type DropPlace } from './contentDrops';

type Entry = JourneySource['entries'][number];

/** One chip of an entry: what it says, and the element it places, built when it is pressed. */
interface EntryChip {
  key: string;
  label: string;
  make: () => BookElement;
  /** How many pieces it places, for the pros and cons. */
  count?: number;
}

/**
 * The pieces of an entry that can go on a page, in the order the card offers
 * them: its words (title, story, place), its day and its point, set the way the
 * rest of the book sets them (the long date, coordinates in degrees), its mood
 * and weather, and its pros and cons. A piece the entry has not got is not
 * offered. Each element is built only when its chip is pressed, so a card
 * drawn twice mints no ids.
 */
function entryChips(entry: Entry, place: DropPlace, locale: string, t: (k: string) => string): EntryChip[] {
  const { id, title, story, location, date, lat, lng, mood, weather, pros, cons } = entry;
  // The short marks (a date, a point) land on a short line rather than across the whole column.
  const markWidth = place.page.pageWidth * 0.36;
  const bold = { size: 8, weight: 700 } as const;
  const chips: EntryChip[] = [];
  if (title)
    chips.push({
      key: 'title',
      label: t('journey.studio.addTitle'),
      make: () => textDrop(place, title, { size: 22, weight: 700 }, { entryId: id, source: 'entry.title' }),
    });
  if (story)
    chips.push({
      key: 'story',
      label: t('journey.studio.addStory'),
      make: () => textDrop(place, story, { size: 10, weight: 400 }, { entryId: id, source: 'entry.story' }),
    });
  if (location)
    chips.push({
      key: 'place',
      label: t('journey.studio.addPlace'),
      make: () => textDrop(place, location, bold, { entryId: id, source: 'entry.location' }),
    });
  if (date)
    chips.push({
      key: 'date',
      label: t('journey.studio.dateMark'),
      make: () =>
        textDrop(
          place,
          formatBookDate(date, locale),
          bold,
          { entryId: id, source: 'entry.date', value: date },
          markWidth
        ),
    });
  if (lat != null && lng != null)
    chips.push({
      key: 'coords',
      label: t('journey.studio.coordsMark'),
      make: () =>
        textDrop(
          place,
          formatBookCoords(lat, lng, 'dms'),
          bold,
          { entryId: id, source: 'entry.location', format: 'dms', value: bookCoordValue(lat, lng) },
          markWidth
        ),
    });
  const moodMark = mood ? MOOD_CONFIG[mood] : undefined;
  if (mood && moodMark) {
    const label = t(moodMark.label);
    chips.push({ key: 'mood', label, make: () => markDrop(place, 'mood', mood, label) });
  }
  const weatherMark = weather ? WEATHER_CONFIG[weather] : undefined;
  if (weather && weatherMark) {
    const label = t(weatherMark.label);
    chips.push({ key: 'weather', label, make: () => markDrop(place, 'weather', weather, label) });
  }
  if (pros.length > 0 || cons.length > 0)
    chips.push({
      key: 'proscons',
      label: t('journey.studio.addProsCons'),
      count: pros.length + cons.length,
      make: () => prosConsDrop(place, { pros, cons }, { pro: t('journey.editor.pros'), con: t('journey.editor.cons') }),
    });
  return chips;
}

/**
 * One entry of the journal in Content > Entries: its name, its day and place,
 * and a chip for every piece of it that can go on a page.
 *
 * Each chip shows what it places rather than the field it comes from ("Sunny"
 * tells you what you are about to place; "Weather" does not), and every piece
 * arrives still bound to the entry. The last chip is not a drop: it opens the
 * entry's photos, because the day is how anyone thinks of its pictures.
 */
export function StudioEntryCard({
  entry,
  place,
  locale,
  t,
  onAdd,
  onPhotos,
}: {
  entry: Entry;
  place: DropPlace;
  locale: string;
  t: (k: string) => string;
  onAdd: (el: BookElement) => void;
  /** Opens the photos tab on this entry's pictures. */
  onPhotos: (entryId: number) => void;
}) {
  const { id, title, location, date, photoIds } = entry;
  return (
    <div className="st-entry">
      <div className="st-entry-head">{title || location || t('journey.studio.untitled')}</div>
      {(date || location) && (
        <div className="st-entry-meta">
          {/* Two facts, two badges. Joined by a dot they read as one string. The date follows the app's
              language, like every other date in TREK (utils/formatters.ts). */}
          {date && <span className="st-badge">{formatDate(date, locale) ?? date}</span>}
          {location && (
            <span className="st-badge is-quiet" title={location}>
              {location}
            </span>
          )}
        </div>
      )}
      <div className="st-row st-entry-chips">
        {entryChips(entry, place, locale, t).map((chip) => (
          <button type="button" key={chip.key} className="st-chip" onClick={() => onAdd(chip.make())}>
            {chip.label}
            {chip.count != null && <span className="st-chip-count">{chip.count}</span>}
          </button>
        ))}
        {photoIds.length > 0 && (
          <button type="button" className="st-chip" onClick={() => onPhotos(id)}>
            <Camera size={12} aria-hidden />
            {t('journey.studio.entryPhotos')}
            <span className="st-chip-count">{photoIds.length}</span>
          </button>
        )}
      </div>
    </div>
  );
}
