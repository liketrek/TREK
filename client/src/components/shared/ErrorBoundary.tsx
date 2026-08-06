import React from 'react'
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { isChunkLoadError, reloadOnceForChunk } from '../../utils/chunkReload'

/**
 * The app had none of these, so a single throw during render unmounted the whole
 * tree and left a blank page. This catches the render path and swaps in a panel
 * the user can act on.
 *
 * What it does NOT catch, and no boundary does: event handlers, anything async,
 * and errors during SSR. Those go to the global handlers in main.tsx.
 *
 * A class is required — getDerivedStateFromError has no hook equivalent. It holds
 * state only; the visible part is a function component underneath, so it can use
 * useTranslation() like everything else. TranslationContext isn't exported, so
 * contextType wouldn't have worked anyway.
 */

type Level = 'root' | 'route' | 'panel'

interface FallbackState {
  error: unknown
  reset: () => void
  isChunkError: boolean
}

export interface ErrorBoundaryProps {
  children: React.ReactNode
  /** Stable name in the console line, e.g. 'route', 'plugin-frame', 'planner-tabs'. */
  boundaryId: string
  level?: Level
  /** Mobile uses its own tokens; they only resolve inside MobileShell's .m-root. */
  variant?: 'desktop' | 'mobile'
  /** Shown instead of the generic wording — a plugin name, a panel title. */
  label?: string
  fallback?: React.ReactNode | ((state: FallbackState) => React.ReactNode)
  /** Any change here clears the error, e.g. [tripId] or [activeTab]. */
  resetKeys?: readonly unknown[]
  onReset?: () => void
  onError?: (error: unknown, info: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  error: unknown
  hasError: boolean
}

function keysChanged(a: readonly unknown[] = [], b: readonly unknown[] = []): boolean {
  return a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]))
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, hasError: false }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error, hasError: true }
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.boundaryId}]`, error, info.componentStack)
    this.props.onError?.(error, info)

    // A chunk that 404s can't be retried — React.lazy keeps the rejected promise,
    // so every later render throws the same thing. One reload picks up the new
    // index; after that the fallback stays put rather than looping.
    if (isChunkLoadError(error)) reloadOnceForChunk()
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    if (this.state.hasError && keysChanged(prev.resetKeys, this.props.resetKeys)) {
      this.reset()
    }
  }

  reset = () => {
    this.props.onReset?.()
    this.setState({ error: null, hasError: false })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const { fallback, level = 'panel', variant = 'desktop', label } = this.props
    const state: FallbackState = {
      error: this.state.error,
      reset: this.reset,
      isChunkError: isChunkLoadError(this.state.error),
    }

    if (typeof fallback === 'function') return fallback(state)
    if (fallback !== undefined) return fallback

    return <ErrorFallback {...state} level={level} variant={variant} label={label} />
  }
}

interface FallbackProps extends FallbackState {
  level: Level
  variant: 'desktop' | 'mobile'
  label?: string
}

/**
 * The visible half. A function component so it can translate; anything mounted
 * above TranslationProvider gets RootErrorFallback instead, which has no keys to
 * look up in the first place.
 */
export function ErrorFallback({ error, reset, isChunkError, level, variant, label }: FallbackProps) {
  const { t } = useTranslation()
  const isPanel = level === 'panel'
  const mobile = variant === 'mobile'

  const title = isChunkError
    ? t('common.errorUpdateTitle')
    : label
      ? t('common.errorPluginTitle')
      : isPanel ? t('common.errorPanelTitle') : t('common.errorTitle')
  const body = isChunkError
    ? t('common.errorUpdateBody')
    : isPanel ? t('common.errorPanelBody') : t('common.errorBody')

  const message = error instanceof Error ? error.message : null

  return (
    <div
      role="alert"
      className={[
        'flex flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center',
        isPanel ? 'h-full min-h-[180px]' : 'm-6 min-h-[240px]',
        mobile ? 'border-[color:var(--m-rowbr)] bg-m-card text-m-ink' : 'border-edge bg-surface-card',
      ].join(' ')}
    >
      <AlertTriangle size={22} className={mobile ? 'text-m-muted' : 'text-content-muted'} aria-hidden />
      <div className="space-y-1">
        <p className={`text-subtitle font-semibold ${mobile ? 'text-m-ink' : 'text-content'}`}>{title}</p>
        {label && <p className={`text-body ${mobile ? 'text-m-muted' : 'text-content-secondary'}`}>{label}</p>}
        <p className={`text-body ${mobile ? 'text-m-muted' : 'text-content-secondary'}`}>{body}</p>
      </div>

      {/* Worth showing: TREK is self-hosted, so the person seeing this is often the
          same person who will paste it into an issue. */}
      {message && (
        <code className={`max-w-full truncate text-caption ${mobile ? 'text-m-faint' : 'text-content-faint'}`}>
          {message}
        </code>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        {/* No retry for a dead chunk — React.lazy would throw again immediately. */}
        {!isChunkError && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-caption font-medium text-white"
          >
            <RotateCcw size={14} aria-hidden />
            {t('common.errorRetry')}
          </button>
        )}
        {(!isPanel || isChunkError) && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={[
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-caption font-medium',
              mobile ? 'border-[color:var(--m-rowbr)] text-m-ink' : 'border-edge text-content',
            ].join(' ')}
          >
            <RefreshCw size={14} aria-hidden />
            {t('common.errorReload')}
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * For the boundary outside TranslationProvider. Deliberately untranslated: if the
 * provider is what crashed, useTranslation() would hand back the default context
 * whose `t` echoes the key, and the user would read "common.errorTitle".
 */
export function RootErrorFallback({ error, isChunkError }: FallbackState) {
  const message = error instanceof Error ? error.message : null
  return (
    <div
      role="alert"
      className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center"
      style={{ fontFamily: 'var(--font-system)' }}
    >
      <AlertTriangle size={24} className="text-content-muted" aria-hidden />
      <p className="text-subtitle font-semibold text-content">
        {isChunkError ? 'A new version is available' : 'TREK could not start'}
      </p>
      <p className="text-body text-content-secondary">
        {isChunkError
          ? 'TREK was updated while this tab was open. Reload to get the new version.'
          : 'Reloading usually fixes this. Your data is safe.'}
      </p>
      {message && <code className="max-w-full truncate text-caption text-content-faint">{message}</code>}
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-caption font-medium text-white"
      >
        <RefreshCw size={14} aria-hidden />
        Reload page
      </button>
    </div>
  )
}
