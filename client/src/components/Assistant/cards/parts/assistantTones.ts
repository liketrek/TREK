import { Check, CircleSlash, LoaderCircle, type LucideIcon, TriangleAlert } from 'lucide-react';

import type { ChangeState } from '../../assistantParts';

/**
 * The tones a card speaks in, soft ones only: green adds, blue changes, amber
 * moves or warns, red takes away. Every tile, badge and mark of the cards
 * takes its colour from here, so a kind never invents its own.
 */
export type Tone = 'success' | 'info' | 'warning' | 'danger';

/** A tinted tile in a tone: the soft background with the strong colour on top. */
export const TILE: Record<Tone, string> = {
  success: 'bg-success-soft text-success',
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

/** How a decided change reads: one quiet mark, its words in the tooltip. */
export const RECEIPT: Record<Exclude<ChangeState, 'pending'>, { labelKey: string; Icon: LucideIcon; tone: string }> = {
  applying: { labelKey: 'assistant.change.applying', Icon: LoaderCircle, tone: 'text-content-muted' },
  applied: { labelKey: 'assistant.change.applied', Icon: Check, tone: 'text-success' },
  failed: { labelKey: 'assistant.change.failed', Icon: TriangleAlert, tone: 'text-danger' },
  discarded: { labelKey: 'assistant.change.discarded', Icon: CircleSlash, tone: 'text-content-faint' },
  expired: { labelKey: 'assistant.change.expired', Icon: CircleSlash, tone: 'text-content-faint' },
};

/** A quiet square icon button on a card row or head. */
export const ICON_BUTTON =
  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-content-muted transition-colors hover:bg-surface-hover hover:text-content disabled:opacity-50';
