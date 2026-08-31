import { useState } from 'react'
import { adminApi, type PluginUserSettingField } from '../../api/client'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'

/** The server's stand-in for a stored secret — a display artifact, never a value to send back. */
export const SECRET_MASK = '••••••••'

export interface InstanceSettingsForm {
  id: string
  fields: PluginUserSettingField[]
  values: Record<string, string | boolean>
}

/**
 * The admin-owned `scope:'instance'` settings form — the ONE logic path behind
 * both admin shells (the desktop modal and the phone sheet render their own
 * markup over this state). Open fetches the declared fields plus the stored
 * (masked) values; save skips an untouched secret mask so it never overwrites
 * the stored ciphertext, and reports a restart when the server re-spawned a
 * running plugin (the child reads its config once, at init).
 */
export function useInstanceSettings() {
  const { t } = useTranslation()
  const toast = useToast()
  const [form, setForm] = useState<InstanceSettingsForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const open = (id: string) => {
    setError('')
    adminApi.pluginConfig(id)
      .then(d => {
        const values: Record<string, string | boolean> = {}
        for (const f of d.fields) {
          const v = d.config[f.key]
          values[f.key] = f.input_type === 'checkbox' ? v === true : (v == null ? '' : String(v))
        }
        setForm({ id, fields: d.fields, values })
      })
      .catch(() => toast.error(t('common.error')))
  }

  const setValue = (key: string, value: string | boolean) =>
    setForm(s => s && ({ ...s, values: { ...s.values, [key]: value } }))

  const close = () => setForm(null)

  const save = async () => {
    if (!form) return
    setSaving(true); setError('')
    try {
      const patch: Record<string, unknown> = {}
      for (const f of form.fields) {
        const v = form.values[f.key]
        if (f.secret && v === SECRET_MASK) continue
        patch[f.key] = v
      }
      const d = await adminApi.pluginSaveConfig(form.id, patch)
      toast.success(t(d.restarted ? 'admin.plugins.settingsSavedRestarted' : 'admin.plugins.settingsSaved'))
      setForm(null)
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } } }
      setError(err.response?.data?.error || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return { form, saving, error, open, setValue, close, save }
}
