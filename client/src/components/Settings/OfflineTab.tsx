/**
 * Offline settings tab (#1135) — controls for:
 *   - Offline mode: a force-offline switch that first downloads everything, then
 *     routes the app to the cache + mutation queue.
 *   - Prepare for offline: an awaited, progress-tracked full download.
 *   - What to store: a map-tiles toggle plus a per-trip on/off.
 *   - Sync conflicts: a keep-mine / keep-theirs resolver and a default strategy.
 *   - Cache stats + clear.
 *
 * All of the logic lives in `useOfflineSettings`, shared with the phone twin
 * `MSettingsOffline`; this file is the desktop markup over it.
 */
import React, { useState } from 'react'
import { RefreshCw, Trash2, Database, CloudOff, Download, Check, GitMerge, Map as MapIcon, AlertTriangle } from 'lucide-react'
import Section from './Section'
import ToggleSwitch from './ToggleSwitch'
import { SettingRow, SettingRows, SettingsHint, StatusPill, SETTINGS_BUTTON, SETTINGS_BUTTON_DANGER } from './settingsKit'
import { useOfflineSettings, offlineNoticeKey, isOfflineNoticeWarning } from './useOfflineSettings'
import { useTranslation } from '../../i18n'
import CustomSelect from '../shared/CustomSelect'
import ConfirmDialog from '../shared/ConfirmDialog'
import { fs } from '../shared/DialogShell'
import type { ConflictStrategy } from '../../sync/offlinePrefs'
import type { QueuedMutation } from '../../db/offlineDb'

const EYEBROW = 'm-0 mb-2 font-geist font-bold uppercase tracking-[.08em] text-content-faint'

function conflictName(m: QueuedMutation): string {
  const body = (m.body ?? {}) as { name?: unknown }
  const server = (m.conflictServer ?? {}) as { name?: unknown }
  return (typeof body.name === 'string' && body.name)
    || (typeof server.name === 'string' && server.name)
    || `#${m.entityId ?? ''}`
}

export default function OfflineTab(): React.ReactElement {
  const { t } = useTranslation()
  const {
    offline, forced,
    rows, allTrips, pendingCount, failedCount, conflicts,
    syncing, clearing, loading, preparing, progress, notice, prefs, canClear,
    runPrepare, handleToggleForce, handleResync, handleClear,
    handleToggleTiles, tripStorageState, handleToggleTrip, resolveConflict,
    handleConflictStrategy,
  } = useOfflineSettings()
  const [confirmClear, setConfirmClear] = useState(false)

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  const progressLabel = progress
    ? `${t(`settings.offline.prepare.phase.${progress.phase === 'done' ? 'trips' : progress.phase}`)} · ${progress.current}/${progress.total}`
    : ''

  return (
    <div>
      {/* Offline mode + prepare */}
      <Section title={t('settings.offline.mode.title')} icon={CloudOff}>
        <SettingRows>
          <SettingRow
            label={t('settings.offline.mode.force')}
            hint={t('settings.offline.mode.forceHint')}
            control={<ToggleSwitch on={forced} onToggle={handleToggleForce} label={t('settings.offline.mode.force')} />}
          >
            {forced && (
              <p className="m-0 rounded-[10px] bg-warning-soft px-3 py-2 text-warning" style={fs(12, 'body')}>
                {t('settings.offline.mode.active')}
              </p>
            )}
          </SettingRow>

          <SettingRow label={t('settings.offline.prepare.title')} hint={t('settings.offline.prepare.hint')} stacked>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button"
                  onClick={runPrepare}
                  disabled={preparing || offline}
                  className={SETTINGS_BUTTON}
                  style={fs(13, 'body')}
                >
                  {preparing
                    ? <RefreshCw size={14} className="animate-spin" />
                    : <Download size={14} />}
                  {preparing ? t('settings.offline.prepare.running') : t('settings.offline.prepare.button')}
                </button>
                <button type="button"
                  onClick={handleResync}
                  disabled={syncing || offline}
                  className={SETTINGS_BUTTON}
                  style={fs(13, 'body')}
                >
                  <RefreshCw size={14} className={syncing ? 'animate-spin' : undefined} />
                  {syncing ? t('settings.offline.resyncing') : t('settings.offline.resync')}
                </button>
              </div>
              {preparing && progress && (
                <div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-tertiary">
                    <div
                      className="h-full rounded-full bg-accent transition-[width] duration-200"
                      style={{ width: `${progress.total ? Math.round((progress.current / progress.total) * 100) : 100}%` }}
                    />
                  </div>
                  <div className="mt-1.5 font-geist tabular-nums text-content-muted" style={fs(11)}>
                    {progressLabel}{progress.label ? ` · ${progress.label}` : ''}
                  </div>
                </div>
              )}
              {!preparing && notice && notice.kind !== 'load-failed' && (
                <div
                  className={`flex items-center gap-1.5 ${isOfflineNoticeWarning(notice) ? 'text-warning' : 'text-success'}`}
                  style={fs(12, 'body')}
                >
                  {isOfflineNoticeWarning(notice) ? <AlertTriangle size={14} className="flex-none" /> : <Check size={14} className="flex-none" />}
                  {t(offlineNoticeKey(notice), notice.kind === 'stored' ? { count: notice.trips } : undefined)}
                </div>
              )}
            </div>
          </SettingRow>
        </SettingRows>
      </Section>

      {/* Conflicts (only when there are any) */}
      {conflicts.length > 0 && (
        <Section
          title={t('settings.offline.conflicts.title')}
          icon={GitMerge}
          badge={<StatusPill tone="danger">{conflicts.length}</StatusPill>}
        >
          <SettingsHint>{t('settings.offline.conflicts.hint')}</SettingsHint>
          <SettingRows>
            {conflicts.map(c => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3.5 py-3">
                <span className="min-w-0 flex-1 basis-48 truncate font-medium text-content" style={fs(13, 'body')}>
                  {t('settings.offline.conflicts.item', { name: conflictName(c) })}
                </span>
                <div className="flex flex-none gap-2">
                  <button type="button" onClick={() => resolveConflict(c.id, true)} className={SETTINGS_BUTTON} style={fs(12.5, 'body')}>
                    {t('settings.offline.conflicts.keepMine')}
                  </button>
                  <button type="button" onClick={() => resolveConflict(c.id, false)} className={SETTINGS_BUTTON} style={fs(12.5, 'body')}>
                    {t('settings.offline.conflicts.keepServer')}
                  </button>
                </div>
              </div>
            ))}
          </SettingRows>
          <SettingRows>
            <SettingRow
              label={t('settings.offline.conflicts.strategyTitle')}
              htmlFor="offline-conflict-strategy"
              control={
                <CustomSelect
                  id="offline-conflict-strategy"
                  value={prefs.conflictStrategy}
                  onChange={v => handleConflictStrategy(v as ConflictStrategy)}
                  options={[
                    { value: 'ask', label: t('settings.offline.conflicts.strategy.ask') },
                    { value: 'mine', label: t('settings.offline.conflicts.strategy.mine') },
                    { value: 'server', label: t('settings.offline.conflicts.strategy.server') },
                  ]}
                  menuFit="content"
                  style={{ minWidth: 240 }}
                />
              }
            />
          </SettingRows>
        </Section>
      )}

      {/* What to store offline */}
      <Section title={t('settings.offline.storage.title')} icon={MapIcon}>
        <SettingRows>
          <SettingRow
            label={t('settings.offline.storage.tiles')}
            hint={t('settings.offline.storage.tilesHint')}
            control={<ToggleSwitch on={prefs.cacheTiles} onToggle={handleToggleTiles} label={t('settings.offline.storage.tiles')} />}
          />
        </SettingRows>
        {allTrips.length > 0 && (
          <div>
            <p className={EYEBROW} style={fs(10)}>{t('settings.offline.storage.tripsTitle')}</p>
            <SettingRows>
              {allTrips.map((trip) => {
                const { on, dateEligible } = tripStorageState(trip)
                return (
                  <div key={trip.id} className="flex items-center justify-between gap-4 px-3.5 py-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-content" style={fs(13, 'body')}>
                        {trip.title}
                      </div>
                      <div className={on ? 'text-success' : 'text-content-faint'} style={fs(11.5)}>
                        {on ? t('settings.offline.storage.tripOn') : t('settings.offline.storage.tripOff')}
                        {!dateEligible && ` · ${t('settings.offline.storage.tripFinished')}`}
                      </div>
                    </div>
                    <ToggleSwitch on={on} onToggle={() => handleToggleTrip(trip)} label={trip.title} />
                  </div>
                )
              })}
            </SettingRows>
          </div>
        )}
      </Section>

      {/* Cache stats + list + clear */}
      <Section
        title={t('settings.offline.cache.title')}
        icon={Database}
        action={
          <button type="button"
            onClick={() => setConfirmClear(true)}
            disabled={clearing || !canClear}
            className={SETTINGS_BUTTON_DANGER}
            style={fs(12.5, 'body')}
          >
            <Trash2 size={14} />
            {t('settings.offline.clear')}
          </button>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t('settings.offline.stats.trips')} value={rows.length} />
          <Stat label={t('settings.offline.stats.pending')} value={pendingCount} />
          {conflicts.length > 0 && <Stat label={t('settings.offline.stats.conflicts')} value={conflicts.length} danger />}
          {failedCount > 0 && <Stat label={t('settings.offline.stats.failed')} value={failedCount} danger />}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-content-faint" style={fs(12, 'body')}>
            <RefreshCw size={13} className="animate-spin" />
            <span>{t('settings.offline.loading')}</span>
          </div>
        ) : rows.length === 0 ? (
          <SettingsHint>
            {t(notice?.kind === 'load-failed' ? 'settings.offline.notice.loadFailed' : 'settings.offline.empty')}
          </SettingsHint>
        ) : (
          <SettingRows>
            {rows.map(({ trip, meta, placeCount, fileCount }) => (
              <div key={trip.id} className="flex items-center justify-between gap-4 px-3.5 py-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-semibold text-content" style={fs(13, 'body')}>
                    {trip.title}
                  </span>
                  <span className="truncate font-geist tabular-nums text-content-faint" style={fs(11.5)}>
                    {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                    {' · '}{placeCount}{' · '}{fileCount}
                  </span>
                </div>
                <span className="flex-none font-geist tabular-nums text-content-muted" style={fs(11.5)}>
                  {meta.lastSyncedAt
                    ? new Date(meta.lastSyncedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </span>
              </div>
            ))}
          </SettingRows>
        )}
      </Section>

      <ConfirmDialog
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => { void handleClear() }}
        title={t('settings.offline.clear')}
        message={t('settings.offline.clearConfirm')}
        confirmLabel={t('settings.offline.clear')}
        danger
      />
    </div>
  )
}

/** One counter tile: the number big, what it counts under it. */
function Stat({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="min-w-0 rounded-[12px] border border-edge-faint bg-surface-card px-3.5 py-3">
      <div className={`font-geist font-bold tabular-nums ${danger ? 'text-danger' : 'text-content'}`} style={fs(20, 'subtitle')}>{value}</div>
      <div className="truncate text-content-faint" style={fs(11.5)}>{label}</div>
    </div>
  )
}
