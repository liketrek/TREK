import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { Save, Loader2, Link2, Unlink, CheckCircle, Puzzle, Zap } from 'lucide-react'
import { resolvePluginIcon } from '../shared/PluginIcon'
import CustomSelect from '../shared/CustomSelect'
import ConfirmDialog from '../shared/ConfirmDialog'
import { fs } from '../shared/DialogShell'
import { EditorField, INPUT } from '../shared/dialogParts'
import { SettingRow, SettingRows, SettingsCard, SettingsHint, SETTINGS_BUTTON, SETTINGS_BUTTON_DANGER, SETTINGS_BUTTON_PRIMARY } from './settingsKit'
import PluginFrame from '../Plugins/PluginFrame'
import { pluginsApi, type PluginUserSettingField, type PluginAction } from '../../api/client'
import { usePluginStore } from '../../store/pluginStore'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import PluginActivityPanel from './PluginActivityPanel'
import { seedSettingsValues, findMissingRequired, settingsPatch } from '../Plugins/settingsForm'

type FieldGroup = { kind: 'switches' | 'fields'; fields: PluginUserSettingField[] }

/** Runs of on/off fields become one box of switch rows; everything else stays a field. */
function groupFields(fields: PluginUserSettingField[]): FieldGroup[] {
  const groups: FieldGroup[] = []
  for (const f of fields) {
    const kind = f.input_type === 'checkbox' ? 'switches' : 'fields'
    const last = groups[groups.length - 1]
    if (last && last.kind === kind) last.fields.push(f)
    else groups.push({ kind, fields: [f] })
  }
  return groups
}

/**
 * A declared checkbox in the look of ToggleSwitch. It stays a real checkbox
 * underneath, so a label points at it and assistive tech reads it as one.
 */
function CheckSwitch({ id, checked, onChange }: { id: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <span className="relative inline-flex h-6 w-11 flex-none">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0"
      />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full bg-[color:var(--border-primary)] transition-colors peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-[color:var(--text-primary)]" />
      <span aria-hidden="true" className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-surface-card shadow-sm transition-[left] duration-200 peer-checked:left-[22px] peer-checked:bg-[color:var(--accent-text)]" />
    </span>
  )
}

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
    <SettingRows>
      <SettingRow
        label={state.connected
          ? <span className="inline-flex items-center gap-1.5"><CheckCircle size={14} className="flex-none text-success" />{t('settings.plugins.oauth.connected')}</span>
          : t('settings.plugins.oauth.notConnected')}
        control={state.connected
          ? <button type="button" onClick={disconnect} disabled={busy} className={SETTINGS_BUTTON} style={fs(13, 'body')}><Unlink size={14} />{t('settings.plugins.oauth.disconnect')}</button>
          : <button type="button" onClick={connect} disabled={busy} className={SETTINGS_BUTTON_PRIMARY} style={fs(13, 'body')}>{busy ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}{t('settings.plugins.oauth.connect')}</button>}
      />
    </SettingRows>
  )
}


/**
 * A user's own per-plugin settings (#plugins). The host renders the plugin's
 * declared `scope:'user'` fields as an editable form — a plugin never ships markup
 * here; the field list is trusted, validated manifest data. Secrets stay write-only
 * (masked, never echoed back). One form per active plugin that declares user fields.
 */
function PluginSettingsForm({ id, name, icon }: { id: string; name: string; icon: string | null }) {
  const { t } = useTranslation()
  const toast = useToast()
  const [fields, setFields] = useState<PluginUserSettingField[] | null>(null)
  const [values, setValues] = useState<Record<string, string | boolean>>({})
  const [saving, setSaving] = useState(false)
  const [oauth, setOauth] = useState<{ configured: boolean; connected: boolean } | null>(null)
  const [actions, setActions] = useState<PluginAction[]>([])
  const [running, setRunning] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<Record<string, { ok: boolean; message?: string }>>({})
  // A dangerous action waits here for the user's answer in the confirm dialog.
  const [pendingAction, setPendingAction] = useState<PluginAction | null>(null)

  useEffect(() => {
    let alive = true
    pluginsApi.userSettings(id)
      .then(r => {
        if (!alive) return
        setFields(r.fields)
        setActions(r.actions ?? [])
        setValues(seedSettingsValues(r.fields, r.config))
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
  const runAction = (a: PluginAction) => {
    if (a.danger) { setPendingAction(a); return }
    void performAction(a)
  }

  const performAction = async (a: PluginAction) => {
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
    const missing = findMissingRequired(fields, values)
    if (missing) {
      toast.error(t('settings.plugins.requiredMissing', { field: missing.label || missing.key }))
      return
    }
    setSaving(true)
    try {
      const r = await pluginsApi.saveUserSettings(id, settingsPatch(fields, values))
      setValues(seedSettingsValues(fields, r.config))
      toast.success(t('settings.plugins.saved'))
    } catch (e) {
      // A 4xx names what the server refused (a required field it knows about and this
      // stale field list doesn't); a 5xx body is not for the user.
      const err = e as { response?: { status?: number; data?: { error?: string } } }
      const refused = err.response?.status && err.response.status < 500 ? err.response.data?.error : undefined
      toast.error(refused || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const fieldId = (key: string) => `plugin-setting-${id}-${key}`
  const setValue = (key: string, value: string | boolean) => setValues(v => ({ ...v, [key]: value }))
  const labelOf = (f: PluginUserSettingField): ReactNode => (
    <>{f.label || f.key}{f.required && <span className="text-danger"> *</span>}</>
  )

  return (
    <SettingsCard icon={resolvePluginIcon(icon)} title={name}>
      {hasFields && (
        <div className={`flex flex-col gap-4 ${saving ? 'opacity-60' : ''}`}>
          {groupFields(fields ?? []).map(group => group.kind === 'switches' ? (
            // Consecutive on/off fields share one box of rows, like the rest of settings.
            <SettingRows key={group.fields[0].key}>
              {group.fields.map(f => (
                <SettingRow
                  key={f.key}
                  label={labelOf(f)}
                  hint={f.hint || undefined}
                  htmlFor={fieldId(f.key)}
                  control={
                    <CheckSwitch
                      id={fieldId(f.key)}
                      checked={values[f.key] === true}
                      onChange={checked => setValue(f.key, checked)}
                    />
                  }
                />
              ))}
            </SettingRows>
          ) : (
            <Fragment key={group.fields[0].key}>
              {group.fields.map(f => (
                <EditorField key={f.key} label={labelOf(f)} htmlFor={fieldId(f.key)} hint={f.hint || undefined}>
                  {f.input_type === 'select' && f.options ? (
                    <CustomSelect
                      id={fieldId(f.key)}
                      value={String(values[f.key] ?? '')}
                      onChange={v => setValue(f.key, String(v))}
                      options={[{ value: '', label: '—' }, ...f.options.map(o => ({ value: o.value, label: o.label }))]}
                    />
                  ) : (
                    <input
                      id={fieldId(f.key)}
                      type={f.secret ? 'password' : (f.input_type === 'number' ? 'number' : 'text')}
                      value={String(values[f.key] ?? '')}
                      placeholder={f.placeholder || ''}
                      autoComplete={f.secret ? 'new-password' : 'off'}
                      onChange={e => setValue(f.key, e.target.value)}
                      className={INPUT}
                    />
                  )}
                </EditorField>
              ))}
            </Fragment>
          ))}
          <div className="flex justify-end">
            <button type="button" onClick={save} disabled={saving} className={SETTINGS_BUTTON_PRIMARY} style={fs(13, 'body')}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {t('common.save')}
            </button>
          </div>
        </div>
      )}
      {actions.length > 0 && (
        <div>
          <p className="m-0 mb-2 flex items-center gap-1.5 font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(10)}>
            <Zap size={11} className="flex-none" />
            {t('settings.plugins.actions')}
          </p>
          <SettingRows>
            {actions.map(a => {
              const res = actionResult[a.key]
              return (
                <div key={a.key} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3.5 py-3">
                  <button type="button"
                    onClick={() => runAction(a)}
                    disabled={running !== null}
                    className={a.danger ? SETTINGS_BUTTON_DANGER : SETTINGS_BUTTON}
                    style={fs(13, 'body')}
                  >
                    {running === a.key && <Loader2 size={14} className="animate-spin" />}
                    {a.label}
                  </button>
                  {a.hint && <span className="min-w-0 flex-1 text-content-faint" style={fs(11.5)}>{a.hint}</span>}
                  {res && (
                    <span className={`ml-auto font-medium ${res.ok ? 'text-success' : 'text-danger'}`} style={fs(12, 'body')}>
                      {res.message || (res.ok ? t('common.success') : t('common.error'))}
                    </span>
                  )}
                </div>
              )
            })}
          </SettingRows>
        </div>
      )}
      <PluginOAuthSection id={id} state={oauth} setState={setOauth} />
      <ConfirmDialog
        isOpen={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={() => { if (pendingAction) void performAction(pendingAction) }}
        message={t('settings.plugins.actions.confirm')}
        confirmLabel={pendingAction?.label}
        danger
      />
    </SettingsCard>
  )
}

/**
 * A plugin's OWN settings surface (capabilities.settingsUi): its sandboxed
 * client/settings.html framed inside the familiar settings card. Unlike the
 * declared-fields form above, the plugin renders this itself — same opaque-origin
 * sandbox and postMessage bridge as its widget, so it can only reach its own
 * routes. The frame auto-sizes via trek:resize like a dashboard widget.
 */
function PluginSettingsUiCard({ id, name, icon }: { id: string; name: string; icon: string | null }) {
  return (
    <SettingsCard icon={resolvePluginIcon(icon)} title={name}>
      {/* min-height covers the beat before the frame's first trek:resize lands.
          color-scheme light on the frame element matches the sandboxed document's
          default ("normal"): mismatched schemes make Chromium paint an opaque
          white canvas behind the transparent frame (same trap .hero-overlay-frame
          guards against), which glares in dark mode. */}
      <div className="min-h-[120px] overflow-hidden rounded-[12px] border border-edge-faint bg-surface-card">
        <PluginFrame pluginId={id} path="settings.html" title={name} surface="user-settings" className="[color-scheme:light]" />
      </div>
    </SettingsCard>
  )
}

export default function PluginSettingsTab() {
  const { t } = useTranslation()
  const plugins = usePluginStore(s => s.plugins)

  return (
    <div>
      <SettingsCard icon={Puzzle} title={t('settings.plugins.title')} hint={t('settings.plugins.subtitle')}>
        {plugins.length === 0 ? <SettingsHint>{t('settings.plugins.empty')}</SettingsHint> : null}
      </SettingsCard>
      {plugins.map(p => (
        <Fragment key={p.id}>
          <PluginSettingsForm id={p.id} name={p.name} icon={p.icon} />
          {p.settingsUi && <PluginSettingsUiCard id={p.id} name={p.name} icon={p.icon} />}
        </Fragment>
      ))}
      <PluginActivityPanel />
    </div>
  )
}
