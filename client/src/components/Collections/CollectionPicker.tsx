import React, { useEffect, useMemo, useState } from 'react'
import { Search, Bookmark, Loader2 } from 'lucide-react'
import PlaceAvatar from '../shared/PlaceAvatar'
import { collectionsApi } from '../../api/collections'
import type { CollectionPlace } from '@trek/shared'
import type { TranslationFn } from '../../types'

interface LocationBias {
  low: { lat: number; lng: number }
  high: { lat: number; lng: number }
}

interface CollectionPickerProps {
  /** Trip bounding box used for autocomplete — sorts the saved places by
   *  proximity to the trip so the relevant ones surface first. */
  bias?: LocationBias
  /** Fills the place form from the chosen saved place (handleSelectMapsResult). */
  onSelect: (place: CollectionPlace) => void
  t: TranslationFn
}

function distanceTo(p: CollectionPlace, center: { lat: number; lng: number }): number {
  if (p.lat == null || p.lng == null) return Number.POSITIVE_INFINITY
  const dlat = p.lat - center.lat
  const dlng = p.lng - center.lng
  return dlat * dlat + dlng * dlng
}

/**
 * Right-hand column of the desktop add-place modal: the user's saved collection
 * places, searchable and proximity-sorted, so a place saved on an earlier trip
 * can be dropped straight into the form. Clones the maps search + scrollable
 * list pattern. Desktop only — gated by the caller.
 */
export default function CollectionPicker({ bias, onSelect, t }: CollectionPickerProps): React.ReactElement {
  const [places, setPlaces] = useState<CollectionPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    collectionsApi.list()
      .then(async (res) => {
        const detail = await Promise.all(res.collections.map(c => collectionsApi.get(c.id).catch(() => null)))
        if (cancelled) return
        const seen = new Set<number>()
        const merged: CollectionPlace[] = []
        for (const d of detail) {
          if (!d) continue
          for (const p of d.places) {
            if (seen.has(p.id)) continue
            seen.add(p.id)
            merged.push(p)
          }
        }
        setPlaces(merged)
      })
      .catch(() => { if (!cancelled) setPlaces([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const center = useMemo(
    () => (bias ? { lat: (bias.low.lat + bias.high.lat) / 2, lng: (bias.low.lng + bias.high.lng) / 2 } : null),
    [bias],
  )

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? places.filter(p => p.name.toLowerCase().includes(q) || (p.address ?? '').toLowerCase().includes(q))
      : [...places]
    if (center) list.sort((a, b) => distanceTo(a, center) - distanceTo(b, center))
    else list.sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [places, search, center])

  return (
    <aside className="w-full sm:w-64 shrink-0 flex flex-col rounded-xl border border-edge bg-surface-secondary overflow-hidden self-stretch">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-edge">
        <Bookmark size={15} className="text-accent" />
        <span className="text-[13px] font-semibold text-content">{t('collections.picker.title')}</span>
      </div>
      <div className="p-2.5">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-faint" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('collections.picker.search')}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-edge bg-surface-input text-content text-[13px] outline-none focus:border-accent"
          />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 max-h-[360px]">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-content-faint">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <p className="text-center text-[12px] text-content-faint py-10 px-3">{t('collections.picker.empty')}</p>
        ) : (
          <div className="flex flex-col gap-1">
            {visible.map(place => (
              <button
                key={place.id}
                type="button"
                onClick={() => onSelect(place)}
                title={t('collections.picker.use')}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-left hover:bg-surface-hover transition-colors"
              >
                <PlaceAvatar place={place} size={32} category={place.category ? { color: place.category.color ?? undefined, icon: place.category.icon ?? undefined } : null} />
                <span className="flex flex-col min-w-0">
                  <span className="text-[12.5px] font-medium text-content truncate">{place.name}</span>
                  {place.address && <span className="text-[11px] text-content-faint truncate">{place.address}</span>}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
