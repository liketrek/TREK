import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { collabApi } from '../../../../src/api/client'
import { addListener, removeListener } from '../../../../src/api/websocket'
import MCollabPolls from '../../../../src/mobile/screens/trip/tabs/MCollabPolls'
import type { CollabPollData, PollVoter } from '../../../../src/mobile/screens/trip/tabs/collabModel'
import type { TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { useAuthStore } from '../../../../src/store/authStore'
import { buildUser } from '../../../helpers/factories'
import { buildPlanner, buildToast } from '../../../helpers/mobileTrip'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { act, fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-POLLS-001 to FE-MOB-POLLS-024

const ME = 7

function voter(id: number, username: string, avatarUrl: string | null = null): PollVoter {
  return { id, user_id: id, username, avatar: null, avatar_url: avatarUrl }
}

function poll(overrides: Partial<CollabPollData> = {}): CollabPollData {
  return {
    id: 1,
    trip_id: 1,
    user_id: ME,
    question: 'Where to eat?',
    options: [
      { text: 'Ramen', label: 'Ramen', voters: [] },
      { text: 'Sushi', label: 'Sushi', voters: [] },
    ],
    multiple_choice: false,
    is_closed: false,
    deadline: null,
    username: 'maurice',
    avatar: null,
    avatar_url: null,
    created_at: '2026-07-01T10:00:00',
    ...overrides,
  }
}

function setup(polls: CollabPollData[], plannerOverrides: Partial<TripPlanner> = {}) {
  const toast = buildToast()
  vi.spyOn(collabApi, 'getPolls').mockResolvedValue({ polls })
  const planner = buildPlanner({ toast: toast as unknown as TripPlanner['toast'], ...plannerOverrides })
  const view = render(<MCollabPolls planner={planner} />)
  return { ...view, planner, toast }
}

/** The listener MCollabPolls registered with the (globally mocked) websocket module. */
function wsHandler() {
  const calls = vi.mocked(addListener).mock.calls
  return calls[calls.length - 1][0]
}

function deadlineInput(): HTMLInputElement {
  return document.querySelector('input[type="datetime-local"]') as HTMLInputElement
}

describe('MCollabPolls', () => {
  beforeEach(() => {
    resetAllStores()
    seedStore(useAuthStore, { user: buildUser({ id: ME, username: 'maurice' }) })
    vi.mocked(addListener).mockClear()
    vi.mocked(removeListener).mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('FE-MOB-POLLS-001: shows the loading state until the request settles', async () => {
    vi.spyOn(collabApi, 'getPolls').mockReturnValue(new Promise(() => {}))
    render(<MCollabPolls planner={buildPlanner()} />)

    expect(screen.getByText('common.loading')).toBeInTheDocument()
    expect(screen.queryByText('collab.polls.empty')).not.toBeInTheDocument()
  })

  it('FE-MOB-POLLS-002: renders the empty state and the create button for editors', async () => {
    setup([])

    expect(await screen.findByText('collab.polls.empty')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'collab.polls.new' })).toBeInTheDocument()
  })

  it('FE-MOB-POLLS-003: keeps the empty state when loading fails', async () => {
    vi.spyOn(collabApi, 'getPolls').mockRejectedValue(new Error('offline'))
    render(<MCollabPolls planner={buildPlanner()} />)

    expect(await screen.findByText('collab.polls.empty')).toBeInTheDocument()
  })

  it('FE-MOB-POLLS-004: treats a missing polls array as an empty list', async () => {
    vi.spyOn(collabApi, 'getPolls').mockResolvedValue({})
    render(<MCollabPolls planner={buildPlanner()} />)

    expect(await screen.findByText('collab.polls.empty')).toBeInTheDocument()
  })

  it('FE-MOB-POLLS-005: hides every editor control without collab_edit', async () => {
    setup([poll()], { can: vi.fn(() => false) as unknown as TripPlanner['can'] })

    expect(await screen.findByText('Where to eat?')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'collab.polls.new' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'collab.polls.close' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'collab.polls.delete' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ramen/ })).toBeDisabled()
  })

  it('FE-MOB-POLLS-006: renders question, singular vote label and the multi-choice badge', async () => {
    setup([poll({ multiple_choice: true, options: [
      { text: 'Ramen', label: 'Ramen', voters: [voter(9, 'lea')] },
      { text: 'Sushi', label: 'Sushi', voters: [] },
    ] })])

    expect(await screen.findByText('Where to eat?')).toBeInTheDocument()
    expect(screen.getByText('collab.polls.vote:1')).toBeInTheDocument()
    expect(screen.getByText('collab.polls.multiChoice')).toBeInTheDocument()
  })

  it('FE-MOB-POLLS-007: shows the deadline countdown on an active poll', async () => {
    // half a minute of slack so the floor() breakdown can't tip to 25h while the test runs
    const deadline = new Date(Date.now() + 26 * 60 * 60 * 1000 + 30_000).toISOString()
    setup([poll({ deadline })])

    expect(await screen.findByText('collab.polls.countdownDaysHours:1,2')).toBeInTheDocument()
  })

  it('FE-MOB-POLLS-008: re-renders the countdown on the 30s ticker', async () => {
    vi.useFakeTimers()
    const deadline = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    vi.spyOn(collabApi, 'getPolls').mockResolvedValue({ polls: [poll({ deadline })] })
    render(<MCollabPolls planner={buildPlanner()} />)
    await act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve() })

    expect(screen.getByText('collab.polls.countdownHoursMinutes:2,0')).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(30 * 60 * 1000) })

    expect(screen.getByText('collab.polls.countdownHoursMinutes:1,30')).toBeInTheDocument()
  })

  it('FE-MOB-POLLS-009: marks an expired poll closed and shows results with voter avatars', async () => {
    setup([poll({
      deadline: new Date(Date.now() - 60_000).toISOString(),
      options: [
        { text: 'Ramen', label: 'Ramen', voters: [voter(9, 'lea'), voter(10, 'tom', '/uploads/avatars/tom.png')] },
        { text: 'Sushi', label: 'Sushi', voters: [voter(11, 'ada')] },
      ],
    })])

    expect(await screen.findByText('collab.polls.closed')).toBeInTheDocument()
    expect(screen.getByText('collab.polls.votes:3')).toBeInTheDocument()
    // 2 of 3 votes on the winning option, 1 of 3 on the other
    expect(screen.getByText('67%')).toBeInTheDocument()
    expect(screen.getByText('33%')).toBeInTheDocument()
    expect(screen.getByText('L')).toBeInTheDocument()
    expect(document.querySelector('img[src="/uploads/avatars/tom.png"]')).toBeInTheDocument()
    // a closed poll can neither be voted on nor closed again
    expect(screen.getByRole('button', { name: /Ramen/ })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'collab.polls.close' })).not.toBeInTheDocument()
  })

  it('FE-MOB-POLLS-010: shows 0% for every option while nobody has voted', async () => {
    setup([poll({ is_closed: true })])

    expect(await screen.findByText('collab.polls.votes:0')).toBeInTheDocument()
    expect(screen.getAllByText('0%')).toHaveLength(2)
  })

  it('FE-MOB-POLLS-011: collapses the closed section behind its header', async () => {
    setup([poll({ id: 1, question: 'Active one' }), poll({ id: 2, question: 'Closed one', is_closed: true })])

    expect(await screen.findByText('Closed one')).toBeInTheDocument()
    const header = screen.getByRole('button', { name: /collab.polls.closedSection/ })
    expect(header).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(header)

    expect(screen.queryByText('Closed one')).not.toBeInTheDocument()
    expect(screen.getByText('Active one')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /collab.polls.closedSection/ })).toHaveAttribute('aria-expanded', 'false')
  })

  it('FE-MOB-POLLS-011b: deletes a poll out of the closed section', async () => {
    const deletePoll = vi.spyOn(collabApi, 'deletePoll').mockResolvedValue({})
    setup([poll({ id: 1, question: 'Active one' }), poll({ id: 2, question: 'Closed one', is_closed: true })])

    await screen.findByText('Closed one')
    // the active poll's row has the lock button in front, so the closed one owns the last trash button
    const trash = screen.getAllByRole('button', { name: 'collab.polls.delete' })
    fireEvent.click(trash[trash.length - 1])
    fireEvent.click(await screen.findByRole('button', { name: 'common.delete' }))

    await waitFor(() => expect(deletePoll).toHaveBeenCalledWith(1, 2))
    await waitFor(() => expect(screen.queryByText('Closed one')).not.toBeInTheDocument())
    expect(screen.getByText('Active one')).toBeInTheDocument()
  })

  it('FE-MOB-POLLS-012: renders closed polls without a section header when none are active', async () => {
    setup([poll({ id: 2, question: 'Closed one', is_closed: true })])

    expect(await screen.findByText('Closed one')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /collab.polls.closedSection/ })).not.toBeInTheDocument()
  })

  it('FE-MOB-POLLS-013: votes on an option and swaps in the server result', async () => {
    const voted = poll({ options: [
      { text: 'Ramen', label: 'Ramen', voters: [voter(ME, 'maurice')] },
      { text: 'Sushi', label: 'Sushi', voters: [] },
    ] })
    const votePoll = vi.spyOn(collabApi, 'votePoll').mockResolvedValue({ poll: voted })
    setup([poll()])

    fireEvent.click(await screen.findByRole('button', { name: /Ramen/ }))

    await waitFor(() => expect(votePoll).toHaveBeenCalledWith(1, 1, 0))
    expect(await screen.findByText('collab.polls.vote:1')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('FE-MOB-POLLS-014: toasts when the vote request fails', async () => {
    vi.spyOn(collabApi, 'votePoll').mockRejectedValue(new Error('boom'))
    const { toast } = setup([poll()])

    fireEvent.click(await screen.findByRole('button', { name: /Sushi/ }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('common.error'))
  })

  it('FE-MOB-POLLS-015: closes a poll from the lock button', async () => {
    const closePoll = vi.spyOn(collabApi, 'closePoll').mockResolvedValue({ poll: poll({ is_closed: true }) })
    setup([poll()])

    fireEvent.click(await screen.findByRole('button', { name: 'collab.polls.close' }))

    await waitFor(() => expect(closePoll).toHaveBeenCalledWith(1, 1))
    expect(await screen.findByText('collab.polls.closed')).toBeInTheDocument()
  })

  it('FE-MOB-POLLS-016: toasts when closing fails', async () => {
    vi.spyOn(collabApi, 'closePoll').mockRejectedValue(new Error('boom'))
    const { toast } = setup([poll()])

    fireEvent.click(await screen.findByRole('button', { name: 'collab.polls.close' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('common.error'))
    expect(screen.queryByText('collab.polls.closed')).not.toBeInTheDocument()
  })

  it('FE-MOB-POLLS-017: deletes a poll after the confirm sheet is accepted', async () => {
    const deletePoll = vi.spyOn(collabApi, 'deletePoll').mockResolvedValue({})
    setup([poll()])

    fireEvent.click(await screen.findByRole('button', { name: 'collab.polls.delete' }))
    expect(await screen.findByText('collab.polls.confirmDeleteTitle')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }))

    await waitFor(() => expect(deletePoll).toHaveBeenCalledWith(1, 1))
    await waitFor(() => expect(screen.queryByText('Where to eat?')).not.toBeInTheDocument())
  })

  it('FE-MOB-POLLS-018: keeps the poll when the confirm sheet is cancelled', async () => {
    const deletePoll = vi.spyOn(collabApi, 'deletePoll').mockResolvedValue({})
    setup([poll()])

    fireEvent.click(await screen.findByRole('button', { name: 'collab.polls.delete' }))
    fireEvent.click(await screen.findByRole('button', { name: 'common.cancel' }))

    expect(deletePoll).not.toHaveBeenCalled()
    expect(screen.getByText('Where to eat?')).toBeInTheDocument()
  })

  it('FE-MOB-POLLS-019: toasts when deleting fails', async () => {
    vi.spyOn(collabApi, 'deletePoll').mockRejectedValue(new Error('boom'))
    const { toast } = setup([poll()])

    fireEvent.click(await screen.findByRole('button', { name: 'collab.polls.delete' }))
    fireEvent.click(await screen.findByRole('button', { name: 'common.delete' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('common.error'))
    expect(screen.getByText('Where to eat?')).toBeInTheDocument()
  })

  it('FE-MOB-POLLS-020: applies created / voted / closed / deleted websocket events', async () => {
    setup([poll()])
    await screen.findByText('Where to eat?')
    const handler = wsHandler()

    act(() => handler({ type: 'collab:poll:created', tripId: '1', poll: poll({ id: 2, question: 'Which hotel?' }) }))
    expect(screen.getByText('Which hotel?')).toBeInTheDocument()

    // same id again → no duplicate row
    act(() => handler({ type: 'collab:poll:created', tripId: '1', poll: poll({ id: 2, question: 'Which hotel?' }) }))
    expect(screen.getAllByText('Which hotel?')).toHaveLength(1)

    act(() => handler({
      type: 'collab:poll:voted',
      tripId: '1',
      poll: poll({ id: 2, question: 'Which hotel?', options: [
        { text: 'Ramen', label: 'Ramen', voters: [voter(9, 'lea')] },
        { text: 'Sushi', label: 'Sushi', voters: [] },
      ] }),
    }))
    expect(screen.getByText('collab.polls.vote:1')).toBeInTheDocument()

    act(() => handler({ type: 'collab:poll:closed', tripId: '1', poll: poll({ id: 2, question: 'Which hotel?', is_closed: true }) }))
    expect(screen.getByText('collab.polls.closed')).toBeInTheDocument()

    act(() => handler({ type: 'collab:poll:deleted', tripId: '1', pollId: 2 }))
    expect(screen.queryByText('Which hotel?')).not.toBeInTheDocument()
  })

  it('FE-MOB-POLLS-021: ignores websocket events for another trip and drops the listener on unmount', async () => {
    const { unmount } = setup([poll()])
    await screen.findByText('Where to eat?')
    const handler = wsHandler()

    act(() => handler({ type: 'collab:poll:created', tripId: '99', poll: poll({ id: 3, question: 'Other trip' }) }))
    expect(screen.queryByText('Other trip')).not.toBeInTheDocument()

    unmount()
    expect(removeListener).toHaveBeenCalledWith(handler)
  })

  it('FE-MOB-POLLS-022: creates a poll with question, options, multi-choice and deadline', async () => {
    const created = poll({ id: 5, question: 'Which hotel?' })
    const createPoll = vi.spyOn(collabApi, 'createPoll').mockResolvedValue({ poll: created })
    setup([])

    fireEvent.click(await screen.findByRole('button', { name: 'collab.polls.new' }))
    fireEvent.change(await screen.findByPlaceholderText('collab.polls.questionPlaceholder'), { target: { value: '  Which hotel?  ' } })
    fireEvent.change(screen.getByPlaceholderText('collab.polls.optionPlaceholder:1'), { target: { value: 'Ryokan' } })
    fireEvent.change(screen.getByPlaceholderText('collab.polls.optionPlaceholder:2'), { target: { value: ' Capsule ' } })
    fireEvent.click(screen.getByRole('button', { name: 'collab.polls.multiChoice' }))
    fireEvent.change(deadlineInput(), { target: { value: '2026-08-01T12:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'collab.polls.create' }))

    await waitFor(() => expect(createPoll).toHaveBeenCalledWith(1, {
      question: 'Which hotel?',
      options: ['Ryokan', 'Capsule'],
      multiple: true,
      multiple_choice: true,
      deadline: new Date('2026-08-01T12:00').toISOString(),
    }))
    expect(await screen.findByText('Which hotel?')).toBeInTheDocument()
  })

  it('FE-MOB-POLLS-023: gates the submit button on a question plus two non-blank options', async () => {
    setup([])

    fireEvent.click(await screen.findByRole('button', { name: 'collab.polls.new' }))
    const submit = await screen.findByRole('button', { name: 'collab.polls.create' })
    expect(submit).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('collab.polls.questionPlaceholder'), { target: { value: '   ' } })
    fireEvent.change(screen.getByPlaceholderText('collab.polls.optionPlaceholder:1'), { target: { value: 'A' } })
    fireEvent.change(screen.getByPlaceholderText('collab.polls.optionPlaceholder:2'), { target: { value: 'B' } })
    expect(submit).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('collab.polls.questionPlaceholder'), { target: { value: 'Q' } })
    expect(submit).toBeEnabled()

    // blank options don't count towards the two-option minimum
    fireEvent.change(screen.getByPlaceholderText('collab.polls.optionPlaceholder:2'), { target: { value: '   ' } })
    expect(submit).toBeDisabled()
  })

  it('FE-MOB-POLLS-024: adds, removes and clears the form fields', async () => {
    setup([])

    fireEvent.click(await screen.findByRole('button', { name: 'collab.polls.new' }))
    expect(screen.queryByRole('button', { name: 'common.delete' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /collab.polls.addOption/ }))
    expect(screen.getByPlaceholderText('collab.polls.optionPlaceholder:3')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'common.delete' })).toHaveLength(3)

    fireEvent.click(screen.getAllByRole('button', { name: 'common.delete' })[0])
    expect(screen.queryByPlaceholderText('collab.polls.optionPlaceholder:3')).not.toBeInTheDocument()

    fireEvent.change(deadlineInput(), { target: { value: '2026-08-01T12:00' } })
    expect(deadlineInput()).toHaveValue('2026-08-01T12:00')
    fireEvent.click(screen.getByRole('button', { name: 'collab.polls.clearDeadline' }))
    expect(deadlineInput()).toHaveValue('')
  })

  it('FE-MOB-POLLS-025: keeps the form open and toasts when creating fails', async () => {
    vi.spyOn(collabApi, 'createPoll').mockRejectedValue(new Error('boom'))
    const { toast } = setup([])

    fireEvent.click(await screen.findByRole('button', { name: 'collab.polls.new' }))
    fireEvent.change(await screen.findByPlaceholderText('collab.polls.questionPlaceholder'), { target: { value: 'Q' } })
    fireEvent.change(screen.getByPlaceholderText('collab.polls.optionPlaceholder:1'), { target: { value: 'A' } })
    fireEvent.change(screen.getByPlaceholderText('collab.polls.optionPlaceholder:2'), { target: { value: 'B' } })
    fireEvent.click(screen.getByRole('button', { name: 'collab.polls.create' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('common.error'))
    expect(screen.getByRole('button', { name: 'collab.polls.create' })).toBeInTheDocument()
  })

  it('FE-MOB-POLLS-026: resets the form fields on every reopen', async () => {
    setup([])

    fireEvent.click(await screen.findByRole('button', { name: 'collab.polls.new' }))
    fireEvent.change(await screen.findByPlaceholderText('collab.polls.questionPlaceholder'), { target: { value: 'Draft' } })
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))

    fireEvent.click(screen.getByRole('button', { name: 'collab.polls.new' }))

    await waitFor(() => expect(screen.getByPlaceholderText('collab.polls.questionPlaceholder')).toHaveValue(''))
  })
})
