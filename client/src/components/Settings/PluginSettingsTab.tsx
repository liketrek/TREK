import { useEffect, useState } from 'react'
import { Blocks, Save, Loader2, Link2, Unlink, CheckCircle } from 'lucide-react'
import { pluginsApi, type PluginUserSettingField, type PluginAction } from '../../api/client'
import { usePluginStore } from '../../store/pluginStore'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import PluginActivityPanel from './PluginActivityPanel'

/** Host-brokered OAuth: a Connect/Disconnect control. The host runs the whole flow +
 * holds the tokens; this only triggers connect (redirect to the provider) / disconnect. */
function PluginOAuthSection({ id, state, setState }: {
  id: string
  state: { configured: boolean; connected: boolean } | null
  setState: (s: { configured: boolean; connected: boolean }) => void
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  if (!state?.configured) return null

  const connect = async () => {
    setBusy(true)
    try {
      const { authorizeUrl } = await pluginsApi.oauthConnect(id)
      window.location.href = authorizeUrl // hand off to the provider; returns to /settings
    } catch {
      toast.error(t('common.error')); setBusy(false)
    }
  }
  const disconnect = async () => {
    setBusy(true)
    try { await pluginsApi.oauthDisconnect(id); setState({ ...state, connected: false }) }
    catch { toast.error(t('common.error')) }
    finally { setBusy(false) }
  }

  return (
    <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-surface-secondary px-3 py-2">
      <span className="flex items-center gap-2 text-sm text-content-secondary">
        {state.connected
          ? <><CheckCircle className="w-4 h-4 text-success" /> {t('settings.plugins.oauth.connected')}</>
          : <>{t('settings.plugins.oauth.notConnected')}</>}
      </span>
      {state.connected
        ? <button onClick={disconnect} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-content disabled:opacity-60"><Unlink className="w-4 h-4" />{t('settings.plugins.oauth.disconnect')}</button>
        : <button onClick={connect} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}{t('settings.plugins.oauth.connect')}</button>}
    </div>
  )
}

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
  const [oauth, setOauth] = useState<{ configured: boolean; connected: boolean } | null>(null)
  const [actions, setActions] = useState<PluginAction[]>([])
  const [running, setRunning] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<Record<string, { ok: boolean; message?: string }>>({})

  useEffect(() => {
    let alive = true
    pluginsApi.userSettings(id)
      .then(r => {
        if (!alive) return
        setFields(r.fields)
        setActions(r.actions ?? [])
        const init: Record<string, string | boolean> = {}
        for (const f of r.fields) {
          const v = r.config[f.key]
          init[f.key] = f.input_type === 'checkbox' ? v === true : (v == null ? '' : String(v))
        }
        setValues(init)
      })
      .catch(() => { if (alive) setFields([]) })
    pluginsApi.oauthStatus(id).then(s => { if (alive) setOauth(s) }).catch(() => { if (alive) setOauth(null) })
    return () => { alive = false }
  }, [id])

  const hasFields = (fields?.length ?? 0) > 0
  // Show the card if the plugin has user fields, actions, OR an OAuth connection to offer.
  if (fields === null || (!hasFields && actions.length === 0 && !oauth?.configured)) return null

  // An action runs AS the caller, so it sees the values they just saved — run the save
  // first if the form is dirty would be nicer, but keeping it explicit is less surprising.
  const runAction = async (a: PluginAction) => {
    if (a.danger && !window.confirm(t('settings.plugins.actions.confirm'))) return
    setRunning(a.key)
    try {
      const res = await pluginsApi.runAction(id, a.key)
      setActionResult(prev => ({ ...prev, [a.key]: res }))
    } catch {
      setActionResult(prev => ({ ...prev, [a.key]: { ok: false, message: t('common.error') } }))
    } finally {
      setRunning(null)
    }
  }

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
        {(fields ?? []).map(f => (
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
      {hasFields && (
        <button
          onClick={save}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t('common.save')}
        </button>
      )}
      {actions.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <span className="block text-xs font-semibold uppercase tracking-wide text-content-muted mb-2">
            {t('settings.plugins.actions')}
          </span>
          <div className="flex flex-col gap-2">
            {actions.map(a => {
              const res = actionResult[a.key]
              return (
                <div key={a.key} className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => runAction(a)}
                    disabled={running !== null}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold disabled:opacity-60 ${
                      a.danger ? 'border-danger text-danger' : 'border-border text-content'
                    }`}
                  >
                    {running === a.key && <Loader2 className="w-4 h-4 animate-spin" />}
                    {a.label}
                  </button>
                  {a.hint && <span className="text-xs text-content-muted">{a.hint}</span>}
                  {res && (
                    <span className={`text-xs font-medium ${res.ok ? 'text-success' : 'text-danger'}`}>
                      {res.message || (res.ok ? t('common.success') : t('common.error'))}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      <PluginOAuthSection id={id} state={oauth} setState={setOauth} />
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
      <PluginActivityPanel />
    </div>
  )
}
