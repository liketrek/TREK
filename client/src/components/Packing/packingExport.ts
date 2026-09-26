import type { PackingItem } from '../../types'

/**
 * A packing list leaving TREK as a file (#875): as Markdown for a notes app, and as
 * CSV in the exact format the import reads. The printable page is its own module,
 * packingPrintDocument.ts, built from the same grouping.
 *
 * Both files follow the order the list shows, so a list that goes out and comes back
 * through the import lands in the same categories, with the same quantities, weights
 * and checkmarks. Markdown carries everything but the bag (bags belong to one trip);
 * CSV carries the bag too.
 */

/** What an export needs to know about a bag: its name, and for the printout its colour. */
export interface PackingBagInfo {
  name: string
  color?: string | null
}
export type PackingBagLookup = (bagId: number) => PackingBagInfo | undefined

export interface PackingCategoryGroup {
  category: string
  items: PackingItem[]
}

/** The items under their category, categories in the order their first item appears. */
export function groupByCategory(items: PackingItem[], uncategorized: string): PackingCategoryGroup[] {
  const groups = new Map<string, PackingItem[]>()
  for (const item of items) {
    const category = item.category?.trim() || uncategorized
    const group = groups.get(category)
    if (group) group.push(item)
    else groups.set(category, [item])
  }
  return [...groups].map(([category, grouped]) => ({ category, items: grouped }))
}

/** "3 × Socks", read back by the import's quantity rule; one is left unsaid. */
const withQuantity = (item: PackingItem): string =>
  (item.quantity ?? 1) > 1 ? `${item.quantity} × ${item.name}` : item.name

/** A file name from the trip title: lowercase, ascii-ish, short. */
export function packingFileName(tripTitle: string | undefined, extension: string): string {
  const slug = (tripTitle || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  return `packing-list${slug ? `-${slug}` : ''}${extension}`
}

/**
 * A Markdown checklist: the title as the one top heading, a second-level heading per
 * category, and a task-list item per entry with its weight per piece in brackets.
 */
export function packingMarkdown(items: PackingItem[], title: string, uncategorized: string): string {
  const lines = [`# ${title}`]
  for (const group of groupByCategory(items, uncategorized)) {
    lines.push('', `## ${group.category}`, '')
    for (const item of group.items) {
      const weight = item.weight_grams ? ` (${item.weight_grams} g)` : ''
      lines.push(`- [${item.checked ? 'x' : ' '}] ${withQuantity(item)}${weight}`)
    }
  }
  return `${lines.join('\n')}\n`
}

/** One CSV field, quoted when it holds a separator or a quote, a quote doubled inside. */
const csvField = (value: string): string => (/[",;\t\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)

/**
 * The import format, one item per row: Category, Name, Weight, Bag, checked. No header
 * row, because the import would read it as an item.
 */
export function packingCsv(items: PackingItem[], bag: PackingBagLookup): string {
  const rows = items.map(item => [
    item.category?.trim() || '',
    withQuantity(item),
    item.weight_grams ? String(item.weight_grams) : '',
    item.bag_id != null ? bag(item.bag_id)?.name ?? '' : '',
    item.checked ? 'checked' : '',
  ].map(csvField).join(','))
  return `${rows.join('\n')}\n`
}
