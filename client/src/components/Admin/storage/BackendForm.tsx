import React, { useState } from 'react'
import {
  STORAGE_BACKEND_TYPES,
  STORAGE_BACKEND_TYPE_IDS,
  type StorageBackend,
  type StorageBackendFieldDef,
  type StorageBackendTypeId,
} from '@trek/shared'
import { useTranslation } from '../../../i18n'
import CustomSelect from '../../shared/CustomSelect'

type FieldValues = Record<string, string | string[]>

function valuesOf(backend: StorageBackend | null): FieldValues {
  if (!backend) return {}
  const values: FieldValues = {}
  for (const [key, value] of Object.entries(backend.options)) {
    values[key] = Array.isArray(value) ? value : String(value)
  }
  return values
}

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

const LABEL_CLASS = 'block text-sm font-medium mb-1.5 text-content-secondary'
const INPUT_CLASS =
  'mt-1.5 w-full px-3 py-2 border rounded-lg text-sm border-edge bg-surface-card text-content'

/**
 * Renders whatever STORAGE_BACKEND_TYPES declares, by field kind. The raw
 * `mirror` type is hidden from the type select — mirrors are composed via the
 * Mirror-targets prop block and synthesized by the panels (the ref-kind
 * renderers below stay for future registry types).
 */
export default function BackendForm({
  initial,
  backendNames,
  mirror,
  onCommit,
  onCancel,
}: BackendFormProps): React.ReactElement {
  const { t } = useTranslation()
  const [type, setType] = useState<StorageBackendTypeId>(initial?.type ?? 'local')
  const [name, setName] = useState(initial?.name ?? '')
  const [values, setValues] = useState<FieldValues>(() => valuesOf(initial))
  const [targets, setTargets] = useState<string[]>(mirror?.initialTargets ?? [])

  const fields = STORAGE_BACKEND_TYPES[type].fields as readonly StorageBackendFieldDef[]
  const refOptions = backendNames.filter((candidate) => candidate !== name.trim())
  const setValue = (key: string, value: string | string[]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const filled = (field: StorageBackendFieldDef): boolean => {
    const value = values[field.key]
    if (field.kind === 'backend-ref-list') return Array.isArray(value) && value.length > 0
    return typeof value === 'string' && value.trim() !== ''
  }
  const duplicate = name.trim() !== (initial?.name ?? '') && backendNames.includes(name.trim())
  const canApply =
    name.trim() !== '' && !duplicate && fields.every((f) => !f.required || filled(f))

  const apply = () => {
    const options: Record<string, unknown> = {}
    for (const field of fields) {
      const value = values[field.key]
      if (field.kind === 'backend-ref-list') {
        options[field.key] = Array.isArray(value) ? value : []
        continue
      }
      const text = typeof value === 'string' ? value : ''
      if (text === '' && !field.required) continue // omitted → the shared schema default applies
      options[field.key] = field.kind === 'number' ? Number(text) : text
    }
    // The options were built from the same field defs the schema is generated
    // from — this is the same sanctioned cast storageModel.asWireBackend makes.
    const payload = { name: name.trim(), type, options } as StorageBackend
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
        <div key={field.key}>
          <span className={LABEL_CLASS}>{t(field.labelKey)}</span>
          <CustomSelect
            value={typeof value === 'string' ? value : ''}
            onChange={(next) => setValue(field.key, String(next))}
            options={refOptions.map((candidate) => ({ value: candidate, label: candidate }))}
            placeholder={t(field.labelKey)}
            size="sm"
          />
        </div>
      )
    }
    if (field.kind === 'backend-ref-list') {
      const selected = Array.isArray(value) ? value : []
      return (
        <div key={field.key}>
          <span className={LABEL_CLASS}>{t(field.labelKey)}</span>
          <div className="space-y-1">
            {refOptions.map((candidate) => (
              <label key={candidate} className="flex items-center gap-2 text-sm text-content">
                <input
                  type="checkbox"
                  checked={selected.includes(candidate)}
                  onChange={(e) =>
                    setValue(
                      field.key,
                      e.target.checked
                        ? [...selected, candidate]
                        : selected.filter((existing) => existing !== candidate),
                    )
                  }
                />
                {candidate}
              </label>
            ))}
          </div>
        </div>
      )
    }
    const inputType = field.kind === 'secret' ? 'password' : field.kind === 'number' ? 'number' : 'text'
    return (
      <label key={field.key} className={LABEL_CLASS}>
        {t(field.labelKey)}
        <input
          type={inputType}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => setValue(field.key, e.target.value)}
          placeholder={field.defaultValue !== undefined ? String(field.defaultValue) : ''}
          spellCheck={false}
          autoComplete="off"
          className={INPUT_CLASS}
        />
        {field.helpKey && <span className="block text-xs mt-1 font-normal text-content-faint">{t(field.helpKey)}</span>}
      </label>
    )
  }

  return (
    <div className="rounded-xl border p-4 space-y-4 border-edge bg-surface-card">
      <p className="text-sm font-semibold text-content">
        {initial ? t('storage.form.editTitle') : t('storage.form.addTitle')}
      </p>

      <label className={LABEL_CLASS}>
        {t('storage.form.name')}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          className={INPUT_CLASS}
        />
      </label>
      {duplicate && (
        <p className="text-xs text-content-faint" role="alert">
          {t('storage.form.duplicateName', { name: name.trim() })}
        </p>
      )}

      <div>
        <span className={LABEL_CLASS}>{t('storage.form.type')}</span>
        <CustomSelect
          value={type}
          onChange={(next) => {
            setType(next as StorageBackendTypeId)
            setValues({}) // a different type has different fields
          }}
          options={STORAGE_BACKEND_TYPE_IDS.filter((id) => id !== 'mirror').map((id) => ({
            value: id,
            label: t(`storage.type.${id}`),
          }))}
          size="sm"
          disabled={initial !== null}
        />
      </div>

      {fields.map(renderField)}

      {mirror && (
        <div>
          <span className={LABEL_CLASS}>{t('storage.mirror.targets')}</span>
          <p className="text-xs mb-1 text-content-faint">{t('storage.mirror.targetsHelp')}</p>
          <div className="space-y-1">
            {mirror.candidates
              .filter((candidate) => candidate !== name.trim())
              .map((candidate) => (
                <label key={candidate} className="flex items-center gap-2 text-sm text-content">
                  <input
                    type="checkbox"
                    checked={targets.includes(candidate)}
                    onChange={(e) =>
                      setTargets(
                        e.target.checked
                          ? [...targets, candidate]
                          : targets.filter((existing) => existing !== candidate),
                      )
                    }
                  />
                  {candidate}
                </label>
              ))}
          </div>
          {targets.length > 0 && (
            <p className="text-xs mt-1 text-content-faint" role="note">
              {t('storage.mirror.latencyNote')}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="button"
          onClick={apply}
          disabled={!canApply}
          style={{
            padding: '8px 20px', borderRadius: 10, cursor: canApply ? 'pointer' : 'default',
            fontFamily: 'inherit', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 600,
            border: '2px solid var(--text-primary)', background: 'var(--bg-hover)',
            color: 'var(--text-primary)', opacity: canApply ? 1 : 0.5,
          }}
        >
          {t('storage.form.apply')}
        </button>
        <button type="button"
          onClick={onCancel}
          style={{
            padding: '8px 20px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500,
            border: '2px solid var(--border-primary)', background: 'var(--bg-card)', color: 'var(--text-primary)',
          }}
        >
          {t('storage.form.cancel')}
        </button>
      </div>
    </div>
  )
}
