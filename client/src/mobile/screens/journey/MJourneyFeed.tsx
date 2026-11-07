import { MapPin, Play } from 'lucide-react';
import type { MutableRefObject } from 'react';

import {
  cardPhotoId,
  cardPlace,
  cardTitle,
  dayColorOf,
  type JourneyDay,
} from '../../../components/Journey/journeyCard';
import CountryFlag from '../../../components/shared/CountryFlag';
import { posterlessVideo } from '../../../pages/journeyDetail/JourneyDetailPage.helpers';
import type { JourneyEntry } from '../../../store/journeyStore';
import { moodMeta, storyExcerpt, weatherMeta } from './mobileJourneyMeta';

interface MJourneyFeedProps {
  entries: JourneyEntry[];
  days: JourneyDay[];
  activeIndex: number;
  /** The carousel's card refs: a marker tapped on the map scrolls its entry into view here. */
  cardRefs: MutableRefObject<Map<number, HTMLDivElement>>;
  onCardTap: (entry: JourneyEntry, index: number) => void;
  showMood: boolean;
  showWeather: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
}

/**
 * The journey as a feed beside its map, once the window has room for two panes
 * (split size class): every entry in reading order under its day, with its
 * photo, its place and the start of its story, where the phone has room only
 * for the strip of cards over the map. The two stay in step the way the strip
 * and the map do: a tap brings an entry to the map, a second one opens it, and
 * a marker tapped on the map scrolls its entry into view.
 */
export default function MJourneyFeed({
  entries,
  days,
  activeIndex,
  cardRefs,
  onCardTap,
  showMood,
  showWeather,
  t,
  locale,
}: MJourneyFeedProps) {
  return (
    <div className="flex flex-col">
      {entries.map((entry, index) => {
        const color = dayColorOf(days, entry.entry_date);
        const newDay = index === 0 || entries[index - 1].entry_date !== entry.entry_date;
        const dayNumber = days.findIndex((d) => d.date === entry.entry_date) + 1;
        return (
          <div key={entry.id}>
            {newDay && (
              <div className="mb-2 mt-5 flex items-center gap-2 px-[2px] first:mt-0">
                <span className="h-[9px] w-[9px] flex-none rounded-full" style={{ background: color }} />
                <span className="font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] font-extrabold uppercase tracking-[.09em] text-m-ink">
                  {t('journey.detail.day', { number: dayNumber })}
                </span>
                <span className="font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] font-semibold text-m-faint">
                  {new Date(entry.entry_date + 'T00:00:00').toLocaleDateString(locale, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'long',
                  })}
                </span>
              </div>
            )}
            <div
              ref={(node) => {
                if (node) cardRefs.current.set(index, node);
                else cardRefs.current.delete(index);
              }}
              className="mb-[10px] scroll-my-[calc(var(--m-safe-top,12px)+64px)]"
            >
              <FeedCard
                entry={entry}
                color={color}
                active={index === activeIndex}
                onTap={() => onCardTap(entry, index)}
                showMood={showMood}
                showWeather={showWeather}
                t={t}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface FeedCardProps {
  entry: JourneyEntry;
  color: string;
  active: boolean;
  onTap: () => void;
  showMood: boolean;
  showWeather: boolean;
  t: (key: string) => string;
}

function FeedCard({ entry, color, active, onTap, showMood, showWeather, t }: FeedCardProps) {
  const suggestion = entry.type === 'skeleton';
  const place = cardPlace(entry);
  const story = storyExcerpt(entry.story);
  return (
    <button
      type="button"
      onClick={onTap}
      aria-current={active ? 'true' : undefined}
      className={`block w-full overflow-hidden rounded-2xl border bg-m-sheetop text-start outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[color:var(--m-act)] ${
        suggestion ? 'border-dashed' : ''
      }`}
      // The day's colour is the card's edge, heavier on the entry the map shows.
      style={{
        borderColor: active ? color : 'var(--m-rowbr)',
        boxShadow: active ? `0 0 0 1.5px ${color}, 0 14px 32px -20px rgba(0,0,0,.45)` : undefined,
      }}
    >
      <FeedPhoto entry={entry} />
      <span className="flex flex-col gap-[5px] px-[13px] pb-3 pt-[11px]">
        <span className="flex items-start gap-2">
          <span
            className={`min-w-0 flex-1 text-body font-extrabold leading-[1.3] text-m-ink ${suggestion ? 'italic text-m-muted' : ''}`}
          >
            <bdi>{cardTitle(entry, t)}</bdi>
          </span>
          <FeedMarks entry={entry} showMood={showMood} showWeather={showWeather} />
        </span>
        {place && (
          <span className="flex min-w-0 items-center gap-[5px] text-m-muted">
            {entry.country_code ? (
              <CountryFlag code={entry.country_code} size={12} />
            ) : (
              <MapPin size={11} strokeWidth={2.2} className="flex-none" />
            )}
            <span dir="auto" className="truncate font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] font-semibold">
              {place}
            </span>
          </span>
        )}
        {story && <span dir="auto" className="line-clamp-3 text-caption leading-[1.45] text-m-ink opacity-80">{story}</span>}
      </span>
    </button>
  );
}

/** The entry's first photo across the card's head, with a count of the others. */
function FeedPhoto({ entry }: { entry: JourneyEntry }) {
  const first = entry.photos?.[0];
  const photoId = cardPhotoId(first);
  const posterless = first != null && posterlessVideo(first);
  if (photoId == null && !posterless) return null;
  const morePhotos = (entry.photos?.length ?? 0) - 1;
  return (
    <span className="relative block aspect-[16/9] w-full overflow-hidden bg-[color:var(--m-ic)]">
      {posterless ? (
        <span className="absolute inset-0 flex items-center justify-center text-m-muted">
          <Play size={26} strokeWidth={1.8} fill="currentColor" />
        </span>
      ) : (
        <img
          src={`/api/photos/${photoId}/thumbnail`}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {morePhotos > 0 && (
        <span className="absolute bottom-2 end-2 rounded-full bg-[color:var(--overlay)] px-[8px] py-[2px] font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] font-bold text-[color:var(--m-knob)] backdrop-blur">
          +{morePhotos}
        </span>
      )}
    </span>
  );
}

/** How the moment was and when, as marks beside the title. */
function FeedMarks({ entry, showMood, showWeather }: { entry: JourneyEntry; showMood: boolean; showWeather: boolean }) {
  const mood = showMood ? moodMeta(entry.mood) : undefined;
  const weather = showWeather ? weatherMeta(entry.weather) : undefined;
  if (!mood && !weather && !entry.entry_time) return null;
  const mark = 'flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[color:var(--m-ic)]';
  return (
    <span className="flex flex-none items-center gap-1">
      {mood && (
        <span className={mark} style={{ color: mood.color }}>
          <mood.icon size={12} strokeWidth={2.4} />
        </span>
      )}
      {weather && (
        <span className={`${mark} text-m-muted`}>
          <weather.icon size={12} strokeWidth={2.4} />
        </span>
      )}
      {entry.entry_time && (
        <span className="rounded-full bg-[color:var(--m-ic)] px-[8px] py-[2px] font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] font-bold tabular-nums text-m-muted">
          {entry.entry_time.slice(0, 5)}
        </span>
      )}
    </span>
  );
}
