import { useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import JourneyMap from './JourneyMap'
import JourneyEntryCover from './JourneyEntryCover'
import JourneyDayScrubber from './JourneyDayScrubber'
import { dayColorOf } from './journeyCard'
import { useJourneyCarouselSync } from './useJourneyCarouselSync'
import type { JourneyEntry } from '../../store/journeyStore'
import type { JourneyTrack } from '@trek/shared'

interface MapEntry {
  id: string
  lat: number
  lng: number
  title?: string | null
  mood?: string | null
  entry_date: string
}

interface Props {
  entries: JourneyEntry[] | any[]
  mapEntries: MapEntry[]
  trail?: { lat: number; lng: number }[]
  tracks?: JourneyTrack[]
  dark?: boolean
  readOnly?: boolean
  onEntryClick: (entry: any) => void
  onAddEntry?: () => void
  publicPhotoUrl?: (photoId: number) => string
  carouselBottom?: string
  /** CARTO key from the share payload, forwarded to the map (#2054). */
  cartoApiKey?: string
  /** Off when the journey has put that field away (journey settings). */
  showMood?: boolean
  showWeather?: boolean
  /** Which entry to open on. Today's, when today is part of the journey (#2299). */
  initialEntryId?: string | null
}

export default function MobileMapTimeline({
  entries,
  mapEntries,
  trail,
  tracks,
  dark,
  readOnly,
  onEntryClick,
  onAddEntry,
  publicPhotoUrl,
  carouselBottom = 'calc(var(--bottom-nav-h, 84px) + 8px)',
  cartoApiKey,
  showMood = true,
  showWeather = true,
  initialEntryId,
}: Props) {
  const {
    mapRef, carouselRef, cardRefs, activeIndex, setActiveIndex, scrubberDays,
    syncMapToCard: syncMapToCarousel, handleMarkerClick, handleCardTap, jumpToDay,
  } = useJourneyCarouselSync({ entries, mapEntries, onOpenEntry: onEntryClick })
  // The delayed initial focus reads both through refs so it always works off
  // the current map entries, not the ones from the render that armed the timer.
  const syncMapToCarouselRef = useRef(syncMapToCarousel)
  syncMapToCarouselRef.current = syncMapToCarousel
  const activeIndexRef = useRef(activeIndex)
  activeIndexRef.current = activeIndex

  // Initial map focus — delay to let Leaflet initialize and fitBounds. Also
  // re-runs when the markers arrive later than the entries, otherwise the
  // focus would fire against an empty map and never be retried.
  const openedRef = useRef(false)
  useEffect(() => {
    if (entries.length === 0) return
    const timer = setTimeout(() => {
      if (!openedRef.current && initialEntryId) {
        openedRef.current = true
        const idx = entries.findIndex((e: any) => String(e.id) === initialEntryId)
        if (idx > 0) {
          setActiveIndex(idx)
          cardRefs.current.get(idx)?.scrollIntoView({ inline: 'center', block: 'nearest' })
          syncMapToCarouselRef.current(idx)
          return
        }
      }
      syncMapToCarouselRef.current(activeIndexRef.current)
    }, 500)
    return () => clearTimeout(timer)
  }, [entries.length, mapEntries.length, initialEntryId])

  const activeEntryId = entries[activeIndex]
    ? String(entries[activeIndex].id)
    : null

  if (entries.length === 0) {
    return (
      <div
        className="fixed inset-x-0 z-10"
        style={{ top: 'var(--nav-h, 0px)', bottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <JourneyMap
          ref={mapRef}
          entries={mapEntries}
          checkins={[]}
          trail={trail}
          tracks={tracks}
          height={9999}
          dark={dark}
          onMarkerClick={handleMarkerClick}
          fullScreen
          cartoApiKey={cartoApiKey}
        />
        {!readOnly && onAddEntry && (
          <div className="fixed end-4 z-30" style={{ bottom: 'calc(var(--bottom-nav-h, 84px) + 16px)' }}>
            <button type="button"
              onClick={onAddEntry}
              className="w-12 h-12 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            >
              <Plus size={20} />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="fixed inset-x-0 z-10"
      style={{ top: 'var(--nav-h, 0px)', bottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Full-screen map */}
      <JourneyMap
        ref={mapRef}
        entries={mapEntries}
        checkins={[]}
        trail={trail}
        tracks={tracks}
        height={9999}
        dark={dark}
        activeMarkerId={activeEntryId}
        onMarkerClick={handleMarkerClick}
        fullScreen
        paddingBottom={250}
        cartoApiKey={cartoApiKey}
      />

      {/* Day bar + card carousel, as one block at the bottom of the map */}
      <div
        className="fixed inset-x-0 z-40"
        style={{ touchAction: 'pan-x', bottom: carouselBottom }}
      >
        <JourneyDayScrubber
          days={scrubberDays}
          activeDate={entries[activeIndex]?.entry_date ?? null}
          onPick={jumpToDay}
        />
        <div
          ref={carouselRef}
          className="flex items-end gap-[10px] overflow-x-auto px-4 pb-3 pt-1"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {entries.map((entry: any, i: number) => (
            <div
              key={entry.id}
              data-idx={i}
              ref={node => { if (node) cardRefs.current.set(i, node); else cardRefs.current.delete(i); }}
              style={{ scrollSnapAlign: 'center' }}
            >
              <JourneyEntryCover
                entry={entry}
                dayColor={dayColorOf(scrubberDays, entry.entry_date)}
                isActive={i === activeIndex}
                onClick={() => handleCardTap(entry, i)}
                showMood={showMood}
                showWeather={showWeather}
                photoUrlFor={publicPhotoUrl}
              />
            </div>
          ))}
        </div>
      </div>

      {/* FAB: add entry — bottom right, above the timeline carousel */}
      {!readOnly && onAddEntry && (
        <div
          className="fixed end-4 z-30"
          style={{ bottom: 'calc(var(--bottom-nav-h, 84px) + 226px)' }}
        >
          <button type="button"
            onClick={onAddEntry}
            className="w-12 h-12 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus size={20} />
          </button>
        </div>
      )}
    </div>
  )
}
