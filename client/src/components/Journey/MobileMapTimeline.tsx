import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Plus } from 'lucide-react'
import JourneyMap from './JourneyMap'
import MobileEntryCard from './MobileEntryCard'
import type { JourneyMapHandle } from './JourneyMap'
import type { JourneyEntry } from '../../store/journeyStore'
import { DAY_COLORS } from './dayColors'
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
}: Props) {
  const mapRef = useRef<JourneyMapHandle>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const entryDayMeta = useMemo(() => {
    const uniqueDates = [...new Set(entries.map((e: any) => e.entry_date).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)))]
    const counters = new Map<string, number>()
    return entries.map((e: any) => {
      const dayIdx = uniqueDates.indexOf(e.entry_date)
      const dayLabel = (counters.get(e.entry_date) ?? 0) + 1
      counters.set(e.entry_date, dayLabel)
      return { dayLabel, dayColor: DAY_COLORS[dayIdx % DAY_COLORS.length] }
    })
  }, [entries])
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  // Sync map focus when carousel scrolls (with guard for uninitialized map)
  const syncMapToCarousel = useCallback((index: number) => {
    const entry = entries[index]
    if (!entry) return

    const mapEntry = mapEntries.find(m => String(m.id) === String(entry.id))
    if (mapEntry) {
      try { mapRef.current?.focusMarker(String(mapEntry.id)) } catch {}
    } else {
      try { mapRef.current?.highlightMarker(null) } catch {}
    }
  }, [entries, mapEntries])
  // The delayed initial focus reads both through refs so it always works off
  // the current map entries, not the ones from the render that armed the timer.
  const syncMapToCarouselRef = useRef(syncMapToCarousel)
  syncMapToCarouselRef.current = syncMapToCarousel
  const activeIndexRef = useRef(activeIndex)
  activeIndexRef.current = activeIndex

  // Pick the card that's currently closest to the carousel horizontal center.
  // More stable than IntersectionObserver thresholds when the active card can
  // drift toward the viewport edge with proximity snapping.
  const pickNearestCard = useCallback(() => {
    const el = carouselRef.current
    if (!el) return
    const containerCenter = el.getBoundingClientRect().left + el.clientWidth / 2
    let bestIdx = 0
    let bestDist = Infinity
    cardRefs.current.forEach((node, idx) => {
      const r = node.getBoundingClientRect()
      const cardCenter = r.left + r.width / 2
      const d = Math.abs(cardCenter - containerCenter)
      if (d < bestDist) { bestDist = d; bestIdx = idx }
    })
    setActiveIndex(prev => {
      if (prev !== bestIdx) syncMapToCarousel(bestIdx)
      return bestIdx
    })
  }, [syncMapToCarousel])

  // Defer all state updates until scrolling settles — updating activeIndex
  // mid-swipe resizes cards (240→320px), causing layout reflow every frame.
  useEffect(() => {
    const el = carouselRef.current
    if (!el || entries.length === 0) return
    let settleTimer: number | null = null
    const onScroll = () => {
      if (settleTimer != null) window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(pickNearestCard, 150)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (settleTimer != null) window.clearTimeout(settleTimer)
    }
  }, [entries.length, pickNearestCard])

  // Scroll a given card into the horizontal center of the carousel
  const scrollCardIntoCenter = useCallback((idx: number) => {
    const card = cardRefs.current.get(idx)
    card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [])

  // Scroll carousel to entry when map marker is clicked
  const handleMarkerClick = useCallback((id: string) => {
    const idx = entries.findIndex((e: any) => String(e.id) === id)
    if (idx === -1) return
    setActiveIndex(idx)
    scrollCardIntoCenter(idx)
  }, [entries, scrollCardIntoCenter])

  // Tap on a card: if it's already active, open the edit view; otherwise
  // activate + center it first (don't jump straight into the editor).
  const handleCardTap = useCallback((entry: any, idx: number) => {
    if (idx === activeIndex) {
      onEntryClick(entry)
    } else {
      setActiveIndex(idx)
      scrollCardIntoCenter(idx)
    }
  }, [activeIndex, onEntryClick, scrollCardIntoCenter])

  // Initial map focus — delay to let Leaflet initialize and fitBounds. Also
  // re-runs when the markers arrive later than the entries, otherwise the
  // focus would fire against an empty map and never be retried.
  useEffect(() => {
    if (entries.length > 0) {
      const timer = setTimeout(() => syncMapToCarouselRef.current(activeIndexRef.current), 500)
      return () => clearTimeout(timer)
    }
  }, [entries.length, mapEntries.length])

  const activeEntryId = entries[activeIndex]
    ? String(entries[activeIndex].id)
    : null

  if (entries.length === 0) {
    return (
      <div
        className="fixed left-0 right-0 z-10"
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
          <div className="fixed right-4 z-30" style={{ bottom: 'calc(var(--bottom-nav-h, 84px) + 16px)' }}>
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
      className="fixed left-0 right-0 z-10"
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
        paddingBottom={200}
        cartoApiKey={cartoApiKey}
      />

      {/* Bottom carousel */}
      <div
        className="fixed left-0 right-0 z-40"
        style={{ touchAction: 'pan-x', bottom: carouselBottom }}
      >
        <div
          ref={carouselRef}
          className="flex gap-3 overflow-x-auto px-4 pb-3 pt-1"
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
              <MobileEntryCard
                entry={entry}
                dayLabel={entryDayMeta[i]?.dayLabel ?? i + 1}
                dayColor={entryDayMeta[i]?.dayColor ?? DAY_COLORS[0]}
                isActive={i === activeIndex}
                onClick={() => handleCardTap(entry, i)}
                publicPhotoUrl={publicPhotoUrl}
              />
            </div>
          ))}
        </div>
      </div>

      {/* FAB: add entry — bottom right, above the timeline carousel */}
      {!readOnly && onAddEntry && (
        <div
          className="fixed right-4 z-30"
          style={{ bottom: 'calc(var(--bottom-nav-h, 84px) + 168px)' }}
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
