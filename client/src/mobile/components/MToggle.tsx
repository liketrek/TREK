interface MToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  ariaLabel?: string
  disabled?: boolean
  className?: string
}

/** iOS-style switch: --m-act track when on, --m-trackoff when off, 18px knob. */
export default function MToggle({ checked, onChange, ariaLabel, disabled = false, className = '' }: MToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`box-border h-[22px] w-10 flex-none rounded-full p-[2px] transition-colors duration-[180ms] disabled:opacity-50 ${
        checked ? 'bg-m-act' : 'bg-[color:var(--m-trackoff)]'
      } ${className}`}
    >
      <span
        className={`block h-[18px] w-[18px] rounded-full bg-[color:var(--m-knob)] transition-transform duration-[180ms] ${
          checked ? 'translate-x-[18px]' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
