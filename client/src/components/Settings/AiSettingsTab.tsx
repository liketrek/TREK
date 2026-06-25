import React, { useEffect, useState } from 'react'
import { Sparkles, Save, Cloud, ShieldCheck } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useSettingsStore } from '../../store/settingsStore'
import { useToast } from '../shared/Toast'
import CustomSelect from '../shared/CustomSelect'
import Section from './Section'

const MASKED = '••••••••'

type Provider = 'openai' | 'anthropic'

/**
 * Per-user "bring your own key" AI-parsing config for booking import. Only shown
 * when the admin has NOT defined an instance-wide config (see the server
 * `aiParsingManaged` flag); when they have, `managed` is true and we render a short
 * note instead. The API key follows the masked-sentinel pattern: it arrives as
 * `••••••••` when already set, and sending the unchanged mask is a server-side no-op.
 */
export default function AiSettingsTab({ managed }: { managed: boolean }): React.ReactElement {
  const { settings, updateSettings } = useSettingsStore()
  const { t } = useTranslation()
  const toast = useToast()

  const [provider, setProvider] = useState<Provider>(settings.llm_provider === 'anthropic' ? 'anthropic' : 'openai')
  const [model, setModel] = useState<string>(settings.llm_model || '')
  const [apiKey, setApiKey] = useState<string>(settings.llm_api_key || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setProvider(settings.llm_provider === 'anthropic' ? 'anthropic' : 'openai')
    setModel(settings.llm_model || '')
    setApiKey(settings.llm_api_key || '')
  }, [settings])

  const save = async (): Promise<void> => {
    setSaving(true)
    try {
      // Send the masked sentinel unchanged so the server keeps the stored key.
      await updateSettings({ llm_provider: provider, llm_model: model.trim(), llm_api_key: apiKey })
      toast.success(t('settings.ai.toast.saved'))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  if (managed) {
    return (
      <Section title={t('settings.ai.title')} icon={Sparkles}>
        <div className="flex items-start gap-3 p-4 rounded-lg border border-edge-secondary bg-surface-secondary">
          <ShieldCheck className="w-5 h-5 mt-0.5 flex-shrink-0 text-content-secondary" />
          <p className="text-sm text-content-secondary">{t('settings.ai.managedNote')}</p>
        </div>
      </Section>
    )
  }

  const providerOptions = [
    { value: 'openai', label: 'OpenAI', icon: <Cloud size={14} /> },
    { value: 'anthropic', label: 'Anthropic', icon: <Sparkles size={14} /> },
  ]

  const inputCls = 'w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-content focus:ring-2 focus:ring-slate-400 focus:border-transparent'

  return (
    <Section title={t('settings.ai.title')} icon={Sparkles}>
      <p className="text-sm text-content-muted">{t('settings.ai.intro')}</p>

      <div>
        <label className="block text-sm font-medium text-content-secondary mb-1.5">{t('settings.ai.provider')}</label>
        <CustomSelect value={provider} onChange={v => setProvider(v as Provider)} options={providerOptions} />
      </div>

      <div>
        <label className="block text-sm font-medium text-content-secondary mb-1.5">{t('settings.ai.model')}</label>
        <input
          type="text"
          value={model}
          onChange={e => setModel(e.target.value)}
          placeholder={provider === 'anthropic' ? t('settings.ai.modelPlaceholder.anthropic') : t('settings.ai.modelPlaceholder.openai')}
          className={`${inputCls} font-mono`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-content-secondary mb-1.5">{t('settings.ai.apiKey')}</label>
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder={apiKey === MASKED ? MASKED : 'sk-…'}
          className={`${inputCls} font-mono`}
        />
        <p className="text-xs text-content-muted mt-1">{t('settings.ai.apiKeyHint')}</p>
      </div>

      <button
        onClick={save}
        disabled={saving || !model.trim()}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-700 disabled:bg-slate-400"
      >
        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
        {t('settings.ai.save')}
      </button>
    </Section>
  )
}
