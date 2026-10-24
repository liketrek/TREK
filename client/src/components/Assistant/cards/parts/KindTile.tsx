import type { LucideIcon } from 'lucide-react';

import { TILE, type Tone } from './assistantTones';

/**
 * The tinted tile a change or a card wears: the icon of what it touches in
 * the tone of what happens. `xs` is the small badge on a corner (an avatar,
 * a photo), `sm` sits in front of a row, `md` heads a card. Without an icon
 * yet (the preview has not arrived) it shows as a placeholder.
 */

const BOX = {
  xs: 'h-3.5 w-3.5 rounded-full ring-2 ring-surface-card',
  sm: 'h-7 w-7 rounded-md',
  md: 'h-8 w-8 rounded-lg',
} as const;

const GLYPH = { xs: 9, sm: 14, md: 16 } as const;

export default function KindTile({
  icon: Icon,
  tone,
  size = 'md',
  dimmed = false,
}: {
  icon: LucideIcon | null;
  tone: Tone;
  size?: 'xs' | 'sm' | 'md';
  dimmed?: boolean;
}) {
  const box = BOX[size];
  if (!Icon) return <span className={`trek-skeleton flex-shrink-0 ${box}`} aria-hidden="true" />;
  return (
    <span
      aria-hidden="true"
      className={`flex flex-shrink-0 items-center justify-center ${box} ${dimmed ? 'bg-surface-secondary text-content-faint' : TILE[tone]}`}
    >
      <Icon size={GLYPH[size]} strokeWidth={2.1} />
    </span>
  );
}
