import React, { useId } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  Check,
  CheckCircle2,
  Cloud,
  Copy,
  FolderTree,
  HardDrive,
  Loader2,
  Lock,
  Pencil,
  PlugZap,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { STORAGE_CATEGORIES, type StorageTestResponse } from '@trek/shared'
import { useTranslation } from '../../../i18n'
import { formatBytes } from '../../../utils/formatBytes'
import { relativeTime } from '../../../utils/relativeTime'
import ConfirmDialog from '../../shared/ConfirmDialog'
import CustomSelect from '../../shared/CustomSelect'
import { Tooltip } from '../../shared/Tooltip'
import { NEUTRAL_TINT, fs } from '../../shared/DialogShell'
import Section from '../../Settings/Section'
import {
  SETTINGS_BUTTON,
  SETTINGS_BUTTON_PRIMARY,
  SETTINGS_ICON_BUTTON,
  SettingRows,
  SettingsHint,
  StatusPill,
} from '../../Settings/settingsKit'
import BackendForm from './BackendForm'
import { CACHE_CATEGORIES, mirrorProbeTargets, primaryNameOf } from './storageModel'
import { categoryNames, migrationPromptLine, useStoragePanel } from './useStoragePanel'

/** The compact buttons of a backend row: white on a hairline, a size under the card's own. */
const ROW_BUTTON = 'inline-flex items-center gap-1.5 rounded-[10px] bg-surface-card px-2.5 py-1.5 font-medium text-content shadow-sm ring-1 ring-edge-faint hover:bg-surface-secondary disabled:cursor-default disabled:opacity-50'
const ROW_BUTTON_PRIMARY = 'inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-2.5 py-1.5 font-medium text-accent-text hover:opacity-90 disabled:cursor-default disabled:opacity-50'
/** The icon square on the left of a row. */
const TILE = 'grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-surface-tertiary text-content-muted'
/** What a row says under its head line, lined up with the name rather than the tile. */
const DETAILS = 'mt-2 flex flex-col items-start gap-1.5 empty:hidden sm:ps-12'
const META = 'm-0 leading-snug text-content-faint'

const TYPE_ICON: Record<string, LucideIcon> = { local: HardDrive, s3: Cloud, mirror: Copy }

function TestResult({ result, failedLabel, okLabel }: {
  result: StorageTestResponse | undefined
  failedLabel: string
  okLabel: string
}): React.ReactElement | null {
  if (result === undefined) return null
  return (
    <div className="flex flex-col items-start gap-1">
      <StatusPill
        tone={result.ok ? 'success' : 'danger'}
        icon={result.ok ? <Check size={10} strokeWidth={2.6} /> : <X size={10} strokeWidth={2.6} />}
      >
        {result.ok ? okLabel : failedLabel}
      </StatusPill>
      {result.targets.map((target) => (
        <p key={target.name} className="m-0 flex min-w-0 items-start gap-1.5 text-content-faint" style={fs(11.5)}>
          {target.ok
            ? <Check size={12} strokeWidth={2.4} className="mt-[1px] flex-none text-success" />
            : <X size={12} strokeWidth={2.4} className="mt-[1px] flex-none text-danger" />}
          <span className="min-w-0 break-words">
            <span className="font-geist font-semibold text-content-secondary">{target.name}</span>
            {target.error ? ` — ${target.error}` : ''}
          </span>
        </p>
      ))}
    </div>
  )
}

/** A thin bar for a running sync or move. */
function Progress({ done, total }: { done: number; total: number }): React.ReactElement {
  const share = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0
  return (
    <div className="h-1.5 w-full max-w-[280px] overflow-hidden rounded-full bg-surface-tertiary" aria-hidden="true">
      <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${share}%` }} />
    </div>
  )
}

export default function AdminStoragePanel(): React.ReactElement {
  const { t, locale } = useTranslation()
  const {
    admin, editing, setEditing, confirmRemove, setConfirmRemove, syncPrompt, setSyncPrompt, migratePrompt,
    closeMigratePrompt, migrationQueue, handleCancelMigration, handleRefreshStats, handleStartBackfill, handleCancelBackfill, loaded,
  } = useStoragePanel()
  // Open/closed only: the render below and moveAndSave both recompute
  // computeMigrationCandidates(draft, state) fresh rather than reading the
  // candidates the prompt opened with, which go stale the moment the operator
  // edits a category while the dialog is open.
  const migratePromptOpen = migratePrompt !== null
  const migrateTitleId = useId()

  if (admin.loading) {
    return (
      <div className="flex items-center gap-2 px-1 py-4 text-content-faint" style={fs(12.5, 'body')}>
        <Loader2 size={15} className="animate-spin" />
        {t('storage.loading')}
      </div>
    )
  }
  if (!loaded) {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-2xl border border-edge-faint bg-danger-soft px-4 py-3">
        <AlertTriangle size={16} strokeWidth={2.2} className="mt-0.5 flex-none text-danger" />
        <p className="m-0 min-w-0 flex-1 break-words leading-normal text-content" style={fs(13, 'body')}>
          {admin.loadError || t('common.error')}
        </p>
      </div>
    )
  }
  const {
    state, draft, migrationCandidates, backendNames, rows, degenerate, effective, usageSums, startAdd, startEdit,
    commitBackend, removeMessage, confirmRemoval, setCategory, save, moveAndSave, routeOnlySave,
  } = loaded

  const testResultFor = (key: string): StorageTestResponse | 'running' | undefined => admin.testResults[key]

  return (
    <div className="flex flex-col">
      {state.configError && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-edge-faint bg-warning-soft px-4 py-3">
          <AlertTriangle size={16} strokeWidth={2.2} className="mt-0.5 flex-none text-warning" />
          <p role="alert" className="m-0 min-w-0 flex-1 break-words leading-normal text-content" style={fs(13, 'body')}>
            {t('storage.configError.banner', { error: state.configError })}
          </p>
        </div>
      )}

      <Section title={t('storage.health.title')} icon={Activity}>
        {state.health.replicaFailures.length === 0 ? (
          <p className="m-0 flex items-center gap-2 text-content-muted" style={fs(12.5, 'body')}>
            <CheckCircle2 size={15} strokeWidth={2.2} className="flex-none text-success" />
            {t('storage.health.allClear')}
          </p>
        ) : (
          <SettingRows>
            {state.health.replicaFailures.map((failure) => (
              <div key={`${failure.backend}-${failure.key}-${failure.at}`} className="flex items-start gap-2.5 px-3.5 py-2.5">
                <AlertTriangle size={14} strokeWidth={2.2} className="mt-0.5 flex-none text-danger" />
                <p className="m-0 min-w-0 flex-1 break-words leading-snug text-content" style={fs(12.5, 'body')}>
                  <span>
                    {t('storage.health.failureLine', {
                      op: failure.op,
                      key: failure.key,
                      backend: failure.backend,
                      error: failure.error,
                    })}
                  </span>
                  <span className="whitespace-nowrap text-content-faint"> · {relativeTime(failure.at, locale)}</span>
                </p>
              </div>
            ))}
          </SettingRows>
        )}
        {state.seedFilePresent && <SettingsHint>{t('storage.health.seedFile')}</SettingsHint>}
      </Section>

      <Section
        title={t('storage.backends.title')}
        icon={HardDrive}
        hint={t('storage.description')}
        action={
          editing ? undefined : (
            <button type="button"
              onClick={startAdd}
              className={SETTINGS_BUTTON}
              style={fs(12.5, 'body')}
            >
              <Plus size={14} strokeWidth={2.2} />
              {t('storage.backends.add')}
            </button>
          )
        }
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="m-0 min-w-0 flex-1 text-content-faint" style={fs(11.5)}>
            {state.usage
              ? t('storage.usage.computed', { age: relativeTime(state.usage.computedAt, locale) })
              : t('storage.usage.never')}
          </p>
          <button type="button" className={ROW_BUTTON} style={fs(12, 'body')} onClick={handleRefreshStats}>
            <RefreshCw size={13} strokeWidth={2.2} />
            {state.usage ? t('storage.usage.refresh') : t('storage.usage.compute')}
          </button>
        </div>

        <SettingRows>
          {rows.map((row) => {
            const resultKey = row.mirrorName ?? row.name
            const result = testResultFor(resultKey)
            // row.mirrorName only exists when foldBackends adopted a draft mirror
            // for this row, so the draft lookup below cannot miss.
            const testCandidate = row.mirrorName
              ? draft.backends.find((b) => b.name === row.mirrorName)!
              : row.backend
            const rowUsage = usageSums?.[row.name]
            const backfill = row.mirrorName ? state.backfills.find((b) => b.backend === row.mirrorName) : undefined
            const TypeIcon = TYPE_ICON[row.type] ?? HardDrive
            return (
              <div key={row.name} data-testid={`storage-backend-${row.name}`} className="px-3.5 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className={TILE}>
                    <TypeIcon size={15} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1 basis-48">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span className="min-w-0 truncate font-geist font-semibold text-content" style={fs(13.5, 'body')}>{row.name}</span>
                      <StatusPill>{t(`storage.type.${row.type}`)}</StatusPill>
                      <StatusPill icon={row.source === 'env' ? <Lock size={10} strokeWidth={2.4} /> : undefined}>
                        {t(`storage.source.${row.source}`)}
                      </StatusPill>
                    </div>
                    <p className="m-0 mt-0.5 text-content-faint" style={fs(11.5)}>
                      {row.categories.length > 0
                        ? t('storage.backends.usedBy', { categories: categoryNames(t, row.categories) })
                        : t('storage.backends.unused')}
                    </p>
                  </div>
                  <div className="flex flex-none items-center gap-1.5">
                    <button type="button"
                      className={ROW_BUTTON}
                      style={fs(12, 'body')}
                      onClick={() =>
                        row.mirrorName
                          ? admin.testMirror(resultKey, mirrorProbeTargets(draft, state, testCandidate))
                          : admin.test(testCandidate)
                      }
                    >
                      <PlugZap size={13} strokeWidth={2.2} />
                      {t('storage.actions.test')}
                    </button>
                    {row.source !== 'env' && (
                      <Tooltip label={t('storage.actions.edit')}>
                        <button type="button" aria-label={t('storage.actions.edit')} className={SETTINGS_ICON_BUTTON} onClick={() => startEdit(row)}>
                          <Pencil size={14} strokeWidth={2} />
                        </button>
                      </Tooltip>
                    )}
                    {row.source === 'settings' && (
                      <Tooltip label={t('storage.actions.remove')}>
                        <button type="button" aria-label={t('storage.actions.remove')} className={`${SETTINGS_ICON_BUTTON} hover:!text-danger`} onClick={() => setConfirmRemove({ name: row.name, degenerate: false })}>
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </div>

                <div className={DETAILS}>
                  {rowUsage && (
                    <p className={`${META} font-geist tabular-nums`} style={fs(11.5)}>
                      {t('storage.usage.line', { count: rowUsage.objects, size: formatBytes(rowUsage.bytes) })}
                      {row.name === 'uploads-local' && state.usage!.legacyPhotos.objects > 0
                        ? ` (${t('storage.usage.legacyNote')})`
                        : ''}
                    </p>
                  )}
                  {row.mirrorTargets.length > 0 && (
                    <p className={META} style={fs(11.5)}>
                      {t('storage.mirror.mirroredTo', { targets: row.mirrorTargets.join(', ') })}
                    </p>
                  )}
                  {row.replicaOf.length > 0 && (
                    <p className={META} style={fs(11.5)}>
                      {t('storage.mirror.replicaOf', { primaries: row.replicaOf.join(', ') })}
                    </p>
                  )}
                  {row.source === 'env' && <p className={META} style={fs(11.5)}>{t('storage.backends.envReadOnly')}</p>}
                  {result === 'running' ? (
                    <p className={`${META} inline-flex items-center gap-1.5`} style={fs(11.5)}>
                      <Loader2 size={12} className="animate-spin" />
                      {t('storage.test.running')}
                    </p>
                  ) : (
                    <TestResult
                      result={result as StorageTestResponse | undefined}
                      okLabel={t('storage.test.ok')}
                      failedLabel={t('storage.test.failed')}
                    />
                  )}
                  {row.mirrorTargets.length > 0 && (
                    <div className="flex flex-col items-start gap-1.5">
                      {backfill?.status === 'running' ? (
                        <>
                          <p className={`${META} font-geist tabular-nums`} style={fs(11.5)}>
                            {t('storage.sync.running', { done: String(backfill.done), total: String(backfill.total) })}
                          </p>
                          <Progress done={backfill.done} total={backfill.total} />
                          <p className={`${META} font-geist tabular-nums`} style={fs(11.5)}>
                            {t('storage.sync.counts', {
                              copied: String(backfill.copied),
                              skipped: String(backfill.skipped),
                              failed: String(backfill.failed),
                            })}
                          </p>
                          <button type="button"
                            className={ROW_BUTTON}
                            style={fs(12, 'body')}
                            onClick={() => handleCancelBackfill(row)}
                          >
                            <X size={13} strokeWidth={2.2} />
                            {t('storage.sync.cancel')}
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Terminal statuses render ALONGSIDE the button (not instead-of) —
                              a completed/cancelled/errored backfill must stay re-runnable
                              without a page reload. */}
                          {backfill?.status === 'done' && (
                            <p className={`${META} font-geist tabular-nums`} style={fs(11.5)}>
                              {t('storage.sync.done', {
                                copied: String(backfill.copied),
                                deleted: String(backfill.deleted),
                                failed: String(backfill.failed),
                              })}
                            </p>
                          )}
                          {backfill?.status === 'cancelled' && (
                            <p className={META} style={fs(11.5)}>{t('storage.sync.cancelled')}</p>
                          )}
                          {backfill?.status === 'error' && (
                            <p className="m-0 text-danger" style={fs(11.5)}>
                              {t('storage.sync.error', { error: backfill.error ?? '' })}
                            </p>
                          )}
                          {syncPrompt !== row.name && (
                            <button type="button"
                              className={ROW_BUTTON}
                              style={fs(12, 'body')}
                              onClick={() => handleStartBackfill(row)}
                            >
                              <RefreshCw size={13} strokeWidth={2.2} />
                              {t('storage.sync.now')}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {syncPrompt === row.name && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[12px] border border-edge-faint bg-surface-secondary px-3 py-2.5">
                      <p className="m-0 min-w-0 flex-1 basis-48 text-content" style={fs(12.5, 'body')}>{t('storage.sync.prompt')}</p>
                      <div className="flex flex-none items-center gap-1.5">
                        <button type="button"
                          className={ROW_BUTTON}
                          style={fs(12, 'body')}
                          onClick={() => setSyncPrompt(null)}
                        >
                          {t('storage.sync.dismiss')}
                        </button>
                        <button type="button"
                          className={ROW_BUTTON_PRIMARY}
                          style={fs(12, 'body')}
                          onClick={() => handleStartBackfill(row)}
                        >
                          <RefreshCw size={13} strokeWidth={2.2} />
                          {t('storage.sync.now')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {degenerate.map(({ backend, reason }) => {
            const result = testResultFor(backend.name)
            const primary = backend.type === 'mirror' ? backend.options.primary : ''
            return (
              <div key={backend.name} data-testid={`storage-backend-${backend.name}`} className="px-3.5 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className={`${TILE} !bg-warning-soft !text-warning`}>
                    <AlertTriangle size={15} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1 basis-48">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span className="min-w-0 truncate font-geist font-semibold text-content" style={fs(13.5, 'body')}>{backend.name}</span>
                      <StatusPill>{t('storage.type.mirror')}</StatusPill>
                    </div>
                    <p className="m-0 mt-0.5 text-warning" style={fs(11.5)}>{t(`storage.mirror.degenerate.${reason}`, { primary })}</p>
                  </div>
                  <div className="flex flex-none items-center gap-1.5">
                    <button type="button" className={ROW_BUTTON} style={fs(12, 'body')} onClick={() => admin.test(backend)}>
                      <PlugZap size={13} strokeWidth={2.2} />
                      {t('storage.actions.test')}
                    </button>
                    <Tooltip label={t('storage.actions.remove')}>
                      <button type="button" aria-label={t('storage.actions.remove')} className={`${SETTINGS_ICON_BUTTON} hover:!text-danger`} onClick={() => setConfirmRemove({ name: backend.name, degenerate: true })}>
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </Tooltip>
                  </div>
                </div>
                {(result === 'running' || result !== undefined) && (
                  <div className={DETAILS}>
                    {result === 'running' ? (
                      <p className={`${META} inline-flex items-center gap-1.5`} style={fs(11.5)}>
                        <Loader2 size={12} className="animate-spin" />
                        {t('storage.test.running')}
                      </p>
                    ) : (
                      <TestResult
                        result={result as StorageTestResponse | undefined}
                        okLabel={t('storage.test.ok')}
                        failedLabel={t('storage.test.failed')}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </SettingRows>

        {state.migrations.length > 0 && (
          <SettingRows>
            {state.migrations.map((m) => (
              <div
                key={m.category}
                data-testid={`storage-migration-${m.category}`}
                className="flex items-start gap-3 px-3.5 py-3"
              >
                <span className={TILE}>
                  <ArrowRightLeft size={15} strokeWidth={2} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                  <p className="m-0 font-semibold text-content" style={fs(13.5, 'body')}>{t(`storage.category.${m.category}`)}</p>
                  {m.status === 'running' ? (
                    <>
                      <p className={`${META} font-geist tabular-nums`} style={fs(11.5)}>
                        {t('storage.migrate.running', {
                          category: t(`storage.category.${m.category}`),
                          done: String(m.done),
                          total: String(m.total),
                        })}
                      </p>
                      <Progress done={m.done} total={m.total} />
                      <button type="button"
                        className={`${ROW_BUTTON} mt-1`}
                        style={fs(12, 'body')}
                        onClick={() => void handleCancelMigration(m)}
                      >
                        <X size={13} strokeWidth={2.2} />
                        {t('storage.migrate.cancel')}
                      </button>
                    </>
                  ) : m.status === 'done' ? (
                    <>
                      <p className={`${META} font-geist tabular-nums`} style={fs(11.5)}>
                        {t('storage.migrate.done', { copied: String(m.copied), skipped: String(m.skipped) })}
                      </p>
                      {m.failed > 0 && (
                        <p className="m-0 text-danger" style={fs(11.5)}>
                          {t('storage.migrate.doneFailures', { failed: String(m.failed) })}
                        </p>
                      )}
                      {m.reclaimable && (
                        <p className={META} style={fs(11.5)}>
                          {t('storage.migrate.reclaimable', {
                            count: m.reclaimable.objects,
                            size: formatBytes(m.reclaimable.bytes),
                            from: m.from,
                          })}
                        </p>
                      )}
                    </>
                  ) : m.status === 'failed' ? (
                    <p className="m-0 text-danger" style={fs(11.5)}>
                      {t('storage.migrate.failed', { error: m.error ?? '' })}
                    </p>
                  ) : (
                    <p className={META} style={fs(11.5)}>{t('storage.migrate.cancelled')}</p>
                  )}
                </div>
              </div>
            ))}
          </SettingRows>
        )}
      </Section>

      <Section title={t('storage.categories.title')} icon={FolderTree}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {STORAGE_CATEGORIES.map((category) => {
            // The admin state's category record is exhaustive by schema contract.
            const stateEntry = state.categories[category]!
            const selectedPrimary = primaryNameOf(state, draft, effective[category])
            const changed = selectedPrimary !== primaryNameOf(state, draft, stateEntry.backend)
            const viaMirror = effective[category] !== selectedPrimary
            return (
              <div
                key={category}
                data-testid={`storage-category-${category}`}
                className={`flex min-w-0 flex-col gap-2.5 rounded-[14px] border bg-surface-card p-3.5 ${changed ? 'border-edge' : 'border-edge-faint'}`}
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="m-0 font-semibold text-content" style={fs(13.5, 'body')}>{t(`storage.category.${category}`)}</p>
                    <p className="m-0 mt-0.5 leading-snug text-content-faint" style={fs(11.5)}>{t(`storage.categoryDesc.${category}`)}</p>
                  </div>
                  <code className="flex-none rounded-full bg-surface-tertiary px-2 py-[2px] font-geist font-semibold text-content-muted" style={fs(10.5)}>
                    {category}
                  </code>
                </div>
                {state.usage?.categories[category] && (
                  <p className={`${META} font-geist tabular-nums`} style={fs(11.5)}>
                    {t('storage.usage.line', {
                      count: state.usage.categories[category]!.objects,
                      size: formatBytes(state.usage.categories[category]!.bytes),
                    })}
                  </p>
                )}
                <CustomSelect
                  value={selectedPrimary}
                  onChange={(value) => setCategory(category, String(value))}
                  options={rows.map((row) => ({
                    value: row.name,
                    label:
                      stateEntry.source === 'default' && row.name === stateEntry.backend
                        ? `${row.name} (${t('storage.categories.default')})`
                        : row.name,
                  }))}
                  size="sm"
                />
                {changed && (
                  <p role="alert" className="m-0 rounded-[10px] bg-warning-soft px-2.5 py-1.5 leading-snug text-warning" style={fs(11.5)}>
                    {t('storage.categories.reassignWarning')}
                  </p>
                )}
                {viaMirror && CACHE_CATEGORIES.includes(category) && (
                  <p role="note" className="m-0 leading-snug text-content-faint" style={fs(11.5)}>
                    {t('storage.mirror.cacheWarning')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </Section>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-edge-faint bg-surface-secondary px-4 py-3">
        <button type="button"
          onClick={save}
          disabled={!admin.dirty || admin.saving}
          className={SETTINGS_BUTTON_PRIMARY}
          style={fs(13, 'body')}
        >
          {admin.saving ? <Loader2 size={14} strokeWidth={2.2} className="animate-spin" /> : <Check size={14} strokeWidth={2.2} />}
          {t('storage.save')}
        </button>
        {admin.dirty && <StatusPill tone="warning">{t('storage.unsaved')}</StatusPill>}
        {migrationQueue.length > 0 && (
          <SettingsHint className="min-w-0 flex-1">
            {t('storage.migrate.queued', { categories: categoryNames(t, migrationQueue.map((c) => c.category)) })}
          </SettingsHint>
        )}
      </div>

      {migratePromptOpen && (
        <div
          role="alertdialog"
          aria-labelledby={migrateTitleId}
          className="mt-3 overflow-hidden rounded-2xl border border-edge-faint bg-surface-card shadow-sm"
        >
          <div className="flex items-center gap-3 border-b border-edge-faint px-4 py-3" style={{ background: NEUTRAL_TINT }}>
            <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-surface-card text-content-secondary shadow-sm">
              <ArrowRightLeft size={15} strokeWidth={2} />
            </span>
            <p id={migrateTitleId} className="m-0 min-w-0 flex-1 font-bold text-content" style={fs(14, 'body')}>{t('storage.migrate.promptTitle')}</p>
          </div>
          <div className="flex flex-col gap-1.5 px-4 py-3">
            {migrationCandidates.map((c) => (
              <p key={c.category} className="m-0 font-geist tabular-nums text-content-secondary" style={fs(12.5, 'body')}>
                {migrationPromptLine(t, c)}
              </p>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-edge-faint px-4 py-3">
            <button type="button"
              className={SETTINGS_BUTTON}
              style={fs(13, 'body')}
              onClick={closeMigratePrompt}
            >
              {t('storage.migrate.promptCancel')}
            </button>
            <span className="flex-1" />
            <button type="button"
              className={SETTINGS_BUTTON}
              style={fs(13, 'body')}
              onClick={() => void routeOnlySave()}
            >
              {t('storage.migrate.routeOnly')}
            </button>
            <button type="button"
              className={SETTINGS_BUTTON_PRIMARY}
              style={fs(13, 'body')}
              onClick={() => void moveAndSave()}
            >
              {t('storage.migrate.move')}
            </button>
          </div>
        </div>
      )}
      {admin.saveError && (
        <div role="alert" className="mt-3 flex flex-wrap items-start gap-3 rounded-2xl border border-edge-faint bg-danger-soft px-4 py-3">
          <AlertTriangle size={16} strokeWidth={2.2} className="mt-0.5 flex-none text-danger" />
          <p className="m-0 min-w-0 flex-1 basis-56 break-words leading-normal text-content" style={fs(13, 'body')}>{admin.saveError}</p>
          {/* A 409 leaves the draft pinned to a version the server has moved
              past; "save again" can never clear it, so the banner offers the
              one action that can — see useStorageAdmin.discardDraft. */}
          {admin.saveConflict && (
            <button type="button"
              className={ROW_BUTTON}
              style={fs(12, 'body')}
              onClick={() => void admin.discardDraft()}
            >
              <RotateCcw size={13} strokeWidth={2.2} />
              {t('storage.discardAndReload')}
            </button>
          )}
        </div>
      )}

      {editing && (
        <BackendForm
          initial={editing.initial}
          backendNames={backendNames}
          mirror={editing.mirror}
          onCommit={commitBackend}
          onCancel={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmRemove !== null}
        onClose={() => setConfirmRemove(null)}
        onConfirm={confirmRemoval}
        title={t('storage.remove.title')}
        message={confirmRemove ? removeMessage(confirmRemove.name, confirmRemove.degenerate) : ''}
        confirmLabel={t('storage.remove.title')}
      />
    </div>
  )
}
