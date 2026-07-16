import { Check, MapPin } from 'lucide-react'
import type { CollectionPlace, CollectionStatus } from '@trek/shared'
import type { TranslationFn } from '../../../types'
import { nextStatus } from '../../../pages/collections/collectionsModel'
import { categoryMeta, STATUS_SPEC, tint, UNCATEGORIZED_META } from './collectionsMobileModel'

interface MCollPlaceRowProps {
  place: CollectionPlace
  selectMode: boolean
  selected: boolean
  canEdit: boolean
  onOpen: (id: number) => void
  onToggleSelect: (id: number) => void
  onSetStatus: (id: number, status: CollectionStatus) => void
  t: TranslationFn
}

/**
 * A saved place: the main card (tinted category tile, name, address) next to
 * the status column with the status pill (tap = cycle Idea → Want to go →
 * Visited) and the category pill. In select mode a tap toggles the selection.
 */
export default function MCollPlaceRow({
  place, selectMode, selected, canEdit, onOpen, onToggleSelect, onSetStatus, t,
}: MCollPlaceRowProps) {
  const cat = categoryMeta(place.category)
  const meta = cat ?? UNCATEGORIZED_META
  const TileIcon = meta.icon
  const status = STATUS_SPEC[place.status]
  const StatusIcon = status.icon

  const pill =
    'inline-flex w-[78px] box-border items-center justify-center gap-1 truncate rounded-full py-[5px] font-geist text-[0.5625rem] font-extrabold'

  return (
    <div className="mt-2 flex items-stretch gap-2">
      <button
        type="button"
        onClick={() => (selectMode ? onToggleSelect(place.id) : onOpen(place.id))}
        aria-pressed={selectMode ? selected : undefined}
        className="flex min-w-0 flex-1 items-center gap-[11px] rounded-2xl border border-[color:var(--m-rowbr)] bg-m-sheetop px-3 py-[11px] text-left"
        style={selected ? { boxShadow: 'inset 0 0 0 1.5px var(--m-act)' } : undefined}
      >
        <span
          className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${selected ? 'bg-m-act text-m-actfg' : ''}`}
          style={selected ? undefined : { background: tint(meta.color, '1f'), color: meta.color }}
        >
          {selected ? <Check size={17} strokeWidth={2.4} /> : <TileIcon size={17} strokeWidth={2.2} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.78125rem] font-bold text-m-ink">{place.name}</span>
          {place.address && (
            <span className="mt-[2px] flex items-center gap-[3px] truncate font-geist text-[0.625rem] text-m-muted">
              <MapPin size={9} strokeWidth={2.2} className="flex-none" />
              <span className="truncate">{place.address}</span>
            </span>
          )}
        </span>
      </button>

      <div className="flex flex-none flex-col justify-center gap-[5px] rounded-2xl border border-[color:var(--m-rowbr)] bg-m-sheetop px-[10px] py-2">
        <button
          type="button"
          disabled={!canEdit || selectMode}
          onClick={() => onSetStatus(place.id, nextStatus(place.status))}
          aria-label={t(status.labelKey)}
          className={pill}
          style={{ background: tint(status.color, '18'), color: status.color }}
        >
          <StatusIcon size={9} strokeWidth={2.6} className="flex-none" />
          <span className="truncate">{t(status.labelKey)}</span>
        </button>
        {cat && place.category?.name && (
          <span className={pill} style={{ background: tint(cat.color, '18'), color: cat.color }}>
            <TileIcon size={9} strokeWidth={2.6} className="flex-none" />
            <span className="truncate">{place.category.name}</span>
          </span>
        )}
      </div>
    </div>
  )
}
