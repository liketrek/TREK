import React from 'react'
import { Plane, Save, RefreshCw } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { useAirTrailSettings } from '../../../components/Settings/useAirTrailSettings'
import { MSetCard, MSetEyebrow, MSetRow, MSetInput, MSetButton, MSetHint } from './MSettingsUi'
import MToggle from '../../components/MToggle'

/**
 * Mobile-native twin of components/Settings/AirTrailConnectionSection. Same
 * per-user connection logic (URL + Bearer API key, insecure-TLS + write-back
 * toggles, save + test with a status badge, key never prefilled), rebuilt on the
 * MSet* card system with MToggle switches. Presentation only.
 */
export default function MAirTrailConnectionSection(): React.ReactElement {
  const { t } = useTranslation()

  const {
    url,
    setUrl,
    apiKey,
    setApiKey,
    allowInsecureTls,
    toggleInsecureTls,
    writeEnabled,
    toggleWriteEnabled,
    connected,
    loading,
    saving,
    testing,
    canSave,
    handleSave,
    handleTest,
  } = useAirTrailSettings()

  return (
    <MSetCard title={t('settings.airtrail.title')} icon={Plane} className="mt-3">
      <MSetEyebrow className="mb-[5px]">{t('settings.airtrail.url')}</MSetEyebrow>
      <MSetInput
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="https://airtrail.example.com"
      />

      <MSetEyebrow className="mb-[5px] mt-[14px]">{t('settings.airtrail.apiKey')}</MSetEyebrow>
      <MSetInput
        type="password"
        value={apiKey}
        onChange={e => setApiKey(e.target.value)}
        autoComplete="off"
        placeholder={connected && !apiKey ? '••••••••' : t('settings.airtrail.apiKeyPlaceholder')}
      />
      <MSetHint>{t('settings.airtrail.apiKeyHint')}</MSetHint>

      <div className="mt-3">
        <MSetRow
          first
          label={t('settings.airtrail.allowInsecureTls')}
          trailing={
            <MToggle
              checked={allowInsecureTls}
              onChange={toggleInsecureTls}
              ariaLabel={t('settings.airtrail.allowInsecureTls')}
            />
          }
        />
        <MSetRow
          label={t('settings.airtrail.writeBack')}
          sub={t('settings.airtrail.writeBackHint')}
          trailing={
            <MToggle
              checked={writeEnabled}
              onChange={toggleWriteEnabled}
              ariaLabel={t('settings.airtrail.writeBack')}
            />
          }
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <MSetButton variant="primary" onClick={handleSave} disabled={saving || loading || !canSave}>
          <Save size={14} /> {t('common.save')}
        </MSetButton>
        <MSetButton variant="ghost" onClick={handleTest} disabled={testing || loading || !url.trim()}>
          {testing ? <RefreshCw size={14} className="animate-spin" /> : <Plane size={14} />}
          {t('settings.airtrail.test.button')}
        </MSetButton>
        {connected ? (
          <span className="inline-flex items-center gap-[6px] font-geist text-[0.6875rem] font-bold text-[color:var(--m-st-confirmed)]">
            <span className="h-2 w-2 rounded-full bg-[color:var(--m-st-confirmed)]" />
            {t('settings.airtrail.connected')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-[6px] font-geist text-[0.6875rem] font-bold text-m-faint">
            <span className="h-2 w-2 rounded-full bg-[color:var(--m-trackoff)]" />
            {t('settings.airtrail.notConnected')}
          </span>
        )}
      </div>

      <MSetHint>{t('settings.airtrail.hint')}</MSetHint>
    </MSetCard>
  )
}
