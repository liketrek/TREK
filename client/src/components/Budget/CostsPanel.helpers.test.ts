import { describe, it, expect } from 'vitest'
import { hasTicketSplit, payerSum, payersBalanced, readTicketItems, readUserNote, rebalancePayers, splitCents, writeTicketItems } from './CostsPanel.helpers'

describe('splitCents', () => {
  it('splits evenly when it divides cleanly', () => {
    expect(splitCents(90, 3)).toEqual([30, 30, 30])
  })

  it('distributes the remainder cents so the parts sum back exactly', () => {
    const parts = splitCents(100.01, 3)
    expect(parts).toEqual([33.34, 33.34, 33.33])
    expect(parts.reduce((a, b) => a + b, 0)).toBeCloseTo(100.01, 2)
  })

  it('returns an empty list for a non-positive count', () => {
    expect(splitCents(50, 0)).toEqual([])
  })

  it('floors a negative amount at zero rather than inventing debt', () => {
    expect(splitCents(-10, 2)).toEqual([0, 0])
  })
})

describe('payerSum', () => {
  it('sums only the selected payers', () => {
    const amounts = { 1: '45', 2: '45', 3: '99' }
    expect(payerSum(amounts, new Set([1, 2]))).toBeCloseTo(90, 2)
  })

  it('treats blank and unparseable amounts as zero', () => {
    expect(payerSum({ 1: '', 2: 'abc' }, new Set([1, 2]))).toBe(0)
  })
})

describe('payersBalanced', () => {
  it('is true when the payer amounts add up to the total', () => {
    expect(payersBalanced({ 1: '45', 2: '45' }, new Set([1, 2]), 90)).toBe(true)
  })

  it('is false when they do not', () => {
    expect(payersBalanced({ 1: '45', 2: '40' }, new Set([1, 2]), 90)).toBe(false)
  })

  it('compares to the cent, tolerating float dust', () => {
    expect(payersBalanced({ 1: '33.34', 2: '33.34', 3: '33.33' }, new Set([1, 2, 3]), 100.01)).toBe(true)
  })
})

describe('rebalancePayers', () => {
  it('spreads the total across payers when none are pinned', () => {
    const next = rebalancePayers({}, new Set(), new Set([1, 2]), 90)
    expect(next).toEqual({ 1: '45.00', 2: '45.00' })
  })

  it('leaves pinned payers alone and lets the rest absorb the remainder', () => {
    // Alice pinned at 70 of a 100 bill → Bob must absorb 30.
    const next = rebalancePayers({ 1: '70' }, new Set([1]), new Set([1, 2]), 100)
    expect(next[1]).toBe('70')
    expect(next[2]).toBe('30.00')
  })

  it('returns the amounts untouched when every payer is pinned', () => {
    const amounts = { 1: '70', 2: '20' }
    const next = rebalancePayers(amounts, new Set([1, 2]), new Set([1, 2]), 100)
    expect(next).toEqual(amounts)
  })

  it('blanks a free payer whose share works out to zero', () => {
    // Alice pinned at the full total → Bob is a payer with nothing left to pay.
    const next = rebalancePayers({ 1: '100' }, new Set([1]), new Set([1, 2]), 100)
    expect(next[2]).toBe('')
  })

  it('keeps the result balanced after rebalancing', () => {
    const next = rebalancePayers({ 1: '33.33' }, new Set([1]), new Set([1, 2, 3]), 100)
    expect(payersBalanced(next, new Set([1, 2, 3]), 100)).toBe(true)
  })
})

// ── Notes vs. itemized receipts (#1658) ──────────────────────────────────────

describe('readTicketItems', () => {
  const receipt = '{"items":[{"name":"Bread","price":"3.50","parts":[1,2]},{"name":"Wine","price":"12","parts":[2]}]}'

  it('reads the receipt out of its own column', () => {
    const items = readTicketItems({ ticket_json: receipt })
    expect(items.map(i => i.name)).toEqual(['Bread', 'Wine'])
    expect(items[0].participants).toEqual(new Set([1, 2]))
    expect(items[1].price).toBe('12')
  })

  it('still reads a response cached before the column existed', () => {
    const items = readTicketItems({ note: 'TICKETJSON:' + receipt })
    expect(items).toHaveLength(2)
    expect(items[1].participants).toEqual(new Set([2]))
  })

  it('prefers the column over the legacy note when both are present', () => {
    const items = readTicketItems({ ticket_json: '{"items":[{"name":"Only","price":"1","parts":[]}]}', note: 'TICKETJSON:' + receipt })
    expect(items.map(i => i.name)).toEqual(['Only'])
  })

  it('is empty for an expense with neither, and for malformed JSON', () => {
    expect(readTicketItems({ note: 'just a note' })).toEqual([])
    expect(readTicketItems(null)).toEqual([])
    expect(readTicketItems({ ticket_json: '{oops' })).toEqual([])
  })

  it('round-trips through writeTicketItems', () => {
    const items = readTicketItems({ ticket_json: receipt })
    expect(readTicketItems({ ticket_json: writeTicketItems(items) })).toEqual(items)
  })
})

describe('hasTicketSplit', () => {
  it('recognises both storage shapes and nothing else', () => {
    expect(hasTicketSplit({ ticket_json: '{"items":[]}' })).toBe(true)
    expect(hasTicketSplit({ note: 'TICKETJSON:{"items":[]}' })).toBe(true)
    expect(hasTicketSplit({ note: 'dinner with Ben' })).toBe(false)
    expect(hasTicketSplit(undefined)).toBe(false)
  })
})

describe('readUserNote', () => {
  it('returns what the user typed', () => {
    expect(readUserNote({ note: 'Lisa pays half back' })).toBe('Lisa pays half back')
  })

  it('never returns a receipt blob as if it were a note', () => {
    expect(readUserNote({ note: 'TICKETJSON:{"items":[]}' })).toBe('')
    expect(readUserNote({ note: null })).toBe('')
    expect(readUserNote(null)).toBe('')
  })
})
