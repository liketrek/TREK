import { MCP_TOOL_USAGE_DEFAULT_DAYS, type AdminMcpToolUsageRow } from '@trek/shared';
import { useEffect, useEffectEvent, useState } from 'react';

import { useTranslation } from '../../i18n';
import { mcpToolUsageRepo } from '../../repo/mcpToolUsageRepo';
import { useToast } from '../shared/Toast';

/** The spans the admin can count over, in days. */
export const MCP_TOOL_USAGE_SPANS = [7, MCP_TOOL_USAGE_DEFAULT_DAYS, 90] as const;

/** A tool's calls as a share of the most called tool's, 0 to 1, for the bar behind its row. */
export function usageShare(calls: number, maxCalls: number): number {
  return maxCalls > 0 ? Math.min(1, calls / maxCalls) : 0;
}

/** When a tool was last called: the audit log's UTC `YYYY-MM-DD HH:MM:SS`, read as the instant it names. */
export function lastCallAt(row: AdminMcpToolUsageRow): Date {
  return new Date(`${row.last_called_at.replace(' ', 'T')}Z`);
}

/**
 * The MCP tool-usage table behind both admin shells: the tools called over the
 * chosen span, the most called first, loaded again whenever the span changes.
 * The desktop card and the phone card render their own markup over it.
 */
export function useMcpToolUsage() {
  const [days, setDaysState] = useState<number>(MCP_TOOL_USAGE_DEFAULT_DAYS);
  const [tools, setTools] = useState<AdminMcpToolUsageRow[]>([]);
  const [totalCalls, setTotalCalls] = useState(0);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { t } = useTranslation();

  const loadError = useEffectEvent(() => toast.error(t('admin.mcpToolUsage.loadError')));

  useEffect(() => {
    let cancelled = false;
    mcpToolUsageRepo
      .list(days)
      .then((usage) => {
        if (cancelled) return;
        setTools(usage.tools);
        setTotalCalls(usage.total_calls);
      })
      .catch(() => {
        if (!cancelled) loadError();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const setDays = (next: number) => {
    if (next === days) return;
    setLoading(true);
    setDaysState(next);
  };

  return { days, setDays, tools, totalCalls, loading, maxCalls: tools[0]?.calls ?? 0 };
}
