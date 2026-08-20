import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../../tests/helpers/render'
import { reservationsApi, healthApi } from '../../api/client'
import { saveImportFiles } from '../../db/offlineDb'
import { useBackgroundTasksStore, type BackgroundImportTask } from '../../store/backgroundTasksStore'
import BackgroundTasksWidget from './BackgroundTasksWidget'

vi.mock('../../api/websocket', () => ({ addListener: vi.fn(), removeListener: vi.fn() }))
vi.mock('../../api/client', () => ({
  // Keep the rehydrate/poll backstops pending so the seeded state is what renders.
  reservationsApi: { importJobStatus: vi.fn(() => new Promise(() => {})), importBookingAsync: vi.fn() },
  healthApi: { features: vi.fn() },
}))
vi.mock('../../db/offlineDb', () => ({ saveImportFiles: vi.fn(() => Promise.resolve()) }))

const task = (overrides: Partial<BackgroundImportTask> = {}): BackgroundImportTask => ({
  id: 'j1',
  tripId: 't1',
  label: 'voucher.pdf',
  status: 'done',
  done: 0,
  total: 1,
  items: [],
  warnings: [],
  ...overrides,
})

const pdf = () => new File(['%PDF'], 'voucher.pdf', { type: 'application/pdf' })

beforeEach(() => {
  vi.clearAllMocks()
  // Like the poll backstop above: leave the feature probe pending so tests that don't care
  // about the AI retry render the same widget they did before the button existed.
  vi.mocked(healthApi.features).mockReturnValue(new Promise(() => {}))
  vi.mocked(saveImportFiles).mockResolvedValue(undefined)
  useBackgroundTasksStore.setState({ tasks: [] })
})

describe('BackgroundTasksWidget', () => {
  it('shows the warnings when a finished job produced no items', () => {
    const warning = 'voucher.pdf: AI parsing failed — LLM request failed (400): response_format unsupported'
    useBackgroundTasksStore.setState({ tasks: [task({ warnings: [warning] })] })
    render(<BackgroundTasksWidget />)
    expect(screen.getByText('No reservations could be extracted from the uploaded files.')).toBeInTheDocument()
    expect(screen.getByText(warning)).toBeInTheDocument()
  })

  it('shows only the empty-preview note when there are no warnings', () => {
    useBackgroundTasksStore.setState({ tasks: [task()] })
    render(<BackgroundTasksWidget />)
    expect(screen.getByText('No reservations could be extracted from the uploaded files.')).toBeInTheDocument()
    expect(screen.queryByText(/AI parsing failed/)).not.toBeInTheDocument()
  })

  describe('AI retry', () => {
    it('offers the retry on an empty result once the addon reports AI parsing', async () => {
      vi.mocked(healthApi.features).mockResolvedValue({ bookingImport: true, aiParsing: true })
      useBackgroundTasksStore.setState({ tasks: [task({ sourceFiles: [pdf()] })] })
      render(<BackgroundTasksWidget />)
      expect(await screen.findByRole('button', { name: 'Try AI parsing' })).toBeInTheDocument()
    })

    it('stays hidden when the addon is off, the files are gone, or the run was already force-ai', async () => {
      vi.mocked(healthApi.features).mockResolvedValue({ bookingImport: true, aiParsing: false })
      useBackgroundTasksStore.setState({ tasks: [task({ sourceFiles: [pdf()] })] })
      const { unmount } = render(<BackgroundTasksWidget />)
      await waitFor(() => expect(healthApi.features).toHaveBeenCalled())
      expect(screen.queryByRole('button', { name: 'Try AI parsing' })).not.toBeInTheDocument()
      unmount()

      vi.mocked(healthApi.features).mockResolvedValue({ bookingImport: true, aiParsing: true })
      // Rehydrated from storage: sourceFiles can't survive a reload, so there is nothing to resend.
      useBackgroundTasksStore.setState({ tasks: [task()] })
      const withoutFiles = render(<BackgroundTasksWidget />)
      await waitFor(() => expect(healthApi.features).toHaveBeenCalledTimes(2))
      expect(screen.queryByRole('button', { name: 'Try AI parsing' })).not.toBeInTheDocument()
      withoutFiles.unmount()

      useBackgroundTasksStore.setState({ tasks: [task({ sourceFiles: [pdf()], mode: 'force-ai' })] })
      render(<BackgroundTasksWidget />)
      await waitFor(() => expect(healthApi.features).toHaveBeenCalledTimes(3))
      expect(screen.queryByRole('button', { name: 'Try AI parsing' })).not.toBeInTheDocument()
    })

    it('re-submits the files with force-ai, keeps them for the review and replaces the task', async () => {
      const file = pdf()
      vi.mocked(healthApi.features).mockResolvedValue({ bookingImport: true, aiParsing: true })
      vi.mocked(reservationsApi.importBookingAsync).mockResolvedValue({ jobId: 'j2' })
      useBackgroundTasksStore.setState({ tasks: [task({ sourceFiles: [file] })] })
      render(<BackgroundTasksWidget />)

      await userEvent.click(await screen.findByRole('button', { name: 'Try AI parsing' }))

      expect(reservationsApi.importBookingAsync).toHaveBeenCalledWith('t1', [file], 'force-ai')
      // Without this the reviewed bookings lose their source document after a reload.
      await waitFor(() => expect(saveImportFiles).toHaveBeenCalledWith('j2', [file]))
      await waitFor(() => {
        const tasks = useBackgroundTasksStore.getState().tasks
        expect(tasks).toHaveLength(1)
        expect(tasks[0]).toMatchObject({ id: 'j2', tripId: 't1', status: 'running', mode: 'force-ai' })
      })
    })

    it('keeps the task and surfaces the server error when the retry is rejected', async () => {
      vi.mocked(healthApi.features).mockResolvedValue({ bookingImport: true, aiParsing: true })
      vi.mocked(reservationsApi.importBookingAsync).mockRejectedValue({ response: { data: { error: 'No AI model configured' } } })
      useBackgroundTasksStore.setState({ tasks: [task({ sourceFiles: [pdf()] })] })
      render(<BackgroundTasksWidget />)

      await userEvent.click(await screen.findByRole('button', { name: 'Try AI parsing' }))

      expect(await screen.findByText('No AI model configured')).toBeInTheDocument()
      const tasks = useBackgroundTasksStore.getState().tasks
      expect(tasks).toHaveLength(1)
      expect(tasks[0]).toMatchObject({ id: 'j1', status: 'error' })
      expect(saveImportFiles).not.toHaveBeenCalled()
    })

    it('ignores a second click while the first retry is still in flight', async () => {
      vi.mocked(healthApi.features).mockResolvedValue({ bookingImport: true, aiParsing: true })
      // Never settles: the retry stays in flight for the whole test.
      vi.mocked(reservationsApi.importBookingAsync).mockReturnValue(new Promise<{ jobId: string }>(() => {}))
      useBackgroundTasksStore.setState({ tasks: [task({ sourceFiles: [pdf()] })] })
      render(<BackgroundTasksWidget />)

      const button = await screen.findByRole('button', { name: 'Try AI parsing' })
      await userEvent.click(button)
      await waitFor(() => expect(button).toBeDisabled())
      await userEvent.click(button)

      expect(reservationsApi.importBookingAsync).toHaveBeenCalledTimes(1)
    })
  })

  /*
   * Warnings used to appear only when nothing at all was found, so a partly
   * understood import dropped whatever it could not place without a word — a
   * station the geocoder could not locate, say (#1969), whose endpoint then
   * disappeared on save.
   */
  it('shows the warnings on a job that did produce items', () => {
    const warning = 'voucher.pdf: could not locate "Curbside Pickup Counter 7" — set it manually before saving'
    useBackgroundTasksStore.setState({
      tasks: [task({ items: [{ id: 1 } as never], warnings: [warning] })],
    })
    render(<BackgroundTasksWidget />)
    expect(screen.getByText(new RegExp('Curbside Pickup Counter 7'))).toBeInTheDocument()
    // and the import button is still there — the job did find something
    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument()
  })
})
