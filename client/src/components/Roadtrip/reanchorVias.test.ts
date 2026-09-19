import { describe, it, expect } from 'vitest'
import {
  reanchorAfterInsert,
  reanchorAfterRemove,
  reanchorByStopOrder,
  reanchorAfterReorder,
  isEmptyReanchoring,
  type AnchoredVia,
} from './roadtripModel'

/**
 * A via lives at a position in the day's stop list, and that position is resolved fresh
 * every time the day is routed. These tests pin what happens to it when the list moves
 * under it — the arithmetic that decides whether a reshaped drive survives adding a
 * petrol station to it.
 */
const via = (id: number, after: number, lat = 53, lng = 10): AnchoredVia =>
  ({ id, after_order_index: after, lat, lng })

/** The anchors as a plain map, so a test reads as "which via ended up where". */
const anchors = (moved: { id: number; after_order_index: number }[]) =>
  Object.fromEntries(moved.map(v => [v.id, v.after_order_index]))

describe('reanchorAfterInsert', () => {
  it('FE-REANCHOR-001: a stop added past a via leaves it alone', () => {
    // Legs 0,1,2 — the via is on leg 0 and the new stop lands at position 3.
    const plan = reanchorAfterInsert([via(1, 0)], 3, () => true)
    expect(isEmptyReanchoring(plan)).toBe(true)
  })

  it('FE-REANCHOR-002: a stop added before a via pushes it one leg later', () => {
    const plan = reanchorAfterInsert([via(1, 2), via(2, 3)], 1, () => true)
    expect(anchors(plan.vias)).toEqual({ 1: 3, 2: 4 })
    expect(plan.remove).toEqual([])
  })

  it('FE-REANCHOR-003: on the split leg, a via before the new stop keeps its leg', () => {
    // The reported bug: Hamburg → [via] → Berlin, and a fuel stop lands between them at
    // position 1. The via is passed before the fuel stop, so it belongs to the first half.
    const plan = reanchorAfterInsert([via(1, 0)], 1, () => true)
    expect(isEmptyReanchoring(plan)).toBe(true)
  })

  it('FE-REANCHOR-004: on the split leg, a via past the new stop moves to the second half', () => {
    // Same day, but the via sits beyond the fuel stop. Left at 0 it would bend the short
    // first half back on itself and leave the long second half unshaped — which is the
    // route snapping back to the old road.
    const plan = reanchorAfterInsert([via(1, 0)], 1, () => false)
    expect(anchors(plan.vias)).toEqual({ 1: 1 })
  })

  it('FE-REANCHOR-005: two vias on one split leg are told apart, not moved as a block', () => {
    const early = via(1, 1)
    const late = via(2, 1)
    const plan = reanchorAfterInsert([early, late], 2, v => v.id === early.id)
    expect(anchors(plan.vias)).toEqual({ 2: 2 })
  })

  it('FE-REANCHOR-006: inserting at the very front splits nothing and shifts everything', () => {
    const plan = reanchorAfterInsert([via(1, 0), via(2, 1)], 0, () => {
      throw new Error('nothing is split when the new stop leads the day')
    })
    expect(anchors(plan.vias)).toEqual({ 1: 1, 2: 2 })
  })

  it('FE-REANCHOR-007: appending at the end leaves every existing leg where it was', () => {
    // Four stops, legs 0..2, appended as the fifth.
    const plan = reanchorAfterInsert([via(1, 0), via(2, 2)], 4, () => true)
    expect(isEmptyReanchoring(plan)).toBe(true)
  })

  it('FE-REANCHOR-008: no vias means no request', () => {
    expect(isEmptyReanchoring(reanchorAfterInsert([], 2, () => true))).toBe(true)
  })
})

describe('reanchorAfterRemove', () => {
  it('FE-REANCHOR-009: the legs either side of a removed stop become one', () => {
    // Five stops, legs 0..3. Stop 2 goes; legs 1 and 2 merge into leg 1.
    const plan = reanchorAfterRemove([via(1, 1), via(2, 2), via(3, 3)], 2, 5)
    expect(anchors(plan.vias)).toEqual({ 2: 1, 3: 2 })
    expect(plan.remove).toEqual([])
  })

  it('FE-REANCHOR-010: removing the first stop drops the vias on the leg leaving it', () => {
    const plan = reanchorAfterRemove([via(1, 0), via(2, 2)], 0, 4)
    expect(plan.remove).toEqual([1])
    expect(anchors(plan.vias)).toEqual({ 2: 1 })
  })

  it('FE-REANCHOR-011: removing the last stop drops the vias on the leg into it', () => {
    // Four stops, legs 0..2. Stop 3 goes, so leg 2 has nothing to lead to.
    const plan = reanchorAfterRemove([via(1, 0), via(2, 2)], 3, 4)
    expect(plan.remove).toEqual([2])
    expect(anchors(plan.vias)).toEqual({})
  })

  it('FE-REANCHOR-012: a day left with one stop has no drive, so no via has a leg', () => {
    const plan = reanchorAfterRemove([via(1, 0)], 1, 2)
    expect(plan.remove).toEqual([1])
    expect(plan.vias).toEqual([])
  })
})

describe('reanchorAfterReorder', () => {
  it('FE-REANCHOR-013: moving a stop later pulls the vias between along with it', () => {
    // Five stops, legs 0..3. Stop 1 moves to position 3.
    const plan = reanchorAfterReorder([via(1, 0), via(2, 2), via(3, 3)], 1, 3, 5)
    // Legs 0 and 1 merge into 0, then the stop is put back at 3, splitting leg 2.
    expect(anchors(plan.vias)).toEqual({ 2: 1, 3: 2 })
  })

  it('FE-REANCHOR-014: moving a stop back to where it was changes nothing', () => {
    expect(isEmptyReanchoring(reanchorAfterReorder([via(1, 1)], 2, 2, 4))).toBe(true)
  })

  it('FE-REANCHOR-015: a via whose leg vanishes in the move is dropped, not left dangling', () => {
    // Moving the first stop kills the leg leaving it, and nothing later re-creates that
    // via's anchor — reporting it for deletion is the only honest answer.
    const plan = reanchorAfterReorder([via(1, 0)], 0, 2, 4)
    expect(plan.remove).toEqual([1])
  })

  it('FE-REANCHOR-016: no vias means no request', () => {
    expect(isEmptyReanchoring(reanchorAfterReorder([], 0, 2, 4))).toBe(true)
  })

  it('FE-REANCHOR-017: swapping the only two stops keeps every via', () => {
    // A reorder removes nothing. Leg 0 is still leg 0 after the swap, merely
    // driven the other way round, so the anchors are already right. Routing this
    // through the removal half asked the server to delete every via of the day —
    // and two stops is exactly the shape "follow this track" produces, up to
    // nine vias on that one leg, gone to a single drag with no prompt and no
    // undo.
    const vias = [via(11, 0), via(12, 0), via(13, 0)]

    for (const [from, to] of [[0, 1], [1, 0]] as const) {
      const plan = reanchorAfterReorder(vias, from, to, 2)
      expect(plan.remove, `${from}->${to}`).toEqual([])
      expect(isEmptyReanchoring(plan), `${from}->${to}`).toBe(true)
    }
  })

  it('FE-REANCHOR-019: a wholesale reorder follows the stop, not the number', () => {
    // The plan-mode drag hands a whole new ordering rather than one move, so the
    // anchors are mapped by the stop they were pinned behind. Stops A,B,C,D with
    // a via on the C->D leg (anchor 2): move A to the end and C is now at index
    // 1, so the via belongs on leg 1.
    const plan = reanchorByStopOrder([via(1, 2)], [10, 20, 30, 40], [20, 30, 40, 10])
    expect(plan.vias).toEqual([{ id: 1, after_order_index: 1 }])
    expect(plan.remove).toEqual([])
  })

  it('FE-REANCHOR-020: a via whose stop became the last one has no leg left', () => {
    // Nothing follows the final stop, so there is no drive for the via to bend.
    const plan = reanchorByStopOrder([via(1, 0)], [10, 20, 30], [20, 30, 10])
    expect(plan.remove).toEqual([1])
  })

  it('FE-REANCHOR-021: a stop that is gone takes its vias with it', () => {
    const plan = reanchorByStopOrder([via(1, 1)], [10, 20, 30], [10, 30])
    expect(plan.remove).toEqual([1])
  })

  it('FE-REANCHOR-022: an ordering that did not actually change asks for nothing', () => {
    expect(isEmptyReanchoring(reanchorByStopOrder([via(1, 0)], [10, 20, 30], [10, 20, 30]))).toBe(true)
  })

  it('FE-REANCHOR-018: removing a stop from a two-stop day still clears the leg', () => {
    // The other half of the same rule, and the reason the short-circuit exists:
    // take a stop away from a two-stop day and there is no drive left, so a via
    // has nowhere to sit.
    const plan = reanchorAfterRemove([via(11, 0), via(12, 0)], 1, 2)
    expect(plan.remove).toEqual([11, 12])
    expect(plan.vias).toEqual([])
  })
})
