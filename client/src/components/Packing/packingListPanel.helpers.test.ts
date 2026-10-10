import { describe, it, expect } from 'vitest'
import { katColor, itemWeight, bagFillPct, bagLoadSummary, bagTotalWeight, countsTowardsMyLoad, isMarkdownList, newItemSharing, packedWeight, parseCsvLine, perPersonLoads, parseImportLines, sortItemsByName, unassignedTotalWeight } from './packingListPanel.helpers'
import { buildPackingItem } from '../../../tests/helpers/factories'
import type { PackingBag } from '../../types'
import { KAT_COLORS } from './packingListPanel.constants'

describe('packingListPanel.helpers', () => {
  describe('katColor', () => {
    it('maps a category to its palette slot by index', () => {
      const cats = ['Documents', 'Clothing', 'Toiletries']
      expect(katColor('Documents', cats)).toBe(KAT_COLORS[0])
      expect(katColor('Clothing', cats)).toBe(KAT_COLORS[1])
      expect(katColor('Toiletries', cats)).toBe(KAT_COLORS[2])
    })

    it('cycles the palette when the index exceeds palette length', () => {
      const cats = Array.from({ length: KAT_COLORS.length + 1 }, (_, i) => `cat${i}`)
      expect(katColor(`cat${KAT_COLORS.length}`, cats)).toBe(KAT_COLORS[0])
    })

    it('falls back to a deterministic hash when the category is not in the list', () => {
      const a = katColor('Missing', ['Other'])
      const b = katColor('Missing', ['Other'])
      expect(a).toBe(b)
      expect(KAT_COLORS).toContain(a)
    })

    it('falls back to hash when no category list is provided', () => {
      const color = katColor('Anything')
      expect(KAT_COLORS).toContain(color)
    })
  })

  describe('itemWeight', () => {
    it('multiplies unit weight by quantity', () => {
      expect(itemWeight({ weight_grams: 250, quantity: 3 })).toBe(750)
    })

    it('defaults quantity to 1 and weight to 0', () => {
      expect(itemWeight({ weight_grams: 120 })).toBe(120)
      expect(itemWeight({ quantity: 5 })).toBe(0)
      expect(itemWeight({})).toBe(0)
    })

    it('treats null weight/quantity as their defaults', () => {
      expect(itemWeight({ weight_grams: null, quantity: null })).toBe(0)
      expect(itemWeight({ weight_grams: 100, quantity: null })).toBe(100)
    })
  })

  describe('countsTowardsMyLoad', () => {
    it('counts the common pool for everyone', () => {
      // owner_id is stamped on every item, common ones included — filtering by it alone
      // would shrink the group total to "only what I entered myself".
      expect(countsTowardsMyLoad({ is_private: 0, owner_id: 2 }, 1)).toBe(true)
    })

    it('counts my own private items', () => {
      expect(countsTowardsMyLoad({ is_private: 1, owner_id: 1 }, 1)).toBe(true)
    })

    it('leaves out an item somebody else shared with me', () => {
      expect(countsTowardsMyLoad({ is_private: 1, owner_id: 2 }, 1)).toBe(false)
    })

    it('counts unowned legacy rows', () => {
      expect(countsTowardsMyLoad({ is_private: 1, owner_id: null }, 1)).toBe(true)
    })

    it('filters nothing when the viewer is unknown', () => {
      expect(countsTowardsMyLoad({ is_private: 1, owner_id: 2 }, null)).toBe(true)
      expect(countsTowardsMyLoad({ is_private: 1, owner_id: 2 }, undefined)).toBe(true)
    })
  })

  describe('bagFillPct', () => {
    it('measures against the bag limit when there is one', () => {
      expect(bagFillPct(5000, 20000, 99999)).toBe(25)
      expect(bagFillPct(20000, 20000, 1)).toBe(100)
    })

    it('never reports more than full', () => {
      expect(bagFillPct(30000, 20000, 1)).toBe(100)
    })

    it('falls back to the heaviest bag when no limit is set', () => {
      expect(bagFillPct(2500, null, 5000)).toBe(50)
      expect(bagFillPct(2500, undefined, 5000)).toBe(50)
      expect(bagFillPct(0, 0, 5000)).toBe(0)
    })

    it('does not divide by zero on an empty trip', () => {
      expect(bagFillPct(0, null, 0)).toBe(0)
    })
  })

  describe('parseCsvLine', () => {
    it('splits on comma, semicolon and tab and trims fields', () => {
      expect(parseCsvLine('a, b ;c\td')).toEqual(['a', 'b', 'c', 'd'])
    })

    it('keeps quoted separators inside one field', () => {
      expect(parseCsvLine('Clothing,"Shirt, blue",200')).toEqual(['Clothing', 'Shirt, blue', '200'])
    })

    it('returns the single field for a line without separators', () => {
      expect(parseCsvLine('Passport')).toEqual(['Passport'])
    })
  })

  describe('parseImportLines', () => {
    it('parses a full row into name/category/weight/bag/checked', () => {
      const [row] = parseImportLines('Documents, Passport, 50, Backpack, checked')
      expect(row).toEqual({ name: 'Passport', category: 'Documents', weight_grams: '50', bag: 'Backpack', checked: true })
    })

    it('treats "1" as checked and anything else as unchecked', () => {
      expect(parseImportLines('Cat, A, , , 1')[0].checked).toBe(true)
      expect(parseImportLines('Cat, B, , , nope')[0].checked).toBe(false)
    })

    it('treats a single value as just a name with no category', () => {
      const [row] = parseImportLines('Sunglasses')
      expect(row).toEqual({ name: 'Sunglasses', category: undefined, weight_grams: undefined, bag: undefined, checked: false })
    })

    it('skips blank lines and rows without a name', () => {
      const rows = parseImportLines('Documents, Passport\n\n   \n,')
      expect(rows).toHaveLength(1)
      expect(rows[0].name).toBe('Passport')
    })

    it('reads a leading "3x" as the quantity in CSV rows too, and leaves "4x4 adapter" a name', () => {
      expect(parseImportLines('Clothing, 3x Socks, 40')[0]).toMatchObject({ name: 'Socks', quantity: 3, weight_grams: '40' })
      expect(parseImportLines('Clothing, 2 × T-Shirts')[0]).toMatchObject({ name: 'T-Shirts', quantity: 2 })
      expect(parseImportLines('Car, 4x4 adapter')[0]).toMatchObject({ name: '4x4 adapter' })
      expect(parseImportLines('Car, 4x4 adapter')[0].quantity).toBeUndefined()
    })

    it('keeps a doubled quote inside a quoted field as one quote (#875 CSV export)', () => {
      expect(parseCsvLine('Other,"12"" pizza tray, round",,,')).toEqual(['Other', '12" pizza tray, round', '', '', ''])
    })
  })

  describe('parseImportLines with Markdown (#875)', () => {
    it('recognises a Markdown list by a heading or a list item, and leaves CSV rows alone', () => {
      expect(isMarkdownList('## Clothing\nSocks')).toBe(true)
      expect(isMarkdownList('- [ ] Socks')).toBe(true)
      expect(isMarkdownList('1. Passport')).toBe(true)
      expect(isMarkdownList('Clothing, Socks\nDocuments, Passport')).toBe(false)
    })

    it('takes the category from the heading above, checkmarks from the box, and ignores everything else', () => {
      const rows = parseImportLines([
        '# Packing List: Lisbon (Shared)',
        '',
        'A note that is not an item.',
        '## Clothing ##',
        '- [x] T-Shirts',
        '* [ ] Rain jacket',
        '---',
        '### Documents',
        '1. Passport',
        '+ Boarding pass',
      ].join('\n'))
      expect(rows).toEqual([
        { name: 'T-Shirts', category: 'Clothing', weight_grams: undefined, bag: undefined, checked: true },
        { name: 'Rain jacket', category: 'Clothing', weight_grams: undefined, bag: undefined, checked: false },
        { name: 'Passport', category: 'Documents', weight_grams: undefined, bag: undefined, checked: false },
        { name: 'Boarding pass', category: 'Documents', weight_grams: undefined, bag: undefined, checked: false },
      ])
    })

    it('reads the export’s quantity and weight back, in g or kg, and keeps other brackets in the name', () => {
      const rows = parseImportLines('## Kit\n- [ ] 5 × T-Shirts (180 g)\n- [ ] Tent (1,2 kg)\n- [x] Phone charger (USB-C) (90 g)\n- [ ] Charger (USB-C)')
      expect(rows.map(r => [r.name, r.quantity, r.weight_grams, r.checked])).toEqual([
        ['T-Shirts', 5, '180', false],
        ['Tent', undefined, '1200', false],
        ['Phone charger (USB-C)', undefined, '90', true],
        ['Charger (USB-C)', undefined, undefined, false],
      ])
    })

    it('turns links, emphasis and code marks into plain text, and skips an empty checkbox', () => {
      const rows = parseImportLines('- [ ] **Sun**screen\n- [ ] [Adapter](https://example.com/adapter) `EU`\n- [ ]\n- [x]')
      expect(rows.map(r => r.name)).toEqual(['Sunscreen', 'Adapter EU'])
    })

    it('puts items before the first heading in no category, so the import files them under Other', () => {
      expect(parseImportLines('- Sunglasses\n## Hats\n- Cap').map(r => r.category)).toEqual([undefined, 'Hats'])
    })

    it('stays linear on hostile input', () => {
      const started = performance.now()
      parseImportLines(`#${' '.repeat(50_000)}x\n-${' '.repeat(50_000)}\n- [ ] ${'('.repeat(50_000)}`)
      expect(performance.now() - started).toBeLessThan(500)
    })
  })

  describe('bagTotalWeight / unassignedTotalWeight (#2191)', () => {
    it('prefers the server total over anything summable locally', () => {
      // The whole point: the local list is privacy-filtered, so it can only ever
      // be the part of the bag this viewer is allowed to see.
      expect(bagTotalWeight({ total_weight_grams: 1000 }, [{ weight_grams: 800, quantity: 1 }])).toBe(1000)
    })

    it('keeps a server-reported zero instead of falling back to the local sum', () => {
      // An empty bag really weighs 0; only an ABSENT field means "not told".
      expect(bagTotalWeight({ total_weight_grams: 0 }, [{ weight_grams: 800, quantity: 1 }])).toBe(0)
    })

    it('falls back to the local sum for a bag cached before the field existed', () => {
      expect(bagTotalWeight({}, [{ weight_grams: 250, quantity: 3 }, { weight_grams: 50 }])).toBe(800)
      expect(bagTotalWeight({ total_weight_grams: null }, [{ weight_grams: 120 }])).toBe(120)
    })

    it('applies the same rule to the unassigned pile', () => {
      expect(unassignedTotalWeight(150, [{ weight_grams: 900 }])).toBe(150)
      expect(unassignedTotalWeight(0, [{ weight_grams: 900 }])).toBe(0)
      expect(unassignedTotalWeight(null, [{ weight_grams: 900 }])).toBe(900)
      expect(unassignedTotalWeight(undefined, [])).toBe(0)
    })
  })
  describe('sortItemsByName', () => {
    const names = (items: { name: string }[]) => items.map(i => i.name)

    it('orders by name, ignoring case and accents the way the language does', () => {
      const items = [{ name: 'shirt' }, { name: 'Éponge' }, { name: 'adapter' }, { name: 'Zahnbürste' }, { name: 'Bag' }]
      expect(names(sortItemsByName(items, 'en'))).toEqual(['adapter', 'Bag', 'Éponge', 'shirt', 'Zahnbürste'])
    })

    it('reads numbers as numbers', () => {
      expect(names(sortItemsByName([{ name: 'Shirt 10' }, { name: 'Shirt 2' }], 'en'))).toEqual(['Shirt 2', 'Shirt 10'])
    })

    it('keeps the placeholder of an empty list at the bottom', () => {
      expect(names(sortItemsByName([{ name: '...' }, { name: 'Zip bag' }, { name: 'Adapter' }], 'en'))).toEqual(['Adapter', 'Zip bag', '...'])
    })

    it('leaves the array it was given in its manual order', () => {
      const items = [{ name: 'b' }, { name: 'a' }]
      sortItemsByName(items, 'en')
      expect(names(items)).toEqual(['b', 'a'])
    })
  })
})

describe('newItemSharing (#2241)', () => {
  const mine = (id: number, category: string, recipients: number[]) =>
    ({ id, name: `item ${id}`, category, is_private: 1, owner_id: 7, recipients: recipients.map(user_id => ({ user_id, username: `u${user_id}` })) })

  it('shares a new item the way every own item of the category is shared', () => {
    const items = [mine(1, 'Beach', [9, 8]), mine(2, 'Beach', [8, 9]), mine(3, 'Other', [])]
    expect(newItemSharing(items, 'Beach', 'personal', 7)).toEqual({ visibility: 'shared', recipient_ids: [8, 9] })
  })

  it('keeps it to me when the category disagrees, keeps something private or is new', () => {
    expect(newItemSharing([mine(1, 'Beach', [8]), mine(2, 'Beach', [9])], 'Beach', 'personal', 7)).toEqual({ visibility: 'personal' })
    expect(newItemSharing([mine(1, 'Beach', [8]), mine(2, 'Beach', [])], 'Beach', 'personal', 7)).toEqual({ visibility: 'personal' })
    expect(newItemSharing([], 'Beach', 'personal', 7)).toEqual({ visibility: 'personal' })
    // Items shared to me by somebody else say nothing about how I share mine.
    expect(newItemSharing([{ ...mine(1, 'Beach', [7]), owner_id: 8 }], 'Beach', 'personal', 7)).toEqual({ visibility: 'personal' })
  })

  it('the shared list stays common', () => {
    expect(newItemSharing([mine(1, 'Beach', [8])], 'Beach', 'common', 7)).toEqual({ visibility: 'common' })
  })
})

describe('packedWeight / perPersonLoads (#1131)', () => {
  it('counts ticked items in full and partly packed ones by their packed count', () => {
    expect(packedWeight([
      { weight_grams: 100, quantity: 3, checked: 1 },
      { weight_grams: 50, quantity: 4, packed_quantity: 2 },
      { weight_grams: 999, quantity: 1, checked: 0 },
      { weight_grams: null, quantity: 1, checked: 1 },
    ])).toBe(400)
  })

  it('splits a shared bag evenly, skips bags with nobody, and sorts heaviest first', () => {
    const bags = [
      { id: 1, w: 900, members: [{ user_id: 1, username: 'A' }, { user_id: 2, username: 'B' }, { user_id: 3, username: 'C' }] },
      { id: 2, w: 1000, members: [{ user_id: 3, username: 'C' }] },
      { id: 3, w: 5000, members: [] },
    ]
    expect(perPersonLoads(bags, b => b.w)).toEqual([
      { user_id: 3, username: 'C', avatar: undefined, grams: 1300, shared: true },
      { user_id: 1, username: 'A', avatar: undefined, grams: 300, shared: true },
      { user_id: 2, username: 'B', avatar: undefined, grams: 300, shared: true },
    ])
    expect(perPersonLoads([{ members: [{ user_id: 9, username: 'Solo' }] }], () => 250)).toEqual([
      { user_id: 9, username: 'Solo', avatar: undefined, grams: 250, shared: false },
    ])
  })
})


describe('bagLoadSummary: what every bag surface adds up (#1767, #2191)', () => {
  const bag = (over: Partial<PackingBag>): PackingBag => ({ id: 1, trip_id: 1, name: 'Bag', color: '#000', sort_order: 0, ...over })
  const backpack = bag({ id: 1, total_weight_grams: 4000, weight_limit_grams: 7000 })
  const duffel = bag({ id: 2 })
  const items = [
    buildPackingItem({ id: 1, bag_id: 1, weight_grams: 500 }),
    buildPackingItem({ id: 2, bag_id: 2, weight_grams: 300, quantity: 2 }),
    buildPackingItem({ id: 3, bag_id: null, weight_grams: 200 }),
    // Shared with me, but Ada brings it: not part of my load.
    buildPackingItem({ id: 4, bag_id: 2, weight_grams: 900, is_private: 1, owner_id: 2 }),
    buildPackingItem({ id: 5, bag_id: null, weight_grams: 50, is_private: 1, owner_id: 9 }),
  ]

  it('lists only what I carry, and weighs bags by the server figure while it is fresh', () => {
    const s = bagLoadSummary([backpack, duffel], items, 9, 1200, true)
    expect(s.myItems.map(i => i.id)).toEqual([1, 2, 3, 5])
    expect(s.bagItemsOf(duffel).map(i => i.id)).toEqual([2])
    expect(s.bagWeightOf(backpack)).toBe(4000)
    // No server figure on the bag: the visible items count.
    expect(s.bagWeightOf(duffel)).toBe(600)
    expect(s.heaviestBagWeight).toBe(4000)
    expect(s.unassigned.map(i => i.id)).toEqual([3, 5])
    expect(s.unassignedWeight).toBe(1200)
    expect(s.totalWeight).toBe(4000 + 600 + 1200)
  })

  it('sums what it can see while offline', () => {
    const s = bagLoadSummary([backpack, duffel], items, 9, 1200, false)
    expect(s.bagWeightOf(backpack)).toBe(500)
    expect(s.unassignedWeight).toBe(250)
    expect(s.totalWeight).toBe(500 + 600 + 250)
    expect(s.heaviestBagWeight).toBe(600)
  })

  it('scales against at least one gram when there are no bags or they weigh nothing', () => {
    expect(bagLoadSummary([], [], 9, null, true)).toMatchObject({ heaviestBagWeight: 1, unassignedWeight: 0, totalWeight: 0 })
    expect(bagLoadSummary([duffel], [], null, undefined, true).heaviestBagWeight).toBe(1)
  })
})
