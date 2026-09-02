import { useState } from 'react'
import { adminApi, type PluginUserSettingField } from '../../api/client'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { seedSettingsValues, findMissingRequired, settingsPatch } from '../Plugins/settingsForm'

/** The server's stand-in for a stored secret — a display artifact, never a value to send back. */

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
        setForm({ id, fields: d.fields, values: seedSettingsValues(d.fields, d.config) })
      })
      .catch(() => toast.error(t('common.error')))
  }

  const setValue = (key: string, value: string | boolean) =>
    setForm(s => s && ({ ...s, values: { ...s.values, [key]: value } }))

  const close = () => setForm(null)

  const save = async () => {
    if (!form) return
    const missing = findMissingRequired(form.fields, form.values)
    if (missing) {
      setError(t('admin.plugins.requiredMissing', { field: missing.label || missing.key }))
      return
    }
    setSaving(true); setError('')
    try {
      const d = await adminApi.pluginSaveConfig(form.id, settingsPatch(form.fields, form.values))
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
