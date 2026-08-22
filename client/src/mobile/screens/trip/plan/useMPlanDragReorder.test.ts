import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMPlanDragReorder } from './useMPlanDragReorder'
import type { MergedItem } from '../../../../utils/dayMerge'
import type { PlanRow } from './planTimelineModel'

const items = [
  { type: 'place', data: { id: 1 } },
  { type: 'place', data: { id: 2 } },
  { type: 'note', data: { id: 3 } },
] as unknown as MergedItem[]

const rowFor = (i: number): PlanRow =>
  ({ key: `row-${i}`, kind: 'place', item: items[i], assignment: {}, linkedRes: null }) as unknown as PlanRow

const connRow = { key: 'conn-1', kind: 'conn', seg: {} } as unknown as PlanRow

/** A DragEvent stand-in with just the parts the hook touches. */
const dragEvent = () => {
  const store = new Map<string, string>()
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    dataTransfer: {
      setData: (k: string, v: string) => store.set(k, v),
      getData: (k: string) => store.get(k) ?? '',
      set effectAllowed(_v: string) { /* noop */ },
    },
  } as never
}

const setup = (enabled = true) => {
  const onMove = vi.fn()
  const hook = renderHook(() => useMPlanDragReorder({ merged: items, dayId: 7, onMove, enabled }))
  return { ...hook, onMove }
}

describe('useMPlanDragReorder', () => {
  it('FE-MOB-DRAG-001: hands out nothing while disabled', () => {
    const { result } = setup(false)
    expect(result.current.dragPropsFor(rowFor(0))).toBeUndefined()
    expect(result.current.draggingKey).toBeNull()
  })

  it('FE-MOB-DRAG-002: hands out nothing without a day', () => {
    const onMove = vi.fn()
    const { result } = renderHook(() =>
      useMPlanDragReorder({ merged: items, dayId: null, onMove, enabled: true }))
    expect(result.current.dragPropsFor(rowFor(0))).toBeUndefined()
  })

  it('FE-MOB-DRAG-003: leaves connector rows undraggable — they are computed spacing', () => {
    const { result } = setup()
    expect(result.current.dragPropsFor(connRow)).toBeUndefined()
  })

  it('FE-MOB-DRAG-004: marks the travelling row and the row it would land in front of', () => {
    const { result } = setup()
    act(() => { result.current.dragPropsFor(rowFor(0))!.onDragStart(dragEvent()) })
    expect(result.current.draggingKey).toBe('row-0')

    act(() => { result.current.dragPropsFor(rowFor(2))!.onDragOver(dragEvent()) })
    expect(result.current.dropBeforeKey).toBe('row-2')
  })

  it('FE-MOB-DRAG-005: moves the source to the target index on drop', () => {
    const { result, onMove } = setup()
    act(() => { result.current.dragPropsFor(rowFor(0))!.onDragStart(dragEvent()) })
    act(() => { result.current.dragPropsFor(rowFor(2))!.onDrop(dragEvent()) })

    expect(onMove).toHaveBeenCalledWith(items[0], 2)
    // and the drag state is cleared again
    expect(result.current.draggingKey).toBeNull()
    expect(result.current.dropBeforeKey).toBeNull()
  })

  it('FE-MOB-DRAG-006: a drop on the row itself is not a move', () => {
    const { result, onMove } = setup()
    act(() => { result.current.dragPropsFor(rowFor(1))!.onDragStart(dragEvent()) })
    act(() => { result.current.dragPropsFor(rowFor(1))!.onDrop(dragEvent()) })
    expect(onMove).not.toHaveBeenCalled()
  })

  it('FE-MOB-DRAG-007: a drop without a drag start is ignored', () => {
    const { result, onMove } = setup()
    act(() => { result.current.dragPropsFor(rowFor(1))!.onDrop(dragEvent()) })
    expect(onMove).not.toHaveBeenCalled()
  })

  it('FE-MOB-DRAG-008: dragOver accepts the drop so the touch bridge can read it', () => {
    const { result } = setup()
    act(() => { result.current.dragPropsFor(rowFor(0))!.onDragStart(dragEvent()) })
    const e = dragEvent() as unknown as { preventDefault: ReturnType<typeof vi.fn> }
    act(() => { result.current.dragPropsFor(rowFor(1))!.onDragOver(e as never) })
    expect(e.preventDefault).toHaveBeenCalled()
  })

  it('FE-MOB-DRAG-009: dragEnd clears the state without moving anything', () => {
    const { result, onMove } = setup()
    act(() => { result.current.dragPropsFor(rowFor(0))!.onDragStart(dragEvent()) })
    act(() => { result.current.dragPropsFor(rowFor(0))!.onDragEnd() })
    expect(result.current.draggingKey).toBeNull()
    expect(onMove).not.toHaveBeenCalled()
  })

  it('FE-MOB-DRAG-010: survives a DataTransfer shim that refuses setData', () => {
    const { result } = setup()
    const broken = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: { setData: () => { throw new Error('nope') } },
    } as never
    expect(() => act(() => { result.current.dragPropsFor(rowFor(0))!.onDragStart(broken) })).not.toThrow()
    expect(result.current.draggingKey).toBe('row-0')
  })
})
