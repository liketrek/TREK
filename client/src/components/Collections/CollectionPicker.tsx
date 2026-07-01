import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Bookmark, Loader2, ChevronDown, Check, Layers } from 'lucide-react'
import PlaceAvatar from '../shared/PlaceAvatar'
import { collectionsApi } from '../../api/collections'
import { STATUS_META, STATUS_ORDER } from '../../pages/collections/collectionsModel'
import type { CollectionPlace, CollectionStatus } from '@trek/shared'
import type { TranslationFn } from '../../types'

interface LocationBias {
  low: { lat: number; lng: number }
  high: { lat: number; lng: number }
}

interface ListMeta { id: number; name: string; color: string | null }

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

interface Opt { key: string | number; label: string; icon?: React.ReactNode; count?: number }

/** Compact click-away dropdown (Tailwind — this panel lives outside .trek-dash). */
function FilterDropdown({ current, options, onSelect, lead }: {
  current: string | number
  options: Opt[]
  onSelect: (key: string | number) => void
  lead: React.ReactNode
}): React.ReactElement {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])
  const cur = options.find(o => o.key === current) ?? options[0]
  return (
    <div className="relative min-w-0 flex-1" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}
        className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-surface-input text-[12px] font-medium text-content-secondary transition-colors ${open ? 'border-accent' : 'border-edge hover:bg-surface-hover'}`}>
        <span className="shrink-0 text-content-faint">{cur.icon ?? lead}</span>
        <span className="flex-1 min-w-0 truncate text-left">{cur.label}</span>
        <ChevronDown size={13} className="shrink-0 text-content-faint" />
      </button>
      {open && (
        <div role="listbox" className="absolute z-30 left-0 right-0 mt-1 max-h-[240px] overflow-y-auto p-1 rounded-xl border border-edge bg-surface-card shadow-lg flex flex-col gap-0.5">
          {options.map(o => (
            <button key={o.key} type="button" role="option" aria-selected={o.key === current} onClick={() => { onSelect(o.key); setOpen(false) }}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12.5px] text-left transition-colors hover:bg-surface-hover ${o.key === current ? 'text-content font-semibold' : 'text-content-secondary'}`}>
              <span className="shrink-0 text-content-faint">{o.icon}</span>
              <span className="flex-1 min-w-0 truncate">{o.label}</span>
              {o.count != null && <span className="shrink-0 text-[11px] text-content-faint tabular-nums">{o.count}</span>}
              {o.key === current && <Check size={13} className="shrink-0 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Right-hand column of the desktop add-place modal: the user's saved collection
 * places, searchable, filterable by list + status, and proximity-sorted, so a
 * place saved on an earlier trip can be dropped straight into the form.
 * Desktop only — gated by the caller.
 */
export default function CollectionPicker({ bias, onSelect, t }: CollectionPickerProps): React.ReactElement {
  const [places, setPlaces] = useState<CollectionPlace[]>([])
  const [lists, setLists] = useState<ListMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [listFilter, setListFilter] = useState<number | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<CollectionStatus | 'all'>('all')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    collectionsApi.list()
      .then(async (res) => {
        const detail = await Promise.all(res.collections.map(c => collectionsApi.get(c.id).catch(() => null)))
        if (cancelled) return
        const merged: CollectionPlace[] = []
        for (const d of detail) {
          if (!d) continue
          for (const p of d.places) merged.push(p)
        }
        setLists(res.collections.map(c => ({ id: c.id, name: c.name, color: c.color ?? null })))
        setPlaces(merged)
      })
      .catch(() => { if (!cancelled) { setPlaces([]); setLists([]) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const center = useMemo(
    () => (bias ? { lat: (bias.low.lat + bias.high.lat) / 2, lng: (bias.low.lng + bias.high.lng) / 2 } : null),
    [bias],
  )

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = places.filter(p => {
      if (listFilter !== 'all' && p.collection_id !== listFilter) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (!q) return true
      return p.name.toLowerCase().includes(q) || (p.address ?? '').toLowerCase().includes(q)
    })
    if (center) list.sort((a, b) => distanceTo(a, center) - distanceTo(b, center))
    else list.sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [places, search, center, listFilter, statusFilter])

  const listOpts: Opt[] = [
    { key: 'all', label: t('collections.picker.allLists'), icon: <Layers size={13} />, count: places.length },
    ...lists.map(l => ({
      key: l.id,
      label: l.name,
      icon: <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: l.color || '#6366f1' }} />,
      count: places.filter(p => p.collection_id === l.id).length,
    })),
  ]
  const statusOpts: Opt[] = [
    { key: 'all', label: t('common.all') },
    ...STATUS_ORDER.map(s => {
      const Icon = STATUS_META[s].icon
      return { key: s, label: t(STATUS_META[s].labelKey), icon: <Icon size={13} style={{ color: STATUS_META[s].color }} /> }
    }),
  ]

  return (
    <aside className="w-full sm:w-64 shrink-0 flex flex-col rounded-xl border border-edge bg-surface-secondary overflow-hidden self-stretch">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-edge shrink-0">
        <Bookmark size={15} className="text-accent" />
        <span className="text-[13px] font-semibold text-content">{t('collections.picker.title')}</span>
      </div>
      <div className="p-2.5 flex flex-col gap-2 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-faint" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('collections.picker.search')}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-edge bg-surface-input text-content text-[13px] outline-none focus:border-accent"
          />
        </div>
        {lists.length > 0 && (
          <div className="flex gap-2">
            <FilterDropdown current={listFilter} options={listOpts} onSelect={k => setListFilter(k as number | 'all')} lead={<Layers size={13} />} />
            <FilterDropdown current={statusFilter} options={statusOpts} onSelect={k => setStatusFilter(k as CollectionStatus | 'all')} lead={<Bookmark size={13} />} />
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2">
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
