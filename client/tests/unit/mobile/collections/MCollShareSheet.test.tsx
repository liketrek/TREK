import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import type { CollectionMember } from '@trek/shared'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'
import MCollShareSheet from '../../../../src/mobile/screens/collections/MCollShareSheet'
import { collectionsApi } from '../../../../src/api/collections'
import { useCollectionStore } from '../../../../src/store/collectionStore'
import { useAuthStore } from '../../../../src/store/authStore'
import { buildUser } from '../../../helpers/factories'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { useTranslation } from '../../../../src/i18n'

// FE-MOB-CSHARE-001 to FE-MOB-CSHARE-021

type Props = ComponentProps<typeof MCollShareSheet>

const OWNER: CollectionMember = { user_id: 1, username: 'maurice', email: 'm@example.com', status: 'accepted', is_owner: true }
const EDITOR: CollectionMember = { user_id: 2, username: 'julien', email: 'j@example.com', status: 'accepted', role: 'editor', avatar: 'jul.png' }
const VIEWER: CollectionMember = { user_id: 4, username: 'ada', email: 'a@example.com', status: 'accepted', role: 'viewer' }
const PENDING: CollectionMember = { user_id: 3, username: 'zoe', email: 'z@example.com', status: 'pending' }

// The store actions are the seam under test — the sheet only orchestrates them.
type CollectionState = ReturnType<typeof useCollectionStore.getState>
const initialCollectionState = useCollectionStore.getState()
let actions: {
  invite: Mock<CollectionState['invite']>
  cancelInvite: Mock<CollectionState['cancelInvite']>
  removeMember: Mock<CollectionState['removeMember']>
  setMemberRole: Mock<CollectionState['setMemberRole']>
  leave: Mock<CollectionState['leave']>
}
type AddToast = NonNullable<Window['__addToast']>
let addToast: Mock<AddToast>

function Harness(props: Omit<Props, 't'>) {
  const { t } = useTranslation()
  return <MCollShareSheet {...props} t={t} />
}

function setup(over: Partial<Props> = {}) {
  const onClose = vi.fn()
  const onAfterLeave = vi.fn()
  const props: Omit<Props, 't'> = {
    open: true,
    collectionId: 7,
    collectionName: 'Tokyo 2026',
    isOwner: true,
    members: [PENDING, EDITOR, OWNER],
    onClose,
    onAfterLeave,
    ...over,
  }
  const view = render(<Harness {...props} />)
  return { ...view, onClose, onAfterLeave, props }
}

describe('MCollShareSheet', () => {
  beforeEach(() => {
    resetAllStores()
    useCollectionStore.setState(initialCollectionState, true)
    actions = {
      invite: vi.fn<CollectionState['invite']>().mockResolvedValue(undefined),
      cancelInvite: vi.fn<CollectionState['cancelInvite']>().mockResolvedValue(undefined),
      removeMember: vi.fn<CollectionState['removeMember']>().mockResolvedValue(undefined),
      setMemberRole: vi.fn<CollectionState['setMemberRole']>().mockResolvedValue(undefined),
      leave: vi.fn<CollectionState['leave']>().mockResolvedValue(undefined),
    }
    useCollectionStore.setState(actions)
    seedStore(useAuthStore, { user: buildUser({ id: 1, username: 'maurice' }) })
    addToast = vi.fn<AddToast>()
    window.__addToast = addToast
    vi.spyOn(collectionsApi, 'availableUsers').mockResolvedValue({ users: [{ id: 9, username: 'nina' }, { id: 10, username: 'omar' }] })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete window.__addToast
  })

  it('FE-MOB-CSHARE-001: names the sheet after the list and counts the roster', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'Share list' })).toBeInTheDocument()
    expect(screen.getByText('Share “Tokyo 2026”')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('FE-MOB-CSHARE-002: sorts owner first, then accepted members, then pending invites', () => {
    setup()
    const names = screen.getAllByText(/^(maurice|julien|zoe)/).map(n => n.textContent)
    expect(names).toEqual(['maurice (you)', 'julien', 'zoe'])
  })

  it('FE-MOB-CSHARE-003: marks the owner, tags the signed-in user and hides a pending email', () => {
    setup()
    expect(screen.getByText('OWNER')).toBeInTheDocument()
    expect(screen.getByText('(you)')).toBeInTheDocument()
    expect(screen.getByText('j@example.com')).toBeInTheDocument()
    expect(screen.getByText('PENDING INVITE')).toBeInTheDocument()
    expect(screen.queryByText('z@example.com')).not.toBeInTheDocument()
  })

  it('FE-MOB-CSHARE-004: renders the uploaded avatar, otherwise the initial', () => {
    setup()
    // The avatar is decorative (alt=""), so it has no accessible role to query by.
    const avatars = document.querySelectorAll('img')
    expect(avatars).toHaveLength(1)
    expect(avatars[0]).toHaveAttribute('src', '/uploads/avatars/jul.png')
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByText('Z')).toBeInTheDocument()
  })

  it('FE-MOB-CSHARE-005: the owner cycles a member role viewer → editor → admin → viewer', async () => {
    const { rerender, props } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Role' }))
    await waitFor(() => expect(actions.setMemberRole).toHaveBeenCalledWith(7, 2, 'admin'))

    rerender(<Harness {...props} members={[OWNER, { ...EDITOR, role: 'admin' }]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Role' }))
    await waitFor(() => expect(actions.setMemberRole).toHaveBeenCalledWith(7, 2, 'viewer'))

    rerender(<Harness {...props} members={[OWNER, VIEWER]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Role' }))
    await waitFor(() => expect(actions.setMemberRole).toHaveBeenCalledWith(7, 4, 'editor'))
  })

  it('FE-MOB-CSHARE-006: without a collection id the role button is inert', () => {
    setup({ collectionId: null })
    fireEvent.click(screen.getByRole('button', { name: 'Role' }))
    expect(actions.setMemberRole).not.toHaveBeenCalled()
  })

  it('FE-MOB-CSHARE-007: the owner removes an accepted member and cancels a pending invite', async () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(actions.removeMember).toHaveBeenCalledWith(7, 2))

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(actions.cancelInvite).toHaveBeenCalledWith(7, 3))
  })

  it('FE-MOB-CSHARE-008: a failing member action surfaces the server message', async () => {
    actions.removeMember.mockRejectedValue({ response: { data: { error: 'Not allowed' } } })
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Not allowed', 'error', undefined))
  })

  it('FE-MOB-CSHARE-009: only one member action runs at a time, and the row spins meanwhile', async () => {
    let resolve!: () => void
    actions.removeMember.mockReturnValue(new Promise<void>(r => { resolve = r }))
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(screen.getByRole('button', { name: 'Role' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(actions.cancelInvite).not.toHaveBeenCalled()

    resolve()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Role' })).not.toBeDisabled())
  })

  it('FE-MOB-CSHARE-010: the owner picks a user and a role, then sends the invite', async () => {
    setup()
    expect(await screen.findByRole('button', { name: 'Send invite' })).toBeDisabled()

    fireEvent.click(screen.getByText('Select a user'))
    fireEvent.click(screen.getByRole('button', { name: 'omar' }))
    expect(screen.queryByRole('button', { name: 'nina' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Admin' }))
    fireEvent.click(screen.getByRole('button', { name: 'Send invite' }))

    await waitFor(() => expect(actions.invite).toHaveBeenCalledWith(7, 10, 'admin'))
    expect(addToast).toHaveBeenCalledWith('Invite sent', 'success', undefined)
    // The picker falls back to its placeholder for the next invite.
    await waitFor(() => expect(screen.getByText('Select a user')).toBeInTheDocument())
  })

  it('FE-MOB-CSHARE-011: editor is the preselected invite role', async () => {
    setup()
    fireEvent.click(await screen.findByText('Select a user'))
    fireEvent.click(screen.getByRole('button', { name: 'nina' }))
    fireEvent.click(screen.getByRole('button', { name: 'Send invite' }))
    await waitFor(() => expect(actions.invite).toHaveBeenCalledWith(7, 9, 'editor'))
  })

  it('FE-MOB-CSHARE-012: a failing invite keeps the selection and reports the error', async () => {
    actions.invite.mockRejectedValue(new Error('boom'))
    setup()
    fireEvent.click(await screen.findByText('Select a user'))
    fireEvent.click(screen.getByRole('button', { name: 'nina' }))
    fireEvent.click(screen.getByRole('button', { name: 'Send invite' }))
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Could not send invite', 'error', undefined))
    expect(screen.getByText('nina')).toBeInTheDocument()
  })

  it('FE-MOB-CSHARE-013: with nobody left to invite the owner is told so', async () => {
    vi.mocked(collectionsApi.availableUsers).mockResolvedValue({ users: [] })
    setup()
    expect(await screen.findByText('No users available to invite.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send invite' })).not.toBeInTheDocument()
  })

  it('FE-MOB-CSHARE-014: a failing lookup degrades to the same empty state', async () => {
    vi.mocked(collectionsApi.availableUsers).mockRejectedValue(new Error('offline'))
    setup()
    expect(await screen.findByText('No users available to invite.')).toBeInTheDocument()
  })

  it('FE-MOB-CSHARE-015: members never see the invite form, only the read-only roster', async () => {
    setup({ isOwner: false })
    expect(screen.getByText('Only the list owner can invite or remove people.')).toBeInTheDocument()
    expect(screen.getByText('EDITOR')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Role' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
    await waitFor(() => expect(collectionsApi.availableUsers).not.toHaveBeenCalled())
  })

  it('FE-MOB-CSHARE-016: leaving asks for confirmation first and can be backed out of', () => {
    setup({ isOwner: false })
    fireEvent.click(screen.getByRole('button', { name: 'Leave list' }))
    expect(screen.getByText('Leave this shared list? You will lose access until you are invited again.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(actions.leave).not.toHaveBeenCalled()
    expect(screen.queryByText('Leave this shared list? You will lose access until you are invited again.')).not.toBeInTheDocument()
  })

  it('FE-MOB-CSHARE-017: a confirmed leave calls the store and hands back to the screen', async () => {
    const { onAfterLeave } = setup({ isOwner: false })
    fireEvent.click(screen.getByRole('button', { name: 'Leave list' }))
    fireEvent.click(screen.getAllByRole('button', { name: /Leave list/ })[0])
    await waitFor(() => expect(actions.leave).toHaveBeenCalledWith(7))
    expect(addToast).toHaveBeenCalledWith('You left the list', 'success', undefined)
    expect(onAfterLeave).toHaveBeenCalled()
  })

  it('FE-MOB-CSHARE-018: a failing leave reports the error and keeps the user in the list', async () => {
    actions.leave.mockRejectedValue({ response: { data: { error: 'Owners cannot leave' } } })
    const { onAfterLeave } = setup({ isOwner: false })
    fireEvent.click(screen.getByRole('button', { name: 'Leave list' }))
    fireEvent.click(screen.getAllByRole('button', { name: /Leave list/ })[0])
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Owners cannot leave', 'error', undefined))
    expect(onAfterLeave).not.toHaveBeenCalled()
  })

  it('FE-MOB-CSHARE-019: without a collection id neither invite nor leave reach the store', async () => {
    setup({ collectionId: null, isOwner: false })
    fireEvent.click(screen.getByRole('button', { name: 'Leave list' }))
    fireEvent.click(screen.getAllByRole('button', { name: /Leave list/ })[0])
    await waitFor(() => expect(actions.leave).not.toHaveBeenCalled())
  })

  it('FE-MOB-CSHARE-020: closing resets the picker and the leave confirmation', async () => {
    const { rerender, props, onClose } = setup()
    fireEvent.click(await screen.findByText('Select a user'))
    fireEvent.click(screen.getByRole('button', { name: 'nina' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()

    rerender(<Harness {...props} open={false} />)
    rerender(<Harness {...props} open />)
    expect(await screen.findByText('Select a user')).toBeInTheDocument()
  })

  it('FE-MOB-CSHARE-021: a closed sheet renders nothing and asks for no users', () => {
    setup({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(collectionsApi.availableUsers).not.toHaveBeenCalled()
  })
})
