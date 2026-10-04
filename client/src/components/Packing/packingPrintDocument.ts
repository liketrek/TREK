import { escapeHtml } from '@trek/shared'
import type { PackingItem } from '../../types'
import { formatWeight, packingItemWeight } from '../../mobile/screens/trip/tabs/listsModel'
import { katColor } from './packingListPanel.helpers'
import { groupByCategory, type PackingBagInfo, type PackingBagLookup } from './packingExport'

/*
 * The packing list as a standalone page to print or save as PDF (#1420). Like the trip
 * PDF it is a document of its own in a srcdoc frame, where the app's CSS variables do
 * not reach, so its colours are written out here (the theme lint exempts this file).
 */

export interface PackingPrintText {
  /** "Packing List · Shared": what the page is, above the title. */
  eyebrow: string
  /** The trip's title, or the list's name when the trip has none. */
  title: string
  /** The trip's dates, already formatted for the reader. */
  dates: string | null
  itemsLabel: string
  packedLabel: string
  weightLabel: string
  bagsLabel: string
  uncategorized: string
  lang: string
  /** Where the logos are served from; the page is a srcdoc and has no URL of its own. */
  origin: string
  /** The app's own @font-face rules, so the page prints in Poppins without asking a font CDN. */
  fontCss: string
}

// A bag colour lands in a style attribute, so only a plain hex colour gets there.
const HEX_COLOR = /^#(?:[0-9a-f]{3}){1,2}$/i
const BAG_FALLBACK = '#94a3b8'
const bagColor = (info: PackingBagInfo): string =>
  info.color && HEX_COLOR.test(info.color) ? info.color : BAG_FALLBACK

const CHECK_SVG =
  '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.6 6.3 5 8.6 9.5 3.7" fill="none" stroke="#fff" '
  + 'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>'

// The look of the trip PDF: Poppins, a navy cover block, small spaced capitals for labels,
// slate greys. Colour is kept for print on purpose, the categories are told apart by it.
const PRINT_CSS = `
@page { size: A4; margin: 12mm; }
*, *::before, *::after { box-sizing: border-box; }
html { background: #fff; }
body { margin: 0; color: #1e293b; font: 9.5pt/1.4 'Poppins', -apple-system, 'Segoe UI', Roboto, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
@media screen {
  html { background: #e2e8f0; }
  body { padding: 28px 16px; }
  .sheet { max-width: 794px; margin: 0 auto; padding: 12mm; background: #fff; border-radius: 6px; box-shadow: 0 12px 40px rgba(15, 23, 42, 0.16); }
}
.hero { margin-bottom: 18px; padding: 22px 26px 20px; border-radius: 14px; background: #0f172a; color: #fff; break-inside: avoid; }
.hero-top { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.eyebrow { font-size: 7.5pt; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: rgba(255, 255, 255, 0.5); }
.hero-top img { height: 18px; opacity: 0.6; }
h1 { margin: 0; font-size: 24pt; font-weight: 700; line-height: 1.1; letter-spacing: -0.01em; }
.dates { margin-top: 6px; font-size: 9pt; color: rgba(255, 255, 255, 0.55); }
.stats { display: flex; gap: 30px; margin-top: 18px; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.1); }
.stat b { display: block; font-size: 16pt; font-weight: 700; line-height: 1; }
.stat span { display: block; margin-top: 5px; font-size: 6.5pt; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: rgba(255, 255, 255, 0.45); }
.progress { height: 4px; margin-top: 16px; overflow: hidden; border-radius: 99px; background: rgba(255, 255, 255, 0.12); }
.progress i { display: block; height: 100%; border-radius: 99px; background: #fff; }
main { columns: 2; column-gap: 14px; }
.cat { margin: 0 0 14px; padding: 10px 12px 6px; border: 1px solid #e2e8f0; border-radius: 12px; break-inside: avoid; }
.cat h2 { display: flex; align-items: center; gap: 7px; margin: 0 0 4px; font-size: 7.5pt; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #0f172a; }
.cat h2 i { flex: none; width: 7px; height: 7px; border-radius: 50%; background: var(--c); }
.cat h2 span { flex: 1; min-width: 0; }
.cat h2 em { padding: 1px 7px; border-radius: 99px; background: #f1f5f9; color: #64748b; font-size: 7pt; font-style: normal; font-weight: 600; letter-spacing: 0; }
ul { margin: 0; padding: 0; list-style: none; }
li { display: flex; align-items: center; gap: 7px; padding: 5px 0; border-top: 1px solid #f1f5f9; break-inside: avoid; }
li:first-child { border-top: 0; }
.box { display: flex; flex: none; align-items: center; justify-content: center; width: 13px; height: 13px; border: 1.5px solid #cbd5e1; border-radius: 4px; }
li.done .box { border-color: #0f172a; background: #0f172a; }
.box svg { width: 9px; height: 9px; }
.name { flex: 1; min-width: 0; font-weight: 500; }
li.done .name { color: #94a3b8; text-decoration: line-through; }
.qty { flex: none; padding: 1px 6px; border-radius: 99px; background: #f1f5f9; color: #475569; font-size: 7pt; font-weight: 600; }
.weight { flex: none; color: #64748b; font-size: 7.5pt; font-variant-numeric: tabular-nums; }
.bag { display: inline-flex; flex: none; align-items: center; gap: 4px; color: #64748b; font-size: 7pt; }
.bag i, .bag-card i { flex: none; width: 6px; height: 6px; border-radius: 50%; }
.bags { margin-top: 4px; break-inside: avoid; }
.bags h3 { margin: 0 0 8px; font-size: 7.5pt; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #64748b; }
.bag-list { display: flex; flex-wrap: wrap; gap: 8px; }
.bag-card { display: flex; align-items: center; gap: 7px; padding: 7px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 8pt; }
.bag-card span { color: #64748b; }
footer { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 22px; opacity: 0.35; color: #64748b; font-size: 6.5pt; letter-spacing: 0.5px; }
footer img { height: 9px; }
@media screen and (max-width: 560px) {
  body { padding: 12px 8px; }
  .sheet { padding: 16px; }
  .hero { padding: 18px 18px 16px; }
  h1 { font-size: 18pt; }
  .stats { flex-wrap: wrap; gap: 14px 22px; }
  main { columns: 1; }
}
`

interface BagSummary {
  info: PackingBagInfo
  count: number
  grams: number
}

/** The bags this view's items go into, in the order they first appear, with this view's share of them. */
function bagSummaries(items: PackingItem[], bag: PackingBagLookup): BagSummary[] {
  const byId = new Map<number, BagSummary>()
  for (const item of items) {
    const info = item.bag_id != null ? bag(item.bag_id) : undefined
    if (!info || item.bag_id == null) continue
    const summary = byId.get(item.bag_id) ?? { info, count: 0, grams: 0 }
    summary.count += 1
    summary.grams += packingItemWeight(item)
    byId.set(item.bag_id, summary)
  }
  return [...byId.values()]
}

function itemRow(item: PackingItem, bag: PackingBagLookup): string {
  const info = item.bag_id != null ? bag(item.bag_id) : undefined
  const quantity = (item.quantity ?? 1) > 1 ? `<span class="qty">×${item.quantity}</span>` : ''
  const weight = item.weight_grams ? `<span class="weight">${escapeHtml(formatWeight(packingItemWeight(item)))}</span>` : ''
  const bagPill = info ? `<span class="bag"><i style="background:${bagColor(info)}"></i>${escapeHtml(info.name)}</span>` : ''
  return `<li${item.checked ? ' class="done"' : ''}><span class="box">${item.checked ? CHECK_SVG : ''}</span>`
    + `<span class="name">${escapeHtml(item.name)}</span>${quantity}${weight}${bagPill}</li>`
}

/**
 * The list as a page to print or save as PDF, in the look of the trip PDF: a navy cover
 * block with the trip, its dates and the list's numbers, then one card per category in
 * two columns, each item with a box to tick on paper. A category card never breaks across
 * a column or a page, and the bags close the page with what each one holds.
 */
export function packingPrintHtml(items: PackingItem[], text: PackingPrintText, bag: PackingBagLookup): string {
  const groups = groupByCategory(items, text.uncategorized)
  const categories = groups.map(group => group.category)
  const packed = items.filter(item => item.checked).length
  const percent = items.length ? Math.round((packed / items.length) * 100) : 0
  const total = items.reduce((sum, item) => sum + packingItemWeight(item), 0)
  const bags = bagSummaries(items, bag)

  const stat = (value: string, label: string) =>
    `<div class="stat"><b>${escapeHtml(value)}</b><span>${escapeHtml(label)}</span></div>`
  const stats = [
    stat(String(items.length), text.itemsLabel),
    stat(`${packed}/${items.length}`, text.packedLabel),
    total > 0 ? stat(formatWeight(total), text.weightLabel) : '',
    bags.length ? stat(String(bags.length), text.bagsLabel) : '',
  ].join('')

  const sections = groups.map(group => {
    const done = group.items.filter(item => item.checked).length
    return `<section class="cat" style="--c:${katColor(group.category, categories)}">`
      + `<h2><i></i><span>${escapeHtml(group.category)}</span><em>${done}/${group.items.length}</em></h2>`
      + `<ul>${group.items.map(item => itemRow(item, bag)).join('')}</ul></section>`
  }).join('')

  const bagCards = bags.map(summary =>
    `<div class="bag-card"><i style="background:${bagColor(summary.info)}"></i><b>${escapeHtml(summary.info.name)}</b>`
    + `<span>${summary.count} · ${escapeHtml(formatWeight(summary.grams))}</span></div>`).join('')
  const bagsHtml = bags.length
    ? `<div class="bags"><h3>${escapeHtml(text.bagsLabel)}</h3><div class="bag-list">${bagCards}</div></div>`
    : ''

  const origin = escapeHtml(text.origin)
  return `<!doctype html><html lang="${escapeHtml(text.lang)}"><head><meta charset="utf-8"><title>${escapeHtml(text.title)}</title>
<style>${text.fontCss}${PRINT_CSS}</style></head><body><div class="sheet">
<header class="hero">
<div class="hero-top"><span class="eyebrow">${escapeHtml(text.eyebrow)}</span><img src="${origin}/logo-light.svg" alt="TREK"></div>
<h1>${escapeHtml(text.title)}</h1>
${text.dates ? `<div class="dates">${escapeHtml(text.dates)}</div>` : ''}
<div class="stats">${stats}</div>
<div class="progress"><i style="width:${percent}%"></i></div>
</header>
<main>${sections}</main>
${bagsHtml}
<footer><span>made with</span><img src="${origin}/logo-dark.svg" alt="TREK"></footer>
</div></body></html>`
}

