import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { WhiteBadge } from '../../../Planner/planParts';
import type { Tone } from './assistantTones';
import KindTile from './KindTile';

/**
 * The head of an answer card: its tile, what it is about (wrapping to two
 * lines at most, the whole title in its tooltip), how many it holds, one
 * quiet line of context under it, and its actions at the end.
 */
export default function CardHeader({
  icon,
  tone,
  title,
  count,
  meta,
  actions,
}: {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  count?: number;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <KindTile icon={icon} tone={tone} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <bdi title={title} className="line-clamp-2 text-body font-semibold leading-tight text-content">
            {title}
          </bdi>
          {count !== undefined && <WhiteBadge>{count}</WhiteBadge>}
        </div>
        {meta && <div className="mt-0.5 text-caption text-content-muted">{meta}</div>}
      </div>
      {actions && <div className="flex flex-none items-center gap-1">{actions}</div>}
    </div>
  );
}
