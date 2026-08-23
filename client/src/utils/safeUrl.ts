import { placeWebsiteSchema } from '@trek/shared'

/**
 * Allow-list a URL before handing it to window.open.
 *
 * A place's website is a plain string in the older contracts, and it reaches
 * window.open from the inspector, both sidebar context menus and the mobile
 * place sheet. `window.open('javascript:…')` does not open a page — it evaluates
 * the script in a fresh document that inherits this origin, so a co-traveller
 * with place_edit could plant one and wait for someone to click Website.
 *
 * Server-side validation closes the write path. This closes the read path, which
 * is what covers rows written before that validation existed and instances that
 * have not updated yet — the same split as safeHexColor.
 */
export function safeHttpUrl(value: string | null | undefined): string | null {
  return typeof value === 'string' && placeWebsiteSchema.safeParse(value).success ? value : null
}

/**
 * A user-pasted link, made safe for an href without narrowing what people are
 * allowed to paste.
 *
 * Different job from safeHttpUrl above. That one guards fields whose contract
 * really is http(s)-only and capped. A booking url is deliberately free-form -
 * shared's reservationUrlSchema says so in as many words, because people paste
 * bare hosts and very long provider deep links - so holding it to the stricter
 * contract would turn a link somebody saved last year into dead text.
 *
 * Only the schemes that execute in this origin are refused. A value with no
 * scheme gets https://, which is what an address bar does with the same input;
 * without it the browser would resolve "www.hotel.com" against the current page
 * and navigate inside the app.
 */
export function safeExternalHref(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  // Browsers strip control characters before they resolve a scheme, so the test
  // has to run against the same string they will see.
  const collapsed = Array.from(trimmed).filter(c => c > ' ').join('')
  if (/^https?:\/\//i.test(collapsed)) return trimmed
  // Any other scheme, executing or merely unexpected, stays unlinked.
  if (/^[a-z][a-z0-9+.-]*:/i.test(collapsed)) return null
  // A bare host gets https://, the way an address bar would take it. Free text
  // does not: "www.hotel.com" is a site somebody meant to link, "call the hotel"
  // is a note, and turning the second into a link is worse than leaving it flat.
  if (/^[^\s/?#]+\.[^\s/?#]+/.test(trimmed)) return `https://${trimmed}`
  return null
}
