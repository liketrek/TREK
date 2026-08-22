import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  STORAGE_BACKEND_TYPES,
  STORAGE_BACKEND_TYPE_IDS,
  STORAGE_CATEGORIES,
  type StorageBackend,
  type StorageBackendFieldDef,
  type StorageBackendTypeId,
  type StorageCategory,
  type StorageConfig,
  type StorageMigrationStatus,
} from '@trek/shared'
import { useTranslation } from '../../../i18n'
import { useToast } from '../../../components/shared/Toast'
import { formatBytes } from '../../../utils/formatBytes'
import { relativeTime } from '../../../utils/relativeTime'
import {
  CACHE_CATEGORIES,
  adoptedMirrorFor,
  computeMigrationCandidates,
  effectiveCategoryMap,
  foldBackends,
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
} from '../../../components/Admin/storage/storageModel'
import { useStorageAdmin } from '../../../components/Admin/storage/useStorageAdmin'
import MToggle from '../../components/MToggle'
import MSetPickerSheet from '../settings/MSetPickerSheet'
import MConfirmSheet from '../settings/MConfirmSheet'
import { MSetSelectRow } from '../settings/MSettingsUi'
import { MAdminButton, MAdminCard, MAdminCardHead, MAdminField, MAdminInput, MAdminSecretInput } from './MAdminUi'

type FieldValues = Record<string, string | string[]>

function valuesOf(backend: StorageBackend | null): FieldValues {
  if (!backend) return {}
  const values: FieldValues = {}
  for (const [key, value] of Object.entries(backend.options)) {
    values[key] = Array.isArray(value) ? value : String(value)
  }
  return values
}

/** Display-name mapper for joined category lists — the raw id renders only in the badge. */
const categoryNames = (t: (key: string) => string, ids: readonly string[]): string =>
  ids.map((id) => t(`storage.category.${id}`)).join(', ')

/** Same behavior contract as the desktop BackendForm, rendered on the M* primitives. */
function MBackendForm({
  initial,
  backendNames,
  mirror,
  onCommit,
  onCancel,
}: {
  initial: StorageBackend | null
  backendNames: string[]
  mirror: { candidates: string[]; initialTargets: string[] }
  onCommit: (backend: StorageBackend, mirrorTargets: string[]) => void
  onCancel: () => void
}): React.ReactElement {
  const { t } = useTranslation()
  const [type, setType] = useState<StorageBackendTypeId>(initial?.type ?? 'local')
  const [name, setName] = useState(initial?.name ?? '')
  const [values, setValues] = useState<FieldValues>(() => valuesOf(initial))
  const [targets, setTargets] = useState<string[]>(mirror.initialTargets)
  const [picker, setPicker] = useState<string | null>(null)

  const fields = STORAGE_BACKEND_TYPES[type].fields as readonly StorageBackendFieldDef[]
  const refOptions = backendNames.filter((candidate) => candidate !== name.trim())
  const setValue = (key: string, value: string | string[]) => setValues((prev) => ({ ...prev, [key]: value }))

  const filled = (field: StorageBackendFieldDef): boolean => {
    const value = values[field.key]
    if (field.kind === 'backend-ref-list') return Array.isArray(value) && value.length > 0
    return typeof value === 'string' && value.trim() !== ''
  }
  const duplicate = name.trim() !== (initial?.name ?? '') && backendNames.includes(name.trim())
  const canApply = name.trim() !== '' && !duplicate && fields.every((f) => !f.required || filled(f))

  const apply = () => {
    const options: Record<string, unknown> = {}
    for (const field of fields) {
      const value = values[field.key]
      if (field.kind === 'backend-ref-list') {
        options[field.key] = Array.isArray(value) ? value : []
        continue
      }
      const text = typeof value === 'string' ? value : ''
      if (text === '' && !field.required) continue
      options[field.key] = field.kind === 'number' ? Number(text) : text
    }
    onCommit({ name: name.trim(), type, options } as StorageBackend, targets)
  }

  return (
    <MAdminCard className="space-y-3">
      <MAdminCardHead title={initial ? t('storage.form.editTitle') : t('storage.form.addTitle')} />
      <MAdminField label={t('storage.form.name')}>
        <MAdminInput value={name} onChange={(e) => setName(e.target.value)} spellCheck={false} autoComplete="off" />
      </MAdminField>
      {duplicate && (
        <p role="alert" className="font-geist text-[0.625rem] text-m-muted">
          {t('storage.form.duplicateName', { name: name.trim() })}
        </p>
      )}
      {initial === null && (
        <MAdminField label={t('storage.form.type')}>
          <MSetSelectRow
            label={t(`storage.type.${type}`)}
            trailing={<ChevronDown size={14} className="text-m-faint" />}
            onClick={() => setPicker('type')}
          />
          <MSetPickerSheet
            open={picker === 'type'}
            onClose={() => setPicker(null)}
            title={t('storage.form.type')}
            options={STORAGE_BACKEND_TYPE_IDS.filter((id) => id !== 'mirror').map((id) => ({
              value: id,
              label: t(`storage.type.${id}`),
            }))}
            value={type}
            onSelect={(next) => {
              setType(next as StorageBackendTypeId)
              setValues({})
            }}
          />
        </MAdminField>
      )}

      {fields.map((field) => {
        const value = values[field.key]
        if (field.kind === 'backend-ref') {
          const current = typeof value === 'string' ? value : ''
          return (
            <MAdminField key={field.key} label={t(field.labelKey)}>
              <MSetSelectRow
                label={current || t(field.labelKey)}
                trailing={<ChevronDown size={14} className="text-m-faint" />}
                onClick={() => setPicker(`field:${field.key}`)}
              />
              <MSetPickerSheet
                open={picker === `field:${field.key}`}
                onClose={() => setPicker(null)}
                title={t(field.labelKey)}
                options={refOptions.map((candidate) => ({ value: candidate, label: candidate }))}
                value={current}
                onSelect={(next) => setValue(field.key, next)}
              />
            </MAdminField>
          )
        }
        if (field.kind === 'backend-ref-list') {
          const selected = Array.isArray(value) ? value : []
          return (
            <MAdminField key={field.key} label={t(field.labelKey)}>
              <div className="space-y-2">
                {refOptions.map((candidate) => (
                  <div key={candidate} className="flex items-center justify-between gap-2">
                    <span className="text-[0.8125rem] font-semibold text-m-ink">{candidate}</span>
                    <MToggle
                      checked={selected.includes(candidate)}
                      ariaLabel={candidate}
                      onChange={(checked) =>
                        setValue(
                          field.key,
                          checked ? [...selected, candidate] : selected.filter((existing) => existing !== candidate),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </MAdminField>
          )
        }
        const text = typeof value === 'string' ? value : ''
        const shared = {
          value: text,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValue(field.key, e.target.value),
          placeholder: field.defaultValue !== undefined ? String(field.defaultValue) : '',
          spellCheck: false,
          autoComplete: 'off',
        }
        return (
          <MAdminField key={field.key} label={t(field.labelKey)} hint={field.helpKey ? t(field.helpKey) : undefined}>
            {field.kind === 'secret' ? (
              <MAdminSecretInput {...shared} />
            ) : (
              <MAdminInput {...shared} type={field.kind === 'number' ? 'number' : 'text'} />
            )}
          </MAdminField>
        )
      })}

      <MAdminField label={t('storage.mirror.targets')} hint={t('storage.mirror.targetsHelp')}>
        <div className="space-y-2">
          {mirror.candidates
            .filter((candidate) => candidate !== name.trim())
            .map((candidate) => (
              <div key={candidate} className="flex items-center justify-between gap-2">
                <span className="text-[0.8125rem] font-semibold text-m-ink">{candidate}</span>
                <MToggle
                  checked={targets.includes(candidate)}
                  ariaLabel={candidate}
                  onChange={(checked) =>
                    setTargets(checked ? [...targets, candidate] : targets.filter((existing) => existing !== candidate))
                  }
                />
              </div>
            ))}
        </div>
        {targets.length > 0 && (
          <p role="note" className="mt-1 font-geist text-[0.625rem] leading-relaxed text-m-muted">
            {t('storage.mirror.latencyNote')}
          </p>
        )}
      </MAdminField>

      <div className="flex items-center gap-2">
        <MAdminButton onClick={apply} disabled={!canApply}>
          {t('storage.form.apply')}
        </MAdminButton>
        <MAdminButton variant="ghost" onClick={onCancel}>
          {t('storage.form.cancel')}
        </MAdminButton>
      </div>
    </MAdminCard>
  )
}

export default function MAdminStoragePanel(): React.ReactElement {
  const { t, locale } = useTranslation()
  const toast = useToast()
  const admin = useStorageAdmin(t('common.error'), t('storage.saveConflict'))
  const [editing, setEditing] = useState<{
    initial: StorageBackend | null
    originalName: string | null
    mirror: { candidates: string[]; initialTargets: string[] }
  } | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<{ name: string; degenerate: boolean } | null>(null)
  const [categoryPicker, setCategoryPicker] = useState<StorageCategory | null>(null)
  const [syncPrompt, setSyncPrompt] = useState<string | null>(null)
  const [migratePrompt, setMigratePrompt] = useState<MigrationCandidate[] | null>(null)
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
      if (error) toast.error(error)
    })
  }, [migrationQueue, admin.state])

  if (admin.loading) {
    return (
      <MAdminCard>
        <p className="font-geist text-[0.75rem] italic text-m-faint">{t('storage.loading')}</p>
      </MAdminCard>
    )
  }
  if (!admin.state || !admin.draft) {
    return (
      <MAdminCard>
        <p role="alert" className="text-[0.8125rem] text-m-ink">{admin.loadError || t('common.error')}</p>
      </MAdminCard>
    )
  }
  const { state, draft } = admin

  const backendNames = [...new Set([...state.backends.map((b) => b.name), ...draft.backends.map((b) => b.name)])]
  const { rows, degenerate } = foldBackends(state, draft)
  const effective = effectiveCategoryMap(state, draft)
  const usageSums = usageByBackend(state, draft)

  const startEdit = (row: FoldedBackendRow) => {
    setEditing({
      initial: row.backend,
      originalName: row.name,
      mirror: {
        candidates: replicaCandidates(rows, row.name, row.mirrorTargets),
        initialTargets: row.mirrorTargets,
      },
    })
  }

  const commitBackend = (backend: StorageBackend, mirrorTargets: string[]) => {
    const renamedFrom = editing?.originalName && editing.originalName !== backend.name ? editing.originalName : null
    // Widened to StorageConfig: these edit helpers are version-blind (they
    // return plain StorageConfig), and admin.setDraft re-attaches the
    // draft's own `version` regardless of what shape it's handed.
    let next: StorageConfig | null = draft
    if (renamedFrom) next = renameBackendRefs(removeBackend(next, renamedFrom), renamedFrom, backend.name)
    next = upsertBackend(next, backend)
    next = setMirrorTargets(state, next, backend.name, mirrorTargets)
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
    const target = adoptedMirrorFor(draft, primaryName)?.name ?? primaryName
    // The admin state's category record is exhaustive by schema contract.
    const stateEntry = state.categories[category]!
    const categories = { ...draft.categories }
    if (stateEntry.source === 'default' && target === stateEntry.backend) {
      delete categories[category]
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

  const moveAndSave = async (candidates: MigrationCandidate[]) => {
    pendingPromptCheck.current = snapshotMirrorTargets()
    const ok = await admin.save(stripCategories(draft, state, candidates.map((c) => c.category)))
    if (ok) {
      setMigrationQueue(candidates)
      toast.success(t('storage.saved'))
    } else {
      pendingPromptCheck.current = null
    }
    setMigratePrompt(null)
  }

  const routeOnlySave = async () => {
    setMigratePrompt(null)
    await doPlainSave()
  }

  const save = async () => {
    const candidates = computeMigrationCandidates(draft, state)
    if (candidates.length > 0) {
      setMigratePrompt(candidates)
      return
    }
    await doPlainSave()
  }

  const handleCancelMigration = async (m: StorageMigrationStatus) => {
    const error = await admin.cancelMigration(m.category)
    if (error) toast.error(error)
  }

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
    <div className="space-y-3">
      <MAdminCard>
        <MAdminCardHead title={t('storage.health.title')} />
        {state.health.replicaFailures.length === 0 ? (
          <p className="font-geist text-[0.75rem] text-m-faint">{t('storage.health.allClear')}</p>
        ) : (
          <div className="space-y-1">
            {state.health.replicaFailures.map((failure) => (
              <p key={`${failure.backend}-${failure.key}-${failure.at}`} className="text-[0.75rem] text-m-ink">
                {t('storage.health.failureLine', {
                  op: failure.op,
                  key: failure.key,
                  backend: failure.backend,
                  error: failure.error,
                })}{' '}
                <span className="text-m-faint">· {relativeTime(failure.at, locale)}</span>
              </p>
            ))}
          </div>
        )}
        {state.seedFilePresent && (
          <p className="mt-1 font-geist text-[0.625rem] text-m-muted">{t('storage.health.seedFile')}</p>
        )}
      </MAdminCard>

      <MAdminCard>
        <MAdminCardHead title={t('storage.backends.title')} hint={t('storage.description')} />
        <div className="mb-2 flex items-center gap-2">
          <p className="font-geist text-[0.625rem] text-m-muted">
            {state.usage
              ? t('storage.usage.computed', { age: relativeTime(state.usage.computedAt, locale) })
              : t('storage.usage.never')}
          </p>
          <MAdminButton variant="ghost" onClick={handleRefreshStats}>
            {state.usage ? t('storage.usage.refresh') : t('storage.usage.compute')}
          </MAdminButton>
        </div>
        <div className="space-y-2">
          {rows.map((row) => {
            const resultKey = row.mirrorName ?? row.name
            const result = admin.testResults[resultKey]
            // row.mirrorName only exists when foldBackends adopted a draft mirror
            // for this row, so the draft lookup below cannot miss.
            const testCandidate = row.mirrorName
              ? draft.backends.find((b) => b.name === row.mirrorName)!
              : row.backend
            const rowUsage = usageSums?.[row.name]
            const backfill = row.mirrorName ? state.backfills.find((b) => b.backend === row.mirrorName) : undefined
            return (
              <div
                key={row.name}
                data-testid={`m-storage-backend-${row.name}`}
                className="rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[0.8125rem] font-bold text-m-ink">{row.name}</span>
                  <span className="rounded-full border border-[color:var(--m-rowbr)] px-2 py-[1px] font-geist text-[0.625rem] text-m-muted">
                    {t(`storage.type.${row.type}`)}
                  </span>
                  <span className="rounded-full border border-[color:var(--m-rowbr)] px-2 py-[1px] font-geist text-[0.625rem] text-m-muted">
                    {t(`storage.source.${row.source}`)}
                  </span>
                </div>
                <p className="mt-1 font-geist text-[0.625rem] text-m-muted">
                  {row.categories.length > 0
                    ? t('storage.backends.usedBy', { categories: categoryNames(t, row.categories) })
                    : t('storage.backends.unused')}
                </p>
                {rowUsage && (
                  <p className="mt-1 font-geist text-[0.625rem] text-m-muted">
                    {t('storage.usage.line', { objects: String(rowUsage.objects), size: formatBytes(rowUsage.bytes) })}
                    {row.name === 'uploads-local' && state.usage!.legacyPhotos.objects > 0
                      ? ` (${t('storage.usage.legacyNote')})`
                      : ''}
                  </p>
                )}
                {row.mirrorTargets.length > 0 && (
                  <p className="mt-1 font-geist text-[0.625rem] text-m-muted">
                    {t('storage.mirror.mirroredTo', { targets: row.mirrorTargets.join(', ') })}
                  </p>
                )}
                {row.replicaOf.length > 0 && (
                  <p className="mt-1 font-geist text-[0.625rem] text-m-muted">
                    {t('storage.mirror.replicaOf', { primaries: row.replicaOf.join(', ') })}
                  </p>
                )}
                {row.source === 'env' && (
                  <p className="mt-1 font-geist text-[0.625rem] text-m-muted">{t('storage.backends.envReadOnly')}</p>
                )}
                <div className="mt-2 flex gap-2">
                  <MAdminButton variant="ghost" onClick={() => admin.test(testCandidate)}>
                    {t('storage.actions.test')}
                  </MAdminButton>
                  {row.source !== 'env' && (
                    <MAdminButton variant="ghost" onClick={() => startEdit(row)}>
                      {t('storage.actions.edit')}
                    </MAdminButton>
                  )}
                  {row.source === 'settings' && (
                    <MAdminButton variant="danger" onClick={() => setConfirmRemove({ name: row.name, degenerate: false })}>
                      {t('storage.actions.remove')}
                    </MAdminButton>
                  )}
                </div>
                {result === 'running' ? (
                  <p className="mt-2 font-geist text-[0.625rem] text-m-muted">{t('storage.test.running')}</p>
                ) : (
                  result && (
                    <div className="mt-2 space-y-0.5">
                      <p className="text-[0.75rem] font-bold text-m-ink">
                        {result.ok ? t('storage.test.ok') : t('storage.test.failed')}
                      </p>
                      {result.targets.map((target) => (
                        <p key={target.name} className="font-geist text-[0.625rem] text-m-muted">
                          {target.ok ? '✓' : '✗'} {target.name}
                          {target.error ? ` — ${target.error}` : ''}
                        </p>
                      ))}
                    </div>
                  )
                )}
                {row.mirrorTargets.length > 0 && (
                  <div className="mt-2">
                    {backfill?.status === 'running' ? (
                      <>
                        <p className="font-geist text-[0.625rem] text-m-muted">
                          {t('storage.sync.running', { done: String(backfill.done), total: String(backfill.total) })}
                        </p>
                        <p className="font-geist text-[0.625rem] text-m-muted">
                          {t('storage.sync.counts', {
                            copied: String(backfill.copied),
                            skipped: String(backfill.skipped),
                            failed: String(backfill.failed),
                          })}
                        </p>
                        <div className="mt-1">
                          <MAdminButton variant="ghost" onClick={() => handleCancelBackfill(row)}>
                            {t('storage.sync.cancel')}
                          </MAdminButton>
                        </div>
                      </>
                    ) : backfill?.status === 'done' ? (
                      <p className="font-geist text-[0.625rem] text-m-muted">
                        {t('storage.sync.done', {
                          copied: String(backfill.copied),
                          deleted: String(backfill.deleted),
                          failed: String(backfill.failed),
                        })}
                      </p>
                    ) : backfill?.status === 'cancelled' ? (
                      <p className="font-geist text-[0.625rem] text-m-muted">{t('storage.sync.cancelled')}</p>
                    ) : backfill?.status === 'error' ? (
                      <p className="font-geist text-[0.625rem] text-m-muted">
                        {t('storage.sync.error', { error: backfill.error ?? '' })}
                      </p>
                    ) : syncPrompt !== row.name ? (
                      <div className="mt-1">
                        <MAdminButton variant="ghost" onClick={() => handleStartBackfill(row)}>
                          {t('storage.sync.now')}
                        </MAdminButton>
                      </div>
                    ) : null}
                  </div>
                )}
                {syncPrompt === row.name && (
                  <div className="mt-2 rounded-lg border border-[color:var(--m-rowbr)] p-2">
                    <p className="text-[0.75rem] text-m-ink">{t('storage.sync.prompt')}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <MAdminButton variant="ghost" onClick={() => handleStartBackfill(row)}>
                        {t('storage.sync.now')}
                      </MAdminButton>
                      <MAdminButton variant="ghost" onClick={() => setSyncPrompt(null)}>
                        {t('storage.sync.dismiss')}
                      </MAdminButton>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {degenerate.map(({ backend, reason }) => {
            const result = admin.testResults[backend.name]
            const primary = backend.type === 'mirror' ? backend.options.primary : ''
            return (
              <div
                key={backend.name}
                data-testid={`m-storage-backend-${backend.name}`}
                className="rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[0.8125rem] font-bold text-m-ink">{backend.name}</span>
                  <span className="rounded-full border border-[color:var(--m-rowbr)] px-2 py-[1px] font-geist text-[0.625rem] text-m-muted">
                    {t('storage.type.mirror')}
                  </span>
                </div>
                <p className="mt-1 font-geist text-[0.625rem] text-m-muted">
                  {t(`storage.mirror.degenerate.${reason}`, { primary })}
                </p>
                <div className="mt-2 flex gap-2">
                  <MAdminButton variant="ghost" onClick={() => admin.test(backend)}>
                    {t('storage.actions.test')}
                  </MAdminButton>
                  <MAdminButton variant="danger" onClick={() => setConfirmRemove({ name: backend.name, degenerate: true })}>
                    {t('storage.actions.remove')}
                  </MAdminButton>
                </div>
                {result === 'running' ? (
                  <p className="mt-2 font-geist text-[0.625rem] text-m-muted">{t('storage.test.running')}</p>
                ) : (
                  result && (
                    <div className="mt-2 space-y-0.5">
                      <p className="text-[0.75rem] font-bold text-m-ink">
                        {result.ok ? t('storage.test.ok') : t('storage.test.failed')}
                      </p>
                      {result.targets.map((target) => (
                        <p key={target.name} className="font-geist text-[0.625rem] text-m-muted">
                          {target.ok ? '✓' : '✗'} {target.name}
                          {target.error ? ` — ${target.error}` : ''}
                        </p>
                      ))}
                    </div>
                  )
                )}
              </div>
            )
          })}

          {state.migrations.map((m) => (
            <div
              key={m.category}
              data-testid={`m-storage-migration-${m.category}`}
              className="rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] p-3"
            >
              <p className="text-[0.8125rem] font-bold text-m-ink">{t(`storage.category.${m.category}`)}</p>
              {m.status === 'running' ? (
                <>
                  <p className="mt-1 font-geist text-[0.625rem] text-m-muted">
                    {t('storage.migrate.running', {
                      category: t(`storage.category.${m.category}`),
                      done: String(m.done),
                      total: String(m.total),
                    })}
                  </p>
                  <div className="mt-1">
                    <MAdminButton variant="ghost" onClick={() => void handleCancelMigration(m)}>
                      {t('storage.migrate.cancel')}
                    </MAdminButton>
                  </div>
                </>
              ) : m.status === 'done' ? (
                <>
                  <p className="mt-1 font-geist text-[0.625rem] text-m-muted">
                    {t('storage.migrate.done', { copied: String(m.copied), skipped: String(m.skipped) })}
                  </p>
                  {m.failed > 0 && (
                    <p className="mt-1 font-geist text-[0.625rem] text-m-muted">
                      {t('storage.migrate.doneFailures', { failed: String(m.failed) })}
                    </p>
                  )}
                  {m.reclaimable && (
                    <p className="mt-1 font-geist text-[0.625rem] text-m-muted">
                      {t('storage.migrate.reclaimable', {
                        objects: String(m.reclaimable.objects),
                        size: formatBytes(m.reclaimable.bytes),
                        from: m.from,
                      })}
                    </p>
                  )}
                </>
              ) : m.status === 'failed' ? (
                <p className="mt-1 font-geist text-[0.625rem] text-m-muted">
                  {t('storage.migrate.failed', { error: m.error ?? '' })}
                </p>
              ) : (
                <p className="mt-1 font-geist text-[0.625rem] text-m-muted">{t('storage.migrate.cancelled')}</p>
              )}
            </div>
          ))}
        </div>
        {editing === null && (
          <div className="mt-3">
            <MAdminButton
              onClick={() =>
                setEditing({
                  initial: null,
                  originalName: null,
                  mirror: { candidates: replicaCandidates(rows, null), initialTargets: [] },
                })
              }
            >
              {t('storage.backends.add')}
            </MAdminButton>
          </div>
        )}
      </MAdminCard>

      {editing !== null && (
        <MBackendForm
          initial={editing.initial}
          backendNames={backendNames}
          mirror={editing.mirror}
          onCommit={commitBackend}
          onCancel={() => setEditing(null)}
        />
      )}

      <MAdminCard>
        <MAdminCardHead title={t('storage.categories.title')} />
        <div className="space-y-2">
          {STORAGE_CATEGORIES.map((category) => {
            // The admin state's category record is exhaustive by schema contract.
            const stateEntry = state.categories[category]!
            const selectedPrimary = primaryNameOf(state, draft, effective[category])
            const changed = selectedPrimary !== primaryNameOf(state, draft, stateEntry.backend)
            const viaMirror = effective[category] !== selectedPrimary
            return (
              <MAdminField
                key={category}
                label={
                  <>
                    {t(`storage.category.${category}`)}{' '}
                    <span className="rounded border border-[color:var(--m-rowbr)] px-1 font-geist text-[0.625rem] font-normal text-m-faint">
                      {category}
                    </span>
                  </>
                }
                hint={t(`storage.categoryDesc.${category}`)}
              >
                {state.usage?.categories[category] && (
                  <p className="mb-1 font-geist text-[0.625rem] text-m-muted">
                    {t('storage.usage.line', {
                      objects: String(state.usage.categories[category]!.objects),
                      size: formatBytes(state.usage.categories[category]!.bytes),
                    })}
                  </p>
                )}
                <div data-testid={`m-storage-category-${category}`} className="contents">
                  <MSetSelectRow
                    label={
                      stateEntry.source === 'default' && selectedPrimary === stateEntry.backend
                        ? `${selectedPrimary} (${t('storage.categories.default')})`
                        : selectedPrimary
                    }
                    trailing={<ChevronDown size={14} className="text-m-faint" />}
                    onClick={() => setCategoryPicker(category)}
                  />
                </div>
                {changed && (
                  <p role="alert" className="mt-1 font-geist text-[0.625rem] text-m-muted">
                    {t('storage.categories.reassignWarning')}
                  </p>
                )}
                {viaMirror && CACHE_CATEGORIES.includes(category) && (
                  <p role="note" className="mt-1 font-geist text-[0.625rem] text-m-muted">
                    {t('storage.mirror.cacheWarning')}
                  </p>
                )}
              </MAdminField>
            )
          })}
        </div>
        <MSetPickerSheet
          open={categoryPicker !== null}
          onClose={() => setCategoryPicker(null)}
          title={categoryPicker ? t(`storage.category.${categoryPicker}`) : ''}
          options={rows.map((row) => ({ value: row.name, label: row.name }))}
          value={categoryPicker ? primaryNameOf(state, draft, effective[categoryPicker]) : ''}
          onSelect={(name) => {
            if (categoryPicker) setCategory(categoryPicker, name)
          }}
        />
      </MAdminCard>

      <div className="flex items-center gap-2">
        <MAdminButton onClick={save} disabled={!admin.dirty} busy={admin.saving}>
          {t('storage.save')}
        </MAdminButton>
        {admin.dirty && <span className="font-geist text-[0.625rem] text-m-muted">{t('storage.unsaved')}</span>}
      </div>
      {migratePrompt && (
        <div role="alertdialog">
          <MAdminCard>
            <p className="text-[0.8125rem] text-m-ink">{t('storage.migrate.promptTitle')}</p>
            {migratePrompt.map((c) => (
              <p key={c.category} className="mt-1 font-geist text-[0.625rem] text-m-muted">
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
            <div className="mt-2 flex items-center gap-2">
              <MAdminButton variant="ghost" onClick={() => void moveAndSave(migratePrompt)}>
                {t('storage.migrate.move')}
              </MAdminButton>
              <MAdminButton variant="ghost" onClick={() => void routeOnlySave()}>
                {t('storage.migrate.routeOnly')}
              </MAdminButton>
            </div>
          </MAdminCard>
        </div>
      )}
      {admin.saveError && (
        <div role="alert" className="text-[0.8125rem] text-m-ink">
          <p>{admin.saveError}</p>
          {/* A 409 pins the draft to a version the server moved past — saving
              again can never clear it, so offer the one action that can. */}
          {admin.saveConflict && (
            <MAdminButton variant="ghost" onClick={() => void admin.discardDraft()}>
              {t('storage.discardAndReload')}
            </MAdminButton>
          )}
        </div>
      )}

      <MConfirmSheet
        open={confirmRemove !== null}
        onClose={() => setConfirmRemove(null)}
        title={t('storage.remove.title')}
        message={confirmRemove ? removeMessage(confirmRemove.name, confirmRemove.degenerate) : ''}
        confirmLabel={t('storage.actions.remove')}
        cancelLabel={t('storage.form.cancel')}
        danger
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
      />
    </div>
  )
}
