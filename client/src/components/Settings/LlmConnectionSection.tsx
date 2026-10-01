import React, { useEffect, useMemo, useState } from 'react'
import { Sparkles, Save } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { useSettingsStore } from '../../store/settingsStore'
import type { Settings } from '../../types'
import Section from './Section'
import ToggleSwitch from './ToggleSwitch'
import { SETTINGS_BUTTON_PRIMARY, SettingRow, SettingRows, SettingsHint } from './settingsKit'
import { EditorField, GRID_2, INPUT, Segmented } from '../shared/dialogParts'
import { fs } from '../shared/DialogShell'

type Provider = NonNullable<Settings['llm_provider']>

/**
 * Settings → Integrations → AI parsing. Per-user model used to extract bookings
 * from uploaded files. It only takes effect when the admin has not configured an
 * instance-wide model on the addon — the server resolves the admin config first.
 * The API key is stored encrypted and never prefilled: a blank field keeps the
 * stored key (mirrors the AirTrail connection layout).
 *
 * A free-form endpoint does not live here at all (#1772): the request goes out
 * from the server, so only whoever runs the instance may name its target, and
 * an instance has exactly one such target. It is configured once on the addon
 * in the admin settings, including for the admin's own account. What is left
 * here are the two hosted providers, which go to a fixed address with the
 * user's own key. The server enforces this on both the read and the write path,
 * so this is only the matching surface.
 */
export default function LlmConnectionSection(): React.ReactElement {
  const { t } = useTranslation()
  const toast = useToast()
  const settings = useSettingsStore(s => s.settings)
  const isLoaded = useSettingsStore(s => s.isLoaded)
  const updateSettings = useSettingsStore(s => s.updateSettings)
  const loadSettings = useSettingsStore(s => s.loadSettings)

  const [provider, setProvider] = useState<Provider>('openai')
  const [model, setModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [multimodal, setMultimodal] = useState(false)
  const [hasStoredKey, setHasStoredKey] = useState(false)
  const [saving, setSaving] = useState(false)

  // Hydrate from the loaded settings. llm_api_key arrives masked, so we only use
  // its presence to drive the placeholder, never the value itself. A stored
  // 'local' from before #1772 shows as OpenAI (local state only, nothing is
  // saved until Save is pressed) so the form never offers a value the server
  // would refuse.
  useEffect(() => {
    if (!isLoaded) return
    const stored = settings.llm_provider || 'openai'
    setProvider(stored === 'local' ? 'openai' : stored)
    setModel(settings.llm_model || '')
    setMultimodal(settings.llm_multimodal === true)
    setHasStoredKey(!!settings.llm_api_key)
  }, [isLoaded, settings.llm_provider, settings.llm_model, settings.llm_multimodal, settings.llm_api_key])

  const providerOptions = useMemo(
    () => [
      { value: 'openai' as const, label: t('settings.aiParsing.providerOpenai') },
      { value: 'anthropic' as const, label: t('settings.aiParsing.providerAnthropic') },
    ],
    [t],
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: Partial<Settings> = {
        llm_provider: provider,
        llm_model: model.trim(),
        // Always cleared: the endpoint is instance configuration now, and this
        // also drops a value left over from before #1772.
        llm_base_url: '',
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
      // updateSettings patches the store before the request and keeps the patch
      // when the request fails, so a refused save (the 403 from #1772, or any
      // other error) would leave the form showing a value the server never
      // stored. Pull the stored settings back in so what is on screen is real.
      await loadSettings()
      toast.error(t('settings.aiParsing.toast.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section title={t('settings.aiParsing.title')} icon={Sparkles}>
      <SettingsHint>{t('settings.aiParsing.hint')}</SettingsHint>

      {/* Two hosted providers only (#1772), so a segmented pair rather than a list. */}
      <EditorField label={t('settings.aiParsing.provider')} hint={t('settings.aiParsing.localAdminOnly')}>
        <Segmented<Provider>
          label={t('settings.aiParsing.provider')}
          value={provider}
          onChange={setProvider}
          options={providerOptions}
        />
      </EditorField>

      <div className={GRID_2}>
        <EditorField label={t('settings.aiParsing.model')} htmlFor="llm-model">
          <input
            id="llm-model"
            type="text"
            autoComplete="off"
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder="qwen3:8b"
            className={INPUT}
          />
        </EditorField>

        {/* Both remaining providers are hosted and need a key, so this is no
            longer conditional (#1772). */}
        <EditorField label={t('settings.aiParsing.apiKey')} htmlFor="llm-api-key" hint={t('settings.aiParsing.apiKeyHint')}>
          <input
            id="llm-api-key"
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            autoComplete="off"
            placeholder={hasStoredKey && !apiKey ? '••••••••' : t('settings.aiParsing.apiKey')}
            className={INPUT}
          />
        </EditorField>
      </div>

      <SettingRows>
        <SettingRow
          label={t('settings.aiParsing.multimodal')}
          hint={t('settings.aiParsing.multimodalHint')}
          control={<ToggleSwitch on={multimodal} onToggle={() => setMultimodal(v => !v)} label={t('settings.aiParsing.multimodal')} />}
        />
      </SettingRows>

      <div className="flex" style={fs(13, 'body')}>
        <button type="button"
          onClick={handleSave}
          disabled={saving || !isLoaded}
          className={SETTINGS_BUTTON_PRIMARY}
        >
          <Save size={14} strokeWidth={2.2} /> {t('common.save')}
        </button>
      </div>
    </Section>
  )
}
