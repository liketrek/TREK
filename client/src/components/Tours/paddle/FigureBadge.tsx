import type { ReactNode } from 'react';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';

/**
 * A figure as a badge holding its value as a white badge, the planner's
 * badge-in-badge look: the wind of the day, a weir's height, an access rule.
 * What it means exactly can sit in its tooltip.
 */
export function FigureBadge({
  label,
  value,
  icon,
  info,
  tone = 'neutral',
  testId,
}: {
  label?: string;
  value: string;
  icon?: ReactNode;
  info?: string;
  /** `warning` colours the value: a rule that forbids, a way recorded as private. */
  tone?: 'neutral' | 'warning';
  testId?: string;
}) {
  const badge = (
    <span
      data-testid={testId}
      className="inline-flex h-[24px] min-w-0 flex-none items-center gap-1 whitespace-nowrap rounded-full bg-surface-secondary pe-[3px] ps-[3px] text-content-muted"
      style={fs(10.5, 'body')}
    >
      {label && <span className="ps-1">{label}</span>}
      <span
        className={`inline-flex h-[18px] min-w-0 flex-none items-center gap-1 rounded-full bg-surface-card px-1.5 font-geist font-semibold tabular-nums shadow-sm ${tone === 'warning' ? 'text-warning' : 'text-content'}`}
        style={fs(11)}
      >
        {icon}
        <span className="truncate">{value}</span>
      </span>
    </span>
  );
  return info ? <Tooltip label={info}>{badge}</Tooltip> : badge;
}
