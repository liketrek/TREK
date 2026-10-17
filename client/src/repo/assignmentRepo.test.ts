import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { assignmentRepo } from './assignmentRepo'
import { offlineDb, clearAll } from '../db/offlineDb'
import { saveAssignmentEndDay } from '../api/assignmentEndDay'
import { isEffectivelyOffline } from '../sync/networkMode'
import { mutationQueue } from '../sync/mutationQueue'
import { apiClient, assignmentsApi } from '../api/client'
import type { Assignment, Day } from '../types'

vi.mock('../api/assignmentEndDay', () => ({ saveAssignmentEndDay: vi.fn() }))
vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => true) }))
vi.mock('../sync/authGate', () => ({ isAuthed: () => true }))
vi.mock('../api/client', () => ({ apiClient: { request: vi.fn() }, assignmentsApi: { updateTime: vi.fn(), updateNotes: vi.fn(), clearDay: vi.fn() } }))
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

describe('assignment time persistence', () => {
  const times = { place_time: '07:00', end_time: null }

  it('stores the offline times with a replayable write of both of them', async () => {
    await assignmentRepo.setTimes(9, { ...assignment, assignment_end_time: '14:00' }, times)
    expect((await offlineDb.days.get(1))?.assignments?.[0]).toMatchObject({ assignment_time: '07:00', assignment_end_time: null })
    expect(await offlineDb.mutationQueue.toArray()).toEqual([expect.objectContaining({
      url: '/trips/9/assignments/7/time', method: 'PUT', body: times, resource: 'assignments', entityId: 7,
    })])
  })

  it('saves through the time route online and caches what came back', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(false)
    vi.mocked(assignmentsApi.updateTime).mockResolvedValue({ assignment: { ...assignment, assignment_end_time: null } })
    const saved = await assignmentRepo.setTimes(9, { ...assignment, assignment_end_time: '14:00' }, times)
    expect(assignmentsApi.updateTime).toHaveBeenCalledWith(9, 7, times)
    expect(saved.assignment_end_time).toBeNull()
    expect((await offlineDb.days.get(1))?.assignments?.[0].assignment_end_time).toBeNull()
    expect(await offlineDb.mutationQueue.count()).toBe(0)
  })

  it('keeps the cached visit unchanged after a refused save', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(false)
    vi.mocked(assignmentsApi.updateTime).mockRejectedValue(new Error('Denied'))
    await expect(assignmentRepo.setTimes(9, assignment, times)).rejects.toThrow('Denied')
    expect((await offlineDb.days.get(1))?.assignments?.[0]).toEqual(assignment)
  })
})

describe('assignment note persistence', () => {
  it('saves through the note route online and caches the saved row on the day', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(false)
    vi.mocked(assignmentsApi.updateNotes).mockResolvedValue({ assignment: { ...assignment, notes: 'Bring cash' } })
    const saved = await assignmentRepo.setNotes(9, assignment, 'Bring cash')
    expect(assignmentsApi.updateNotes).toHaveBeenCalledWith(9, 7, { notes: 'Bring cash' })
    expect(saved.notes).toBe('Bring cash')
    expect((await offlineDb.days.get(1))?.assignments?.[0]).toMatchObject({ notes: 'Bring cash', assignment_time: '07:00' })
    expect(await offlineDb.mutationQueue.count()).toBe(0)
  })

  it('stores the offline note with a replayable write', async () => {
    const saved = await assignmentRepo.setNotes(9, assignment, null)
    expect(saved.notes).toBeNull()
    expect((await offlineDb.days.get(1))?.assignments?.[0].notes).toBeNull()
    expect(await offlineDb.mutationQueue.toArray()).toEqual([expect.objectContaining({
      url: '/trips/9/assignments/7/notes', method: 'PUT', body: { notes: null }, resource: 'assignments', entityId: 7,
    })])
  })

  it('keeps the cached visit unchanged after a refused save', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(false)
    vi.mocked(assignmentsApi.updateNotes).mockRejectedValue(new Error('Denied'))
    await expect(assignmentRepo.setNotes(9, assignment, 'x')).rejects.toThrow('Denied')
    expect((await offlineDb.days.get(1))?.assignments?.[0]).toEqual(assignment)
  })
})

describe('an online edit of a visit with an older write still queued', () => {
  const first = { place_time: '07:00', end_time: null }
  const second = { place_time: '09:00', end_time: null }

  /** Queue the first edit offline, then come back online. */
  async function queueFirst(status: 'pending' | 'failed') {
    await assignmentRepo.setTimes(9, assignment, first)
    if (status === 'failed') await offlineDb.mutationQueue.toCollection().modify({ status: 'failed', attempts: 8 })
    vi.mocked(isEffectivelyOffline).mockReturnValue(false)
    vi.mocked(apiClient.request).mockImplementation(async ({ data }) => ({ data: { assignment: { ...assignment, assignment_time: (data as typeof first).place_time } } }))
  }

  const sentTimes = () => vi.mocked(apiClient.request).mock.calls.map(([req]) => (req.data as typeof first).place_time)

  it('waits behind a parked one, so Try again cannot replay the older time over it', async () => {
    await queueFirst('failed')

    await assignmentRepo.setTimes(9, assignment, second)
    // Not sent past the parked write, not even by the flush it started.
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(assignmentsApi.updateTime).not.toHaveBeenCalled()
    expect(apiClient.request).not.toHaveBeenCalled()
    expect((await offlineDb.days.get(1))?.assignments?.[0].assignment_time).toBe('09:00')

    await mutationQueue.retryFailed()
    expect(sentTimes()).toEqual(['07:00', '09:00'])
    expect(await offlineDb.mutationQueue.count()).toBe(0)
    expect((await offlineDb.days.get(1))?.assignments?.[0].assignment_time).toBe('09:00')
  })

  it('goes out right after an older one that was only waiting to be sent', async () => {
    await queueFirst('pending')

    await assignmentRepo.setTimes(9, assignment, second)

    await vi.waitFor(async () => expect(await offlineDb.mutationQueue.count()).toBe(0))
    expect(assignmentsApi.updateTime).not.toHaveBeenCalled()
    expect(sentTimes()).toEqual(['07:00', '09:00'])
  })

  it('goes out once the older one lands even when that one was already on its way', async () => {
    await queueFirst('pending')
    // The older time is in flight when the new one is made: the running pass has
    // already read its rows, so it must run once more for the new one.
    let edited: Promise<unknown> | undefined
    vi.mocked(apiClient.request).mockImplementation(async ({ data }) => {
      const sent = (data as typeof first).place_time
      if (sent === '07:00') {
        edited = assignmentRepo.setTimes(9, assignment, second)
        await edited
      }
      return { data: { assignment: { ...assignment, assignment_time: sent } } }
    })

    await mutationQueue.flush()

    expect(edited).toBeDefined()
    expect(assignmentsApi.updateTime).not.toHaveBeenCalled()
    expect(sentTimes()).toEqual(['07:00', '09:00'])
    expect(await offlineDb.mutationQueue.count()).toBe(0)
  })

  it('holds a day clear behind an older clear of the same day', async () => {
    await assignmentRepo.clearDay(9, 1)
    await offlineDb.mutationQueue.toCollection().modify({ status: 'failed', attempts: 8 })
    vi.mocked(isEffectivelyOffline).mockReturnValue(false)

    await assignmentRepo.clearDay(9, 1)

    expect(assignmentsApi.clearDay).not.toHaveBeenCalled()
    expect((await offlineDb.mutationQueue.toArray()).map(m => m.status).sort()).toEqual(['failed', 'pending'])
  })
})
