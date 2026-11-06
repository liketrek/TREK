import { useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { Location, NavigationType } from 'react-router';

/**
 * Page transitions on the phone, the way a native navigation stack moves: a
 * page opened from another slides in from the trailing edge over the one it
 * leaves, going back slides it away again, and switching between the main
 * sections (the dock's destinations) only cross-fades. Built on the View
 * Transitions API, so the browser animates snapshots and the pages themselves
 * render as before; mobile.css holds the motion.
 *
 * The router is a declarative BrowserRouter, whose `viewTransition` option does
 * nothing, so App renders <Routes> with the location this hook hands out and
 * the hook swaps it inside the transition. Routes load lazily: the swap waits
 * (at most SETTLE_MS) until the new page replaced the route fallback, while the
 * browser keeps showing the old snapshot, so the skeleton never flashes.
 */
export type RouteTransitionKind = 'forward' | 'back' | 'tab';

const SETTLE_MS = 800;
let skipNext = false;
let current: ViewTransition | null = null;

/** The edge-swipe back gesture already slid the page away: the next change goes without a transition. */
export function skipNextRouteTransition(): void {
  skipNext = true;
}

function depth(pathname: string): number {
  return pathname.split('/').filter(Boolean).length;
}

export function transitionKind(from: Location, to: Location, navigationType: NavigationType): RouteTransitionKind {
  if (depth(from.pathname) <= 1 && depth(to.pathname) <= 1) return 'tab';
  return navigationType === 'POP' ? 'back' : 'forward';
}

function canAnimate(): boolean {
  return (
    typeof document !== 'undefined' &&
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

/** Resolves once no route fallback is on screen, or after SETTLE_MS. */
function settled(): Promise<void> {
  const began = performance.now();
  return new Promise((resolve) => {
    const check = () => {
      if (!document.querySelector('[data-route-fallback]') || performance.now() - began > SETTLE_MS) resolve();
      else requestAnimationFrame(check);
    };
    check();
  });
}

export function useRouteTransition(location: Location, navigationType: NavigationType, enabled: boolean): Location {
  const [shown, setShown] = useState(location);
  const shownRef = useRef(location);

  useLayoutEffect(() => {
    const from = shownRef.current;
    if (from.key === location.key) return;
    shownRef.current = location;
    const skip = skipNext;
    skipNext = false;
    // A changed query or hash on the same page (a tab inside the trip, a filter) is not a navigation.
    if (!enabled || skip || from.pathname === location.pathname || !canAnimate()) {
      setShown(location);
      return;
    }
    const root = document.documentElement;
    root.dataset.routeTransition = transitionKind(from, location, navigationType);
    const transition = document.startViewTransition(async () => {
      flushSync(() => setShown(location));
      await settled();
    });
    current = transition;
    // A newer navigation skips this one: both promises then reject, which is no error.
    transition.ready.catch(() => {});
    void transition.finished
      .catch(() => {})
      .finally(() => {
        // Only the newest transition clears the direction, or a skipped one would
        // take it away from the one that replaced it.
        if (current === transition) delete root.dataset.routeTransition;
      });
  }, [location, navigationType, enabled]);

  return enabled ? shown : location;
}
