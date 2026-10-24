import React from 'react'
import { Sparkles, Save } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useLlmConnection, type LlmProvider as Provider } from './useLlmConnection'
import Section from './Section'
import ToggleSwitch from './ToggleSwitch'
import { SETTINGS_BUTTON_PRIMARY, SettingRow, SettingRows, SettingsHint } from './settingsKit'
import { EditorField, GRID_2, INPUT, Segmented } from '../shared/dialogParts'
import { fs } from '../shared/DialogShell'

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
  const {
    isLoaded,
    provider,
    setProvider,
    providerOptions,
    model,
    setModel,
    apiKey,
    setApiKey,
    multimodal,
    toggleMultimodal,
    hasStoredKey,
    saving,
    handleSave,
  } = useLlmConnection()

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
          control={<ToggleSwitch on={multimodal} onToggle={toggleMultimodal} label={t('settings.aiParsing.multimodal')} />}
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
