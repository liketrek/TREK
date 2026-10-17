import { useCallback, useEffect, useRef, useState } from 'react'
import type { GoogleQuotaStatus } from '@trek/shared'
import { adminApi } from '../../api/client'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { getApiErrorMessage } from '../../utils/apiError'

/**
 * The admin's daily ceiling on Google API calls and today's count (#1582).
 * Admin configuration, online only like the rest of the settings tab.
 */
export function useGoogleQuota() {
  const { t } = useTranslation()
  const toast = useToast()
  const [status, setStatus] = useState<GoogleQuotaStatus | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  // Read through a ref: the load runs once when the row opens, and a new toast or
  // t identity on a later render must not fetch again and reset what is typed.
  const notify = useRef({ toast, t })
  notify.current = { toast, t }

  useEffect(() => {
    let cancelled = false
    adminApi.getGoogleQuota()
      .then((s: GoogleQuotaStatus) => {
        if (cancelled) return
        setStatus(s)
        setDraft(s.daily_limit == null ? '' : String(s.daily_limit))
      })
      .catch((err: unknown) => {
        if (!cancelled) notify.current.toast.error(getApiErrorMessage(err, notify.current.t('common.error')))
      })
    return () => { cancelled = true }
  }, [])

  const stored = status?.daily_limit == null ? '' : String(status.daily_limit)
  const dirty = status !== null && draft.trim() !== stored

  const save = useCallback(async () => {
    if (!dirty || saving) return
    const parsed = Number.parseInt(draft.trim(), 10)
    const limit = draft.trim() === '' || !Number.isFinite(parsed) || parsed <= 0 ? null : parsed
    setSaving(true)
    try {
      const next: GoogleQuotaStatus = await adminApi.updateGoogleQuota(limit)
      setStatus(next)
      setDraft(next.daily_limit == null ? '' : String(next.daily_limit))
      toast.success(t('admin.googleQuota.saved'))
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }, [dirty, saving, draft, toast, t])

  return { status, draft, setDraft, dirty, saving, save }
}
