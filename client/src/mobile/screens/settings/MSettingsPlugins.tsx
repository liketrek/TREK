/**
 * Plugins settings section — mobile-native twin of
 * components/Settings/PluginSettingsTab. Same logic (per-plugin declared-field
 * form with secrets/actions/OAuth, the plugin's own settings.html surface, and
 * the user's plugin activity log), rebuilt on the MSet* card system: MToggle for
 * booleans, a picker sheet for selects and an MConfirmSheet for danger actions.
 */
import { Fragment, useState } from 'react'
import { Save, Loader2, Link2, Unlink, CheckCircle, ChevronDown, History, RefreshCw } from 'lucide-react'
import { resolvePluginIcon } from '../../../components/shared/PluginIcon'
import PluginFrame from '../../../components/Plugins/PluginFrame'
import { usePluginStore } from '../../../store/pluginStore'
import { useTranslation } from '../../../i18n'
import { MSetCard, MSetEyebrow, MSetSelectRow, MSetInput, MSetButton, MSetHint } from './MSettingsUi'
import MToggle from '../../components/MToggle'
import MConfirmSheet from './MConfirmSheet'
import MSetPickerSheet from './MSetPickerSheet'
import {
  usePluginOAuth,
  usePluginUserSettings,
  type PluginOAuthState,
} from '../../../components/Plugins/usePluginUserSettings'
import { usePluginActivity } from '../../../components/Settings/usePluginActivity'

/** Host-brokered OAuth: a Connect/Disconnect control. The host runs the whole flow +
 * holds the tokens; this only triggers connect (redirect to the provider) / disconnect. */
function PluginOAuthSection({ id, state, setState }: {
  id: string
  state: PluginOAuthState | null
  setState: (s: PluginOAuthState) => void
}) {
  const { t } = useTranslation()
  const { busy, connect, disconnect } = usePluginOAuth(id, state, setState)

  if (!state?.configured) return null

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--m-rowbr)] pt-3">
      <span className="flex items-center gap-[6px] text-[0.78125rem] font-semibold text-m-muted">
        {state.connected
          ? <><CheckCircle size={15} className="text-[color:var(--m-st-confirmed)]" /> {t('settings.plugins.oauth.connected')}</>
          : <>{t('settings.plugins.oauth.notConnected')}</>}
      </span>
      {state.connected
        ? <MSetButton variant="ghost" disabled={busy} onClick={disconnect}><Unlink size={14} />{t('settings.plugins.oauth.disconnect')}</MSetButton>
        : <MSetButton variant="primary" disabled={busy} onClick={connect}>{busy ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}{t('settings.plugins.oauth.connect')}</MSetButton>}
    </div>
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
  const {
    fields,
    values,
    setValue,
    hasFields,
    visible,
    saving,
    save,
    actions,
    running,
    actionResult,
    runAction,
    performAction,
    pendingAction,
    setPendingAction,
    oauth,
    setOauth,
  } = usePluginUserSettings(id)
  // Native sheet stands in for the desktop <select>.
  const [pickerKey, setPickerKey] = useState<string | null>(null)

  if (!visible || fields === null) return null

  const pickerField = fields.find(f => f.key === pickerKey && f.input_type === 'select' && !!f.options)

  return (
    <>
      <MSetCard title={name} icon={resolvePluginIcon(icon)}>
        {hasFields && (
          <div className="flex flex-col gap-[14px]">
            {fields.map(f => {
              const requiredMark = f.required ? <span className="text-[color:var(--m-st-danger)]"> *</span> : null
              if (f.input_type === 'checkbox') {
                return (
                  <div key={f.key}>
                    <div className="flex items-center gap-[10px]">
                      <div className="min-w-0 flex-1 text-[0.78125rem] font-bold text-m-ink">
                        {f.label || f.key}{requiredMark}
                      </div>
                      <MToggle
                        checked={values[f.key] === true}
                        onChange={checked => setValue(f.key, checked)}
                        ariaLabel={f.label || f.key}
                      />
                    </div>
                    {f.hint && <MSetHint>{f.hint}</MSetHint>}
                  </div>
                )
              }
              if (f.input_type === 'select' && f.options) {
                const current = String(values[f.key] ?? '')
                const opt = f.options.find(o => o.value === current)
                return (
                  <div key={f.key}>
                    <div className="mb-[6px] text-[0.78125rem] font-bold text-m-ink">{f.label || f.key}{requiredMark}</div>
                    <MSetSelectRow
                      label={opt ? opt.label : '—'}
                      trailing={<ChevronDown size={13} strokeWidth={2} className="flex-none text-m-faint" />}
                      onClick={() => setPickerKey(f.key)}
                    />
                    {f.hint && <MSetHint>{f.hint}</MSetHint>}
                  </div>
                )
              }
              return (
                <div key={f.key}>
                  <div className="mb-[6px] text-[0.78125rem] font-bold text-m-ink">{f.label || f.key}{requiredMark}</div>
                  <MSetInput
                    type={f.secret ? 'password' : (f.input_type === 'number' ? 'number' : 'text')}
                    value={String(values[f.key] ?? '')}
                    placeholder={f.placeholder || ''}
                    autoComplete={f.secret ? 'new-password' : 'off'}
                    onChange={e => setValue(f.key, e.target.value)}
                  />
                  {f.hint && <MSetHint>{f.hint}</MSetHint>}
                </div>
              )
            })}
          </div>
        )}

        {hasFields && (
          <div className="mt-4">
            <MSetButton variant="primary" disabled={saving} onClick={save}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {t('common.save')}
            </MSetButton>
          </div>
        )}

        {actions.length > 0 && (
          <div className="mt-4 border-t border-[color:var(--m-rowbr)] pt-4">
            <MSetEyebrow className="mb-2">{t('settings.plugins.actions')}</MSetEyebrow>
            <div className="flex flex-col gap-2">
              {actions.map(a => {
                const res = actionResult[a.key]
                return (
                  <div key={a.key} className="flex flex-wrap items-center gap-2">
                    <MSetButton
                      variant={a.danger ? 'danger' : 'ghost'}
                      disabled={running !== null}
                      onClick={() => runAction(a)}
                    >
                      {running === a.key && <Loader2 size={14} className="animate-spin" />}
                      {a.label}
                    </MSetButton>
                    {a.hint && <span className="font-geist text-[0.625rem] text-m-muted">{a.hint}</span>}
                    {res && (
                      <span className={`text-[0.625rem] font-bold ${res.ok ? 'text-[color:var(--m-st-confirmed)]' : 'text-[color:var(--m-st-danger)]'}`}>
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
      </MSetCard>

      <MSetPickerSheet
        open={pickerField != null}
        onClose={() => setPickerKey(null)}
        title={pickerField ? (pickerField.label || pickerField.key) : ''}
        value={String(values[pickerField?.key ?? ''] ?? '')}
        onSelect={(val) => { if (pickerField) setValue(pickerField.key, val) }}
        options={pickerField ? [{ value: '', label: '—' }, ...pickerField.options!.map(o => ({ value: o.value, label: o.label }))] : []}
      />

      <MConfirmSheet
        open={pendingAction != null}
        onClose={() => setPendingAction(null)}
        title={pendingAction?.label ?? ''}
        message={t('settings.plugins.actions.confirm')}
        confirmLabel={pendingAction?.label}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => { const a = pendingAction; setPendingAction(null); if (a) void performAction(a) }}
      />
    </>
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
    <MSetCard title={name} icon={resolvePluginIcon(icon)}>
      {/* min-height covers the beat before the frame's first trek:resize lands.
          color-scheme light on the frame element matches the sandboxed document's
          default ("normal"): mismatched schemes make Chromium paint an opaque
          white canvas behind the transparent frame (same trap .hero-overlay-frame
          guards against), which glares in dark mode. */}
      <div className="min-h-[120px]">
        <PluginFrame pluginId={id} path="settings.html" title={name} surface="user-settings" className="[color-scheme:light]" />
      </div>
    </MSetCard>
  )
}

/**
 * Status-code tone for the result pill. "ok" stays neutral; an access denial reads
 * as danger, anything else non-ok as a softer pending/warning tone.
 */
function codeTone(code: string): string {
  if (code === 'ok') return 'text-m-muted'
  if (/FORBIDDEN|DENIED|UNAUTHORIZED/i.test(code)) return 'text-[color:var(--m-st-danger)]'
  return 'text-[color:var(--m-st-pending)]'
}

/**
 * The signed-in user's own plugin activity log — every host-mediated action a
 * plugin took while bound to them, newest first. The user-facing half of the
 * capability audit. Fail-safe: a failed load just shows the empty state.
 */
function PluginActivityPanel() {
  const { t } = useTranslation()
  const { rows, loading, load, fmtWhen } = usePluginActivity()

  const refresh = (
    <button
      type="button"
      onClick={load}
      disabled={loading}
      className="inline-flex flex-none items-center gap-[5px] rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[10px] py-[5px] text-[0.625rem] font-bold text-m-ink disabled:opacity-50"
    >
      <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
      {t('settings.pluginActivity.refresh')}
    </button>
  )

  return (
    <MSetCard title={t('settings.pluginActivity.title')} icon={History} badge={refresh}>
      <p className="-mt-1 mb-3 font-geist text-[0.625rem] leading-relaxed text-m-muted">
        {t('settings.pluginActivity.description')}
      </p>
      {rows.length === 0 ? (
        <p className="font-geist text-[0.71875rem] text-m-muted">
          {loading ? t('common.loading') : t('settings.pluginActivity.empty')}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <div
              key={i}
              className="rounded-[10px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-[13px] py-[10px]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 truncate text-[0.78125rem] font-bold text-m-ink">
                  {r.plugin_name || r.plugin_id}
                </span>
                <span className={`flex-none rounded-full bg-[color:var(--m-ic)] px-2 py-[2px] text-[0.625rem] font-bold ${codeTone(r.code)}`}>
                  {r.code}
                </span>
              </div>
              <div className="mt-[3px] flex items-center gap-[6px] font-mono text-[0.625rem] text-m-muted">
                <span className="flex-none text-m-faint">{r.method}</span>
                <span className="min-w-0 flex-1 truncate">{r.resource || '—'}</span>
              </div>
              <div className="mt-[2px] font-geist text-[0.5625rem] text-m-faint">{fmtWhen(r.ts)}</div>
            </div>
          ))}
        </div>
      )}
    </MSetCard>
  )
}

export default function MSettingsPlugins() {
  const { t } = useTranslation()
  const plugins = usePluginStore(s => s.plugins)

  return (
    <div className="flex flex-col gap-3">
      {plugins.length === 0 && (
        <p className="font-geist text-[0.71875rem] text-m-muted">{t('settings.plugins.empty')}</p>
      )}
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
