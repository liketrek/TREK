// FE-W4BGT-001 to FE-W4BGT-022
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, act, waitFor } from '@testing-library/react'
import { render, fireEvent } from '../../../tests/helpers/render'
import { reservationsApi, healthApi } from '../../api/client'
import { addListener } from '../../api/websocket'
import { useBackgroundTasksStore, type BackgroundImportTask } from '../../store/backgroundTasksStore'
import BackgroundTasksWidget from './BackgroundTasksWidget'

const navigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => navigate }
})
vi.mock('../../api/websocket', () => ({ addListener: vi.fn(), removeListener: vi.fn() }))
vi.mock('../../api/client', () => ({
  reservationsApi: { importJobStatus: vi.fn(), importBookingAsync: vi.fn() },
  healthApi: { features: vi.fn() },
}))
vi.mock('../../db/offlineDb', () => ({ saveImportFiles: vi.fn(() => Promise.resolve()) }))

const task = (overrides: Partial<BackgroundImportTask> = {}): BackgroundImportTask => ({
  id: 'j1', tripId: 't1', label: 'voucher.pdf', status: 'done', done: 0, total: 1, items: [], warnings: [],
  ...overrides,
})

type WsHandler = (e: Record<string, unknown>) => void

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(healthApi.features).mockReturnValue(new Promise(() => {}))
  vi.mocked(reservationsApi.importJobStatus).mockReturnValue(new Promise(() => {}))
  useBackgroundTasksStore.setState({ tasks: [] })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('BackgroundTasksWidget — rendering', () => {
  it('FE-W4BGT-001: renders nothing without tasks', () => {
    const { container, baseElement } = render(<BackgroundTasksWidget />)

    expect(container).toBeEmptyDOMElement()
    expect(baseElement.querySelectorAll('button')).toHaveLength(0)
  })

  it('FE-W4BGT-002: a running job shows the spinner, the parsing note and no close button', () => {
    useBackgroundTasksStore.setState({ tasks: [task({ status: 'running', done: 1, total: 3 })] })
    const { baseElement } = render(<BackgroundTasksWidget />)

    expect(screen.getByText('voucher.pdf')).toBeInTheDocument()
    expect(screen.getByText(/· 1\/3$/)).toBeInTheDocument()
    expect(baseElement.querySelector('.animate-spin')).not.toBeNull()
    expect(screen.queryByLabelText('Close')).toBeNull()
  })

  it('FE-W4BGT-003: a single-file job omits the counter', () => {
    useBackgroundTasksStore.setState({ tasks: [task({ status: 'running', done: 0, total: 1 })] })
    render(<BackgroundTasksWidget />)

    expect(screen.queryByText(/·/)).toBeNull()
  })

  it('FE-W4BGT-004: a restored done job without items still reads as parsing', () => {
    useBackgroundTasksStore.setState({ tasks: [task({ status: 'done', items: undefined })] })
    const { baseElement } = render(<BackgroundTasksWidget />)

    expect(baseElement.querySelector('.animate-spin')).not.toBeNull()
    expect(screen.getByLabelText('Close')).toBeInTheDocument()
  })

  it('FE-W4BGT-005: a finished job with items offers the review action', () => {
    useBackgroundTasksStore.setState({ tasks: [task({ items: [{ id: 1 }] as never })] })
    render(<BackgroundTasksWidget />)

    fireEvent.click(screen.getByRole('button', { name: 'Import' }))

    expect(useBackgroundTasksStore.getState().tasks[0].reviewRequested).toBe(true)
    expect(navigate).toHaveBeenCalledWith('/trips/t1')
  })

  it('FE-W4BGT-006: a failed job shows the error message', () => {
    useBackgroundTasksStore.setState({ tasks: [task({ status: 'error', error: 'AI quota exhausted' })] })
    render(<BackgroundTasksWidget />)

    expect(screen.getByText('AI quota exhausted')).toBeInTheDocument()
  })

  it('FE-W4BGT-007: the close button drops the card', () => {
    useBackgroundTasksStore.setState({ tasks: [task()] })
    render(<BackgroundTasksWidget />)

    fireEvent.click(screen.getByLabelText('Close'))

    expect(useBackgroundTasksStore.getState().tasks).toHaveLength(0)
  })
})

describe('BackgroundTasksWidget — websocket', () => {
  it('FE-W4BGT-008: import:progress updates the running card', () => {
    useBackgroundTasksStore.setState({ tasks: [task({ status: 'running', total: 4 })] })
    render(<BackgroundTasksWidget />)
    const handler = vi.mocked(addListener).mock.calls[0][0] as WsHandler

    act(() => { handler({ type: 'import:progress', jobId: 'j1', tripId: 't1', done: 2, total: 4 }) })

    expect(screen.getByText(/· 2\/4$/)).toBeInTheDocument()
  })

  it('FE-W4BGT-009: import:done attaches the parsed items', () => {
    useBackgroundTasksStore.setState({ tasks: [task({ status: 'running', items: undefined })] })
    render(<BackgroundTasksWidget />)
    const handler = vi.mocked(addListener).mock.calls[0][0] as WsHandler

    act(() => { handler({ type: 'import:done', jobId: 'j1', tripId: 't1', result: { items: [{ id: 1 }], warnings: [] } }) })

    expect(screen.getByRole('button', { name: 'Import' })).toBeInTheDocument()
  })

  it('FE-W4BGT-010: import:error surfaces the message', () => {
    useBackgroundTasksStore.setState({ tasks: [task({ status: 'running' })] })
    render(<BackgroundTasksWidget />)
    const handler = vi.mocked(addListener).mock.calls[0][0] as WsHandler

    act(() => { handler({ type: 'import:error', jobId: 'j1', tripId: 't1', message: 'boom' }) })

    expect(screen.getByText('boom')).toBeInTheDocument()
  })

  it('FE-W4BGT-011: unrelated events and events without a job id are ignored', () => {
    useBackgroundTasksStore.setState({ tasks: [task({ status: 'running', total: 4 })] })
    render(<BackgroundTasksWidget />)
    const handler = vi.mocked(addListener).mock.calls[0][0] as WsHandler

    act(() => {
      handler({ type: 'place:updated', jobId: 'j1' })
      handler({ type: 'import:progress', done: 3, total: 4 })
      handler({ done: 3 })
    })

    expect(screen.getByText(/· 0\/4$/)).toBeInTheDocument()
  })
})

describe('BackgroundTasksWidget — rehydrate', () => {
  it('FE-W4BGT-012: a restored job that the server finished gets its items back', async () => {
    useBackgroundTasksStore.setState({ tasks: [task({ status: 'running', items: undefined })] })
    vi.mocked(reservationsApi.importJobStatus).mockResolvedValue({
      status: 'done', done: 1, total: 1, result: { items: [{ id: 1 }], warnings: [] },
    } as never)

    render(<BackgroundTasksWidget />)

    expect(await screen.findByRole('button', { name: 'Import' })).toBeInTheDocument()
    expect(reservationsApi.importJobStatus).toHaveBeenCalledWith('t1', 'j1')
  })

  it('FE-W4BGT-013: a restored job the server reports as failed shows the error', async () => {
    useBackgroundTasksStore.setState({ tasks: [task({ status: 'running', items: undefined })] })
    vi.mocked(reservationsApi.importJobStatus).mockResolvedValue({ status: 'error', error: 'expired', done: 0, total: 1 } as never)

    render(<BackgroundTasksWidget />)

    expect(await screen.findByText('expired')).toBeInTheDocument()
  })

  it('FE-W4BGT-014: a restored job the server has dropped is removed', async () => {
    useBackgroundTasksStore.setState({ tasks: [task({ status: 'running', items: undefined })] })
    vi.mocked(reservationsApi.importJobStatus).mockRejectedValue({ response: { status: 404 } })

    render(<BackgroundTasksWidget />)

    await waitFor(() => expect(useBackgroundTasksStore.getState().tasks).toHaveLength(0))
  })

  it('FE-W4BGT-015: a non-404 failure keeps the card', async () => {
    useBackgroundTasksStore.setState({ tasks: [task({ status: 'running', items: undefined })] })
    vi.mocked(reservationsApi.importJobStatus).mockRejectedValue({ response: { status: 500 } })

    render(<BackgroundTasksWidget />)

    await waitFor(() => expect(reservationsApi.importJobStatus).toHaveBeenCalled())
    expect(useBackgroundTasksStore.getState().tasks).toHaveLength(1)
  })
})

describe('BackgroundTasksWidget — poll backstop', () => {
  it('FE-W4BGT-021: a job the server drops mid-poll ends as an error instead of spinning on', async () => {
    vi.useFakeTimers()
    useBackgroundTasksStore.setState({ tasks: [task({ status: 'running', items: undefined })] })
    vi.mocked(reservationsApi.importJobStatus)
      .mockResolvedValueOnce({ status: 'running', done: 0, total: 1 } as never)
      .mockRejectedValue({ response: { status: 404 } })

    render(<BackgroundTasksWidget />)
    await act(async () => { await vi.advanceTimersByTimeAsync(5000) })

    expect(useBackgroundTasksStore.getState().tasks[0].status).toBe('error')
    // The file parsed fine — blaming it would send the user looking for a problem
    // that isn't there.
    expect(useBackgroundTasksStore.getState().tasks[0].error).toBe('Unknown error')
  })

  it('FE-W4BGT-022: a transient poll failure leaves the job running', async () => {
    vi.useFakeTimers()
    useBackgroundTasksStore.setState({ tasks: [task({ status: 'running', items: undefined })] })
    vi.mocked(reservationsApi.importJobStatus)
      .mockResolvedValueOnce({ status: 'running', done: 0, total: 1 } as never)
      .mockRejectedValue({ response: { status: 500 } })

    render(<BackgroundTasksWidget />)
    await act(async () => { await vi.advanceTimersByTimeAsync(5000) })

    expect(useBackgroundTasksStore.getState().tasks[0].status).toBe('running')
  })
})

describe('BackgroundTasksWidget — AI retry', () => {
  const withFiles = () => task({
    items: [], sourceFiles: [new File(['%PDF'], 'voucher.pdf', { type: 'application/pdf' })],
  })

  it('FE-W4BGT-016: offers the AI retry only when the feature is on', async () => {
    vi.mocked(healthApi.features).mockResolvedValue({ aiParsing: true } as never)
    useBackgroundTasksStore.setState({ tasks: [withFiles()] })

    render(<BackgroundTasksWidget />)

    expect(await screen.findByRole('button', { name: /AI/i })).toBeInTheDocument()
  })

  it('FE-W4BGT-017: hides the retry when the feature probe fails', async () => {
    vi.mocked(healthApi.features).mockRejectedValue(new Error('down'))
    useBackgroundTasksStore.setState({ tasks: [withFiles()] })

    render(<BackgroundTasksWidget />)

    await waitFor(() => expect(healthApi.features).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: /AI/i })).toBeNull()
  })

  it('FE-W4BGT-018: hides the retry on a job that already ran with force-ai', async () => {
    vi.mocked(healthApi.features).mockResolvedValue({ aiParsing: true } as never)
    useBackgroundTasksStore.setState({ tasks: [task({ items: [], mode: 'force-ai', sourceFiles: [new File([''], 'a.pdf')] })] })

    render(<BackgroundTasksWidget />)

    await waitFor(() => expect(healthApi.features).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: /AI/i })).toBeNull()
  })

  it('FE-W4BGT-019: retrying swaps the card for the new force-ai job', async () => {
    vi.mocked(healthApi.features).mockResolvedValue({ aiParsing: true } as never)
    vi.mocked(reservationsApi.importBookingAsync).mockResolvedValue({ jobId: 'j2' } as never)
    useBackgroundTasksStore.setState({ tasks: [withFiles()] })
    render(<BackgroundTasksWidget />)

    fireEvent.click(await screen.findByRole('button', { name: /AI/i }))

    await waitFor(() => {
      const tasks = useBackgroundTasksStore.getState().tasks
      expect(tasks).toHaveLength(1)
      expect(tasks[0]).toMatchObject({ id: 'j2', mode: 'force-ai', tripId: 't1' })
    })
  })

  it('FE-W4BGT-020: a refused retry surfaces the server error on the original card', async () => {
    vi.mocked(healthApi.features).mockResolvedValue({ aiParsing: true } as never)
    vi.mocked(reservationsApi.importBookingAsync).mockRejectedValue({ response: { data: { error: 'No model configured' } } })
    useBackgroundTasksStore.setState({ tasks: [withFiles()] })
    render(<BackgroundTasksWidget />)

    fireEvent.click(await screen.findByRole('button', { name: /AI/i }))

    expect(await screen.findByText('No model configured')).toBeInTheDocument()
  })
})
