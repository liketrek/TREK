import { ReactNode } from 'react'

interface MChipProps {
  active?: boolean
  onClick?: () => void
  /**
   * `sm` is the 30px chip a form sheet packs six of into a row; `tap` is 38px, for a
   * chip that IS the control rather than a setting beside one. Apple's own floor is
   * 44px and a chip cannot be that and still fit a row of categories, so `tap` buys
   * back what it can: the chips that start a search are the ones worth the height.
   */
  size?: 'sm' | 'tap'
  className?: string
  children: ReactNode
}

/** Small pill chip: --m-act when active, neutral --m-ic surface otherwise. */
export default function MChip({ active = false, onClick, size = 'sm', className = '', children }: MChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex flex-none items-center gap-[6px] rounded-full font-semibold ${
        size === 'tap' ? 'px-[13px] py-[10px] text-[0.8125rem]' : 'px-3 py-[7px] text-[0.75rem]'
      } ${
        active
          ? 'bg-m-act text-m-actfg'
          : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink'
      } ${className}`}
    >
      {children}
    </button>
  )
}
