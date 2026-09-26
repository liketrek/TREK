import { useEffect, useRef, useState } from 'react'
import { WEB_PUSH_CHANNEL_ID } from '@trek/shared'
import { notificationsApi } from '../api/client'
import { useTranslation } from '../i18n'
import { useToast } from '../components/shared/Toast'
import {
  disableWebPush,
  enableWebPush,
  getWebPushSupport,
  loadPushPublicKey,
  readWebPushDeviceState,
  waitForPushRegistration,
  WebPushError,
  type WebPushDeviceState,
} from '../push/webPush'

/**
 * Everything the "Push notifications on this device" card does, in one hook.
 *
 * Shared by the desktop Settings tab and its phone twin on purpose: the two
 * shells render different markup around identical logic, and SonarCloud's 3%
 * duplication budget on new code has no room for a second copy
 * (`useDawarichConnection` is the same pattern for the same reason).
 *
 * The browser is the only record of whether this device is subscribed, so the
 * hook keeps no copy of its own beyond the last reading, and reads again after
 * every switch and whenever the page comes back into view (which is how a user
 * returns from unblocking notifications in the browser's site settings).
 */
export interface WebPushCardState {
  /** Null until the first look at this device has finished. */
  state: WebPushDeviceState | null
  /** The sentence for that state, already translated; null when the hint says it all. */
  stateText: string | null
  /** Push is possible here and not blocked, so the card offers the switch. */
  canSwitch: boolean
  on: boolean
  switchLabel: string
  busy: boolean
  canTest: boolean
  toggle: () => void
  sendTest: () => void
}

const STATE_TEXT_KEYS: Partial<Record<WebPushDeviceState, string>> = {
  unsupported: 'settings.webPush.unsupported',
  insecure: 'settings.webPush.insecure',
  'ios-install': 'settings.webPush.iosInstall',
  denied: 'settings.webPush.denied',
  on: 'settings.webPush.enabled',
}

export function useWebPush(): WebPushCardState {
  const { t } = useTranslation()
  const toast = useToast()
  const [state, setState] = useState<WebPushDeviceState | null>(null)
  const [busy, setBusy] = useState(false)
  const [testing, setTesting] = useState(false)
  const publicKey = useRef<string | null>(null)
  const registration = useRef<ServiceWorkerRegistration | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    let cancelled = false
    const look = () => {
      void readWebPushDeviceState().then(next => {
        if (!cancelled) setState(next)
      })
    }
    look()
    if (getWebPushSupport().supported) {
      // Fetched before any click. WebKit honours the permission prompt and
      // subscribe() only inside the user's gesture, and awaiting either of
      // these in the click handler would spend it.
      void loadPushPublicKey().then(key => {
        if (!cancelled) publicKey.current = key
      })
      void waitForPushRegistration().then(reg => {
        if (!cancelled) registration.current = reg
      })
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') look()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      mounted.current = false
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const settle = async () => {
    const next = await readWebPushDeviceState()
    if (!mounted.current) return
    setState(next)
    setBusy(false)
  }

  const switchOn = (): Promise<void> => {
    const key = publicKey.current
    if (key) return enableWebPush(key, registration.current)
    // The key could not be fetched ahead of time. Fetching it now may cost the
    // gesture on WebKit, but it is the only way left to try.
    return loadPushPublicKey().then(late => {
      if (!late) throw new WebPushError('failed', 'no public key')
      return enableWebPush(late, registration.current)
    })
  }

  const toggle = () => {
    if (busy || (state !== 'on' && state !== 'off')) return
    const turningOn = state === 'off'
    setBusy(true)
    const action = turningOn ? switchOn() : disableWebPush()
    action
      .catch(err => {
        if (!mounted.current) return
        // A block or a dismissed prompt is the user's answer, and the card
        // shows the first on its own; only a real failure deserves a toast.
        if (err instanceof WebPushError && (err.code === 'denied' || err.code === 'dismissed')) return
        console.warn('[push] switching this device failed', err)
        toast.error(turningOn ? t('settings.webPush.failed') : t('common.error'))
      })
      .finally(() => void settle())
  }

  const sendTest = () => {
    if (testing) return
    setTesting(true)
    notificationsApi
      .testChannel(WEB_PUSH_CHANNEL_ID)
      .then(result => {
        if (result.success) toast.success(t('settings.notificationPreferences.testSuccess'))
        else toast.error(result.error || t('settings.notificationPreferences.testFailed'))
      })
      .catch(() => toast.error(t('settings.notificationPreferences.testFailed')))
      .finally(() => {
        if (mounted.current) setTesting(false)
      })
  }

  const textKey = state ? STATE_TEXT_KEYS[state] : undefined
  return {
    state,
    stateText: textKey ? t(textKey) : null,
    canSwitch: state === 'on' || state === 'off',
    on: state === 'on',
    switchLabel: state === 'on' ? t('settings.webPush.disable') : t('settings.webPush.enable'),
    busy,
    canTest: state === 'on' && !testing && !busy,
    toggle,
    sendTest,
  }
}
