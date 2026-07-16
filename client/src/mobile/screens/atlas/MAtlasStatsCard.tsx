import { Star } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import type { AtlasStats } from '../../../pages/atlas/atlasModel'

interface MAtlasStatsCardProps {
  stats: AtlasStats
  bucketCount: number
  onOpenBucket: () => void
}

/**
 * Floating stats card above the bottom nav: five stat columns straight from
 * the design, plus the bucket-list chip as the mobile entry into the bucket
 * sheet (the desktop panel's second tab has no place in this layout).
 */
export default function MAtlasStatsCard({ stats, bucketCount, onOpenBucket }: MAtlasStatsCardProps) {
  const { t } = useTranslation()
  const cols: [number, string][] = [
    [stats.totalCountries, t('atlas.countries')],
    [stats.totalTrips, t('atlas.trips')],
    [stats.totalPlaces, t('atlas.places')],
    [stats.totalCities || 0, t('atlas.cities')],
    [stats.totalDays, t('atlas.days')],
  ]

  return (
    <div className="absolute bottom-[calc(var(--bottom-nav-h,84px)+16px)] left-4 right-4 z-[5] flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={onOpenBucket}
        className="flex flex-none items-center gap-[6px] rounded-full bg-m-act px-3 py-[7px] font-geist text-[0.6875rem] font-bold text-m-actfg shadow-[0_8px_20px_-6px_rgba(0,0,0,.4)]"
      >
        <Star size={12} strokeWidth={2.4} />
        {t('atlas.bucketTab')}
        {bucketCount > 0 && <span className="tabular-nums opacity-70">{bucketCount}</span>}
      </button>
      <div className="flex w-full rounded-[22px] border border-[color:var(--m-shbr)] bg-[color:var(--m-sheet)] px-3 py-[14px] shadow-[0_18px_44px_-20px_rgba(0,0,0,.4)]">
        {cols.map(([n, l]) => (
          <div key={l} className="flex-1 text-center">
            <div className="text-[1.375rem] font-extrabold leading-none tabular-nums text-m-ink">{n}</div>
            <div className="mt-1 font-geist text-[0.53125rem] font-bold uppercase tracking-[.06em] text-m-faint">{l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
