import { useRef, useState } from 'react'
import { adminApi, type PluginAction, type PluginUserSettingField } from '../../api/client'
import type { PluginActionResult } from '@trek/shared'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { seedSettingsValues, findMissingRequired, settingsPatch } from '../Plugins/settingsForm'

export interface InstanceSettingsForm {
  id: string
  fields: PluginUserSettingField[]
  values: Record<string, string | boolean>
  /** The plugin's `scope:'instance'` action buttons. */
  actions: PluginAction[]
  /** Whether the plugin is active: an action needs a running child to execute. */
  active: boolean
  /** An edit since open/last save. An action saves a dirty form before it runs. */
  dirty: boolean
}

/**
 * The admin-owned `scope:'instance'` settings form — the ONE logic path behind
 * both admin shells (the desktop modal and the phone sheet render their own
 * markup over this state). Open fetches the declared fields plus the stored
 * (masked) values and the instance-scope actions; save skips an untouched secret
 * mask so it never overwrites the stored ciphertext, and reports a restart when
 * the server re-spawned a running plugin (the child reads its config once, at init).
 *
 * Actions run AS the clicking admin. A dirty form is saved first (so the action
 * sees the config the admin is looking at), the dialog stays open, and the result
 * shows beside the button. A `danger` action parks in `pendingAction` until the
 * shell's confirm UI calls `confirmPendingAction`.
 */
export function useInstanceSettings() {
  const { t } = useTranslation()
  const toast = useToast()
  const [form, setForm] = useState<InstanceSettingsForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [actionResult, setActionResult] = useState<Record<string, PluginActionResult>>({})
  const [runningAction, setRunningAction] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PluginAction | null>(null)
  // Bumped on every open()/close() so an in-flight action from a closed/replaced
  // dialog can tell it's stale and bail without touching the new dialog's state.
  const openSeq = useRef(0)

  const open = (id: string, active: boolean) => {
    openSeq.current++
    setError('')
    setActionResult({})
    setPendingAction(null)
    setRunningAction(null)
    adminApi.pluginConfig(id)
      .then(d => {
        setForm({ id, fields: d.fields, values: seedSettingsValues(d.fields, d.config), actions: d.actions ?? [], active, dirty: false })
      })
      .catch(() => toast.error(t('common.error')))
  }

  const setValue = (key: string, value: string | boolean) =>
    setForm(s => s && ({ ...s, values: { ...s.values, [key]: value }, dirty: true }))

  const close = () => { openSeq.current++; setForm(null); setPendingAction(null); setRunningAction(null) }

  /** Persist the form. Returns false when the save was refused (error already shown). */
  const persist = async (f: InstanceSettingsForm): Promise<boolean> => {
    const missing = findMissingRequired(f.fields, f.values)
    if (missing) {
      setError(t('admin.plugins.requiredMissing', { field: missing.label || missing.key }))
      return false
    }
    setSaving(true); setError('')
    try {
      const d = await adminApi.pluginSaveConfig(f.id, settingsPatch(f.fields, f.values))
      toast.success(t(d.restarted ? 'admin.plugins.settingsSavedRestarted' : 'admin.plugins.settingsSaved'))
      return true
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } } }
      setError(err.response?.data?.error || t('common.error'))
      return false
    } finally {
      setSaving(false)
    }
  }

  const save = async () => {
    if (!form) return
    if (await persist(form)) setForm(null)
  }

  const perform = async (a: PluginAction) => {
    if (!form || !form.active || runningAction) return
    const seq = openSeq.current
    if (form.dirty) {
      if (!(await persist(form))) return
      if (openSeq.current !== seq) return
      // Only clear dirty if the values are still the snapshot we just persisted —
      // a reference check, since setValue always creates a new values object. A
      // concurrent edit during the save produced a new object, so dirty stays true
      // and the edit isn't silently dropped from the next save/action.
      setForm(s => s && s.values === form.values ? { ...s, dirty: false } : s)
    }
    if (openSeq.current !== seq) return
    setRunningAction(a.key)
    try {
      const res = await adminApi.runPluginAction(form.id, a.key)
      if (openSeq.current !== seq) return
      setActionResult(r => ({ ...r, [a.key]: res }))
    } catch {
      if (openSeq.current !== seq) return
      setActionResult(r => ({ ...r, [a.key]: { ok: false, message: t('common.error') } }))
    } finally {
      if (openSeq.current === seq) setRunningAction(null)
    }
  }

  const runAction = (a: PluginAction) => {
    if (!form || !form.active) return
    if (a.danger) { setPendingAction(a); return }
    void perform(a)
  }

  const confirmPendingAction = () => {
    const a = pendingAction
    setPendingAction(null)
    if (a) void perform(a)
  }

  const cancelPendingAction = () => setPendingAction(null)

  return {
    form, saving, error, open, setValue, close, save,
    actionResult, runningAction, pendingAction, runAction, confirmPendingAction, cancelPendingAction,
  }
}
