import { ReactNode } from 'react'

interface MFabProps {
  onClick?: () => void
  ariaLabel: string
  className?: string
  children: ReactNode
}

/** 56px round action button on the --m-act surface (bottom-nav "+", screen FABs). */
export default function MFab({ onClick, ariaLabel, className = '', children }: MFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`flex h-14 w-14 flex-none items-center justify-center rounded-full bg-m-act text-m-actfg shadow-[0_8px_20px_-6px_rgba(0,0,0,.4)] ${className}`}
    >
      {children}
    </button>
  )
}
