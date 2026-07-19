import React from 'react'
import ReactDOM from 'react-dom'
import { useState, useRef, useEffect, useMemo } from 'react'
import { Plane, X, Check } from 'lucide-react'
import type { AirtrailFlight, AirtrailImportResult } from '@trek/shared'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { airtrailApi, reservationsApi } from '../../api/client'
import { useTripStore } from '../../store/tripStore'
import { parseReservationMetadata } from '../../utils/flightLegs'

interface AirTrailImportModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: number
  pushUndo?: (label: string, undoFn: () => Promise<void> | void) => void
}

/**
 * Ordered chains of connecting flights — each arrives where the next departs,
 * onward within 24 h — that the picker offers to import as ONE multi-leg
 * booking with the connection as a layover stop (#1535). A flight landing back
 * at the chain's origin is a return, not a connection, so a same-day
 * out-and-back never gets a join offer. Same rules the server re-validates
 * with.
 */
export function detectConnections(flights: AirtrailFlight[]): AirtrailFlight[][] {
  const sorted = flights
    .filter(f => f.departure && f.arrival && f.fromCode && f.toCode)
    .sort((a, b) => Date.parse(a.departure!) - Date.parse(b.departure!))
  const chains: AirtrailFlight[][] = []
  let chain: AirtrailFlight[] = []
  for (const f of sorted) {
    const prev = chain[chain.length - 1]
    if (prev) {
      const gap = Date.parse(f.departure!) - Date.parse(prev.arrival!)
      if (
        prev.toCode!.toUpperCase() === f.fromCode!.toUpperCase() &&
        f.toCode!.toUpperCase() !== chain[0].fromCode!.toUpperCase() &&
        gap >= 0 && gap <= 24 * 3600 * 1000
      ) {
        chain.push(f)
        continue
      }
    }
    if (chain.length > 1) chains.push(chain)
    chain = [f]
  }
  if (chain.length > 1) chains.push(chain)
  return chains
}

/** Locale-aware date (e.g. de → 13.06.2026, en-US → 06/13/2026). */
function fmtDate(d: string | null, locale: string): string {
  if (!d) return ''
  try {
    return new Date(d + 'T00:00:00Z').toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    })
  } catch {
    return d
  }
}

export default function AirTrailImportModal({ isOpen, onClose, tripId, pushUndo }: AirTrailImportModalProps) {
  const { t, locale } = useTranslation()
  const toast = useToast()
  const trip = useTripStore(s => s.trip)
  const reservations = useTripStore(s => s.reservations)
  const loadReservations = useTripStore(s => s.loadReservations)
  const mouseDownTarget = useRef<EventTarget | null>(null)

  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [flights, setFlights] = useState<AirtrailFlight[]>([])
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  // AirTrail flight ids already linked to a reservation in this trip. A joined
  // multi-leg import carries only its first leg in external_id — the other legs
  // sit in metadata.airtrail_ids (#1535).
  const importedIds = useMemo(() => {
    const set = new Set<string>()
    for (const r of reservations) {
      if (r.external_source !== 'airtrail') continue
      if (r.external_id) set.add(String(r.external_id))
      const ids = parseReservationMetadata(r).airtrail_ids
      if (Array.isArray(ids)) for (const id of ids) set.add(String(id))
    }
    return set
  }, [reservations])

  const inRange = (f: AirtrailFlight): boolean =>
    !!(f.date && trip?.start_date && trip?.end_date && f.date >= trip.start_date && f.date <= trip.end_date)

  // Detected connection chains that can still be joined. Already-imported
  // flights are excluded BEFORE detection so a surviving sub-chain (e.g. the
  // first two legs when the third was imported earlier) still gets its offer.
  // Joining is on by default; joinOff remembers the chains the user opted out of.
  const chains = useMemo(
    () => detectConnections(flights.filter(f => !importedIds.has(f.id))),
    [flights, importedIds],
  )
  const chainKey = (chain: AirtrailFlight[]) => chain.map(f => f.id).join('+')
  const chainOf = useMemo(() => {
    const map = new Map<string, AirtrailFlight[]>()
    for (const chain of chains) for (const f of chain) map.set(f.id, chain)
    return map
  }, [chains])
  const [joinOff, setJoinOff] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (!isOpen) return
    setError('')
    setSelected(new Set())
    setJoinOff(new Set())
    setLoading(true)
    airtrailApi
      .flights()
      .then((d: { flights: AirtrailFlight[] }) => {
        const list = d.flights ?? []
        setFlights(list)
        // Pre-select the flights that fall inside the trip and aren't imported yet.
        const pre = new Set<string>()
        for (const f of list) if (inRange(f) && !importedIds.has(f.id)) pre.add(f.id)
        setSelected(pre)
      })
      .catch((err: any) => setError(err?.response?.data?.error ?? t('reservations.airtrail.loadError')))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const { during, others } = useMemo(() => {
    const during: AirtrailFlight[] = []
    const others: AirtrailFlight[] = []
    for (const f of flights) (inRange(f) ? during : others).push(f)
    const byDateDesc = (a: AirtrailFlight, b: AirtrailFlight) => (b.date ?? '').localeCompare(a.date ?? '')
    return { during: during.sort(byDateDesc), others: others.sort(byDateDesc) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flights, trip?.start_date, trip?.end_date])

  // A chain renders once as a group, at the position of its first listed leg —
  // its other legs are swallowed wherever else they would appear. Computed per
  // section up front so a chain straddling the trip range can't leave the other
  // section holding nothing but its header.
  const sectionItems = useMemo(() => {
    const rendered = new Set<string>()
    const build = (list: AirtrailFlight[]) =>
      list.flatMap((f): Array<{ key: string; chain?: AirtrailFlight[]; flight?: AirtrailFlight }> => {
        const chain = chainOf.get(f.id)
        if (!chain) return [{ key: f.id, flight: f }]
        const key = chain.map(c => c.id).join('+')
        if (rendered.has(key)) return []
        rendered.add(key)
        return [{ key, chain }]
      })
    return { during: build(during), others: build(others) }
  }, [during, others, chainOf])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const chainJoined = (chain: AirtrailFlight[]) =>
    !joinOff.has(chainKey(chain)) && chain.every(f => selected.has(f.id))

  const toggleJoin = (chain: AirtrailFlight[]) => {
    const key = chainKey(chain)
    if (chainJoined(chain)) {
      setJoinOff(prev => new Set(prev).add(key))
    } else {
      // Turning the join on implies wanting all of its legs.
      setJoinOff(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
      setSelected(prev => {
        const next = new Set(prev)
        for (const f of chain) next.add(f.id)
        return next
      })
    }
  }

  const handleClose = () => { onClose() }

  const handleImport = async () => {
    const ids = [...selected].filter(id => !importedIds.has(id))
    if (ids.length === 0 || importing) return
    setImporting(true)
    setError('')
    try {
      const connections = chains.filter(chainJoined).map(chain => chain.map(f => f.id))
      const result: AirtrailImportResult = await airtrailApi.import(tripId, ids, connections)
      await loadReservations(tripId)

      const imported = result.imported ?? []
      if (imported.length > 0) {
        pushUndo?.(t('reservations.airtrail.undo'), async () => {
          const linked = useTripStore.getState().reservations.filter(
            r => r.external_source === 'airtrail' && r.external_id && imported.includes(String(r.external_id)),
          )
          await Promise.all(linked.map(r => reservationsApi.delete(tripId, r.id).catch(() => {})))
          await loadReservations(tripId)
        })
        toast.success(t('reservations.airtrail.imported', { count: imported.length }))
      }

      const skippedInTrip = (result.skipped ?? []).filter(s => s.reason === 'already-in-trip').length
      if (skippedInTrip > 0) toast.warning(t('reservations.airtrail.skippedDuplicate', { count: skippedInTrip }))
      if (imported.length === 0 && skippedInTrip === 0) toast.warning(t('reservations.airtrail.nothingImported'))

      handleClose()
    } catch (err: any) {
      setError(err?.response?.data?.error ?? t('reservations.airtrail.importError'))
    } finally {
      setImporting(false)
    }
  }

  const selectableCount = [...selected].filter(id => !importedIds.has(id)).length

  if (!isOpen) return null

  const renderFlight = (f: AirtrailFlight) => {
    const already = importedIds.has(f.id)
    const isSelected = selected.has(f.id)
    const label = f.flightNumber ? `${f.airline ? `${f.airline} ` : ''}${f.flightNumber}` : `${f.fromCode ?? '?'} → ${f.toCode ?? '?'}`
    return (
      <button
        key={f.id}
        onClick={() => !already && toggle(f.id)}
        disabled={already}
        className={already ? 'bg-surface-tertiary' : isSelected ? 'bg-surface-secondary' : 'bg-transparent'}
        style={{
          width: '100%', textAlign: 'left', borderRadius: 10, padding: '10px 12px', marginBottom: 8,
          border: `1px solid ${isSelected && !already ? 'var(--accent)' : 'var(--border-primary)'}`,
          opacity: already ? 0.55 : 1, cursor: already ? 'default' : 'pointer',
          display: 'flex', gap: 10, alignItems: 'center', fontFamily: 'inherit',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <span style={{
          flexShrink: 0, width: 18, height: 18, borderRadius: 5,
          border: `1.5px solid ${isSelected || already ? 'var(--accent)' : 'var(--border-primary)'}`,
          background: isSelected || already ? 'var(--accent)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {(isSelected || already) && <Check size={12} color="var(--accent-text)" strokeWidth={3} />}
        </span>
        <Plane size={15} color="#3b82f6" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
          <span style={{ display: 'block', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-muted)' }}>
            {f.fromCode ?? f.fromName ?? '?'} → {f.toCode ?? f.toName ?? '?'}{f.date ? ` · ${fmtDate(f.date, locale)}` : ''}
          </span>
        </span>
        {already && (
          <span style={{ flexShrink: 0, fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-faint)' }}>
            {t('reservations.airtrail.alreadyImported')}
          </span>
        )}
      </button>
    )
  }

  const renderChain = (chain: AirtrailFlight[]) => {
    const joined = chainJoined(chain)
    const stops = chain.slice(0, -1).map(f => f.toCode ?? f.toName ?? '?').join(', ')
    return (
      <div key={chainKey(chain)} style={{ border: '1px solid var(--border-primary)', borderRadius: 12, padding: '8px 8px 0', marginBottom: 8 }}>
        {chain.map(renderFlight)}
        <button
          onClick={() => toggleJoin(chain)}
          className="bg-transparent"
          style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
            border: 'none', borderTop: '1px solid var(--border-faint)', borderRadius: 0,
            padding: '9px 4px 10px', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <span style={{
            flexShrink: 0, width: 16, height: 16, borderRadius: 5,
            border: `1.5px solid ${joined ? 'var(--accent)' : 'var(--border-primary)'}`,
            background: joined ? 'var(--accent)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {joined && <Check size={11} color="var(--accent-text)" strokeWidth={3} />}
          </span>
          <span style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'var(--text-primary)' }}>
            {t('reservations.airtrail.joinConnection', { stops })}
          </span>
        </button>
      </div>
    )
  }

  const renderItem = (item: { chain?: AirtrailFlight[]; flight?: AirtrailFlight }) =>
    item.chain ? renderChain(item.chain) : renderFlight(item.flight!)

  return ReactDOM.createPortal(
    <div
      className="bg-[rgba(0,0,0,0.4)]"
      style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onMouseDown={e => { mouseDownTarget.current = e.target }}
      onClick={e => {
        if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) handleClose()
        mouseDownTarget.current = null
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-surface-card"
        style={{ borderRadius: 16, width: '100%', maxWidth: 540, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', fontFamily: 'var(--font-system)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Plane size={16} color="#3b82f6" />
          <div style={{ flex: 1, fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 700, color: 'var(--text-primary)' }}>
            {t('reservations.airtrail.title')}
          </div>
          <button onClick={handleClose} className="bg-transparent text-content-faint" style={{ border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {loading && (
            <div className="text-content-faint" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', textAlign: 'center', padding: '24px 0' }}>
              {t('common.loading')}
            </div>
          )}

          {!loading && flights.length === 0 && !error && (
            <div className="text-content-faint" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', textAlign: 'center', padding: '24px 0' }}>
              {t('reservations.airtrail.empty')}
            </div>
          )}

          {!loading && sectionItems.during.length > 0 && (
            <>
              <div style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 8px' }}>
                {t('reservations.airtrail.duringTrip')}
              </div>
              {sectionItems.during.map(renderItem)}
            </>
          )}

          {!loading && sectionItems.others.length > 0 && (
            <>
              <div style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 700, color: 'var(--text-faint)', margin: `${sectionItems.during.length > 0 ? 14 : 2}px 0 8px` }}>
                {t('reservations.airtrail.otherFlights')}
              </div>
              {sectionItems.others.map(renderItem)}
            </>
          )}

          {error && (
            <div className="bg-[rgba(239,68,68,0.08)] text-[#b91c1c]" style={{ border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10, padding: '8px 10px', fontSize: 'calc(12px * var(--fs-scale-body, 1))', whiteSpace: 'pre-wrap', marginTop: 8 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-faint)' }}>
          <button
            onClick={handleClose}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-primary)', background: 'none', color: 'var(--text-primary)', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleImport}
            disabled={selectableCount === 0 || importing}
            className={selectableCount > 0 && !importing ? 'bg-accent text-accent-text' : 'bg-surface-tertiary text-content-faint'}
            style={{ padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, cursor: selectableCount > 0 && !importing ? 'pointer' : 'default', fontFamily: 'inherit' }}
          >
            {importing ? t('common.loading') : t('reservations.airtrail.importCta', { count: selectableCount })}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
