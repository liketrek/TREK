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
