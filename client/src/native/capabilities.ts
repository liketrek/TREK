import { useSyncExternalStore } from 'react';
import { isNativeApp } from './platform';
import { reportNativeFailure } from './reportFailure';
import { TrekShell, isUnimplemented } from './trekShell';

/**
 * What the installed app binary offers the UI this server delivers.
 *
 * The two update on their own clocks: the UI ships with the server, the binary
 * through the stores. So the UI asks before it calls into anything native the
 * binary may predate, and turns each feature on by name (hasNativeFeature). A
 * binary from before this handshake answers UNIMPLEMENTED and counts as shell
 * API 1 with no named features, which is exactly what it can do.
 *
 * The other direction runs through the server's features: minNativeShellApi
 * names the oldest binary its UI works with, and an app below it is asked to
 * update (appUpdateRequired) rather than left calling methods it lacks.
 */
export interface NativeCapabilities {
  shellApi: number;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  build: string;
  features: string[];
}

const WEB: NativeCapabilities = { shellApi: 0, platform: 'web', appVersion: '', build: '', features: [] };
const LEGACY_APP: NativeCapabilities = { shellApi: 1, platform: 'web', appVersion: '', build: '', features: [] };

let current: NativeCapabilities = WEB;
let updateRequired = false;
let loading: Promise<NativeCapabilities> | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/** Asks the binary once and keeps the answer for the session. */
export function loadNativeCapabilities(): Promise<NativeCapabilities> {
  if (!isNativeApp()) return Promise.resolve(WEB);
  loading ??= TrekShell.getCapabilities()
    .then(
      (caps) => caps,
      (err: unknown) => {
        if (!isUnimplemented(err)) reportNativeFailure(err);
        return LEGACY_APP;
      }
    )
    .then((caps) => {
      current = caps;
      emit();
      return caps;
    });
  return loading;
}

/** Whether the installed binary has a native feature, as far as it is known yet. */
export function hasNativeFeature(feature: string): boolean {
  return current.features.includes(feature);
}

export function nativeCapabilities(): NativeCapabilities {
  return current;
}

/**
 * Compares the binary with the oldest one this server's UI works with. A
 * server that says nothing (older than the handshake) requires nothing.
 */
export async function checkAppUpdate(fetchFeatures: () => Promise<{ minNativeShellApi?: unknown }>): Promise<boolean> {
  if (!isNativeApp()) return false;
  const [caps, features] = await Promise.all([loadNativeCapabilities(), fetchFeatures().catch(() => ({}))]);
  const min = typeof features.minNativeShellApi === 'number' ? features.minNativeShellApi : 0;
  updateRequired = caps.shellApi < min;
  emit();
  return updateRequired;
}

export function appUpdateRequired(): boolean {
  return updateRequired;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Re-renders when the capabilities arrive or the update check answers. */
export function useNativeCapabilities(): { caps: NativeCapabilities; updateRequired: boolean } {
  const caps = useSyncExternalStore(subscribe, nativeCapabilities, nativeCapabilities);
  const required = useSyncExternalStore(subscribe, appUpdateRequired, appUpdateRequired);
  return { caps, updateRequired: required };
}

/** Test helper: forget what was asked. */
export function _resetNativeCapabilities(): void {
  current = WEB;
  updateRequired = false;
  loading = null;
  listeners.clear();
}
