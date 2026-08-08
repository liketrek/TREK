import { ReactNode } from 'react'

interface MChipProps {
  active?: boolean
  onClick?: () => void
  className?: string
  children: ReactNode
}

/** Small pill chip: --m-act when active, neutral --m-ic surface otherwise. */
export default function MChip({ active = false, onClick, className = '', children }: MChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex flex-none items-center gap-[6px] rounded-full px-3 py-[7px] text-[0.75rem] font-semibold ${
        active
          ? 'bg-m-act text-m-actfg'
          : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink'
      } ${className}`}
    >
      {children}
    </button>
  )
}
