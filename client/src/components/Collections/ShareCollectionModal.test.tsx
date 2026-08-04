// FE-COMP-COLSHARE-001 to FE-COMP-COLSHARE-025
import React from 'react'
import type { Mock } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '../../../tests/helpers/render'
import type { CollectionMember } from '@trek/shared'
import { collectionsApi } from '../../api/collections'
import { useCollectionStore } from '../../store/collectionStore'
import { useAuthStore } from '../../store/authStore'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { buildUser } from '../../../tests/helpers/factories'
import { useTranslation } from '../../i18n/TranslationContext'
import ShareCollectionModal from './ShareCollectionModal'

type Props = React.ComponentProps<typeof ShareCollectionModal>
function Harness(props: Omit<Props, 't'>): React.ReactElement {
  const { t } = useTranslation()
  return <ShareCollectionModal {...props} t={t} />
}

const OWNER: CollectionMember = { user_id: 1, username: 'maurice', email: 'm@example.com', status: 'accepted', is_owner: true }
const EDITOR: CollectionMember = { user_id: 2, username: 'julien', email: 'j@example.com', status: 'accepted', role: 'editor', avatar: 'jul.png' }
const VIEWER: CollectionMember = { user_id: 4, username: 'ada', email: 'a@example.com', status: 'accepted', role: 'viewer' }
const PENDING: CollectionMember = { user_id: 3, username: 'zoe', email: 'z@example.com', status: 'pending' }

type CollectionStore = ReturnType<typeof useCollectionStore.getState>
type AddToast = NonNullable<typeof window.__addToast>

const initialCollectionState = useCollectionStore.getState()
let actions: {
  invite: Mock<CollectionStore['invite']>
  cancelInvite: Mock<CollectionStore['cancelInvite']>
  removeMember: Mock<CollectionStore['removeMember']>
  setMemberRole: Mock<CollectionStore['setMemberRole']>
  leave: Mock<CollectionStore['leave']>
}
let addToast: Mock<AddToast>

function setup(over: Partial<Omit<Props, 't'>> = {}) {
  const props: Omit<Props, 't'> = {
    isOpen: true,
    collectionId: 7,
    collectionName: 'Tokyo 2026',
    isOwner: true,
    members: [PENDING, EDITOR, OWNER],
    onClose: vi.fn(),
    onAfterLeave: vi.fn(),
    ...over,
  }
  const view = render(<Harness {...props} />)
  return { ...view, props }
}

/** The roster row for a member — the invite form carries the same role labels,
 *  so role assertions have to be scoped to the row they belong to. */
function memberRow(username: string): HTMLElement {
  const nameCell = screen.getByText(username).parentElement as HTMLElement
  return nameCell.parentElement as HTMLElement
}

describe('ShareCollectionModal', () => {
  beforeEach(() => {
    resetAllStores()
    useCollectionStore.setState(initialCollectionState, true)
    actions = {
      invite: vi.fn<CollectionStore['invite']>(async () => undefined),
      cancelInvite: vi.fn<CollectionStore['cancelInvite']>(async () => undefined),
      removeMember: vi.fn<CollectionStore['removeMember']>(async () => undefined),
      setMemberRole: vi.fn<CollectionStore['setMemberRole']>(async () => undefined),
      leave: vi.fn<CollectionStore['leave']>(async () => undefined),
    }
    useCollectionStore.setState(actions)
    seedStore(useAuthStore, { user: buildUser({ id: 1, username: 'maurice' }) })
    addToast = vi.fn<AddToast>(() => 0)
    window.__addToast = addToast
    vi.spyOn(collectionsApi, 'availableUsers').mockResolvedValue({
      users: [{ id: 9, username: 'nina' }, { id: 10, username: 'omar' }],
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete window.__addToast
  })

  it('FE-COMP-COLSHARE-001: a closed modal renders nothing and asks for no invitable users', () => {
    setup({ isOpen: false })
    expect(screen.queryByRole('heading', { name: /Share/ })).not.toBeInTheDocument()
    expect(collectionsApi.availableUsers).not.toHaveBeenCalled()
  })

  it('FE-COMP-COLSHARE-002: the title names the list and the roster is counted', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Share “Tokyo 2026”' })).toBeInTheDocument()
    expect(screen.getByText('Members')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('FE-COMP-COLSHARE-003: sorts owner first, then accepted members, then pending invites', () => {
    setup({ members: [PENDING, VIEWER, EDITOR, OWNER] })
    const names = screen.getAllByText(/^(maurice|julien|ada|zoe)/).map(n => n.textContent)
    expect(names).toEqual(['maurice(you)', 'ada', 'julien', 'zoe'])
  })

  it('FE-COMP-COLSHARE-004: tags the owner, marks the signed-in user and hides a pending email', () => {
    setup()
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('(you)')).toBeInTheDocument()
    expect(screen.getByText('j@example.com')).toBeInTheDocument()
    expect(screen.getByText('pending invite')).toBeInTheDocument()
    expect(screen.queryByText('z@example.com')).not.toBeInTheDocument()
  })

  it('FE-COMP-COLSHARE-005: renders an uploaded avatar, otherwise the username initial', () => {
    setup()
    const avatars = document.querySelectorAll('img')
    expect(avatars).toHaveLength(1)
    expect(avatars[0]).toHaveAttribute('src', '/uploads/avatars/jul.png')
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByText('Z')).toBeInTheDocument()
  })

  it('FE-COMP-COLSHARE-006: a member without a username still gets a placeholder initial', () => {
    setup({ members: [OWNER, { ...EDITOR, username: '', avatar: undefined }] })
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('FE-COMP-COLSHARE-007: the owner changes a member role through the role select', async () => {
    setup({ members: [OWNER, EDITOR] })
    // The select shows the member's current role; open it and pick another.
    fireEvent.click(within(memberRow('julien')).getByRole('button', { name: 'Editor' }))
    fireEvent.click(screen.getByRole('button', { name: 'Admin' }))
    await waitFor(() => expect(actions.setMemberRole).toHaveBeenCalledWith(7, 2, 'admin'))
  })

  it('FE-COMP-COLSHARE-008: a member with no explicit role defaults to editor in the select', () => {
    setup({ members: [OWNER, { ...EDITOR, role: undefined }] })
    expect(within(memberRow('julien')).getByRole('button', { name: 'Editor' })).toBeInTheDocument()
  })

  it('FE-COMP-COLSHARE-009: a failing role change surfaces the server message', async () => {
    actions.setMemberRole.mockRejectedValue({ response: { data: { error: 'Not allowed' } } })
    setup({ members: [OWNER, EDITOR] })
    fireEvent.click(within(memberRow('julien')).getByRole('button', { name: 'Editor' }))
    fireEvent.click(screen.getByRole('button', { name: 'Viewer' }))
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Not allowed', 'error', undefined))
  })

  it('FE-COMP-COLSHARE-010: the owner removes an accepted member and cancels a pending invite', async () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(actions.removeMember).toHaveBeenCalledWith(7, 2))

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(actions.cancelInvite).toHaveBeenCalledWith(7, 3))
  })

  it('FE-COMP-COLSHARE-011: a second remove is ignored while the first is still running', async () => {
    let release!: () => void
    actions.removeMember.mockReturnValue(new Promise<void>(r => { release = r }))
    setup({ members: [OWNER, EDITOR, VIEWER] })
    const [first, second] = screen.getAllByRole('button', { name: 'Remove' })
    fireEvent.click(first)
    fireEvent.click(second)
    expect(actions.removeMember).toHaveBeenCalledTimes(1)
    expect(first).toBeDisabled()

    release()
    await waitFor(() => expect(first).not.toBeDisabled())
  })

  it('FE-COMP-COLSHARE-012: a failing cancel reports the fallback error', async () => {
    actions.cancelInvite.mockRejectedValue({})
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Error', 'error', undefined))
  })

  it('FE-COMP-COLSHARE-013: a failing remove reports the fallback error', async () => {
    actions.removeMember.mockRejectedValue({})
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Error', 'error', undefined))
  })

  it('FE-COMP-COLSHARE-014: the owner picks a user and role, then sends the invite', async () => {
    setup({ members: [OWNER] })
    expect(await screen.findByRole('button', { name: /Send invite/ })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Select a user' }))
    fireEvent.click(screen.getByRole('button', { name: 'omar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Editor' }))
    fireEvent.click(screen.getByRole('button', { name: 'Admin' }))
    fireEvent.click(screen.getByRole('button', { name: /Send invite/ }))

    await waitFor(() => expect(actions.invite).toHaveBeenCalledWith(7, 10, 'admin'))
    expect(addToast).toHaveBeenCalledWith('Invite sent', 'success', undefined)
    // The picker falls back to its placeholder for the next invite.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Select a user' })).toBeInTheDocument())
  })

  it('FE-COMP-COLSHARE-015: editor is the preselected invite role', async () => {
    setup({ members: [OWNER] })
    fireEvent.click(await screen.findByRole('button', { name: 'Select a user' }))
    fireEvent.click(screen.getByRole('button', { name: 'nina' }))
    fireEvent.click(screen.getByRole('button', { name: /Send invite/ }))
    await waitFor(() => expect(actions.invite).toHaveBeenCalledWith(7, 9, 'editor'))
  })

  it('FE-COMP-COLSHARE-016: a failing invite keeps the selection and reports the error', async () => {
    actions.invite.mockRejectedValue(new Error('boom'))
    setup({ members: [OWNER] })
    fireEvent.click(await screen.findByRole('button', { name: 'Select a user' }))
    fireEvent.click(screen.getByRole('button', { name: 'nina' }))
    fireEvent.click(screen.getByRole('button', { name: /Send invite/ }))
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Could not send invite', 'error', undefined))
    expect(screen.getByRole('button', { name: 'nina' })).toBeInTheDocument()
  })

  it('FE-COMP-COLSHARE-017: with nobody left to invite the owner is told so', async () => {
    vi.mocked(collectionsApi.availableUsers).mockResolvedValue({ users: [] })
    setup()
    expect(await screen.findByText('No users available to invite.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Send invite/ })).not.toBeInTheDocument()
  })

  it('FE-COMP-COLSHARE-018: a failing lookup degrades to the same empty state', async () => {
    vi.mocked(collectionsApi.availableUsers).mockRejectedValue(new Error('offline'))
    setup()
    expect(await screen.findByText('No users available to invite.')).toBeInTheDocument()
  })

  it('FE-COMP-COLSHARE-019: members see a read-only roster, no invite form and no row actions', async () => {
    setup({ isOwner: false, members: [OWNER, EDITOR, VIEWER] })
    expect(screen.getByText('Only the list owner can invite or remove people.')).toBeInTheDocument()
    expect(screen.getByText('Editor')).toBeInTheDocument()
    expect(screen.getByText('Viewer')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Send invite/ })).not.toBeInTheDocument()
    await waitFor(() => expect(collectionsApi.availableUsers).not.toHaveBeenCalled())
  })

  it('FE-COMP-COLSHARE-020: a member without a role reads as editor in the read-only badge', () => {
    setup({ isOwner: false, members: [OWNER, { ...EDITOR, role: undefined }] })
    expect(screen.getByText('Editor')).toBeInTheDocument()
  })

  it('FE-COMP-COLSHARE-021: leaving asks for confirmation first and can be backed out of', () => {
    setup({ isOwner: false })
    fireEvent.click(screen.getByRole('button', { name: 'Leave list' }))
    expect(screen.getByText('Leave this shared list? You will lose access until you are invited again.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(actions.leave).not.toHaveBeenCalled()
    expect(screen.queryByText('Leave this shared list? You will lose access until you are invited again.')).not.toBeInTheDocument()
  })

  it('FE-COMP-COLSHARE-022: a confirmed leave calls the store and hands back to the page', async () => {
    const { props } = setup({ isOwner: false })
    fireEvent.click(screen.getByRole('button', { name: 'Leave list' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Leave list' })[0])
    await waitFor(() => expect(actions.leave).toHaveBeenCalledWith(7))
    expect(addToast).toHaveBeenCalledWith('You left the list', 'success', undefined)
    expect(props.onAfterLeave).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-COLSHARE-023: a failing leave reports the error and keeps the user in the list', async () => {
    actions.leave.mockRejectedValue({ response: { data: { error: 'Owners cannot leave' } } })
    const { props } = setup({ isOwner: false })
    fireEvent.click(screen.getByRole('button', { name: 'Leave list' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Leave list' })[0])
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Owners cannot leave', 'error', undefined))
    expect(props.onAfterLeave).not.toHaveBeenCalled()
  })

  it('FE-COMP-COLSHARE-024: closing resets the picker and the leave confirmation', async () => {
    const { rerender, props } = setup({ isOwner: false })
    fireEvent.click(screen.getByRole('button', { name: 'Leave list' }))
    expect(screen.getByText('Leave this shared list? You will lose access until you are invited again.')).toBeInTheDocument()

    rerender(<Harness {...props} isOwner={false} isOpen={false} />)
    rerender(<Harness {...props} isOwner={false} isOpen />)
    await waitFor(() =>
      expect(screen.queryByText('Leave this shared list? You will lose access until you are invited again.')).not.toBeInTheDocument(),
    )
  })

  it('FE-COMP-COLSHARE-025: the modal close button calls onClose', () => {
    const { props } = setup()
    // The Modal chrome's only unnamed control is its close button.
    const header = screen.getByRole('heading', { name: 'Share “Tokyo 2026”' }).parentElement as HTMLElement
    fireEvent.click(header.querySelector('button') as HTMLButtonElement)
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })
})
