import { useEffect, useRef, useState } from 'react'
import { useInAppNotificationStore } from '../../store/inAppNotificationStore.ts'

/**
 * In-app notifications data hook — owns the store wiring, the unread-only
 * filter, the initial + filter-change fetches and the infinite-scroll observer.
 * InAppNotificationsPage is a pure wiring container. Behaviour is identical to
 * the previous in-component logic.
 */
export function useInAppNotifications() {
  const { notifications, unreadCount, total, isLoading, hasMore, fetchNotifications, markAllRead, deleteAll } = useInAppNotificationStore()
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  // First load and every filter change: start the list over, the server filters it.
  useEffect(() => {
    fetchNotifications(true, unreadOnly)
  }, [unreadOnly])

  // Infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        fetchNotifications(false)
      }
    }, { threshold: 0.1 })
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, isLoading])

  // Rows marked read while the Unread filter is on stay out of sight at once, before any reload.
  const displayed = unreadOnly ? notifications.filter(n => !n.is_read) : notifications
  // The server's total follows the filter, so with Unread on it counts the unread ones.
  const shownTotal = unreadOnly ? unreadCount : total

  const confirmDeleteAll = async () => {
    setConfirmingDeleteAll(false)
    await deleteAll()
  }

  return {
    notifications, unreadCount, total: shownTotal, isLoading, hasMore,
    unreadOnly, setUnreadOnly, loaderRef, displayed,
    markAllRead,
    confirmingDeleteAll,
    requestDeleteAll: () => setConfirmingDeleteAll(true),
    cancelDeleteAll: () => setConfirmingDeleteAll(false),
    confirmDeleteAll,
  }
}
