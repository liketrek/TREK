import { useEffect, useState } from 'react'
import { History, RefreshCw } from 'lucide-react'
import { pluginsApi } from '../../api/client'
import { useTranslation } from '../../i18n'

interface ActivityRow {
  ts: string
  plugin_id: string
  plugin_name: string | null
  method: string
  resource: string | null
  code: string
}

/**
 * Tailwind classes for a result-code pill. "ok" stays neutral; an access denial
 * reads as danger, anything else non-ok as a softer warning. Kept subtle — this
 * is meant to be a quiet log, not an alert wall.
 */
function codeTone(code: string): string {
  if (code === 'ok') return 'bg-surface-hover text-content-secondary'
  if (/FORBIDDEN|DENIED|UNAUTHORIZED/i.test(code)) return 'bg-danger-soft text-danger'
  return 'bg-warning-soft text-warning'
}

/**
 * The signed-in user's own plugin activity log — every host-mediated action a
 * plugin took while bound to them, newest first. The user-facing half of the
 * capability audit; it's what keeps the deliberately broad read grants
 * accountable to the person whose data was read. Fail-safe: a failed load just
 * shows the empty state, never a crash.
 */
export default function PluginActivityPanel() {
  const { t, locale } = useTranslation()
  const [rows, setRows] = useState<ActivityRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    pluginsApi.myActivity()
      .then(r => setRows(r.activity))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const fmtWhen = (ts: string): string => {
    const d = new Date(ts)
    return Number.isNaN(d.getTime()) ? ts : d.toLocaleString(locale)
  }

  return (
    <div className="rounded-xl border border-edge bg-surface-card overflow-hidden">
      <div className="px-5 py-4 border-b border-edge-secondary flex items-center gap-3">
        <History className="w-4 h-4 flex-shrink-0 text-content-secondary" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-content">{t('settings.pluginActivity.title')}</h3>
          <p className="text-xs text-content-muted mt-0.5">{t('settings.pluginActivity.description')}</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-edge px-2.5 py-1.5 text-xs font-medium text-content-secondary hover:text-content disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('settings.pluginActivity.refresh')}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-content-muted">
          {loading ? t('common.loading') : t('settings.pluginActivity.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-content-faint border-b border-edge-secondary">
                <th className="font-medium px-5 py-2">{t('settings.pluginActivity.columns.plugin')}</th>
                <th className="font-medium px-3 py-2">{t('settings.pluginActivity.columns.action')}</th>
                <th className="font-medium px-3 py-2">{t('settings.pluginActivity.columns.resource')}</th>
                <th className="font-medium px-3 py-2 whitespace-nowrap">{t('settings.pluginActivity.columns.when')}</th>
                <th className="font-medium px-5 py-2 text-right">{t('settings.pluginActivity.columns.status')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-edge-secondary last:border-b-0">
                  <td className="px-5 py-2.5 text-content align-top">{r.plugin_name || r.plugin_id}</td>
                  <td className="px-3 py-2.5 align-top">
                    <span className="font-mono text-xs text-content-secondary">{r.method}</span>
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <span className="font-mono text-xs text-content-muted">{r.resource || '—'}</span>
                  </td>
                  <td className="px-3 py-2.5 align-top whitespace-nowrap text-content-muted">{fmtWhen(r.ts)}</td>
                  <td className="px-5 py-2.5 align-top text-right">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${codeTone(r.code)}`}>
                      {r.code}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
