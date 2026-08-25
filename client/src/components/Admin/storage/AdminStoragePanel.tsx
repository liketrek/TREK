import React, { useEffect, useRef, useState } from 'react'
import { Activity, FolderTree, HardDrive } from 'lucide-react'
import {
  STORAGE_CATEGORIES,
  type StorageBackend,
  type StorageCategory,
  type StorageConfig,
  type StorageMigrationStatus,
  type StorageTestResponse,
} from '@trek/shared'
import { useTranslation } from '../../../i18n'
import { formatBytes } from '../../../utils/formatBytes'
import { relativeTime } from '../../../utils/relativeTime'
import ConfirmDialog from '../../shared/ConfirmDialog'
import CustomSelect from '../../shared/CustomSelect'
import { useToast } from '../../shared/Toast'
import Section from '../../Settings/Section'
import BackendForm, { type BackendFormMirrorProps } from './BackendForm'
import {
  CACHE_CATEGORIES,
  adoptedMirrorFor,
  computeMigrationCandidates,
  effectiveCategoryMap,
  foldBackends,
  mirrorProbeTargets,
  primaryNameOf,
  removeBackend,
  removeBackendAndMirrors,
  renameBackendRefs,
  replicaCandidates,
  replicaOfPrimaries,
  settingsDocumentOf,
  setMirrorTargets,
  stripCategories,
  upsertBackend,
  usageByBackend,
  type FoldedBackendRow,
  type MigrationCandidate,
} from './storageModel'
import { useStorageAdmin } from './useStorageAdmin'

/** Display-name mapper for joined category lists — the raw id renders only in the badge. */
const categoryNames = (t: (key: string) => string, ids: readonly string[]): string =>
  ids.map((id) => t(`storage.category.${id}`)).join(', ')

function TestResult({ result, failedLabel, okLabel }: {
  result: StorageTestResponse | undefined
  failedLabel: string
  okLabel: string
}): React.ReactElement | null {
  if (result === undefined) return null
  return (
    <div className="mt-2 space-y-0.5">
      <p className="text-xs font-semibold text-content">{result.ok ? okLabel : failedLabel}</p>
      {result.targets.map((target) => (
        <p key={target.name} className="text-xs text-content-faint">
          {target.ok ? '✓' : '✗'} {target.name}
          {target.error ? ` — ${target.error}` : ''}
        </p>
      ))}
    </div>
  )
}

const LINK_BUTTON_STYLE: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer' }

export default function AdminStoragePanel(): React.ReactElement {
  const { t, locale } = useTranslation()
  const toast = useToast()
  const admin = useStorageAdmin(t('common.error'), t('storage.saveConflict'))
  const [editing, setEditing] = useState<{
    initial: StorageBackend | null
    originalName: string | null
    mirror: BackendFormMirrorProps
  } | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<{ name: string; degenerate: boolean } | null>(null)
  const [syncPrompt, setSyncPrompt] = useState<string | null>(null)
  // Open/closed only — never a snapshot of candidates. Storing the candidate
  // array here would go stale the moment the operator edits a category while
  // the dialog is open; the render below and moveAndSave both recompute
  // computeMigrationCandidates(draft, state) fresh instead.
  const [migratePromptOpen, setMigratePromptOpen] = useState(false)
  const [migrationQueue, setMigrationQueue] = useState<MigrationCandidate[]>([])
  // Set by `save` right before it calls admin.save(): the pre-save mirror
  // target count per row name. Consumed (and cleared) by the effect below the
  // first time `admin.state` changes afterward — never touched otherwise, so
  // unrelated state changes (the backfill poll included) are no-ops here.
  const pendingPromptCheck = useRef<Map<string, number> | null>(null)
  // Synchronous single-flight lock for the queue effect below: `admin.state`
  // only reflects a just-started migration once startMigration's awaited
  // refreshState() resolves, so `setMigrationQueue(rest)` re-firing the
  // effect synchronously (still against the pre-POST `admin.state`) would
  // otherwise dequeue and POST the next candidate before the server has
  // confirmed the first — a ref (not state) so the guard is visible on that
  // very next synchronous re-render, not just after a state-driven one.
  const migrationStartInFlight = useRef(false)

  useEffect(() => {
    if (!pendingPromptCheck.current || !admin.state) return
    const before = pendingPromptCheck.current
    pendingPromptCheck.current = null
    const { rows: afterRows } = foldBackends(admin.state, settingsDocumentOf(admin.state))
    const grown = afterRows.find((r) => r.mirrorTargets.length > (before.get(r.name) ?? 0))
    if (grown) setSyncPrompt(grown.name)
  }, [admin.state])

  // Queued category migrations run strictly sequentially: once a slot opens
  // (no migration currently running), dequeue the next candidate and start
  // it. Depends on admin.state so a poll landing a terminal status re-fires
  // this without any user interaction. The in-flight lock closes the race
  // where setMigrationQueue(rest) re-fires this effect synchronously while
  // admin.state still shows the pre-POST world — without it, the next
  // candidate could dequeue and POST before the first is server-confirmed.
  // Also waits out a running BACKFILL — the server's one-storage-job-at-a-time
  // rule spans backfills and migrations alike, so starting while one runs
  // would 409, and the queued candidate would be lost (no retry).
  //
  // A failed startMigration POST would otherwise strand `rest`: it was
  // already dequeued into local state before the POST, so on failure nothing
  // ever changes `migrationQueue` or `admin.state` again — the effect never
  // re-fires and the remaining candidates sit invisibly forever, silently
  // never migrated. On failure the whole remaining queue is explicitly
  // cleared (never retried — the operator re-triggers via Save), named in a
  // toast, and admin.state is refreshed so the panel reflects whatever the
  // failed attempt's category ended up as server-side.
  useEffect(() => {
    if (migrationQueue.length === 0 || !admin.state) return
    if (migrationStartInFlight.current) return
    if (admin.state.migrations.some((m) => m.status === 'running')) return
    if (admin.state.backfills.some((b) => b.status === 'running')) return
    const [next, ...rest] = migrationQueue
    migrationStartInFlight.current = true
    setMigrationQueue(rest)
    void admin.startMigration(next!.category, next!.toWire).then((error) => {
      migrationStartInFlight.current = false
      if (error) {
        toast.error(error)
        if (rest.length > 0) {
          toast.error(t('storage.migrate.queueDropped', { categories: categoryNames(t, rest.map((c) => c.category)) }))
          setMigrationQueue([])
        }
        void admin.refreshState().catch(() => {})
      }
    })
  }, [migrationQueue, admin.state])

  if (admin.loading) {
    return <p className="text-sm italic p-4 text-content-faint">{t('storage.loading')}</p>
  }
  if (!admin.state || !admin.draft) {
    return (
      <div role="alert" className="rounded-xl border p-4 text-sm border-edge bg-surface-card text-content">
        {admin.loadError || t('common.error')}
      </div>
    )
  }
  const { state, draft } = admin

  // Pure/cheap — recomputed every render so the migrate-prompt dialog (below)
  // never shows a stale candidate set while it's open (fix: migration prompt
  // staleness). moveAndSave recomputes independently at confirm time rather
  // than reading this render-scoped value, since the click handler and the
  // render that produced it are not guaranteed to be the same one.
  const migrationCandidates = computeMigrationCandidates(draft, state)

  // Duplicate pre-check needs EVERY wire name (hidden mirror names included);
  // mirror-target candidates are the visible primaries only.
  const backendNames = [...new Set([...state.backends.map((b) => b.name), ...draft.backends.map((b) => b.name)])]
  const { rows, degenerate } = foldBackends(state, draft)
  const effective = effectiveCategoryMap(state, draft)
  const usageSums = usageByBackend(state, draft)

  const startEdit = (row: FoldedBackendRow) => {
    // Editing a built-in creates a settings override row bearing its name —
    // the first-class relocation path (merge-by-name).
    setEditing({
      initial: row.backend,
      originalName: row.name,
      mirror: {
        candidates: replicaCandidates(rows, row.name, row.mirrorTargets),
        initialTargets: row.mirrorTargets,
      },
    })
  }

  const commitBackend = (backend: StorageBackend, mirrorTargets?: string[]) => {
    const renamedFrom =
      editing?.originalName && editing.originalName !== backend.name ? editing.originalName : null
    // Widened to StorageConfig: these edit helpers are version-blind (they
    // return plain StorageConfig), and admin.setDraft re-attaches the
    // draft's own `version` regardless of what shape it's handed.
    let next: StorageConfig | null = draft
    if (renamedFrom) next = renameBackendRefs(removeBackend(next, renamedFrom), renamedFrom, backend.name)
    next = upsertBackend(next, backend)
    if (mirrorTargets !== undefined) next = setMirrorTargets(state, next, backend.name, mirrorTargets)
    admin.setDraft(next)
    setEditing(null)
  }

  const removeMessage = (name: string, isDegenerate: boolean): string => {
    const row = rows.find((r) => r.name === name)
    const assigned = isDegenerate
      ? degenerate.find((d) => d.backend.name === name)?.categories ?? []
      : row?.categories ?? []
    const usedAsReplicaBy = isDegenerate ? [] : replicaOfPrimaries(draft, name)
    return [
      t('storage.remove.body', { name }),
      assigned.length > 0 ? t('storage.remove.stillAssigned', { categories: categoryNames(t, assigned) }) : '',
      usedAsReplicaBy.length > 0 ? t('storage.remove.usedAsReplicaBy', { primaries: usedAsReplicaBy.join(', ') }) : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  const setCategory = (category: StorageCategory, primaryName: string) => {
    // Picking a mirrored primary routes through its adopted mirror silently.
    const target = adoptedMirrorFor(draft, primaryName)?.name ?? primaryName
    // The admin state's category record is exhaustive by schema contract.
    const stateEntry = state.categories[category]!
    const categories = { ...draft.categories }
    if (stateEntry.source === 'default' && target === stateEntry.backend) {
      delete categories[category] // back to the default → no longer settings-owned
    } else {
      categories[category] = target
    }
    admin.setDraft({ ...draft, categories })
  }

  // Snapshot the LAST-CONFIRMED (pre-save `state`'s own fold, not the
  // in-progress `draft`) mirror target counts; the effect above compares
  // them against the fresh post-save state to detect newly-added
  // replicas. Folding `draft` here would already include the unsaved
  // edit and mask the very growth this is meant to detect.
  const snapshotMirrorTargets = (): Map<string, number> => {
    const { rows: beforeRows } = foldBackends(state, settingsDocumentOf(state))
    return new Map(beforeRows.map((r) => [r.name, r.mirrorTargets.length]))
  }

  const doPlainSave = async () => {
    pendingPromptCheck.current = snapshotMirrorTargets()
    if (await admin.save()) toast.success(t('storage.saved'))
    else pendingPromptCheck.current = null
  }

  // Recomputes the candidate set at confirm time — never trusts whatever was
  // true when the dialog opened. The operator can edit categories (or a
  // background poll can land a fresher usage scan) while the dialog is on
  // screen; the recomputed set is what actually drives both stripCategories
  // (what gets reverted from the PUT body) and the queue (what gets POSTed),
  // so the two can never diverge from what the dialog most recently showed.
  const moveAndSave = async () => {
    const candidates = computeMigrationCandidates(draft, state)
    pendingPromptCheck.current = snapshotMirrorTargets()
    const ok = await admin.save(stripCategories(draft, state, candidates.map((c) => c.category)))
    if (ok) {
      setMigrationQueue(candidates)
      toast.success(t('storage.saved'))
    } else {
      pendingPromptCheck.current = null
    }
    setMigratePromptOpen(false)
  }

  const routeOnlySave = async () => {
    setMigratePromptOpen(false)
    await doPlainSave()
  }

  const save = async () => {
    if (migrationCandidates.length > 0) {
      setMigratePromptOpen(true)
      return
    }
    await doPlainSave()
  }

  const handleCancelMigration = async (m: StorageMigrationStatus) => {
    const error = await admin.cancelMigration(m.category)
    if (error) toast.error(error)
  }

  const testResultFor = (key: string): StorageTestResponse | 'running' | undefined => admin.testResults[key]

  const handleRefreshStats = async () => {
    const error = await admin.refreshStats()
    if (error) toast.error(error)
  }

  const handleStartBackfill = async (row: FoldedBackendRow) => {
    if (!row.mirrorName) return
    setSyncPrompt((prev) => (prev === row.name ? null : prev))
    const error = await admin.startBackfill(row.mirrorName)
    if (error) toast.error(error)
  }

  const handleCancelBackfill = async (row: FoldedBackendRow) => {
    if (!row.mirrorName) return
    const error = await admin.cancelBackfill(row.mirrorName)
    if (error) toast.error(error)
  }

  return (
    <div>
      {state.configError && (
        <div
          role="alert"
          className="rounded-xl border p-3 mb-4 text-sm"
          style={{ borderColor: 'var(--warning)', background: 'var(--warning-soft)', color: 'var(--text-primary)' }}
        >
          {t('storage.configError.banner', { error: state.configError })}
        </div>
      )}
      <Section title={t('storage.health.title')} icon={Activity}>
        {state.health.replicaFailures.length === 0 ? (
          <p className="text-sm text-content-faint">{t('storage.health.allClear')}</p>
        ) : (
          <ul className="space-y-1">
            {state.health.replicaFailures.map((failure) => (
              <li key={`${failure.backend}-${failure.key}-${failure.at}`} className="text-sm text-content">
                {t('storage.health.failureLine', {
                  op: failure.op,
                  key: failure.key,
                  backend: failure.backend,
                  error: failure.error,
                })}
                <span className="text-content-faint"> · {relativeTime(failure.at, locale)}</span>
              </li>
            ))}
          </ul>
        )}
        {state.seedFilePresent && <p className="text-xs mt-2 text-content-faint">{t('storage.health.seedFile')}</p>}
      </Section>

      <Section title={t('storage.backends.title')} icon={HardDrive}>
        <p className="text-sm text-content-faint" style={{ marginTop: -8 }}>{t('storage.description')}</p>
        <p className="text-xs mb-2 text-content-faint">
          {state.usage
            ? t('storage.usage.computed', { age: relativeTime(state.usage.computedAt, locale) })
            : t('storage.usage.never')}
          {' '}
          <button type="button" className="text-xs underline text-content-secondary" style={LINK_BUTTON_STYLE} onClick={handleRefreshStats}>
            {state.usage ? t('storage.usage.refresh') : t('storage.usage.compute')}
          </button>
        </p>
        <div className="space-y-3">
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
            return (
              <div key={row.name} data-testid={`storage-backend-${row.name}`} className="rounded-xl border p-4 border-edge-secondary">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-content">{row.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full border border-edge text-content-secondary">
                    {t(`storage.type.${row.type}`)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full border border-edge text-content-faint">
                    {t(`storage.source.${row.source}`)}
                  </span>
                  <span className="flex-1" />
                  <button type="button"
                    className="text-xs underline text-content-secondary"
                    style={LINK_BUTTON_STYLE}
                    onClick={() =>
                      row.mirrorName
                        ? admin.testMirror(resultKey, mirrorProbeTargets(draft, state, testCandidate))
                        : admin.test(testCandidate)
                    }
                  >
                    {t('storage.actions.test')}
                  </button>
                  {row.source !== 'env' && (
                    <button type="button" className="text-xs underline text-content-secondary" style={LINK_BUTTON_STYLE} onClick={() => startEdit(row)}>
                      {t('storage.actions.edit')}
                    </button>
                  )}
                  {row.source === 'settings' && (
                    <button type="button" className="text-xs underline text-content-secondary" style={LINK_BUTTON_STYLE} onClick={() => setConfirmRemove({ name: row.name, degenerate: false })}>
                      {t('storage.actions.remove')}
                    </button>
                  )}
                </div>
                <p className="text-xs mt-1 text-content-faint">
                  {row.categories.length > 0
                    ? t('storage.backends.usedBy', { categories: categoryNames(t, row.categories) })
                    : t('storage.backends.unused')}
                </p>
                {rowUsage && (
                  <p className="text-xs mt-1 text-content-faint">
                    {t('storage.usage.line', { objects: String(rowUsage.objects), size: formatBytes(rowUsage.bytes) })}
                    {row.name === 'uploads-local' && state.usage!.legacyPhotos.objects > 0
                      ? ` (${t('storage.usage.legacyNote')})`
                      : ''}
                  </p>
                )}
                {row.mirrorTargets.length > 0 && (
                  <p className="text-xs mt-1 text-content-faint">
                    {t('storage.mirror.mirroredTo', { targets: row.mirrorTargets.join(', ') })}
                  </p>
                )}
                {row.replicaOf.length > 0 && (
                  <p className="text-xs mt-1 text-content-faint">
                    {t('storage.mirror.replicaOf', { primaries: row.replicaOf.join(', ') })}
                  </p>
                )}
                {row.source === 'env' && <p className="text-xs mt-1 text-content-faint">{t('storage.backends.envReadOnly')}</p>}
                {result === 'running' ? (
                  <p className="text-xs mt-2 text-content-faint">{t('storage.test.running')}</p>
                ) : (
                  <TestResult
                    result={result as StorageTestResponse | undefined}
                    okLabel={t('storage.test.ok')}
                    failedLabel={t('storage.test.failed')}
                  />
                )}
                {row.mirrorTargets.length > 0 && (
                  <div className="mt-2">
                    {backfill?.status === 'running' ? (
                      <>
                        <p className="text-xs text-content-faint">
                          {t('storage.sync.running', { done: String(backfill.done), total: String(backfill.total) })}
                        </p>
                        <p className="text-xs text-content-faint">
                          {t('storage.sync.counts', {
                            copied: String(backfill.copied),
                            skipped: String(backfill.skipped),
                            failed: String(backfill.failed),
                          })}
                        </p>
                        <button type="button"
                          className="text-xs underline text-content-secondary mt-1"
                          style={LINK_BUTTON_STYLE}
                          onClick={() => handleCancelBackfill(row)}
                        >
                          {t('storage.sync.cancel')}
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Terminal statuses render ALONGSIDE the button (not instead-of) —
                            a completed/cancelled/errored backfill must stay re-runnable
                            without a page reload. */}
                        {backfill?.status === 'done' && (
                          <p className="text-xs text-content-faint">
                            {t('storage.sync.done', {
                              copied: String(backfill.copied),
                              deleted: String(backfill.deleted),
                              failed: String(backfill.failed),
                            })}
                          </p>
                        )}
                        {backfill?.status === 'cancelled' && (
                          <p className="text-xs text-content-faint">{t('storage.sync.cancelled')}</p>
                        )}
                        {backfill?.status === 'error' && (
                          <p className="text-xs text-content-faint">
                            {t('storage.sync.error', { error: backfill.error ?? '' })}
                          </p>
                        )}
                        {syncPrompt !== row.name && (
                          <button type="button"
                            className="text-xs underline text-content-secondary"
                            style={LINK_BUTTON_STYLE}
                            onClick={() => handleStartBackfill(row)}
                          >
                            {t('storage.sync.now')}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
                {syncPrompt === row.name && (
                  <div className="mt-2 rounded-lg border p-2 border-edge-secondary">
                    <p className="text-xs text-content">{t('storage.sync.prompt')}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <button type="button"
                        className="text-xs underline text-content-secondary"
                        style={LINK_BUTTON_STYLE}
                        onClick={() => handleStartBackfill(row)}
                      >
                        {t('storage.sync.now')}
                      </button>
                      <button type="button"
                        className="text-xs underline text-content-secondary"
                        style={LINK_BUTTON_STYLE}
                        onClick={() => setSyncPrompt(null)}
                      >
                        {t('storage.sync.dismiss')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {degenerate.map(({ backend, reason }) => {
            const result = testResultFor(backend.name)
            const primary = backend.type === 'mirror' ? backend.options.primary : ''
            return (
              <div key={backend.name} data-testid={`storage-backend-${backend.name}`} className="rounded-xl border p-4 border-edge-secondary">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-content">{backend.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full border border-edge text-content-secondary">
                    {t('storage.type.mirror')}
                  </span>
                  <span className="flex-1" />
                  <button type="button" className="text-xs underline text-content-secondary" style={LINK_BUTTON_STYLE} onClick={() => admin.test(backend)}>
                    {t('storage.actions.test')}
                  </button>
                  <button type="button" className="text-xs underline text-content-secondary" style={LINK_BUTTON_STYLE} onClick={() => setConfirmRemove({ name: backend.name, degenerate: true })}>
                    {t('storage.actions.remove')}
                  </button>
                </div>
                <p className="text-xs mt-1 text-content-faint">{t(`storage.mirror.degenerate.${reason}`, { primary })}</p>
                {result === 'running' ? (
                  <p className="text-xs mt-2 text-content-faint">{t('storage.test.running')}</p>
                ) : (
                  <TestResult
                    result={result as StorageTestResponse | undefined}
                    okLabel={t('storage.test.ok')}
                    failedLabel={t('storage.test.failed')}
                  />
                )}
              </div>
            )
          })}
        </div>

        {state.migrations.length > 0 && (
          <div className="space-y-3 mt-3">
            {state.migrations.map((m) => (
              <div
                key={m.category}
                data-testid={`storage-migration-${m.category}`}
                className="rounded-xl border p-4 border-edge-secondary"
              >
                <p className="text-sm font-semibold text-content">{t(`storage.category.${m.category}`)}</p>
                {m.status === 'running' ? (
                  <>
                    <p className="text-xs mt-1 text-content-faint">
                      {t('storage.migrate.running', {
                        category: t(`storage.category.${m.category}`),
                        done: String(m.done),
                        total: String(m.total),
                      })}
                    </p>
                    <button type="button"
                      className="text-xs underline text-content-secondary mt-1"
                      style={LINK_BUTTON_STYLE}
                      onClick={() => void handleCancelMigration(m)}
                    >
                      {t('storage.migrate.cancel')}
                    </button>
                  </>
                ) : m.status === 'done' ? (
                  <>
                    <p className="text-xs mt-1 text-content-faint">
                      {t('storage.migrate.done', { copied: String(m.copied), skipped: String(m.skipped) })}
                    </p>
                    {m.failed > 0 && (
                      <p className="text-xs mt-1 text-content-faint">
                        {t('storage.migrate.doneFailures', { failed: String(m.failed) })}
                      </p>
                    )}
                    {m.reclaimable && (
                      <p className="text-xs mt-1 text-content-faint">
                        {t('storage.migrate.reclaimable', {
                          objects: String(m.reclaimable.objects),
                          size: formatBytes(m.reclaimable.bytes),
                          from: m.from,
                        })}
                      </p>
                    )}
                  </>
                ) : m.status === 'failed' ? (
                  <p className="text-xs mt-1 text-content-faint">
                    {t('storage.migrate.failed', { error: m.error ?? '' })}
                  </p>
                ) : (
                  <p className="text-xs mt-1 text-content-faint">{t('storage.migrate.cancelled')}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {editing ? (
          <BackendForm
            initial={editing.initial}
            backendNames={backendNames}
            mirror={editing.mirror}
            onCommit={commitBackend}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <button type="button"
            onClick={() =>
              setEditing({
                initial: null,
                originalName: null,
                mirror: { candidates: replicaCandidates(rows, null), initialTargets: [] },
              })
            }
            style={{
              padding: '8px 20px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500,
              border: '2px solid var(--border-primary)', background: 'var(--bg-card)', color: 'var(--text-primary)',
            }}
          >
            {t('storage.backends.add')}
          </button>
        )}
      </Section>

      <Section title={t('storage.categories.title')} icon={FolderTree}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {STORAGE_CATEGORIES.map((category) => {
            // The admin state's category record is exhaustive by schema contract.
            const stateEntry = state.categories[category]!
            const selectedPrimary = primaryNameOf(state, draft, effective[category])
            const changed = selectedPrimary !== primaryNameOf(state, draft, stateEntry.backend)
            const viaMirror = effective[category] !== selectedPrimary
            return (
              <div key={category} data-testid={`storage-category-${category}`}>
                <label className="block text-sm font-medium mb-1 text-content-secondary">
                  {t(`storage.category.${category}`)}
                  <span className="ml-2 px-1.5 py-0.5 rounded border font-mono font-normal text-xs border-edge text-content-faint">
                    {category}
                  </span>
                </label>
                <p className="text-xs mb-1.5 text-content-faint">{t(`storage.categoryDesc.${category}`)}</p>
                {state.usage?.categories[category] && (
                  <p className="text-xs mb-1.5 text-content-faint">
                    {t('storage.usage.line', {
                      objects: String(state.usage.categories[category]!.objects),
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
                  style={{ maxWidth: 320 }}
                />
                {changed && (
                  <p role="alert" className="text-xs mt-1 text-content-faint">
                    {t('storage.categories.reassignWarning')}
                  </p>
                )}
                {viaMirror && CACHE_CATEGORIES.includes(category) && (
                  <p role="note" className="text-xs mt-1 text-content-faint">
                    {t('storage.mirror.cacheWarning')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <button type="button"
          onClick={save}
          disabled={!admin.dirty || admin.saving}
          style={{
            padding: '10px 20px', borderRadius: 10, cursor: admin.dirty && !admin.saving ? 'pointer' : 'default',
            fontFamily: 'inherit', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 600,
            border: '2px solid var(--text-primary)', background: 'var(--bg-hover)', color: 'var(--text-primary)',
            opacity: admin.dirty && !admin.saving ? 1 : 0.5,
          }}
        >
          {t('storage.save')}
        </button>
        {admin.dirty && <span className="text-xs text-content-faint">{t('storage.unsaved')}</span>}
      </div>
      {migrationQueue.length > 0 && (
        <p className="text-xs mt-2 text-content-faint">
          {t('storage.migrate.queued', { categories: categoryNames(t, migrationQueue.map((c) => c.category)) })}
        </p>
      )}
      {migratePromptOpen && (
        <div className="rounded-lg border px-3 py-2 mt-2 border-edge bg-surface-secondary" role="alertdialog">
          <p className="text-sm text-content">{t('storage.migrate.promptTitle')}</p>
          {migrationCandidates.map((c) => (
            <p key={c.category} className="text-xs mt-1 text-content-secondary">
              {c.objects === null
                ? t('storage.migrate.promptLineUnknown', {
                    category: t(`storage.category.${c.category}`),
                    from: c.from,
                    to: c.to,
                  })
                : t('storage.migrate.promptLine', {
                    category: t(`storage.category.${c.category}`),
                    objects: String(c.objects),
                    size: formatBytes(c.bytes ?? 0),
                    from: c.from,
                    to: c.to,
                  })}
            </p>
          ))}
          <div className="flex items-center gap-3 mt-2">
            <button type="button"
              className="text-xs underline text-content-secondary"
              style={LINK_BUTTON_STYLE}
              onClick={() => void moveAndSave()}
            >
              {t('storage.migrate.move')}
            </button>
            <button type="button"
              className="text-xs underline text-content-secondary"
              style={LINK_BUTTON_STYLE}
              onClick={() => void routeOnlySave()}
            >
              {t('storage.migrate.routeOnly')}
            </button>
            <button type="button"
              className="text-xs underline text-content-secondary"
              style={LINK_BUTTON_STYLE}
              onClick={() => setMigratePromptOpen(false)}
            >
              {t('storage.migrate.promptCancel')}
            </button>
          </div>
        </div>
      )}
      {admin.saveError && (
        <div role="alert" className="text-sm mt-2 text-content">
          <p>{admin.saveError}</p>
          {/* A 409 leaves the draft pinned to a version the server has moved
              past; "save again" can never clear it, so the banner offers the
              one action that can — see useStorageAdmin.discardDraft. */}
          {admin.saveConflict && (
            <button type="button"
              className="text-xs underline text-content-secondary mt-1"
              style={LINK_BUTTON_STYLE}
              onClick={() => void admin.discardDraft()}
            >
              {t('storage.discardAndReload')}
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmRemove !== null}
        onClose={() => setConfirmRemove(null)}
        onConfirm={() => {
          if (confirmRemove) {
            admin.setDraft(
              confirmRemove.degenerate
                ? removeBackend(draft, confirmRemove.name)
                : removeBackendAndMirrors(state, draft, confirmRemove.name),
            )
          }
          setConfirmRemove(null)
        }}
        title={t('storage.remove.title')}
        message={confirmRemove ? removeMessage(confirmRemove.name, confirmRemove.degenerate) : ''}
        confirmLabel={t('storage.remove.title')}
      />
    </div>
  )
}
