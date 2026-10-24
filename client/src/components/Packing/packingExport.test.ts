// FE-PACKEXPORT-001 to FE-PACKEXPORT-011
import { describe, expect, it } from 'vitest'
import type { PackingItem } from '../../types'
import { groupByCategory, packingCsv, packingFileName, packingMarkdown, type PackingBagLookup } from './packingExport'
import { packingPrintHtml, type PackingPrintText } from './packingPrintDocument'
import { parseImportLines } from './packingListPanel.helpers'
import { KAT_COLORS } from './packingListPanel.constants'

let nextId = 1
const item = (over: Partial<PackingItem>): PackingItem => ({
  id: nextId++, trip_id: 1, name: 'Item', checked: 0, category: 'Other', sort_order: 0,
  weight_grams: null, bag_id: null, quantity: 1, is_private: 0, ...over,
})

const LIST: PackingItem[] = [
  item({ name: 'Passport', category: 'Documents', checked: 1, weight_grams: 40, bag_id: 2 }),
  item({ name: 'T-Shirts', category: 'Clothing', quantity: 5, weight_grams: 180, bag_id: 1 }),
  item({ name: 'Boarding passes', category: 'Documents' }),
  item({ name: 'Phone charger (USB-C)', category: 'Electronics', weight_grams: 90, bag_id: 2 }),
  item({ name: 'Sunglasses', category: null }),
]

const BAGS: Record<number, { name: string; color: string }> = {
  1: { name: 'Suitcase', color: '#f97316' },
  2: { name: 'Backpack', color: '#6366f1' },
}
const bag: PackingBagLookup = id => BAGS[id]
const noBag: PackingBagLookup = () => undefined

const TEXT: PackingPrintText = {
  eyebrow: 'Packing List · Shared', title: 'Lisbon & Porto', dates: 'Oct 9 – 16, 2026',
  itemsLabel: 'Items', packedLabel: 'Packed', weightLabel: 'Total weight', bagsLabel: 'Bags',
  uncategorized: 'Other', lang: 'en', origin: 'https://trek.example', fontCss: '@font-face{font-family:Poppins}',
}

describe('groupByCategory', () => {
  it('FE-PACKEXPORT-001: keeps list order, groups by category and files a blank one under the fallback', () => {
    expect(groupByCategory(LIST, 'Other').map(g => [g.category, g.items.map(i => i.name)])).toEqual([
      ['Documents', ['Passport', 'Boarding passes']],
      ['Clothing', ['T-Shirts']],
      ['Electronics', ['Phone charger (USB-C)']],
      ['Other', ['Sunglasses']],
    ])
  })
})

describe('packingFileName', () => {
  it('FE-PACKEXPORT-002: builds a short ascii slug from the trip title, and a plain name without one', () => {
    expect(packingFileName('Lisbon & Porto 2026!', '.md')).toBe('packing-list-lisbon-porto-2026.md')
    expect(packingFileName(undefined, '.csv')).toBe('packing-list.csv')
    expect(packingFileName('東京', '.csv')).toBe('packing-list.csv')
  })
})

describe('packingMarkdown', () => {
  it('FE-PACKEXPORT-003: writes a checklist with a heading per category, quantities and weights per piece', () => {
    expect(packingMarkdown(LIST, 'Packing List: Lisbon & Porto (Shared)', 'Other')).toBe([
      '# Packing List: Lisbon & Porto (Shared)',
      '',
      '## Documents',
      '',
      '- [x] Passport (40 g)',
      '- [ ] Boarding passes',
      '',
      '## Clothing',
      '',
      '- [ ] 5 × T-Shirts (180 g)',
      '',
      '## Electronics',
      '',
      '- [ ] Phone charger (USB-C) (90 g)',
      '',
      '## Other',
      '',
      '- [ ] Sunglasses',
      '',
    ].join('\n'))
  })

  it('FE-PACKEXPORT-004: comes back through the import with the same categories, quantities, weights and checkmarks', () => {
    const back = parseImportLines(packingMarkdown(LIST, 'Packing List', 'Other'))
    expect(back.map(r => [r.category, r.name, r.quantity ?? 1, r.weight_grams ?? null, r.checked])).toEqual([
      ['Documents', 'Passport', 1, '40', true],
      ['Documents', 'Boarding passes', 1, null, false],
      ['Clothing', 'T-Shirts', 5, '180', false],
      ['Electronics', 'Phone charger (USB-C)', 1, '90', false],
      ['Other', 'Sunglasses', 1, null, false],
    ])
  })
})

describe('packingCsv', () => {
  it('FE-PACKEXPORT-005: writes the import format with bag names and no header row', () => {
    expect(packingCsv(LIST, bag)).toBe([
      'Documents,Passport,40,Backpack,checked',
      'Clothing,5 × T-Shirts,180,Suitcase,',
      'Documents,Boarding passes,,,',
      'Electronics,Phone charger (USB-C),90,Backpack,',
      ',Sunglasses,,,',
      '',
    ].join('\n'))
  })

  it('FE-PACKEXPORT-006: quotes a field with a separator or a quote, and the import reads it back unchanged', () => {
    const tricky = [item({ name: '12" tray, round', category: 'Kitchen; camping', bag_id: 9, quantity: 2 })]
    const csv = packingCsv(tricky, () => ({ name: 'Box "A"' }))
    expect(csv).toBe('"Kitchen; camping","2 × 12"" tray, round",,"Box ""A""",\n')
    expect(parseImportLines(csv)[0]).toMatchObject({ category: 'Kitchen; camping', name: '12" tray, round', quantity: 2, bag: 'Box "A"', checked: false })
  })

  it('FE-PACKEXPORT-007: leaves the bag empty when it is unknown', () => {
    expect(packingCsv([LIST[0]], noBag)).toBe('Documents,Passport,40,,checked\n')
  })
})

describe('packingPrintHtml', () => {
  const html = packingPrintHtml(LIST, TEXT, bag)

  it('FE-PACKEXPORT-008: carries the trip, its dates and the numbers of the list in the cover block', () => {
    expect(html).toContain('<h1>Lisbon &amp; Porto</h1>')
    expect(html).toContain('Oct 9 – 16, 2026')
    expect(html).toContain('<b>5</b><span>Items</span>')
    expect(html).toContain('<b>1/5</b><span>Packed</span>')
    expect(html).toContain('<b>1.0 kg</b><span>Total weight</span>')
    expect(html).toContain('<b>2</b><span>Bags</span>')
    expect(html).toContain('style="width:20%"')
    expect(html).toContain('https://trek.example/logo-light.svg')
    expect(html).toContain('@font-face{font-family:Poppins}')
  })

  it('FE-PACKEXPORT-009: draws a card per category in the app’s colours, with quantity, weight and bag per item', () => {
    expect(html).toContain(`style="--c:${KAT_COLORS[0]}"`)
    expect(html).toContain('<em>1/2</em>')
    expect(html).toMatch(/<li class="done"><span class="box"><svg[^]*?<\/svg><\/span><span class="name">Passport<\/span>/)
    expect(html).toContain('<span class="qty">×5</span><span class="weight">900 g</span>')
    expect(html).toContain('<i style="background:#f97316"></i>Suitcase')
    expect(html).toContain('<b>Backpack</b><span>2 · 130 g</span>')
  })

  it('FE-PACKEXPORT-010: escapes every text and lets only a plain hex colour into a style', () => {
    const hostile = packingPrintHtml(
      [item({ name: '<img src=x onerror=alert(1)>', category: '<b>Cat</b>', bag_id: 1 })],
      { ...TEXT, title: '<script>x</script>', dates: null },
      () => ({ name: '<i>Bag</i>', color: 'red;background:url(//evil)' }),
    )
    expect(hostile).not.toContain('<img src=x')
    expect(hostile).not.toContain('<script>x')
    expect(hostile).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(hostile).not.toContain('evil')
    expect(hostile).toContain('background:#94a3b8')
    expect(hostile).not.toContain('class="dates"')
  })

  it('FE-PACKEXPORT-011: leaves out weight and bags where the list has none', () => {
    const bare = packingPrintHtml([item({ name: 'Hat' })], TEXT, noBag)
    expect(bare).not.toContain('Total weight')
    expect(bare).not.toContain('class="bags"')
    expect(bare).toContain('<b>0/1</b><span>Packed</span>')
    expect(bare).toContain('style="width:0%"')
  })
})
