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

/** Labelled form field with an optional hint line under the control. */
export function MAdminField({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="mb-[6px] text-[0.75rem] font-semibold text-m-ink">{label}</div>
      {children}
      {hint && <div className="mt-[5px] font-geist text-[0.625rem] leading-relaxed text-m-muted">{hint}</div>}
    </div>
  )
}

export function MAdminInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-[42px] w-full rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 text-[0.84375rem] text-m-ink outline-none placeholder:text-m-faint focus:border-[color:var(--m-faint)] ${className}`}
    />
  )
}

/** Password-style input with the show/hide eye of the desktop admin forms. */
export function MAdminSecretInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <MAdminInput {...props} type={show ? 'text' : 'password'} className={`pr-10 ${className}`} />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Show or hide"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-m-faint"
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
  onClose,
  footer,
  children,
}: {
  title: ReactNode
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <>
      <div className="flex flex-none items-center gap-2 px-4 pb-2 pt-4">
        <div className="min-w-0 flex-1 truncate text-[0.9375rem] font-extrabold text-m-ink">{title}</div>
        <MIconBtn variant="neutral" size={34} ariaLabel={t('common.close')} onClick={onClose}>
          <X size={16} strokeWidth={2.2} />
        </MIconBtn>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
      {footer && (
        <div className="flex flex-none items-center justify-end gap-2 border-t border-[color:var(--m-rowbr)] px-4 py-3">
          {footer}
        </div>
      )}
    </>
  )
}
