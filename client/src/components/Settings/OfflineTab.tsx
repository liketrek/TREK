/**
 * Offline settings tab (#1135) — controls for:
 *   - Offline mode: a force-offline switch that first downloads everything, then
 *     routes the app to the cache + mutation queue.
 *   - Prepare for offline: an awaited, progress-tracked full download.
 *   - What to store: a map-tiles toggle plus a per-trip on/off.
 *   - Sync conflicts: a keep-mine / keep-theirs resolver and a default strategy.
 *   - Cache stats + clear.
 */
import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Trash2, Database, CloudOff, Download, Check, GitMerge, Map as MapIcon } from 'lucide-react'
import Section from './Section'
import ToggleSwitch from './ToggleSwitch'
import { offlineDb, clearAll, clearTripData } from '../../db/offlineDb'
import { tripsApi } from '../../api/client'
import { tripSyncManager, type PrepareProgress } from '../../sync/tripSyncManager'
import { mutationQueue } from '../../sync/mutationQueue'
import { clearTileCache } from '../../sync/tilePrefetcher'
import { isEffectivelyOffline } from '../../sync/networkMode'
import {
  getOfflinePrefs, setCacheTiles, setConflictStrategy,
  isTripOfflineEnabled, setTripOfflineEnabled, onOfflinePrefsChange,
  type ConflictStrategy,
} from '../../sync/offlinePrefs'
import { useNetworkMode } from '../../hooks/useNetworkMode'
import { useTranslation } from '../../i18n'
import type { SyncMeta, QueuedMutation } from '../../db/offlineDb'
import type { Trip } from '../../types'

interface CachedTripRow {
  trip: Trip
  meta: SyncMeta
  placeCount: number
  fileCount: number
}

function conflictName(m: QueuedMutation): string {
  const body = (m.body ?? {}) as { name?: unknown }
  const server = (m.conflictServer ?? {}) as { name?: unknown }
  return (typeof body.name === 'string' && body.name)
    || (typeof server.name === 'string' && server.name)
    || `#${m.entityId ?? ''}`
}

export default function OfflineTab(): React.ReactElement {
  const { t } = useTranslation()
  const { offline, forced, setForced } = useNetworkMode()
  const [rows, setRows] = useState<CachedTripRow[]>([])
  const [allTrips, setAllTrips] = useState<Trip[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [conflicts, setConflicts] = useState<QueuedMutation[]>([])
  const [syncing, setSyncing] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [preparing, setPreparing] = useState(false)
  const [progress, setProgress] = useState<PrepareProgress | null>(null)
  const [prefs, setPrefs] = useState(getOfflinePrefs())

  useEffect(() => onOfflinePrefsChange(() => setPrefs(getOfflinePrefs())), [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [metas, pending, failed, conflictList] = await Promise.all([
        offlineDb.syncMeta.toArray(),
        mutationQueue.pendingCount(),
        mutationQueue.failedCount(),
        mutationQueue.conflicts(),
      ])
      setPendingCount(pending)
      setFailedCount(failed)
      setConflicts(conflictList)

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

      // The per-trip storage toggles are driven by the FULL trip list, not just
      // the cached ones, so a trip turned off stays visible and re-enableable.
      try {
        const trips = isEffectivelyOffline()
          ? await offlineDb.trips.toArray()
          : await tripsApi.list().then(r => (r as { trips: Trip[] }).trips).catch(() => offlineDb.trips.toArray())
        trips.sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''))
        setAllTrips(trips)
      } catch {
        setAllTrips([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const runPrepare = useCallback(async () => {
    setPreparing(true)
    setProgress(null)
    try {
      await tripSyncManager.prepareForOffline(p => setProgress(p))
      await load()
    } finally {
      setPreparing(false)
    }
  }, [load])

  async function handleToggleForce() {
    if (!forced) {
      // Turning offline mode on: download everything first (while still online),
      // then engage so the app has all it needs before the network drops.
      if (navigator.onLine) await runPrepare()
      setForced(true)
    } else {
      // Back online: lifting the switch flushes the queue + re-syncs (syncTriggers).
      setForced(false)
    }
  }

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
    if (!window.confirm(t('settings.offline.clearConfirm'))) return
    setClearing(true)
    try {
      await clearAll()
      await load()
    } finally {
      setClearing(false)
    }
  }

  async function handleToggleTiles() {
    const next = !prefs.cacheTiles
    setCacheTiles(next)
    // Turning tiles off reclaims the bulk tile storage straight away.
    if (!next) await clearTileCache()
  }

  async function handleToggleTrip(tripId: number) {
    const next = !isTripOfflineEnabled(tripId)
    setTripOfflineEnabled(tripId, next)
    if (!next) {
      await clearTripData(tripId)
      await load()
    } else if (navigator.onLine) {
      tripSyncManager.syncAll().then(load).catch(() => {})
    }
  }

  async function resolveConflict(id: string, keepMine: boolean) {
    if (keepMine) await mutationQueue.resolveKeepMine(id)
    else await mutationQueue.resolveKeepServer(id)
    await load()
  }

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  const progressLabel = progress
    ? `${t(`settings.offline.prepare.phase.${progress.phase === 'done' ? 'trips' : progress.phase}`)} · ${progress.current}/${progress.total}`
    : ''

  return (
    <div>
      {/* Offline mode + prepare */}
      <Section title={t('settings.offline.mode.title')} icon={CloudOff}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Row
            label={t('settings.offline.mode.force')}
            hint={t('settings.offline.mode.forceHint')}
            control={<ToggleSwitch on={forced} onToggle={handleToggleForce} label={t('settings.offline.mode.force')} />}
          />
          {forced && (
            <p className="text-content-muted" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', margin: 0 }}>
              {t('settings.offline.mode.active')}
            </p>
          )}

          <div style={{ borderTop: '1px solid var(--border-secondary, #e5e7eb)', paddingTop: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 'calc(14px * var(--fs-scale-body, 1))', marginBottom: 4 }} className="text-content">
              {t('settings.offline.prepare.title')}
            </div>
            <p className="text-content-muted" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', marginTop: 0, marginBottom: 12 }}>
              {t('settings.offline.prepare.hint')}
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={runPrepare}
                disabled={preparing || offline}
                className="border border-edge bg-surface-secondary text-content"
                style={btnStyle(preparing || offline)}
              >
                {preparing
                  ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Download size={14} />}
                {preparing ? t('settings.offline.prepare.running') : t('settings.offline.prepare.button')}
              </button>
              <button
                onClick={handleResync}
                disabled={syncing || offline}
                className="border border-edge bg-surface-secondary text-content"
                style={btnStyle(syncing || offline)}
              >
                <RefreshCw size={14} style={syncing ? { animation: 'spin 1s linear infinite' } : {}} />
                {syncing ? t('settings.offline.resyncing') : t('settings.offline.resync')}
              </button>
            </div>
            {preparing && progress && (
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--border-primary, #e5e7eb)' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, background: 'var(--accent, #4F46E5)',
                    width: `${progress.total ? Math.round((progress.current / progress.total) * 100) : 100}%`,
                    transition: 'width 0.2s',
                  }} />
                </div>
                <div className="text-content-muted" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', marginTop: 4 }}>
                  {progressLabel}{progress.label ? ` · ${progress.label}` : ''}
                </div>
              </div>
            )}
            {!preparing && progress?.phase === 'done' && (
              <div className="text-content-muted" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'calc(12px * var(--fs-scale-body, 1))', marginTop: 10, color: '#10b981' }}>
                <Check size={14} /> {t('settings.offline.prepare.done')}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Conflicts (only when there are any) */}
      {conflicts.length > 0 && (
        <Section title={t('settings.offline.conflicts.title')} icon={GitMerge}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p className="text-content-muted" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', margin: 0 }}>
              {t('settings.offline.conflicts.hint')}
            </p>
            {conflicts.map(c => (
              <div key={c.id} className="border border-edge bg-surface-secondary" style={{ padding: '10px 14px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span className="text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500 }}>
                  {t('settings.offline.conflicts.item', { name: conflictName(c) })}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => resolveConflict(c.id, true)} className="border border-edge bg-surface-card text-content" style={smallBtnStyle()}>
                    {t('settings.offline.conflicts.keepMine')}
                  </button>
                  <button onClick={() => resolveConflict(c.id, false)} className="border border-edge bg-surface-card text-content" style={smallBtnStyle()}>
                    {t('settings.offline.conflicts.keepServer')}
                  </button>
                </div>
              </div>
            ))}
            <Row
              label={t('settings.offline.conflicts.strategyTitle')}
              control={
                <select
                  value={prefs.conflictStrategy}
                  onChange={e => setConflictStrategy(e.target.value as ConflictStrategy)}
                  className="border border-edge bg-surface-secondary text-content"
                  style={{ padding: '6px 10px', borderRadius: 8, fontSize: 'calc(13px * var(--fs-scale-body, 1))' }}
                >
                  <option value="ask">{t('settings.offline.conflicts.strategy.ask')}</option>
                  <option value="mine">{t('settings.offline.conflicts.strategy.mine')}</option>
                  <option value="server">{t('settings.offline.conflicts.strategy.server')}</option>
                </select>
              }
            />
          </div>
        </Section>
      )}

      {/* What to store offline */}
      <Section title={t('settings.offline.storage.title')} icon={MapIcon}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Row
            label={t('settings.offline.storage.tiles')}
            hint={t('settings.offline.storage.tilesHint')}
            control={<ToggleSwitch on={prefs.cacheTiles} onToggle={handleToggleTiles} label={t('settings.offline.storage.tiles')} />}
          />
          {allTrips.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-secondary, #e5e7eb)', paddingTop: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 'calc(13px * var(--fs-scale-body, 1))', marginBottom: 8 }} className="text-content">
                {t('settings.offline.storage.tripsTitle')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allTrips.map((trip) => {
                  const on = isTripOfflineEnabled(trip.id)
                  return (
                    <div key={trip.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div className="text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {trip.title}
                        </div>
                        <div className="text-content-muted" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))' }}>
                          {on ? t('settings.offline.storage.tripOn') : t('settings.offline.storage.tripOff')}
                        </div>
                      </div>
                      <ToggleSwitch on={on} onToggle={() => handleToggleTrip(trip.id)} label={trip.title} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Cache stats + list + clear */}
      <Section title={t('settings.offline.cache.title')} icon={Database}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Stat label={t('settings.offline.stats.trips')} value={rows.length} />
            <Stat label={t('settings.offline.stats.pending')} value={pendingCount} />
            {conflicts.length > 0 && <Stat label={t('settings.offline.stats.conflicts')} value={conflicts.length} danger />}
            {failedCount > 0 && <Stat label={t('settings.offline.stats.failed')} value={failedCount} danger />}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleClear}
              disabled={clearing || rows.length === 0}
              className="border border-edge bg-surface-secondary text-[#ef4444]"
              style={btnStyle(clearing || rows.length === 0)}
            >
              <Trash2 size={14} />
              {t('settings.offline.clear')}
            </button>
          </div>

          {loading ? (
            <p className="text-content-muted" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))' }}>{t('settings.offline.loading')}</p>
          ) : rows.length === 0 ? (
            <p className="text-content-muted" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))' }}>
              {t('settings.offline.empty')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rows.map(({ trip, meta, placeCount, fileCount }) => (
                <div
                  key={trip.id}
                  className="border border-edge bg-surface-secondary"
                  style={{ padding: '10px 14px', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-content" style={{ fontWeight: 600, fontSize: 'calc(14px * var(--fs-scale-body, 1))' }}>
                      {trip.title}
                    </span>
                    <span className="text-content-muted" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))' }}>
                      {meta.lastSyncedAt
                        ? new Date(meta.lastSyncedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </span>
                  </div>
                  <span className="text-content-muted" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>
                    {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                    {' · '}{placeCount}{' · '}{fileCount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, opacity: disabled ? 0.5 : 1,
  }
}

function smallBtnStyle(): React.CSSProperties {
  return {
    padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
    fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500,
  }
}

function Row({ label, hint, control }: { label: string; hint?: string; control: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
      <div style={{ minWidth: 0 }}>
        <div className="text-content" style={{ fontWeight: 500, fontSize: 'calc(14px * var(--fs-scale-body, 1))' }}>{label}</div>
        {hint && <div className="text-content-muted" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  )
}

function Stat({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="border border-edge bg-surface-secondary" style={{ padding: '8px 14px', borderRadius: 8, minWidth: 100 }}>
      <div style={{ fontSize: 'calc(20px * var(--fs-scale-title, 1))', fontWeight: 700, color: danger ? '#ef4444' : undefined }}
        className={danger ? undefined : 'text-content'}>{value}</div>
      <div className="text-content-muted" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))' }}>{label}</div>
    </div>
  )
}
