import { KAT_COLORS } from './packingListPanel.constants'

// Stable color assignment: category name → index via simple hash
export function katColor(kat: string, allCategories?: string[]): string {
  const idx = allCategories ? allCategories.indexOf(kat) : -1
  if (idx >= 0) return KAT_COLORS[idx % KAT_COLORS.length]
  // Fallback: hash-based
  let h = 0
  for (let i = 0; i < kat.length; i++) h = ((h << 5) - h + (kat.codePointAt(i) ?? 0)) | 0
  return KAT_COLORS[Math.abs(h) % KAT_COLORS.length]
}

/** Weight an item contributes to a total: unit weight times quantity (defaults: 0 g, qty 1). */
export const itemWeight = (i: { weight_grams?: number | null; quantity?: number | null }): number =>
  (i.weight_grams || 0) * (i.quantity || 1)

/**
 * Whether an item's weight is part of what *you* carry. An item shared through the
 * "Shared with…" tier stays visible to its recipients, but the owner is the one bringing
 * it — counting it for everyone it was shared with inflated their bags (#1767).
 * Common items are the group pool and always count; so does anything unowned (legacy
 * rows) and everything, if we don't know who is looking.
 */
export const countsTowardsMyLoad = (
  i: { is_private?: number | boolean | null; owner_id?: number | null },
  currentUserId?: number | null,
): boolean => {
  if (currentUserId == null) return true
  if (!i.is_private) return true
  return i.owner_id == null || i.owner_id === currentUserId
}

/**
 * What a bag weighs, as shown (#2191).
 *
 * The server sums every member's items — including the private ones this viewer
 * may not see — and sends the figure on the bag itself. Adding it up locally
 * could only ever produce the part of the bag the viewer is allowed to look at,
 * which is the wrong number to measure against an airline's weight limit.
 *
 * The local sum is the fallback in two cases: a bag that reached the client
 * without the field (a row cached before #2191), and `serverFresh === false`,
 * which the surfaces pass while offline — bags have no repo and no Dexie table,
 * so their totals are frozen at the last online read and blind to whatever the
 * mutation queue is holding. A stale absolute number measured against an
 * airline limit is worse than an honest partial one.
 *
 * Note the explicit null check rather than `??` on a falsy value: an empty bag
 * legitimately weighs 0 and must not fall through to the local sum.
 */
export const bagTotalWeight = (
  bag: { total_weight_grams?: number | null },
  visibleItems: { weight_grams?: number | null; quantity?: number | null }[],
  serverFresh = true,
): number =>
  serverFresh && bag.total_weight_grams != null
    ? bag.total_weight_grams
    : visibleItems.reduce((sum, i) => sum + itemWeight(i), 0)

/** The same rule for the pile that is in no bag (#2191). */
export const unassignedTotalWeight = (
  serverTotal: number | null | undefined,
  visibleItems: { weight_grams?: number | null; quantity?: number | null }[],
  serverFresh = true,
): number =>
  serverFresh && serverTotal != null
    ? serverTotal
    : visibleItems.reduce((sum, i) => sum + itemWeight(i), 0)

/**
 * How full a bag's bar reads. A bag with a weight limit is measured against that limit —
 * that is the number an airline cares about. Without one there is nothing absolute to
 * measure against, so bags are shown relative to the heaviest one and stay comparable.
 * Lives here because three surfaces draw this bar and one of them used to forget the limit.
 */
export const bagFillPct = (bagWeight: number, limitGrams: number | null | undefined, heaviestBagWeight: number): number =>
  Math.min(100, Math.round((bagWeight / (limitGrams || Math.max(heaviestBagWeight, 1))) * 100))

// Parse CSV line respecting quoted values (e.g. "Shirt, blue" stays as one field).
// A doubled quote inside a quoted field is a literal one, which is how the CSV
// export writes a name that contains a quote.
export const parseCsvLine = (line: string): string[] => {
  const parts: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"' && inQuotes && line[i + 1] === '"') { current += '"'; i++; continue }
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if (!inQuotes && (ch === ',' || ch === ';' || ch === '\t')) { parts.push(current.trim()); current = ''; continue }
    current += ch
  }
  parts.push(current.trim())
  return parts
}

export interface ParsedImportItem {
  name: string
  category: string | undefined
  weight_grams: string | undefined
  bag: string | undefined
  checked: boolean
  /** From a leading "3x" or "3 ×" on the name. Absent means one. */
  quantity?: number
}

// "3x Socks", "3 x Socks", "3 × Socks". The space after the x is required, so
// "4x4 adapter" stays a name.
const QUANTITY_PREFIX = /^(\d{1,3})\s*[x×]\s+(\S.*)$/i

/** A name with its quantity prefix split off, the same way for CSV rows and Markdown items. */
export const splitQuantity = (raw: string): { name: string; quantity?: number } => {
  const match = QUANTITY_PREFIX.exec(raw.trim())
  const quantity = match ? Number(match[1]) : 0
  return match && quantity >= 1 ? { name: match[2].trim(), quantity } : { name: raw.trim() }
}

const MD_HEADING = /^#{1,6}\s+(\S.*)$/
const MD_ITEM = /^(?:[-*+]|\d+[.)])\s+(?:\[([ xX])\]\s+)?(\S.*)$/
// The weight the Markdown export writes after a name: "(200 g)" or "(1.2 kg)".
// Only a parenthesis that holds nothing but a weight counts, so "Charger (USB-C)"
// keeps its name.
const MD_WEIGHT = /\((\d+(?:[.,]\d+)?)\s?(g|kg)\)$/i

/** Links, emphasis and code marks as plain text: a list copied from a notes app is full of them. */
const plainMarkdown = (text: string): string =>
  text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*|__|~~|`/g, '').trim()

/**
 * Whether pasted text is a Markdown list rather than CSV rows (#875): any heading or
 * list item decides it, the way Obsidian, Notion, GitHub and most notes apps export.
 */
export const isMarkdownList = (text: string): boolean =>
  text.split('\n').some(line => MD_HEADING.test(line.trim()) || MD_ITEM.test(line.trim()))

/**
 * A Markdown list as import rows. Every heading names the category of the items
 * under it, "- [x]" marks an item packed, and anything that is neither heading nor
 * list item (a note, a blank line, a rule) is left out.
 */
const parseMarkdownLines = (text: string): ParsedImportItem[] => {
  const out: ParsedImportItem[] = []
  let category: string | undefined
  for (const line of text.split('\n').map(l => l.trim())) {
    const heading = MD_HEADING.exec(line)
    if (heading) {
      // A closing run of hashes ("## Clothing ##") is decoration, not part of the name.
      category = plainMarkdown(heading[1].replace(/\s#+$/, '')) || undefined
      continue
    }
    const item = MD_ITEM.exec(line)
    // "- [ ]" with nothing after it is an empty checkbox, not an item called "[ ]".
    if (!item || /^\[[ xX]\]$/.test(item[2])) continue
    let label = plainMarkdown(item[2])
    let weight_grams: string | undefined
    const weight = MD_WEIGHT.exec(label)
    if (weight) {
      const grams = Number(weight[1].replace(',', '.')) * (weight[2].toLowerCase() === 'kg' ? 1000 : 1)
      weight_grams = String(Math.round(grams))
      label = label.slice(0, weight.index).trim()
    }
    out.push({ ...splitQuantity(label), category, weight_grams, bag: undefined, checked: item[1]?.toLowerCase() === 'x' })
  }
  return out.filter(i => i.name)
}

export const parseImportLines = (text: string): ParsedImportItem[] => {
  if (isMarkdownList(text)) return parseMarkdownLines(text)
  return text.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    // Format: Category, Name, Weight (optional), Bag (optional), checked/unchecked (optional)
    const parts = parseCsvLine(line)
    if (parts.length >= 2) {
      const category = parts[0]
      const weight_grams = parts[2] || undefined
      const bag = parts[3] || undefined
      const checked = parts[4]?.toLowerCase() === 'checked' || parts[4] === '1'
      return { ...splitQuantity(parts[1]), category, weight_grams, bag, checked }
    }
    // Single value = just a name
    return { ...splitQuantity(parts[0]), category: undefined, weight_grams: undefined, bag: undefined, checked: false }
  }).filter(i => i.name)
}
