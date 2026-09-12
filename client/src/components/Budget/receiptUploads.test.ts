// FE-BUDGET-RECEIPT-001 to FE-BUDGET-RECEIPT-008: uploading receipts with an
// expense, and taking the uploads back out when the expense fails to save.
import { vi } from 'vitest'
import { uploadReceipts, discardReceipts, saveWithReceipts } from './receiptUploads'

const files = vi.hoisted(() => ({
  upload: vi.fn(),
  delete: vi.fn(),
  permanentDelete: vi.fn(),
}))

vi.mock('../../api/client', () => ({ filesApi: files }))

function file(name: string) {
  return new File(['x'], name, { type: 'image/jpeg' })
}

beforeEach(() => {
  files.upload.mockReset().mockImplementation(() => Promise.resolve({ file: { id: 7 } }))
  files.delete.mockReset().mockResolvedValue({})
  files.permanentDelete.mockReset().mockResolvedValue({})
})

describe('uploadReceipts', () => {
  it('FE-BUDGET-RECEIPT-001: names the expense on the form data when there is one', async () => {
    await uploadReceipts(3, [file('a.jpg')], 42)
    const fd = files.upload.mock.calls[0][1] as FormData
    expect(fd.get('budget_item_id')).toBe('42')
  })

  it('FE-BUDGET-RECEIPT-002: leaves it out for an expense that does not exist yet', async () => {
    await uploadReceipts(3, [file('a.jpg')], null)
    const fd = files.upload.mock.calls[0][1] as FormData
    expect(fd.get('budget_item_id')).toBeNull()
  })

  it('FE-BUDGET-RECEIPT-003: returns the ids in order and skips a response without one', async () => {
    files.upload
      .mockResolvedValueOnce({ file: { id: 11 } })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ file: { id: 13 } })
    expect(await uploadReceipts(3, [file('a'), file('b'), file('c')], null)).toEqual([11, 13])
  })
})

describe('discardReceipts', () => {
  it('FE-BUDGET-RECEIPT-004: trashes before it deletes, because the permanent route only accepts a trashed file', async () => {
    const order: string[] = []
    files.delete.mockImplementation(() => { order.push('delete'); return Promise.resolve({}) })
    files.permanentDelete.mockImplementation(() => { order.push('permanent'); return Promise.resolve({}) })

    expect(await discardReceipts(3, [9])).toEqual([])
    expect(order).toEqual(['delete', 'permanent'])
  })

  it('FE-BUDGET-RECEIPT-005: reports the ids it could not remove instead of swallowing them', async () => {
    files.delete.mockRejectedValueOnce(new Error('403'))
    expect(await discardReceipts(3, [9, 10])).toEqual([9])
  })
})

describe('saveWithReceipts', () => {
  it('FE-BUDGET-RECEIPT-006: hands the uploaded ids to the save and returns its result', async () => {
    files.upload.mockResolvedValueOnce({ file: { id: 5 } }).mockResolvedValueOnce({ file: { id: 6 } })
    const save = vi.fn().mockResolvedValue('saved')
    const out = await saveWithReceipts(3, [file('a'), file('b')], null, save)
    expect(save).toHaveBeenCalledWith([5, 6])
    expect(out.result).toBe('saved')
    expect(files.delete).not.toHaveBeenCalled()
  })

  it('FE-BUDGET-RECEIPT-007: a failing save takes every upload back out again', async () => {
    files.upload.mockResolvedValueOnce({ file: { id: 5 } }).mockResolvedValueOnce({ file: { id: 6 } })
    const save = vi.fn().mockRejectedValue(new Error('nope'))

    await expect(saveWithReceipts(3, [file('a'), file('b')], null, save)).rejects.toThrow('nope')
    expect(files.delete.mock.calls.map(c => c[1])).toEqual([5, 6])
    expect(files.permanentDelete.mock.calls.map(c => c[1])).toEqual([5, 6])
  })

  it('FE-BUDGET-RECEIPT-008: a failure partway through the upload rolls back what already went up, and says what stuck', async () => {
    files.upload.mockResolvedValueOnce({ file: { id: 5 } }).mockRejectedValueOnce(new Error('offline'))
    files.delete.mockRejectedValueOnce(new Error('403'))
    const save = vi.fn()

    const err = await saveWithReceipts(3, [file('a'), file('b')], null, save).catch(e => e)
    expect(save).not.toHaveBeenCalled()
    expect(files.delete.mock.calls.map(c => c[1])).toEqual([5])
    expect(err.stuckReceiptIds).toEqual([5])
  })
})
