import React, { useEffect, useState } from 'react'
import { Loader2, Plane, Save } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { airtrailApi } from '../../api/client'
import AirTrailIcon from '../shared/AirTrailIcon'
import Section from './Section'
import ToggleSwitch from './ToggleSwitch'
import { SETTINGS_BUTTON, SETTINGS_BUTTON_PRIMARY, SettingRow, SettingRows, SettingsHint, StatusPill } from './settingsKit'
import { EditorField, GRID_2, INPUT } from '../shared/dialogParts'
import { fs } from '../shared/DialogShell'

/**
 * Settings → Integrations → AirTrail. Per-user connection to a self-hosted
 * AirTrail instance (URL + Bearer API key). Mirrors the photo-provider (Immich)
 * connection layout: the two fields side by side, the switches as rows, then
 * Save / Test-connection, with the connection state as a pill in the card's band. The key is stored encrypted and never prefilled.
 */
export default function AirTrailConnectionSection(): React.ReactElement {
  const { t } = useTranslation()
  const toast = useToast()

  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [allowInsecureTls, setAllowInsecureTls] = useState(false)
  const [writeEnabled, setWriteEnabled] = useState(false)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    airtrailApi
      .getSettings()
      .then(d => {
        setUrl(d.url || '')
        setAllowInsecureTls(!!d.allowInsecureTls)
        setWriteEnabled(!!d.writeEnabled)
        setConnected(!!d.connected)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Send the key only when the user typed a new one — never prefilled, so a blank
  // field means "keep the stored key".
  const keyPayload = (): { apiKey?: string } => {
    const k = apiKey.trim()
    return k ? { apiKey: k } : {}
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const d = await airtrailApi.saveSettings({ url: url.trim(), allowInsecureTls, writeEnabled, ...keyPayload() })
      const status = await airtrailApi.status().catch(() => ({ connected: false }))
      setConnected(!!status.connected)
      setApiKey('')
      if (d?.warning) toast.warning(d.warning)
      else toast.success(t('settings.airtrail.toast.saved'))
    } catch (err) {
      const reason = (err as { response?: { data?: { error?: string } } } | null)?.response?.data?.error
      toast.error(reason || t('settings.airtrail.toast.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const d = await airtrailApi.test({ url: url.trim(), allowInsecureTls, ...keyPayload() })
      setConnected(!!d.connected)
      if (d.connected) toast.success(t('settings.airtrail.test.success', { count: d.flightCount ?? 0 }))
      else toast.error(d.error || t('settings.airtrail.test.failed'))
    } catch {
      toast.error(t('settings.airtrail.test.failed'))
    } finally {
      setTesting(false)
    }
  }

  const canSave = !!url.trim() && (connected || !!apiKey.trim())

  const fieldId = (name: string) => `airtrail-${name}`

  return (
    <Section
      title={t('settings.airtrail.title')}
      icon={AirTrailIcon}
      badge={
        <StatusPill tone={connected ? 'success' : 'neutral'} icon={<span className="h-1.5 w-1.5 rounded-full bg-current" />}>
          {connected ? t('settings.airtrail.connected') : t('settings.airtrail.notConnected')}
        </StatusPill>
      }
    >
      <div className={GRID_2}>
        <EditorField label={t('settings.airtrail.url')} htmlFor={fieldId('url')}>
          <input
            id={fieldId('url')}
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://airtrail.example.com"
            className={INPUT}
          />
        </EditorField>

        <EditorField label={t('settings.airtrail.apiKey')} htmlFor={fieldId('key')} hint={t('settings.airtrail.apiKeyHint')}>
          <input
            id={fieldId('key')}
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            autoComplete="off"
            placeholder={connected && !apiKey ? '••••••••' : t('settings.airtrail.apiKeyPlaceholder')}
            className={INPUT}
          />
        </EditorField>
      </div>

      <SettingRows>
        <SettingRow
          label={t('settings.airtrail.allowInsecureTls')}
          control={<ToggleSwitch on={allowInsecureTls} onToggle={() => setAllowInsecureTls(v => !v)} label={t('settings.airtrail.allowInsecureTls')} />}
        />
        <SettingRow
          label={t('settings.airtrail.writeBack')}
          hint={t('settings.airtrail.writeBackHint')}
          control={<ToggleSwitch on={writeEnabled} onToggle={() => setWriteEnabled(v => !v)} label={t('settings.airtrail.writeBack')} />}
        />
      </SettingRows>

      <div className="flex flex-wrap items-center gap-2" style={fs(13, 'body')}>
        <button type="button"
          onClick={handleSave}
          disabled={saving || loading || !canSave}
          className={SETTINGS_BUTTON_PRIMARY}
        >
          <Save size={14} strokeWidth={2.2} /> {t('common.save')}
        </button>
        <button type="button"
          onClick={handleTest}
          disabled={testing || loading || !url.trim()}
          className={SETTINGS_BUTTON}
        >
          {testing
            ? <Loader2 size={14} strokeWidth={2.2} className="animate-spin" />
            : <Plane size={14} strokeWidth={2.2} />}
          {t('settings.airtrail.test.button')}
        </button>
      </div>

      <SettingsHint>{t('settings.airtrail.hint')}</SettingsHint>
    </Section>
  )
}
