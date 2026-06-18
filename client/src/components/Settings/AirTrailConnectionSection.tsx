import React, { useEffect, useState } from 'react'
import { Plane, Save } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { airtrailApi } from '../../api/client'
import Section from './Section'
import ToggleSwitch from './ToggleSwitch'

/**
 * Settings → Integrations → AirTrail. Per-user connection to a self-hosted
 * AirTrail instance (URL + Bearer API key). Mirrors the photo-provider (Immich)
 * connection layout: stacked fields, a toggle, then Save / Test-connection with
 * a status badge. The key is stored encrypted and never prefilled.
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
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('settings.airtrail.toast.saveError'))
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

  return (
    <Section title={t('settings.airtrail.title')} icon={Plane}>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('settings.airtrail.url')}</label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://airtrail.example.com"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('settings.airtrail.apiKey')}</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            autoComplete="off"
            placeholder={connected && !apiKey ? '••••••••' : t('settings.airtrail.apiKeyPlaceholder')}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
          <p className="mt-1 text-xs text-slate-500">{t('settings.airtrail.apiKeyHint')}</p>
        </div>

        <div className="flex items-center gap-3">
          <ToggleSwitch on={allowInsecureTls} onToggle={() => setAllowInsecureTls(v => !v)} />
          <span className="text-sm font-medium text-slate-700">{t('settings.airtrail.allowInsecureTls')}</span>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <ToggleSwitch on={writeEnabled} onToggle={() => setWriteEnabled(v => !v)} />
            <span className="text-sm font-medium text-slate-700">{t('settings.airtrail.writeBack')}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{t('settings.airtrail.writeBackHint')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || loading || !canSave}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-700 disabled:bg-slate-400"
          >
            <Save className="w-4 h-4" /> {t('common.save')}
          </button>
          <button
            onClick={handleTest}
            disabled={testing || loading || !url.trim()}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
          >
            {testing ? (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
            ) : (
              <Plane className="w-4 h-4" />
            )}
            {t('settings.airtrail.test.button')}
          </button>
          {connected ? (
            <span className="basis-full sm:basis-auto text-xs font-medium text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              {t('settings.airtrail.connected')}
            </span>
          ) : (
            <span className="basis-full sm:basis-auto text-xs font-medium text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-slate-300 rounded-full" />
              {t('settings.airtrail.notConnected')}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500">{t('settings.airtrail.hint')}</p>
      </div>
    </Section>
  )
}
