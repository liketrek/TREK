import type { ReactNode } from 'react';

/**
 * The frame every answer card sits in, the same as the change card's: a
 * rounded card on the chat. A waiting change shows its frame dashed, a
 * removed one faded, a settled one (discarded, expired, undone) fainter
 * still. The chat card (a message in the trip chat) sits on the quieter
 * secondary surface.
 */

type FrameState = 'answer' | 'pending' | 'removed' | 'settled';

const STATE: Record<FrameState, string> = {
  answer: 'border-edge-faint',
  pending: 'border-dashed border-edge',
  removed: 'border-edge-faint opacity-60',
  settled: 'border-edge-faint opacity-50',
};

export default function CardFrame({
  label,
  state = 'answer',
  surface = 'card',
  children,
}: {
  /** What the card is, for a screen reader. */
  label: string;
  state?: FrameState;
  surface?: 'card' | 'secondary';
  children: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className={`trek-assistant-enter rounded-xl border px-3 pb-2 pt-2.5 shadow-card ${STATE[state]} ${
        surface === 'secondary' ? 'bg-surface-secondary' : 'bg-surface-card'
      }`}
    >
      {children}
    </section>
  );
}
