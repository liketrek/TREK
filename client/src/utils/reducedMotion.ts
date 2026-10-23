const REDUCE_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * Whether motion should be kept to a minimum: the app's own switch (the
 * `data-reduce-motion` attribute the appearance settings put on <html>) or the
 * system's. Read at the moment of asking, so a change takes effect on the next
 * animation without a subscription. Without a window (tests, SSR) there is
 * nothing to animate, so it answers true.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return (
    document.documentElement.hasAttribute('data-reduce-motion') || (window.matchMedia?.(REDUCE_MOTION).matches ?? false)
  );
}
