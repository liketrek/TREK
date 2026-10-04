import { typeToCostCategory } from '@trek/shared'

/**
 * The linked cost an imported booking's parsed price becomes, or null when it has none.
 *
 * The price keeps the currency it was quoted in (#2525). The forms used to send the
 * amount alone, so an imported $801.76 was stored as 801.76 in the trip's own currency
 * while the form had just previewed it in dollars. A currency that is not a three-letter
 * code is left out, which is what the server does with one too, so the preview and the
 * saved cost read the same either way.
 */
export function importedPriceEntry(
  metadata: unknown,
  type: string,
): { total_price: number; category: string; currency?: string } | null {
  const meta = metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : {}
  const price = Number(meta.price)
  if (!Number.isFinite(price) || price <= 0) return null
  const code = typeof meta.priceCurrency === 'string' ? meta.priceCurrency.trim().toUpperCase() : ''
  return {
    total_price: price,
    category: typeToCostCategory(type),
    ...(/^[A-Z]{3}$/.test(code) ? { currency: code } : {}),
  }
}
