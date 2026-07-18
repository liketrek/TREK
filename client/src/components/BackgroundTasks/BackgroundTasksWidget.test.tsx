import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../../tests/helpers/render'
import { useBackgroundTasksStore, type BackgroundImportTask } from '../../store/backgroundTasksStore'
import BackgroundTasksWidget from './BackgroundTasksWidget'

vi.mock('../../api/websocket', () => ({ addListener: vi.fn(), removeListener: vi.fn() }))
vi.mock('../../api/client', () => ({
  // Keep the rehydrate/poll backstops pending so the seeded state is what renders.
  reservationsApi: { importJobStatus: vi.fn(() => new Promise(() => {})) },
}))

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

beforeEach(() => {
  vi.clearAllMocks()
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
})
