import React, { ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { lockBodyScroll } from '../../utils/bodyScrollLock'
import { useTranslation } from '../../i18n'
import { useDiscardGuard } from '../../components/shared/useDiscardGuard'
import { keepTabInside, useModalFocus } from './modalFocus'
import { useSheetDrag } from './useSheetDrag'
import { useOverlay } from '../overlayStack'
import { tickHaptic } from '../../native/haptics'
import { useNativeQuestion } from '../../native/useNativeQuestion'

export type MSheetVariant = 'card' | 'bottom' | 'drawer'
export type MSheetMaterial = 'glass' | 'bar-glass' | 'opaque'

interface MSheetProps {
  open: boolean
  onClose: () => void
  /** card = centred floating card, bottom = docked panel above the nav, drawer = left drawer */
  variant?: MSheetVariant
  /**
   * @deprecated Every sheet stands on the one opaque surface now (--m-sheetop),
   * whatever is asked for here; see SURFACE. Kept so the callers that still
   * name a material compile.
   */
  material?: MSheetMaterial
  /**
   * Transparent scrim (the "Mehr" sheet sits on the UI without dimming it). Not
   * on a window as short as a phone on its side: there the sheet takes most of
   * the height, and the strips of page left above and below it read as part of
   * it unless they are dimmed.
   */
  dimTransparent?: boolean
  ariaLabel?: string
  className?: string
  children?: ReactNode
  /**
   * The form's state, for the unsaved-changes question the desktop dialogs ask
   * (#2253): a flick of the handle, a tap on the scrim or Escape asks before
   * throwing away a state that differs from the one at the first touch.
   */
  discardGuard?: unknown
  /** Width as a centred form sheet on a wide window (default regular). */
  wideWidth?: MSheetWidth
  /** Where it stands on a wide window (default centre). */
  wideAnchor?: MSheetWideAnchor
  /**
   * A form: FormSheetHeader, FormSheetBody and FormSheetFooter (PlSheetChrome)
   * as its three children. On a window as short as a phone on its side it
   * fills the height instead of floating as a card a third of the screen
   * tall, and its actions move up beside the title (mobile.css, m-form-sheet),
   * so the fields get every line in between.
   */
  form?: boolean
}

const EXIT_MS = 300

const DISCARD_BUTTON = 'rounded-full bg-danger px-4 py-2 text-body font-semibold text-white' // theme-lint-disable: white on the danger fill, as ConfirmDialog draws it

/**
 * How wide the sheet gets on a wide window, where it is a centred form sheet
 * rather than a panel across the screen: compact for a short list of actions,
 * regular for a form, large for a sheet that holds a page of its own.
 */
type MSheetWidth = 'compact' | 'regular' | 'large'
const WIDE_WIDTH: Record<MSheetWidth, string> = {
  compact: 'wide:w-[min(320px,100%)]',
  regular: 'wide:w-[min(540px,100%)]',
  large: 'wide:w-[min(720px,100%)]',
}

/**
 * Where a sheet stands on a wide window. centre: a form sheet. rail-foot: a
 * popover beside the foot of the navigation rail, for a menu opened from there
 * (the trip's More), the way iPadOS shows a menu next to the button that
 * opened it rather than in the middle of the screen.
 */
type MSheetWideAnchor = 'center' | 'rail-foot'

/*
 * The region a sheet may take: a box over the screen that ignores the pointer
 * (a tap on it reaches the scrim) and lays the sheet out inside itself, so a
 * tall sheet is held by the region's edges instead of running past them.
 *
 * On a phone the card stands between the status bar and the dock, and the
 * docked sheet just above the dock; neither lies across the dock.
 */
const REGION: Record<MSheetVariant, string> = {
  card: 'inset-x-[14px] top-[var(--m-safe-top,12px)] bottom-[calc(var(--bottom-nav-h,84px)+12px)] justify-center',
  // On a phone on its side the gap it keeps at the top would leave it a strip
  // of a few rows, so there it may rise nearly to the top.
  bottom:
    'inset-x-4 top-[calc(var(--m-safe-top,12px)+56px)] bottom-[calc(var(--bottom-nav-h,84px)+16px)] justify-end short:top-[calc(var(--m-safe-top,12px)+8px)]',
  drawer: 'start-0 top-0 bottom-0 w-[78%] max-w-[320px]',
}

// On a wide window (hooks/sizeClass.ts) a docked or floating sheet becomes
// what iPadOS shows there: a form sheet over the dimmed page, centred in the
// content beside the navigation rail (never over the rail), as wide as its
// content needs and as tall as the window allows. The region starts after the
// rail on the leading edge, so it needs no physical side.
const WIDE_REGION: Record<MSheetWideAnchor, string> = {
  center:
    'wide:inset-0 wide:ps-[calc(var(--m-rail-w)+24px)] wide:pe-6 wide:pt-[calc(var(--m-safe-top,12px)+12px)] wide:pb-[calc(env(safe-area-inset-bottom,0px)+24px)] wide:items-center wide:justify-center',
  'rail-foot':
    'wide:inset-0 wide:ps-[calc(var(--m-rail-w)+6px)] wide:pt-[calc(var(--m-safe-top,12px)+12px)] wide:pb-[calc(env(safe-area-inset-bottom,0px)+12px)] wide:items-start wide:justify-end',
}

// A form on a window as short as a phone on its side: a sheet the window's
// full height, over the dock, as wide as a form reads well and no wider.
const SHORT_FORM_REGION =
  'short:inset-x-4 short:top-[max(env(safe-area-inset-top,0px),8px)] short:bottom-0 short:items-center short:justify-stretch'
const SHORT_FORM_BOX = 'short:max-w-[640px] short:flex-1'

/** The region the sheet stands in, on a phone and on a wide window. */
function regionClass(variant: MSheetVariant, anchor: MSheetWideAnchor = 'center', form = false): string {
  const base = 'pointer-events-none absolute flex flex-col'
  if (variant === 'drawer') return `${base} ${REGION.drawer}`
  return `${base} ${REGION[variant]} ${WIDE_REGION[anchor]}${form ? ` ${SHORT_FORM_REGION}` : ''}`
}

/** The sheet's own box inside the region: its width, and the arrow when it has one. */
function boxClass(variant: MSheetVariant, width: MSheetWidth = 'regular', form = false): string {
  const base = 'pointer-events-auto relative flex min-h-0 w-full flex-col'
  if (variant === 'drawer') return `${base} h-full`
  return `${base} max-h-full ${WIDE_WIDTH[width]}${form ? ` ${SHORT_FORM_BOX}` : ''}`
}

/** The popover's arrow, pointing at the More button at the foot of the rail (wide windows only). */
function PopoverArrow({ variant, anchor }: { variant: MSheetVariant; anchor?: MSheetWideAnchor }) {
  if (anchor !== 'rail-foot' || variant === 'drawer') return null
  return (
    <span
      aria-hidden="true"
      className="absolute -start-[10px] bottom-[33px] hidden h-[18px] w-[10px] bg-[color:var(--m-sheetop)] [clip-path:polygon(100%_0,0_50%,100%_100%)] rtl:-scale-x-100 wide:block"
    />
  )
}

// The corner radius goes through --m-sheet-r, so mobile.css can keep it on the
// focused panel, where the app-wide focus ring would square it off to 4px.
const SHAPE: Record<MSheetVariant, string> = {
  card: '[--m-sheet-r:28px] max-h-full shadow-[0_30px_80px_-24px_rgba(0,0,0,.6)]',
  bottom:
    '[--m-sheet-r:26px] max-h-full shadow-[0_-8px_40px_-14px_rgba(0,0,0,.45)] wide:[--m-sheet-r:28px] wide:shadow-[0_30px_80px_-24px_rgba(0,0,0,.6)]',
  drawer: '[--m-sheet-r:0px] h-full shadow-[0_0_60px_-10px_rgba(0,0,0,.5)]',
}

// The full-height form on a short window: square at the foot, where it meets
// the edge of the screen, and no border there.
const SHORT_FORM_SHAPE = 'm-form-sheet short:flex-1 short:border-b-0 short:[--m-sheet-r:28px_28px_0_0]'

// Every sheet stands on the one opaque surface. A translucent one let the page
// behind read through as sharp ghost text: the frosting it counted on is
// dropped whenever an ancestor animates its opacity (the scrim fading in),
// which WebKit and Chromium both do, so the fields floated over the list behind.
// For the same reason the dim fades on a layer of its own, beside the sheet and
// not around it: opacity multiplies down the tree, so a fading parent made even
// the opaque sheet see-through for its first frames.
const SURFACE = 'bg-[color:var(--m-sheetop)] border border-[color:var(--m-shbr)]'

// The docked sheet rises from below the screen edge like a native sheet; the
// card pops in place like an alert; the drawer slides from the side.
const ENTER: Record<MSheetVariant, string> = { card: 'm-sheet-in', bottom: 'm-sheet-up', drawer: 'm-drawer-in' }
const EXIT: Record<MSheetVariant, string> = { card: 'm-sheet-out', bottom: 'm-sheet-down', drawer: 'm-drawer-out' }

function sheetRoot(): HTMLElement {
  return document.getElementById('m-sheet-root') ?? document.body
}

/**
 * The one sheet primitive of the mobile design system. Handles portal,
 * scrim, ESC/backdrop dismissal, body scroll lock, focus trapping, native
 * enter/exit motion and — for the bottom variant — drag-to-dismiss from the top
 * edge or from content scrolled to its top (useSheetDrag).
 */
export default function MSheet({
  open,
  onClose,
  variant = 'card',
  dimTransparent = false,
  ariaLabel,
  className = '',
  children,
  discardGuard,
  wideWidth,
  wideAnchor,
  form = false,
}: MSheetProps) {
  const { t } = useTranslation()
  const { asking, markStart, requestClose, wouldAsk, keepEditing, discard, reset } = useDiscardGuard(discardGuard, onClose)
  // In the app the system asks whether to throw the changes away; the card below is the browser's.
  const askInSheet = useNativeQuestion(
    asking,
    {
      title: t('common.unsavedTitle'),
      message: t('common.unsavedMessage'),
      confirmLabel: t('common.discard'),
      cancelLabel: t('common.keepEditing'),
      danger: true,
    },
    (yes) => (yes ? discard() : keepEditing()),
  )
  const [rendered, setRendered] = useState(open)
  // Once the enter animation has played it is removed again: its forwards
  // fill would otherwise override the inline drag transform for good.
  const [entered, setEntered] = useState(false)
  // Thrown off screen by a drag: it leaves from where the finger let go, so the
  // exit animation (which starts from the rest position) must not play.
  const [flung, setFlung] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const sheetDrag = useSheetDrag({
    enabled: variant === 'bottom' && open && rendered,
    panelRef,
    onDismiss: () => {
      if (wouldAsk()) {
        requestClose()
        return false
      }
      setFlung(true)
      tickHaptic()
      onClose()
      return true
    },
  })

  // Keep the sheet mounted through the exit animation.
  useEffect(() => {
    if (open) {
      setRendered(true)
      setFlung(false)
      const panel = panelRef.current
      if (panel) {
        panel.style.transform = ''
        panel.style.transition = ''
      }
      return
    }
    setEntered(false)
    // The sheet stays mounted between openings; the next one starts afresh.
    reset()
    const t = setTimeout(() => setRendered(false), EXIT_MS)
    return () => clearTimeout(t)
  }, [open, reset])

  // Escape belongs to the sheet on top only: a question opened over another
  // sheet closes alone, and the sheet under it stays open with whatever was
  // typed into it. Sheets portal in the order they open, so the top one is the
  // last open panel in the document.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const openPanels = document.querySelectorAll('[data-m-sheet="open"]')
      if (openPanels[openPanels.length - 1] !== panelRef.current) return
      if (asking) keepEditing()
      else requestClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, asking, keepEditing, requestClose])

  useEffect(() => {
    if (!open) return
    return lockBodyScroll()
  }, [open])

  // A way back (the edge swipe, Android's back gesture) closes the sheet on top
  // first, through the same path as the scrim, so unsaved changes still ask.
  useOverlay(open && rendered, requestClose)

  // Move focus into the dialog on open, hand it back on close.
  useModalFocus(panelRef, open && rendered)

  if (!rendered) return null

  // Keep Tab inside the dialog while it is open.
  const handleKeyDown = (e: React.KeyboardEvent) => keepTabInside(e, panelRef.current)

  const enterClass = ENTER[variant]
  const exitClass = EXIT[variant]
  const animation = open ? (entered ? '' : enterClass) : flung ? '' : exitClass

  return createPortal(
    // m-root on the overlay so the --m-* tokens resolve even when the portal
    // has to fall back to document.body (sheet mounted in the same commit as
    // the shell).
    <div
      className="m-root fixed inset-0 z-[60]"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose()
      }}
    >
      <div
        aria-hidden="true"
        data-m-scrim=""
        className={`pointer-events-none absolute inset-0 ${dimTransparent ? 'bg-transparent short:bg-[color:var(--m-dim)]' : 'bg-[color:var(--m-dim)]'} ${open ? 'm-fade-in' : 'm-fade-out'}`}
      />
      <div className={regionClass(variant, wideAnchor, form)}>
        <div className={boxClass(variant, wideWidth, form)}>
          <PopoverArrow variant={variant} anchor={wideAnchor} />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            data-m-sheet={open ? 'open' : 'closing'}
            tabIndex={-1}
            className={`relative flex min-h-0 flex-col overflow-hidden rounded-[var(--m-sheet-r)] text-m-ink outline-none ${SHAPE[variant]}${form ? ` ${SHORT_FORM_SHAPE}` : ''} ${SURFACE} ${animation} ${className}`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            onKeyDownCapture={markStart}
            onPointerDownCapture={markStart}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget && open) setEntered(true)
            }}
          >
            {variant === 'bottom' && (
              // Invisible grab strip along the top edge — the design shows no
              // handle, the panel starts directly with its content. The content
              // pulls the sheet too, once it is scrolled to its top.
              <div
                className="absolute inset-x-0 top-0 z-[1] h-6 cursor-grab touch-none active:cursor-grabbing"
                {...sheetDrag.strip}
              />
            )}
            {children}
            {asking && askInSheet && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-[color:var(--m-dim)] p-5 backdrop-blur-[2px]">
                <div role="alertdialog" aria-label={t('common.unsavedTitle')} className="w-full max-w-[320px] rounded-[22px] border border-[color:var(--m-shbr)] bg-[color:var(--m-sheetop)] p-5">
                  <div className="text-subtitle font-semibold text-m-ink">{t('common.unsavedTitle')}</div>
                  <p className="m-0 mt-1.5 text-body text-m-muted">{t('common.unsavedMessage')}</p>
                  <div className="mt-4 flex justify-end gap-2">
                    <button type="button" autoFocus onClick={keepEditing} className="rounded-full border border-[color:var(--m-shbr)] px-4 py-2 text-body font-semibold text-m-ink">
                      {t('common.keepEditing')}
                    </button>
                    <button type="button" onClick={discard} className={DISCARD_BUTTON}>
                      {t('common.discard')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    sheetRoot(),
  )
}
