import { Feather, Calendar, MapPin, Check, X } from 'lucide-react'
import MSheet from '../../components/MSheet'
import MIconBtn from '../../components/MIconBtn'
import { useTranslation } from '../../../i18n'
import { pickGradient } from '../../../pages/journeyDetail/JourneyDetailPage.helpers'

export interface CreateSheetTrip {
  id: number
  title: string
  start_date?: string | null
  end_date?: string | null
  place_count?: number
  cover_image?: string | null
}

interface MJourneyCreateSheetProps {
  open: boolean
  title: string
  onTitleChange: (value: string) => void
  trips: CreateSheetTrip[]
  selectedTripIds: Set<number>
  onToggleTrip: (id: number) => void
  onCreate: () => void
  onClose: () => void
}

function tripDays(trip: CreateSheetTrip): number | null {
  if (!trip.start_date) return null
  const end = new Date(trip.end_date || trip.start_date).getTime()
  const start = new Date(trip.start_date).getTime()
  return Math.ceil((end - start) / 86400000) + 1
}

/** shJCreate — journey name + multi-select trip cards with a bouncing check circle. */
export default function MJourneyCreateSheet({
  open, title, onTitleChange, trips, selectedTripIds, onToggleTrip, onCreate, onClose,
}: MJourneyCreateSheetProps) {
  const { t } = useTranslation()

  return (
    <MSheet open={open} onClose={onClose} variant="card" material="opaque" ariaLabel={t('journey.frontpage.createJourney')}>
      <div className="flex flex-none items-center border-b border-[color:var(--m-rowbr)] px-[18px] pb-[10px] pt-4">
        <div className="flex-1 text-[1.0625rem] font-bold">{t('journey.frontpage.createJourney')}</div>
        <MIconBtn variant="neutral" size={34} onClick={onClose} ariaLabel={t('common.cancel')}>
          <X size={15} strokeWidth={2.2} />
        </MIconBtn>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-3">
        <div className="mb-[6px] font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">
          {t('journey.frontpage.journeyName')}
        </div>
        <div className="flex items-center gap-[10px] rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px] py-3">
          <Feather size={16} strokeWidth={2} className="flex-none text-m-muted" />
          <input
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            placeholder={t('journey.frontpage.namePlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-[0.875rem] font-semibold text-m-ink outline-none placeholder:text-m-faint"
          />
        </div>

        <div className="mb-2 mt-4 font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">
          {t('journey.frontpage.selectTrips')}
        </div>
        {trips.length === 0 && (
          <p className="py-3 text-center font-geist text-[0.71875rem] text-m-faint">{t('journey.trips.noTripsAvailable')}</p>
        )}
        {trips.map(trip => {
          const selected = selectedTripIds.has(trip.id)
          const days = tripDays(trip)
          return (
            <button
              key={trip.id}
              type="button"
              onClick={() => onToggleTrip(trip.id)}
              className={`mb-[9px] flex w-full items-center gap-3 rounded-2xl bg-m-sheetop p-[10px] text-left transition-[border-color,box-shadow] duration-200 ${
                selected
                  ? 'border-[1.5px] border-[color:var(--m-act)] shadow-[0_10px_26px_-16px_rgba(0,0,0,.55)]'
                  : 'border border-[color:var(--m-rowbr)] shadow-[0_8px_22px_-18px_rgba(0,0,0,.5)]'
              }`}
            >
              <span
                className="relative h-[52px] w-[52px] flex-none overflow-hidden rounded-[13px] shadow-[inset_0_0_0_1px_rgba(255,255,255,.25)]"
                style={
                  trip.cover_image
                    ? { backgroundImage: `url('${trip.cover_image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: pickGradient(trip.id) }
                }
              >
                <span className="absolute inset-0 bg-[linear-gradient(150deg,rgba(255,255,255,.18),rgba(0,0,0,.28))]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[0.875rem] font-extrabold">{trip.title}</div>
                <div className="mt-[5px] flex gap-[5px]">
                  {days !== null && (
                    <span className="inline-flex items-center gap-[3px] rounded-full bg-[color:var(--m-ic)] px-2 py-[2px] font-geist text-[0.5625rem] font-bold text-m-muted">
                      <Calendar size={9} strokeWidth={2.2} />
                      {t('mobileJourney.daysCount', { count: days })}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-[3px] rounded-full bg-[color:var(--m-ic)] px-2 py-[2px] font-geist text-[0.5625rem] font-bold text-m-muted">
                    <MapPin size={9} strokeWidth={2.2} />
                    {t('mobileJourney.placesCount', { count: trip.place_count ?? 0 })}
                  </span>
                </div>
              </div>
              <span
                className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 transition-[transform,background-color,border-color] duration-[220ms] ease-[cubic-bezier(.34,1.56,.64,1)] ${
                  selected
                    ? 'scale-100 border-[color:var(--m-act)] bg-m-act text-m-actfg'
                    : 'scale-90 border-[color:var(--m-rowbr)] bg-transparent text-transparent'
                }`}
              >
                <Check size={13} strokeWidth={3} />
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-none items-center gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3">
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-4 py-[9px] text-[0.78125rem] font-semibold"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={onCreate}
          disabled={!title.trim()}
          className="flex-1 rounded-full bg-m-act px-[18px] py-[9px] text-center text-[0.78125rem] font-semibold text-m-actfg disabled:opacity-40"
        >
          {t('journey.create')}
        </button>
      </div>
    </MSheet>
  )
}
