/**
 * Whether a booking code is hidden by the "Blur booking codes" setting
 * (blur_booking_codes) at the moment of the call.
 *
 * The surfaces hide a code in one of two ways: the older desktop ones set an
 * inline `filter: blur(...)`, the rest carry a Tailwind `blur-[...]` class. The
 * blur may sit on the element holding the code or on the box right around it,
 * so the element and its two nearest ancestors are checked. A focus variant
 * (`focus:blur-none`) counts as lifted while the element has focus, because
 * that is what the browser would render.
 */
export function isBlurred(el: Element | null): boolean {
  let node: Element | null = el
  for (let depth = 0; node && depth < 3; depth++, node = node.parentElement) {
    const h = node as HTMLElement
    if (h.style?.filter?.includes('blur(')) return true
    const tokens = (typeof h.className === 'string' ? h.className : '').split(/\s+/)
    const blurClass = tokens.some(tk => /^blur(-.+)?$/.test(tk) && tk !== 'blur-none')
    const liftedByFocus = h === document.activeElement
      && tokens.some(tk => /^focus(-visible|-within)?:(blur-none|filter-none)$/.test(tk))
    if (blurClass && !liftedByFocus) return true
  }
  return false
}
