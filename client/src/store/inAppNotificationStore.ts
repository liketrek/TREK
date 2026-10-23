import { create } from 'zustand'
import { inAppNotificationsApi } from '../api/client'

// The server contract (@trek/shared `inAppListResultSchema`) deliberately keeps
// each notification row as an open record — the registry-derived shape varies by
// type. This is the client's structured view of that row; the list/unread-count
// responses themselves are now typed + DEV-validated via inAppNotificationsApi.
export interface InAppNotification {
  id: number
  type: 'simple' | 'boolean' | 'navigate'
  scope: 'trip' | 'user' | 'admin'
  target: number
  sender_id: number | null
  sender_username: string | null
  sender_avatar: string | null
  recipient_id: number
  title_key: string
  title_params: Record<string, string>
  text_key: string
  text_params: Record<string, string>
  positive_text_key: string | null
  negative_text_key: string | null
  response: 'positive' | 'negative' | null
  navigate_text_key: string | null
  navigate_target: string | null
  is_read: boolean
  created_at: string
}

interface RawNotification extends Omit<InAppNotification, 'title_params' | 'text_params' | 'is_read'> {
  title_params: string | Record<string, string>
  text_params: string | Record<string, string>
  is_read: number | boolean
}

function normalizeNotification(raw: RawNotification): InAppNotification {
  return {
    ...raw,
    title_params: typeof raw.title_params === 'string' ? JSON.parse(raw.title_params || '{}') : raw.title_params,
    text_params: typeof raw.text_params === 'string' ? JSON.parse(raw.text_params || '{}') : raw.text_params,
    is_read: Boolean(raw.is_read),
  }
}

interface NotificationState {
  notifications: InAppNotification[]
  unreadCount: number
  total: number
  isLoading: boolean
  hasMore: boolean
  /** The filter the loaded pages were fetched with, so the next page continues the same list. */
  unreadOnly: boolean

  /**
   * Loads a page. A reset starts the list over with the given filter (default: all) and always
   * runs, replacing a load that is still in flight; a following page keeps the current filter.
   */
  fetchNotifications: (reset?: boolean, unreadOnly?: boolean) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markRead: (id: number) => Promise<void>
  markUnread: (id: number) => Promise<void>
  markAllRead: () => Promise<void>
  deleteNotification: (id: number) => Promise<void>
  deleteAll: () => Promise<void>
  respondToBoolean: (id: number, response: 'positive' | 'negative') => Promise<void>

  handleNewNotification: (notification: RawNotification) => void
  handleUpdatedNotification: (notification: RawNotification) => void
  handleAllRead: () => void
}

const PAGE_SIZE = 20

// Newest reset wins: a slower, older response must not overwrite the list of a filter the user has left.
let fetchSeq = 0

/** What marking everything read leaves, here or in another tab: every notification read, none to count. */
function allRead(state: NotificationState): Partial<NotificationState> {
  return { notifications: state.notifications.map(n => n.is_read ? n : { ...n, is_read: true }), unreadCount: 0 }
}

/** One notification marked read or unread: its row flips, and the count moves only if it was the other way. */
function markedOne(state: NotificationState, id: number, isRead: boolean): Partial<NotificationState> {
  const wasRead = Boolean(state.notifications.find(n => n.id === id)?.is_read)
  let delta = 0
  if (isRead && !wasRead) delta = -1
  if (!isRead && wasRead) delta = 1
  return {
    notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: isRead } : n),
    unreadCount: Math.max(0, state.unreadCount + delta),
  }
}

export const useInAppNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  isLoading: false,
  hasMore: false,
  unreadOnly: false,

  fetchNotifications: async (reset = false, unreadOnly) => {
    const { notifications, isLoading } = get()
    if (isLoading && !reset) return

    const filter = reset ? (unreadOnly ?? false) : get().unreadOnly
    const seq = ++fetchSeq
    set({ isLoading: true })
    try {
      // The server pages the filtered list. Rows marked read since they were loaded are still held
      // here but have left that list, so an unread-only page continues after the rows still unread.
      const offset = reset ? 0 : (filter ? notifications.filter(n => !n.is_read).length : notifications.length)
      const data = await inAppNotificationsApi.list({ limit: PAGE_SIZE, offset, ...(filter ? { unread_only: true } : {}) })
      if (seq !== fetchSeq) return
      const normalized = (data.notifications as unknown as RawNotification[]).map(normalizeNotification)

      const known = new Set(notifications.map(n => n.id))
      const merged = reset ? normalized : [...notifications, ...normalized.filter(n => !known.has(n.id))]
      set({
        notifications: merged,
        total: data.total,
        unreadCount: data.unread_count,
        hasMore: offset + normalized.length < data.total,
        unreadOnly: filter,
        isLoading: false,
      })
    } catch {
      if (seq === fetchSeq) set({ isLoading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const data = await inAppNotificationsApi.unreadCount()
      set({ unreadCount: data.count })
    } catch {
      // best-effort
    }
  },

  markRead: async (id: number) => {
    try {
      await inAppNotificationsApi.markRead(id)
      set(state => markedOne(state, id, true))
    } catch {
      // best-effort
    }
  },

  markUnread: async (id: number) => {
    try {
      await inAppNotificationsApi.markUnread(id)
      set(state => markedOne(state, id, false))
    } catch {
      // best-effort
    }
  },

  markAllRead: async () => {
    try {
      await inAppNotificationsApi.markAllRead()
      set(allRead)
    } catch {
      // best-effort
    }
  },

  deleteNotification: async (id: number) => {
    const notification = get().notifications.find(n => n.id === id)
    try {
      await inAppNotificationsApi.delete(id)
      set(state => ({
        notifications: state.notifications.filter(n => n.id !== id),
        total: Math.max(0, state.total - 1),
        unreadCount: notification && !notification.is_read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      }))
    } catch {
      // best-effort
    }
  },

  deleteAll: async () => {
    try {
      await inAppNotificationsApi.deleteAll()
      set({ notifications: [], total: 0, unreadCount: 0, hasMore: false })
    } catch {
      // best-effort
    }
  },

  respondToBoolean: async (id: number, response: 'positive' | 'negative') => {
    try {
      const data = await inAppNotificationsApi.respond(id, response)
      if (data.notification) {
        const normalized = normalizeNotification(data.notification as RawNotification)
        set(state => ({
          notifications: state.notifications.map(n => n.id === id ? normalized : n),
          unreadCount: !state.notifications.find(n => n.id === id)?.is_read
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
        }))
      }
    } catch {
      // best-effort
    }
  },

  handleNewNotification: (raw: RawNotification) => {
    const notification = normalizeNotification(raw)
    set(state => ({
      notifications: [notification, ...state.notifications],
      total: state.total + 1,
      unreadCount: state.unreadCount + 1,
    }))
  },

  // A notification read, unread or answered in another tab (or through MCP) moves
  // the bell's count too. One this tab has not loaded says nothing about what it
  // was before, so the count is asked for instead of guessed.
  handleUpdatedNotification: (raw: RawNotification) => {
    const notification = normalizeNotification(raw)
    const before = get().notifications.find(n => n.id === notification.id)
    if (!before) {
      void get().fetchUnreadCount()
      return
    }
    const delta = Number(!notification.is_read) - Number(!before.is_read)
    set(state => ({
      notifications: state.notifications.map(n => n.id === notification.id ? notification : n),
      unreadCount: Math.max(0, state.unreadCount + delta),
    }))
  },

  // Everything marked read at once elsewhere: the same end state markAllRead leaves.
  handleAllRead: () => set(allRead),
}))
