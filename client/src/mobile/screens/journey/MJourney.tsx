import { Plus, NotebookPen, Image, MapPin } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { useJourney } from '../../../pages/journey/useJourney'
import type { Journey } from '../../../store/journeyStore'
import MJourneyCreateSheet from './MJourneyCreateSheet'
import MDancingTrek from '../../components/MDancingTrek'
import { journeyCoverSrc, journeyCoverStyle } from './mobileJourneyMeta'

type JourneyListItem = Journey & {
  entry_count?: number
  photo_count?: number
  place_count?: number
}

/** Journey list — hero card for the latest journey plus a 2-column grid with counters. */
export default function MJourney() {
  const { t } = useTranslation()
  const {
    navigate, journeys, loading,
    showCreate, setShowCreate, newTitle, setNewTitle,
    availableTrips, selectedTripIds, setSelectedTripIds,
    openCreateModal, handleCreate, activeJourney,
  } = useJourney()

  const list = journeys as JourneyListItem[]
  const hero = (activeJourney as JourneyListItem | null) ?? list[0] ?? null
  const rest = list.filter(j => j.id !== hero?.id)

  return (
    // h-dvh, not h-full: the shell stopped providing a definite height (#1809).
    // The feed below keeps its own scroller, so this screen does not move the
    // document and Safari's address bar stays put here.
    <div className="relative h-dvh">
      {/* Floating header: back + create pill */}
      <div className="fixed left-4 right-4 top-[var(--m-safe-top,12px)] z-30 flex items-center gap-[10px]">
        <button
          type="button"
          onClick={() => openCreateModal()}
          className="flex h-[38px] flex-1 items-center justify-center gap-[6px] whitespace-nowrap rounded-full bg-m-act px-[15px] text-[0.78125rem] font-bold text-m-actfg"
        >
          <Plus size={14} strokeWidth={2.4} />
          {t('journey.frontpage.createJourney')}
        </button>
      </div>

      <div className="h-full overflow-y-auto px-4 pt-[calc(var(--m-safe-top,12px)+52px)] pb-[calc(var(--bottom-nav-h,84px)+16px)]">
        {loading && list.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[color:var(--m-rowbr)] border-t-m-ink" />
          </div>
        ) : list.length === 0 ? (
          <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-10 text-center">
            <MDancingTrek scene="journey" className="mb-2" />
            <p className="font-geist text-[0.8125rem] font-medium text-m-muted">{t('journey.frontpage.createNew')}</p>
          </div>
        ) : (
          <>
            {hero && <HeroCard journey={hero} onOpen={() => navigate(`/journey/${hero.id}`)} />}

            {rest.length > 0 && (
              <>
                <div className="mx-[2px] mb-3 mt-[2px] flex items-center gap-[10px]">
                  <span className="h-px flex-1 bg-[color:var(--m-rowbr)]" />
                  <span className="font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">
                    {t('mobileJourney.otherJourneys')}
                  </span>
                  <span className="h-px flex-1 bg-[color:var(--m-rowbr)]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {rest.map(j => (
                    <GridCard key={j.id} journey={j} onOpen={() => navigate(`/journey/${j.id}`)} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <MJourneyCreateSheet
        open={showCreate}
        title={newTitle}
        onTitleChange={setNewTitle}
        trips={availableTrips}
        selectedTripIds={selectedTripIds}
        onToggleTrip={id =>
          setSelectedTripIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
          })
        }
        onCreate={handleCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  )
}

function HeroCard({ journey, onOpen }: { journey: JourneyListItem; onOpen: () => void }) {
  const { t } = useTranslation()
  const src = journeyCoverSrc(journey.cover_image)

  return (
    // Built like the dashboard's spotlight trip: the photo carries the card and
    // everything written sits on one panel of dark glass at its foot, rather than
    // a badge floating in one corner and text bleeding into a gradient at the
    // other. Two hero cards, two different languages, was the complaint.
    <button
      type="button"
      onClick={onOpen}
      className="relative mb-3 block h-[220px] w-full overflow-hidden rounded-[26px] text-left shadow-[0_24px_56px_-22px_rgba(0,0,0,.5)]"
    >
      {src ? (
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={journeyCoverStyle(journey)} />
      )}
      <div className="absolute right-[10px] bottom-[10px] left-[10px] rounded-[18px] border border-white/[.16] bg-[rgba(14,14,17,.52)] p-[12px_14px] text-white backdrop-blur-[22px] backdrop-saturate-[1.6]">{/* theme-lint-disable — fixed dark glass on the cover photo */}
        <span className="flex gap-[6px]">
          <span className="rounded-full bg-white/[.92] px-2 py-[3px] text-[0.625rem] font-bold tracking-[.07em] text-[#101013] uppercase">{/* theme-lint-disable — fixed on-photo badge */}
            {t('mobileJourney.latestJourney')}
          </span>
        </span>
        <div className="mt-[7px] truncate text-[1.4375rem] font-bold">{journey.title}</div>
        <div className="mt-[9px] flex gap-[6px]">
          <HeroPill icon={<NotebookPen size={10} strokeWidth={2.2} />} label={t('mobileJourney.entriesCount', { count: journey.entry_count ?? 0 })} />
          <HeroPill icon={<Image size={10} strokeWidth={2.2} />} label={t('mobileJourney.photosCount', { count: journey.photo_count ?? 0 })} />
          <HeroPill icon={<MapPin size={10} strokeWidth={2.2} />} label={t('mobileJourney.placesCount', { count: journey.place_count ?? 0 })} />
        </div>
      </div>
    </button>
  )
}

/** One fact about the journey, set like the spotlight trip's pills on the dashboard. */
function HeroPill({ icon, label }: { icon: React.ReactElement; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/[.28] px-[9px] py-[3px] font-geist text-[0.5625rem] font-bold tracking-[.07em] uppercase">
      {icon}
      {label}
    </span>
  )
}

function GridCard({ journey, onOpen }: { journey: JourneyListItem; onOpen: () => void }) {
  const entries = journey.entry_count ?? 0
  const photos = journey.photo_count ?? 0
  const places = journey.place_count ?? 0
  const hasStats = entries + photos + places > 0

  return (
    <button
      type="button"
      onClick={onOpen}
      className="overflow-hidden rounded-[20px] border border-[color:var(--m-rowbr)] bg-m-sheetop text-left shadow-[0_12px_30px_-20px_rgba(0,0,0,.4)]"
    >
      <div className="h-[74px]" style={journeyCoverStyle(journey)} />
      <div className="px-3 pb-[13px] pt-[11px]">
        <div className="truncate text-[0.875rem] font-extrabold">{journey.title}</div>
        {hasStats && (
          <div className="mt-[9px] flex gap-[5px]">
            <span className="inline-flex items-center gap-[3px] rounded-full bg-[color:var(--m-ic)] px-[7px] py-[2px] font-geist text-[0.5625rem] font-bold text-m-muted">
              <NotebookPen size={9} strokeWidth={2.2} />
              {entries}
            </span>
            <span className="inline-flex items-center gap-[3px] rounded-full bg-[color:var(--m-ic)] px-[7px] py-[2px] font-geist text-[0.5625rem] font-bold text-m-muted">
              <Image size={9} strokeWidth={2.2} />
              {photos}
            </span>
            <span className="inline-flex items-center gap-[3px] rounded-full bg-[color:var(--m-ic)] px-[7px] py-[2px] font-geist text-[0.5625rem] font-bold text-m-muted">
              <MapPin size={9} strokeWidth={2.2} />
              {places}
            </span>
          </div>
        )}
      </div>
    </button>
  )
}
