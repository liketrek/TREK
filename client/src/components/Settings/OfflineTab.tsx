/**
 * Offline settings tab — shows cached trips, storage info, and controls
 * to re-sync or clear the offline cache.
 */
import React, { useState, useEffect, useCallback } from 'react'
import { Wifi, RefreshCw, Trash2, Database } from 'lucide-react'
import Section from './Section'
import { offlineDb, clearAll } from '../../db/offlineDb'
import { tripSyncManager } from '../../sync/tripSyncManager'
import { mutationQueue } from '../../sync/mutationQueue'
import type { SyncMeta } from '../../db/offlineDb'
import type { Trip } from '../../types'

interface CachedTripRow {
  trip: Trip
  meta: SyncMeta
  placeCount: number
  fileCount: number
}

export default function OfflineTab(): React.ReactElement {
  const [rows, setRows] = useState<CachedTripRow[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [metas, pending, failed] = await Promise.all([
        offlineDb.syncMeta.toArray(),
        mutationQueue.pendingCount(),
        mutationQueue.failedCount(),
      ])
      setPendingCount(pending)
      setFailedCount(failed)

      const result: CachedTripRow[] = []
      for (const meta of metas) {
        const trip = await offlineDb.trips.get(meta.tripId)
        if (!trip) continue
        const [placeCount, fileCount] = await Promise.all([
          offlineDb.places.where('trip_id').equals(meta.tripId).count(),
          offlineDb.tripFiles.where('trip_id').equals(meta.tripId).count(),
        ])
        result.push({ trip, meta, placeCount, fileCount })
      }
      result.sort((a, b) => (a.trip.start_date ?? '').localeCompare(b.trip.start_date ?? ''))
      setRows(result)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleResync() {
    setSyncing(true)
    try {
      await tripSyncManager.syncAll()
      await load()
    } finally {
      setSyncing(false)
    }
  }

  async function handleClear() {
    if (!window.confirm('Clear all offline trip data? You can re-sync anytime while online.')) return
    setClearing(true)
    try {
      await clearAll()
      await load()
    } finally {
      setClearing(false)
    }
  }

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  return (
    <Section title="Offline Cache" icon={Database}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Stat label="Cached trips" value={rows.length} />
          <Stat label="Pending changes" value={pendingCount} />
          {failedCount > 0 && <Stat label="Failed changes" value={failedCount} danger />}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleResync}
            disabled={syncing || !navigator.onLine}
            className="border border-edge bg-surface-secondary text-content"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 8,
              cursor: syncing || !navigator.onLine ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 500, opacity: !navigator.onLine ? 0.5 : 1,
            }}
          >
            <RefreshCw size={14} style={syncing ? { animation: 'spin 1s linear infinite' } : {}} />
            {syncing ? 'Syncing…' : 'Re-sync now'}
          </button>

          <button
            onClick={handleClear}
            disabled={clearing || rows.length === 0}
            className="border border-edge bg-surface-secondary text-[#ef4444]"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 8,
              cursor: clearing || rows.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 500, opacity: rows.length === 0 ? 0.5 : 1,
            }}
          >
            <Trash2 size={14} />
            Clear cache
          </button>
        </div>

        {/* Cached trip list */}
        {loading ? (
          <p className="text-content-muted" style={{ fontSize: 13 }}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-content-muted" style={{ fontSize: 13 }}>
            No trips cached yet. Connect to internet to sync.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map(({ trip, meta, placeCount, fileCount }) => (
              <div
                key={trip.id}
                className="border border-edge bg-surface-secondary"
                style={{
                  padding: '10px 14px', borderRadius: 8,
                  display: 'flex', flexDirection: 'column', gap: 2,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-content" style={{ fontWeight: 600, fontSize: 14 }}>
                    {trip.title}
                  </span>
                  <span className="text-content-muted" style={{ fontSize: 11 }}>
                    <Wifi size={10} style={{ display: 'inline', marginRight: 3 }} />
                    {meta.lastSyncedAt
                      ? new Date(meta.lastSyncedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </span>
                </div>
                <span className="text-content-muted" style={{ fontSize: 12 }}>
                  {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                  {' · '}
                  {placeCount} place{placeCount !== 1 ? 's' : ''}
                  {' · '}
                  {fileCount} file{fileCount !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  )
}

function Stat({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="border border-edge bg-surface-secondary" style={{
      padding: '8px 14px', borderRadius: 8,
      minWidth: 100,
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: danger ? '#ef4444' : undefined }}
        className={danger ? undefined : 'text-content'}>{value}</div>
      <div className="text-content-muted" style={{ fontSize: 11 }}>{label}</div>
    </div>
  )
}
