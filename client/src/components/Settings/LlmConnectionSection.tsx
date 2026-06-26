import React, { useEffect, useState } from 'react'
import { Sparkles, Save } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { useSettingsStore } from '../../store/settingsStore'
import type { Settings } from '../../types'
import Section from './Section'
import ToggleSwitch from './ToggleSwitch'
import CustomSelect from '../shared/CustomSelect'

type Provider = NonNullable<Settings['llm_provider']>

/**
 * Settings → Integrations → AI parsing. Per-user model used to extract bookings
 * from uploaded files. It only takes effect when the admin has not configured an
 * instance-wide model on the addon — the server resolves the admin config first.
 * The API key is stored encrypted and never prefilled: a blank field keeps the
 * stored key (mirrors the AirTrail connection layout).
 */
export default function LlmConnectionSection(): React.ReactElement {
  const { t } = useTranslation()
  const toast = useToast()
  const settings = useSettingsStore(s => s.settings)
  const isLoaded = useSettingsStore(s => s.isLoaded)
  const updateSettings = useSettingsStore(s => s.updateSettings)

  const [provider, setProvider] = useState<Provider>('local')
  const [model, setModel] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [multimodal, setMultimodal] = useState(false)
  const [hasStoredKey, setHasStoredKey] = useState(false)
  const [saving, setSaving] = useState(false)

  // Hydrate from the loaded settings. llm_api_key arrives masked, so we only use
  // its presence to drive the placeholder — never the value itself.
  useEffect(() => {
    if (!isLoaded) return
    setProvider(settings.llm_provider || 'local')
    setModel(settings.llm_model || '')
    setBaseUrl(settings.llm_base_url || '')
    setMultimodal(settings.llm_multimodal === true)
    setHasStoredKey(!!settings.llm_api_key)
  }, [isLoaded, settings.llm_provider, settings.llm_model, settings.llm_base_url, settings.llm_multimodal, settings.llm_api_key])

  const needsKey = provider !== 'local'
  const showBaseUrl = provider === 'local' || provider === 'openai'

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: Partial<Settings> = {
        llm_provider: provider,
        llm_model: model.trim(),
        llm_base_url: showBaseUrl ? baseUrl.trim() : '',
        llm_multimodal: multimodal,
      }
      // Send the key only when the user typed a new one — a blank field means
      // "keep the stored key".
      const key = apiKey.trim()
      if (key) payload.llm_api_key = key
      await updateSettings(payload)
      setApiKey('')
      if (key) setHasStoredKey(true)
      toast.success(t('settings.aiParsing.toast.saved'))
    } catch {
      toast.error(t('settings.aiParsing.toast.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section title={t('settings.aiParsing.title')} icon={Sparkles}>
      <div className="space-y-3">
        <p className="text-xs text-content-secondary">{t('settings.aiParsing.hint')}</p>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-content-secondary">{t('settings.aiParsing.provider')}</label>
          <CustomSelect
            value={provider}
            onChange={v => setProvider(v as Provider)}
            options={[
              { value: 'local', label: t('settings.aiParsing.providerLocal') },
              { value: 'openai', label: t('settings.aiParsing.providerOpenai') },
              { value: 'anthropic', label: t('settings.aiParsing.providerAnthropic') },
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-content-secondary">{t('settings.aiParsing.model')}</label>
          <input
            type="text"
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder="qwen3:8b"
            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 border-edge bg-surface-secondary text-content"
          />
        </div>

        {showBaseUrl && (
          <div>
            <label className="block text-sm font-medium mb-1.5 text-content-secondary">{t('settings.aiParsing.baseUrl')}</label>
            <input
              type="url"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="http://localhost:11434"
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 border-edge bg-surface-secondary text-content"
            />
            <p className="mt-1 text-xs text-content-faint">{t('settings.aiParsing.baseUrlHint')}</p>
          </div>
        )}

        {needsKey && (
          <div>
            <label className="block text-sm font-medium mb-1.5 text-content-secondary">{t('settings.aiParsing.apiKey')}</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              autoComplete="off"
              placeholder={hasStoredKey && !apiKey ? '••••••••' : t('settings.aiParsing.apiKey')}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 border-edge bg-surface-secondary text-content"
            />
            <p className="mt-1 text-xs text-content-faint">{t('settings.aiParsing.apiKeyHint')}</p>
          </div>
        )}

        <div>
          <div className="flex items-center gap-3">
            <ToggleSwitch on={multimodal} onToggle={() => setMultimodal(v => !v)} />
            <span className="text-sm font-medium text-content-secondary">{t('settings.aiParsing.multimodal')}</span>
          </div>
          <p className="mt-1 text-xs text-content-faint">{t('settings.aiParsing.multimodalHint')}</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !isLoaded}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {t('common.save')}
        </button>
      </div>
    </Section>
  )
}
