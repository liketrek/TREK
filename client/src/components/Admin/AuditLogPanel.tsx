import React, { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../../api/client'
import { useTranslation } from '../../i18n'
import { RefreshCw, ClipboardList, Loader2 } from 'lucide-react'
import { fs } from '../shared/DialogShell'
import { SETTINGS_BUTTON, SettingsCard, SettingsHint, StatusPill } from '../Settings/settingsKit'

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

const TH = 'whitespace-nowrap px-3.5 py-2.5 text-left font-geist font-bold uppercase tracking-[.08em] text-content-faint'
const TD = 'px-3.5 py-2.5 align-top'
const CODE = 'font-geist tabular-nums'

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

  let body: React.ReactNode
  if (loading && entries.length === 0) {
    body = (
      <div className="flex items-center justify-center gap-2 py-10 text-content-faint" style={fs(12.5, 'body')}>
        <Loader2 size={15} className="animate-spin" />
        <span>{t('common.loading')}</span>
      </div>
    )
  } else if (entries.length === 0) {
    body = <SettingsHint className="py-6 text-center">{t('admin.audit.empty')}</SettingsHint>
  } else {
    body = (
      <div className={`overflow-x-auto rounded-[12px] border border-edge-faint bg-surface-card transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-edge-faint bg-surface-secondary" style={fs(9.5)}>
              <th className={TH}>{t('admin.audit.col.time')}</th>
              <th className={TH}>{t('admin.audit.col.user')}</th>
              <th className={TH}>{t('admin.audit.col.action')}</th>
              <th className={TH}>{t('admin.audit.col.resource')}</th>
              <th className={TH}>{t('admin.audit.col.ip')}</th>
              <th className={TH}>{t('admin.audit.col.details')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge-faint" style={fs(12, 'body')}>
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-surface-secondary">
                <td className={`${TD} ${CODE} whitespace-nowrap text-content-muted`}>{fmtTime(e.created_at)}</td>
                <td className={`${TD} font-medium text-content`}>
                  {/* A table cell ignores max-width under auto layout, so the box inside truncates. */}
                  <span className="block max-w-[180px] truncate" title={userLabel(e)}>{userLabel(e)}</span>
                </td>
                <td className={`${TD} whitespace-nowrap`}>
                  <span className={`${CODE} inline-block rounded-[6px] bg-surface-tertiary px-1.5 py-[1px] text-content`}>{e.action}</span>
                </td>
                <td className={`${TD} ${CODE} max-w-[160px] break-all text-content-muted`}>{e.resource || '—'}</td>
                <td className={`${TD} ${CODE} whitespace-nowrap text-content-muted`}>{e.ip || '—'}</td>
                <td className={`${TD} ${CODE} max-w-[300px] break-all text-content-faint`}>{fmtDetails(e.details)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <SettingsCard
      icon={ClipboardList}
      title={t('admin.tabs.audit')}
      hint={t('admin.audit.subtitle')}
      badge={<StatusPill>{t('admin.audit.showing', { count: entries.length, total })}</StatusPill>}
      action={
        <button
          type="button"
          disabled={loading}
          onClick={() => loadFirstPage()}
          className={SETTINGS_BUTTON}
          style={fs(12.5, 'body')}
        >
          <RefreshCw size={14} strokeWidth={2.2} className={loading ? 'animate-spin' : ''} />
          {t('admin.audit.refresh')}
        </button>
      }
    >
      {body}

      {entries.length < total && (
        <div className="flex justify-center">
          <button
            type="button"
            disabled={loading}
            onClick={() => loadMore()}
            className={SETTINGS_BUTTON}
            style={fs(12.5, 'body')}
          >
            {t('admin.audit.loadMore')}
          </button>
        </div>
      )}
    </SettingsCard>
  )
}
