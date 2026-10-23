import type { ReactNode } from 'react';

import ErrorBoundary from '../../../shared/ErrorBoundary';

/**
 * Around every card and every slot of a kind's view the chat draws: one that
 * throws while it renders is logged and drawn as its `fallback` (nothing,
 * unless the caller hands what the row shows without a card), and the answer
 * around it stays. A change in `resetKeys` draws it once more.
 */
export default function CardBoundary({
  children,
  fallback = null,
  resetKeys,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  /** What the card is drawn for, e.g. the state of its change: when it moves on, the card is tried again. */
  resetKeys?: readonly unknown[];
}) {
  return (
    <ErrorBoundary boundaryId="assistant-card" fallback={fallback} resetKeys={resetKeys}>
      {children}
    </ErrorBoundary>
  );
}
