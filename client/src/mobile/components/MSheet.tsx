import React, { ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { lockBodyScroll } from '../../utils/bodyScrollLock'
import { useTranslation } from '../../i18n'
import { useDiscardGuard } from '../../components/shared/useDiscardGuard'
import { keepTabInside, useModalFocus } from './modalFocus'
import { useSheetDrag } from './useSheetDrag'
import { useOverlay } from '../overlayStack'
import { tickHaptic } from '../../native/haptics'

export type MSheetVariant = 'card' | 'bottom' | 'drawer'
export type MSheetMaterial = 'glass' | 'bar-glass' | 'opaque'

interface MSheetProps {
  open: boolean
  onClose: () => void
  /** card = centred floating card, bottom = docked panel above the nav, drawer = left drawer */
  variant?: MSheetVariant
  /**
   * glass = translucent sheet (--m-sheet), bar-glass = lighter bar glass
   * (--m-glass, default for the bottom variant), opaque = solid (--m-sheetop)
   */
  material?: MSheetMaterial
  /** Transparent scrim (the "Mehr" sheet sits on the UI without dimming it) */
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
}

const EXIT_MS = 300

const DISCARD_BUTTON = 'rounded-full bg-danger px-4 py-2 text-body font-semibold text-white' // theme-lint-disable: white on the danger fill, as ConfirmDialog draws it

/**
 * How wide the sheet gets on a wide window, where it is a centred form sheet
 * rather than a panel across the screen: compact for a short list of actions,
 * regular for a form, large for a sheet that holds a page of its own.
 */
type MSheetWidth = 'compact' | 'regular' | 'large'

// On a wide window (hooks/sizeClass.ts) a docked or floating sheet becomes
// what iPadOS shows there: a form sheet centred over the dimmed page, as wide
// as its content needs and no wider, instead of a band across a 13" screen.
// Centred with auto margins between zero insets, so it needs no physical side.
const WIDE_POSITION = 'wide:inset-x-0 wide:mx-auto wide:bottom-auto wide:top-1/2 wide:-translate-y-1/2'
const WIDE_WIDTH: Record<MSheetWidth, string> = {
  compact: 'wide:w-[min(320px,calc(100%-48px))]',
  regular: 'wide:w-[min(540px,calc(100%-48px))]',
  large: 'wide:w-[min(720px,calc(100%-48px))]',
}

const POSITION: Record<MSheetVariant, string> = {
  card: 'absolute inset-x-[14px] top-1/2 -translate-y-1/2',
  bottom: 'absolute inset-x-4 bottom-[calc(var(--bottom-nav-h,84px)+16px)]',
  drawer: 'absolute left-0 top-0 bottom-0 w-[78%] max-w-[320px]',
}

/**
 * Where a sheet stands on a wide window. centre: a form sheet. rail-foot: a
 * popover beside the foot of the navigation rail, for a menu opened from there
 * (the trip's More), the way iPadOS shows a menu next to the button that
 * opened it rather than in the middle of the screen.
 */
type MSheetWideAnchor = 'center' | 'rail-foot'
const WIDE_ANCHOR: Record<MSheetWideAnchor, string> = {
  center: WIDE_POSITION,
  'rail-foot': 'wide:top-auto wide:translate-y-0 wide:end-auto wide:bottom-[calc(env(safe-area-inset-bottom,0px)+12px)] wide:start-[calc(var(--m-rail-w)+6px)]',
}

/** The box the panel sits in: its place on a phone, and on a wide window. */
function frameClass(variant: MSheetVariant, width: MSheetWidth = 'regular', anchor: MSheetWideAnchor = 'center'): string {
  if (variant === 'drawer') return POSITION.drawer
  return `${POSITION[variant]} ${WIDE_WIDTH[width]} ${WIDE_ANCHOR[anchor]}`
}

/** The popover's arrow, pointing at the More button at the foot of the rail (wide windows only). */
function PopoverArrow({ variant, anchor }: { variant: MSheetVariant; anchor?: MSheetWideAnchor }) {
  if (anchor !== 'rail-foot' || variant === 'drawer') return null
  return (
    <span
      aria-hidden="true"
      className="absolute -start-[10px] bottom-[33px] hidden h-[18px] w-[10px] bg-[color:var(--m-sheet)] backdrop-blur-[40px] [clip-path:polygon(100%_0,0_50%,100%_100%)] rtl:-scale-x-100 wide:block"
    />
  )
}

const WIDE_HEIGHT = 'wide:max-h-[min(calc(100dvh-var(--m-safe-top,12px)-64px),880px)]'

const SHAPE: Record<MSheetVariant, string> = {
  card: `rounded-[28px] shadow-[0_30px_80px_-24px_rgba(0,0,0,.6)] max-h-[calc(100dvh-var(--m-safe-top,12px)-96px)] ${WIDE_HEIGHT}`,
  bottom: `rounded-[26px] shadow-[0_-8px_40px_-14px_rgba(0,0,0,.45)] max-h-[calc(100dvh-var(--bottom-nav-h,84px)-var(--m-safe-top,12px)-72px)] ${WIDE_HEIGHT} wide:shadow-[0_30px_80px_-24px_rgba(0,0,0,.6)]`,
  drawer: 'h-full shadow-[0_0_60px_-10px_rgba(0,0,0,.5)]',
}

// Deliberate normalisation: the demo borders a few opaque sheets (journey
// create/entry/settings, drawer) with --rowbr instead of --shbr; both hairlines
// are near-identical on the solid sheet surface, so every material keeps one
// border token here.
const MATERIAL: Record<MSheetMaterial, string> = {
  glass:
    'bg-[color:var(--m-sheet)] backdrop-blur-[40px] backdrop-saturate-[1.8] border border-[color:var(--m-shbr)]',
  'bar-glass':
    'bg-[color:var(--m-glass)] backdrop-blur-[30px] backdrop-saturate-[1.8] border border-[color:var(--m-gbr)]',
  opaque: 'bg-[color:var(--m-sheetop)] border border-[color:var(--m-shbr)]',
}

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
  material,
  dimTransparent = false,
  ariaLabel,
  className = '',
  children,
  discardGuard,
  wideWidth,
  wideAnchor,
}: MSheetProps) {
  const { t } = useTranslation()
  const { asking, markStart, requestClose, wouldAsk, keepEditing, discard, reset } = useDiscardGuard(discardGuard, onClose)
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

  // One material for every sheet, docked or floating, so they all read the same.
  const resolvedMaterial = material ?? 'glass'

  return createPortal(
    // m-root on the overlay so the --m-* tokens resolve even when the portal
    // has to fall back to document.body (sheet mounted in the same commit as
    // the shell).
    // A transparent scrim skips the overlay's opacity animation: an animating
    // opacity<1 ancestor becomes a backdrop-root that cancels the sheet's own
    // backdrop-blur (the "liquid glass" frost). The sheet still slides via m-sheet-in.
    <div
      className={`m-root fixed inset-0 z-[60] ${dimTransparent ? 'bg-transparent' : `bg-[color:var(--m-dim)] ${open ? 'm-fade-in' : 'm-fade-out'}`}`}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose()
      }}
    >
      <div className={frameClass(variant, wideWidth, wideAnchor)}>
        <PopoverArrow variant={variant} anchor={wideAnchor} />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          data-m-sheet={open ? 'open' : 'closing'}
          tabIndex={-1}
          className={`relative flex flex-col overflow-hidden outline-none text-m-ink ${SHAPE[variant]} ${MATERIAL[resolvedMaterial]} ${animation} ${className}`}
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
          {asking && (
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
    </div>,
    sheetRoot(),
  )
}
