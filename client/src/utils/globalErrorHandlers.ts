import axios from 'axios'
import { isChunkLoadError, reloadOnceForChunk } from './chunkReload'

/**
 * The half no boundary can reach: throws in event handlers, in async code, and
 * rejected promises nobody caught.
 *
 * Deliberately quiet. It logs, and it heals one specific case — a dynamic import
 * that failed because the chunk is gone after a deploy. It does not toast and it
 * does not redirect: the axios interceptor already redirects on 401/403 and
 * rewrites 429 (api/client.ts), and there are 600+ `toast.error` call sites that
 * report their own failures. Reacting again here would mean double toasts and, in
 * the redirect cases, redirect loops.
 */

/** Axios rejects onward from its interceptor, so every caller without a catch lands here. */
function isHandledNetworkError(reason: unknown): boolean {
  return axios.isAxiosError(reason)
}

function onUnhandledRejection(event: PromiseRejectionEvent): void {
  const reason = event.reason

  if (isChunkLoadError(reason)) {
    // A lazy import can reject outside render too — a prefetch, or a chunk pulled
    // in from an effect. Same cure, same once-per-session guard.
    reloadOnceForChunk()
    return
  }

  if (isHandledNetworkError(reason)) return

  console.error('[unhandledrejection]', reason)
}

function onError(event: ErrorEvent): void {
  if (isChunkLoadError(event.error ?? event.message)) {
    reloadOnceForChunk()
    return
  }
  console.error('[window.onerror]', event.error ?? event.message)
}

/**
 * Call once, before the app renders. Returns a teardown so tests can install and
 * remove it without leaking listeners between files.
 */
export function installGlobalErrorHandlers(): () => void {
  window.addEventListener('unhandledrejection', onUnhandledRejection)
  // Bubble phase only: the capture phase would also fire for every failed <img>
  // and <link>, which on a map-heavy app means hundreds of tile requests.
  window.addEventListener('error', onError)

  return () => {
    window.removeEventListener('unhandledrejection', onUnhandledRejection)
    window.removeEventListener('error', onError)
  }
}
