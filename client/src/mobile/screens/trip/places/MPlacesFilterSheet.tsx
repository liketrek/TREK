import { RotateCcw, X } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import MIconBtn from '../../../components/MIconBtn'
import MChip from '../../../components/MChip'
import { useTripStore } from '../../../../store/tripStore'
import { countActivePlacesFilters } from '../../../../utils/placesFilter'
import { useTranslation } from '../../../../i18n'
import type { Category, Place } from '../../../../types'
import { MCategoryFilterList, MRatingFloorChips } from './MPlacesFilterControls'

interface MPlacesFilterSheetProps {
  open: boolean
  onClose: () => void
  places: Place[]
  categories: Category[]
}

/** Uppercase eyebrow over each group of the sheet. */
function SectionTitle({ children }: { children: string }) {
  return (
    <div className="mb-2 font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">{children}</div>
  )
}

/**
 * The places filter, opened from the phone map: which pool to show, a minimum
 * rating and the trip's categories, with one button that lifts them all. Every
 * choice lands in the trip store at once, so the markers behind the sheet and the
 * places list change with it (#1541). Routed as shell sheet 'placesFilter'.
 */
export default function MPlacesFilterSheet({ open, onClose, places, categories }: MPlacesFilterSheetProps) {
  const { t } = useTranslation()
  const filter = useTripStore(s => s.placesFilter)
  const categoryFilters = useTripStore(s => s.placesCategoryFilter)
  const ratingFilter = useTripStore(s => s.placesRatingFilter)
  const setFilter = useTripStore(s => s.setPlacesFilter)
  const resetPlacesFilters = useTripStore(s => s.resetPlacesFilters)
  const activeCount = countActivePlacesFilters({ filter, categoryFilters, ratingFilter })

  const pools = [
    { id: 'all', label: t('places.all') },
    { id: 'unplanned', label: t('places.unplanned') },
    { id: 'planned', label: t('places.planned') },
  ]
  if (places.some(p => p.route_geometry)) pools.push({ id: 'tracks', label: t('places.filterTracks') })
  const hasCategoryChoice = categories.length > 0 || places.some(p => p.category_id == null)

  return (
    <MSheet open={open} onClose={onClose} variant="bottom" ariaLabel={t('places.filters')}>
      <div className="flex flex-none items-center border-b border-[color:var(--m-rowbr)] px-[18px] pb-[11px] pt-4">
        <div className="min-w-0 flex-1 text-[1.03125rem] font-bold text-m-ink">{t('places.filters')}</div>
        <MIconBtn variant="neutral" size={34} onClick={onClose} ariaLabel={t('common.close')}>
          <X size={15} strokeWidth={2.2} />
        </MIconBtn>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-3 pt-[14px]">
        <section>
          <SectionTitle>{t('places.filterShow')}</SectionTitle>
          <div role="group" aria-label={t('places.filterShow')} className="flex flex-wrap gap-[6px]">
            {pools.map(pool => (
              <MChip key={pool.id} size="tap" active={filter === pool.id} onClick={() => setFilter(pool.id)}>
                {pool.label}
              </MChip>
            ))}
          </div>
        </section>

        <section className="mt-[18px]">
          <SectionTitle>{t('places.filterByRating')}</SectionTitle>
          <MRatingFloorChips />
        </section>

        {hasCategoryChoice && (
          <section className="mt-[18px]">
            <SectionTitle>{t('categories.title')}</SectionTitle>
            <div className="overflow-hidden rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]">
              <MCategoryFilterList categories={categories} places={places} />
            </div>
          </section>
        )}
      </div>

      <div className="flex flex-none border-t border-[color:var(--m-rowbr)] px-[18px] py-3">
        <button
          type="button"
          onClick={resetPlacesFilters}
          disabled={activeCount === 0}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-[0.8125rem] font-semibold text-m-ink disabled:opacity-40"
        >
          <RotateCcw size={14} strokeWidth={2.2} />
          {t('common.reset')}
        </button>
      </div>
    </MSheet>
  )
}
