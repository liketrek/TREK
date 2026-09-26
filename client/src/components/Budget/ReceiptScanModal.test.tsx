// FE-BUDGET-SCAN-001 to FE-BUDGET-SCAN-010
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import { saveImportFiles } from '../../db/offlineDb'
import { useBackgroundTasksStore } from '../../store/backgroundTasksStore'
import { useReceiptScan } from './useReceiptScan'
import { ReceiptScanModal } from './ReceiptScanModal'
import MReceiptScanButton from '../../mobile/screens/trip/tabs/MReceiptScanButton'

vi.mock('../../db/offlineDb', () => ({ saveImportFiles: vi.fn(async () => {}) }))

function Harness({ canEdit = true }: { canEdit?: boolean }) {
  const scan = useReceiptScan(7, canEdit)
  return (
    <>
      {scan.offered && <button type="button" onClick={scan.open}>Scan receipt</button>}
      <ReceiptScanModal scan={scan} />
    </>
  )
}

const input = () => screen.getByTestId('receipt-scan-input') as HTMLInputElement
const photo = (name = 'bill.jpg', size = 4) => {
  const f = new File(['x'.repeat(Math.min(size, 16))], name, { type: 'image/jpeg' })
  if (size > 16) Object.defineProperty(f, 'size', { value: size })
  return f
}
async function openDialog() {
  fireEvent.click(await screen.findByRole('button', { name: 'Scan receipt' }))
  return screen.getByRole('dialog', { name: 'Scan a receipt' })
}

beforeEach(() => {
  vi.mocked(saveImportFiles).mockClear()
  useBackgroundTasksStore.setState({ tasks: [] })
  server.use(
    http.get('/api/llm/capabilities', () => HttpResponse.json({ images: true })),
    http.post('/api/trips/7/budget/receipt-scan', () => HttpResponse.json({ jobId: 'job-5' })),
  )
})

describe('Scan receipt', () => {
  it('FE-BUDGET-SCAN-001: offers the scan when the model reads images, and opens a dialog saying what it takes', async () => {
    render(<Harness />)
    await openDialog()
    expect(screen.getByText(/A photo of one receipt \(JPG, PNG or WEBP, up to 10 MB\)/)).toBeInTheDocument()
    expect(input().accept).toContain('image/jpeg')
    expect(screen.getByRole('button', { name: 'Scan' })).toBeDisabled()
  })

  it('FE-BUDGET-SCAN-002: offers nothing, and asks nothing, without budget_edit', async () => {
    let asked = false
    server.use(http.get('/api/llm/capabilities', () => { asked = true; return HttpResponse.json({ images: true }) }))
    render(<Harness canEdit={false} />)
    await new Promise(r => setTimeout(r, 20))
    expect(asked).toBe(false)
    expect(screen.queryByRole('button', { name: 'Scan receipt' })).not.toBeInTheDocument()
  })

  it('FE-BUDGET-SCAN-003: offers nothing when the model reads no images', async () => {
    server.use(http.get('/api/llm/capabilities', () => HttpResponse.json({ images: false })))
    render(<Harness />)
    await new Promise(r => setTimeout(r, 20))
    expect(screen.queryByRole('button', { name: 'Scan receipt' })).not.toBeInTheDocument()
  })

  it('FE-BUDGET-SCAN-004: a picked photo is named, then Scan starts a costs job the widget follows and closes the dialog', async () => {
    render(<Harness />)
    await openDialog()
    const picked = photo()
    fireEvent.change(input(), { target: { files: [picked] } })
    expect(screen.getByText('bill.jpg')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Scan' }))
    await waitFor(() => expect(useBackgroundTasksStore.getState().tasks[0]).toMatchObject({ id: 'job-5', tripId: '7', label: 'bill.jpg', kind: 'costs', status: 'running' }))
    expect(saveImportFiles).toHaveBeenCalledWith('job-5', [picked])
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('FE-BUDGET-SCAN-005: a dropped photo is taken like a picked one', async () => {
    render(<Harness />)
    await openDialog()
    const zone = screen.getByText('Drop the receipt photo here, or click to pick or take one').closest('button')!
    fireEvent.dragOver(zone)
    expect(screen.getByText('Drop the photo to scan it')).toBeInTheDocument()
    fireEvent.drop(zone, { dataTransfer: { files: [photo('drop.png')] } })
    expect(screen.getByText('drop.png')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Scan' })).toBeEnabled()
  })

  it('FE-BUDGET-SCAN-006: refuses what is not a photo, and a photo over 10 MB, before anything is sent', async () => {
    let sent = false
    server.use(http.post('/api/trips/7/budget/receipt-scan', () => { sent = true; return HttpResponse.json({ jobId: 'x' }) }))
    render(<Harness />)
    await openDialog()
    fireEvent.change(input(), { target: { files: [new File(['%PDF'], 'bill.pdf', { type: 'application/pdf' })] } })
    expect(screen.getByRole('alert')).toHaveTextContent('Only a photo can be scanned: JPG, PNG or WEBP.')
    fireEvent.change(input(), { target: { files: [photo('big.jpg', 11 * 1024 * 1024)] } })
    expect(screen.getByRole('alert')).toHaveTextContent('File "big.jpg" exceeds 10 MB limit.')
    expect(screen.getByRole('button', { name: 'Scan' })).toBeDisabled()
    expect(sent).toBe(false)
  })

  it('FE-BUDGET-SCAN-007: says why when the server refuses, and keeps the dialog open', async () => {
    server.use(http.post('/api/trips/7/budget/receipt-scan', () => HttpResponse.json({ error: 'The configured AI model does not read photos' }, { status: 400 })))
    render(<Harness />)
    await openDialog()
    fireEvent.change(input(), { target: { files: [photo()] } })
    fireEvent.click(screen.getByRole('button', { name: 'Scan' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('The configured AI model does not read photos')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(useBackgroundTasksStore.getState().tasks).toEqual([])
  })

  it('FE-BUDGET-SCAN-008: Cancel, the close button and the backdrop close it; reopening starts empty', async () => {
    render(<Harness />)
    const dialog = await openDialog()
    fireEvent.change(input(), { target: { files: [photo()] } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await openDialog()
    expect(screen.queryByText('bill.jpg')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await openDialog()
    fireEvent.click(screen.getByRole('dialog').parentElement!)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(dialog).not.toBeInTheDocument()
  })
})

describe('MReceiptScanButton', () => {
  it('FE-BUDGET-SCAN-009: the phone header button opens the same dialog', async () => {
    render(<MReceiptScanButton tripId={7} canEdit />)
    fireEvent.click(await screen.findByRole('button', { name: 'Scan receipt' }))
    expect(screen.getByRole('dialog', { name: 'Scan a receipt' })).toBeInTheDocument()
  })

  it('FE-BUDGET-SCAN-010: draws nothing when the scan is not offered', async () => {
    const { container } = render(<MReceiptScanButton tripId={7} canEdit={false} />)
    await new Promise(r => setTimeout(r, 20))
    expect(container).toBeEmptyDOMElement()
  })
})
