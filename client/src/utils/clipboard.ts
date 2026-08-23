/**
 * Copying a link to the clipboard.
 *
 * `navigator.clipboard` is gated on a secure context, so on a plain-HTTP
 * self-host — which is how a good part of TREK is deployed — it is simply
 * undefined and reading `.writeText` off it throws. Every copy button has to
 * carry the deprecated textarea + execCommand path as a fallback, so it lives
 * here once instead of in each of them.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    try {
      ta.focus()
      ta.select()
      document.execCommand('copy')
    } finally {
      document.body.removeChild(ta)
    }
    // execCommand reports false for a refused copy in some browsers and true in
    // others that did nothing, so it is not worth reading: a true here means
    // nothing objected, not that the clipboard definitely changed.
    return true
  } catch {
    return false
  }
}
