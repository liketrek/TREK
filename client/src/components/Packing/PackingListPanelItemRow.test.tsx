// FE-W5ROW-001 to FE-W5ROW-030
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ComponentProps } from 'react'
import { http, HttpResponse } from 'msw'
import { render, screen, fireEvent, waitFor, within } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { buildUser, buildTrip, buildPackingItem } from '../../../tests/helpers/factories'
import { useAuthStore } from '../../store/authStore'
import { useTripStore } from '../../store/tripStore'
import { ArtikelZeile } from './PackingListPanelItemRow'
import type { PackingItem } from '../../types'
import type { TripMember } from './usePackingListPanel'

type Props = ComponentProps<typeof ArtikelZeile>

const toastSpy = vi.fn((_message: string, _type?: string, _duration?: number) => 0)

const MEMBERS = [
  { id: 1, username: 'owner' },
  { id: 2, username: 'alice' },
] as unknown as TripMember[]

const dt = () => ({ effectAllowed: '', dropEffect: '', setData: vi.fn(), getData: vi.fn(() => '') })

function setup(overrides: Partial<Props> = {}) {
  const props: Props = {
    item: buildPackingItem({ id: 1, name: 'Tent', category: 'Gear' }),
    tripId: 1,
    categories: ['Gear', 'Docs'],
    onCategoryChange: () => {},
    onCreateBag: vi.fn(async () => undefined),
    ...overrides,
  }
  const utils = render(<ArtikelZeile {...props} />)
  return { ...utils, props }
}

const row = (container: HTMLElement) => container.querySelector<HTMLElement>('.packing-item-row')!
const openWindow = (name = 'Tent') => {
  fireEvent.click(screen.getByText(name))
  return within(screen.getByRole('dialog'))
}

beforeEach(() => {
  resetAllStores()
  toastSpy.mockClear()
  window.__addToast = toastSpy
  seedStore(useAuthStore, { user: buildUser({ id: 1 }), isAuthenticated: true })
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }) })
})

afterEach(() => {
  delete window.__addToast
  vi.restoreAllMocks()
})

describe('ArtikelZeile — at rest', () => {
  it('FE-W5ROW-001: renders the name and checks the item off', async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.put('/api/trips/1/packing/1', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ item: buildPackingItem({ id: 1, checked: 1 }) })
      }),
    )
    const { container } = setup()

    expect(screen.getByText('Tent')).toBeInTheDocument()
    const box = container.querySelector<HTMLButtonElement>('.packing-check')!
    expect(box).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(box)

    await waitFor(() => expect(body).toMatchObject({ checked: true }))
  })

  it('FE-W5ROW-002: a checked item is struck through', () => {
    setup({ item: buildPackingItem({ id: 1, name: 'Tent', checked: 1 }) })
    expect(screen.getByText('Tent')).toHaveStyle({ textDecoration: 'line-through' })
  })

  it('FE-W5ROW-003: the row holds no inline controls, only what is set', () => {
    const { container } = setup()
    expect(container.querySelectorAll('input')).toHaveLength(0)
    expect(screen.queryByTitle('Delete')).toBeNull()
    expect(screen.queryByText('×1')).toBeNull()
  })

  it('FE-W5ROW-004: an amount from two up reads as ×n', () => {
    setup({ item: buildPackingItem({ id: 1, name: 'Socks', quantity: 5 }) })
    expect(screen.getByText('×5')).toBeInTheDocument()
  })

  it('FE-W5ROW-005: a partly packed item shows the pieces packed instead of the amount', () => {
    const { container } = setup({ item: buildPackingItem({ id: 1, name: 'Socks', quantity: 5, packed_quantity: 2 } as Partial<PackingItem>) })
    expect(screen.getByText('2/5')).toBeInTheDocument()
    expect(screen.queryByText('×5')).toBeNull()
    expect(container.querySelector<HTMLElement>('.packing-check')?.getAttribute('style')).toContain('solid var(--accent)')
  })

  it('FE-W5ROW-006: hovering brings up the chevron, leaving puts it away', () => {
    const { container } = setup()
    const chevron = container.querySelector<SVGElement>('svg.lucide-chevron-right')!
    expect(chevron.style.opacity).toBe('0')
    fireEvent.mouseEnter(row(container))
    expect(chevron.style.opacity).toBe('1')
    expect(row(container).style.background).toBe('var(--bg-secondary)')
    fireEvent.mouseLeave(row(container))
    expect(chevron.style.opacity).toBe('0')
  })

  it('FE-W5ROW-007: the hairline shows only on rows after the first and hides under the pointer', () => {
    const { container } = setup({ divider: true })
    expect(container.querySelector('.bg-edge-faint')).not.toBeNull()
    fireEvent.mouseEnter(row(container))
    expect(container.querySelector('.bg-edge-faint')).toBeNull()
  })
})

describe('ArtikelZeile — badges', () => {
  it('FE-W5ROW-008: an item somebody else takes care of shows their name in the tooltip', async () => {
    setup({
      item: buildPackingItem({ id: 1, name: 'Stove', is_private: 1, owner_id: 2, owner_username: 'Bob' } as Partial<PackingItem>),
      currentUserId: 1,
    })
    const badge = screen.getByLabelText('by Bob')
    fireEvent.mouseEnter(badge)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('by Bob')
  })

  it('FE-W5ROW-009: a nameless owner degrades to an empty name', () => {
    setup({
      item: buildPackingItem({ id: 1, name: 'Stove', is_private: 1, owner_id: 2, owner_username: null } as Partial<PackingItem>),
      currentUserId: 1,
    })
    expect(screen.getByLabelText('by')).toBeInTheDocument()
  })

  it('FE-W5ROW-010: an item shared by me counts its recipients', async () => {
    setup({
      item: buildPackingItem({
        id: 1, name: 'Stove', is_private: 1, owner_id: 1,
        recipients: [{ user_id: 2, username: 'alice' }, { user_id: 3, username: 'bob' }],
      } as unknown as Partial<PackingItem>),
      currentUserId: 1,
    })
    expect(screen.getByLabelText('shared with 2')).toHaveTextContent('2')
    fireEvent.mouseEnter(screen.getByLabelText('shared with 2'))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('shared with 2: alice, bob')
  })

  it('FE-W5ROW-011: a common item shows its bringer and counts the others', async () => {
    setup({
      item: buildPackingItem({
        id: 1, name: 'Stove', is_private: 0, owner_username: 'Bob',
        contributors: [{ user_id: 3, username: 'cleo' }],
      } as unknown as Partial<PackingItem>),
      currentUserId: 1,
    })
    const badge = screen.getByLabelText('brought by Bob, cleo')
    expect(badge).toHaveTextContent('B+1')
    fireEvent.mouseEnter(badge)
    const rows = within(await screen.findByRole('tooltip')).getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Bob')
    expect(rows[1]).toHaveTextContent('cleo')
  })

  it('FE-W5ROW-012: co-bringers alone still show, without an owner', () => {
    setup({
      item: buildPackingItem({ id: 1, name: 'Stove', is_private: 0, owner_id: null, owner_username: null, contributors: [{ user_id: 2, username: 'alice' }] } as unknown as Partial<PackingItem>),
      tripMembers: MEMBERS,
    })
    expect(screen.getByLabelText('brought by alice')).toHaveTextContent(/^a$/i)
  })

  it('FE-W5ROW-013: a private item shows no bringer faces', () => {
    setup({ item: buildPackingItem({ id: 1, name: 'Diary', is_private: 1, owner_id: 1, owner_username: 'owner' } as Partial<PackingItem>), currentUserId: 1 })
    expect(screen.queryByLabelText(/brought by/)).toBeNull()
  })
})

describe('ArtikelZeile — the placeholder of a new list', () => {
  it('FE-W5ROW-014: the placeholder row is typed into right away', () => {
    setup({ item: buildPackingItem({ id: 1, name: '...', category: 'Gear' }) })
    expect(screen.getByPlaceholderText('...')).toHaveValue('')
    expect(screen.queryByRole('button', { name: '...' })).toBeNull()
  })

  it('FE-W5ROW-015: Escape and a blank blur leave the placeholder as it was', async () => {
    let saved = false
    server.use(http.put('/api/trips/1/packing/1', () => { saved = true; return HttpResponse.json({ item: buildPackingItem({ id: 1 }) }) }))
    setup({ item: buildPackingItem({ id: 1, name: '...', category: 'Gear' }) })
    const input = screen.getByPlaceholderText('...')

    fireEvent.change(input, { target: { value: 'Tent' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input).toHaveValue('')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.blur(input)

    await waitFor(() => expect(input).toHaveValue(''))
    expect(saved).toBe(false)
  })

  it('FE-W5ROW-016: Enter on a filled placeholder hands the typing on, a blur does not (#2825)', async () => {
    server.use(http.put('/api/trips/1/packing/1', () => HttpResponse.json({ item: buildPackingItem({ id: 1, name: 'Tent' }) })))
    const onPlaceholderFilled = vi.fn()
    setup({ item: buildPackingItem({ id: 1, name: '...', category: 'Gear' }), onPlaceholderFilled })
    const input = screen.getByPlaceholderText('...')

    fireEvent.change(input, { target: { value: 'Tent' } })
    fireEvent.blur(input)
    await waitFor(() => expect(toastSpy).not.toHaveBeenCalled())
    expect(onPlaceholderFilled).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: 'Tarp' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(onPlaceholderFilled).toHaveBeenCalledTimes(1))
  })

  it('FE-W5ROW-017: a failing placeholder save surfaces a save error', async () => {
    server.use(http.put('/api/trips/1/packing/1', () => new HttpResponse(null, { status: 500 })))
    setup({ item: buildPackingItem({ id: 1, name: '...', category: 'Gear' }) })
    const input = screen.getByPlaceholderText('...')
    fireEvent.change(input, { target: { value: 'Tent' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('Failed to save', 'error', undefined))
  })

  it('FE-W5ROW-018: a read-only placeholder just shows its dots', () => {
    setup({ item: buildPackingItem({ id: 1, name: '...', category: 'Gear' }), canEdit: false })
    expect(screen.queryByPlaceholderText('...')).toBeNull()
    expect(screen.getByText('...')).toBeInTheDocument()
  })
})

describe('ArtikelZeile — the item window', () => {
  it('FE-W5ROW-019: a click on the name opens the window and the row marks itself', () => {
    const { container } = setup()
    const trigger = screen.getByRole('button', { name: /Tent/ })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    const dialog = openWindow()
    expect(dialog.getByDisplayValue('Tent')).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(row(container).style.boxShadow).toBe('inset 0 0 0 1px var(--border-primary)')
  })

  it('FE-W5ROW-020: the close button, the backdrop and Escape all close it', () => {
    setup()
    fireEvent.click(openWindow().getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).toBeNull()

    openWindow()
    fireEvent.click(document.querySelector('[role="presentation"]')!)
    expect(screen.queryByRole('dialog')).toBeNull()

    fireEvent.keyDown(openWindow().getByDisplayValue('Tent'), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('FE-W5ROW-021: Delete in the window goes to the panel handler when there is one', async () => {
    const onDelete = vi.fn(async () => {})
    const { props } = setup({ onDelete })
    fireEvent.click(openWindow().getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(props.item))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('FE-W5ROW-022: a standalone row deletes through the store', async () => {
    let deleted = false
    server.use(http.delete('/api/trips/1/packing/1', () => { deleted = true; return HttpResponse.json({ success: true }) }))
    seedStore(useTripStore, { trip: buildTrip({ id: 1 }), packingItems: [buildPackingItem({ id: 1, name: 'Tent' })] })
    setup()
    fireEvent.click(openWindow().getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(deleted).toBe(true))
  })

  it('FE-W5ROW-023: a failing standalone delete surfaces a delete error', async () => {
    server.use(http.delete('/api/trips/1/packing/1', () => new HttpResponse(null, { status: 500 })))
    seedStore(useTripStore, { trip: buildTrip({ id: 1 }), packingItems: [buildPackingItem({ id: 1, name: 'Tent' })] })
    setup()
    fireEvent.click(openWindow().getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('Failed to delete', 'error', undefined))
  })

  it('FE-W5ROW-024: a read-only window shows the name as text and offers no delete', () => {
    setup({ canEdit: false })
    const dialog = openWindow()
    expect(dialog.queryByRole('textbox')).toBeNull()
    expect(dialog.queryByRole('button', { name: 'Delete' })).toBeNull()
  })
})

describe('ArtikelZeile — drag handle', () => {
  const drag = () => ({
    isDragging: false,
    isOver: false,
    onStart: vi.fn((_id: number) => {}),
    onOver: vi.fn((_id: number) => {}),
    onEnd: vi.fn(() => {}),
    onDrop: vi.fn((_id: number) => {}),
  })

  it('FE-W5ROW-025: starting and ending a drag reports the item id', () => {
    const d = drag()
    const { container } = setup({ drag: d })
    const handle = container.querySelector<HTMLElement>('div[draggable="true"]')!

    fireEvent.dragStart(handle, { dataTransfer: dt() })
    expect(d.onStart).toHaveBeenCalledWith(1)
    fireEvent.dragEnd(handle)
    expect(d.onEnd).toHaveBeenCalled()
  })

  it('FE-W5ROW-026: dragging over the row marks it, dropping reports the target', () => {
    const d = drag()
    const { container } = setup({ drag: d })

    fireEvent.dragOver(row(container), { dataTransfer: dt() })
    expect(d.onOver).toHaveBeenCalledWith(1)
    fireEvent.drop(row(container), { dataTransfer: dt() })
    expect(d.onDrop).toHaveBeenCalledWith(1)
  })

  it('FE-W5ROW-027: leaving the row clears the drop target, but moving inside it does not', () => {
    const d = drag()
    const { container } = setup({ drag: d })
    const leave = (relatedTarget: Node) => fireEvent(row(container), new MouseEvent('dragleave', { bubbles: true, relatedTarget }))

    leave(document.body)
    expect(d.onOver).toHaveBeenCalledWith(-1)
    d.onOver.mockClear()
    leave(screen.getByText('Tent'))
    expect(d.onOver).not.toHaveBeenCalled()
  })

  it('FE-W5ROW-028: the dragged row fades and the hovered row shows an edge', () => {
    const { container } = setup({ drag: { ...drag(), isDragging: true, isOver: true } })
    expect(row(container).style.opacity).toBe('0.4')
    expect(row(container).style.boxShadow).toBe('inset 3px 0 0 0 var(--accent)')
  })

  it('FE-W5ROW-029: the grip only shows under the pointer', () => {
    const { container } = setup({ drag: drag() })
    const handle = container.querySelector<HTMLElement>('div[draggable="true"]')!
    expect(handle.style.opacity).toBe('0')
    fireEvent.mouseEnter(row(container))
    expect(handle.style.opacity).toBe('1')
  })

  it('FE-W5ROW-030: a placeholder or read-only row is not draggable, a sorted row keeps the grip column', () => {
    const { container, unmount } = setup({ item: buildPackingItem({ id: 1, name: '...' }), drag: drag() })
    expect(container.querySelector('div[draggable="true"]')).toBeNull()
    unmount()
    const sorted = setup()
    expect(sorted.container.querySelector('div[draggable="true"]')).toBeNull()
    expect(sorted.container.querySelector('span[aria-hidden][style*="width: 13px"]')).not.toBeNull()
  })
})
