import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Calendar, Check, ChevronRight, Loader2, MapPin, Map as MapIcon, Search, Sparkles } from 'lucide-react'
import Modal from '../shared/Modal'
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
  if (from && to && to !== from) return `${from} – ${to}`
  return from || to || null
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

  const title = step === 'places' && trip
    ? trip.title
    : step === 'done'
      ? t('collections.importDoneTitle')
      : t('collections.importTitle')

  const footer = step === 'done'
    ? (
      <div className="flex justify-end">
        <button type="button" onClick={onClose} className="px-4 py-1.5 rounded-lg bg-accent text-accent-text text-[13px] font-semibold">{t('common.close')}</button>
      </div>
    )
    : step === 'places'
      ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-content-faint">
            {t('collections.importSelectedCount', { count: selected.size })}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg border border-edge text-content-secondary text-[13px] hover:bg-surface-hover">{t('common.cancel')}</button>
            <button
              type="button"
              onClick={runImport}
              disabled={importing || selected.size === 0}
              className="px-4 py-1.5 rounded-lg bg-accent text-accent-text text-[13px] font-semibold disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {importing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {t('collections.importAction', { count: selected.size })}
            </button>
          </div>
        </div>
      )
      : (
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg border border-edge text-content-secondary text-[13px] hover:bg-surface-hover">{t('common.cancel')}</button>
        </div>
      )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl" footer={footer}>
      <div className="col-imp">
        {/* ── Step 1: which trip ─────────────────────────────────────────── */}
        {step === 'trip' && (
          <>
            <p className="col-imp-lead">{t('collections.importPickTripHint', { name: collectionName })}</p>
            {tripsLoading ? (
              <div className="col-imp-grid">
                {[0, 1, 2, 3].map(i => <div key={i} className="col-imp-trip trek-skeleton" style={{ height: 68 }} />)}
              </div>
            ) : trips.length === 0 ? (
              <div className="col-imp-empty">
                <MapIcon size={22} />
                <span>{t('collections.importNoTrips')}</span>
              </div>
            ) : (
              <div className="col-imp-grid trek-stagger">
                {trips.map(tr => {
                  const range = tripRange(tr, language)
                  const places = tr.place_count ?? 0
                  return (
                    <button key={tr.id} type="button" className="col-imp-trip" onClick={() => pickTrip(tr)}>
                      <span className="col-imp-trip-cover">
                        {tr.cover_image
                          ? <img src={tr.cover_image} alt="" loading="lazy" />
                          : <MapIcon size={16} />}
                      </span>
                      <span className="col-imp-trip-body">
                        <span className="col-imp-trip-name">{tr.title}</span>
                        {/* Badges rather than one run-on line: the tile is half the dialog
                            wide, and a date range plus a place count ran out of room and
                            got clipped mid-word. Each pill can now wrap as a unit. */}
                        <span className="col-imp-trip-meta">
                          {range && (
                            <span className="col-imp-pill" title={range}>
                              <Calendar size={10} />{range}
                            </span>
                          )}
                          <span className="col-imp-pill num" title={t('collections.importPlacesCount', { count: places })}>
                            <MapPin size={10} />{places}
                          </span>
                        </span>
                      </span>
                      <ChevronRight size={16} className="col-imp-trip-go" />
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Step 2: which places ───────────────────────────────────────── */}
        {step === 'places' && (
          <>
            <div className="col-imp-bar">
              <button type="button" className="col-imp-back" onClick={() => setStep('trip')} aria-label={t('common.back')}>
                <ArrowLeft size={15} />
              </button>
              <div className="col-imp-search">
                <Search size={14} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t('collections.importSearchPlaces')}
                  aria-label={t('collections.importSearchPlaces')}
                />
              </div>
              {savedCount > 0 && (
                <button
                  type="button"
                  className={`col-imp-chip${onlyNew ? ' on' : ''}`}
                  aria-pressed={onlyNew}
                  onClick={() => setOnlyNew(v => !v)}
                >
                  <Sparkles size={12} />{t('collections.importOnlyNew')}
                </button>
              )}
              <button
                type="button"
                className="col-imp-chip"
                onClick={toggleAllVisible}
                disabled={selectableVisible.length === 0}
              >
                {allVisibleSelected ? t('collections.importClearSelection') : t('collections.importSelectAll')}
              </button>
            </div>

            {itemsLoading ? (
              <div className="col-imp-list">
                {[0, 1, 2, 3, 4].map(i => <div key={i} className="col-imp-row trek-skeleton" style={{ height: 56 }} />)}
              </div>
            ) : items.length === 0 ? (
              <div className="col-imp-empty">
                <MapPin size={22} />
                <span>{t('collections.importEmptyTrip')}</span>
              </div>
            ) : newCount === 0 ? (
              <div className="col-imp-empty col-imp-empty-good">
                <Check size={22} />
                <span>{t('collections.importNothingNew')}</span>
              </div>
            ) : (
              <div className="col-imp-list trek-stagger">
                {visible.map(p => {
                  const dup = p.already_in_list
                  const on = selected.has(p.place_id)
                  const cat = p.category_id != null ? categoryById.get(p.category_id) : undefined
                  const Icon = getCategoryIcon(cat?.icon ?? undefined)
                  return (
                    <button
                      key={p.place_id}
                      type="button"
                      className={`col-imp-row${on ? ' on' : ''}${dup ? ' dup' : ''}`}
                      onClick={() => !dup && toggle(p.place_id)}
                      disabled={dup}
                      aria-pressed={dup ? undefined : on}
                    >
                      <span className="col-imp-box">{on && <Check size={12} strokeWidth={3} />}</span>
                      <span className="col-imp-ico" style={cat?.color ? { color: cat.color } : undefined}>
                        <Icon size={15} />
                      </span>
                      <span className="col-imp-txt">
                        <span className="nm">{p.name}</span>
                        {p.address && <span className="ad">{p.address}</span>}
                      </span>
                      <span className={`col-imp-tag${dup ? ' saved' : p.scheduled ? '' : ' fresh'}`}>
                        {dup
                          ? t('collections.importAlreadySaved')
                          : p.scheduled
                            ? t('collections.importOnDay', { count: p.day_number ?? 0 })
                            : t('collections.importUnscheduled')}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Step 3: what happened ──────────────────────────────────────── */}
        {step === 'done' && result && (
          <div className="col-imp-done">
            <span className="col-imp-done-ring"><Check size={26} strokeWidth={2.5} /></span>
            <span className="col-imp-done-t">{t('collections.importDone', { count: result.copied })}</span>
            <span className="col-imp-done-s">
              {result.skipped > 0
                ? t('collections.importDoneSkipped', { count: result.skipped })
                : t('collections.importDoneClean', { name: collectionName })}
            </span>
          </div>
        )}
      </div>
    </Modal>
  )
}
