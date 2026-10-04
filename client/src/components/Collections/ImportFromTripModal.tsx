import React, { useEffect, useId, useMemo, useState } from 'react'
import { ArrowLeft, Calendar, Check, ChevronRight, ListPlus, Loader2, MapPin, Map as MapIcon, Search, Sparkles } from 'lucide-react'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { INPUT } from '../shared/dialogParts'
import { Tooltip } from '../shared/Tooltip'
import { tripsApi } from '../../api/client'
import { collectionsApi } from '../../api/collections'
import { getCategoryIcon } from '../shared/categoryIcons'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { formatDate } from '../../utils/formatters'
import { getApiErrorMessage } from '../../types'
import type { Category, TranslationFn } from '../../types'
import type { CollectionImportablePlace, Trip } from '@trek/shared'

interface ImportFromTripModalProps {
  isOpen: boolean
  collectionId: number
  collectionName: string
  categories: Category[]
  onClose: () => void
  onImported: () => void
  t: TranslationFn
}

type Step = 'trip' | 'places' | 'done'

/** Rows sort new-and-unscheduled first, then the rest of the new ones, and the
 *  already-saved ones last. A trip whose places are mostly saved already then reads
 *  as "here are the two left over" instead of a wall of greyed-out rows. */
function importOrder(p: CollectionImportablePlace): number {
  if (p.already_in_list) return 2
  return p.scheduled ? 1 : 0
}

/** Dates go through the shared formatter, so they follow the reader's locale
 *  (and drop the year when it is the current one) instead of showing raw ISO. */
function tripRange(trip: Trip, locale: string): string | null {
  const from = formatDate(trip.start_date, locale)
  const to = formatDate(trip.end_date, locale)
  if (from && to && to !== from) return `${from} → ${to}`
  return from || to || null
}

/**
 * The toolbar of the places step, pinned to the top of the scrolling body so the
 * search and the filters stay in reach down a long trip. The negative margins
 * let its background cover the body's padding while it is stuck.
 */
const STICKY_BAR = 'sticky top-0 z-10 -mx-6 -mb-3 -mt-5 flex flex-wrap items-center gap-2 bg-surface-card px-6 pb-3 pt-5'
const ROWS = 'flex flex-col gap-0.5 rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5'
/** A small fact on a trip tile; each is its own pill, so a narrow tile wraps between them instead of clipping a word. */
const META_PILL = 'inline-flex min-w-0 max-w-full items-center gap-1 truncate rounded-full bg-surface-tertiary px-1.5 py-px font-semibold tabular-nums text-content-muted'
const CHIP = 'inline-flex flex-none items-center gap-1 rounded-full px-2.5 py-1 font-semibold disabled:cursor-default disabled:opacity-50'
const CHIP_OFF = 'bg-surface-card text-content-muted ring-1 ring-edge-faint hover:text-content'
const CHIP_ON = 'bg-accent text-accent-text'
const TAG = 'flex-none whitespace-nowrap rounded-full px-2 py-[2px] font-semibold tabular-nums'

/** The dashed box a step shows when there is nothing to pick. */
function EmptyState({ icon, good = false, children }: { icon: React.ReactNode; good?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed px-4 py-8 text-center ${good ? 'border-success bg-success-soft text-success' : 'border-edge text-content-faint'}`}
      style={fs(12.5, 'body')}
    >
      {icon}
      <span>{children}</span>
    </div>
  )
}

/**
 * Bulk import of a trip's places into the current list.
 *
 * Two steps: pick a trip, then pick its places. The duplicate verdict comes from
 * the server (`/importable/:tripId`) rather than a second comparison here, so a row
 * shown as new can never come back as skipped. Places no day holds are pre-selected:
 * those are the ones a trip left behind, which is what this import is for.
 */
export default function ImportFromTripModal({ isOpen, collectionId, collectionName, categories, onClose, onImported, t }: ImportFromTripModalProps): React.ReactElement {
  const toast = useToast()
  const { language } = useTranslation()
  const labelId = useId()
  const [step, setStep] = useState<Step>('trip')
  const [trips, setTrips] = useState<Trip[]>([])
  const [tripsLoading, setTripsLoading] = useState(false)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [items, setItems] = useState<CollectionImportablePlace[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [onlyNew, setOnlyNew] = useState(false)
  const [query, setQuery] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ copied: number; skipped: number } | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setStep('trip'); setTrip(null); setItems([]); setSelected(new Set()); setQuery(''); setOnlyNew(false); setResult(null)
    setTripsLoading(true)
    tripsApi.list()
      .then((data: { trips?: Trip[] }) => setTrips(data.trips ?? []))
      .catch(err => toast.error(getApiErrorMessage(err, t('common.error'))))
      .finally(() => setTripsLoading(false))
    // toast/t are stable enough for a mount effect; re-running on them would refetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const pickTrip = async (chosen: Trip) => {
    setTrip(chosen); setStep('places'); setItemsLoading(true); setQuery('')
    try {
      const data = await collectionsApi.importable(collectionId, chosen.id)
      setItems(data.places)
      // Unscheduled places are the point of the import, so they start selected. A trip
      // where everything was scheduled would otherwise open with an empty selection, so
      // fall back to every new place there.
      const fresh = data.places.filter(p => !p.already_in_list)
      const leftovers = fresh.filter(p => !p.scheduled)
      setSelected(new Set((leftovers.length ? leftovers : fresh).map(p => p.place_id)))
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
      setStep('trip')
    } finally {
      setItemsLoading(false)
    }
  }

  const newCount = useMemo(() => items.filter(p => !p.already_in_list).length, [items])
  const savedCount = items.length - newCount

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items
      .filter(p => (onlyNew ? !p.already_in_list : true))
      .filter(p => !q || p.name.toLowerCase().includes(q) || (p.address ?? '').toLowerCase().includes(q))
      .sort((a, b) => importOrder(a) - importOrder(b) || a.name.localeCompare(b.name))
  }, [items, onlyNew, query])

  const selectableVisible = visible.filter(p => !p.already_in_list)
  const allVisibleSelected = selectableVisible.length > 0 && selectableVisible.every(p => selected.has(p.place_id))

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  const toggleAllVisible = () => {
    setSelected(prev => {
      const next = new Set(prev)
      if (allVisibleSelected) selectableVisible.forEach(p => next.delete(p.place_id))
      else selectableVisible.forEach(p => next.add(p.place_id))
      return next
    })
  }

  const runImport = async () => {
    if (!trip || selected.size === 0) return
    setImporting(true)
    try {
      const res = await collectionsApi.saveFromTripMany(collectionId, trip.id, [...selected])
      setResult({ copied: res.copied, skipped: res.skipped.length })
      setStep('done')
      onImported()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setImporting(false)
    }
  }

  const categoryById = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories])

  const tripShown = step === 'places' ? trip : null
  const title = tripShown
    ? tripShown.title
    : step === 'done'
      ? t('collections.importDoneTitle')
      : t('collections.importTitle')

  // The first step says what it is for under the title; the second names the
  // trip, and the dialog's own title moves up to the eyebrow.
  let sub: React.ReactNode
  if (step === 'trip') sub = t('collections.importPickTripHint', { name: collectionName })
  else if (tripShown) sub = tripRange(tripShown, language) ?? undefined

  const header = (
    <DialogHeader
      tile={<DialogTile><ListPlus size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
      tint={NEUTRAL_TINT}
      labelId={labelId}
      onClose={onClose}
      eyebrow={tripShown ? t('collections.importTitle') : undefined}
      title={title}
      sub={sub}
      subWraps={step === 'trip'}
    />
  )

  let footer: React.ReactNode
  if (step === 'done') {
    footer = (
      <DialogFooter>
        <FooterSpacer />
        <DialogButton variant="primary" onClick={onClose}>{t('common.close')}</DialogButton>
      </DialogFooter>
    )
  } else if (step === 'places') {
    footer = (
      <DialogFooter>
        <DialogButton onClick={() => setStep('trip')} icon={<ArrowLeft size={14} strokeWidth={2.2} />}>{t('common.back')}</DialogButton>
        <span className="ml-1 text-content-faint" style={fs(12.5, 'body')}>
          {t('collections.importSelectedCount', { count: selected.size })}
        </span>
        <FooterSpacer />
        <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
        <DialogButton
          variant="primary"
          onClick={() => void runImport()}
          disabled={importing || selected.size === 0}
          icon={importing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={2.2} />}
        >
          {t('collections.importAction', { count: selected.size })}
        </DialogButton>
      </DialogFooter>
    )
  } else {
    footer = (
      <DialogFooter>
        <FooterSpacer />
        <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
      </DialogFooter>
    )
  }

  return (
    // Pinned at the top: the three steps are of very different heights.
    <DialogShell open={!!isOpen} onClose={onClose} labelledBy={labelId} width="editor" align="top" header={header} footer={footer}>
      {/* Step 1: which trip */}
      {step === 'trip' && (
        tripsLoading ? (
          <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
            {[0, 1, 2, 3].map(i => <div key={i} className="trek-skeleton h-[64px] rounded-[14px]" />)}
          </div>
        ) : trips.length === 0 ? (
          <EmptyState icon={<MapIcon size={22} />}>{t('collections.importNoTrips')}</EmptyState>
        ) : (
          <div className="trek-stagger grid grid-cols-2 gap-2 max-sm:grid-cols-1">
            {trips.map(tr => {
              const range = tripRange(tr, language)
              const places = tr.place_count ?? 0
              return (
                <button
                  key={tr.id}
                  type="button"
                  onClick={() => pickTrip(tr)}
                  className="group flex w-full items-center gap-3 rounded-[14px] border border-edge-faint bg-surface-secondary p-2.5 text-left transition-colors hover:bg-surface-card hover:shadow-sm"
                >
                  <span className="grid h-[42px] w-[42px] flex-none place-items-center overflow-hidden rounded-[11px] bg-surface-tertiary text-content-faint">
                    {tr.cover_image
                      ? <img src={tr.cover_image} alt="" loading="lazy" className="h-full w-full object-cover" />
                      : <MapIcon size={16} />}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-semibold text-content" style={fs(13.5, 'body')}>{tr.title}</span>
                    {/* Badges rather than one run-on line: a date range plus a place
                        count ran out of room on a half-width tile and got clipped
                        mid-word. Each pill can now wrap as a unit. */}
                    <span className="flex min-w-0 flex-wrap items-center gap-1" style={fs(10.5)}>
                      {range && (
                        <Tooltip label={range}>
                          <span className={META_PILL}><Calendar size={10} className="flex-none" />{range}</span>
                        </Tooltip>
                      )}
                      <Tooltip label={t('collections.importPlacesCount', { count: places })}>
                        <span className={`${META_PILL} flex-none`}><MapPin size={10} className="flex-none" />{places}</span>
                      </Tooltip>
                    </span>
                  </span>
                  <ChevronRight size={16} className="flex-none text-content-faint transition-transform group-hover:translate-x-0.5 group-hover:text-content-muted" />
                </button>
              )
            })}
          </div>
        )
      )}

      {/* Step 2: which places */}
      {step === 'places' && (
        <>
          <div className={STICKY_BAR}>
            <div className="relative min-w-[150px] flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-faint" aria-hidden="true" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('collections.importSearchPlaces')}
                aria-label={t('collections.importSearchPlaces')}
                className={`${INPUT} pl-8`}
              />
            </div>
            {savedCount > 0 && (
              <button
                type="button"
                className={`${CHIP} ${onlyNew ? CHIP_ON : CHIP_OFF}`}
                style={fs(11.5, 'body')}
                aria-pressed={onlyNew}
                onClick={() => setOnlyNew(v => !v)}
              >
                <Sparkles size={12} />{t('collections.importOnlyNew')}
              </button>
            )}
            <button
              type="button"
              className={`${CHIP} ${CHIP_OFF}`}
              style={fs(11.5, 'body')}
              onClick={toggleAllVisible}
              disabled={selectableVisible.length === 0}
            >
              {allVisibleSelected ? t('collections.importClearSelection') : t('collections.importSelectAll')}
            </button>
          </div>

          {itemsLoading ? (
            <div className={ROWS}>
              {[0, 1, 2, 3, 4].map(i => <div key={i} className="trek-skeleton h-12 rounded-[10px]" />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={<MapPin size={22} />}>{t('collections.importEmptyTrip')}</EmptyState>
          ) : newCount === 0 ? (
            <EmptyState icon={<Check size={22} />} good>{t('collections.importNothingNew')}</EmptyState>
          ) : (
            <div className={`${ROWS} trek-stagger`}>
              {visible.map(p => {
                const dup = p.already_in_list
                const on = selected.has(p.place_id)
                const cat = p.category_id != null ? categoryById.get(p.category_id) : undefined
                const Icon = getCategoryIcon(cat?.icon ?? undefined)
                let tag: React.ReactNode
                if (dup) tag = <span className={`${TAG} text-content-faint`} style={fs(10.5)}>{t('collections.importAlreadySaved')}</span>
                else if (p.scheduled) tag = <span className={`${TAG} bg-surface-tertiary text-content-muted`} style={fs(10.5)}>{t('collections.importOnDay', { count: p.day_number ?? 0 })}</span>
                else tag = <span className={`${TAG} bg-accent-subtle text-accent-on`} style={fs(10.5)}>{t('collections.importUnscheduled')}</span>
                return (
                  <button
                    key={p.place_id}
                    type="button"
                    onClick={() => !dup && toggle(p.place_id)}
                    disabled={dup}
                    aria-pressed={dup ? undefined : on}
                    className={`flex min-h-[48px] w-full items-center gap-3 rounded-[10px] px-2.5 py-1.5 text-left disabled:cursor-default disabled:opacity-50 ${on ? 'bg-surface-card shadow-sm' : 'enabled:hover:bg-surface-card'}`}
                  >
                    <span className={`grid h-4 w-4 flex-none place-items-center rounded-[5px] ${dup ? 'invisible' : on ? 'bg-accent text-accent-text' : 'border-[1.5px] border-edge'}`}>
                      {on && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span className="grid h-7 w-7 flex-none place-items-center rounded-[9px] bg-surface-tertiary text-content-muted" style={cat?.color ? { color: cat.color } : undefined}>
                      <Icon size={15} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-semibold text-content" style={fs(13, 'body')}>{p.name}</span>
                      {p.address && <span className="truncate text-content-faint" style={fs(11)}>{p.address}</span>}
                    </span>
                    {tag}
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Step 3: what happened */}
      {step === 'done' && result && (
        <div className="flex flex-col items-center gap-2.5 px-4 pb-4 pt-6 text-center">
          <span className="trek-popover-enter grid h-[60px] w-[60px] place-items-center rounded-full bg-success-soft text-success">
            <Check size={26} strokeWidth={2.5} />
          </span>
          <span className="font-bold text-content" style={fs(15, 'subtitle')}>{t('collections.importDone', { count: result.copied })}</span>
          <span className="max-w-[320px] leading-normal text-content-faint" style={fs(12.5, 'body')}>
            {result.skipped > 0
              ? t('collections.importDoneSkipped', { count: result.skipped })
              : t('collections.importDoneClean', { name: collectionName })}
          </span>
        </div>
      )}
    </DialogShell>
  )
}
