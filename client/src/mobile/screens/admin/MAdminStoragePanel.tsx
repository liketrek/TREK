import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  STORAGE_BACKEND_TYPE_IDS,
  STORAGE_CATEGORIES,
  type StorageBackend,
  type StorageBackendTypeId,
  type StorageCategory,
} from '@trek/shared'
import { useTranslation } from '../../../i18n'
import { formatBytes } from '../../../utils/formatBytes'
import { relativeTime } from '../../../utils/relativeTime'
import { CACHE_CATEGORIES, primaryNameOf } from '../../../components/Admin/storage/storageModel'
import { useBackendForm } from '../../../components/Admin/storage/useBackendForm'
import { categoryNames, migrationPromptLine, useStoragePanel } from '../../../components/Admin/storage/useStoragePanel'
import MToggle from '../../components/MToggle'
import MStorageTestResult from '../../components/MStorageTestResult'
import MSetPickerSheet from '../settings/MSetPickerSheet'
import MConfirmSheet from '../settings/MConfirmSheet'
import { MSetSelectRow } from '../settings/MSettingsUi'
import { MAdminButton, MAdminCard, MAdminCardHead, MAdminField, MAdminInput, MAdminSecretInput } from './MAdminUi'

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
  const {
    type, changeType, name, setName, values, setValue, toggleRef, targets, toggleTarget, fields, refOptions,
    duplicate, canApply, buildBackend, visibleCandidates,
  } = useBackendForm({ initial, backendNames, mirror })
  const [picker, setPicker] = useState<string | null>(null)

  const apply = () => onCommit(buildBackend(), targets)

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
            onSelect={(next) => changeType(next as StorageBackendTypeId)}
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
                      onChange={(checked) => toggleRef(field.key, candidate, checked)}
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
          {visibleCandidates.map((candidate) => (
              <div key={candidate} className="flex items-center justify-between gap-2">
                <span className="text-[0.8125rem] font-semibold text-m-ink">{candidate}</span>
                <MToggle
                  checked={targets.includes(candidate)}
                  ariaLabel={candidate}
                  onChange={(checked) => toggleTarget(candidate, checked)}
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
  const {
    admin, editing, setEditing, confirmRemove, setConfirmRemove, syncPrompt, setSyncPrompt, migratePrompt,
    handleCancelMigration, handleRefreshStats, handleStartBackfill, handleCancelBackfill, loaded,
  } = useStoragePanel()
  const [categoryPicker, setCategoryPicker] = useState<StorageCategory | null>(null)

  if (admin.loading) {
    return (
      <MAdminCard>
        <p className="font-geist text-[0.75rem] italic text-m-faint">{t('storage.loading')}</p>
      </MAdminCard>
    )
  }
  if (!loaded) {
    return (
      <MAdminCard>
        <p role="alert" className="text-[0.8125rem] text-m-ink">{admin.loadError || t('common.error')}</p>
      </MAdminCard>
    )
  }
  const {
    state, draft, backendNames, rows, degenerate, effective, usageSums, startAdd, startEdit, testRow, commitBackend,
    removeMessage, confirmRemoval, setCategory, save, moveAndSave, routeOnlySave,
  } = loaded

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
                    {t('storage.usage.line', { count: rowUsage.objects, size: formatBytes(rowUsage.bytes) })}
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
                  <MAdminButton variant="ghost" onClick={() => void testRow(row)}>
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
                <MStorageTestResult result={result} />
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
                <MStorageTestResult result={result} />
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
                        count: m.reclaimable.objects,
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
              onClick={startAdd}
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
                      count: state.usage.categories[category]!.objects,
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
                {migrationPromptLine(t, c)}
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
        onConfirm={confirmRemoval}
      />
    </div>
  )
}
