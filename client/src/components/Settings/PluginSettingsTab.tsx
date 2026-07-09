import { useEffect, useState } from 'react'
import { Blocks, Save, Loader2 } from 'lucide-react'
import { pluginsApi, type PluginUserSettingField } from '../../api/client'
import { usePluginStore } from '../../store/pluginStore'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'

const SECRET_MASK = '••••••••'

/**
 * A user's own per-plugin settings (#plugins). The host renders the plugin's
 * declared `scope:'user'` fields as an editable form — a plugin never ships markup
 * here; the field list is trusted, validated manifest data. Secrets stay write-only
 * (masked, never echoed back). One form per active plugin that declares user fields.
 */
function PluginSettingsForm({ id, name }: { id: string; name: string }) {
  const { t } = useTranslation()
  const toast = useToast()
  const [fields, setFields] = useState<PluginUserSettingField[] | null>(null)
  const [values, setValues] = useState<Record<string, string | boolean>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    pluginsApi.userSettings(id)
      .then(r => {
        if (!alive) return
        setFields(r.fields)
        const init: Record<string, string | boolean> = {}
        for (const f of r.fields) {
          const v = r.config[f.key]
          init[f.key] = f.input_type === 'checkbox' ? v === true : (v == null ? '' : String(v))
        }
        setValues(init)
      })
      .catch(() => { if (alive) setFields([]) })
    return () => { alive = false }
  }, [id])

  if (fields === null || fields.length === 0) return null

  const save = async () => {
    setSaving(true)
    try {
      // Skip an untouched secret (still shows the mask) so we never overwrite it with the mask.
      const patch: Record<string, unknown> = {}
      for (const f of fields) {
        const v = values[f.key]
        if (f.secret && v === SECRET_MASK) continue
        patch[f.key] = v
      }
      const r = await pluginsApi.saveUserSettings(id, patch)
      const next: Record<string, string | boolean> = {}
      for (const f of fields) {
        const v = r.config[f.key]
        next[f.key] = f.input_type === 'checkbox' ? v === true : (v == null ? '' : String(v))
      }
      setValues(next)
      toast.success(t('settings.plugins.saved'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <Blocks className="w-4 h-4 text-content-secondary" />
        <h3 className="text-sm font-semibold text-content">{name}</h3>
      </div>
      <div className="space-y-4">
        {fields.map(f => (
          <label key={f.key} className="block">
            <span className="block text-sm font-medium text-content-secondary mb-1">
              {f.label || f.key}{f.required && <span className="text-danger"> *</span>}
            </span>
            {f.input_type === 'checkbox' ? (
              <input
                type="checkbox"
                checked={values[f.key] === true}
                onChange={e => setValues(v => ({ ...v, [f.key]: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
            ) : f.input_type === 'select' && f.options ? (
              <select
                value={String(values[f.key] ?? '')}
                onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-content"
              >
                <option value="">—</option>
                {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input
                type={f.secret ? 'password' : (f.input_type === 'number' ? 'number' : 'text')}
                value={String(values[f.key] ?? '')}
                placeholder={f.placeholder || ''}
                autoComplete={f.secret ? 'new-password' : 'off'}
                onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-content"
              />
            )}
            {f.hint && <span className="block text-xs text-content-muted mt-1">{f.hint}</span>}
          </label>
        ))}
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {t('common.save')}
      </button>
    </div>
  )
}

export default function PluginSettingsTab() {
  const { t } = useTranslation()
  const plugins = usePluginStore(s => s.plugins)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-content">{t('settings.plugins.title')}</h2>
        <p className="text-sm text-content-muted">{t('settings.plugins.subtitle')}</p>
      </div>
      {plugins.length === 0
        ? <p className="text-sm text-content-muted">{t('settings.plugins.empty')}</p>
        : plugins.map(p => <PluginSettingsForm key={p.id} id={p.id} name={p.name} />)}
    </div>
  )
}
