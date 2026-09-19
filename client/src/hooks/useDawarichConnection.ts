import { useCallback, useEffect, useState } from 'react'
import type { DawarichCapabilities, DawarichErrorCode, DawarichSyncState } from '@trek/shared'
import { dawarichApi } from '../api/dawarich'
import { useTranslation } from '../i18n'
import { useToast } from '../components/shared/Toast'

/**
 * Everything the Dawarich connection card does, in one hook.
 *
 * Shared by the desktop section and its phone twin on purpose. The two shells
 * render very different markup and identical logic, and SonarCloud's 3%
 * duplication budget on new code is not big enough for a second copy of this —
 * `useInstanceSettings` under `components/Admin/` is the same pattern for the
 * same reason.
 */
export interface DawarichConnectionState {
  url: string
  setUrl: (value: string) => void
  apiKey: string
  setApiKey: (value: string) => void
  allowInsecureTls: boolean
  toggleInsecureTls: () => void
  syncEnabled: boolean
  toggleSync: () => void

  connected: boolean
  loading: boolean
  saving: boolean
  testing: boolean
  syncing: boolean

  lastSyncAt: string | null
  lastSyncState: DawarichSyncState
  /** Already translated; null when the last sync was clean. */
  lastSyncError: string | null
  capabilities: DawarichCapabilities | null
  /** Set after a test run, so the card can show what the probe found. */
  probeMessage: string | null

  canSave: boolean
  save: () => Promise<void>
  test: () => Promise<void>
  syncNow: () => Promise<void>
  disconnect: () => Promise<void>
}

export function useDawarichConnection(): DawarichConnectionState {
  const { t } = useTranslation()
  const toast = useToast()

  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [allowInsecureTls, setAllowInsecureTls] = useState(false)
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [connected, setConnected] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const [lastSyncState, setLastSyncState] = useState<DawarichSyncState>('never')
  const [lastSyncErrorCode, setLastSyncErrorCode] = useState<string | null>(null)
  const [capabilities, setCapabilities] = useState<DawarichCapabilities | null>(null)
  const [probeMessage, setProbeMessage] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  /**
   * Reason codes rather than the upstream sentence: Dawarich answers in English
   * and occasionally quotes the URL back, and neither belongs on a German
   * install. An unknown code still gets a sentence rather than nothing.
   */
  const translateError = useCallback(
    (code: string | null): string | null => {
      if (!code) return null
      const key = `dawarich.error.${code}`
      const text = t(key)
      return text === key ? t('dawarich.error.unknown') : text
    },
    [t],
  )

  useEffect(() => {
    let cancelled = false
    dawarichApi
      .getSettings()
      .then(data => {
        if (cancelled) return
        setUrl(data.url || '')
        setAllowInsecureTls(!!data.allowInsecureTls)
        setSyncEnabled(data.syncEnabled !== false)
        setConnected(!!data.connected)
        setLastSyncAt(data.lastSyncAt)
        setLastSyncState(data.lastSyncState)
        setLastSyncErrorCode(data.lastSyncError)
        setCapabilities(data.capabilities)
      })
      .catch(() => {
        // A failed read of our own settings is a TREK problem, not a Dawarich
        // one — the card stays in its empty state rather than claiming the
        // instance is unreachable.
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  /** The key field is never prefilled, so blank means "keep the stored one". */
  const keyPayload = useCallback((): { apiKey?: string } => {
    const typed = apiKey.trim()
    return typed ? { apiKey: typed } : {}
  }, [apiKey])

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const result = await dawarichApi.saveSettings({
        url: url.trim(),
        allowInsecureTls,
        syncEnabled,
        ...keyPayload(),
      })
      const fresh = await dawarichApi.getSettings().catch(() => null)
      if (fresh) {
        setConnected(!!fresh.connected)
        setCapabilities(fresh.capabilities)
        setLastSyncState(fresh.lastSyncState)
        setLastSyncErrorCode(fresh.lastSyncError)
      }
      setApiKey('')
      // The warning the server attaches when the address resolves to a private
      // IP. Rendered from its code so it arrives in the reader's language; the
      // server's own sentence is the fallback for a code this build predates.
      if (result?.warning) {
        const key = result.warningCode ? `dawarich.warning.${result.warningCode}` : ''
        const translated = key ? t(key, { ip: result.warningIp ?? '' }) : ''
        toast.warning(translated && translated !== key ? translated : result.warning)
      }
      else toast.success(t('dawarich.toast.saved'))
    } catch (err) {
      toast.error(errorText(err, t) || t('dawarich.toast.saveError'))
    } finally {
      setSaving(false)
    }
  }, [url, allowInsecureTls, syncEnabled, keyPayload, toast, t])

  const test = useCallback(async () => {
    setTesting(true)
    setProbeMessage(null)
    try {
      const result = await dawarichApi.test({ url: url.trim(), allowInsecureTls, ...keyPayload() })
      setConnected(!!result.connected)
      if (result.capabilities) setCapabilities(result.capabilities)
      if (result.connected) {
        setProbeMessage(t('dawarich.test.success', { count: result.visitCount ?? 0 }))
        toast.success(t('dawarich.test.success', { count: result.visitCount ?? 0 }))
      } else {
        const message = translateError(result.error ?? null) ?? t('dawarich.test.failed')
        // The reason underneath, where the server managed to name one. The codes
        // above are deliberately vague so an English sentence from Dawarich does
        // not land on a German install, but "TREK could not reach that address"
        // alone leaves a self-hoster with nothing to act on: it reads the same
        // whether the host is down, the certificate was rejected, or TREK refused
        // a private address on purpose and would need ALLOW_INTERNAL_NETWORK to
        // permit it. The panel gets both; the toast stays one line.
        setProbeMessage(result.errorDetail ? `${message} (${result.errorDetail})` : message)
        toast.error(message)
      }
    } catch (err) {
      const message = errorText(err, t) || t('dawarich.test.failed')
      setProbeMessage(message)
      toast.error(message)
    } finally {
      setTesting(false)
    }
  }, [url, allowInsecureTls, keyPayload, toast, t, translateError])

  const syncNow = useCallback(async () => {
    setSyncing(true)
    try {
      const result = await dawarichApi.syncNow()
      if (result.alreadyRunning) {
        // Somebody (or the cron) is mid-sync. Saying "0 new stays" here would be
        // a result, and there is no result yet.
        toast.info(t('dawarich.toast.syncRunning'))
        return
      }
      setLastSyncAt(new Date().toISOString())
      setLastSyncState((result.state as DawarichSyncState) ?? 'ok')
      setLastSyncErrorCode(null)
      // Said as a count rather than "done": a sync that found nothing and one
      // that failed silently look identical otherwise.
      toast.success(t('dawarich.toast.synced', { count: result.created ?? 0 }))
    } catch (err) {
      setLastSyncState('failed')
      toast.error(errorText(err, t) || t('dawarich.toast.syncError'))
    } finally {
      setSyncing(false)
    }
  }, [toast, t])

  const disconnect = useCallback(async () => {
    setSaving(true)
    try {
      await dawarichApi.disconnect()
      setUrl('')
      setApiKey('')
      setConnected(false)
      setCapabilities(null)
      setLastSyncAt(null)
      setLastSyncState('never')
      setLastSyncErrorCode(null)
      setProbeMessage(null)
      toast.success(t('dawarich.toast.disconnected'))
    } catch (err) {
      toast.error(errorText(err, t) || t('dawarich.toast.saveError'))
    } finally {
      setSaving(false)
    }
  }, [toast, t])

  return {
    url,
    setUrl,
    apiKey,
    setApiKey,
    allowInsecureTls,
    toggleInsecureTls: () => setAllowInsecureTls(v => !v),
    syncEnabled,
    toggleSync: () => setSyncEnabled(v => !v),
    connected,
    loading,
    saving,
    testing,
    syncing,
    lastSyncAt,
    lastSyncState,
    lastSyncError: translateError(lastSyncErrorCode),
    capabilities,
    probeMessage,
    // An address alone is not a connection, and the key field is blank once a
    // key is stored — so saving needs either an existing connection or a typed key.
    canSave: !!url.trim() && (connected || !!apiKey.trim()),
    save,
    test,
    syncNow,
    disconnect,
  }
}

/**
 * The server's `{ code, error }` envelope, as a sentence the reader can read.
 *
 * The code comes first and the prose is the fallback: the server's own sentence
 * is written in English, and a German install should not be told what went
 * wrong in a language it does not speak. A code this version has no string for
 * falls back to the sentence rather than to nothing.
 */
function errorText(err: unknown, t?: (key: string) => string): string | null {
  const data = (err as { response?: { data?: { error?: unknown; code?: unknown } } })?.response?.data
  if (t && typeof data?.code === 'string') {
    const key = `dawarich.error.${data.code}`
    const text = t(key)
    if (text !== key) return text
  }
  return typeof data?.error === 'string' ? data.error : null
}

/** Exported for the error-code type so consumers do not re-declare it. */
export type { DawarichErrorCode }
