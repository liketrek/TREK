// FE-JRN-INVITE-001 to FE-JRN-INVITE-014

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, act } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import ContributorInviteDialog from './ContributorInviteDialog'

type ToastKind = 'success' | 'error' | 'warning' | 'info'

const toastSpy = vi.fn((_message: string, _type?: ToastKind, _duration?: number) => 0)

const users = [
  { id: 1, username: 'maurice', email: 'maurice@example.com' },
  { id: 2, username: 'julien', email: 'julien@trek.dev' },
  { id: 3, username: 'anna', email: 'anna@example.com' },
]

function mountDialog(props: Partial<React.ComponentProps<typeof ContributorInviteDialog>> = {}) {
  const onClose = vi.fn()
  const onInvited = vi.fn()
  render(
    <ContributorInviteDialog
      journeyId={4}
      existingUserIds={[]}
      onClose={onClose}
      onInvited={onInvited}
      {...props}
    />,
  )
  return { onClose, onInvited }
}

beforeEach(() => {
  toastSpy.mockClear()
  window.__addToast = toastSpy
  server.use(http.get('/api/auth/users', () => HttpResponse.json({ users })))
})

afterEach(() => {
  delete window.__addToast
})

describe('ContributorInviteDialog', () => {
  it('FE-JRN-INVITE-001: lists every selectable user returned by the API', async () => {
    mountDialog()

    expect(await screen.findByText('maurice')).toBeInTheDocument()
    expect(screen.getByText('julien@trek.dev')).toBeInTheDocument()
    expect(screen.getByText('anna')).toBeInTheDocument()
  })

  it('FE-JRN-INVITE-002: hides users that already contribute to the journey', async () => {
    mountDialog({ existingUserIds: [1, 3] })

    expect(await screen.findByText('julien')).toBeInTheDocument()
    expect(screen.queryByText('maurice')).not.toBeInTheDocument()
    expect(screen.queryByText('anna')).not.toBeInTheDocument()
  })

  it('FE-JRN-INVITE-003: filters the list by username', async () => {
    const user = userEvent.setup()
    mountDialog()
    await screen.findByText('maurice')

    await user.type(screen.getByPlaceholderText('Username or email...'), 'jul')

    expect(screen.getByText('julien')).toBeInTheDocument()
    expect(screen.queryByText('maurice')).not.toBeInTheDocument()
  })

  it('FE-JRN-INVITE-004: filters the list by email address', async () => {
    const user = userEvent.setup()
    mountDialog()
    await screen.findByText('maurice')

    await user.type(screen.getByPlaceholderText('Username or email...'), 'trek.dev')

    expect(screen.getByText('julien')).toBeInTheDocument()
    expect(screen.queryByText('anna')).not.toBeInTheDocument()
  })

  it('FE-JRN-INVITE-005: shows the empty hint when nothing matches the search', async () => {
    const user = userEvent.setup()
    mountDialog()
    await screen.findByText('maurice')

    await user.type(screen.getByPlaceholderText('Username or email...'), 'nobody')

    expect(screen.getByText('No users found')).toBeInTheDocument()
  })

  it('FE-JRN-INVITE-006: keeps the invite button disabled until a user is selected', async () => {
    const user = userEvent.setup()
    mountDialog()
    const row = await screen.findByText('julien')

    const inviteBtn = screen.getByRole('button', { name: 'Invite' })
    expect(inviteBtn).toBeDisabled()

    await user.click(row)
    expect(inviteBtn).toBeEnabled()
  })

  it('FE-JRN-INVITE-007: defaults the role to viewer and switches to editor on click', async () => {
    const user = userEvent.setup()
    mountDialog()
    await screen.findByText('maurice')

    const viewerBtn = screen.getByRole('button', { name: 'Viewer' })
    const editorBtn = screen.getByRole('button', { name: 'Editor' })
    expect(viewerBtn).toHaveAttribute('aria-pressed', 'true')
    expect(editorBtn).toHaveAttribute('aria-pressed', 'false')

    await user.click(editorBtn)
    expect(editorBtn).toHaveAttribute('aria-pressed', 'true')
    expect(viewerBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('FE-JRN-INVITE-008: posts the selected user and role, then reports success', async () => {
    const bodies: Record<string, unknown>[] = []
    server.use(http.post('/api/journeys/4/contributors', async ({ request }) => {
      bodies.push(await request.json() as Record<string, unknown>)
      return HttpResponse.json({ ok: true })
    }))
    const user = userEvent.setup()
    const { onInvited } = mountDialog()

    await user.click(await screen.findByText('julien'))
    await user.click(screen.getByRole('button', { name: 'Editor' }))
    await user.click(screen.getByRole('button', { name: 'Invite' }))

    await waitFor(() => expect(onInvited).toHaveBeenCalledTimes(1))
    expect(bodies[0]).toEqual({ user_id: 2, role: 'editor' })
    expect(toastSpy).toHaveBeenCalledWith('Contributor added', 'success', undefined)
  })

  it('FE-JRN-INVITE-009: reports a failed invite without notifying the parent', async () => {
    server.use(http.post('/api/journeys/4/contributors', () => new HttpResponse(null, { status: 403 })))
    const user = userEvent.setup()
    const { onInvited } = mountDialog()

    await user.click(await screen.findByText('anna'))
    await user.click(screen.getByRole('button', { name: 'Invite' }))

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith('Failed to add contributor', 'error', undefined)
    })
    expect(onInvited).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Invite' })).toBeEnabled()
  })

  it('FE-JRN-INVITE-010: closes on both the header and the footer cancel button', async () => {
    const user = userEvent.setup()
    const { onClose } = mountDialog()
    await screen.findByText('maurice')

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    act(() => { screen.getByRole('button', { name: 'Close' }).click() })
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('FE-JRN-INVITE-011: renders the empty hint when the user list cannot be fetched', async () => {
    server.use(http.get('/api/auth/users', () => new HttpResponse(null, { status: 500 })))
    mountDialog()

    expect(await screen.findByText('No users found')).toBeInTheDocument()
  })

  it('FE-JRN-INVITE-012: Escape closes the dialog and goes no further, so the settings under it stay open', async () => {
    const underneath = vi.fn()
    document.addEventListener('keydown', underneath)
    try {
      const user = userEvent.setup()
      const { onClose } = mountDialog()
      await screen.findByText('maurice')

      await user.keyboard('{Escape}')

      expect(onClose).toHaveBeenCalledTimes(1)
      expect(underneath).not.toHaveBeenCalled()
    } finally {
      document.removeEventListener('keydown', underneath)
    }
  })
})

describe('ContributorInviteDialog on a phone', () => {
  let width: number
  beforeEach(() => {
    width = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true, writable: true })
  })
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
  })

  it('FE-JRN-INVITE-013: keeps the panel it had, with the filled role button and the header close', async () => {
    const user = userEvent.setup()
    const { onClose, onInvited } = mountDialog()
    await screen.findByText('maurice')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const viewerBtn = screen.getByRole('button', { name: 'Viewer' })
    const editorBtn = screen.getByRole('button', { name: 'Editor' })
    expect(viewerBtn.className).toContain('bg-zinc-900')
    expect(editorBtn.className).not.toContain('bg-zinc-900')

    await user.click(editorBtn)
    expect(editorBtn.className).toContain('bg-zinc-900')
    expect(viewerBtn.className).not.toContain('bg-zinc-900')

    // The header close button carries only an icon, so it is addressed by position.
    const headerClose = screen.getByRole('heading', { name: 'Invite Contributor' })
      .parentElement!.querySelector('button')!
    act(() => { headerClose.click() })
    expect(onClose).toHaveBeenCalledTimes(1)

    // Escape is the desktop's: the phone panel never had it.
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onInvited).not.toHaveBeenCalled()
  })

  it('FE-JRN-INVITE-014: filters, selects and invites through the same state as the desktop', async () => {
    const bodies: Record<string, unknown>[] = []
    server.use(http.post('/api/journeys/4/contributors', async ({ request }) => {
      bodies.push(await request.json() as Record<string, unknown>)
      return HttpResponse.json({ ok: true })
    }))
    const user = userEvent.setup()
    const { onInvited } = mountDialog({ existingUserIds: [1] })
    await screen.findByText('julien')

    await user.type(screen.getByPlaceholderText('Username or email...'), 'zzz')
    expect(screen.getByText('No users found')).toBeInTheDocument()
    await user.clear(screen.getByPlaceholderText('Username or email...'))

    const inviteBtn = screen.getByRole('button', { name: 'Invite' })
    expect(inviteBtn).toBeDisabled()
    await user.click(screen.getByText('anna'))
    await user.click(inviteBtn)

    await waitFor(() => expect(onInvited).toHaveBeenCalledTimes(1))
    expect(bodies[0]).toEqual({ user_id: 3, role: 'viewer' })
  })
})
