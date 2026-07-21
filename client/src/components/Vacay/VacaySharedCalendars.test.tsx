import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../../tests/helpers/render'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { useVacayStore } from '../../store/vacayStore'
import { server } from '../../../tests/helpers/msw/server'
import { http, HttpResponse } from 'msw'
import VacaySharedCalendars from './VacaySharedCalendars'

// ── MSW handler helpers ───────────────────────────────────────────────────────

function withShareUsers() {
  server.use(
    http.get('/api/addons/vacay/shares/available-users', () =>
      HttpResponse.json({ users: [{ id: 2, username: 'Bob' }] })
    )
  )
}

// ── Store seed helpers ────────────────────────────────────────────────────────

function seedShares(overrides: Record<string, unknown> = {}) {
  seedStore(useVacayStore, {
    outgoingShares: [],
    incomingShares: [],
    ...overrides,
  })
}

const incoming = { id: 7, owner_id: 3, username: 'Carol', color: '#ec4899', hidden: false }

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  resetAllStores()
})

describe('VacaySharedCalendars', () => {
  it('FE-COMP-VACAYSHARED-001: Renders empty hint when nothing is shared', () => {
    seedShares()

    render(<VacaySharedCalendars />)

    expect(document.body).toHaveTextContent('Show each other your calendars without merging them.')
  })

  it('FE-COMP-VACAYSHARED-002: Renders incoming share with view-only badge', () => {
    seedShares({ incomingShares: [incoming] })

    render(<VacaySharedCalendars />)

    expect(document.body).toHaveTextContent('Carol')
    expect(document.body).toHaveTextContent('view only')
  })

  it('FE-COMP-VACAYSHARED-003: Row click hides a visible share via setShareHidden', async () => {
    const setShareHiddenMock = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    seedShares({ incomingShares: [incoming], setShareHidden: setShareHiddenMock })

    render(<VacaySharedCalendars />)

    // Clicking the username bubbles up to the row's onClick toggle
    await user.click(screen.getByText('Carol'))

    expect(setShareHiddenMock).toHaveBeenCalledWith(7, true)
  })

  it('FE-COMP-VACAYSHARED-004: Hidden share row toggles back to visible', async () => {
    const setShareHiddenMock = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    seedShares({ incomingShares: [{ ...incoming, hidden: true }], setShareHidden: setShareHiddenMock })

    render(<VacaySharedCalendars />)

    await user.click(screen.getByTitle('Show in calendar'))

    expect(setShareHiddenMock).toHaveBeenCalledWith(7, false)
  })

  it('FE-COMP-VACAYSHARED-005: Remove button on incoming row calls removeShare', async () => {
    const removeShareMock = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    seedShares({ incomingShares: [incoming], removeShare: removeShareMock })

    render(<VacaySharedCalendars />)

    await user.click(screen.getByRole('button', { name: 'Remove' }))

    expect(removeShareMock).toHaveBeenCalledWith(7)
  })

  it('FE-COMP-VACAYSHARED-006: Outgoing section lists recipients with stop sharing', async () => {
    const removeShareMock = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    seedShares({
      outgoingShares: [{ id: 9, user_id: 2, username: 'Bob' }],
      removeShare: removeShareMock,
    })

    render(<VacaySharedCalendars />)

    expect(document.body).toHaveTextContent('You share with')
    expect(document.body).toHaveTextContent('Bob')

    await user.click(screen.getByRole('button', { name: /stop sharing/i }))

    expect(removeShareMock).toHaveBeenCalledWith(9)
  })

  it('FE-COMP-VACAYSHARED-007: Share modal fetches users and shares with the selected one', async () => {
    withShareUsers()
    const shareWithMock = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    seedShares({ shareWith: shareWithMock })

    render(<VacaySharedCalendars />)

    // Open the share modal via the header button
    await user.click(screen.getByTitle('Share calendar'))

    expect(screen.getByRole('heading', { name: 'Share calendar' })).toBeInTheDocument()

    // Wait for MSW to respond and the CustomSelect trigger to appear
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /select user/i })).toBeInTheDocument()
    )

    // Open dropdown and select Bob
    await user.click(screen.getByRole('button', { name: /select user/i }))
    await waitFor(() => expect(screen.getByText('Bob')).toBeInTheDocument())
    await user.click(screen.getByText('Bob'))

    await user.click(screen.getByRole('button', { name: /^share$/i }))

    expect(shareWithMock).toHaveBeenCalledWith(2)
  })
})
