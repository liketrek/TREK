// FE-MOB-COLDRAW-001 to FE-MOB-COLDRAW-008
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import type { Collection } from '@trek/shared'
import { render, screen, fireEvent } from '../../../helpers/render'
import MCollListsDrawer from '../../../../src/mobile/screens/collections/MCollListsDrawer'
import { ALL_SAVED } from '../../../../src/store/collectionStore'
import type { IncomingCollectionInvite } from '../../../../src/store/collectionStore'

const t = (key: string) => key

function buildList(over: Partial<Collection> = {}): Collection {
  return { id: 1, owner_id: 1, name: 'Hamburg', color: '#38BDF8', place_count: 4, is_owner: true, ...over }
}

const invite: IncomingCollectionInvite = {
  collection_id: 42,
  name: 'Roadtrip 2027',
  from: { id: 9, username: 'julien' },
}

type Props = React.ComponentProps<typeof MCollListsDrawer>

function renderDrawer(overrides: Partial<Props> = {}) {
  const props: Props = {
    open: true,
    onClose: vi.fn(),
    ownedLists: [buildList()],
    sharedLists: [],
    activeId: ALL_SAVED,
    incomingInvites: [],
    onSelect: vi.fn(),
    onNewList: vi.fn(),
    onAcceptInvite: vi.fn(),
    onDeclineInvite: vi.fn(),
    t,
    ...overrides,
  }
  render(<MCollListsDrawer {...props} />)
  return props
}

describe('MCollListsDrawer', () => {
  it('FE-MOB-COLDRAW-001: renders nothing while closed', () => {
    renderDrawer({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-COLDRAW-002: lists the owned lists with their place counts above the union entry', () => {
    renderDrawer({
      ownedLists: [buildList(), buildList({ id: 2, name: 'Kopenhagen', place_count: undefined })],
    })

    expect(screen.getByRole('dialog', { name: 'collections.title' })).toBeInTheDocument()
    expect(screen.getByText('Hamburg')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    // A list the server did not count yet falls back to 0.
    expect(screen.getByText('Kopenhagen')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('FE-MOB-COLDRAW-003: selecting the union and a list reports the right id', () => {
    const props = renderDrawer()

    fireEvent.click(screen.getByRole('button', { name: /collections.allSaved/ }))
    expect(props.onSelect).toHaveBeenCalledWith(ALL_SAVED)

    fireEvent.click(screen.getByText('Hamburg'))
    expect(props.onSelect).toHaveBeenCalledWith(1)
  })

  it('FE-MOB-COLDRAW-004: the new-list and close buttons call their handlers', () => {
    const props = renderDrawer()

    fireEvent.click(screen.getByRole('button', { name: /collections.newList/ }))
    expect(props.onNewList).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'common.close' }))
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-COLDRAW-005: the active list is highlighted, the union entry is not', () => {
    renderDrawer({ activeId: 1 })

    const row = screen.getByText('Hamburg').closest('button') as HTMLElement
    expect(row.className).toContain('bg-[color:var(--m-ic)]')
    expect(row.style.boxShadow).toContain('inset 0 0 0 1.5px')

    const union = screen.getByRole('button', { name: /collections.allSaved/ })
    expect(union.className).not.toContain('bg-[color:var(--m-ic)]')
  })

  it('FE-MOB-COLDRAW-006: shared lists get their own section, absent when there are none', () => {
    renderDrawer()
    expect(screen.queryByText('collections.shared')).not.toBeInTheDocument()

    renderDrawer({ sharedLists: [buildList({ id: 7, name: 'Julien Tipps', color: null, is_owner: false })] })
    expect(screen.getByText('collections.shared')).toBeInTheDocument()
    expect(screen.getByText('Julien Tipps')).toBeInTheDocument()
  })

  it('FE-MOB-COLDRAW-007: pending invites show the inviter and accept/decline by collection id', () => {
    const props = renderDrawer({ incomingInvites: [invite] })

    expect(screen.getByText('collections.invites.title')).toBeInTheDocument()
    expect(screen.getByText('Roadtrip 2027')).toBeInTheDocument()
    expect(screen.getByText(/julien/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'collections.invites.accept' }))
    expect(props.onAcceptInvite).toHaveBeenCalledWith(42)

    fireEvent.click(screen.getByRole('button', { name: 'collections.invites.decline' }))
    expect(props.onDeclineInvite).toHaveBeenCalledWith(42)
  })

  it('FE-MOB-COLDRAW-008: a list without a colour falls back to the default swatch', () => {
    renderDrawer({ ownedLists: [buildList({ color: null })] })

    const dot = screen.getByText('Hamburg').previousElementSibling as HTMLElement
    expect(dot).toHaveStyle({ background: '#6366F1' })
  })
})
