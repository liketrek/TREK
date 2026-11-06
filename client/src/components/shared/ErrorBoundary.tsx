import React from 'react'
import { AlertTriangle, RefreshCw, RotateCcw, Sparkles } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { isChunkLoadError, reloadOnceForChunk, reloadOntoCurrentBuild } from '../../utils/chunkReload'

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

/**
 * The fallback's Reload button. After a dead chunk a plain reload can come back
 * to this very screen, because the service worker answers it with the shell it
 * already failed to load (#2524), so that case goes through the chunk recovery.
 */
function reloadPage(isChunkError: boolean) {
  if (isChunkError) reloadOntoCurrentBuild()
  else window.location.reload()
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
  const Icon = isChunkError ? Sparkles : AlertTriangle
  const muted = mobile ? 'text-m-muted' : 'text-content-secondary'

  return (
    <div
      role="alert"
      className={[
        'flex flex-col items-center justify-center text-center',
        isPanel ? 'h-full min-h-[180px] p-4' : 'min-h-[60vh] p-6',
      ].join(' ')}
    >
      {/* One calm card, the way a native app reports it: a round symbol, a short
          title and line, and one clear action. */}
      <div
        className={[
          'flex w-full max-w-sm flex-col items-center gap-4 rounded-[24px] border px-6 py-7',
          'shadow-[0_18px_48px_-24px_rgba(0,0,0,.35)]',
          mobile ? 'border-[color:var(--m-rowbr)] bg-m-card text-m-ink' : 'border-edge bg-surface-card',
        ].join(' ')}
      >
        <span
          className={[
            'flex h-14 w-14 items-center justify-center rounded-full',
            isChunkError ? 'bg-accent text-accent-text' : mobile ? 'bg-[color:var(--m-ic)] text-m-muted' : 'bg-surface-secondary text-content-muted',
          ].join(' ')}
        >
          <Icon size={24} strokeWidth={2} aria-hidden />
        </span>
        <div className="space-y-1.5">
          <p className={`text-title font-semibold ${mobile ? 'text-m-ink' : 'text-content'}`}>{title}</p>
          {label && <p className={`text-body ${muted}`}>{label}</p>}
          <p className={`text-body ${muted}`}>{body}</p>
        </div>

        <div className="flex w-full flex-col gap-2">
          {(!isPanel || isChunkError) && (
            <button
              type="button"
              onClick={() => reloadPage(isChunkError)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-body font-semibold text-accent-text transition-transform active:scale-[.98]"
            >
              <RefreshCw size={16} aria-hidden />
              {t('common.errorReload')}
            </button>
          )}
          {/* No retry for a dead chunk — React.lazy would throw again immediately. */}
          {!isChunkError && (
            <button
              type="button"
              onClick={reset}
              className={[
                'inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-3 text-body font-semibold transition-transform active:scale-[.98]',
                mobile ? 'border-[color:var(--m-rowbr)] text-m-ink' : 'border-edge text-content',
              ].join(' ')}
            >
              <RotateCcw size={16} aria-hidden />
              {t('common.errorRetry')}
            </button>
          )}
        </div>

        {/* Kept, folded away: TREK is self-hosted, so the person seeing this is
            often the same person who will paste it into an issue. */}
        {message && (
          <details className={`w-full text-caption ${mobile ? 'text-m-faint' : 'text-content-faint'}`}>
            <summary className="cursor-pointer select-none">{t('common.errorDetails')}</summary>
            <code className="mt-2 block max-w-full break-words text-start">{message}</code>
          </details>
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
  const Icon = isChunkError ? Sparkles : AlertTriangle
  return (
    <div
      role="alert"
      className="flex min-h-dvh flex-col items-center justify-center p-6 text-center"
      style={{ fontFamily: 'var(--font-system)' }}
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-[24px] border border-edge bg-surface-card px-6 py-7 shadow-[0_18px_48px_-24px_rgba(0,0,0,.35)]">
        <span className={`flex h-14 w-14 items-center justify-center rounded-full ${isChunkError ? 'bg-accent text-accent-text' : 'bg-surface-secondary text-content-muted'}`}>
          <Icon size={24} strokeWidth={2} aria-hidden />
        </span>
        <div className="space-y-1.5">
          <p className="text-title font-semibold text-content">
            {isChunkError ? 'A new version is available' : 'TREK could not start'}
          </p>
          <p className="text-body text-content-secondary">
            {isChunkError
              ? 'TREK was updated while this tab was open. Reload to get the new version.'
              : 'Reloading usually fixes this. Your data is safe.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => reloadPage(isChunkError)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-body font-semibold text-accent-text transition-transform active:scale-[.98]"
        >
          <RefreshCw size={16} aria-hidden />
          Reload page
        </button>
        {message && (
          <details className="w-full text-caption text-content-faint">
            <summary className="cursor-pointer select-none">Details</summary>
            <code className="mt-2 block max-w-full break-words text-start">{message}</code>
          </details>
        )}
      </div>
    </div>
  )
}
