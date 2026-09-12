import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { assignmentRepo } from './assignmentRepo'
import { offlineDb, clearAll } from '../db/offlineDb'
import { saveAssignmentEndDay } from '../api/assignmentEndDay'
import { isEffectivelyOffline } from '../sync/networkMode'
import { mutationQueue } from '../sync/mutationQueue'
import { apiClient } from '../api/client'
import type { Assignment, Day } from '../types'

vi.mock('../api/assignmentEndDay', () => ({ saveAssignmentEndDay: vi.fn() }))
vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => true) }))
vi.mock('../sync/authGate', () => ({ isAuthed: () => true }))
vi.mock('../api/client', () => ({ apiClient: { request: vi.fn() } }))
const assignment = { id: 7, day_id: 1, place_id: 2, order_index: 0, assignment_time: '07:00', place: { id: 2, name: 'Berlin' } } as Assignment

beforeEach(async () => {
  await clearAll()
  vi.clearAllMocks()
  vi.mocked(isEffectivelyOffline).mockReturnValue(true)
  await offlineDb.days.put({ id: 1, trip_id: 9, day_number: 1, assignments: [assignment] } as Day)
})

describe('assignment day-end persistence', () => {
  it('stores the offline flag with a replayable write and preserves manual time', async () => {
    await assignmentRepo.setEndDay(9, assignment, true)
    expect((await offlineDb.days.get(1))?.assignments?.[0]).toMatchObject({ end_day: true, assignment_time: '07:00' })
    expect(await offlineDb.mutationQueue.toArray()).toEqual([expect.objectContaining({
      url: '/trips/9/assignments/7/end-day', method: 'PUT', body: { end_day: true }, resource: 'assignments',
    })])
    vi.mocked(isEffectivelyOffline).mockReturnValue(false)
    vi.mocked(apiClient.request).mockResolvedValue({ data: { assignment: { ...assignment, end_day: true } } })
    await mutationQueue.flush()
    expect(await offlineDb.mutationQueue.count()).toBe(0)
    expect((await offlineDb.days.get(1))?.assignments?.[0].end_day).toBe(true)
  })

  it('saves and clears through the online API', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(false)
    vi.mocked(saveAssignmentEndDay).mockResolvedValue({ ...assignment, end_day: false })
    await assignmentRepo.setEndDay(9, assignment, false)
    expect(saveAssignmentEndDay).toHaveBeenCalledWith(9, 7, { end_day: false })
    expect((await offlineDb.days.get(1))?.assignments?.[0].end_day).toBe(false)
  })

  it('keeps the cached visit unchanged after a rejected save', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(false)
    vi.mocked(saveAssignmentEndDay).mockRejectedValue(new Error('Denied'))
    await expect(assignmentRepo.setEndDay(9, assignment, true)).rejects.toThrow('Denied')
    expect((await offlineDb.days.get(1))?.assignments?.[0].end_day).toBeUndefined()
  })
})
