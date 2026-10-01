import { useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes, type ClipboardEvent, type CSSProperties, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, X } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { lockBodyScroll } from '../../utils/bodyScrollLock'
import { Tooltip } from './Tooltip'
import { focusDialog, trapTab } from './dialogFocus'

/** A font size that follows the user's text size setting for its tier. */
export const fs = (px: number, tier: 'caption' | 'body' | 'subtitle' = 'caption'): CSSProperties => ({ fontSize: `calc(${px}px * var(--fs-scale-${tier}, 1))` })

const EYEBROW = 'font-geist font-bold uppercase tracking-[.08em] text-content-faint'
const BACKDROP = 'trek-modal-backdrop trek-backdrop-enter fixed inset-0 z-[10000] flex justify-center bg-[rgba(15,23,42,0.5)] px-4' // theme-lint-disable: the dim every shared/Modal draws
const PANEL_WIDTH = { narrow: 'max-w-[520px]', detail: 'max-w-[600px]', editor: 'max-w-[720px]', wide: 'max-w-[960px]', xwide: 'max-w-[1280px]' } as const
const BODY = 'flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pb-6 pt-5'

/** The head band of a dialog that belongs to no booking: a faint wash of the accent. */
export const NEUTRAL_TINT = 'color-mix(in srgb, var(--accent) 7%, transparent)'

export interface DialogShellProps {
  /** A dialog that stays mounted passes its open state; one mounted only while shown leaves it out. */
  open?: boolean
  onClose: () => void
  /** The id DialogHeader gets as labelId. */
  labelledBy: string
  /** 520 px for a single question, 600 px for a detail, 720 px for an editor, 960 px for one in two columns. */
  width?: keyof typeof PANEL_WIDTH
  /** 'top' pins the upper edge, so a dialog whose content changes height does not jump. */
  align?: 'center' | 'top'
  /** True while a question opened from here is being answered: Escape and the backdrop leave the dialog alone. */
  blocked?: boolean
  header: ReactNode
  footer?: ReactNode
  /** Makes the scrolling body a form. */
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void
  /** The scrolling body; a dialog that is all head and foot leaves it out. */
  children?: ReactNode
  /** Replaces the body's padded column, for content that fills the panel (a document preview). */
  bodyClassName?: string
  /** A paste anywhere in the panel, head band included (a note takes pasted images from its title too). */
  onPaste?: (e: ClipboardEvent<HTMLDivElement>) => void
  /**
   * The editor's state, for the unsaved-changes question (#2253). Snapshotted at
   * the first key or pointer press inside the panel, so whatever the dialog
   * loaded on open counts as the starting point. A click on the backdrop or
   * Escape then asks before throwing away a state that differs from it. Must be
   * JSON-serialisable; pass counts for files and arrays for sets.
   */
  discardGuard?: unknown
}

const DISCARD_BUTTON = 'inline-flex items-center gap-1.5 rounded-[10px] bg-danger px-4 py-2 font-medium text-white hover:opacity-90' // theme-lint-disable: white on the danger fill, as ConfirmDialog draws it

const snapshot = (value: unknown): string | null => {
  try { return JSON.stringify(value) ?? null } catch { return null }
}

/**
 * The frame of the planner's dialogs: dimmed backdrop, the rounded panel, a
 * head band that stays put, a body that scrolls and a bar that stays in reach.
 */
export function DialogShell({ open = true, ...frame }: DialogShellProps) {
  return open ? <DialogFrame {...frame} /> : null
}

function DialogFrame({ onClose, labelledBy, width = 'detail', align = 'center', blocked = false, header, footer, onSubmit, children, bodyClassName, onPaste, discardGuard }: Omit<DialogShellProps, 'open'>) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  const pressedOn = useRef<EventTarget | null>(null)
  // Read while rendering, before a field inside can take the focus with autoFocus.
  const [focusedBefore] = useState(() => document.activeElement)
  // The unsaved-changes question (#2253): the state at the first touch, and
  // whether the question is on screen.
  const baseline = useRef<string | null>(null)
  const guarded = discardGuard !== undefined
  const guardRef = useRef(discardGuard)
  useEffect(() => { guardRef.current = discardGuard })
  const [asking, setAsking] = useState(false)
  const markStart = () => { if (guarded && baseline.current === null) baseline.current = snapshot(discardGuard) }
  // The backdrop and Escape: the two ways out a hand can take by accident.
  const requestClose = useCallback(() => {
    if (guardRef.current !== undefined && baseline.current !== null && snapshot(guardRef.current) !== baseline.current) setAsking(true)
    else onClose()
  }, [onClose])
  const held = blocked || asking

  useEffect(() => {
    if (held) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) requestClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [held, requestClose])

  useEffect(() => {
    if (!asking) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); setAsking(false) } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [asking])

  // The page stays put behind the dialog, the focus moves into it (the first text
  // field on a desktop, #1302), and whatever opened it gets the focus back.
  useEffect(() => {
    const panel = panelRef.current
    const focusedInside = !!panel && panel.contains(document.activeElement)
    const opener = focusedInside ? focusedBefore : document.activeElement
    const release = lockBodyScroll()
    if (!focusedInside && panel) focusDialog(panel)
    return () => {
      release()
      if (opener instanceof HTMLElement) opener.focus()
    }
  }, [focusedBefore])

  const bodyClass = bodyClassName ?? BODY
  const body = children == null ? null : onSubmit
    ? <form onSubmit={onSubmit} className={bodyClass}>{children}</form>
    : <div className={bodyClass}>{children}</div>

  return createPortal(
    <div
      role="presentation"
      className={`${BACKDROP} ${align === 'top' ? 'items-start' : 'items-center'}`}
      style={{ paddingTop: 40, paddingBottom: 'calc(40px + var(--bottom-nav-h, 0px))' }}
      // Only a press that starts and ends on the backdrop closes: a selection
      // dragged out of a field must not throw the dialog away.
      onMouseDown={e => { pressedOn.current = e.target }}
      onClick={e => {
        if (!held && e.target === e.currentTarget && pressedOn.current === e.currentTarget) requestClose()
        pressedOn.current = null
      }}
    >
      {/* No aria-modal: the pickers inside open their lists in a portal on
          the body, and a screen reader would hide those along with the page. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onPaste={onPaste}
        onKeyDownCapture={markStart}
        onPointerDownCapture={markStart}
        onKeyDown={e => { if (panelRef.current) trapTab(e, panelRef.current) }}
        className={`trek-modal-enter relative flex max-h-full w-full ${PANEL_WIDTH[width]} flex-col overflow-hidden rounded-[22px] bg-surface-card shadow-2xl outline-none`}
      >
        {header}
        {body}
        {footer}
        {asking && (
          <div className="trek-backdrop-enter absolute inset-0 z-10 grid place-items-center p-6 backdrop-blur-[2px]" style={{ background: 'color-mix(in srgb, var(--bg-card) 72%, transparent)' }}>
            <div role="alertdialog" aria-labelledby={`${labelledBy}-discard`} className="trek-modal-enter w-full max-w-[340px] rounded-[18px] border border-edge-faint bg-surface-card p-5 shadow-xl">
              <div id={`${labelledBy}-discard`} className="font-semibold text-content" style={fs(15, 'subtitle')}>{t('common.unsavedTitle')}</div>
              <p className="m-0 mt-1.5 text-content-muted" style={fs(12.5, 'body')}>{t('common.unsavedMessage')}</p>
              <div className="mt-4 flex justify-end gap-2">
                <DialogButton autoFocus onClick={() => setAsking(false)}>{t('common.keepEditing')}</DialogButton>
                <button type="button" onClick={() => { setAsking(false); onClose() }} className={DISCARD_BUTTON} style={fs(13, 'body')}>
                  {t('common.discard')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

/** The raised square on the left of a head band, holding the dialog's icon. */
export function DialogTile({ children }: { children: ReactNode }) {
  return <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-[14px] bg-surface-card shadow-sm">{children}</span>
}

export interface HeaderTitleInput {
  value: string
  onChange: (value: string) => void
  /** The field's accessible name, e.g. the old "Title *" label. */
  label: string
  placeholder?: string
  autoFocus?: boolean
  required?: boolean
  maxLength?: number
  onKeyDown?: (e: ReactKeyboardEvent<HTMLInputElement>) => void
  onBlur?: () => void
}

export interface DialogHeaderProps {
  /** The raised tile on the left, usually a DialogTile around an icon. */
  tile: ReactNode
  /** The band's background: a status tint, or NEUTRAL_TINT. */
  tint: string
  /** Same value as the shell's labelledBy. It lands on the eyebrow when there is one, otherwise on the title. */
  labelId: string
  onClose: () => void
  /** A small line above the title; editors keep their dialog title ("Edit transport") here. */
  eyebrow?: ReactNode
  /** A title to read. With onTitleClick it becomes a button (a rename). */
  title?: ReactNode
  onTitleClick?: () => void
  titleTooltip?: string
  /** A title to type into, in place of title. */
  titleInput?: HeaderTitleInput
  sub?: ReactNode
  /** Lets a sentence of a sub (a hint) wrap instead of ending in an ellipsis like a route does. */
  subWraps?: boolean
  /** The pill row under the title. */
  pills?: ReactNode
}

/** The head band: tile, eyebrow, the title to read or type, a sub line and a row of pills. */
export function DialogHeader(p: DialogHeaderProps) {
  const { t } = useTranslation()
  const titleId = p.eyebrow ? undefined : p.labelId
  const titleStyle = fs(20, 'subtitle')
  let title: ReactNode
  if (p.titleInput) {
    const f = p.titleInput
    title = (
      <input
        id={titleId}
        type="text"
        value={f.value}
        onChange={e => f.onChange(e.target.value)}
        onKeyDown={e => {
          // Enter is spent here: once it has closed the dialog and the focus is
          // back on the opener, the rest of the key press must not click it again.
          if (e.key === 'Enter') e.preventDefault()
          f.onKeyDown?.(e)
        }}
        onBlur={f.onBlur}
        aria-label={f.label}
        placeholder={f.placeholder}
        autoFocus={f.autoFocus}
        required={f.required}
        maxLength={f.maxLength}
        className="-mx-2 block w-[calc(100%+16px)] rounded-[10px] border-0 bg-transparent px-2 py-0.5 font-bold tracking-[-0.01em] text-content outline-none placeholder:font-semibold placeholder:text-content-faint hover:bg-surface-card focus:bg-surface-card focus:shadow-sm dark:bg-transparent dark:hover:bg-surface-card dark:focus:bg-surface-card"
        style={titleStyle}
      />
    )
  } else if (p.onTitleClick) {
    title = (
      <Tooltip label={p.titleTooltip ?? ''}>
        <button id={titleId} type="button" onClick={p.onTitleClick}
          className="block max-w-full truncate text-left font-bold tracking-[-0.01em] text-content hover:underline hover:decoration-edge" style={titleStyle}>
          {p.title}
        </button>
      </Tooltip>
    )
  } else {
    title = <h2 id={titleId} className="m-0 truncate font-bold tracking-[-0.01em] text-content" style={titleStyle}>{p.title}</h2>
  }

  return (
    <header className="flex-none px-6 pb-4 pt-5" style={{ background: p.tint }}>
      {/* With nothing under it the title sits level with the middle of the tile. */}
      <div className={`flex gap-3.5 ${p.sub ? 'items-start' : 'items-center'}`}>
        {p.tile}
        <div className={`min-w-0 flex-1 ${p.sub ? 'pt-0.5' : ''}`}>
          {p.eyebrow && (
            <h2 id={p.labelId} className="m-0 mb-0.5 truncate font-geist font-bold uppercase tracking-[.08em] text-content-muted" style={fs(10)}>
              {p.eyebrow}
            </h2>
          )}
          {title}
          {p.sub && <div className={`mt-0.5 font-geist text-content-muted ${p.subWraps ? 'break-words' : 'truncate'}`} style={fs(12.5)}>{p.sub}</div>}
        </div>
        <Tooltip label={t('common.close')}>
          <button type="button" onClick={p.onClose} aria-label={t('common.close')}
            className="grid h-9 w-9 flex-none place-items-center rounded-full bg-surface-card text-content-muted shadow-sm hover:text-content">
            <X size={16} strokeWidth={2.2} />
          </button>
        </Tooltip>
      </div>
      {p.pills && <div className="mt-4 flex flex-wrap items-center gap-2" style={fs(12, 'body')}>{p.pills}</div>}
    </header>
  )
}

/** A pill on the head band's row; wrap text and an icon in a span with it. */
export const PILL = 'inline-flex flex-none items-center gap-1.5 rounded-full bg-surface-card px-2.5 py-1 font-semibold text-content shadow-sm'

/** A labelled block of the body, with room for an action on the right of its label. */
export function DialogSection({ label, action, className, children }: { label: ReactNode; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={className}>
      <div className="mb-2 flex items-center gap-2">
        <div className={EYEBROW} style={fs(9.5)}>{label}</div>
        {action && <span className="ml-auto">{action}</span>}
      </div>
      {children}
    </section>
  )
}

/** The bar under the body. Put a FooterSpacer between what sits left and what sits right. */
export function DialogFooter({ children }: { children: ReactNode }) {
  return <footer className="flex flex-none items-center gap-2 border-t border-edge-faint px-6 py-3.5">{children}</footer>
}

export function FooterSpacer() {
  return <span className="flex-1" />
}

const BUTTON_LOOK = {
  secondary: 'inline-flex items-center gap-1.5 rounded-[10px] bg-surface-card px-3.5 py-2 font-medium text-content shadow-sm ring-1 ring-edge-faint hover:bg-surface-secondary disabled:cursor-default disabled:opacity-50',
  active: 'inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-3.5 py-2 font-medium text-accent-text disabled:cursor-default disabled:opacity-50',
  primary: 'inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-4 py-2 font-medium text-accent-text hover:opacity-90 disabled:cursor-default disabled:opacity-50',
} as const

export type DialogButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'style'> & {
  variant?: 'primary' | 'secondary'
  /** A secondary button that is switched on (shown on the map) takes the accent fill. */
  active?: boolean
  icon?: ReactNode
}

/** A footer button: white on a hairline, or the accent fill for the one that finishes the dialog. */
export function DialogButton({ variant = 'secondary', active = false, icon, children, type = 'button', ...rest }: DialogButtonProps) {
  const look = variant === 'primary' ? BUTTON_LOOK.primary : active ? BUTTON_LOOK.active : BUTTON_LOOK.secondary
  return (
    <button {...rest} type={type} className={look} style={fs(13, 'body')}>
      {icon}{children}
    </button>
  )
}

/** The square delete button of the footer, named by its tooltip. */
export function DeleteButton({ onClick, label, disabled }: { onClick: () => void; label?: string; disabled?: boolean }) {
  const { t } = useTranslation()
  const name = label ?? t('common.delete')
  return (
    <Tooltip label={name} placement="top">
      <button type="button" onClick={onClick} disabled={disabled} aria-label={name}
        className="grid h-9 w-9 place-items-center rounded-[10px] bg-surface-card text-danger shadow-sm ring-1 ring-edge-faint hover:bg-danger-soft disabled:cursor-default disabled:opacity-50">
        <Trash2 size={15} strokeWidth={2} />
      </button>
    </Tooltip>
  )
}
