import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { fs, NEUTRAL_TINT } from '../../../shared/DialogShell';
import type { Tone } from './assistantTones';

/**
 * The head band of an answer card, as the trip's dialogs and booking cards
 * wear it: a tinted band across the card's top, a raised white tile with the
 * icon of what the card is about in its tone, an eyebrow naming the kind,
 * the title, one quiet line under it, a count, and the card's actions at the
 * end. It reaches the card's edges, so a card that opens with it needs no
 * other head.
 */

/** The icon's colour on the white tile, per tone. */
const GLYPH: Record<Tone, string> = {
  success: 'text-success',
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger',
};

export default function CardHeader({
  icon: Icon,
  tone,
  title,
  eyebrow,
  count,
  meta,
  actions,
  tile,
  tint = NEUTRAL_TINT,
  children,
}: {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  /** The kind above the title ("PACKING LIST"); none when the title says it. */
  eyebrow?: string;
  count?: number;
  meta?: ReactNode;
  actions?: ReactNode;
  /** In place of the icon tile: a drawing of what the card shows (a route's sketch). */
  tile?: ReactNode;
  tint?: string;
  /** Under the title row, on the band: a progress bar, a row of pills. */
  children?: ReactNode;
}) {
  return (
    <div className="-mx-3.5 -mt-3 mb-3 px-3.5 pb-3 pt-3" style={{ background: tint }}>
      <div className={`flex gap-3 ${meta ? 'items-start' : 'items-center'}`}>
        {tile ?? (
          <span
            aria-hidden="true"
            className={`grid h-10 w-10 flex-none place-items-center rounded-[12px] bg-surface-card shadow-sm ${GLYPH[tone]}`}
          >
            <Icon size={18} strokeWidth={2} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <div
              className="truncate font-geist font-bold uppercase tracking-[.08em] text-content-muted"
              style={fs(9.5)}
            >
              {eyebrow}
            </div>
          )}
          <div className="flex min-w-0 items-center gap-2">
            <bdi
              title={title}
              className="line-clamp-2 min-w-0 font-bold leading-tight tracking-[-0.01em] text-content"
              style={fs(15, 'body')}
            >
              {title}
            </bdi>
            {count !== undefined && (
              <span
                className="inline-flex h-5 flex-none items-center rounded-full bg-surface-card px-2 font-semibold tabular-nums text-content-secondary shadow-sm"
                style={fs(11)}
              >
                {count}
              </span>
            )}
          </div>
          {meta && <div className="mt-0.5 font-geist text-caption text-content-muted">{meta}</div>}
        </div>
        {actions && <div className="flex flex-none items-center gap-1">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
