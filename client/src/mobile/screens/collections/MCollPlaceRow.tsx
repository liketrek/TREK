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
 * A saved place, one card: the tinted category tile, name and address, and at
 * its trailing end the status pill (tap = cycle Idea → Want to go → Visited)
 * over the category pill. In select mode a tap toggles the selection.
 *
 * The pills used to stand in a card of their own beside the place, mostly empty
 * and a third of a narrow window wide, which cut the names short.
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
    'inline-flex max-w-[92px] box-border items-center justify-center gap-1 rounded-full px-2 py-[4px] font-geist text-[0.5625rem] font-extrabold'
  // The words in the colour, pulled towards the ink so they read on the light
  // ground as well as on the dark one; the ground a stronger wash of it.
  const pillStyle = (color: string) => ({
    background: `color-mix(in srgb, ${color} 16%, transparent)`,
    color: `color-mix(in srgb, ${color} 62%, var(--m-ink))`,
  })

  return (
    <div
      className="mt-2 flex items-center rounded-2xl border border-[color:var(--m-rowbr)] bg-m-sheetop"
      style={selected ? { boxShadow: 'inset 0 0 0 1.5px var(--m-act)' } : undefined}
    >
      <button
        type="button"
        onClick={() => (selectMode ? onToggleSelect(place.id) : onOpen(place.id))}
        aria-pressed={selectMode ? selected : undefined}
        className="flex min-w-0 flex-1 items-center gap-[11px] self-stretch rounded-2xl py-[11px] pe-2 ps-3 text-start"
      >
        <span
          className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${selected ? 'bg-m-act text-m-actfg' : ''}`}
          style={selected ? undefined : { background: tint(meta.color, '1f'), color: meta.color }}
        >
          {selected ? <Check size={17} strokeWidth={2.4} /> : <TileIcon size={17} strokeWidth={2.2} />}
        </span>
        <span className="min-w-0 flex-1">
          <span dir="auto" className="block truncate text-[0.78125rem] font-bold text-m-ink">{place.name}</span>
          {place.address && (
            <span className="mt-[2px] flex items-center gap-[3px] truncate font-geist text-[0.625rem] text-m-muted">
              <MapPin size={9} strokeWidth={2.2} className="flex-none" />
              <span dir="auto" className="truncate">{place.address}</span>
            </span>
          )}
        </span>
      </button>

      <div className="flex flex-none flex-col items-end justify-center gap-[5px] py-2 pe-3">
        <button
          type="button"
          disabled={!canEdit || selectMode}
          onClick={() => onSetStatus(place.id, nextStatus(place.status))}
          aria-label={t(status.labelKey)}
          className={pill}
          style={pillStyle(status.color)}
        >
          <StatusIcon size={9} strokeWidth={2.6} className="flex-none" />
          <span className="truncate">{t(status.labelKey)}</span>
        </button>
        {cat && place.category?.name && (
          <span className={pill} style={pillStyle(cat.color)}>
            <TileIcon size={9} strokeWidth={2.6} className="flex-none" />
            <span dir="auto" className="truncate">{place.category.name}</span>
          </span>
        )}
      </div>
    </div>
  )
}
