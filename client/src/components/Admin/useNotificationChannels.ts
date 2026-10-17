import type { Dispatch, SetStateAction } from 'react'
import { WEB_PUSH_CHANNEL_ID } from '@trek/shared'
import { authApi } from '../../api/client'
import type { TranslationFn } from '../../types'

/**
 * The admin's channel switches, shared by the desktop Notifications tab and its
 * phone twin. Both used to carry their own copy of a three-boolean
 * `setChannels`, and a fourth channel would have meant a fourth argument in
 * two places; SonarCloud's duplication budget has no room for that either.
 *
 * All switches write one app setting, `notification_channels`, a comma
 * separated list of channel ids. Ids this build does not know (a plugin
 * channel, or one a newer server added) must survive a toggle untouched, so
 * the list is edited, never rebuilt from the switches.
 */

/** The built-in channels, in the order they are written to the list. Other ids follow as stored. */
export const BUILTIN_CHANNEL_ORDER: readonly string[] = ['email', 'webhook', 'ntfy', WEB_PUSH_CHANNEL_ID]

/** The channels whose admin card is only a title, a hint and the switch (email carries the SMTP form). */
export const SWITCH_ONLY_CHANNELS: ReadonlyArray<{ id: string; titleKey: string; hintKey: string }> = [
  { id: 'webhook', titleKey: 'admin.notifications.webhookPanel.title', hintKey: 'admin.webhook.hint' },
  { id: 'ntfy', titleKey: 'admin.notifications.ntfy', hintKey: 'admin.ntfy.hint' },
  {
    id: WEB_PUSH_CHANNEL_ID,
    titleKey: 'admin.notifications.webPushPanel.title',
    hintKey: 'admin.notifications.webPushPanel.hint',
  },
]

/**
 * The active ids, from `notification_channels` or, on installs that predate
 * it, the singular `notification_channel`. 'none' is the stored empty list.
 */
export function parseChannelList(values: Record<string, string>): string[] {
  const raw = values.notification_channels ?? values.notification_channel ?? 'none'
  if (raw === 'none') return []
  return raw
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)
}

/** The stored form: built-ins in their fixed order, then every other id as it was, or 'none'. */
export function serializeChannelList(active: readonly string[]): string {
  const builtins = BUILTIN_CHANNEL_ORDER.filter(id => active.includes(id))
  const others = active.filter(id => !BUILTIN_CHANNEL_ORDER.includes(id))
  return [...builtins, ...others].join(',') || 'none'
}

/** The stored list with `id` switched the other way. */
export function toggleChannelList(active: readonly string[], id: string): string {
  return serializeChannelList(active.includes(id) ? active.filter(c => c !== id) : [...active, id])
}

interface ChannelSettingsHost {
  smtpValues: Record<string, string>
  setSmtpValues: Dispatch<SetStateAction<Record<string, string>>>
  toast: { error: (message: string) => void }
}

export interface NotificationChannelSwitches {
  isActive: (id: string) => boolean
  /** Flips one channel and saves the list; puts the old list back and toasts when the save fails. */
  toggle: (id: string) => Promise<void>
}

export function useNotificationChannels(
  { smtpValues, setSmtpValues, toast }: ChannelSettingsHost,
  t: TranslationFn,
): NotificationChannelSwitches {
  const active = parseChannelList(smtpValues)

  const toggle = async (id: string) => {
    const next = toggleChannelList(active, id)
    setSmtpValues(prev => ({ ...prev, notification_channels: next }))
    try {
      await authApi.updateAppSettings({ notification_channels: next })
    } catch {
      const reverted = serializeChannelList(active)
      setSmtpValues(prev => ({ ...prev, notification_channels: reverted }))
      toast.error(t('common.error'))
    }
  }

  return { isActive: id => active.includes(id), toggle }
}
