import { useEffect, useSyncExternalStore } from 'react';

import { hasNativeFeature, useNativeCapabilities } from './capabilities';
import { reportNativeFailure } from './reportFailure';
import { TrekShell, type NativeWindowLayout } from './trekShell';

/** A fold down the window, in CSS pixels from its left edge: where it begins and ends. */
export interface WindowFold {
  start: number;
  end: number;
}

/**
 * The fold a two-pane screen should respect: a vertical one that separates the
 * window into two sides, as a foldable half open like a book has, or a device
 * whose two screens meet there. A flat fold that does not separate (a Galaxy
 * Fold opened all the way) is one seamless screen, and a horizontal one runs
 * across both panes rather than between them.
 */
export function foldOf(layout: NativeWindowLayout | null): WindowFold | null {
  if (!layout?.hinge || layout.posture === 'none') return null;
  if (layout.orientation !== 'vertical' || !layout.separating) return null;
  const { left, right } = layout.hinge;
  if (!(left > 0 && right >= left && right < layout.width)) return null;
  return { start: left, end: right };
}

let layout: NativeWindowLayout | null = null;
let listening = false;
const listeners = new Set<() => void>();

function publish(next: NativeWindowLayout): void {
  layout = next;
  for (const listener of listeners) listener();
}

/** Starts following the window layout the Android shell reports (feature windowLayout), once. */
function follow(): void {
  if (listening || !hasNativeFeature('windowLayout')) return;
  listening = true;
  TrekShell.getWindowLayout().then(publish, reportNativeFailure);
  TrekShell.addListener('windowLayout', publish).catch(reportNativeFailure);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const current = () => layout;

/**
 * The fold of the window, while the app's shell reports one (Android, feature
 * windowLayout); null in a browser, on iOS and on a device without one. Two-pane
 * screens end their leading pane at it, so no row runs across the hinge.
 */
export function useWindowFold(): WindowFold | null {
  const { caps } = useNativeCapabilities();
  const supported = caps.features.includes('windowLayout');
  useEffect(() => {
    if (supported) follow();
  }, [supported]);
  const reported = useSyncExternalStore(subscribe, current, current);
  return supported ? foldOf(reported) : null;
}

/** Test helper: forget the layout and the subscription. */
export function _resetWindowFold(): void {
  layout = null;
  listening = false;
  listeners.clear();
}
