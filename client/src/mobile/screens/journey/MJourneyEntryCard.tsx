import { MapPin } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { formatLocationName } from '../../../utils/formatters'
import { stripMarkdown } from '../../../components/Journey/stripMarkdown'
import type { JourneyEntry } from '../../../store/journeyStore'
import { moodMeta, weatherMeta } from './mobileJourneyMeta'

interface MJourneyEntryCardProps {
  entry: JourneyEntry
  number: number
  onClick: () => void
}

/** One 280px card of the horizontal journey timeline (photo column, number badge, mood/weather dots). */
export default function MJourneyEntryCard({ entry, number, onClick }: MJourneyEntryCardProps) {
  const { t, locale } = useTranslation()
  const firstPhoto = entry.photos?.[0]
  const mood = moodMeta(entry.mood)
  const weather = weatherMeta(entry.weather)
  const location = formatLocationName(entry.location_name)

  const dateLabel = new Date(entry.entry_date + 'T00:00:00').toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  })
  const storyPreview = entry.story ? stripMarkdown(entry.story) : ''
  const title = entry.title || (entry.type === 'checkin' ? t('journey.detail.journeyTab') : t('journey.editor.titlePlaceholder'))

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[280px] flex-none gap-[11px] rounded-[20px] bg-[color:var(--m-sheet)] p-[11px] text-left shadow-[0_16px_40px_-18px_rgba(0,0,0,.5)]"
    >
      {firstPhoto && (
        <span className="flex w-16 flex-none flex-col gap-[5px]">
          <img
            src={`/api/photos/${firstPhoto.photo_id}/thumbnail`}
            alt=""
            loading="lazy"
            className="h-16 w-16 rounded-[13px] object-cover"
          />
          {location && (
            <span className="inline-flex items-center justify-center gap-[3px] overflow-hidden truncate whitespace-nowrap rounded-full bg-[color:var(--m-ic)] px-[6px] py-[2px] font-geist text-[0.53125rem] font-bold text-m-muted">
              <MapPin size={8} strokeWidth={2.4} className="flex-none" />
              <span className="truncate">{location}</span>
            </span>
          )}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-[6px]">
          <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[#4A5BD4] text-[0.625rem] font-extrabold text-white">
            {number}
          </span>
          <span className="whitespace-nowrap rounded-full bg-[color:var(--m-ic)] px-2 py-[2px] font-geist text-[0.5625rem] font-bold text-m-muted">
            {dateLabel}
          </span>
          <span className="ml-auto flex gap-1">
            {mood && (
              <span
                className="flex h-[18px] w-[18px] items-center justify-center rounded-full"
                style={{ background: `${mood.color}22`, color: mood.color }}
              >
                <mood.icon size={11} strokeWidth={2.2} />
              </span>
            )}
            {weather && (
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted">
                <weather.icon size={11} strokeWidth={2.2} />
              </span>
            )}
          </span>
        </span>
        <span className="mt-1 block truncate text-[0.875rem] font-extrabold">{title}</span>
        {storyPreview && (
          <span className="mt-[2px] block font-geist text-[0.65625rem] leading-[1.4] text-m-muted line-clamp-2">
            {storyPreview}
          </span>
        )}
        {!firstPhoto && location && (
          <span className="mt-[6px] inline-flex max-w-full items-center gap-1 rounded-full bg-[color:var(--m-ic)] px-2 py-[2px] font-geist text-[0.5625rem] font-bold text-m-muted">
            <MapPin size={9} strokeWidth={2.4} className="flex-none" />
            <span className="truncate">{location}</span>
          </span>
        )}
      </span>
    </button>
  )
}
