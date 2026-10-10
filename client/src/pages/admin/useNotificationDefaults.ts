import { useEffect, useRef, useState } from 'react'
import type { NotificationDefault } from '@trek/shared'
import { adminApi } from '../../api/client'
import { useToast } from '../../components/shared/Toast'
import { useTranslation } from '../../i18n'
import type { NotificationChannelDescriptor } from '../../components/Settings/notificationLabels'

export interface NotificationDefaultsMatrix {
  defaults: Record<string, Record<string, NotificationDefault>>
  channels: NotificationChannelDescriptor[]
  event_types: string[]
  implemented_combos: Record<string, string[]>
}

/**
 * The admin's defaults for user notifications (#1536). Each change saves at
 * once and is rolled back with a toast when the server refuses it.
 */
export function useNotificationDefaults() {
  const { t } = useTranslation()
  const toast = useToast()
  const [matrix, setMatrix] = useState<NotificationDefaultsMatrix | null>(null)
  const [saving, setSaving] = useState(false)
  const notify = useRef({ toast, t })
  notify.current = { toast, t }

  useEffect(() => {
    let cancelled = false
    adminApi.getNotificationDefaults()
      .then((data: NotificationDefaultsMatrix) => { if (!cancelled) setMatrix(data) })
      .catch(() => { if (!cancelled) notify.current.toast.error(notify.current.t('common.error')) })
    return () => { cancelled = true }
  }, [])

  const cycle = async (eventType: string, channel: string, next: NotificationDefault) => {
    if (!matrix) return
    const before = matrix.defaults[eventType]?.[channel] ?? 'on'
    const apply = (value: NotificationDefault) =>
      setMatrix(m => m ? { ...m, defaults: { ...m.defaults, [eventType]: { ...m.defaults[eventType], [channel]: value } } } : m)
    apply(next)
    setSaving(true)
    try {
      const fresh: NotificationDefaultsMatrix = await adminApi.updateNotificationDefaults({ [eventType]: { [channel]: next } })
      setMatrix(fresh)
    } catch {
      apply(before)
      toast.error(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return { matrix, saving, cycle }
}
