import React, { useEffect, useState } from 'react'
import Section from './Section'
import { Plane, Check, X, Loader2, AlertTriangle } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { airtrailApi } from '../../api/client'
import { AIRTRAIL_KEY_MASK } from '@trek/shared'

interface TestResult {
  connected: boolean
  flightCount?: number
  error?: string
}

/**
 * Settings → Integrations → AirTrail. Per-user connection to a self-hosted
 * AirTrail instance (URL + Bearer API key). The key is stored encrypted and
 * only ever echoed back masked. Mirrors the Immich connection flow.
 */
export default function AirTrailConnectionSection(): React.ReactElement {
  const { t } = useTranslation()
  const toast = useToast()

  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [allowInsecureTls, setAllowInsecureTls] = useState(false)
  const [hasStoredKey, setHasStoredKey] = useState(false)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  useEffect(() => {
    airtrailApi
      .getSettings()
      .then(d => {
        setUrl(d.url || '')
        setApiKey(d.apiKeyMasked || '')
        setHasStoredKey(!!d.apiKeyMasked)
        setAllowInsecureTls(!!d.allowInsecureTls)
        setConnected(!!d.connected)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  /** Send the key only when the user typed a new one (not blank, not the mask). */
  const keyPayload = (): { apiKey?: string } => {
    const trimmed = apiKey.trim()
    return trimmed && trimmed !== AIRTRAIL_KEY_MASK ? { apiKey: trimmed } : {}
  }

  const handleSave = async () => {
    setSaving(true)
    setWarning(null)
    setTestResult(null)
    try {
      const d = await airtrailApi.saveSettings({ url: url.trim(), allowInsecureTls, ...keyPayload() })
      const nowHasKey = hasStoredKey || !!keyPayload().apiKey
      setHasStoredKey(nowHasKey)
      setConnected(!!url.trim() && nowHasKey)
      if (apiKey.trim() && apiKey.trim() !== AIRTRAIL_KEY_MASK) setApiKey(AIRTRAIL_KEY_MASK)
      if (d?.warning) setWarning(d.warning)
      toast.success(t('settings.airtrail.toast.saved'))
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('settings.airtrail.toast.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const d = await airtrailApi.test({ url: url.trim(), allowInsecureTls, ...keyPayload() })
      setTestResult(d)
    } catch {
      setTestResult({ connected: false, error: t('settings.airtrail.test.failed') })
    } finally {
      setTesting(false)
    }
  }

  const canSubmit = !!url.trim() && (hasStoredKey || !!apiKey.trim())

  return (
    <Section title={t('settings.airtrail.title')} icon={Plane}>
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        {t('settings.airtrail.hint')}
      </p>

      {/* Instance URL */}
      <div>
        <label className="block text-sm font-medium mb-1.5 text-content-secondary">
          {t('settings.airtrail.url')}
        </label>
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://airtrail.example.com"
          className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 border-edge bg-surface-secondary text-content"
        />
      </div>

      {/* API key */}
      <div>
        <label className="block text-sm font-medium mb-1.5 text-content-secondary">
          {t('settings.airtrail.apiKey')}
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          onFocus={() => { if (apiKey === AIRTRAIL_KEY_MASK) setApiKey('') }}
          placeholder={t('settings.airtrail.apiKeyPlaceholder')}
          autoComplete="off"
          className="w-full px-3 py-2.5 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-400 border-edge bg-surface-secondary text-content"
        />
        <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {t('settings.airtrail.apiKeyHint')}
        </p>
      </div>

      {/* Self-signed TLS */}
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={allowInsecureTls}
          onChange={e => setAllowInsecureTls(e.target.checked)}
          className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <div>
          <span className="text-sm font-medium text-content-secondary">{t('settings.airtrail.allowInsecureTls')}</span>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{t('settings.airtrail.allowInsecureTlsHint')}</p>
        </div>
      </label>

      {/* Private-IP warning from the last save */}
      {warning && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.3)]">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#92400e]">{warning}</p>
        </div>
      )}

      {/* Test result */}
      {testResult && (
        <div
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm ${
            testResult.connected
              ? 'bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.3)] text-green-600'
              : 'bg-[rgba(239,68,68,0.06)] border-[rgba(239,68,68,0.3)] text-red-600'
          }`}
        >
          {testResult.connected ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {testResult.connected
            ? t('settings.airtrail.test.success', { count: testResult.flightCount ?? 0 })
            : testResult.error || t('settings.airtrail.test.failed')}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-slate-400'}`} />
          {connected ? t('settings.airtrail.connected') : t('settings.airtrail.notConnected')}
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleTest}
            disabled={testing || loading || !url.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-edge text-content-secondary transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {t('settings.airtrail.test.button')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || !canSubmit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {t('common.save')}
          </button>
        </div>
      </div>
    </Section>
  )
}
