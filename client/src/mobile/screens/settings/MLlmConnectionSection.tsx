import React, { useState } from 'react'
import { Sparkles, Save, ChevronDown } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { useLlmConnection, type LlmProvider as Provider } from '../../../components/Settings/useLlmConnection'
import { MSetCard, MSetEyebrow, MSetSelectRow, MSetRow, MSetInput, MSetButton, MSetHint } from './MSettingsUi'
import MToggle from '../../components/MToggle'
import MSetPickerSheet from './MSetPickerSheet'

/**
 * Mobile-native twin of components/Settings/LlmConnectionSection. Same per-user
 * AI-parsing model logic (provider/model/key/multimodal, key never prefilled,
 * free-form endpoint moved to the instance config per #1772), rebuilt on the
 * MSet* card system: the provider CustomSelect becomes an MSetSelectRow +
 * MSetPickerSheet, the toggle becomes MToggle. Presentation only.
 */
export default function MLlmConnectionSection(): React.ReactElement {
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
  const [providerOpen, setProviderOpen] = useState(false)

  const providerLabel = providerOptions.find(o => o.value === provider)?.label ?? provider

  return (
    <MSetCard title={t('settings.aiParsing.title')} icon={Sparkles} className="mt-3">
      <MSetHint className="mb-3">{t('settings.aiParsing.hint')}</MSetHint>

      <MSetEyebrow className="mb-[5px]">{t('settings.aiParsing.provider')}</MSetEyebrow>
      <MSetSelectRow
        label={providerLabel}
        trailing={<ChevronDown size={13} strokeWidth={2} className="flex-none text-m-faint" />}
        onClick={() => setProviderOpen(true)}
      />
      <MSetHint>{t('settings.aiParsing.localAdminOnly')}</MSetHint>

      <MSetEyebrow className="mb-[5px] mt-[14px]">{t('settings.aiParsing.model')}</MSetEyebrow>
      <MSetInput
        type="text"
        autoComplete="off"
        value={model}
        onChange={e => setModel(e.target.value)}
        placeholder="qwen3:8b"
      />

      {/* Both remaining providers are hosted and need a key, so this is no longer
          conditional (#1772). */}
      <MSetEyebrow className="mb-[5px] mt-[14px]">{t('settings.aiParsing.apiKey')}</MSetEyebrow>
      <MSetInput
        type="password"
        value={apiKey}
        onChange={e => setApiKey(e.target.value)}
        autoComplete="off"
        placeholder={hasStoredKey && !apiKey ? '••••••••' : t('settings.aiParsing.apiKey')}
      />
      <MSetHint>{t('settings.aiParsing.apiKeyHint')}</MSetHint>

      <div className="mt-3">
        <MSetRow
          first
          label={t('settings.aiParsing.multimodal')}
          sub={t('settings.aiParsing.multimodalHint')}
          trailing={
            <MToggle
              checked={multimodal}
              onChange={toggleMultimodal}
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
