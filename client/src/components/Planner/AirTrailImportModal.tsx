import React from 'react'
import ReactDOM from 'react-dom'
import { useState, useRef, useEffect, useMemo } from 'react'
import { Plane, X, Check } from 'lucide-react'
import type { AirtrailFlight, AirtrailImportResult } from '@trek/shared'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { airtrailApi, reservationsApi } from '../../api/client'
import { useTripStore } from '../../store/tripStore'

interface AirTrailImportModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: number
  pushUndo?: (label: string, undoFn: () => Promise<void> | void) => void
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

  // AirTrail flight ids already linked to a reservation in this trip.
  const importedIds = useMemo(() => {
    const set = new Set<string>()
    for (const r of reservations) {
      if (r.external_source === 'airtrail' && r.external_id) set.add(String(r.external_id))
    }
    return set
  }, [reservations])

  const inRange = (f: AirtrailFlight): boolean =>
    !!(f.date && trip?.start_date && trip?.end_date && f.date >= trip.start_date && f.date <= trip.end_date)

  useEffect(() => {
    if (!isOpen) return
    setError('')
    setSelected(new Set())
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

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleClose = () => { onClose() }

  const handleImport = async () => {
    const ids = [...selected].filter(id => !importedIds.has(id))
    if (ids.length === 0 || importing) return
    setImporting(true)
    setError('')
    try {
      const result: AirtrailImportResult = await airtrailApi.import(tripId, ids)
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
          <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
          <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>
            {f.fromCode ?? f.fromName ?? '?'} → {f.toCode ?? f.toName ?? '?'}{f.date ? ` · ${fmtDate(f.date, locale)}` : ''}
          </span>
        </span>
        {already && (
          <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 600, color: 'var(--text-faint)' }}>
            {t('reservations.airtrail.alreadyImported')}
          </span>
        )}
      </button>
    )
  }

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
          <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            {t('reservations.airtrail.title')}
          </div>
          <button onClick={handleClose} className="bg-transparent text-content-faint" style={{ border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {loading && (
            <div className="text-content-faint" style={{ fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              {t('common.loading')}
            </div>
          )}

          {!loading && flights.length === 0 && !error && (
            <div className="text-content-faint" style={{ fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              {t('reservations.airtrail.empty')}
            </div>
          )}

          {!loading && during.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 8px' }}>
                {t('reservations.airtrail.duringTrip')}
              </div>
              {during.map(renderFlight)}
            </>
          )}

          {!loading && others.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', margin: `${during.length > 0 ? 14 : 2}px 0 8px` }}>
                {t('reservations.airtrail.otherFlights')}
              </div>
              {others.map(renderFlight)}
            </>
          )}

          {error && (
            <div className="bg-[rgba(239,68,68,0.08)] text-[#b91c1c]" style={{ border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10, padding: '8px 10px', fontSize: 12, whiteSpace: 'pre-wrap', marginTop: 8 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-faint)' }}>
          <button
            onClick={handleClose}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-primary)', background: 'none', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleImport}
            disabled={selectableCount === 0 || importing}
            className={selectableCount > 0 && !importing ? 'bg-accent text-accent-text' : 'bg-surface-tertiary text-content-faint'}
            style={{ padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 500, cursor: selectableCount > 0 && !importing ? 'pointer' : 'default', fontFamily: 'inherit' }}
          >
            {importing ? t('common.loading') : t('reservations.airtrail.importCta', { count: selectableCount })}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
