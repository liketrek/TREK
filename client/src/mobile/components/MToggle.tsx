import { selectionHaptic } from '../../native/haptics'
interface MToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  ariaLabel?: string
  disabled?: boolean
  className?: string
}

/**
 * iOS-style switch: --m-act track when on, --m-trackoff when off, 18px knob. The knob on
 * takes the track's ink (--m-actfg): in the dark scheme the track is near white, and a
 * white knob on it left the whole switch one white pill.
 */
export default function MToggle({ checked, onChange, ariaLabel, disabled = false, className = '' }: MToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        selectionHaptic()
        onChange(!checked)
      }}
      // Width in px like the knob and its travel: w-10 is rem and followed the text size,
      // so a smaller text setting left the knob hanging over the end of the track.
      className={`box-border h-[22px] w-[40px] flex-none rounded-full p-[2px] transition-colors duration-[180ms] disabled:opacity-50 ${
        checked ? 'bg-m-act' : 'bg-[color:var(--m-trackoff)]'
      } ${className}`}
    >
      <span
        className={`block h-[18px] w-[18px] rounded-full transition-transform duration-[180ms] ${
          checked
            ? 'translate-x-[18px] bg-[color:var(--m-actfg)] rtl:-translate-x-[18px]'
            : 'translate-x-0 bg-[color:var(--m-knob)]'
        }`}
      />
    </button>
  )
}
