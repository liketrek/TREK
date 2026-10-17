import { useState } from 'react'
import { ChevronDown, ChevronRight, MapPin } from 'lucide-react'
import { fs, NEUTRAL_TINT } from '../../components/shared/DialogShell'
import { SoftPill } from '../../components/Planner/planParts'
import { useTranslation } from '../../i18n'
import { PlaceRow, type PlaceRowProps } from './SharedDayCard'

interface SharedUnplannedCardProps {
  places: (PlaceRowProps['place'] & { category_id?: number | null; category?: PlaceRowProps['category'] })[]
  categories: { id: number; color?: string | null; icon?: string | null }[]
}

/**
 * The places the trip has collected but not put on a day yet (#1758), under the
 * days and drawn like one of them, so a shared link shows the whole plan and not
 * only its scheduled half.
 */
export function SharedUnplannedCard({ places, categories }: SharedUnplannedCardProps) {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)
  if (places.length === 0) return null
  return (
    <article className="overflow-hidden rounded-2xl border border-edge-faint bg-surface-card">
      <div className="flex items-center gap-2.5 py-2.5 ps-2.5 pe-2" style={{ background: NEUTRAL_TINT }}>
        <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-surface-card text-content-muted shadow-sm">
          <MapPin size={14} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1 truncate font-bold text-content" style={fs(13.5, 'body')}>{t('shared.unplanned')}</span>
        <SoftPill>{places.length} {t('shared.places', { count: places.length })}</SoftPill>
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? t('common.expand') : t('common.collapse')}
          aria-expanded={!collapsed}
          className="grid h-7 w-7 flex-none place-items-center rounded-full text-content-muted hover:bg-surface-card hover:text-content"
        >
          {collapsed ? <ChevronRight size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
        </button>
      </div>
      {!collapsed && (
        <div className="flex flex-col gap-0.5 border-t border-edge-faint p-1.5">
          {places.map(place => (
            <PlaceRow
              key={place.id}
              place={place}
              category={categories.find(c => c.id === place.category_id) ?? place.category ?? null}
            />
          ))}
        </div>
      )}
    </article>
  )
}
