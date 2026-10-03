import { SlidersHorizontal } from 'lucide-react'
import { MapTogglePill } from '../../../../components/Map/MapTogglePill'
import { useTripStore } from '../../../../store/tripStore'
import { countActivePlacesFilters } from '../../../../utils/placesFilter'
import { useTranslation } from '../../../../i18n'

/**
 * The phone map's way into the places filter: a round control in the right-hand
 * stack, lit and badged with how many filters are narrowing the markers. The sheet
 * it opens is the shell's 'placesFilter' sheet.
 */
export function MPlacesFilterPill({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation()
  const filter = useTripStore(s => s.placesFilter)
  const categoryFilters = useTripStore(s => s.placesCategoryFilter)
  const ratingFilter = useTripStore(s => s.placesRatingFilter)
  const count = countActivePlacesFilters({ filter, categoryFilters, ratingFilter })
  const label = count > 0 ? `${t('places.filters')} (${count})` : t('places.filters')
  return (
    <MapTogglePill
      active={count > 0}
      onToggle={onOpen}
      label={label}
      badge={count}
      testId="places-filter-pill"
      icon={<SlidersHorizontal size={17} strokeWidth={2} />}
    />
  )
}
