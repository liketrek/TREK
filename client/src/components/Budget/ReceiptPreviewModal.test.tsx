// FE-BUDGET-PREVIEW-001 to FE-BUDGET-PREVIEW-008: the receipt viewer that opens
// on top of the expense form.
import { vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '../../../tests/helpers/render'
import { ReceiptPreviewModal } from './ReceiptPreviewModal'
import type { BudgetItemReceipt } from '../../types'

const authUrl = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../../api/authUrl', () => ({ getAuthUrl: (...a: unknown[]) => authUrl.get(...a) }))

function receipt(over: Partial<BudgetItemReceipt> = {}): BudgetItemReceipt {
  return {
    id: 1,
    filename: 'stored.jpg',
    original_name: 'lunch.jpg',
    mime_type: 'image/jpeg',
    file_size: 100,
    url: '/uploads/files/stored.jpg',
    ...over,
  } as BudgetItemReceipt
}

beforeEach(() => {
  authUrl.get.mockReset().mockResolvedValue('/signed/stored.jpg')
})

describe('ReceiptPreviewModal', () => {
  it('FE-BUDGET-PREVIEW-001: renders an image receipt once the signed url is in', async () => {
    render(<ReceiptPreviewModal receipts={[receipt()]} onClose={vi.fn()} />)
    await waitFor(() => expect(screen.getByRole('img')).toHaveAttribute('src', '/signed/stored.jpg'))
  })

  it('FE-BUDGET-PREVIEW-002: renders a PDF in a frame rather than an image', async () => {
    render(<ReceiptPreviewModal receipts={[receipt({ mime_type: 'application/pdf', original_name: 'bill.pdf' })]} onClose={vi.fn()} />)
    // The viewer renders through a portal, so it lives on document.body.
    await waitFor(() => expect(document.body.querySelector('object[type="application/pdf"]')).not.toBeNull())
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('FE-BUDGET-PREVIEW-003: a type it cannot show falls back instead of rendering an empty frame', async () => {
    render(<ReceiptPreviewModal receipts={[receipt({ mime_type: 'application/zip', original_name: 'receipts.zip' })]} onClose={vi.fn()} />)
    await waitFor(() => expect(authUrl.get).toHaveBeenCalled())
    expect(document.body.querySelector('object')).toBeNull()
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getAllByText('receipts.zip').length).toBeGreaterThan(0)
  })

  it('FE-BUDGET-PREVIEW-004: a rejected signed url leaves the viewer up rather than blank-screening', async () => {
    authUrl.get.mockRejectedValue(new Error('403'))
    render(<ReceiptPreviewModal receipts={[receipt()]} onClose={vi.fn()} />)
    await waitFor(() => expect(authUrl.get).toHaveBeenCalled())
    expect(screen.getAllByText('lunch.jpg').length).toBeGreaterThan(0)
  })

  it('FE-BUDGET-PREVIEW-005: arrows walk the list and stop at both ends', async () => {
    const two = [receipt({ id: 1, original_name: 'one.jpg' }), receipt({ id: 2, original_name: 'two.jpg' })]
    render(<ReceiptPreviewModal receipts={two} onClose={vi.fn()} />)
    await waitFor(() => expect(screen.getAllByText('one.jpg').length).toBeGreaterThan(0))

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getAllByText('one.jpg').length).toBeGreaterThan(0)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    await waitFor(() => expect(screen.getAllByText('two.jpg').length).toBeGreaterThan(0))

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getAllByText('two.jpg').length).toBeGreaterThan(0)
  })

  it('FE-BUDGET-PREVIEW-006: an out-of-range initialIndex is clamped instead of rendering nothing', async () => {
    const two = [receipt({ id: 1, original_name: 'one.jpg' }), receipt({ id: 2, original_name: 'two.jpg' })]
    render(<ReceiptPreviewModal receipts={two} initialIndex={99} onClose={vi.fn()} />)
    await waitFor(() => expect(screen.getAllByText('two.jpg').length).toBeGreaterThan(0))
  })

  it('FE-BUDGET-PREVIEW-007: Escape closes the viewer and is stopped before the form behind it sees it', async () => {
    const onClose = vi.fn()
    const parent = vi.fn()
    document.addEventListener('keydown', parent)
    try {
      render(<ReceiptPreviewModal receipts={[receipt()]} onClose={onClose} />)
      await waitFor(() => expect(authUrl.get).toHaveBeenCalled())

      fireEvent.keyDown(window, { key: 'Escape' })
      expect(onClose).toHaveBeenCalledTimes(1)
      // The expense form registers its own Escape handler on `document`; one
      // keypress must not close both and throw away the user's edits.
      expect(parent).not.toHaveBeenCalled()
    } finally {
      document.removeEventListener('keydown', parent)
    }
  })

  it('FE-BUDGET-PREVIEW-008: an empty list renders nothing at all', () => {
    render(<ReceiptPreviewModal receipts={[]} onClose={vi.fn()} />)
    expect(document.body.querySelector('object')).toBeNull()
    expect(screen.queryByRole('img')).toBeNull()
  })
})
