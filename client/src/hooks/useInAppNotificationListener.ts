import { useEffect } from 'react'
import { addListener, removeListener } from '../api/websocket'
import { useAuthStore } from '../store/authStore'
import { useInAppNotificationStore } from '../store/inAppNotificationStore.ts'
import { useSettingsStore } from '../store/settingsStore'
import { useTripStore } from '../store/tripStore'
import { useServerPing } from '../sync/useServerPing'

const reloadTags = () => useTripStore.getState().reloadTags()
const ACCOUNT_WIDE = { rejoin: false }

/**
 * The user's own channel, mounted once for the whole app: the bell's
 * notifications, and the account-wide state a change elsewhere (another tab, an
 * MCP client, the assistant) leaves stale in this one. The display settings and
 * the tags carry no values on the wire, so both are read again, one read per burst.
 */
export function useInAppNotificationListener(): void {
  const handleNew = useInAppNotificationStore(s => s.handleNewNotification)
  const handleUpdated = useInAppNotificationStore(s => s.handleUpdatedNotification)
  const handleAllRead = useInAppNotificationStore(s => s.handleAllRead)
  const signedIn = useAuthStore(s => s.isAuthenticated)
  const loadSettings = useSettingsStore(s => s.loadSettings)

  useEffect(() => {
    const listener = (event: Record<string, unknown>) => {
      if (event.type === 'notification:new') {
        handleNew(event.notification as any)
      } else if (event.type === 'notification:updated') {
        handleUpdated(event.notification as any)
      } else if (event.type === 'notification:read-all') {
        handleAllRead()
      }
    }
    addListener(listener)
    return () => removeListener(listener)
  }, [handleNew, handleUpdated, handleAllRead])

  // Both go to this user's sockets, so opening a trip (a room join) is no reason to read them.
  useServerPing('settings:updated', signedIn, loadSettings, ACCOUNT_WIDE)
  useServerPing('tags:changed', signedIn, reloadTags, ACCOUNT_WIDE)
}
