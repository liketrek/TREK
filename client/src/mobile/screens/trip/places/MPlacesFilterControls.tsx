import { ReactNode } from 'react'
import { Check, MapPin, Star } from 'lucide-react'
import MChip from '../../../components/MChip'
import { useTripStore } from '../../../../store/tripStore'
import { getCategoryIcon } from '../../../../components/shared/categoryIcons'
import { RATING_FLOORS, UNCATEGORIZED } from '../../../../utils/placesFilter'
import { useTranslation } from '../../../../i18n'
import type { Category, Place } from '../../../../types'

/**
 * The phone's places filter controls, shared by the places browser's filter panel
 * and the map's filter sheet. Both read and write the trip store, so whichever one
 * the user touches, the list and the map markers follow (#1541).
 */

/** 17px (panel) / 19px (row) square checkbox in the demo's act-fill style. */
export function SquareCheck({ checked, big = false }: { checked: boolean; big?: boolean }) {
  return (
    <span
      className={`flex flex-none items-center justify-center border-[1.5px] ${
        big ? 'h-[19px] w-[19px] rounded-[6px]' : 'h-[17px] w-[17px] rounded-[5px]'
      } ${checked ? 'border-[color:var(--m-act)] bg-m-act text-m-actfg' : 'border-[color:var(--m-trackoff)] text-transparent'}`}
    >
      <Check size={big ? 12 : 11} strokeWidth={3} />
    </span>
  )
}

function CategoryFilterRow({ checked, onToggle, label, children }: {
  checked: boolean
  onToggle: () => void
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="checkbox"
      aria-checked={checked}
      className="flex min-h-[44px] w-full items-center gap-[10px] border-b border-[color:var(--m-rowbr)] px-[13px] py-[10px] text-left last:border-b-0"
    >
      <SquareCheck checked={checked} />
      {children}
      <span className="min-w-0 flex-1 truncate text-[0.78125rem] font-medium text-m-ink">{label}</span>
    </button>
  )
}

/** The trip's categories as a multi-select, plus "no category" while a place has none. */
export function MCategoryFilterList({ categories, places }: { categories: Category[]; places: Place[] }) {
  const { t } = useTranslation()
  const categoryFilters = useTripStore(s => s.placesCategoryFilter)
  const setCategoryFilters = useTripStore(s => s.setPlacesCategoryFilter)
  const toggle = (catId: string) => {
    const next = new Set(categoryFilters)
    if (next.has(catId)) next.delete(catId)
    else next.add(catId)
    setCategoryFilters(next)
  }
  return (
    <>
      {categories.map(c => {
        const CatIcon = getCategoryIcon(c.icon)
        return (
          <CategoryFilterRow
            key={c.id}
            checked={categoryFilters.has(String(c.id))}
            onToggle={() => toggle(String(c.id))}
            label={c.name}
          >
            <CatIcon size={14} strokeWidth={2} className="flex-none" style={{ color: c.color || 'var(--m-muted)' }} />
          </CategoryFilterRow>
        )
      })}
      {places.some(p => p.category_id == null) && (
        <CategoryFilterRow
          checked={categoryFilters.has(UNCATEGORIZED)}
          onToggle={() => toggle(UNCATEGORIZED)}
          label={t('places.noCategory')}
        >
          <MapPin size={14} strokeWidth={2} className="flex-none text-m-faint" />
        </CategoryFilterRow>
      )}
    </>
  )
}

/**
 * A minimum of stars, the same floors as the desktop list and the collections bar
 * (#1435). `onPick` runs after a floor is chosen: the places browser drops its
 * selection then, as it does for a new pool.
 */
export function MRatingFloorChips({ onPick }: { onPick?: () => void } = {}) {
  const { t } = useTranslation()
  const ratingFilter = useTripStore(s => s.placesRatingFilter)
  const setRatingFilter = useTripStore(s => s.setPlacesRatingFilter)
  return (
    <div role="group" aria-label={t('places.filterByRating')} className="flex flex-wrap gap-[6px]">
      {RATING_FLOORS.map(floor => (
        <MChip key={String(floor)} size="tap" pressable active={ratingFilter === floor} onClick={() => { setRatingFilter(floor); onPick?.() }}>
          {floor === 'all' ? t('common.all') : (
            <>
              <Star size={12} strokeWidth={2.2} fill="currentColor" className="flex-none" />
              {`${floor}+`}
            </>
          )}
        </MChip>
      ))}
    </div>
  )
}
