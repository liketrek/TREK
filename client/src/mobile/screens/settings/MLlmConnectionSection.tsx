import React, { useEffect, useMemo, useState } from 'react'
import { Sparkles, Save, ChevronDown } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { useToast } from '../../../components/shared/Toast'
import { useSettingsStore } from '../../../store/settingsStore'
import type { Settings } from '../../../types'
import { MSetCard, MSetEyebrow, MSetSelectRow, MSetRow, MSetInput, MSetButton, MSetHint } from './MSettingsUi'
import MToggle from '../../components/MToggle'
import MSetPickerSheet from './MSetPickerSheet'

type Provider = NonNullable<Settings['llm_provider']>

/**
 * Mobile-native twin of components/Settings/LlmConnectionSection. Same per-user
 * AI-parsing model logic (provider/model/base URL/key/multimodal, key never
 * prefilled), rebuilt on the MSet* card system: the provider CustomSelect becomes
 * an MSetSelectRow + MSetPickerSheet, the toggle becomes MToggle. Presentation only.
 */
export default function MLlmConnectionSection(): React.ReactElement {
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
  const [providerOpen, setProviderOpen] = useState(false)

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

  const providerOptions = useMemo(
    () => [
      { value: 'local', label: t('settings.aiParsing.providerLocal') },
      { value: 'openai', label: t('settings.aiParsing.providerOpenai') },
      { value: 'anthropic', label: t('settings.aiParsing.providerAnthropic') },
    ],
    [t],
  )
  const providerLabel = providerOptions.find(o => o.value === provider)?.label ?? provider

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
    <MSetCard title={t('settings.aiParsing.title')} icon={Sparkles} className="mt-3">
      <MSetHint className="mb-3">{t('settings.aiParsing.hint')}</MSetHint>

      <MSetEyebrow className="mb-[5px]">{t('settings.aiParsing.provider')}</MSetEyebrow>
      <MSetSelectRow
        label={providerLabel}
        trailing={<ChevronDown size={13} strokeWidth={2} className="flex-none text-m-faint" />}
        onClick={() => setProviderOpen(true)}
      />

      <MSetEyebrow className="mb-[5px] mt-[14px]">{t('settings.aiParsing.model')}</MSetEyebrow>
      <MSetInput
        type="text"
        autoComplete="off"
        value={model}
        onChange={e => setModel(e.target.value)}
        placeholder="qwen3:8b"
      />

      {showBaseUrl && (
        <>
          <MSetEyebrow className="mb-[5px] mt-[14px]">{t('settings.aiParsing.baseUrl')}</MSetEyebrow>
          <MSetInput
            type="url"
            autoComplete="off"
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
            placeholder="http://localhost:11434"
          />
          <MSetHint>{t('settings.aiParsing.baseUrlHint')}</MSetHint>
        </>
      )}

      {needsKey && (
        <>
          <MSetEyebrow className="mb-[5px] mt-[14px]">{t('settings.aiParsing.apiKey')}</MSetEyebrow>
          <MSetInput
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            autoComplete="off"
            placeholder={hasStoredKey && !apiKey ? '••••••••' : t('settings.aiParsing.apiKey')}
          />
          <MSetHint>{t('settings.aiParsing.apiKeyHint')}</MSetHint>
        </>
      )}

      <div className="mt-3">
        <MSetRow
          first
          label={t('settings.aiParsing.multimodal')}
          sub={t('settings.aiParsing.multimodalHint')}
          trailing={
            <MToggle
              checked={multimodal}
              onChange={() => setMultimodal(v => !v)}
              ariaLabel={t('settings.aiParsing.multimodal')}
            />
          }
        />
      </div>

      <div className="mt-3">
        <MSetButton variant="primary" onClick={handleSave} disabled={saving || !isLoaded}>
          <Save size={14} /> {t('common.save')}
        </MSetButton>
      </div>

      <MSetPickerSheet
        open={providerOpen}
        onClose={() => setProviderOpen(false)}
        title={t('settings.aiParsing.provider')}
        value={provider}
        onSelect={v => setProvider(v as Provider)}
        options={providerOptions}
      />
    </MSetCard>
  )
}
