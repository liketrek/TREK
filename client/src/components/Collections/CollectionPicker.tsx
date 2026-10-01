import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search, Bookmark, Loader2, ChevronDown, Check, Layers, Plus, SearchX } from 'lucide-react'
import PlaceAvatar from '../shared/PlaceAvatar'
import { collectionsApi } from '../../api/collections'
import { STATUS_META, STATUS_ORDER } from '../../pages/collections/collectionsModel'
import type { CollectionPlace, CollectionStatus } from '@trek/shared'
import type { TranslationFn } from '../../types'
import { fs } from '../shared/DialogShell'
import { EditorField, INPUT, LABEL } from '../shared/dialogParts'
import { ColumnHead, HintCard, SIDE_COLUMN, WHITE_BUTTON } from '../Planner/placeDialogParts'

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

/** Detail requests fired at once while building the union — keeps a user with
 *  many lists from opening the modal with a burst of parallel requests. */
const DETAIL_BATCH = 4

/** Union of every list's places, in list order, without duplicates. */
async function loadSavedPlaces(ids: number[]): Promise<CollectionPlace[]> {
  const merged: CollectionPlace[] = []
  const seen = new Set<number>()
  for (let i = 0; i < ids.length; i += DETAIL_BATCH) {
    const batch = await Promise.all(ids.slice(i, i + DETAIL_BATCH).map(id => collectionsApi.get(id).catch(() => null)))
    for (const d of batch) {
      if (!d) continue
      for (const p of d.places) {
        if (seen.has(p.id)) continue
        seen.add(p.id)
        merged.push(p)
      }
    }
  }
  return merged
}

/**
 * Compact click-away dropdown (Tailwind, this panel lives outside .trek-dash).
 *
 * The panel is positioned against the FILTER ROW rather than against this
 * button, so it opens across the full width of the row instead of the half its
 * own trigger occupies. The two filters sit side by side and only one can be
 * open at a time, so the wider panel costs nothing and stops list names being
 * truncated at roughly ten characters. The row carries the `relative` this
 * needs; there is no other call site.
 */
function FilterDropdown({ label, current, options, onSelect, lead }: {
  /** What the filter filters, as the small label over it and as the name of its list. */
  label: string
  current: string | number
  options: Opt[]
  onSelect: (key: string | number) => void
  lead: React.ReactNode
}): React.ReactElement {
  const labelId = useId()
  const valueId = useId()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    // Captured and marked handled, so the key closes this list and not the dialog around it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey, true)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey, true) }
  }, [open])
  const cur = options.find(o => o.key === current) ?? options[0]
  return (
    <div className="min-w-0 flex-1" ref={ref}>
      <span id={labelId} className={LABEL}>{label}</span>
      {/* A white pill, like the pickers on the dialog's head band. Named by the
          label over it and the value it shows, so "All" says what it is all of. */}
      <button type="button" onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}
        aria-labelledby={`${labelId} ${valueId}`}
        className={`flex w-full items-center gap-1.5 rounded-full bg-surface-card px-2.5 py-1.5 font-semibold text-content shadow-sm ring-1 transition-colors hover:bg-surface-hover ${open ? 'ring-content-faint' : 'ring-edge-faint'}`}
        style={fs(12, 'body')}>
        <span className="flex flex-none text-content-faint">{cur.icon ?? lead}</span>
        <span id={valueId} className="min-w-0 flex-1 truncate text-left">{cur.label}</span>
        <ChevronDown size={13} strokeWidth={2.2} className={`flex-none text-content-faint transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="listbox" aria-label={label} className="absolute left-0 right-0 top-full z-30 mt-1 flex max-h-[240px] flex-col gap-0.5 overflow-y-auto rounded-[12px] border border-edge-faint bg-surface-card p-1 shadow-dropdown">
          {options.map(o => (
            <button key={o.key} type="button" role="option" aria-selected={o.key === current} onClick={() => { onSelect(o.key); setOpen(false) }}
              className={`flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-left transition-colors hover:bg-surface-hover ${o.key === current ? 'bg-surface-tertiary font-semibold text-content' : 'text-content-secondary'}`}
              style={fs(12.5, 'body')}>
              <span className="flex flex-none text-content-faint">{o.icon}</span>
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
              {o.count != null && <span className="flex-none tabular-nums text-content-faint" style={fs(11)}>{o.count}</span>}
              {o.key === current && <Check size={13} className="flex-none text-content-muted" />}
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
  const searchId = useId()
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
        const merged = await loadSavedPlaces(res.collections.map(c => c.id))
        if (cancelled) return
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

  // The list is every saved place across every collection, which grows without
  // bound. Show a first page and let the rest be asked for.
  const PAGE = 10
  const [shown, setShown] = useState(PAGE)

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

  // Searching or filtering starts a new list; keeping the old offset would drop
  // the user somewhere in the middle of it.
  useEffect(() => { setShown(PAGE) }, [search, listFilter, statusFilter])

  const page = visible.slice(0, shown)
  const remaining = visible.length - page.length

  const listOpts: Opt[] = [
    { key: 'all', label: t('collections.picker.allLists'), icon: <Layers size={13} />, count: places.length },
    ...lists.map(l => ({
      key: l.id,
      label: l.name,
      icon: <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: l.color || '#6366f1' }} />, // theme-lint-disable: the list's own colour, and the default a list without one is drawn in (ListsRail)
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
    // Same 320px as the details column on the other side of the form: two panels
    // of different widths flanking one form read as a mistake rather than a
    // hierarchy, and neither of them is the more important one.
    <aside className={`${SIDE_COLUMN} sm:w-80`}>
      <ColumnHead icon={<Bookmark size={13} strokeWidth={2.2} />}>{t('collections.picker.title')}</ColumnHead>
      <div className="flex flex-none flex-col gap-2 px-3 pb-2.5">
        <EditorField label={t('common.search')} htmlFor={searchId}>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-faint" aria-hidden="true" />
            <input
              id={searchId}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              // Named after what it searches: the form beside it has a search of its own.
              aria-label={t('collections.picker.search')}
              placeholder={t('collections.picker.search')}
              className={`${INPUT} pl-8`}
            />
          </div>
        </EditorField>
        {lists.length > 0 && (
          <div className="relative flex gap-2">
            <FilterDropdown label={t('collections.title')} current={listFilter} options={listOpts} onSelect={k => setListFilter(k as number | 'all')} lead={<Layers size={13} />} />
            <FilterDropdown label={t('mobileCollections.status')} current={statusFilter} options={statusOpts} onSelect={k => setStatusFilter(k as CollectionStatus | 'all')} lead={<Bookmark size={13} />} />
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="px-1">
            <HintCard icon={<Loader2 size={15} className="animate-spin" />}>{t('common.loading')}</HintCard>
          </div>
        ) : visible.length === 0 ? (
          <div className="px-1">
            <HintCard icon={<SearchX size={15} strokeWidth={2} />}>{t('collections.picker.empty')}</HintCard>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {page.map(place => (
              // Built like a row of the planner's places list: the round picture
              // or category disc, the name, and the address on one line under it.
              <button
                key={place.id}
                type="button"
                onClick={() => onSelect(place)}
                className="group flex w-full items-center gap-2.5 rounded-[12px] px-2 py-2 text-left outline-none transition-colors hover:bg-surface-card hover:shadow-sm focus-visible:bg-surface-card focus-visible:ring-2 focus-visible:ring-[color:var(--text-primary)] active:bg-surface-selected"
              >
                <PlaceAvatar place={place} size={34} category={place.category ? { color: place.category.color ?? undefined, icon: place.category.icon ?? undefined } : null} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-semibold leading-tight text-content" style={fs(13, 'body')}>{place.name}</span>
                  {place.address && <span className="mt-0.5 truncate text-content-faint" style={fs(11)}>{place.address}</span>}
                </span>
                {/* What a click does, said the way the planner's rows say it. */}
                <span aria-hidden="true" className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full bg-surface-card text-content-muted opacity-0 shadow-sm ring-1 ring-edge-faint transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
                  <Plus size={13} strokeWidth={2.4} />
                </span>
              </button>
            ))}
            {remaining > 0 && (
              <div className="mt-1.5 px-1">
                <button
                  type="button"
                  onClick={() => setShown(n => n + PAGE)}
                  className={WHITE_BUTTON}
                  style={fs(12, 'body')}
                >
                  {t('collections.picker.showMore', { count: remaining })}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
