import { useEffect, useState } from 'react'
import { History, RefreshCw } from 'lucide-react'
import { pluginsApi } from '../../api/client'
import { useTranslation } from '../../i18n'
import { Tooltip } from '../shared/Tooltip'
import { fs } from '../shared/DialogShell'
import { SettingsCard, SettingsHint, SETTINGS_ICON_BUTTON } from './settingsKit'

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

const TH = 'whitespace-nowrap px-3 py-2.5 text-left font-geist font-bold uppercase tracking-[.08em] text-content-faint'
const TD = 'px-3 py-3 align-middle'

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

  const refreshLabel = t('settings.pluginActivity.refresh')

  return (
    <SettingsCard
      icon={History}
      title={t('settings.pluginActivity.title')}
      hint={t('settings.pluginActivity.description')}
      action={
        <Tooltip label={refreshLabel}>
          <button type="button" onClick={load} disabled={loading} aria-label={refreshLabel} className={SETTINGS_ICON_BUTTON}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : undefined} />
          </button>
        </Tooltip>
      }
    >
      {rows.length === 0 ? (
        <SettingsHint>
          {loading ? t('common.loading') : t('settings.pluginActivity.empty')}
        </SettingsHint>
      ) : (
        <div className={`overflow-x-auto rounded-[12px] border border-edge-faint bg-surface-card ${loading ? 'opacity-60' : ''}`}>
          <table className="w-full border-collapse" style={fs(12.5, 'body')}>
            <thead>
              <tr className="border-b border-edge-faint bg-surface-secondary" style={fs(10)}>
                <th className={`${TH} pl-3.5`}>{t('settings.pluginActivity.columns.plugin')}</th>
                <th className={TH}>{t('settings.pluginActivity.columns.action')}</th>
                <th className={TH}>{t('settings.pluginActivity.columns.resource')}</th>
                <th className={TH}>{t('settings.pluginActivity.columns.when')}</th>
                <th className={`${TH} pr-3.5 text-right`}>{t('settings.pluginActivity.columns.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge-faint">
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className={`${TD} max-w-[200px] pl-3.5`}>
                    <span className="block truncate font-medium text-content">{r.plugin_name || r.plugin_id}</span>
                  </td>
                  <td className={TD}>
                    <span className="font-mono text-content-secondary" style={fs(11.5)}>{r.method}</span>
                  </td>
                  <td className={`${TD} max-w-[220px]`}>
                    <span className="block truncate font-mono text-content-muted" style={fs(11.5)} title={r.resource || undefined}>{r.resource || '—'}</span>
                  </td>
                  <td className={`${TD} whitespace-nowrap font-geist tabular-nums text-content-muted`}>{fmtWhen(r.ts)}</td>
                  <td className={`${TD} pr-3.5 text-right`}>
                    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-[2px] font-geist font-semibold ${codeTone(r.code)}`} style={fs(11)}>
                      {r.code}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SettingsCard>
  )
}
