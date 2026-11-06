import { RefreshCw } from 'lucide-react';
import { PULL_THRESHOLD, type PullState } from '../usePullToRefresh';

/**
 * The round glass badge under the top bar that a pull-to-refresh reveals: it
 * fades in and turns with the pull, and spins while the page reloads.
 */
export default function MPullIndicator({ state, label }: { state: PullState; label: string }) {
  const progress = Math.min(1, state.distance / PULL_THRESHOLD);
  const visible = state.refreshing || state.distance > 4;
  return (
    <div
      aria-hidden={!state.refreshing}
      role={state.refreshing ? 'status' : undefined}
      aria-label={state.refreshing ? label : undefined}
      className="pointer-events-none fixed inset-x-0 z-30 flex justify-center transition-opacity duration-200"
      style={{ top: 'calc(var(--m-safe-top, 12px) + 70px)', opacity: visible ? Math.max(0.35, progress) : 0 }}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] text-m-ink shadow-sm backdrop-blur-xl">
        <RefreshCw
          size={16}
          strokeWidth={2.2}
          className={state.refreshing ? 'animate-spin' : undefined}
          style={state.refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }}
        />
      </span>
    </div>
  );
}
