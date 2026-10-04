import { MapPin, Play, Plus } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { moodMeta, weatherMeta } from '../../mobile/screens/journey/mobileJourneyMeta'
import { posterlessVideo } from '../../pages/journeyDetail/JourneyDetailPage.helpers'
import CountryFlag from '../shared/CountryFlag'
import { cardDateLabel, cardPhotoId, cardPlace, cardTitle, type CardPhoto } from './journeyCard'
import type { JourneyEntry } from '../../store/journeyStore'

/**
 * One entry of the phone timeline: the photo IS the card.
 *
 * It used to be a 64px thumbnail beside three lines of text, which spent the
 * card's width on a story nobody reads at that size and left the title truncated
 * after a handful of characters (discussion #2299). Now the picture fills the
 * card and the words sit on it: title and place bottom-left, where the eye lands,
 * and the two facts that place the moment — which country, which day — in the
 * corners above.
 *
 * The day is carried by the colour rather than by a number. A numbered card only
 * answers "how many stops into this day am I", which is not a question anyone
 * asks; the day scrubber above the carousel answers the one they do.
 *
 * Two shells draw this card. `tone` picks the surface a card without a photo
 * falls back to, because the phone shell's tokens are scoped to `.m-root` and
 * the tablet timeline is outside it. Everything else is a photo and white text,
 * which needs no tokens at all.
 */

/** A card's photo, plus what says whether a clip has a poster to draw (#2341). */
export interface CoverPhoto extends CardPhoto {
  media_type?: string | null
  provider?: string | null
  thumbnail_path?: string | null
}

/** The subset of an entry a card reads. Shared journeys hand over less than the journey's own. */
export interface CoverEntry {
  id: number
  type: JourneyEntry['type']
  title?: string | null
  story?: string | null
  location_name?: string | null
  location_lat?: number | null
  location_lng?: number | null
  country_code?: string | null
  entry_date: string
  entry_time?: string | null
  mood?: string | null
  weather?: string | null
  photos?: CoverPhoto[]
}

interface Props {
  entry: CoverEntry | JourneyEntry
  /** The colour of the day this entry belongs to, from `DAY_COLORS`. */
  dayColor: string
  isActive: boolean
  onClick: () => void
  /** Off when the journey has put that field away (journey settings). */
  showMood?: boolean
  showWeather?: boolean
  /** The public journey page serves photos through a share token. */
  photoUrlFor?: (photoId: number) => string
  tone?: 'app' | 'mobile'
}

export default function JourneyEntryCover({
  entry,
  dayColor,
  isActive,
  onClick,
  showMood = true,
  showWeather = true,
  photoUrlFor,
  tone = 'app',
}: Props) {
  const { t, locale } = useTranslation()
  const isSuggestion = entry.type === 'skeleton'

  const first = entry.photos?.[0]
  const photoId = cardPhotoId(first)
  // A clip without a poster has no picture to fill the card with; its thumbnail
  // route 404s and an <img> pointed at it would draw the broken glyph (#2341).
  const posterless = first != null && posterlessVideo(first)
  const src = photoId == null || posterless ? null : photoUrlFor ? photoUrlFor(photoId) : `/api/photos/${photoId}/thumbnail`

  const title = cardTitle(entry, t)
  const place = cardPlace(entry)
  const date = cardDateLabel(entry.entry_date, locale)
  const mood = showMood ? moodMeta(entry.mood) : undefined
  const weather = showWeather ? weatherMeta(entry.weather) : undefined

  const emptyGround = tone === 'mobile' ? 'bg-[color:var(--m-sheetop)]' : 'bg-white dark:bg-zinc-800'
  // One ground for every corner mark. Dark rather than a white veil: these sit on
  // whatever photograph the traveller took, and a bright sky swallowed the white one.
  const badge = 'rounded-full bg-black/45 px-[7px] py-[2px] text-[10px] font-bold whitespace-nowrap text-white backdrop-blur-[2px]'
  const badgeDot = 'flex h-[18px] w-[18px] items-center justify-center rounded-full bg-black/45 backdrop-blur-[2px]'

  return (
    <button
      type="button"
      onClick={onClick}
      // The whole card is the photo, so its own ring is what separates it from the
      // map behind. A suggestion is drawn as an outline rather than a solid thing:
      // it is somewhere you planned to be, not somewhere you have written about.
      className={`relative flex-none overflow-hidden rounded-[18px] text-left transition-[width,height] duration-150 ${
        isActive ? 'h-[180px] w-[164px] shadow-[0_18px_40px_-16px_rgba(0,0,0,.55)]' : 'h-[152px] w-[136px] shadow-[0_10px_24px_-14px_rgba(0,0,0,.5)]'
      } ${src ? '' : emptyGround} ${isSuggestion ? 'opacity-90' : ''}`}
      // backgroundImage, not background: the shorthand would drop the opaque colour
      // the class supplies and leave the map showing through a card that is only a
      // faint wash of the day's colour.
      // The day is the card's own edge rather than a bar along its foot: a hairline
      // all the way round groups a day at a glance without taking a strip of the
      // photograph. The active card gets a heavier one of the same colour.
      //
      // Inset, not an outer ring: the carousel scrolls, so it clips, and an outer
      // ring lost its top edge to that clip.
      style={{
        boxShadow: `inset 0 0 0 ${isActive ? 2.5 : 1.5}px ${dayColor}${isActive ? '' : 'b3'}`,
        ...(src ? null : { backgroundImage: `linear-gradient(160deg, ${dayColor}2e, ${dayColor}0d)` }),
      }}
    >
      {src ? (
        <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full rounded-[18px] object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center">
          {posterless
            ? <Play size={24} strokeWidth={1.8} fill="currentColor" style={{ color: dayColor }} className="ml-0.5 opacity-60" />
            : <MapPin size={24} strokeWidth={1.8} style={{ color: dayColor }} className="opacity-60" />}
        </span>
      )}

      {/* Two washes rather than one: the top corners carry small marks that would
          otherwise sit on a bright sky, and the bottom has to hold two lines of text. */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 to-transparent" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/45 to-transparent" />

      {/* Just the flag: it is already a coloured mark of its own, and a chip behind
          it only added a second shape to read. A drop shadow does the work the chip
          was doing, against a bright sky. Sized and placed to sit on the same line
          as the date opposite it. */}
      {entry.country_code && (
        <span className="absolute left-2 top-2 flex h-[18px] items-center drop-shadow-[0_1px_3px_rgba(0,0,0,.6)]">
          <CountryFlag code={entry.country_code} size={14} />
        </span>
      )}
      {/* A mark rather than the word: "Suggestion" spelled out took a third of a
          136px card and pushed the date off it. The plus is the same promise the
          desktop suggestion card makes with its Add Entry button, and the card's
          italic, dimmed title carries the rest. */}
      {isSuggestion && (
        <span
          className={`absolute top-2 ${entry.country_code ? 'left-[30px]' : 'left-2'} ${badgeDot} text-white`}
          title={t('journey.entry.suggestion')}
          aria-label={t('journey.entry.suggestion')}
        >
          <Plus size={12} strokeWidth={2.8} />
        </span>
      )}

      {/* Top right: when, and how it was. They fit beside each other now that the
          flag on the left is a bare mark rather than a chip of its own. */}
      <span className="absolute right-2 top-2 flex items-center gap-1">
        {mood && (
          <span className={badgeDot} style={{ color: mood.color }}>
            <mood.icon size={11} strokeWidth={2.4} />
          </span>
        )}
        {weather && (
          <span className={`${badgeDot} text-white`}>
            <weather.icon size={11} strokeWidth={2.4} />
          </span>
        )}
        <span className={badge}>{date}</span>
      </span>

      {/* Bottom: the name gets the room the thumbnail layout never had. */}
      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-[1px] px-[10px] pb-[10px]">
        <span className={`line-clamp-2 text-[13px] leading-[1.25] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,.6)] ${isSuggestion ? 'italic' : ''}`}>
          {title}
        </span>
        {place && (
          <span className="truncate text-[10.5px] leading-[1.3] font-medium text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,.6)]">
            {place}
          </span>
        )}
      </span>

    </button>
  )
}
