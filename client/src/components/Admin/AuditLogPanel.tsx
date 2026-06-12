import React, { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../../api/client'
import { useTranslation } from '../../i18n'
import { RefreshCw, ClipboardList } from 'lucide-react'

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

export default function AuditLogPanel({ serverTimezone }: AuditLogPanelProps): React.ReactElement {
  const { t, locale } = useTranslation()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const limit = 100

  const loadFirstPage = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminApi.auditLog({ limit, offset: 0 }) as {
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
      const data = await adminApi.auditLog({ limit, offset: nextOffset }) as {
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-lg m-0 flex items-center gap-2 text-content">
            <ClipboardList size={20} />
            {t('admin.tabs.audit')}
          </h2>
          <p className="text-sm m-0 mt-1 text-content-muted">{t('admin.audit.subtitle')}</p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => loadFirstPage()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-opacity disabled:opacity-50 border-edge text-content bg-surface-card"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {t('admin.audit.refresh')}
        </button>
      </div>

      <p className="text-xs m-0 text-content-faint">
        {t('admin.audit.showing', { count: entries.length, total })}
      </p>

      {loading && entries.length === 0 ? (
        <div className="py-12 text-center text-sm text-content-muted">{t('common.loading')}</div>
      ) : entries.length === 0 ? (
        <div className="py-12 text-center text-sm text-content-muted">{t('admin.audit.empty')}</div>
      ) : (
        <div className="rounded-xl border overflow-x-auto border-edge bg-surface-card">
          <table className="w-full text-sm border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b text-left border-edge-secondary">
                <th className="p-3 font-semibold whitespace-nowrap text-content-secondary">{t('admin.audit.col.time')}</th>
                <th className="p-3 font-semibold whitespace-nowrap text-content-secondary">{t('admin.audit.col.user')}</th>
                <th className="p-3 font-semibold whitespace-nowrap text-content-secondary">{t('admin.audit.col.action')}</th>
                <th className="p-3 font-semibold whitespace-nowrap text-content-secondary">{t('admin.audit.col.resource')}</th>
                <th className="p-3 font-semibold whitespace-nowrap text-content-secondary">{t('admin.audit.col.ip')}</th>
                <th className="p-3 font-semibold text-content-secondary">{t('admin.audit.col.details')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b align-top border-edge-secondary">
                  <td className="p-3 whitespace-nowrap font-mono text-xs text-content">{fmtTime(e.created_at)}</td>
                  <td className="p-3 text-content">{userLabel(e)}</td>
                  <td className="p-3 font-mono text-xs text-content">{e.action}</td>
                  <td className="p-3 font-mono text-xs break-all max-w-[140px] text-content-muted">{e.resource || '—'}</td>
                  <td className="p-3 font-mono text-xs whitespace-nowrap text-content-muted">{e.ip || '—'}</td>
                  <td className="p-3 font-mono text-xs break-all max-w-[280px] text-content-faint">{fmtDetails(e.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {entries.length < total && (
        <button
          type="button"
          disabled={loading}
          onClick={() => loadMore()}
          className="text-sm font-medium underline-offset-2 hover:underline disabled:opacity-50 text-content-secondary"
        >
          {t('admin.audit.loadMore')}
        </button>
      )}
    </div>
  )
}
