// FE-COMP-VCYSHR-001 to FE-COMP-VCYSHR-006
import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { render, screen, fireEvent, waitFor, within } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import { resetAllStores } from '../../../tests/helpers/store'
import { useVacayStore } from '../../store/vacayStore'
import VacaySharedCalendars from './VacaySharedCalendars'

const toasts: { type: string; message: string }[] = []

function candidatesRespond(users: { id: number; username: string; email: string }[]) {
  server.use(http.get('/api/addons/vacay/shares/available-users', () => HttpResponse.json({ users })))
}

beforeEach(() => {
  resetAllStores()
  toasts.length = 0
  window.__addToast = ((message: string, type?: string) => {
    toasts.push({ type: type ?? 'info', message })
    return 1
  }) as Window['__addToast']
  candidatesRespond([{ id: 2, username: 'bob', email: 'bob@trek.app' }])
})

afterEach(() => {
  delete window.__addToast
})

describe('VacaySharedCalendars errors', () => {
  it('FE-COMP-VCYSHR-001: sharing posts the picked user and closes the modal', async () => {
    let shared: number | undefined
    server.use(http.post('/api/addons/vacay/shares', async ({ request }) => {
      shared = ((await request.json()) as { user_id: number }).user_id
      return HttpResponse.json({ success: true })
    }))
    render(<VacaySharedCalendars />)

    fireEvent.click(screen.getByTitle('Share calendar'))
    fireEvent.click(await screen.findByRole('button', { name: 'Select user' }))
    fireEvent.click(screen.getByRole('button', { name: 'bob' }))
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))

    await waitFor(() => expect(shared).toBe(2))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Select user' })).not.toBeInTheDocument())
    expect(toasts).toEqual([{ type: 'success', message: 'Calendar shared' }])
  })

  it('FE-COMP-VCYSHR-002: a rejected share is reported', async () => {
    server.use(http.post('/api/addons/vacay/shares', () =>
      HttpResponse.json({ error: 'Already shared' }, { status: 409 })))
    render(<VacaySharedCalendars />)

    fireEvent.click(screen.getByTitle('Share calendar'))
    fireEvent.click(await screen.findByRole('button', { name: 'Select user' }))
    fireEvent.click(screen.getByRole('button', { name: 'bob' }))
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))

    await waitFor(() => expect(toasts).toEqual([{ type: 'error', message: 'Already shared' }]))
  })

  it('FE-COMP-VCYSHR-003: a failing hide toggle reports instead of silently reverting', async () => {
    const setShareHidden = vi.fn(async (_id: number, _hidden: boolean) => {
      throw { response: { data: { error: 'Share vanished' } }, message: 'nope' }
    })
    useVacayStore.setState({
      incomingShares: [{ id: 5, owner_id: 3, username: 'carol', color: '#f59e0b', hidden: false }],
      setShareHidden,
    })
    render(<VacaySharedCalendars />)

    fireEvent.click(screen.getByTitle('Hide from calendar'))
    expect(setShareHidden).toHaveBeenCalledWith(5, true)
    await waitFor(() => expect(toasts).toEqual([{ type: 'error', message: 'Share vanished' }]))
  })

  it('FE-COMP-VCYSHR-004: both share directions can be revoked and report failures', async () => {
    const removeShare = vi.fn(async (_id: number) => { throw { status: 500 } })
    useVacayStore.setState({
      incomingShares: [{ id: 5, owner_id: 3, username: 'carol', color: '#f59e0b', hidden: true }],
      outgoingShares: [{ id: 11, user_id: 8, username: 'erin' }],
      removeShare,
    })
    render(<VacaySharedCalendars />)

    fireEvent.click(screen.getByTitle('Remove'))
    fireEvent.click(screen.getByRole('button', { name: 'Stop sharing' }))

    expect(removeShare).toHaveBeenNthCalledWith(1, 5)
    expect(removeShare).toHaveBeenNthCalledWith(2, 11)
    await waitFor(() => expect(toasts).toHaveLength(2))
    expect(toasts[0].message).toBe('Could not share calendar')
  })

  it('FE-COMP-VCYSHR-005: the share modal closes through the backdrop, the X and Cancel', async () => {
    render(<VacaySharedCalendars />)

    fireEvent.click(screen.getByTitle('Share calendar'))
    const hint = await screen.findByRole('button', { name: 'Share' })
    fireEvent.click(hint.closest('.fixed') as HTMLElement)
    expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByTitle('Share calendar'))
    const header = (await screen.findByText('Share calendar')).closest('.justify-between') as HTMLElement
    fireEvent.click(within(header).getByRole('button'))
    expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByTitle('Share calendar'))
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument()
  })

  it('FE-COMP-VCYSHR-006: with nobody left to share with the modal says so', async () => {
    candidatesRespond([])
    render(<VacaySharedCalendars />)

    fireEvent.click(screen.getByTitle('Share calendar'))
    expect(await screen.findByText('No users available')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Share' })).toBeDisabled()
  })
})
