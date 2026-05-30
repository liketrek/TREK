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
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications(true)
  }, [])

  // Reload when filter changes
  useEffect(() => {
    // We need to fetch with the unreadOnly filter — re-fetch from scratch
    // The store fetchNotifications doesn't take a filter param directly,
    // so we use the API directly for filtered view via a side channel.
    // For now, reset and fetch — store always loads all, filter is client-side.
    fetchNotifications(true)
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

  const displayed = unreadOnly ? notifications.filter(n => !n.is_read) : notifications

  return {
    notifications, unreadCount, total, isLoading, hasMore,
    unreadOnly, setUnreadOnly, loaderRef, displayed,
    markAllRead, deleteAll,
  }
}
