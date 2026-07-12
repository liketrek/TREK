import { forwardRef, useRef, type InputHTMLAttributes } from 'react'

export type NumericMode = 'integer' | 'decimal' | 'signed'

const SANITIZERS: Record<NumericMode, (raw: string) => string> = {
  // Digits only — quantities, weights, day counts.
  integer: raw => raw.replace(/[^0-9]/g, ''),
  // Digits plus a decimal separator. Both '.' and ',' pass through; callers already
  // normalize the comma (see CostsPanel.onTotalChange) so a European keypad still works.
  decimal: raw => raw.replace(/[^0-9.,]/g, ''),
  // Signed decimal — coordinates. Keeps a leading '-'.
  signed: raw => {
    const negative = raw.trimStart().startsWith('-')
    const digits = raw.replace(/[^0-9.]/g, '')
    return negative ? `-${digits}` : digits
  },
}

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> & {
  value: string | number | null | undefined
  /** Receives the sanitized raw string. Callers keep their own state and commit logic. */
  onValueChange: (value: string) => void
  mode?: NumericMode
  /** Escape hatch for a field that must not steal the caret (none today). */
  selectOnFocus?: boolean
}

/**
 * A numeric text input that replaces its contents when you type into it.
 *
 * Two things every numeric field in the app needs, and most were getting wrong (#1513):
 *
 *  1. **Select-on-focus.** Tapping a pre-populated field puts the caret at the end, so
 *     the first digit you type is *appended*: a quantity of 1 becomes 16 instead of 6.
 *     Selecting the value on focus makes the first keystroke replace it.
 *
 *     We select twice: synchronously (works everywhere) and again on the next frame,
 *     because WebKit undoes a synchronous select() with its own post-focus caret
 *     placement — without the deferred pass, iOS silently keeps appending.
 *
 *     The deferred pass is guarded. If a keystroke lands inside that one-frame window,
 *     re-selecting would swallow what was just typed: type "4" then "8", the frame
 *     fires and selects "48", and the next character *replaces* both — "48.853" comes
 *     out as ".853". So the first input cancels the pending select and we leave the
 *     caret alone.
 *
 *  2. **type="text" + inputMode**, not type="number". They render the same keypad, but
 *     type="number" also silently mutates the value on scroll-wheel over the field and
 *     ships spinner arrows. (setSelectionRange() also throws InvalidStateError on a
 *     number input — select() happens to be allowed, but the whole class is a trap.)
 *
 * Styling and commit semantics stay with the caller: some fields save on every keystroke,
 * others on blur. This owns only the part that was uniformly broken.
 */
export const NumericInput = forwardRef<HTMLInputElement, Props>(function NumericInput(
  { value, onValueChange, mode = 'integer', selectOnFocus = true, onFocus, inputMode, ...rest },
  ref,
) {
  // Set while a deferred select() is queued; any input in that window cancels it.
  const selectPending = useRef(false)

  return (
    <input
      {...rest}
      ref={ref}
      type="text"
      inputMode={inputMode ?? (mode === 'integer' ? 'numeric' : 'decimal')}
      value={value ?? ''}
      onChange={e => {
        selectPending.current = false
        onValueChange(SANITIZERS[mode](e.target.value))
      }}
      onFocus={e => {
        if (selectOnFocus) {
          const el = e.currentTarget
          el.select()
          selectPending.current = true
          requestAnimationFrame(() => {
            if (selectPending.current && document.activeElement === el) el.select()
            selectPending.current = false
          })
        }
        onFocus?.(e)
      }}
    />
  )
})
