import { Activity, Loader2 } from 'lucide-react';
import { MCP_TOOL_USAGE_SPANS, useMcpToolUsage } from '../../../components/Admin/useMcpToolUsage';
import { fs } from '../../../components/shared/DialogShell';
import { useTranslation } from '../../../i18n';
import { MAdminCard, MAdminCardHead } from './MAdminUi';

// Phone twin of AdminMcpToolUsagePanel: the same counts from useMcpToolUsage,
// as one card with the span picker under its head and a row per tool.
export default function MAdminMcpToolUsagePanel() {
  const { days, setDays, tools, loading } = useMcpToolUsage();
  const { t } = useTranslation();

  return (
    <MAdminCard>
      <MAdminCardHead title={t('admin.mcpToolUsage.title')} hint={t('admin.mcpToolUsage.subtitle')} />
      <div role="group" aria-label={t('admin.mcpToolUsage.period')} className="my-2 flex gap-1.5">
        {MCP_TOOL_USAGE_SPANS.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={d === days}
            onClick={() => setDays(d)}
            className={`min-h-[44px] min-w-[44px] rounded-full border px-3 font-geist font-bold ${d === days ? 'border-edge bg-surface-card text-m-ink' : 'border-edge-faint text-m-muted'}`}
            style={fs(12)}
          >
            {d}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-m-faint" />
        </div>
      ) : tools.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10">
          <Activity className="h-8 w-8 text-m-faint" />
          <p className="font-geist text-m-muted" style={fs(11)}>
            {t('admin.mcpToolUsage.empty')}
          </p>
        </div>
      ) : (
        <ul>
          {tools.map((row) => (
            <li key={row.tool} className="border-t border-edge-faint py-[10px] first:border-t-0">
              <div className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate font-geist font-bold text-m-ink" style={fs(13)}>
                  {row.tool}
                </span>
                <span className="font-geist tabular-nums text-m-ink" style={fs(12)}>
                  {row.calls}
                </span>
              </div>
              <div className="mt-1 h-1 rounded-full bg-surface-tertiary" aria-hidden="true">
                <div className="h-1 rounded-full bg-accent" style={{ width: row.barWidth }} />
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 font-geist text-m-muted" style={fs(10)}>
                <span>
                  {t('admin.mcpToolUsage.users')}: {row.users}
                </span>
                <span>
                  {t('admin.mcpToolUsage.lastCall')}: {row.lastCall}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </MAdminCard>
  );
}
