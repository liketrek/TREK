// FE-COMP-VCYPERS-001 to FE-COMP-VCYPERS-007
import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { render, screen, fireEvent, waitFor, within } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import { resetAllStores } from '../../../tests/helpers/store'
import { useVacayStore } from '../../store/vacayStore'
import { useAuthStore } from '../../store/authStore'
import VacayPersons from './VacayPersons'

const toasts: { type: string; message: string }[] = []

function availableRespond(users: { id: number; username: string; email: string }[]) {
  server.use(http.get('/api/addons/vacay/available-users', () => HttpResponse.json({ users })))
}

beforeEach(() => {
  resetAllStores()
  toasts.length = 0
  window.__addToast = ((message: string, type?: string) => {
    toasts.push({ type: type ?? 'info', message })
    return 1
  }) as Window['__addToast']
  availableRespond([{ id: 2, username: 'bob', email: 'bob@trek.app' }])
  useAuthStore.setState({ user: { id: 1, username: 'alice', email: 'a@t.app', role: 'user' } as never })
  useVacayStore.setState({ users: [{ id: 1, username: 'alice', color: '#3b82f6' }], selectedUserId: null })
})

afterEach(() => {
  delete window.__addToast
})

/** The invite trigger is an unlabelled icon button in the card header. */
function openInvite() {
  const header = screen.getByText('Persons').closest('.justify-between') as HTMLElement
  fireEvent.click(within(header).getByRole('button'))
}

describe('VacayPersons modals', () => {
  it('FE-COMP-VCYPERS-001: the active person defaults to the signed-in user', async () => {
    render(<VacayPersons />)

    await waitFor(() => expect(useVacayStore.getState().selectedUserId).toBe(1))
  })

  it('FE-COMP-VCYPERS-002: sending an invite posts the picked user', async () => {
    let invited: number | undefined
    server.use(http.post('/api/addons/vacay/invite', async ({ request }) => {
      invited = ((await request.json()) as { user_id: number }).user_id
      return HttpResponse.json({ success: true })
    }))
    render(<VacayPersons />)

    openInvite()
    fireEvent.click(await screen.findByRole('button', { name: 'Select user' }))
    fireEvent.click(screen.getByRole('button', { name: 'bob (bob@trek.app)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }))

    await waitFor(() => expect(invited).toBe(2))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Send Invite' })).not.toBeInTheDocument())
  })

  it('FE-COMP-VCYPERS-003: a rejected invite is reported and keeps the modal open', async () => {
    server.use(http.post('/api/addons/vacay/invite', () =>
      HttpResponse.json({ error: 'Already invited' }, { status: 409 })))
    render(<VacayPersons />)

    openInvite()
    fireEvent.click(await screen.findByRole('button', { name: 'Select user' }))
    fireEvent.click(screen.getByRole('button', { name: 'bob (bob@trek.app)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }))

    await waitFor(() => expect(toasts).toEqual([{ type: 'error', message: 'Already invited' }]))
    expect(screen.getByRole('button', { name: 'Send Invite' })).toBeInTheDocument()
  })

  it('FE-COMP-VCYPERS-004: the invite modal closes through the backdrop, the X and Cancel', async () => {
    render(<VacayPersons />)

    openInvite()
    const modal = await screen.findByText('Invite another TREK user to share a combined vacation calendar.')
    fireEvent.click(modal.closest('.fixed') as HTMLElement)
    expect(screen.queryByRole('button', { name: 'Send Invite' })).not.toBeInTheDocument()

    openInvite()
    const header = (await screen.findByText('Invite User')).closest('.justify-between') as HTMLElement
    fireEvent.click(within(header).getByRole('button'))
    expect(screen.queryByRole('button', { name: 'Send Invite' })).not.toBeInTheDocument()

    openInvite()
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('button', { name: 'Send Invite' })).not.toBeInTheDocument()
  })

  it('FE-COMP-VCYPERS-005: with nobody left to invite the modal says so', async () => {
    availableRespond([])
    render(<VacayPersons />)

    openInvite()
    expect(await screen.findByText('No users available')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Invite' })).toBeDisabled()
  })

  it('FE-COMP-VCYPERS-006: pending invites can be withdrawn from the list', () => {
    const cancelInvite = vi.fn(async (_userId: number) => {})
    useVacayStore.setState({ pendingInvites: [{ user_id: 9, username: 'dan' }], cancelInvite })
    render(<VacayPersons />)

    const row = screen.getByText('dan').closest('.group') as HTMLElement
    fireEvent.click(within(row).getByRole('button', { name: 'Cancel' }))
    expect(cancelInvite).toHaveBeenCalledWith(9)
  })

  it('FE-COMP-VCYPERS-007: the color picker opens from a person dot and closes both ways', async () => {
    const updateColor = vi.fn(async (_color: string, _target?: number) => {})
    useVacayStore.setState({ updateColor })
    render(<VacayPersons />)

    fireEvent.click(screen.getByTitle('Change color'))
    const heading = await screen.findByText('Change color')
    fireEvent.click(within(heading.closest('.justify-between') as HTMLElement).getByRole('button'))
    expect(screen.queryByText('Change color', { selector: 'h2' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByTitle('Change color'))
    const dialog = await screen.findByText('Change color', { selector: 'h2' })
    fireEvent.click(dialog.closest('.fixed') as HTMLElement)
    expect(screen.queryByText('Change color', { selector: 'h2' })).not.toBeInTheDocument()
  })
})
