import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useHelpStore } from '../../store/helpStore'
import { useHelpShortcut } from '../../hooks/useHelpShortcut'
import { getHelpContext, getHelpGuide } from '../../help/registry'
import HelpNav from './HelpNav'
import HelpHome from './HelpHome'
import HelpGuideView from './HelpGuideView'
import HelpSearchResults from './HelpSearchResults'
import HelpLightbox from './HelpLightbox'
import './help.css'

/** How long the closing animation runs before the dialog leaves the DOM. */
const CLOSE_MS = 160

/**
 * The help center: one large dialog over the app. Navigation and search on the
 * left, the screen overview or the open guide on the right. Escape is handled
 * by useHelpShortcut; the `?` in the navbar is the only way in.
 */
export default function HelpPanel(): React.ReactElement | null {
  const { t } = useTranslation()
  const open = useHelpStore(s => s.open)
  const contextId = useHelpStore(s => s.contextId)
  const browseId = useHelpStore(s => s.browseId)
  const guideId = useHelpStore(s => s.guideId)
  const query = useHelpStore(s => s.query)
  const closeHelp = useHelpStore(s => s.closeHelp)
  const loadDocIndex = useHelpStore(s => s.loadDocIndex)
  useHelpShortcut()

  // Keep the dialog mounted for the length of the exit animation.
  const [state, setState] = useState<'closed' | 'open' | 'closing'>(open ? 'open' : 'closed')
  const wasOpen = useRef(open)
  useEffect(() => {
    if (open) {
      wasOpen.current = true
      setState('open')
      return
    }
    if (!wasOpen.current) return
    wasOpen.current = false
    setState('closing')
    const id = window.setTimeout(() => setState('closed'), CLOSE_MS)
    return () => window.clearTimeout(id)
  }, [open])

  // Doc titles for the links; one fetch per session.
  useEffect(() => {
    if (open) void loadDocIndex()
  }, [open, loadDocIndex])

  // The page behind must not scroll while the dialog is up.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Focus back to the `?` when the dialog closes.
  useEffect(() => {
    if (open) return
    const btn = document.querySelector<HTMLElement>('[data-help-button]')
    if (btn && document.activeElement === document.body) btn.focus({ preventScroll: true })
  }, [open])

  // Every view change starts at the top of the content pane.
  const shownId = browseId ?? contextId
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo?.({ top: 0 })
  }, [guideId, query, shownId])

  if (state === 'closed') return null

  const context = getHelpContext(shownId)
  const guide = getHelpGuide(guideId)
  // Typing wins over whatever was open: a search from inside a guide shows
  // results, and clearing the box returns to that guide.
  const searching = query.trim().length > 0

  return createPortal(
    <>
      <div
        className="trek-help-backdrop fixed inset-0 z-[var(--z-overlay)] flex items-center justify-center p-3 sm:p-5 bg-[var(--overlay)] backdrop-blur-sm"
        data-state={state === 'open' ? 'open' : 'closing'}
        role="presentation"
        onClick={closeHelp}
      >
        <div
          className="trek-help-dialog relative w-[min(1520px,100%)] h-[min(960px,100%)] grid grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)] rounded-2xl border border-edge bg-surface-card shadow-modal overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t('help.center.title')}
          onClick={e => e.stopPropagation()}
        >
          <HelpNav context={context} currentId={contextId} activeGuideId={!searching && guide ? guide.id : null} />

          <div className="relative flex flex-col min-h-0 bg-surface" role="main">
            <button
              type="button"
              onClick={closeHelp}
              aria-label={t('help.center.close')}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center text-content-muted bg-surface-card border border-edge shadow-card hover:text-content hover:bg-surface-hover transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div ref={scrollRef} className="trek-help-scroll flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <div className="max-w-[1080px] mx-auto px-6 sm:px-10 py-8">
                {searching ? (
                  <HelpSearchResults key="search" />
                ) : guide ? (
                  <HelpGuideView key={guide.id} guide={guide} />
                ) : (
                  <HelpHome key={context?.id ?? 'none'} context={context} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <HelpLightbox />
    </>,
    document.body,
  )
}
