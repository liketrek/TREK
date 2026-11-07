import { InputHTMLAttributes, ReactNode, useState } from 'react'
import { Eye, EyeOff, Loader2, X } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import MIconBtn from '../../components/MIconBtn'

/** Opaque content card of the admin screen (r18, --m-sheetop on --m-rowbr). */
export function MAdminCard({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-[18px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] p-[14px] ${className}`}>
      {children}
    </div>
  )
}

/** Card header: 14px/800 title, small Geist hint, optional trailing control. */
export function MAdminCardHead({
  title,
  hint,
  trailing,
}: {
  title: ReactNode
  hint?: ReactNode
  trailing?: ReactNode
}) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <div className="text-[0.875rem] font-extrabold text-m-ink">{title}</div>
        {hint && <div className="mt-[2px] font-geist text-[0.625rem] leading-relaxed text-m-muted">{hint}</div>}
      </div>
      {trailing}
    </div>
  )
}

/** Settings row: bold 13px title + Geist hint on the left, control on the right. */
export function MAdminRow({
  title,
  hint,
  trailing,
  first = false,
}: {
  title: ReactNode
  hint?: ReactNode
  trailing?: ReactNode
  first?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-[11px] ${
        first ? '' : 'border-t border-[color:var(--m-rowbr)]'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[0.8125rem] font-bold text-m-ink">{title}</div>
        {hint && <div className="mt-[1px] font-geist text-[0.625rem] leading-relaxed text-m-muted">{hint}</div>}
      </div>
      {trailing}
    </div>
  )
}

/**
 * A description that keeps to two lines until it is tapped. On a phone the long
 * ones (a map provider's terms, how a loader decides) pushed every control off
 * screen; the whole text stays one tap away.
 */
export function MAdminClampedText({ children, className = '' }: { children: string; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => setOpen((value) => !value)}
      className={`block w-full text-start font-geist leading-relaxed text-m-muted ${open ? '' : 'line-clamp-2'} ${className}`}
    >
      {children}
    </button>
  )
}

/** Labelled form field with an optional hint line under the control. */
export function MAdminField({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="mb-[5px] font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">{label}</div>
      {children}
      {hint && <div className="mt-[5px] font-geist text-[0.625rem] leading-relaxed text-m-muted">{hint}</div>}
    </div>
  )
}

export function MAdminInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-[42px] w-full rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px] text-[0.84375rem] text-m-ink outline-none placeholder:text-m-faint focus:border-[color:var(--m-faint)] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    />
  )
}

/** Password-style input with the show/hide eye of the desktop admin forms. */
export function MAdminSecretInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <MAdminInput {...props} type={show ? 'text' : 'password'} className={`pe-10 ${className}`} />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Show or hide"
        onClick={() => setShow((v) => !v)}
        className="absolute end-3 top-1/2 -translate-y-1/2 text-m-faint"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

interface MAdminButtonProps {
  variant?: 'primary' | 'ghost' | 'danger'
  busy?: boolean
  disabled?: boolean
  onClick?: () => void
  title?: string
  className?: string
  children: ReactNode
}

/** Pill action button (design: r999, --m-act surface, 11px/700). */
export function MAdminButton({
  variant = 'primary',
  busy = false,
  disabled = false,
  onClick,
  title,
  className = '',
  children,
}: MAdminButtonProps) {
  const look =
    variant === 'primary'
      ? 'bg-m-act text-m-actfg'
      : variant === 'danger'
        ? 'bg-[color:var(--m-st-danger)] text-white'
        : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      title={title}
      className={`inline-flex flex-none items-center justify-center gap-[5px] whitespace-nowrap rounded-full px-3 py-[7px] text-[0.6875rem] font-bold disabled:opacity-50 ${look} ${className}`}
    >
      {busy && <Loader2 size={12} className="animate-spin" />}
      {children}
    </button>
  )
}

/** Sheet body frame: title row + close, scrollable content, optional footer. */
export function MAdminSheetFrame({
  title,
  icon,
  onClose,
  footer,
  children,
}: {
  title: ReactNode
  /** The icon tile in front of the title, as every phone sheet has. */
  icon?: ReactNode
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <>
      {/* TileHeader's shape: the icon tile, the title and the round close. */}
      <div className="flex flex-none items-center gap-3 px-[18px] pb-1 pt-4">
        {icon && (
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[13px] bg-[color:var(--m-ic)] text-m-ink">
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1 truncate text-[1.0625rem] font-bold leading-tight text-m-ink">{title}</div>
        <MIconBtn variant="neutral" size={34} ariaLabel={t('common.close')} onClick={onClose}>
          <X size={15} strokeWidth={2.2} />
        </MIconBtn>
      </div>
      <div className="m-scroll-fade mt-2 min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px] pt-[14px]">{children}</div>
      {footer && (
        // The footer's buttons take the sheets' 42 px size; elsewhere MAdminButton stays a small pill.
        <div className="flex flex-none items-center justify-end gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3 [&>button]:h-[42px] [&>button]:px-4 [&>button]:text-[length:calc(13px*var(--fs-scale-body,1))] [&>button]:font-semibold">
          {footer}
        </div>
      )}
    </>
  )
}
