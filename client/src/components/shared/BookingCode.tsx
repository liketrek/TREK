import { useState, type InputHTMLAttributes, type ReactNode, type Ref } from 'react'
import { useBlurBookingCodes } from '../../hooks/useBlurBookingCodes'

/**
 * The "Blur booking codes" preference (blur_booking_codes) keeps confirmation
 * codes unreadable to anyone looking at the screen until the user reaches for
 * them. The pieces here carry it to every place that shows or edits a code, so
 * a new surface gets the same look and the same way of revealing a code
 * without reading the setting on its own.
 */

// The strength the code boxes in the bookings tabs and the day sheet use.
const BLUR_CLS = 'blur-[4px] select-none'

const joinCls = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ')

type BookingCodeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  ref?: Ref<HTMLInputElement>
}

/**
 * The text field of a form that edits a booking code. While the preference is
 * on, a filled field stays blurred until the pointer rests on it or it gets
 * focus, so the code is still there to read and change the moment the user
 * clicks, taps or tabs into it. An empty field keeps its placeholder readable.
 *
 * Only a class is added: the value, the handlers and the ref pass through
 * untouched, so what gets saved is exactly what was typed, and there is no
 * wrapper to upset the grid and flex rows the field sits in. It stays a text
 * field on purpose; a password field would bring the browser's password
 * manager and a different phone keyboard with it.
 */
export function BookingCodeInput({ className, ...props }: BookingCodeInputProps) {
  const blur = useBlurBookingCodes()
  const hidden = blur && props.value != null && props.value !== ''
  return (
    <input
      type="text"
      {...props}
      className={hidden
        ? joinCls(className, 'blur-[4px] transition-[filter] duration-200 hover:blur-none focus:blur-none')
        : className}
    />
  )
}

/**
 * A booking code shown as text. With the preference off it renders the code
 * and nothing around it, so the markup of the surface stays what it was.
 *
 * With the preference on, the code becomes a small toggle that lifts on hover
 * and on click, Enter or Space, like the codes in the bookings list. Inside a
 * row that is a button itself a second button is not allowed, so
 * `interactive={false}` gives a plain blurred span there; the booking the row
 * opens is where that code can be read.
 */
export function BlurredCode({ children, interactive = true, className }: {
  children: ReactNode
  interactive?: boolean
  className?: string
}) {
  const blur = useBlurBookingCodes()
  const [revealed, setRevealed] = useState(false)
  if (!blur) return <>{children}</>
  if (!interactive) return <span className={joinCls(className, BLUR_CLS)}>{children}</span>
  return (
    <button
      type="button"
      aria-pressed={revealed}
      // The code often sits on a strip that opens its booking on a click or on
      // Enter; revealing the code must not open the editor as well.
      onClick={e => { e.stopPropagation(); setRevealed(v => !v) }}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation() }}
      className={joinCls(className, 'cursor-pointer', !revealed && `${BLUR_CLS} hover:blur-none`)}
    >
      {children}
    </button>
  )
}
