/**
 * FE-ADMCHAN-001 to FE-ADMCHAN-008: the admin's channel switches, shared by
 * the desktop Notifications tab and the phone section.
 *
 * Every switch rewrites one comma-separated app setting. The two things that
 * must never happen are the ones a rebuild-from-booleans used to do: drop an id
 * this build does not know (a plugin channel, or a newer built-in), and leave
 * the screen claiming a state the server refused to store.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
import {
  BUILTIN_CHANNEL_ORDER,
  parseChannelList,
  serializeChannelList,
  SWITCH_ONLY_CHANNELS,
  toggleChannelList,
  useNotificationChannels,
} from './useNotificationChannels'

const updateAppSettings = vi.hoisted(() => vi.fn())
vi.mock('../../api/client', () => ({ authApi: { updateAppSettings } }))

const t = (key: string) => (key === 'common.error' ? 'Error' : key)

function mount(initial: Record<string, string>) {
  const toast = { error: vi.fn() }
  const hook = renderHook(() => {
    const [smtpValues, setSmtpValues] = useState(initial)
    return { smtpValues, channels: useNotificationChannels({ smtpValues, setSmtpValues, toast }, t) }
  })
  return { hook, toast }
}

beforeEach(() => {
  updateAppSettings.mockReset()
  updateAppSettings.mockResolvedValue({})
})

describe('the stored list', () => {
  it('FE-ADMCHAN-001: reads the plural setting, the legacy singular one, and none', () => {
    expect(parseChannelList({ notification_channels: 'email, push ,plugin-gotify' })).toEqual(['email', 'push', 'plugin-gotify'])
    expect(parseChannelList({ notification_channel: 'webhook' })).toEqual(['webhook'])
    expect(parseChannelList({ notification_channels: 'none' })).toEqual([])
    expect(parseChannelList({})).toEqual([])
    expect(parseChannelList({ notification_channels: 'email,' })).toEqual(['email'])
  })

  it('FE-ADMCHAN-002: writes built-ins in their fixed order and keeps every other id', () => {
    expect(serializeChannelList(['plugin-gotify', 'push', 'email'])).toBe('email,push,plugin-gotify')
    expect(serializeChannelList([])).toBe('none')
  })

  it('FE-ADMCHAN-003: flips exactly one id', () => {
    expect(toggleChannelList(['email', 'plugin-gotify'], 'push')).toBe('email,push,plugin-gotify')
    expect(toggleChannelList(['email', 'push'], 'push')).toBe('email')
    expect(toggleChannelList(['push'], 'push')).toBe('none')
  })

  it('FE-ADMCHAN-004: Web Push is a built-in with its own switch card', () => {
    expect(BUILTIN_CHANNEL_ORDER).toEqual(['email', 'webhook', 'ntfy', 'push'])
    expect(SWITCH_ONLY_CHANNELS.map(c => c.id)).toEqual(['webhook', 'ntfy', 'push'])
    expect(SWITCH_ONLY_CHANNELS[2]).toEqual({
      id: 'push',
      titleKey: 'admin.notifications.webPushPanel.title',
      hintKey: 'admin.notifications.webPushPanel.hint',
    })
  })
})

describe('useNotificationChannels', () => {
  it('FE-ADMCHAN-005: answers which channels are on', () => {
    const { hook } = mount({ notification_channels: 'email,push' })
    expect(hook.result.current.channels.isActive('push')).toBe(true)
    expect(hook.result.current.channels.isActive('ntfy')).toBe(false)
  })

  it('FE-ADMCHAN-006: switching one on saves the whole list and shows it at once', async () => {
    const { hook, toast } = mount({ notification_channels: 'email,plugin-gotify' })
    await act(() => hook.result.current.channels.toggle('push'))
    expect(updateAppSettings).toHaveBeenCalledWith({ notification_channels: 'email,push,plugin-gotify' })
    expect(hook.result.current.smtpValues.notification_channels).toBe('email,push,plugin-gotify')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('FE-ADMCHAN-007: a failed save puts the previous list back and says so', async () => {
    updateAppSettings.mockRejectedValueOnce(new Error('500'))
    const { hook, toast } = mount({ notification_channels: 'email' })
    await act(() => hook.result.current.channels.toggle('push'))
    expect(updateAppSettings).toHaveBeenCalledWith({ notification_channels: 'email,push' })
    expect(hook.result.current.smtpValues.notification_channels).toBe('email')
    expect(hook.result.current.channels.isActive('push')).toBe(false)
    expect(toast.error).toHaveBeenCalledWith('Error')
  })

  it('FE-ADMCHAN-008: the rollback writes the normalised form, never an id less', async () => {
    updateAppSettings.mockRejectedValueOnce(new Error('500'))
    const { hook } = mount({ notification_channels: 'plugin-gotify, email' })
    await act(() => hook.result.current.channels.toggle('webhook'))
    expect(hook.result.current.smtpValues.notification_channels).toBe('email,plugin-gotify')
  })
})
