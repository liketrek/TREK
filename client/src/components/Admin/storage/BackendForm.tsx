import React, { useId } from 'react'
import { HardDrive } from 'lucide-react'
import {
  STORAGE_BACKEND_TYPE_IDS,
  type StorageBackend,
  type StorageBackendFieldDef,
  type StorageBackendTypeId,
} from '@trek/shared'
import { useTranslation } from '../../../i18n'
import CustomSelect from '../../shared/CustomSelect'
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogShell,
  DialogTile,
  FooterSpacer,
  NEUTRAL_TINT,
  fs,
} from '../../shared/DialogShell'
import { EditorField, GRID_2, INPUT } from '../../shared/dialogParts'
import { useBackendForm } from './useBackendForm'

export interface BackendFormMirrorProps {
  /** Selectable replica targets (the form excludes its own name at render). */
  candidates: string[]
  initialTargets: string[]
}

interface BackendFormProps {
  /** null = new backend */
  initial: StorageBackend | null
  /** Every defined backend name — mirror-target options and the duplicate pre-check. */
  backendNames: string[]
  /**
   * Present on non-mirror backends: renders the Mirror-targets composer
   * (replicas-on-primary — panel-supplied chrome, never a registry field).
   * When present, onCommit's second argument is always an array.
   */
  mirror?: BackendFormMirrorProps
  onCommit: (backend: StorageBackend, mirrorTargets?: string[]) => void
  onCancel: () => void
}

/** A box of checkbox rows, the white list the settings cards use. */
const CHECK_ROWS = 'divide-y divide-edge-faint overflow-hidden rounded-[12px] border border-edge-faint bg-surface-card'
const CHECK_ROW = 'flex cursor-pointer items-center gap-3 px-3.5 py-2.5 text-content hover:bg-surface-secondary'
const CHECKBOX = 'h-4 w-4 flex-none cursor-pointer accent-accent'

/**
 * Renders whatever STORAGE_BACKEND_TYPES declares, by field kind. The raw
 * `mirror` type is hidden from the type select — mirrors are composed via the
 * Mirror-targets prop block and synthesized by the panels (the ref-kind
 * renderers below stay for future registry types). Drawn as the planner's
 * editor dialog: head band, fields under eyebrows, the answers in the footer.
 */
export default function BackendForm({
  initial,
  backendNames,
  mirror,
  onCommit,
  onCancel,
}: BackendFormProps): React.ReactElement {
  const { t } = useTranslation()
  const labelId = useId()
  const fieldId = (key: string) => `${labelId}-${key}`
  const {
    type, changeType, name, setName, values, setValue, toggleRef, targets, toggleTarget, fields, refOptions,
    duplicate, canApply, buildBackend, visibleCandidates,
  } = useBackendForm({ initial, backendNames, mirror })

  const apply = () => {
    const payload = buildBackend()
    // Arity matters: the landed tests pin single-argument calls when no mirror
    // block is supplied (toHaveBeenCalledWith treats a trailing undefined as a
    // mismatch), so the second argument exists only when the composer does.
    if (mirror) onCommit(payload, targets)
    else onCommit(payload)
  }

  const renderField = (field: StorageBackendFieldDef): React.ReactElement => {
    const value = values[field.key]
    if (field.kind === 'backend-ref') {
      return (
        <EditorField key={field.key} label={t(field.labelKey)}>
          <CustomSelect
            value={typeof value === 'string' ? value : ''}
            onChange={(next) => setValue(field.key, String(next))}
            options={refOptions.map((candidate) => ({ value: candidate, label: candidate }))}
            placeholder={t(field.labelKey)}
            size="sm"
          />
        </EditorField>
      )
    }
    if (field.kind === 'backend-ref-list') {
      const selected = Array.isArray(value) ? value : []
      return (
        <EditorField key={field.key} label={t(field.labelKey)} className="col-span-full">
          <div className={CHECK_ROWS}>
            {refOptions.map((candidate) => (
              <label key={candidate} className={CHECK_ROW} style={fs(13, 'body')}>
                <input
                  type="checkbox"
                  className={CHECKBOX}
                  checked={selected.includes(candidate)}
                  onChange={(e) => toggleRef(field.key, candidate, e.target.checked)}
                />
                <span className="min-w-0 truncate font-geist">{candidate}</span>
              </label>
            ))}
          </div>
        </EditorField>
      )
    }
    const inputType = field.kind === 'secret' ? 'password' : field.kind === 'number' ? 'number' : 'text'
    return (
      <EditorField
        key={field.key}
        label={t(field.labelKey)}
        htmlFor={fieldId(field.key)}
        hint={field.helpKey ? t(field.helpKey) : undefined}
      >
        <input
          id={fieldId(field.key)}
          type={inputType}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => setValue(field.key, e.target.value)}
          placeholder={field.defaultValue !== undefined ? String(field.defaultValue) : ''}
          spellCheck={false}
          autoComplete="off"
          className={`${INPUT} ${inputType === 'number' ? 'tabular-nums' : ''}`}
        />
      </EditorField>
    )
  }

  return (
    <DialogShell
      onClose={onCancel}
      labelledBy={labelId}
      width="editor"
      align="top"
      discardGuard={{ name, type, values, targets }}
      header={
        <DialogHeader
          tile={<DialogTile><HardDrive size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onCancel}
          title={initial ? t('storage.form.editTitle') : t('storage.form.addTitle')}
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onCancel}>{t('storage.form.cancel')}</DialogButton>
          <DialogButton variant="primary" onClick={apply} disabled={!canApply}>
            {t('storage.form.apply')}
          </DialogButton>
        </DialogFooter>
      }
    >
      <div className={GRID_2}>
        <div className="min-w-0">
          <EditorField label={t('storage.form.name')} htmlFor={fieldId('name')}>
            <input
              id={fieldId('name')}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              className={`${INPUT} font-geist`}
            />
          </EditorField>
          {duplicate && (
            <p className="m-0 mt-1 text-danger" style={fs(11)} role="alert">
              {t('storage.form.duplicateName', { name: name.trim() })}
            </p>
          )}
        </div>

        <EditorField label={t('storage.form.type')}>
          <CustomSelect
            value={type}
            onChange={(next) => changeType(next as StorageBackendTypeId)}
            options={STORAGE_BACKEND_TYPE_IDS.filter((id) => id !== 'mirror').map((id) => ({
              value: id,
              label: t(`storage.type.${id}`),
            }))}
            size="sm"
            disabled={initial !== null}
          />
        </EditorField>
      </div>

      {fields.length > 0 && <div className={GRID_2}>{fields.map(renderField)}</div>}

      {mirror && (
        <DialogSection label={t('storage.mirror.targets')}>
          <p className="m-0 mb-2.5 leading-normal text-content-faint" style={fs(11.5)}>{t('storage.mirror.targetsHelp')}</p>
          {visibleCandidates.length > 0 && (
            <div className={CHECK_ROWS}>
              {visibleCandidates.map((candidate) => (
                <label key={candidate} className={CHECK_ROW} style={fs(13, 'body')}>
                  <input
                    type="checkbox"
                    className={CHECKBOX}
                    checked={targets.includes(candidate)}
                    onChange={(e) => toggleTarget(candidate, e.target.checked)}
                  />
                  <span className="min-w-0 truncate font-geist">{candidate}</span>
                </label>
              ))}
            </div>
          )}
          {targets.length > 0 && (
            <p className="m-0 mt-2.5 rounded-[12px] bg-warning-soft px-3 py-2 leading-normal text-warning" style={fs(11.5, 'body')} role="note">
              {t('storage.mirror.latencyNote')}
            </p>
          )}
        </DialogSection>
      )}
    </DialogShell>
  )
}
