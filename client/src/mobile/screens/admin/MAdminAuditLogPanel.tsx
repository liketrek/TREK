import React, { useCallback, useEffect, useState } from 'react'
import { RefreshCw, ClipboardList } from 'lucide-react'
import { adminApi } from '../../../api/client'
import { useTranslation } from '../../../i18n'
import { MAdminButton } from './MAdminUi'

interface AuditEntry {
  id: number
  created_at: string
  user_id: number | null
  username: string | null
  user_email: string | null
  action: string
  resource: string | null
  details: Record<string, unknown> | null
  ip: string | null
}

interface AuditLogPanelProps {
  serverTimezone?: string
}

export default function MAdminAuditLogPanel({ serverTimezone }: AuditLogPanelProps): React.ReactElement {
  const { t, locale } = useTranslation()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const limit = 100

  const loadFirstPage = useCallback(async () => {
    setLoading(true)
    try {
      const data = (await adminApi.auditLog({ limit, offset: 0 })) as {
        entries: AuditEntry[]
        total: number
      }
      setEntries(data.entries || [])
      setTotal(data.total ?? 0)
      setOffset(0)
    } catch {
      setEntries([])
      setTotal(0)
      setOffset(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    const nextOffset = offset + limit
    setLoading(true)
    try {
      const data = (await adminApi.auditLog({ limit, offset: nextOffset })) as {
        entries: AuditEntry[]
        total: number
      }
      setEntries((prev) => [...prev, ...(data.entries || [])])
      setTotal(data.total ?? 0)
      setOffset(nextOffset)
    } catch {
      /* keep existing */
    } finally {
      setLoading(false)
    }
  }, [offset])

  useEffect(() => {
    loadFirstPage()
  }, [loadFirstPage])

  const fmtTime = (iso: string) => {
    try {
      return new Date(iso.endsWith('Z') ? iso : iso + 'Z').toLocaleString(locale, {
        dateStyle: 'short',
        timeStyle: 'medium',
        timeZone: serverTimezone || undefined,
      })
    } catch {
      return iso
    }
  }

  const fmtDetails = (d: Record<string, unknown> | null) => {
    if (!d || Object.keys(d).length === 0) return '—'
    try {
      return JSON.stringify(d)
    } catch {
      return '—'
    }
  }

  const userLabel = (e: AuditEntry) => {
    if (e.username) return e.username
    if (e.user_email) return e.user_email
    if (e.user_id != null) return `#${e.user_id}`
    return '—'
  }

  return (
    <div className="space-y-3">
      {/* Header: title + subtitle + refresh */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[0.9375rem] font-extrabold text-m-ink">
            <ClipboardList size={18} strokeWidth={2.2} className="flex-none" />
            {t('admin.tabs.audit')}
          </div>
          <p className="mt-[3px] font-geist text-[0.625rem] leading-relaxed text-m-muted">
            {t('admin.audit.subtitle')}
          </p>
        </div>
        <MAdminButton variant="ghost" busy={loading} onClick={() => loadFirstPage()}>
          {!loading && <RefreshCw size={12} strokeWidth={2.2} />}
          {t('admin.audit.refresh')}
        </MAdminButton>
      </div>

      <p className="font-geist text-[0.59375rem] font-bold tracking-[0.02em] text-m-faint">
        {t('admin.audit.showing', { count: entries.length, total })}
      </p>

      {loading && entries.length === 0 ? (
        <div className="py-12 text-center text-[0.8125rem] text-m-muted">{t('common.loading')}</div>
      ) : entries.length === 0 ? (
        <div className="py-12 text-center text-[0.8125rem] text-m-muted">{t('admin.audit.empty')}</div>
      ) : (
        <div className="space-y-[10px]">
          {entries.map((e) => (
            <div
              key={e.id}
              className="rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] p-[13px]"
            >
              {/* Action + time */}
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 flex-1 break-all font-mono text-[0.75rem] font-bold text-m-ink">
                  {e.action}
                </span>
                <span className="flex-none whitespace-nowrap font-mono text-[0.59375rem] text-m-faint">
                  {fmtTime(e.created_at)}
                </span>
              </div>

              {/* User */}
              <div className="mt-[6px] flex items-baseline gap-2">
                <span className="flex-none font-geist text-[0.5625rem] font-bold uppercase tracking-[0.06em] text-m-faint">
                  {t('admin.audit.col.user')}
                </span>
                <span className="min-w-0 flex-1 break-all text-[0.75rem] text-m-ink">{userLabel(e)}</span>
              </div>

              {/* Resource */}
              <div className="mt-[4px] flex items-baseline gap-2">
                <span className="flex-none font-geist text-[0.5625rem] font-bold uppercase tracking-[0.06em] text-m-faint">
                  {t('admin.audit.col.resource')}
                </span>
                <span className="min-w-0 flex-1 break-all font-mono text-[0.6875rem] text-m-muted">
                  {e.resource || '—'}
                </span>
              </div>

              {/* IP */}
              <div className="mt-[4px] flex items-baseline gap-2">
                <span className="flex-none font-geist text-[0.5625rem] font-bold uppercase tracking-[0.06em] text-m-faint">
                  {t('admin.audit.col.ip')}
                </span>
                <span className="min-w-0 flex-1 break-all font-mono text-[0.6875rem] text-m-muted">
                  {e.ip || '—'}
                </span>
              </div>

              {/* Details */}
              <div className="mt-[4px] flex items-baseline gap-2">
                <span className="flex-none font-geist text-[0.5625rem] font-bold uppercase tracking-[0.06em] text-m-faint">
                  {t('admin.audit.col.details')}
                </span>
                <span className="min-w-0 flex-1 break-all font-mono text-[0.6875rem] text-m-faint">
                  {fmtDetails(e.details)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {entries.length < total && (
        <div className="flex justify-center pt-1">
          <MAdminButton variant="ghost" busy={loading} onClick={() => loadMore()}>
            {t('admin.audit.loadMore')}
          </MAdminButton>
        </div>
      )}
    </div>
  )
}
