import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

/**
 * Keyboard focus for the app's dialogs (#1302): the first Tab lands in the dialog
 * instead of running through the page behind it, Tab wraps around inside it, and
 * on a desktop the first text field is ready to type into.
 *
 * Fields that open a list as soon as they get the focus (an address or airport
 * search) carry role="combobox" and are skipped, so a dialog never opens with a
 * dropdown already hanging off it. A field can opt out with data-no-autofocus.
 */
const TEXT_FIELD = [
  'input:not([type]),input[type="text"],input[type="search"],input[type="email"],input[type="url"],input[type="tel"],input[type="number"],input[type="password"]',
  'textarea',
].join(',')

const TABBABLE = [
  'a[href]', 'button', 'input:not([type="hidden"])', 'select', 'textarea',
  '[tabindex]', '[contenteditable="true"]',
].join(',')

function usable(el: HTMLElement): boolean {
  if ((el as HTMLInputElement).disabled) return false
  if (el.closest('[hidden],[aria-hidden="true"],[inert]')) return false
  return el.getAttribute('tabindex') !== '-1'
}

/** The first field a user would type into, or null when the dialog has none. */
export function firstTextField(panel: HTMLElement): HTMLElement | null {
  for (const el of panel.querySelectorAll<HTMLElement>(TEXT_FIELD)) {
    if (!usable(el)) continue
    if ((el as HTMLInputElement).readOnly) continue
    if (el.getAttribute('role') === 'combobox' || el.hasAttribute('aria-haspopup') || el.hasAttribute('data-no-autofocus')) continue
    return el
  }
  return null
}

/** Only with a mouse or trackpad: on a phone a focused field would throw the keyboard up. */
function typingDevice(): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(max-width: 767px)').matches
}

/**
 * Puts the focus into a dialog that just opened, unless something inside already
 * took it (a field with autoFocus, a dialog's own choice). The panel itself is
 * the fallback, so the next Tab starts inside the dialog either way.
 */
export function focusDialog(panel: HTMLElement): void {
  if (panel.contains(document.activeElement)) return
  const field = typingDevice() ? firstTextField(panel) : null
  ;(field ?? panel).focus({ preventScroll: true })
}

/**
 * Keeps Tab inside the dialog: past the last control it wraps to the first, and
 * Shift+Tab from the first (or from the panel) to the last. A key pressed in a
 * picker list the dialog opened in a portal on the body is left alone, because
 * that list is not inside the panel and handles its own keys.
 */
export function trapTab(e: ReactKeyboardEvent<HTMLElement>, panel: HTMLElement): void {
  if (e.key !== 'Tab' || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
  const target = e.target as Node
  if (target !== panel && !panel.contains(target)) return
  const items = Array.from(panel.querySelectorAll<HTMLElement>(TABBABLE)).filter(usable)
  if (items.length === 0) {
    e.preventDefault()
    panel.focus({ preventScroll: true })
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  if (e.shiftKey && (target === first || target === panel)) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && target === last) {
    e.preventDefault()
    first.focus()
  }
}
