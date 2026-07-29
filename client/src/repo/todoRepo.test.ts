// FE-REPO-TODO-001 to FE-REPO-TODO-004
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { http, HttpResponse } from 'msw'
import { server } from '../../tests/helpers/msw/server'
import { todoRepo } from './todoRepo'
import { offlineDb, clearAll } from '../db/offlineDb'
import { buildTodoItem } from '../../tests/helpers/factories'

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true })
}

beforeEach(async () => {
  await clearAll()
  setOnline(true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('todoRepo.list', () => {
  it('FE-REPO-TODO-001: online — returns REST items and caches them', async () => {
    const item = buildTodoItem({ id: 51, trip_id: 9, name: 'Book train' })
    server.use(http.get('/api/trips/9/todo', () => HttpResponse.json({ items: [item] })))

    const result = await todoRepo.list(9)
    expect(result.items.map(i => i.name)).toEqual(['Book train'])

    await new Promise(r => setTimeout(r, 0))
    expect((await offlineDb.todoItems.get(51))!.name).toBe('Book train')
  })

  it('FE-REPO-TODO-002: offline — returns only this trip\'s cached items', async () => {
    await offlineDb.todoItems.bulkPut([
      buildTodoItem({ id: 52, trip_id: 9 }),
      buildTodoItem({ id: 53, trip_id: 10 }),
    ])
    setOnline(false)

    const result = await todoRepo.list('9')
    expect(result.items.map(i => i.id)).toEqual([52])
  })

  it('FE-REPO-TODO-003: offline with an empty cache — returns an empty list', async () => {
    setOnline(false)
    expect((await todoRepo.list(404)).items).toEqual([])
  })

  it('FE-REPO-TODO-004: a 500 is rethrown, not masked by the cache', async () => {
    server.use(http.get('/api/trips/9/todo', () => HttpResponse.json({ error: 'boom' }, { status: 500 })))
    await expect(todoRepo.list(9)).rejects.toThrow()
  })
})
