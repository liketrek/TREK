import { Activity, Loader2 } from 'lucide-react';
import { useFormatDate } from '../../hooks/useDateFormat';
import { useTranslation } from '../../i18n';
import { ChoiceChips, SettingsCard, SettingsHint, StatusPill } from '../Settings/settingsKit';
import { fs } from '../shared/DialogShell';
import { MCP_TOOL_USAGE_SPANS, lastCallAt, usageShare, useMcpToolUsage } from './useMcpToolUsage';

const SPAN_OPTIONS = MCP_TOOL_USAGE_SPANS.map((d) => ({ value: String(d), label: String(d) }));
const CELL = 'px-3.5 py-2.5 text-end font-geist tabular-nums text-content-muted';

/** The admin's MCP tool-usage card: which tools the connected clients called, over a span. */
export default function AdminMcpToolUsagePanel() {
  const { days, setDays, tools, totalCalls, loading, maxCalls } = useMcpToolUsage();
  const { t } = useTranslation();
  const { formatDate } = useFormatDate();

  return (
    <SettingsCard
      icon={Activity}
      title={t('admin.mcpToolUsage.title')}
      hint={t('admin.mcpToolUsage.subtitle')}
      badge={!loading && totalCalls > 0 ? <StatusPill>{totalCalls}</StatusPill> : undefined}
      action={
        <ChoiceChips
          label={t('admin.mcpToolUsage.period')}
          value={String(days)}
          options={SPAN_OPTIONS}
          onChange={(v) => setDays(Number(v))}
        />
      }
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={18} className="animate-spin text-content-faint" />
        </div>
      ) : tools.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-content-faint">
          <Activity size={22} />
          <SettingsHint>{t('admin.mcpToolUsage.empty')}</SettingsHint>
        </div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(9.5)}>
              <th scope="col" className="px-3.5 py-2 text-start">
                {t('admin.mcpToolUsage.tool')}
              </th>
              <th scope="col" className="px-3.5 py-2 text-end">
                {t('admin.mcpToolUsage.calls')}
              </th>
              <th scope="col" className="px-3.5 py-2 text-end">
                {t('admin.mcpToolUsage.users')}
              </th>
              <th scope="col" className="px-3.5 py-2 text-end">
                {t('admin.mcpToolUsage.lastCall')}
              </th>
            </tr>
          </thead>
          <tbody>
            {tools.map((row) => (
              <tr key={row.tool} className="border-t border-edge-faint">
                <td className="px-3.5 py-2.5">
                  <div className="truncate font-geist text-content" style={fs(12.5, 'body')}>
                    {row.tool}
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-surface-tertiary" aria-hidden="true">
                    <div
                      className="h-1 rounded-full bg-accent"
                      style={{ width: `${Math.round(usageShare(row.calls, maxCalls) * 100)}%` }}
                    />
                  </div>
                </td>
                <td className={CELL} style={fs(12.5, 'body')}>
                  {row.calls}
                </td>
                <td className={CELL} style={fs(12.5, 'body')}>
                  {row.users}
                </td>
                <td className={`whitespace-nowrap ${CELL}`} style={fs(12, 'body')}>
                  {formatDate(lastCallAt(row))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </SettingsCard>
  );
}
