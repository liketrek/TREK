// FE-REPO-PACK-001 to FE-REPO-PACK-007
// Offline write paths — tests/unit/repo/packingRepo.test.ts covers the online ones.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { packingRepo } from './packingRepo'
import { offlineDb, clearAll } from '../db/offlineDb'
import type { QueuedMutation } from '../db/offlineDb'
import { buildPackingItem } from '../../tests/helpers/factories'

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true })
}

async function queue(): Promise<QueuedMutation[]> {
  return (await offlineDb.mutationQueue.toArray()).sort((a, b) => a.createdAt - b.createdAt)
}

beforeEach(async () => {
  await clearAll()
  setOnline(false)
})

afterEach(() => {
  vi.restoreAllMocks()
  setOnline(true)
})

describe('packingRepo.create — offline', () => {
  it('FE-REPO-PACK-001: writes an unchecked optimistic row with a negative temp id', async () => {
    const { item } = await packingRepo.create(4, { name: 'Rain jacket', quantity: 2 })
    expect(item.id).toBeLessThan(0)
    expect(item.trip_id).toBe(4)
    expect(item.checked).toBe(0)

    const cached = await offlineDb.packingItems.get(item.id)
    expect(cached!.name).toBe('Rain jacket')
    expect(cached!.quantity).toBe(2)
  })

  it('FE-REPO-PACK-002: enqueues a POST that carries the temp id', async () => {
    const { item } = await packingRepo.create('4', { name: 'Towel' })
    const [mutation] = await queue()

    expect(mutation.method).toBe('POST')
    expect(mutation.url).toBe('/trips/4/packing')
    expect(mutation.resource).toBe('packingItems')
    expect(mutation.tempId).toBe(item.id)
    expect(mutation.body).toEqual({ name: 'Towel' })
  })

  it('FE-REPO-PACK-003: two same-millisecond creates get distinct temp ids', async () => {
    const first = await packingRepo.create(4, { name: 'A' })
    const second = await packingRepo.create(4, { name: 'B' })

    expect(first.item.id).not.toBe(second.item.id)
    expect(await offlineDb.packingItems.count()).toBe(2)
  })
})

describe('packingRepo.update — offline', () => {
  it('FE-REPO-PACK-004: merges into the cached row and sends the concurrency token', async () => {
    const original = buildPackingItem({ id: 110, trip_id: 4, checked: 0, updated_at: '2026-04-04T00:00:00.000Z' })
    await offlineDb.packingItems.put(original)

    const { item } = await packingRepo.update(4, 110, { checked: 1 })
    expect(item.checked).toBe(1)
    expect(item.name).toBe(original.name)

    const [mutation] = await queue()
    expect(mutation.url).toBe('/trips/4/packing/110')
    expect(mutation.entityId).toBe(110)
    expect(mutation.baseUpdatedAt).toBe('2026-04-04T00:00:00.000Z')
  })

  it('FE-REPO-PACK-005: an unsynced item keeps the {id} placeholder url', async () => {
    await offlineDb.packingItems.put(buildPackingItem({ id: -12, trip_id: 4 }))

    await packingRepo.update(4, -12, { checked: 1 })
    const [mutation] = await queue()

    expect(mutation.url).toBe('/trips/4/packing/{id}')
    expect(mutation.tempEntityId).toBe(-12)
    expect(mutation.baseUpdatedAt).toBeNull()
  })
})

describe('packingRepo.delete — offline', () => {
  it('FE-REPO-PACK-006: removes the cached row and enqueues a DELETE', async () => {
    await offlineDb.packingItems.put(buildPackingItem({ id: 111, trip_id: 4 }))

    expect(await packingRepo.delete(4, 111)).toEqual({ success: true })
    expect(await offlineDb.packingItems.get(111)).toBeUndefined()

    const [mutation] = await queue()
    expect(mutation.method).toBe('DELETE')
    expect(mutation.url).toBe('/trips/4/packing/111')
    expect(mutation.resource).toBe('packingItems')
  })

  it('FE-REPO-PACK-007: deleting an unsynced item keeps the {id} placeholder', async () => {
    await offlineDb.packingItems.put(buildPackingItem({ id: -13, trip_id: 4 }))

    await packingRepo.delete(4, -13)
    const [mutation] = await queue()

    expect(mutation.url).toBe('/trips/4/packing/{id}')
    expect(mutation.tempEntityId).toBe(-13)
  })
})
