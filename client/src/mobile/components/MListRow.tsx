import { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface MListRowProps {
  label: ReactNode
  icon?: LucideIcon
  trailing?: ReactNode
  danger?: boolean
  onClick?: () => void
  className?: string
}

/** Menu/list row (user menu style): icon 16 in --m-muted, 13.5px semibold label. */
export default function MListRow({
  label,
  icon: Icon,
  trailing,
  danger = false,
  onClick,
  className = '',
}: MListRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-[11px] rounded-xl px-[10px] py-[11px] text-left text-[0.84375rem] font-semibold active:bg-[color:var(--m-ic)] ${
        danger ? 'text-[color:var(--m-st-danger)]' : 'text-m-ink'
      } ${className}`}
    >
      {Icon && <Icon size={16} strokeWidth={2} className={danger ? '' : 'text-m-muted'} />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing}
    </button>
  )
}
