import { MCP_TOOL_USAGE_DEFAULT_DAYS, type AdminMcpToolUsageRow } from '@trek/shared';
import { useEffect, useEffectEvent, useState } from 'react';

import { useFormatDate } from '../../hooks/useDateFormat';
import { useTranslation } from '../../i18n';
import { mcpToolUsageRepo } from '../../repo/mcpToolUsageRepo';
import { useToast } from '../shared/Toast';

/** The spans the admin can count over, in days. */
export const MCP_TOOL_USAGE_SPANS = [7, MCP_TOOL_USAGE_DEFAULT_DAYS, 90] as const;

/** A tool's calls as a share of the most called tool's, 0 to 1. */
export function usageShare(calls: number, maxCalls: number): number {
  return maxCalls > 0 ? Math.min(1, calls / maxCalls) : 0;
}

/** The CSS width of the bar behind a tool's row, both shells draw it from here. */
export function usageBarWidth(calls: number, maxCalls: number): string {
  return `${Math.round(usageShare(calls, maxCalls) * 100)}%`;
}

/**
 * When a tool was last called: the audit log's UTC `YYYY-MM-DD HH:MM:SS` (or an
 * ISO instant), read as the instant it names; null when it names none, so a
 * shell shows a dash rather than "Invalid Date".
 */
export function lastCallAt(row: AdminMcpToolUsageRow): Date | null {
  const iso = row.last_called_at.replace(' ', 'T');
  const at = new Date(/(Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso}Z`);
  return Number.isNaN(at.getTime()) ? null : at;
}

/** A tool's row as both shells draw it: the counts, the bar's width, and the last call written out. */
export interface McpToolUsageView extends AdminMcpToolUsageRow {
  barWidth: string;
  lastCall: string;
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
  const { formatDate } = useFormatDate();

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
        if (cancelled) return;
        // The last span's rows would read as this span's; an empty table and the toast say it instead.
        setTools([]);
        setTotalCalls(0);
        loadError();
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

  const maxCalls = tools[0]?.calls ?? 0;
  const rows: McpToolUsageView[] = tools.map((row) => {
    const at = lastCallAt(row);
    return { ...row, barWidth: usageBarWidth(row.calls, maxCalls), lastCall: at ? formatDate(at) : '—' };
  });
  return { days, setDays, tools: rows, totalCalls, loading, maxCalls };
}
