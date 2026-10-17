import { describe, it, expect, beforeEach } from 'vitest'
import { useBackgroundTasksStore, taskFoundSomething, type BackgroundImportTask } from './backgroundTasksStore'

const RECEIPT = { merchant: 'Café', date: null, total: 4, currency: 'EUR', items: [] }

beforeEach(() => useBackgroundTasksStore.setState({ tasks: [] }))

describe('backgroundTasksStore with a receipt scan', () => {
  it('keeps what the scan read on the finished task', () => {
    const s = useBackgroundTasksStore.getState()
    s.addTask({ id: 'j1', tripId: '7', label: 'bill.jpg', total: 1, kind: 'costs' })
    s.setDone('j1', '7', [], [], RECEIPT)
    expect(useBackgroundTasksStore.getState().tasks[0]).toMatchObject({ status: 'done', kind: 'costs', receipt: RECEIPT, items: [] })
  })
})

describe('taskFoundSomething', () => {
  const task = (over: Partial<BackgroundImportTask>): BackgroundImportTask => ({ id: 'j', tripId: '7', label: 'x', status: 'done', done: 1, total: 1, ...over })

  it('asks a receipt scan for its receipt', () => {
    expect(taskFoundSomething(task({ kind: 'costs', items: [], receipt: RECEIPT }))).toBe(true)
    expect(taskFoundSomething(task({ kind: 'costs', items: [], receipt: null }))).toBe(false)
  })

  it('asks a booking parse for its items', () => {
    expect(taskFoundSomething(task({ kind: 'bookings', items: [{} as never] }))).toBe(true)
    expect(taskFoundSomething(task({ items: [] }))).toBe(false)
  })
})
